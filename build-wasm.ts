// Builds maze.c -> maze.wasm using `zig cc` (a drop-in clang-compatible C
// compiler). Zig ships as a single self-contained download with a built-in
// wasm32 target, which makes it easy to provision in CI (e.g. Vercel) without
// a system clang/LLVM toolchain. If zig isn't already available it is
// downloaded into a local cache and reused.

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ZIG_VERSION = "0.16.0";
const CACHE_DIR = join(import.meta.dir, ".zig");

const ARCH: Record<string, string> = { x64: "x86_64", arm64: "aarch64" };
const OS: Record<string, string> = {
  linux: "linux",
  darwin: "macos",
  win32: "windows",
};

const arch = ARCH[process.arch];
const os = OS[process.platform];
if (!arch || !os) {
  throw new Error(`unsupported platform: ${process.platform}/${process.arch}`);
}
const platformKey = `${arch}-${os}`;
const zigExe = process.platform === "win32" ? "zig.exe" : "zig";

function extract(archivePath: string) {
  // Windows zig ships as .zip; everything else as .tar.xz.
  if (process.platform === "win32") {
    const pwsh =
      Bun.which("pwsh") ??
      Bun.which("powershell") ??
      `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
    const res = Bun.spawnSync(
      [
        pwsh,
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${CACHE_DIR}' -Force`,
      ],
      { stderr: "inherit" },
    );
    if (res.exitCode !== 0) throw new Error("failed to extract zig archive");
    return;
  }

  // tar with xz support is standard on Linux/macOS (including Vercel's image)
  const res = Bun.spawnSync(["tar", "-xf", archivePath, "-C", CACHE_DIR], {
    stderr: "inherit",
  });
  if (res.exitCode !== 0) throw new Error("failed to extract zig archive");
}

async function downloadZig(): Promise<string> {
  console.log(`zig ${ZIG_VERSION} not found, downloading...`);

  const index = (await (
    await fetch("https://ziglang.org/download/index.json")
  ).json()) as Record<
    string,
    Record<string, { tarball: string; shasum: string }>
  >;
  const entry = index[ZIG_VERSION]?.[platformKey];
  if (!entry) {
    throw new Error(`no zig ${ZIG_VERSION} build for ${platformKey}`);
  }

  const archiveName = entry.tarball.split("/").pop()!;
  const dirName = archiveName.replace(/\.(tar\.xz|zip)$/, "");
  const archivePath = join(CACHE_DIR, archiveName);

  await mkdir(CACHE_DIR, { recursive: true });

  const buf = Buffer.from(await (await fetch(entry.tarball)).arrayBuffer());
  const shasum = createHash("sha256").update(buf).digest("hex");
  if (shasum !== entry.shasum) {
    throw new Error(
      `zig download checksum mismatch:\n  expected ${entry.shasum}\n  got      ${shasum}`,
    );
  }
  await Bun.write(archivePath, buf);
  extract(archivePath);

  return join(CACHE_DIR, dirName, zigExe);
}

async function ensureZig(): Promise<string> {
  // 1. reuse a previously downloaded pinned version
  const cached = join(CACHE_DIR, `zig-${platformKey}-${ZIG_VERSION}`, zigExe);
  if (existsSync(cached)) return cached;

  // 2. use a system zig if one is on PATH
  const onPath = Bun.which("zig");
  if (onPath) return onPath;

  // 3. otherwise download the pinned version
  return downloadZig();
}

const zig = await ensureZig();
console.log(`using ${zig}`);

const proc = Bun.spawnSync([
  zig,
  "cc",
  "-target",
  "wasm32-freestanding",
  "-std=c99",
  "-Wall",
  "-Wextra",
  "-Wpedantic",
  "-Wshadow",
  "-Wconversion",
  "-Wdouble-promotion",
  "-Wformat=2",
  "-Wnull-dereference",
  "-Wstrict-prototypes",
  "-flto",
  "-O3",
  "-nostdlib",
  "-fvisibility=hidden", // hide all symbols by default...
  "-Wl,--no-entry",
  "-rdynamic", // ...then export the ones marked EXPORT (visibility default)
  "-Wl,--strip-debug",
  "-Wl,-z,stack-size=8388608", // # Set maximum stack size to 8MiB
  "-o",
  "maze.wasm",
  "maze.c",
]);

const stderr = new TextDecoder().decode(proc.stderr);
if (stderr) console.error(stderr);
if (proc.exitCode !== 0) process.exit(proc.exitCode);
console.log("maze.wasm built successfully");

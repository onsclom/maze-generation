const proc = Bun.spawnSync([
  "clang",
  "--target=wasm32",
  "-flto",
  "-O3",
  "-nostdlib",
  "-Wl,--no-entry",
  "-Wl,--export-all",
  "-Wl,--lto-O3",
  "-Wl,-z,stack-size=8388608", // # Set maximum stack size to 8MiB
  "-o maze.wasm",
  "maze.c",
]);

if (proc.exitCode !== 0) {
  console.error(new TextDecoder().decode(proc.stderr));
  process.exit(proc.exitCode);
}
console.log("maze.wasm built successfully");

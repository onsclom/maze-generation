const proc = Bun.spawnSync([
  "clang",
  "--target=wasm32",
  "-flto",
  "-O3",
  "-nostdlib",
  "-Wl,--no-entry",
  "-Wl,--export-all",
  "-Wl,--lto-O3",
  "-o",
  "maze.wasm",
  "maze.c",
]);

if (proc.exitCode !== 0) {
  console.error(new TextDecoder().decode(proc.stderr));
  process.exit(proc.exitCode);
}
console.log("maze.wasm built successfully");

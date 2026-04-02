const proc = Bun.spawnSync([
  "clang",
  "--target=wasm32",
  "-O2",
  "-nostdlib",
  "-Wl,--no-entry",
  "-Wl,--export=seedRng",
  "-Wl,--export=generateMaze",
  "-Wl,--export=getMazeSize",
  "-Wl,--export=getMazeWalls",
  "-Wl,--export=getMazeTopBots",
  "-o",
  "maze.wasm",
  "maze.c",
]);

if (proc.exitCode !== 0) {
  console.error(new TextDecoder().decode(proc.stderr));
  process.exit(proc.exitCode);
}
console.log("maze.wasm built successfully");

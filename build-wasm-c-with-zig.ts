const proc = Bun.spawnSync([
  "zig",
  "cc",
  "--target=wasm32-freestanding",
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
  "-Wl,--no-entry",
  "-Wl,--export=seedRng",
  "-Wl,--export=generateMaze",
  "-Wl,--export=getMazeSize",
  "-Wl,--export=getMazeWalls",
  "-Wl,--export=getMazeTopBots",
  "-Wl,--strip-debug",
  "-Wl,-z,stack-size=8388608", // 8MiB stack
  "-rdynamic",
  "-o",
  "maze.wasm",
  "maze.c",
]);

const stderr = new TextDecoder().decode(proc.stderr);
if (stderr) console.error(stderr);
if (proc.exitCode !== 0) process.exit(proc.exitCode);
console.log("maze.wasm built successfully (C via zig cc)");

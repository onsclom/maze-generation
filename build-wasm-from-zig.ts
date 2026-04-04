const proc = Bun.spawnSync([
  "zig",
  "build-exe",
  "-target",
  "wasm32-freestanding",
  "-O",
  "ReleaseSmall",
  "-fstrip",
  "--export-memory",
  "-fno-entry",
  "--stack",
  "8388608", // 8MiB stack
  "-rdynamic", // keep exported functions
  "maze.zig",
]);

const stderr = new TextDecoder().decode(proc.stderr);
if (stderr) console.error(stderr);
if (proc.exitCode !== 0) process.exit(proc.exitCode);
console.log("maze.wasm built successfully from zig");

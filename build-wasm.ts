function hasCommand(name: string): boolean {
  const check = Bun.spawnSync(["which", name]);
  return check.exitCode === 0;
}

function run(cmd: string[], errorMsg: string) {
  const result = Bun.spawnSync(cmd);
  if (result.exitCode !== 0) {
    console.error(errorMsg);
    console.error(new TextDecoder().decode(result.stderr));
    process.exit(result.exitCode);
  }
}

if (!hasCommand("clang")) {
  console.log("clang not found, installing...");
  if (hasCommand("yum")) {
    run(["yum", "install", "-y", "clang", "lld"], "Failed to install clang via yum");
  } else if (hasCommand("apt-get")) {
    run(["apt-get", "update"], "Failed to update apt");
    run(["apt-get", "install", "-y", "clang", "lld"], "Failed to install clang via apt-get");
  } else {
    console.error("clang is not installed and no supported package manager found (yum/apt-get)");
    process.exit(1);
  }
  console.log("clang installed successfully");
}

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

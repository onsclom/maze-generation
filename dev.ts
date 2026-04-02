import { watch } from "fs";

function buildWasm() {
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
  } else {
    console.log("maze.wasm rebuilt");
  }
}

buildWasm();
watch("maze.c", () => buildWasm());

Bun.spawn(["bun", "index.html"], {
  stdout: "inherit",
  stderr: "inherit",
});

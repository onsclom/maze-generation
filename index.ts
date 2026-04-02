import wasmUrl from "./maze.wasm" with { type: "file" };
import { generateMaze as generateMazeJS, type Maze } from "./maze.ts";

const response = await fetch(wasmUrl);
const bytes = await response.arrayBuffer();
const wasm = await WebAssembly.instantiate(bytes);

const wasmExports = wasm.instance.exports as {
  memory: WebAssembly.Memory;
  seedRng(seed: number): void;
  generateMaze(size: number): void;
  getMazeSize(): number;
  getMazeWalls(): number;
  getMazeTopBots(): number;
};

const WALL = "#";
const PATH = " ";

function printWasmMaze(): string {
  const size = wasmExports.getMazeSize();
  const wallsPtr = wasmExports.getMazeWalls();
  const topBotsPtr = wasmExports.getMazeTopBots();
  const heap = new Uint8Array(wasmExports.memory.buffer);

  let out = "";
  for (let y = 0; y <= size * 2; y++) {
    for (let x = 0; x <= size * 2; x++) {
      const halfY = Math.floor(y / 2);
      const halfX = Math.floor(x / 2);
      if (x % 2 === 0 && y % 2 === 0) out += WALL;
      else if (y % 2 === 0) {
        const idx = topBotsPtr + halfY * size + halfX;
        out += heap[idx] ? PATH : WALL;
      } else if (x % 2 === 0) {
        const idx = wallsPtr + halfY * (size + 1) + halfX;
        out += heap[idx] ? PATH : WALL;
      } else {
        out += PATH;
      }
    }
    out += "\n";
  }
  return out;
}

function printJSMaze(maze: Maze): string {
  let out = "";
  for (let y = 0; y <= maze.size * 2; y++) {
    for (let x = 0; x <= maze.size * 2; x++) {
      const halfY = Math.floor(y / 2);
      const halfX = Math.floor(x / 2);
      if (x % 2 === 0 && y % 2 === 0) out += WALL;
      else if (y % 2 === 0) {
        out += maze.topBots[halfY * maze.size + halfX] ? PATH : WALL;
      } else if (x % 2 === 0) {
        out += maze.walls[halfY * (maze.size + 1) + halfX] ? PATH : WALL;
      } else {
        out += PATH;
      }
    }
    out += "\n";
  }
  return out;
}

const sizeInput = document.getElementById("size") as HTMLInputElement;
const wasmBtn = document.getElementById("generate-wasm") as HTMLButtonElement;
const jsBtn = document.getElementById("generate-js") as HTMLButtonElement;
const mazeEl = document.getElementById("maze") as HTMLPreElement;
const timeEl = document.getElementById("time") as HTMLSpanElement;

function getSize(): number {
  const size = Math.max(1, Math.min(1000, parseInt(sizeInput.value) || 10));
  sizeInput.value = String(size);
  return size;
}

wasmBtn.addEventListener("click", () => {
  const size = getSize();
  wasmExports.seedRng(Date.now());
  const start = performance.now();
  wasmExports.generateMaze(size);
  const ms = performance.now() - start;
  mazeEl.textContent = printWasmMaze();
  timeEl.textContent = `WASM: ${ms.toFixed(2)}ms`;
});

jsBtn.addEventListener("click", () => {
  const size = getSize();
  const start = performance.now();
  const maze = generateMazeJS(size);
  const ms = performance.now() - start;
  mazeEl.textContent = printJSMaze(maze);
  timeEl.textContent = `JS: ${ms.toFixed(2)}ms`;
});

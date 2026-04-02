import wasmUrl from "./maze.wasm" with { type: "file" };
import { generateMaze as generateMazeJS, type Maze } from "./maze.ts";

const wasm = await WebAssembly.instantiateStreaming(fetch(wasmUrl));

const wasmExports = wasm.instance.exports as {
  memory: WebAssembly.Memory;
  seedRng(seed: number): void;
  generateMaze(size: number): void;
  getMazeSize(): number;
  getMazeWalls(): number;
  getMazeTopBots(): number;
};

const buttonsEl = document.getElementById("buttons")!;
const logEl = document.getElementById("log")!;
const canvas = document.getElementById("maze") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const CELL_PX = 8;

function setupCanvas(size: number) {
  const dpr = window.devicePixelRatio || 1;
  const cssSize = size * CELL_PX;
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const BATCH_SIZE = 10000; // very large mazes override the builtin limit

function flushPath() {
  ctx.stroke();
  ctx.beginPath();
}

function drawWasmMaze() {
  const size = wasmExports.getMazeSize();
  const wallsPtr = wasmExports.getMazeWalls();
  const topBotsPtr = wasmExports.getMazeTopBots();
  const mem = new Uint8Array(wasmExports.memory.buffer);

  setupCanvas(size);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();

  ctx.moveTo(0, 0);
  ctx.lineTo(size * CELL_PX, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * CELL_PX);

  let count = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x <= size; x++) {
      const idx = wallsPtr + y * (size + 1) + x;
      if (!mem[idx]) {
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + CELL_PX);
        if (++count % BATCH_SIZE === 0) flushPath();
      }
    }
  }

  for (let y = 0; y <= size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = topBotsPtr + y * size + x;
      if (!mem[idx]) {
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        ctx.moveTo(px, py);
        ctx.lineTo(px + CELL_PX, py);
        if (++count % BATCH_SIZE === 0) flushPath();
      }
    }
  }

  ctx.stroke();
}

function drawJSMaze(maze: Maze) {
  setupCanvas(maze.size);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();

  ctx.moveTo(0, 0);
  ctx.lineTo(maze.size * CELL_PX, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, maze.size * CELL_PX);

  let count = 0;
  for (let y = 0; y < maze.size; y++) {
    for (let x = 0; x <= maze.size; x++) {
      if (!maze.walls[y * (maze.size + 1) + x]) {
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + CELL_PX);
        if (++count % BATCH_SIZE === 0) flushPath();
      }
    }
  }

  for (let y = 0; y <= maze.size; y++) {
    for (let x = 0; x < maze.size; x++) {
      if (!maze.topBots[y * maze.size + x]) {
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        ctx.moveTo(px, py);
        ctx.lineTo(px + CELL_PX, py);
        if (++count % BATCH_SIZE === 0) flushPath();
      }
    }
  }

  ctx.stroke();
}

const sizes = [10, 100, 500, 1000];

function log(size: number, genMs: number, drawMs: number, engine: string) {
  const line = document.createElement("div");
  line.innerHTML = `<b>${engine}</b> generated size <b>${size}</b> in <b>${genMs.toFixed(1)}ms</b> · canvas rendered in <b>${drawMs.toFixed(1)}ms</b>`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

for (const size of sizes) {
  for (const engine of ["WASM", "JS"] as const) {
    const btn = document.createElement("button");
    btn.textContent = `${size} (${engine})`;
    btn.addEventListener("click", () => {
      if (engine === "WASM") {
        wasmExports.seedRng(Date.now());
        const start = performance.now();
        wasmExports.generateMaze(size);
        const genMs = performance.now() - start;
        const drawStart = performance.now();
        drawWasmMaze();
        const drawMs = performance.now() - drawStart;
        log(size, genMs, drawMs, "wasm");
      } else {
        const start = performance.now();
        const maze = generateMazeJS(size);
        const genMs = performance.now() - start;
        const drawStart = performance.now();
        drawJSMaze(maze);
        const drawMs = performance.now() - drawStart;
        log(size, genMs, drawMs, "js");
      }
    });
    buttonsEl.appendChild(btn);
  }
}

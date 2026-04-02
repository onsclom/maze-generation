# maze generation

Side-by-side comparison of maze generation in WASM (C compiled to wasm32) and JavaScript. Renders to canvas.

## Setup

Requires [Bun](https://bun.sh) and `clang` with wasm32 target support.

```
bun install
bun run build:wasm
bun run dev
```

## Build

```
bun run build
```

Outputs to `dist/`.

## How it works

Both implementations use randomized DFS (recursive backtracker) to generate perfect mazes. The C version (`maze.c`) is compiled to a standalone `.wasm` module with no libc dependency. The JS version (`maze.ts`) is a direct TypeScript port.

Mazes are drawn on a `<canvas>` using CanvasRenderingContext2D.

WASM setup based on Surma's [Compiling C to WebAssembly without Emscripten](https://surma.dev/things/c-to-webassembly/).

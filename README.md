# maze generation

Side-by-side comparison of maze generation in WASM (C compiled to wasm32) and JavaScript. Renders to canvas.

## Setup

Requires [Bun](https://bun.sh). The wasm build uses [Zig](https://ziglang.org)
as the C compiler (`zig cc`); if `zig` isn't on your `PATH`, `build-wasm.ts`
downloads a pinned version into `.zig/` and reuses it.

```bash
bun install
bun run build:wasm # only required when making changes to maze.c
bun run dev
```

## Build

```bash
bun run build
```

Builds `maze.wasm` from `maze.c`, then bundles to `dist/`. `maze.wasm` is a
build artifact and is not committed. It's compiled during the build (including
on Vercel), so no toolchain setup is needed beyond Bun.

## How it works

Both implementations use randomized DFS (recursive backtracker) to generate perfect mazes. The C version (`maze.c`) is compiled to a standalone `.wasm` module with no libc dependency. The JS version (`maze.ts`) is a direct TypeScript port.

Mazes are drawn on a `<canvas>` using CanvasRenderingContext2D.

WASM setup based on Surma's [Compiling C to WebAssembly without Emscripten](https://surma.dev/things/c-to-webassembly/).

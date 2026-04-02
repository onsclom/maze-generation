@echo off
clang --target=wasm32 -O2 -nostdlib -Wl,--no-entry -Wl,--export=seedRng -Wl,--export=generateMaze -Wl,--export=getMazeSize -Wl,--export=getMazeWalls -Wl,--export=getMazeTopBots -o maze.wasm maze.c

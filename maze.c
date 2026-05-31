// compiled to wasm by build-wasm.ts via `zig cc` (run `bun run build:wasm`)

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define EXPORT __attribute__((visibility("default")))

#define MAX_MAZE_SIZE 1000

typedef uint16_t u16;
typedef uint32_t u32;

typedef struct {
  u16 size;
  bool walls[MAX_MAZE_SIZE * (MAX_MAZE_SIZE + 1)];
  bool topBots[(MAX_MAZE_SIZE + 1) * MAX_MAZE_SIZE];
} Maze;

static Maze maze;
static bool visited[MAX_MAZE_SIZE * MAX_MAZE_SIZE];
static u32 stack[MAX_MAZE_SIZE * MAX_MAZE_SIZE];

static unsigned int rngState;

EXPORT void seedRng(unsigned int seed) { rngState = seed; }

static unsigned int nextRand(void) {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return rngState;
}

EXPORT void generateMaze(u16 size) {
  maze.size = size;
  for (int i = 0; i < size * (size + 1); i++) maze.walls[i] = 0;
  for (int i = 0; i < (size + 1) * size; i++) maze.topBots[i] = 0;
  for (int i = 0; i < size * size; i++) visited[i] = 0;

  static const int dx[4] = {1, -1, 0, 0};
  static const int dy[4] = {0, 0, 1, -1};

  int top = 0;
  stack[0] = 0;
  visited[0] = 1;

  while (top >= 0) {
    int cx = (int)(stack[top] % size), cy = (int)(stack[top] / size);
    int choices[4] = {0};
    size_t nChoices = 0;

    for (int i = 0; i < 4; i++) {
      int nx = cx + dx[i], ny = cy + dy[i];
      if ((unsigned)nx < (unsigned)size && (unsigned)ny < (unsigned)size &&
          !visited[ny * size + nx])
        choices[nChoices++] = i;
    }

    if (!nChoices) {
      top--;
      continue;
    }

    int dir = choices[nextRand() % nChoices];
    int nx = cx + dx[dir], ny = cy + dy[dir];
    visited[ny * size + nx] = 1;
    stack[++top] = (u32)(ny * size + nx);

    if (dir == 0)  // right
      maze.walls[cy * (size + 1) + nx] = 1;
    else if (dir == 1)  // left
      maze.walls[cy * (size + 1) + cx] = 1;
    else if (dir == 2)  // down
      maze.topBots[ny * size + cx] = 1;
    else  // up
      maze.topBots[cy * size + cx] = 1;
  }
}

EXPORT u16 getMazeSize(void) { return maze.size; }
EXPORT bool* getMazeWalls(void) { return maze.walls; }
EXPORT bool* getMazeTopBots(void) { return maze.topBots; }

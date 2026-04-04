// compiled with: clang --target=wasm32 -flto -O3 -nostdlib -Wl,--no-entry
// -Wl,--export-all -Wl,--lto-O3 -Wl,-z,stack-size=8388608 -o maze.wasm maze.c

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define MAX_MAZE_SIZE 1000

typedef uint16_t u16;

typedef struct {
  u16 size;
  bool walls[MAX_MAZE_SIZE * (MAX_MAZE_SIZE + 1)];
  bool topBots[(MAX_MAZE_SIZE + 1) * MAX_MAZE_SIZE];
} Maze;

typedef struct {
  int x, y;
} Vec2d;

static Maze maze;
static bool visited[MAX_MAZE_SIZE * MAX_MAZE_SIZE];
static Vec2d stack[MAX_MAZE_SIZE * MAX_MAZE_SIZE];

static unsigned int rngState;

void seedRng(unsigned int seed) { rngState = seed; }

static unsigned int nextRand(void) {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return rngState;
}

void generateMaze(u16 size) {
  maze.size = size;
  for (int i = 0; i < size * (size + 1); i++) maze.walls[i] = 0;
  for (int i = 0; i < (size + 1) * size; i++) maze.topBots[i] = 0;
  for (int i = 0; i < size * size; i++) visited[i] = 0;

  static const int dx[4] = {1, -1, 0, 0};
  static const int dy[4] = {0, 0, 1, -1};

  int top = 0;
  stack[0] = (Vec2d){0, 0};
  visited[0] = 1;

  while (top >= 0) {
    int cx = stack[top].x, cy = stack[top].y;
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
    stack[++top] = (Vec2d){nx, ny};

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

u16 getMazeSize(void) { return maze.size; }
bool* getMazeWalls(void) { return maze.walls; }
bool* getMazeTopBots(void) { return maze.topBots; }

export type Maze = {
  size: number;
  walls: boolean[];
  topBots: boolean[];
};

export function generateMaze(size: number): Maze {
  const walls = Array.from<boolean>({ length: size * (size + 1) }).fill(false);
  const topBots = Array.from<boolean>({ length: (size + 1) * size }).fill(
    false,
  );
  const visited = new Uint8Array(size * size);
  const stack: number[] = [0]; // encode (x,y) as y*size+x
  visited[0] = 1;

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  while (stack.length > 0) {
    const pos = stack.at(-1)!;
    const cx = pos % size,
      cy = (pos - cx) / size;
    const choices: number[] = [];

    for (let i = 0; i < 4; i++) {
      const nx = cx + dx[i]!,
        ny = cy + dy[i]!;
      if (
        nx >= 0 &&
        nx < size &&
        ny >= 0 &&
        ny < size &&
        !visited[ny * size + nx]
      )
        choices.push(i);
    }

    if (!choices.length) {
      stack.pop();
      continue;
    }

    const dir = choices[Math.floor(Math.random() * choices.length)]!;
    const nx = cx + dx[dir]!,
      ny = cy + dy[dir]!;
    visited[ny * size + nx] = 1;
    stack.push(ny * size + nx);

    if (dx[dir] === 1) walls[cy * (size + 1) + nx] = true;
    else if (dx[dir] === -1) walls[cy * (size + 1) + cx] = true;
    else if (dy[dir] === 1) topBots[ny * size + cx] = true;
    else topBots[cy * size + cx] = true;
  }

  return { size, walls, topBots };
}

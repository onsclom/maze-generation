const MAX_MAZE_SIZE = 1000;

const Direction = enum(u2) { right, left, down, up };

const offsets = [4][2]isize{ .{ 1, 0 }, .{ -1, 0 }, .{ 0, 1 }, .{ 0, -1 } };

const Maze = struct {
    size: u16,
    h_walls: [MAX_MAZE_SIZE * (MAX_MAZE_SIZE + 1)]bool,
    v_walls: [(MAX_MAZE_SIZE + 1) * MAX_MAZE_SIZE]bool,
};

fn Stack(comptime T: type, comptime max: usize) type {
    return struct {
        items: [max]T = undefined,
        len: usize = 0,

        fn push(self: *@This(), val: T) void {
            self.items[self.len] = val;
            self.len += 1;
        }
        fn pop(self: *@This()) T {
            self.len -= 1;
            return self.items[self.len];
        }
        fn peek(self: *const @This()) T {
            return self.items[self.len - 1];
        }
        fn isEmpty(self: *const @This()) bool {
            return self.len == 0;
        }
    };
}

var maze: Maze = undefined;
var visited: [MAX_MAZE_SIZE * MAX_MAZE_SIZE]bool = undefined;
var stack: Stack(usize, MAX_MAZE_SIZE * MAX_MAZE_SIZE) = .{};

const Rng = struct {
    state: u32 = 0,

    fn next(self: *Rng) u32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 17;
        self.state ^= self.state << 5;
        return self.state;
    }
};

var rng: Rng = .{};

export fn seedRng(seed: u32) void {
    rng.state = seed;
}

export fn generateMaze(size: u16) void {
    const s: usize = size;
    maze.size = size;

    @memset(maze.h_walls[0 .. s * (s + 1)], false);
    @memset(maze.v_walls[0 .. (s + 1) * s], false);
    @memset(visited[0 .. s * s], false);

    stack = .{};
    stack.push(0);
    visited[0] = true;

    while (!stack.isEmpty()) {
        const pos = stack.peek();
        const cx = pos % s;
        const cy = pos / s;
        var choices: [4]Direction = undefined;
        var n_choices: usize = 0;

        for (offsets, 0..) |off, i| {
            const nx = @as(isize, @intCast(cx)) + off[0];
            const ny = @as(isize, @intCast(cy)) + off[1];
            if (nx < 0 or ny < 0) continue;
            const ux: usize = @intCast(nx);
            const uy: usize = @intCast(ny);
            if (ux >= s or uy >= s) continue;
            if (!visited[uy * s + ux]) {
                choices[n_choices] = @enumFromInt(i);
                n_choices += 1;
            }
        }

        if (n_choices == 0) {
            _ = stack.pop();
            continue;
        }

        const dir = choices[rng.next() % n_choices];
        const off = offsets[@intFromEnum(dir)];
        const nx: usize = @intCast(@as(isize, @intCast(cx)) + off[0]);
        const ny: usize = @intCast(@as(isize, @intCast(cy)) + off[1]);
        visited[ny * s + nx] = true;
        stack.push(ny * s + nx);

        switch (dir) {
            .right => maze.h_walls[cy * (s + 1) + nx] = true,
            .left => maze.h_walls[cy * (s + 1) + cx] = true,
            .down => maze.v_walls[ny * s + cx] = true,
            .up => maze.v_walls[cy * s + cx] = true,
        }
    }
}

export fn getMazeSize() u16 {
    return maze.size;
}

export fn getMazeWalls() [*]bool {
    return &maze.h_walls;
}

export fn getMazeTopBots() [*]bool {
    return &maze.v_walls;
}

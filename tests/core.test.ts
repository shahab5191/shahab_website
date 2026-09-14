import { describe, expect, it } from "vitest";
import { Shell } from "../src/core/Shell";
import { Kernel } from "../src/core/Kernel";
import { getCommand, commandNames } from "../src/core/commands";
import { TerminalSession, wrapText } from "../src/core/Terminal";
import { MockGraphics } from "./helpers/mockGraphics";
import type { KeyEvent, Process } from "../src/core/types";

function key(key: string, ctrl = false): KeyEvent {
  return { key, modifiers: { ctrl, alt: false, shift: false, meta: false } };
}

/** Flush pending microtasks + one macrotask so coroutines settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("wrapText", () => {
  it("hard-wraps at the given width", () => {
    expect(wrapText("abcdef", 3)).toEqual(["abc", "def"]);
  });

  it("preserves explicit newlines and empty lines", () => {
    expect(wrapText("a\n\nbc", 5)).toEqual(["a", "", "bc"]);
  });
});

describe("TerminalSession", () => {
  it("inserts characters and moves the cursor", () => {
    const terminal = new TerminalSession(new MockGraphics());
    terminal.readLine("> ");
    terminal.pushKey(key("h"));
    terminal.pushKey(key("i"));
    expect(terminal.input).toBe("hi");
  });

  it("deletes with Backspace", () => {
    const terminal = new TerminalSession(new MockGraphics());
    terminal.readLine("> ");
    terminal.pushKey(key("h"));
    terminal.pushKey(key("i"));
    terminal.pushKey(key("Backspace"));
    expect(terminal.input).toBe("h");
  });

  it("deletes the previous word with Ctrl+W", () => {
    const terminal = new TerminalSession(new MockGraphics());
    terminal.readLine("> ");
    for (const c of "hello world") terminal.pushKey(key(c));
    terminal.pushKey(key("w", true));
    expect(terminal.input).toBe("hello ");
  });

  it("resolves readLine on Enter and records history", async () => {
    const terminal = new TerminalSession(new MockGraphics());
    const line = terminal.readLine("> ");
    for (const c of "echo hi") terminal.pushKey(key(c));
    terminal.pushKey(key("Enter"));
    expect(await line).toBe("echo hi");
    expect(terminal.input).toBe("");
  });

  it("navigates history with ArrowUp / ArrowDown", async () => {
    const terminal = new TerminalSession(new MockGraphics());

    const one = terminal.readLine("> ");
    for (const c of "one") terminal.pushKey(key(c));
    terminal.pushKey(key("Enter"));
    await one;

    const two = terminal.readLine("> ");
    for (const c of "two") terminal.pushKey(key(c));
    terminal.pushKey(key("Enter"));
    await two;

    const third = terminal.readLine("> ");
    terminal.pushKey(key("ArrowUp"));
    expect(terminal.input).toBe("two");
    terminal.pushKey(key("ArrowUp"));
    expect(terminal.input).toBe("one");
    terminal.pushKey(key("ArrowDown"));
    expect(terminal.input).toBe("two");

    terminal.pushKey(key("Enter"));
    await third;
  });

  it("wraps long output lines into scrollback rows", () => {
    const terminal = new TerminalSession(new MockGraphics(6, 10));
    terminal.writeLine("abcdefgh");
    expect(terminal.scrollback).toEqual(["abcd", "efgh"]);
  });

  it("draws output one cell inside the margin", () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    terminal.writeLine("hi");
    expect(graphics.drawTextCalls[0]).toMatchObject({
      col: 1,
      row: 1,
      text: "hi",
    });
  });

  it("queues raw keys for pollKeys when no line is being read", () => {
    const terminal = new TerminalSession(new MockGraphics());
    terminal.pushKey(key("x"));
    terminal.pushKey(key("y"));
    expect(terminal.pollKeys().map((e) => e.key)).toEqual(["x", "y"]);
    expect(terminal.pollKeys()).toEqual([]);
  });
});

describe("Kernel", () => {
  it("routes input to an active process and restores the shell on exit", async () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    const shell = new Shell();
    const kernel = new Kernel(graphics, terminal, shell);
    kernel.boot();

    let received: string | null = null;
    let exitFn: ((code?: number) => void) | undefined;
    const proc: Process = {
      run: async (t, args) => {
        exitFn = args.exit;
        received = await t.readLine("? ");
      },
    };

    kernel.spawn(proc);
    expect(kernel.activeProcess).toBe(proc);

    kernel.handleInput(key("x"));
    kernel.handleInput(key("Enter"));
    await flush();
    expect(received).toBe("x");

    exitFn?.();
    await flush();
    expect(kernel.activeProcess).not.toBe(proc);
  });

  it("reports unknown commands", async () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    const shell = new Shell();
    new Kernel(graphics, terminal, shell).boot();

    for (const c of "definitely-not-a-command") {
      terminal.pushKey(key(c));
    }
    terminal.pushKey(key("Enter"));
    await flush();

    expect(
      terminal.scrollback.some((l) => l.includes("command not found")),
    ).toBe(true);
  });

  it("routes raw keys to a full-screen process, not the shell", async () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    const shell = new Shell();
    const kernel = new Kernel(graphics, terminal, shell);
    kernel.boot();

    let received: string[] = [];
    const proc: Process = {
      run: async (t, args) => {
        await t.nextFrame();
        received = t.pollKeys().map((e) => e.key);
        args.exit();
      },
    };

    kernel.spawn(proc);
    kernel.handleInput(key("x"));
    kernel.handleInput(key("y"));
    kernel.update(0.016);
    await flush();

    expect(received).toEqual(["x", "y"]);
    expect(kernel.activeProcess).not.toBe(proc);
  });

  it("terminates a process by default on SIGINT", async () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    const shell = new Shell();
    const kernel = new Kernel(graphics, terminal, shell);
    kernel.boot();

    let reached = false;
    const proc: Process = {
      run: async (t) => {
        await t.nextFrame();
        reached = true;
      },
    };

    kernel.spawn(proc);
    kernel.handleInput(key("c", true));
    await flush();
    expect(reached).toBe(false);
    expect(kernel.activeProcess).not.toBe(proc);
  });

  it("lets a process ignore SIGINT with a handler", async () => {
    const graphics = new MockGraphics();
    const terminal = new TerminalSession(graphics);
    const shell = new Shell();
    const kernel = new Kernel(graphics, terminal, shell);
    kernel.boot();

    let handled = false;
    let reached = false;
    const proc: Process = {
      run: async (t, args) => {
        args.signals.on("SIGINT", () => {
          handled = true;
        });
        await t.nextFrame();
        reached = true;
        args.exit();
      },
    };

    kernel.spawn(proc);
    kernel.handleInput(key("c", true));
    expect(handled).toBe(true);
    kernel.update(0.016);
    await flush();
    expect(reached).toBe(true);
    expect(kernel.activeProcess).not.toBe(proc);
  });
});

describe("command registry", () => {
  it("registers the built-in commands", () => {
    for (const name of ["help", "clear", "echo", "about", "neofetch", "ui"]) {
      expect(getCommand(name)).toBeTypeOf("function");
    }
  });

  it("sorts command names", () => {
    expect(commandNames()).toEqual([...commandNames()].sort());
  });
});

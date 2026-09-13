import { describe, expect, it } from 'vitest';
import { Shell, wrapText } from '../src/core/Shell';
import { Kernel } from '../src/core/Kernel';
import { getCommand, commandNames } from '../src/core/commands';
import { MockGraphics } from './helpers/mockGraphics';
import type { KeyEvent, Process } from '../src/core/types';

function key(key: string, ctrl = false): KeyEvent {
  return { key, modifiers: { ctrl, alt: false, shift: false, meta: false } };
}

describe('wrapText', () => {
  it('hard-wraps at the given width', () => {
    expect(wrapText('abcdef', 3)).toEqual(['abc', 'def']);
  });

  it('preserves explicit newlines and empty lines', () => {
    expect(wrapText('a\n\nbc', 5)).toEqual(['a', '', 'bc']);
  });
});

describe('Shell', () => {
  it('inserts characters and moves the cursor', () => {
    const shell = new Shell(new MockGraphics());
    shell.handleInput(key('h'));
    shell.handleInput(key('i'));
    expect(shell.input).toBe('hi');
  });

  it('deletes with Backspace', () => {
    const shell = new Shell(new MockGraphics());
    shell.handleInput(key('h'));
    shell.handleInput(key('i'));
    shell.handleInput(key('Backspace'));
    expect(shell.input).toBe('h');
  });

  it('deletes the previous word with Ctrl+W', () => {
    const shell = new Shell(new MockGraphics());
    for (const c of 'hello world') shell.handleInput(key(c));
    shell.handleInput(key('w', true));
    expect(shell.input).toBe('hello ');
  });

  it('submits the buffer on Enter and records history', () => {
    const shell = new Shell(new MockGraphics());
    let received = '';
    shell.onCommand = (line) => {
      received = line;
    };
    for (const c of 'echo hi') shell.handleInput(key(c));
    shell.handleInput(key('Enter'));
    expect(received).toBe('echo hi');
    expect(shell.input).toBe('');
  });

  it('navigates history with ArrowUp / ArrowDown', () => {
    const shell = new Shell(new MockGraphics());
    shell.onCommand = () => {};
    for (const c of 'one') shell.handleInput(key(c));
    shell.handleInput(key('Enter'));
    for (const c of 'two') shell.handleInput(key(c));
    shell.handleInput(key('Enter'));

    shell.handleInput(key('ArrowUp'));
    expect(shell.input).toBe('two');
    shell.handleInput(key('ArrowUp'));
    expect(shell.input).toBe('one');
    shell.handleInput(key('ArrowDown'));
    expect(shell.input).toBe('two');
  });

  it('wraps long output lines into scrollback rows', () => {
    const graphics = new MockGraphics(4, 10);
    const shell = new Shell(graphics);
    shell.writeLine('abcdefgh');
    expect(shell.scrollback).toEqual(['abcd', 'efgh']);
  });
});

describe('Kernel', () => {
  it('routes input to an active process and restores the shell on exit', () => {
    const graphics = new MockGraphics();
    const shell = new Shell(graphics);
    const kernel = new Kernel(graphics, shell);

    let handled = 0;
    let cleanedUp = 0;
    let exitFn: ((code?: number) => void) | undefined;
    const proc: Process = {
      init: (_g, args) => {
        exitFn = args.exit;
      },
      handleInput: () => {
        handled += 1;
      },
      update: () => {},
      cleanup: () => {
        cleanedUp += 1;
      },
    };

    kernel.spawn(proc);
    expect(kernel.activeProcess).toBe(proc);

    kernel.handleInput(key('x'));
    expect(handled).toBe(1);

    // Simulate the process calling its own exit callback.
    exitFn?.();
    expect(kernel.activeProcess).toBeNull();
    expect(cleanedUp).toBe(1);
  });

  it('reports unknown commands', () => {
    const graphics = new MockGraphics();
    const shell = new Shell(graphics);
    new Kernel(graphics, shell);
    shell.onCommand('definitely-not-a-command');
    expect(shell.scrollback.some((l) => l.includes('command not found'))).toBe(true);
  });
});

describe('command registry', () => {
  it('registers the built-in commands', () => {
    for (const name of ['help', 'clear', 'echo', 'about', 'ui']) {
      expect(getCommand(name)).toBeTypeOf('function');
    }
  });

  it('sorts command names', () => {
    expect(commandNames()).toEqual([...commandNames()].sort());
  });
});

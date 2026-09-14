/**
 * OS-level process signals. Each foreground process gets its own
 * `SignalController`; the kernel raises signals (SIGINT for Ctrl+C, SIGTERM to
 * replace a process), and a process may register handlers to override the
 * default terminate action.
 */

export type SignalName = "SIGINT" | "SIGTERM";

/** Thrown to unwind a process's awaited input when a signal terminates it. */
export class SignalError extends Error {
  readonly signal: SignalName;

  constructor(signal: SignalName) {
    super(`signal ${signal}`);
    this.name = "SignalError";
    this.signal = signal;
  }
}

/**
 * Read-only signal handle handed to processes via `SystemArgs.signals`.
 */
export interface Signals {
  /** True once the process has been terminated by a signal. */
  readonly terminated: boolean;
  /** Register a handler; returns an unsubscribe function. */
  on(signal: SignalName, handler: () => void): () => void;
}

/**
 * Kernel-facing side of a process's signal state. The terminal binds its
 * pending-await reject via `bindInterrupt` so a signal can interrupt an
 * in-flight `readLine`/`nextKey`/`nextFrame`.
 */
export interface SignalControl {
  readonly terminated: boolean;
  bindInterrupt(reject: ((error: unknown) => void) | null): void;
}

/**
 * Per-process signal delivery, owned by the Kernel.
 *
 * Unix semantics: raising a signal runs any registered handler (which may
 * choose to ignore or exit); with no handler the default action is terminate.
 */
export class SignalController implements Signals, SignalControl {
  private handlers = new Map<SignalName, Set<() => void>>();
  private _terminated = false;
  private interrupt: ((error: unknown) => void) | null = null;

  get terminated(): boolean {
    return this._terminated;
  }

  on(signal: SignalName, handler: () => void): () => void {
    let set = this.handlers.get(signal);
    if (!set) {
      set = new Set();
      this.handlers.set(signal, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  bindInterrupt(reject: ((error: unknown) => void) | null): void {
    this.interrupt = reject;
  }

  /** Deliver a signal; a handler (if any) replaces the default action. */
  raise(signal: SignalName): void {
    if (this._terminated) return;
    const set = this.handlers.get(signal);
    if (set && set.size > 0) {
      for (const handler of [...set]) handler();
      return;
    }
    this.terminate(signal);
  }

  /** Force-terminate (default action). Interrupts any pending await. */
  terminate(signal: SignalName): void {
    if (this._terminated) return;
    this._terminated = true;
    const interrupt = this.interrupt;
    this.interrupt = null;
    interrupt?.(new SignalError(signal));
  }
}

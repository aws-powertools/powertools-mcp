import { expect, vi } from 'vitest';

// Mock console methods to prevent output during tests
vi.spyOn(console, 'error').mockReturnValue();
vi.spyOn(console, 'warn').mockReturnValue();
vi.spyOn(console, 'debug').mockReturnValue();
vi.spyOn(console, 'info').mockReturnValue();
vi.spyOn(console, 'log').mockReturnValue();

expect.extend({
  toHaveLogged(received, expected) {
    const calls = received.mock.calls;
    const messages = new Array(calls.length);
    for (const [idx, call] of calls.entries()) {
      const [rawMessage] = call;
      try {
        messages[idx] = JSON.parse(rawMessage);
      } catch (error) {
        messages[idx] = rawMessage;
      }
      if (this.equals(messages[idx], expected)) {
        return {
          message: () => '',
          pass: true,
        };
      }
    }

    return {
      message: () => 'Expected function to have logged provided object',
      pass: false,
      actual: messages,
      expected,
    };
  },
  toHaveLoggedNth(received, nth, expected) {
    const call = received.mock.calls[nth - 1];
    if (!call) {
      return {
        message: () =>
          `Expected function to have logged provided object during ${nth} call`,
        pass: false,
        actual: 'No log found at index',
        expected,
      };
    }
    const [rawMessage] = call;
    const message = JSON.parse(rawMessage);
    if (this.equals(message, expected)) {
      return {
        message: () => '',
        pass: true,
      };
    }

    return {
      message: () => 'Expected function to have logged provided object',
      pass: false,
      actual: message,
      expected,
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    /**
     * Asserts that the logger function has been called with the expected log message
     * during any call.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'info').mockReturnValue();
     *
     * expect(console.info).toHaveLogged(
     *   expect.objectContaining({
     *     message: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param expected - The expected log message
     */
    toHaveLogged(expected: Record<string, unknown>): void;
    /**
     * Asserts that the logger function has been called with the expected log message
     * during the specific nth call.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'info').mockReturnValue();
     *
     * expect(console.info).toHaveLoggedNth(
     *   1,
     *   expect.objectContaining({
     *     message: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param nth - The index of the call to check
     * @param expected - The expected log message
     */
    toHaveLoggedNth(nth: number, expected: Record<string, unknown>): void;
  }
}

process.env.POWERTOOLS_DEV = 'true';

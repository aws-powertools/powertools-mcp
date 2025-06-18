import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
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
      } catch {
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
  toBeResponseWithText(received, content) {
    const textContent =
      typeof content === 'string' ? content : JSON.stringify(content);
    if (
      received.some(
        (item: CallToolResult) =>
          item.type === 'text' && (item.text as string) === textContent
      )
    ) {
      return {
        message: () => '',
        pass: true,
      };
    }

    return {
      message: () => `Expected response to contain text: ${textContent}`,
      pass: false,
      actual: received,
      expected: textContent,
    };
  },
  toHaveNthResultWith(received, nth, expected) {
    let parsedReceived: Record<string, unknown>[];
    try {
      parsedReceived = JSON.parse(received[0].text);
    } catch {
      return {
        message: () => 'Response text is not valid JSON',
        pass: false,
        actual: received.text,
        expected: 'Valid JSON',
      };
    }

    const result = parsedReceived[nth - 1];
    if (!result) {
      return {
        message: () => `Expected response to have a result at index ${nth - 1}`,
        pass: false,
        actual: 'No result found at index',
        expected,
      };
    }
    if (this.equals(result, expected)) {
      return {
        message: () => '',
        pass: true,
      };
    }

    return {
      message: () => 'Expected response to have the provided result',
      pass: false,
      actual: result,
      expected,
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    /**
     * Assesss that the logger function has been called with the expected log message
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
     * Assesss that the logger function has been called with the expected log message
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
    /**
     * Assesss that the response contains the expected text content.
     *
     * @example
     * ```ts
     * expect(response).toBeResponseWithText('Hello, world!');
     * ```
     *
     * @param content - The expected text content or object to check in the response
     */
    toBeResponseWithText(content: string | Record<string, unknown>): void;
    /**
     * Assesss that the response contains the expected result object at the nth position.
     *
     * @example
     * ```ts
     * expect(response).toHaveNthResultWith(
     *   1,
     *   expect.objectContaining({
     *     key: 'value',
     *   })
     * );
     *```
     *
     * @param nth - The index of the result to check (1-based index)
     * @param expected - The expected result object
     */
    toHaveNthResultWith(nth: number, expected: Record<string, unknown>): void;
  }
}

process.env.POWERTOOLS_DEV = 'true';
process.env.LOG_LEVEL = 'debug';

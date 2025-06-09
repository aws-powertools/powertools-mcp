import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import readline from 'node:readline';

/**
 * StdioServer is a class that manages a child process running the MCP server.
 *
 * It provides methods to start the server, stop it, and send requests to it via `stdio`.
 */
class StdioServer {
  readonly #process: ChildProcessWithoutNullStreams;
  readonly #inputReader: readline.Interface;
  readonly #requestTimeout: number;

  public constructor(options?: {
    cmd?: string;
    args?: string[];
  }) {
    const cmd = options?.cmd ?? 'node';
    const args = options?.args ?? ['dist/index.js'];
    this.#requestTimeout = process.env.CI ? 5000 : 1_000_000; // 1000 seconds in non-CI environments

    this.#process = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as ChildProcessWithoutNullStreams;
    this.#inputReader = readline.createInterface({
      input: this.#process.stdout,
    });
  }

  /**
   * Start the MCP server.
   *
   * This method waits for the MCP server to start and be ready to accept requests.
   * It resolves when the server is listening on `stdio`.
   */
  public async start() {
    await Promise.race([
      (async () => {
        for await (const line of this.#inputReader) {
          if (line.includes('Powertools MCP Server running on stdio')) {
            return;
          }
          if (line.includes('Powertools MCP Fatal Error')) {
            throw new Error(`MCP Server error: ${line}`);
          }
        }
      })(),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('MCP Server start timeout'));
        }, this.#requestTimeout);
      }),
    ]);
  }

  /**
   * Stop the MCP server.
   *
   * This method closes the input reader and kills the child process running the MCP server.
   */
  public stop() {
    this.#inputReader.close();
    this.#process.kill();
  }

  /**
   * Send a request to the MCP server via `stdio`.
   *
   * This method sends a JSON-RPC request to the MCP server and waits for the response.
   *
   * @example
   * ```ts
   * const server = new Stdio();
   * await server.start();
   *
   * const response = await server.sendRequest({
   *   id: 1,
   *   method: 'tools/list',
   *   params: {}
   * });
   * // Request: {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
   * // Response: {"jsonrpc":"2.0","id":1,"result":{"tools":[...]} }
   *```
   *
   * @param props - The request properties
   * @param props.id - The request ID
   * @param props.method - The method to call
   * @param props.params - The parameters for the method
   */
  public async sendRequest<T = unknown>(props: {
    id: number;
    method: string;
    params?: Record<string, unknown>;
  }): Promise<T> {
    const { id, method, params = {} } = props;
    return new Promise<T>((resolve, reject) => {
      const req = { jsonrpc: '2.0', id, method, params };
      this.#process.stdin.write(`${JSON.stringify(req)}\n`);

      const onLine = (line: string) => {
        let obj: unknown;
        try {
          obj = JSON.parse(line);
        } catch {
          return;
        }
        if ((obj as { id: number }).id === id) {
          this.#inputReader.off('line', onLine);
          resolve((obj as { result: T }).result);
        }
      };
      this.#inputReader.on('line', onLine);

      setTimeout(() => {
        this.#inputReader.off('line', onLine);
        reject(new Error(`request ${id} timeout`));
      }, this.#requestTimeout);
    });
  }
}

export { StdioServer };

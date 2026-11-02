import assert from "node:assert/strict";
import {
  spawn
} from "node:child_process";
import {
  once
} from "node:events";
import {
  describe,
  it
} from "node:test";

/*
 * Windows has no catchable SIGTERM: the signal
 * ends the process immediately. CI runs on Linux.
 */
const skip =
  process.platform === "win32"
    ? "SIGTERM cannot be handled on Windows"
    : false;

describe("Server shutdown", () => {
  it("exits cleanly on SIGTERM", { skip }, async () => {
    const server =
      spawn(
        process.execPath,
        [
          "--import",
          "tsx",
          "src/server.ts"
        ],
        {
          env: {
            ...process.env,

            HOST: "127.0.0.1",
            PORT: "33399",

            DATABASE_URL:
              process.env.DATABASE_URL ??
              "postgresql://postgres:postgres@localhost:5432/moz_address"
          },

          stdio: [
            "ignore",
            "pipe",
            "inherit"
          ]
        }
      );

    const exit =
      once(server, "exit");

    let output = "";

    await new Promise<void>(
      (resolve, reject) => {
        server.stdout.on(
          "data",
          (chunk: Buffer) => {
            output +=
              chunk.toString();

            if (
              output.includes(
                "Server listening"
              )
            ) {
              resolve();
            }
          }
        );

        server.once(
          "exit",
          () =>
            reject(
              new Error(
                `Server exited before listening:\n${output}`
              )
            )
        );
      }
    );

    server.kill("SIGTERM");

    const [
      code,
      signal
    ] = await exit;

    assert.equal(
      signal,
      null
    );

    assert.equal(
      code,
      0
    );
  });
});

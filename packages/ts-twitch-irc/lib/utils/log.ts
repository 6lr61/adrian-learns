import { WriteStream, createWriteStream } from "fs";

const LOG_PATH = "./logs/";

let fileStream: WriteStream;

export function startNewLog() {
  const date = new Date();
  fileStream = createWriteStream(
    `${LOG_PATH}${date.toLocaleString("sv-SE")} log.txt`,
    {
      flags: "a",
    }
  );
}

export function log(message: string): void {
  fileStream.write(message + "\n");
}

export function closeLog() {
  fileStream.end();
}

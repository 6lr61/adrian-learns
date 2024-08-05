import * as fs from "node:fs";

const BOT_STORAGE_FILE = "storage.json";

interface Storage {
  aliases: Record<string, string>;
  crashes: number;
  monoStolenGifts: string[];
  quotes: string[];
}

class BotStorage {
  private storage: Partial<Storage>;

  constructor(readonly filename: string) {
    const rawData = fs.readFileSync(filename, { encoding: "utf-8" });

    if (rawData === "") {
      this.storage = {};
      return;
    }

    this.storage = JSON.parse(rawData);
  }

  set<T extends keyof Storage>(key: T, value: Storage[T]) {
    this.storage[key] = value;
    fs.writeFileSync(this.filename, JSON.stringify(this.storage));
  }

  get<T extends keyof Storage>(key: T, defaultValue: Storage[T]): Storage[T] {
    return this.storage[key] ?? defaultValue;
  }

  delete(key: keyof Storage) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.storage[key];
  }
}

export const botStorage = new BotStorage(BOT_STORAGE_FILE);

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export class BotStorage {
  private db;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
  }

  init() {
    const sql = fs.readFileSync(
      // FIXME:
      path.join("src", "sqlite", "init.sql"),
      "utf8"
    );
    this.db.exec(sql);
    return this;
  }

  close() {
    this.db.close();
  }

  getUserId(username: string): number | undefined {
    const result = this.db
      .prepare<string[]>(
        `SELECT user_id FROM user WHERE login_name = ? OR display_name = ? LIMIT 1`
      )
      .get(username, username) as { user_id: number } | undefined;

    return result?.user_id;
  }

  updateGiftOwner(
    giftId: number,
    oldUserId: number,
    newUserId: number
  ): { lastRowId: number; changes: number } {
    const result = this.db
      .prepare(
        `UPDATE user_gift
         SET user_id = ?
         WHERE user_id = ? AND gift_id = ? LIMIT 1`
      )
      .run(newUserId, oldUserId, giftId);
    console.debug("BotStorage.updateGift: changes:", result.changes);

    return {
      lastRowId: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  }

  upsertUser(
    userId: number,
    username: string,
    displayName: string
  ): { lastRowId: number; changes: number } | undefined {
    try {
      const result = this.db
        .prepare(
          `INSERT OR REPLACE INTO user (user_id, login_name, display_name) VALUES(?, ?, ?)`
        )
        .run(userId, username, displayName);
      console.debug("Storage.addUser: changes:", result.changes);
      return {
        lastRowId: Number(result.lastInsertRowid),
        changes: result.changes,
      };
    } catch (error) {
      console.error("Storage.addUser:", error);
    }
  }

  addAttribute(attribute: string): boolean {
    try {
      const result = this.db
        .prepare(`INSERT INTO gift_attr (attr_desc) VALUES(?)`)
        .run(attribute);
      console.debug("Storage.addAttribute: changes:", result.changes);
      return true;
    } catch (error) {
      console.error("Storage.addAttribute:", error);
      return false;
    }
  }

  addItem(item: string): boolean {
    try {
      const result = this.db
        .prepare(`INSERT INTO gift_item (item_desc) VALUES(?)`)
        .run(item);
      console.debug("Storage.addAttribute: changes:", result.changes);
      return true;
    } catch (error) {
      console.error("Storage.addAttribute:", error);
      return false;
    }
  }

  addGift(userId: number, attribute: string, item: string) {
    const attrId = this.db
      .prepare(`SELECT gift_attr_id FROM gift_attr WHERE attr_desc = ?`)
      .get(attribute) as { gift_attr_id: number };
    const itemId = this.db
      .prepare(`SELECT gift_item_id FROM gift_item WHERE item_desc = ?`)
      .get(item) as { gift_item_id: number };

    try {
      const result = this.db
        .prepare(
          `INSERT INTO user_gift (user_id, attr_id, item_id)
           VALUES(?, ?, ?)`
        )
        .run(userId, attrId.gift_attr_id, itemId.gift_item_id);
      console.debug("Storage.addGift: changes:", result.changes);
    } catch (error) {
      console.error("Storage.addGift:", error);
    }
  }

  makeGift(userId: number): number {
    const attrId = this.db
      .prepare(`SELECT gift_attr_id FROM gift_attr ORDER BY random() LIMIT 1`)
      .get() as { gift_attr_id: number };
    const itemId = this.db
      .prepare(`SELECT gift_item_id FROM gift_item ORDER BY random() LIMIT 1`)
      .get() as { gift_item_id: number };

    console.debug("Storage.makeGift", attrId.gift_attr_id, itemId.gift_item_id);

    try {
      const result = this.db
        .prepare<number[]>(
          `INSERT INTO user_gift (user_id, attr_id, item_id)
           VALUES(?, ?, ?)`
        )
        .run(userId, attrId.gift_attr_id, itemId.gift_item_id);
      console.debug("Storage.makeGift: changes:", result.changes);
      console.debug(
        "Storage.makeGift: created gift with id:",
        result.lastInsertRowid
      );
      return Number(result.lastInsertRowid);
    } catch (error) {
      console.error("Storage.makeGift:", error);
    }
    console.log(attrId, itemId);
    return -1;
  }

  getGift(giftId: number): { id: number; desc: string } | undefined {
    const gift = this.db
      .prepare<number>(
        `SELECT attr_desc, item_desc
         FROM user_gift
         INNER JOIN gift_attr ON user_gift.attr_id = gift_attr.gift_attr_id
         INNER JOIN gift_item ON user_gift.item_id = gift_item.gift_item_id
         WHERE gift_id = ?`
      )
      .get(giftId) as { attr_desc: string; item_desc: string } | undefined;

    if (!gift) {
      console.error("BotStorage.getGift: Couldn't find gift with ID:", giftId);
      return;
    }

    return { id: giftId, desc: `${gift.attr_desc} ${gift.item_desc}` };
  }

  getGifts(userId: number): { id: number; desc: string }[] {
    const result = this.db
      .prepare<number>(
        `SELECT gift_id, attr_desc, item_desc
         FROM user_gift
         INNER JOIN gift_attr ON user_gift.attr_id = gift_attr.gift_attr_id
         INNER JOIN gift_item ON user_gift.item_id = gift_item.gift_item_id
         WHERE user_id = ?`
      )
      .all(userId) as {
      gift_id: number;
      attr_desc: string;
      item_desc: string;
    }[];

    return result.map((row) => ({
      id: row.gift_id,
      desc: `${row.attr_desc} ${row.item_desc}`,
    }));
  }

  getGiftOwner(giftId: number): { display_name: string } | undefined {
    return this.db
      .prepare<number>(
        `SELECT display_name
         FROM user_gift
         INNER JOIN user ON user_gift.user_id = user.user_id
         WHERE gift_id = ?`
      )
      .get(giftId) as { display_name: string } | undefined;
  }

  setRandomGiftAttribute(
    giftId: number,
    userId: number
  ): { changes: number } | undefined {
    const attrId = this.db
      .prepare(`SELECT gift_attr_id FROM gift_attr ORDER BY random() LIMIT 1`)
      .get() as { gift_attr_id: number };
    const result = this.db
      .prepare<number[]>(
        `UPDATE user_gift
         SET attr_id = ?
         WHERE user_id = ? AND gift_id = ? LIMIT 1`
      )
      .run(attrId.gift_attr_id, userId, giftId);

    return result;
  }

  getGiftAttributes() {
    try {
      return this.db
        .prepare("SELECT gift_attr_id, attr_desc FROM gift_attr")
        .all() as {
        gift_attr_id: number;
        attr_desc: string;
      }[];
    } catch (error) {
      console.error("BotStorage.getGiftAttributes: SELECT command failed");
    }
  }

  getGiftItems() {
    try {
      return this.db
        .prepare("SELECT gift_item_id, item_desc FROM gift_item")
        .all() as {
        gift_item_id: number;
        item_desc: string;
      }[];
    } catch (error) {
      console.error("BotStorage.getGiftItems: SELECT command failed");
    }
  }

  countGifts(name: string) {
    try {
      return this.db
        .prepare(
          `SELECT COUNT(*)
           FROM user_gift
           INNER JOIN user ON user_gift.user_id = user.user_id
           WHERE login_name = ? OR display_name = ?
           LIMIT 1`
        )
        .pluck()
        .get(name, name) as number;
    } catch (error) {
      console.error("BotStorage.countGifts: SELECT command failed");
    }
  }

  topTen() {
    try {
      return this.db
        .prepare(
          `WITH counted_gifts AS (
            SELECT user_id, COUNT(*)
            AS gift_count
            FROM user_gift
            GROUP BY user_id
           )
 
           SELECT gift_count, display_name, login_name
           FROM counted_gifts
           INNER JOIN user
           ON user.user_id = counted_gifts.user_id
           ORDER BY gift_count DESC
           LIMIT 10;`
        )
        .all() as {
        gift_count: number;
        display_name: string;
        login_name: string;
      }[];
    } catch (error) {
      console.error();
    }
  }
}

/*
SELECT gift_count, display_name, login_name FROM (SELECT user_id, COUNT(*) AS gift_count FROM user_gift GROUP BY user_id) user_gift INNER JOIN user ON user.user_id = user_gift.user_id ORDER BY gift_count DESC LIMIT 10;
*/

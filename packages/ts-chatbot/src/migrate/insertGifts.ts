import { readFileSync } from "node:fs";
import { BotStorage } from "../sqlite/BotStorage.js";

interface ValidUsersResponse {
  data: [] | UserData[];
}

interface UserData {
  id: string;
  login: string;
  display_name: string;
  type: "admin" | "global_mod" | "staff" | ""; // normal user
  broadcaster_type: "affiliate" | "partner" | ""; // normal broadcaster
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string; // requires user:read:email scope
  created_at: string; // UTC date in RFC3339 format
}

const storage = JSON.parse(readFileSync("storage.json", "utf-8")).gifts;
const userData = JSON.parse(
  readFileSync("users.json", "utf-8")
) as ValidUsersResponse;
const userId = new Map<string, number>(
  userData.data.map((user) => [user.login, Number(user.id)])
);
const userDisplayName = new Map<string, string>(
  userData.data.map((user) => [user.login, user.display_name])
);

const { attributes, items } = JSON.parse(
  readFileSync("gifts.json", "utf-8")
) as {
  attributes: string[];
  items: string[];
};

const database = new BotStorage("storage.db").init();

// Gifts
for (const attribute of attributes) {
  database.addAttribute(attribute);
}

for (const item of items) {
  database.addItem(item);
}

for (const [user, gifts] of Object.entries(storage)) {
  database.upsertUser(
    userId.get(user) || 0,
    user,
    userDisplayName.get(user) || ""
  );
  for (const gift of gifts as string[]) {
    let attributeDesc: string | undefined;
    let itemDesc: string | undefined;

    // console.log(userId.get(user), gift);
    for (const attribute of attributes) {
      if (gift.startsWith(attribute)) {
        // console.log("Attribute:", attribute);
        attributeDesc = attribute;
        break;
      }
    }
    for (const item of items) {
      if (gift.endsWith(item)) {
        // console.log("Item:", item);
        itemDesc = item;
        break;
      }
    }

    if (!attributeDesc || !itemDesc) {
      console.error("Illegal gift:", gift);
      break;
    }

    database.addGift(userId.get(user) || 0, attributeDesc, itemDesc);
  }
}

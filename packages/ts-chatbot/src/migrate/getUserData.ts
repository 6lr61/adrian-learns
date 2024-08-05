import { readFileSync, writeFileSync } from "node:fs";
import { getToken } from "../auth.js";

if (!process.env.CLIENT_ID) {
  throw new Error("Did you forget to run node with --env-file=config.env?");
}

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

const input = readFileSync("storage.json", "utf-8");
const storage = JSON.parse(input);
const usersWithGifts = Object.keys(storage.gifts);

const url = new URL("https://api.twitch.tv/helix/users");

for (const login of usersWithGifts) {
  url.searchParams.append("login", login);
}

const response = await fetch(url, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${(await getToken()).token}`,
    "Client-Id": process.env.CLIENT_ID,
  },
});

const data = (await response.json()) as ValidUsersResponse;

writeFileSync("users.json", JSON.stringify(data, undefined, 2));

import { borrowToken, getToken } from "./auth.js";
import { wsEventsubConnect } from "./eventSub.js";
import { Chat } from "ts-twitch-irc";
import { Dispatch } from "./services/Dispatch.js";
import { parseCommand } from "./commands/utils/parseCommand.js";
import { Helix } from "ts-twitch-helix";
import { tokenToAuth } from "./utils/tokenToAuth.js";

const twitchToken = await getToken();
const chat = new Chat(twitchToken, borrowToken, process.env.BROADCASTER_LOGIN);
const helix = new Helix(tokenToAuth(twitchToken));
const dispatcher = new Dispatch(chat, helix);

chat.on("privateMessage", (message) =>
  parseCommand(dispatcher, helix, message),
);

wsEventsubConnect(dispatcher);

import { borrowToken, getToken } from "./auth.js";
import { wsEventsubConnect } from "./eventSub.js";
import { Chat } from "ts-twitch-irc";
import { sendWhisper } from "./helix.js";
import { Dispatch } from "./services/dispatch.js";
import { parseCommand } from "./commands/utils/parseCommand.js";

const twitchToken = await getToken();
const chat = new Chat(twitchToken, borrowToken, process.env.BROADCASTER_LOGIN);
const dispatcher = new Dispatch(chat, sendWhisper);

chat.on("privateMessage", (message) => parseCommand(dispatcher, message));

wsEventsubConnect(dispatcher);

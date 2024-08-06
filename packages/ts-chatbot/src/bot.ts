import { borrowToken, getToken } from "./auth.js";
import { wsEventsubConnect } from "./eventSub.js";
import { Chat, type PrivateMessage } from "ts-twitch-irc";
import { runBotCommand } from "./runBotCommand.js";
import { sendWhisper } from "./helix.js";
import { Dispatch } from "./services/dispatch.js";

// Start new log file
// startNewLog();

// Before we connect to any Twitch API, we have to check that our OAuth token is valid!
// Otherwise things will try to validate it and fail
await getToken();

// Here we can register the event handlers, for 'message'
// -> parse the IRC messages and respond to commands like PING!

// We probably have to create the websocket again, if we close it?

// TODO: Come up with a better name for this

const twitchToken = await getToken();
const chat = new Chat(twitchToken, borrowToken, process.env.BROADCASTER_LOGIN);
chat.on("privateMessage", parseMessage);

const dispatcher = new Dispatch(chat, sendWhisper);

// Connect to Eventsub
wsEventsubConnect(dispatcher);

function parseMessage(messageContent: PrivateMessage) {
  // Here is the part were we return if we got a PRIVMSG command;
  console.log(`${messageContent.username}: ${messageContent.message}`);

  // We have a message, maybe it's a bot command?
  if (messageContent.message.startsWith("!")) {
    // botCommand is an async function
    void runBotCommand(dispatcher, messageContent);
  }
}

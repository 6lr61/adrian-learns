import { borrowToken, getToken } from "./auth.js";
import { wsEventsubConnect } from "./eventSub.js";
import { Chat, type PrivateMessage } from "ts-twitch-irc";
import { runBotCommand, type BotResponse } from "./runBotCommand.js";
import { activeVote, countVote, countVotes } from "./commands/vote.js";
import { sendWhisper } from "./helix.js";

// Start new log file
// startNewLog();

// Before we connect to any Twitch API, we have to check that our OAuth token is valid!
// Otherwise things will try to validate it and fail
void (await getToken());

// Connect to Eventsub
wsEventsubConnect();

// If we move the sendChatMessage function here,
// we do have a reference to the websocket.
// But there's no guarante it's connected yet.
export function sendChatMessage(response: BotResponse | undefined): void {
  if (!response) {
    return;
  }

  switch (response.type) {
    case "chat":
      chat.send(response.message);
      break;
    case "error":
      if (response.userId) {
        void sendWhisper(response.userId, response.message);
        return;
      } else if (response.messageId) {
        chat.sendReply(response.messageId, response.message);
        return;
      }
      chat.send(response.message);
      break;
    case "reply":
      chat.sendReply(response.messageId, response.message);
      break;
    case "whisper":
      void sendWhisper(response.userId, response.message);
      break;
    default:
  }
}

// Here we can register the event handlers, for 'message'
// -> parse the IRC messages and respond to commands like PING!

// We probably have to create the websocket again, if we close it?

const twitchToken = await getToken();
const chat = new Chat(twitchToken, borrowToken, process.env.BROADCASTER_LOGIN);
chat.on("privateMessage", parseMessage);

function parseMessage(messageContent: PrivateMessage) {
  // Here is the part were we return if we got a PRIVMSG command;
  console.log(`${messageContent.username}: ${messageContent.message}`);

  // We have a message, maybe it's a bot command?
  if (messageContent.message.startsWith("!")) {
    // botCommand is an async function
    void runBotCommand(messageContent).then((response) =>
      sendChatMessage(response)
    );
  } else if (activeVote()) {
    // Otherwise the !rate or !vote message will be included
    // as the first vote...
    countVote(messageContent);

    // We would first have to start the vote
    // -> We need the reason for the vote / thing we're rating

    // When someone votes, we would like to push it to the overlay,
    // and have that automatically update
    console.log(countVotes());
  }
}

import * as vscode from "vscode";
import { downloadBadges } from "./twitch/user-badges.js";
import * as BetterTTV from "./betterttv";
import { Chat } from "ts-twitch-irc";
import {
  forwardCommand,
  forwardMessage,
  forwardNotice,
} from "./twitch/forward-chat.js";
import { Emotes, connect as connectToSevenTv } from "./seventv/index.js";
import { getEmoteSet } from "./seventv/api/get-emote-set.js";
import { getUserConnection } from "./seventv/api/get-user-connection.js";

import { createServer } from "./auth/create-server.js";
import { Token } from "./auth/token.js";
import { getUsers } from "./twitch/helix/get-users.js";
import { Pronouns } from "./pronouns.js";

const TWITCH_OAUTH2_AUTHORIZE = "https://id.twitch.tv/oauth2/authorize";
const CLIENT_ID = "ijwv3ayglee85mxz8pkpnjxvirbtu8"; // This is not a secret!
const BTTV_BOT_AVATAR = "https://cdn.betterttv.net/tags/bot.png";

export function activate(context: vscode.ExtensionContext) {
  // TODO: We can't read the config here, because it will require a restart to be read again
  // This is the context from where we'd connect to Twitch
  const configuration = vscode.workspace.getConfiguration("twitchChat");
  const clientId =
    configuration.get<{ clientId: string }>("authentication")?.clientId ||
    CLIENT_ID;
  const redirect = configuration.get<{ portNumber: string }>("redirect");

  if (typeof redirect?.portNumber !== "string") {
    throw new TypeError("Invalid configuration");
  }

  const token = new Token(context);
  void createServer(token.keepToken, redirect.portNumber);

  const scopes = ["chat:read"];
  context.subscriptions.push(
    vscode.commands.registerCommand("twitchChat.login", () => {
      const url = new URL(TWITCH_OAUTH2_AUTHORIZE);

      url.searchParams.set("client_id", clientId);
      url.searchParams.set(
        "redirect_uri",
        `http://localhost:${redirect.portNumber}`
      );
      url.searchParams.set("scope", scopes.join(" "));
      // TODO: Should be an option
      url.searchParams.set("force_verify", "true");
      url.searchParams.set("response_type", "token");

      vscode.env.openExternal(vscode.Uri.parse(url.toString()));
    })
  );

  const startChat = async () => {
    // Create and show a new webview
    const panel = vscode.window.createWebviewPanel(
      "twitchChat", // Identifies the type of the webview. Used internally
      "Twitch Chat", // Title of the panel displayed to the user
      vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
      {
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "static"),
        ],
        enableScripts: true,
      }
    );

    // And set its HTML content
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "static", "script.js")
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "static", "style.css")
    );

    panel.webview.html = "Waiting for a valid token";

    // Get a valid token or wait for a new one
    const accessToken = await token.getToken();

    if (!accessToken) {
      throw new Error("Failed to get a token!");
    }

    // Check if channelName is set
    let channelName = configuration.get<string>("channelName");
    let userId = accessToken?.user_id;
    if (channelName) {
      const userData = await getUsers(
        accessToken.token,
        accessToken.client_id,
        channelName
      );

      if (userData) {
        userId = userData.id;
      } else {
        console.error("Failed to get user data for:", channelName);
      }
    } else {
      channelName = accessToken.login;
    }

    panel.webview.html = getWebviewContent(panel, scriptUri, styleUri);

    // Connect to IRC
    const chat = new Chat(accessToken, () => accessToken, channelName);

    chat.on("privateMessage", (message) =>
      forwardMessage(panel, clientId, token, message)
    );
    chat.on("clearCommand", (command) => forwardCommand(panel, command));
    chat.on("userNotice", (notice) =>
      forwardNotice(panel, clientId, token, notice)
    );

    // TODO: There's a race condition happening here!
    //       Because there's no guarantee it's finished before we use it
    // Authenticate and download badges
    downloadBadges(accessToken);

    // Download pronouns descriptions
    void Pronouns.instance.init();

    void BetterTTV.UserBadges.instance.initGlobalBadges();
    const channelBots = await BetterTTV.Emotes.instance.init(userId);
    if (channelBots) {
      for (const botName of channelBots) {
        BetterTTV.UserBadges.instance.addBadge(botName, BTTV_BOT_AVATAR);
      }
    }
    void new BetterTTV.EventSocket(
      userId,
      BetterTTV.Emotes.instance,
      BetterTTV.UserBadges.instance
    );

    getEmoteSet().then((emotes) => {
      if (emotes) {
        Emotes.instance.addEmotes(emotes);
      }
    });

    getUserConnection(userId).then((emoteSet) => {
      if (emoteSet && emoteSet.id) {
        connectToSevenTv(emoteSet.id);
      }
      if (emoteSet && emoteSet.emotes) {
        Emotes.instance.addEmotes(emoteSet.emotes);
      }
    });

    panel.onDidDispose(
      () => {
        // When the panel is closed, cancel any future updates to the webview content
      },
      undefined,
      context.subscriptions
    );
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("twitchChat.start", startChat)
  );
}

function getWebviewContent(
  panel: vscode.WebviewPanel,
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource}
     https:; script-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="${scriptUri}"></script>
  <link href="${styleUri}" rel="stylesheet">
  <title>Twitch Chat</title>
</head>
<body>
  <div id="chat-container">
    <article id="chat-view">
    </article>
  </div>
</body>
</html>`;
}

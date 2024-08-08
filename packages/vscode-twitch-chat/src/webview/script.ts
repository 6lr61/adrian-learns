import type {
  BTTVModifer,
  WebViewCommand,
  WebViewMessage,
  WebViewNotice,
} from "../extension/types";

const TRANSPARENCY = 0.25;
const TIMEOUT_MILLIS = 60_000;
const DELETE_AFTER_MINUTES = 15;
// FIXME: This is gross, don't do it!
const USERNAME = "adrian_learns";

const modifierClassNames = {
  "h!": "flipx",
  "v!": "flipy",
  "w!": "wide",
  "r!": "rotate",
  "l!": "rotateLeft",
  "z!": "zerowidth",
  "c!": "cursed",
};

function displayTime(
  startTime: number,
  timerElement: HTMLElement,
  messageElement: HTMLElement
) {
  if (!document.body.contains(timerElement)) {
    console.error("displayTime: Element is gone!");
    return;
  }

  const elapsedTime = Date.now() - startTime;
  const minutes = new Date(elapsedTime).getMinutes();

  if (minutes > DELETE_AFTER_MINUTES) {
    if (messageElement instanceof HTMLElement) {
      messageElement.remove();
    }
    console.log("displayTime: removed parent element");
    return;
  }

  if (minutes > 0) {
    timerElement.textContent = `⧗ ${minutes}m`;
  }

  setTimeout(
    () => displayTime(startTime, timerElement, messageElement),
    TIMEOUT_MILLIS
  );
}

type ParsedTextNodes = Text | HTMLSpanElement;
function parseText(text: string): ParsedTextNodes[] {
  const mentions = text.matchAll(new RegExp(`@?${USERNAME}`, "g"));

  if (!mentions) {
    return [document.createTextNode(text)];
  }

  const nodes: ParsedTextNodes[] = [];
  let index = 0;
  for (const mention of mentions) {
    if (mention.index) {
      if (index <= mention.index) {
        nodes.push(document.createTextNode(text.slice(index, mention.index)));
      }

      const mentionElement = document.createElement("span");
      mentionElement.classList.add("mention");
      mentionElement.textContent = mention[0];
      nodes.push(mentionElement);

      index = mention.index + mention[0].length;
    }
  }

  if (index !== text.length) {
    nodes.push(document.createTextNode(text.slice(index)));
  }

  return nodes;
}

window.addEventListener("message", (event) => {
  console.debug("WebView", event.data);
  const chatMessage: WebViewMessage | WebViewCommand | WebViewNotice =
    event.data;
  const chatContainer = document.querySelector("#chat-view");

  if (!chatContainer) {
    console.error("WebView: Couldn't find the 'chat-view' element.");
    return; // There's nothing more we can do...
  }

  if (chatMessage.type === "command") {
    console.debug("WebView: Got a command", chatMessage);
    switch (chatMessage.command) {
      case "clear": {
        const messageElements = document.querySelectorAll(
          `[data-user-id="${chatMessage.userId}"]`
        );
        for (const element of messageElements) {
          element.remove();
        }
        break;
      }
      case "delete": {
        const message = document.querySelector(
          `#uuid-${chatMessage.messageId}`
        );

        if (message) {
          message.remove();
        } else {
          console.error(
            "WebView: Couldn't delete message with id:",
            chatMessage.messageId
          );
        }
        break;
      }
      default: {
        console.error("WebView: Recieve unknown command:", chatMessage);
      }
    }
  }

  if (chatMessage.type === "message") {
    // Message
    const messageElement = document.createElement("article");
    messageElement.classList.add("message");
    messageElement.id = `uuid-${chatMessage.messageId}`;
    messageElement.dataset.userId = chatMessage.userId;
    chatContainer.append(messageElement);

    const twitchColors = {
      BLUE: "#7ffbfb",
      GREEN: "#01e769",
      ORANGE: "#fa7901",
      PURPLE: "#9147ff",
    };

    if (chatMessage.firstMessage) {
      messageElement.classList.add("first-message");

      if (chatMessage.hightlightColor !== "PRIMARY") {
        messageElement.style.setProperty(
          "--first-message",
          twitchColors[chatMessage.hightlightColor]
        );
      }
    }

    if (chatMessage.highlighted) {
      messageElement.classList.add("highlighted");

      if (chatMessage.hightlightColor !== "PRIMARY") {
        messageElement.style.setProperty(
          "--highlight",
          twitchColors[chatMessage.hightlightColor]
        );
      }
    }

    // Profile picture
    const imageElement = chatMessage.profilePicture
      ? document.createElement("img")
      : document.createElement("div");
    imageElement.classList.add("profile-picture");
    messageElement.append(imageElement);

    if (chatMessage.profilePicture) {
      imageElement.setAttribute("src", chatMessage.profilePicture);
    } else {
      imageElement.style.backgroundColor = hexToRgba(
        chatMessage.color || "#000000"
      );
    }
    // End of profile picture

    // Message container
    const messageContainerElement = document.createElement("div");
    messageContainerElement.classList.add("message-container");
    messageElement.append(messageContainerElement);

    // Message header
    const headerElement = document.createElement("header");
    messageContainerElement.append(headerElement);
    headerElement.className = "message-header";

    if (chatMessage.color) {
      headerElement.style.backgroundColor = hexToRgba(chatMessage.color);
    }

    // Badges
    if (chatMessage.badges) {
      for (const badgeLink of chatMessage.badges) {
        const imageElement = document.createElement("img");
        imageElement.src = badgeLink;
        headerElement.append(imageElement);
      }
    }

    // Username and pronoun
    const usernameContainer = document.createElement("span");
    usernameContainer.classList.add("message-username-container");
    headerElement.append(usernameContainer);

    const displayName = document.createElement("p");
    usernameContainer.classList.add("displayname");
    displayName.textContent = chatMessage.displayName;
    usernameContainer.append(displayName);

    if (chatMessage.displayName.toLowerCase() !== chatMessage.username) {
      const userName = document.createElement("p");
      userName.classList.add("username");
      userName.textContent = `(${chatMessage.username})`;
      usernameContainer.append(userName);
    }

    if (chatMessage.pronoun) {
      const pronoun = document.createElement("span");
      pronoun.classList.add("pronoun");
      pronoun.textContent = `${chatMessage.pronoun}`;
      usernameContainer.append(pronoun);
    }

    // Time since posted
    const timerElement = document.createElement("p");
    timerElement.classList.add("message-timer");
    headerElement.append(timerElement);

    displayTime(Date.now(), timerElement, messageElement);

    // Reply parent message
    if (chatMessage.replyingToMessage) {
      // Header
      const replyParentHeader = document.createElement("div");
      messageContainerElement.append(replyParentHeader);
      replyParentHeader.classList.add("message-reply-header");
      replyParentHeader.textContent = `↳ Replying to: @${chatMessage.replyingToDisplayname}`;

      if (
        chatMessage.replyingToDisplayname?.toLocaleLowerCase() !==
        chatMessage.replyingToUsername
      ) {
        replyParentHeader.textContent += ` (${chatMessage.replyingToUsername})`;
      }

      // Message
      const replyParentMessage = document.createElement("div");
      messageContainerElement.append(replyParentMessage);
      replyParentMessage.classList.add("message-reply-body");
      replyParentMessage.textContent = chatMessage.replyingToMessage;
    }

    // Message body
    const bodyElement = document.createElement("section");
    bodyElement.classList.add("message-body");

    if (chatMessage.cursive) {
      bodyElement.classList.add("cursive");
    }

    const message = chatMessage.message;
    let start = 0;
    if ("replyingToMessage" in chatMessage) {
      start = message.match(/^@\w+ /g)?.[0].length || 0;
    }

    // If there's emotes, then we just set the text content  ¯\_ (ツ)_/¯
    if (chatMessage.emotes.length === 0) {
      bodyElement.append(...parseText(message.slice(start)));
    } else if (
      chatMessage.emotes[0] &&
      chatMessage.emotes[0].start === 0 &&
      chatMessage.emotes[0].stop === chatMessage.message.length - 1
    ) {
      const emoteImage = document.createElement("img");
      emoteImage.src = chatMessage.emotes[0].urlBig;
      bodyElement.append(emoteImage);
    } else {
      const modifiers: string[] = [];
      const stop = message.length;

      for (const emote of chatMessage.emotes) {
        // If there's any text before the emote, insert it:
        if (start <= emote.start) {
          bodyElement.append(...parseText(message.slice(start, emote.start)));

          if (start !== emote.start) {
            modifiers.length = 0; // Drop the modifiers if they're not in-front of an emote
          }

          if (emote.modifier) {
            modifiers.push(emote.modifier);
            start = emote.stop + 2;
          } else {
            const emoteImage = document.createElement("img");

            emoteImage.src =
              modifiers.includes("w!") ||
              message.match(/ /g)?.length === modifiers.length
                ? emote.urlBig
                : emote.urlSmall;

            emoteImage.setAttribute(
              "class",
              modifiers
                .map((modifier) => modifierClassNames[modifier as BTTVModifer])
                .join(" ")
            );

            modifiers.length = 0;

            bodyElement.append(emoteImage);
            start = emote.stop + 1;
          }
        }
      }

      // If there's any text after the last emote, insert it:
      // By coincidence, this also inserts text when there's no emotes
      if (start !== stop) {
        bodyElement.append(...parseText(message.slice(start, stop)));
      }
    }
    messageContainerElement.append(bodyElement);
  }

  if (chatMessage.type === "notice" && chatMessage.notice_type === "raid") {
    const noticeElement = document.createElement("section");
    noticeElement.classList.add("raid-notification");
    chatContainer.append(noticeElement);

    setTimeout(() => {
      if (document.contains(noticeElement)) {
        noticeElement.remove();
      }
    }, 15 * 60_000);

    noticeElement.style.backgroundImage = `url("${chatMessage.raiderPicture}")`;

    const raidInfoElement = document.createElement("div");
    raidInfoElement.classList.add("raid-info");
    noticeElement.append(raidInfoElement);

    const raidNameElement = document.createElement("p");
    raidNameElement.classList.add("raider-name");
    raidNameElement.textContent = chatMessage.raiderName;
    raidInfoElement.append(raidNameElement);

    const raidersAmountElement = document.createElement("p");
    raidersAmountElement.classList.add("raider-amount");
    raidersAmountElement.textContent = `Raided with ${chatMessage.numberOfRaiders} viewers!`;
    raidInfoElement.append(raidersAmountElement);
  }
});

function hexToRgba(color: string): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${TRANSPARENCY})`;
}

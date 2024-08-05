import { getUserID } from "../helix.js";
import { findNames, type CommandResponse } from "./commands.js";
import type { PrivateMessage } from "ts-twitch-irc";
import type { BotResponse } from "../runBotCommand.js";
import { randomInt } from "node:crypto";
import { BotStorage } from "../sqlite/BotStorage.js";

export const storage = new BotStorage("storage.db");

function findNumbers(input: string): number[] | undefined {
  const matches = input.match(/(?:^|\s)[\d]+(?:$|\s)/g);

  if (matches) {
    return matches.map((match) => Number(match));
  }
}

function userOwnsGift(userId: number, giftId: number): boolean {
  const inventory = storage.getGifts(userId);

  return inventory.map((gift) => gift.id).includes(giftId);
}

export async function giveGift(
  displayName: string,
  attributes: string,
  content: PrivateMessage
): Promise<CommandResponse> {
  const numbers = findNumbers(attributes);
  const names = findNames(attributes)?.filter(
    (name) => !numbers?.includes(Number(name))
  );

  if (numbers?.length !== 0 && names?.length === 0) {
    return {
      type: "error",
      message: `Can't tell users and numbers apart, please @-them`,
      userId: content.tags.user_id,
    };
  }

  const recipient = names?.[0];

  if (!recipient) {
    return {
      type: "error",
      message: `Please mention someone you want to give a gift to! Usage: !give @user`,
      userId: content.tags.user_id,
    };
  }

  if (
    displayName.toLowerCase() === recipient.toLowerCase() ||
    content.username === recipient.toLocaleLowerCase()
  ) {
    return {
      type: "reply",
      message: `Don't be greedy, @${
        content.tags?.display_name || content.username
      }`,
      messageId: content.tags.id,
    };
  }

  let recipientUserId = storage.getUserId(recipient);

  if (recipientUserId === undefined) {
    const recipientLoginName = recipient.toLowerCase().match(/[\w]+/g)?.[0];

    if (!recipientLoginName) {
      return {
        type: "error",
        message: `Can't create an inventory for ${recipient} based on their display name alone.`,
        userId: content.tags.user_id,
      };
    }

    const userData = await getUserID(recipient.toLowerCase());

    if (!userData) {
      return {
        type: "error",
        message: `${recipient} is not an active username?`,
        userId: content.tags.user_id,
      };
    }

    recipientUserId = Number(userData.id);

    const result = storage.upsertUser(
      Number(userData.id),
      userData.login_name,
      userData.display_name
    );

    if (!result || result?.changes === 0) {
      return {
        type: "error",
        message: `Failed to create an inventory for ${recipient}`,
        userId: content.tags.user_id,
      };
    }
  }

  const giversInventory = storage.getGifts(Number(content.tags.user_id));

  if (giversInventory.length === 0) {
    return {
      type: "error",
      message: `You don't seem to have any gifts to give away?`,
      messageId: content.tags.id,
    };
  }

  let giftId = numbers?.[0];

  if (giftId && giversInventory.every((gift) => gift.id !== giftId)) {
    return {
      type: "error",
      message: `You don't own gift with id: ${giftId}?`,
      messageId: content.tags.id,
    };
  }

  if (!giftId) {
    giftId = giversInventory.map((gift) => gift.id)[
      randomInt(giversInventory.length)
    ] as number;
  }

  const result = storage.updateGiftOwner(
    giftId,
    Number(content.tags.user_id),
    Number(recipientUserId)
  );

  if (result.changes === 0) {
    return {
      type: "error",
      message: `Failed to give away the gift to @${recipient}`,
      userId: content.tags.user_id,
    };
  }

  const gift = storage.getGift(giftId);

  if (!gift) {
    return {
      type: "error",
      message: `Sorry @${displayName}, but I think I lost the gift after storing it...`,
      userId: content.tags.user_id,
    };
  }

  return {
    type: "chat",
    message: `${displayName} gave ${gift.desc} (id: ${gift.id}) to @${recipient}`,
  };
}

export async function takeGift(
  displayName: string,
  attributes: string,
  content: PrivateMessage
): Promise<CommandResponse> {
  const numbers = findNumbers(attributes);
  const names = findNames(attributes)?.filter(
    (name) => !numbers?.includes(Number(name))
  );

  if (numbers?.length !== 0 && names?.length === 0) {
    return {
      type: "error",
      message: `Can't tell users and numbers apart, please @-them`,
      userId: content.tags.user_id,
    };
  }

  const giver = names?.[0];

  if (!giver) {
    return {
      type: "error",
      message: `The "!take" command needs a username.`,
      messageId: content.tags.id,
    };
  }

  if (
    displayName.toLowerCase() === giver.toLowerCase() ||
    content.username === giver.toLocaleLowerCase()
  ) {
    return {
      type: "reply",
      message: `Don't be selfish, @${displayName}`,
      messageId: content.tags.id,
    };
  }

  const giverUserId = storage.getUserId(giver);

  if (giverUserId === undefined) {
    return {
      type: "error",
      message: `I don't know anyone called @${giver}?`,
      userId: content.tags.user_id,
    };
  }

  const giverInventory = storage.getGifts(giverUserId);

  if (giverInventory.length === 0) {
    return {
      type: "error",
      message: `There's nothing to take from @${giver}.`,
      messageId: content.tags.id,
    };
  }

  if (numbers?.[0] && !giverInventory.some((gift) => gift.id === numbers[0])) {
    return {
      type: "error",
      message: `@${giver} doesn't own that gift? (id: ${numbers[0]})`,
      userId: content.tags.user_id,
    };
  }

  if (!(randomInt(100) < 10)) {
    return {
      type: "reply",
      message: `Failed to take a gift from @${giver}.`,
      messageId: content.tags.id,
    };
  }

  const randomGiftId = giverInventory.map((gift) => gift.id)[
    randomInt(giverInventory.length)
  ] as number;

  const result = storage.updateGiftOwner(
    numbers?.[0] || randomGiftId,
    giverUserId,
    Number(content.tags.user_id)
  );

  if (result.changes === 0) {
    return {
      type: "error",
      message: `Sorry @${displayName}, I couldn't hand over the gift (${
        numbers?.[0] || randomGiftId
      }) to you...`,
      userId: content.tags.user_id,
    };
  }

  const gift = storage.getGift(numbers?.[0] || randomGiftId);

  return {
    type: "chat",
    message: `${displayName} took ${gift?.desc} (id: ${gift?.id}) from @${giver} Yoink`,
  };
}

export function getRandomGift(
  name: string,
  _attr: unknown,
  content: PrivateMessage
): CommandResponse {
  storage.upsertUser(
    Number(content.tags.user_id),
    content.username,
    content.tags.display_name || content.username
  );

  const giftId = storage.makeGift(Number(content.tags.user_id));

  if (giftId === -1) {
    return {
      type: "whisper",
      message: `Sorry @${name}, something went wrong when making a new gift...`,
      userId: content.tags.user_id,
    };
  }

  const gift = storage.getGift(giftId);

  if (!gift) {
    return {
      type: "whisper",
      message: `Sorry @${name}, I lost the newly created gift...`,
      userId: content.tags.user_id,
    };
  }

  return {
    type: "reply",
    message: `Here you go! It's ${gift.desc}! (id: ${gift.id})`,
    messageId: content.tags.id,
  };
}

export function listUserInventory(content: PrivateMessage): BotResponse {
  const gifts = storage.getGifts(Number(content.tags.user_id));

  if (gifts.length === 0) {
    return {
      type: "reply",
      message: `You don't seem to have collected any gifts so far?`,
      messageId: content.tags.id,
    };
  }

  return {
    type: "whisper",
    userId: content.tags.user_id,
    message: `Your current gift collection consist of: ${gifts
      .map((gift) => {
        const [id, desc] = Object.values(gift);
        return `(${id}) ${desc}`;
      })
      .join(", ")}`,
  };
}

export async function listItems(
  _name: unknown,
  _attr: unknown,
  content: PrivateMessage
): Promise<CommandResponse> {
  const giftItemEntries = storage.getGiftItems();

  if (!giftItemEntries) {
    return {
      type: "error",
      messageId: content.tags.id,
      message: "Sorry, I failed to get gift item descriptions",
    };
  }

  const attributes = giftItemEntries.map((gift) => gift.item_desc);

  return {
    type: "whisper",
    userId: content.tags.user_id,
    message: `The !gift command can give you one of the following items: ${attributes.join(
      ", "
    )}`,
  };
}

export async function listAttributes(
  _name: unknown,
  _attr: unknown,
  content: PrivateMessage
): Promise<CommandResponse> {
  const giftAttributeEntries = storage.getGiftAttributes();

  if (!giftAttributeEntries) {
    return {
      type: "error",
      messageId: content.tags.id,
      message: "Sorry, I failed to get gift attributes",
    };
  }

  const attributes = giftAttributeEntries.map((gift) => gift.attr_desc);

  return {
    type: "whisper",
    userId: content.tags.user_id,
    message: `The a gift can have one of the following attributes: ${attributes.join(
      ", "
    )}`,
  };
}

export function getGiftDescription(
  name: string,
  attributes: string,
  content: PrivateMessage
): BotResponse {
  const giftId = findNumbers(attributes)?.[0];

  if (giftId === undefined) {
    return {
      type: "error",
      message: "I need a gift ID to look up? Usage: !gift number",
      messageId: content.tags.id,
    };
  }

  const lookup = storage.getGift(giftId);

  if (!lookup) {
    return {
      type: "error",
      message: `I couldn't find a gift with ID: ${giftId}`,
      userId: content.tags.user_id,
    };
  }

  const owner = storage.getGiftOwner(giftId);

  return {
    type: "reply",
    message: `The gift with id: ${lookup.id} is ${lookup.desc}, owned by ${owner?.display_name}`,
    messageId: content.tags.id,
  };
}

export function respinGiftAttribute(
  name: string,
  attributes: string,
  content: PrivateMessage
): BotResponse {
  const numbers = findNumbers(attributes);

  if (!numbers || numbers?.[0] === 0 || typeof numbers[0] !== "number") {
    return {
      type: "error",
      message:
        "Please specify a gift to respin the attribute on! Usage: !respin giftId (number)",
      messageId: content.tags.id,
    };
  }

  const giftId = numbers[0];

  if (!userOwnsGift(Number(content.tags.user_id), giftId)) {
    return {
      type: "error",
      message: "You don't own that gift!?",
      messageId: content.tags.id,
    };
  }

  const oldGift = storage.getGift(giftId);

  const result = storage.setRandomGiftAttribute(
    giftId,
    Number(content.tags.user_id)
  );

  if (!result) {
    return {
      type: "error",
      message: `Failed to respin the attribute on gift ${giftId}`,
      userId: content.tags.user_id,
    };
  }

  const newGift = storage.getGift(giftId);

  return {
    type: "reply",
    message: `Respun gift with id: ${giftId} from ${oldGift?.desc} into ${newGift?.desc} pauseCat`,
    messageId: content.tags.id,
  };
}

export function getChattersWithMostGifts(): CommandResponse {
  const topTen = storage.topTen();

  if (topTen) {
    return {
      type: "chat",
      message: `The top 10 chatters with most gifts are: ${topTen
        .map((entry) => {
          const name =
            entry.display_name.toLowerCase() === entry.login_name
              ? entry.display_name
              : `${entry.display_name} (${entry.login_name})`;

          return `${entry.gift_count}) ${name}`;
        })
        .join(", ")}`,
    };
  } else {
    console.error("getChattersWithMostGifts: No data from DB");
  }
}

export function getGiftCount(
  username: string | undefined,
  content: PrivateMessage
): CommandResponse {
  const name = username ? username : content.username;

  const giftCount = storage.countGifts(name);

  if (giftCount !== undefined) {
    return {
      type: "reply",
      messageId: content.tags.id,
      message: username
        ? `${username} has ${giftCount} gifts.`
        : `You have ${giftCount} gifts.`,
    };
  } else {
    return {
      type: "reply",
      messageId: content.tags.id,
      message: username
        ? "It doesn't look like they have any gifts? confusedCat"
        : "Doesn't look like you have any gifts? confusedCat",
    };
  }
}

// !gift: add item bla bla bla
// !gift: add attr bla bla bla
export function giftPrompt(
  name: string,
  attr: string,
  content: PrivateMessage
): CommandResponse {
  const parts = attr.split(" ");
  const command = parts[0];
  const argument = parts[1];
  const thing = parts.slice(2).join(" ").trim();

  if (!thing) {
    return {
      message:
        "The !gift: command takes an argument and a description. " +
        "Usage: !gift: <add> <attr[ibute]|item> <description>",
      type: "error",
      messageId: content.tags.id,
    };
  }

  if (thing.match(/[\d\p{Letter} ]+/gu)?.[0].length !== thing.length) {
    return {
      message: "The description can't contain any special characters",
      type: "error",
      messageId: content.tags.id,
    };
  }

  switch (command) {
    case "add":
      switch (argument) {
        case "attr":
        case "attribute": {
          const result = storage.addAttribute(thing);

          if (result) {
            return {
              message: `Added ${thing} as a new gift attribute`,
              type: "chat",
            };
          }

          return {
            message: "Something went wrong when trying to add a new attribute",
            type: "error",
            messageId: content.tags.id,
          };
        }
        case "item":
          {
            const result = storage.addItem(thing);

            if (result) {
              return {
                message: `Added ${thing} as a new gift item`,
                type: "chat",
              };
            }

            return {
              message: "Something went wrong when trying to add a new item",
              type: "error",
              messageId: content.tags.id,
            };
          }
          break;
        default:
          return {
            message: "Bad argument for !gift:, accepts attr[ibute] or item",
            type: "error",
            messageId: content.tags.id,
          };
      }
      break;
    default:
      return {
        message: "That's not a valid !gift: command?",
        type: "error",
        messageId: content.tags.id,
      };
  }
}

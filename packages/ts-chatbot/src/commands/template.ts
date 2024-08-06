import type { PrivateMessage } from "ts-twitch-irc";

// "template": "Here you go {%username%}, it's {from:attributes} {from:items}!",

// !addcommand !tkap "That's a problem!"

// !command add !hello "Hello, {%username%}!"

/*
 * Features that would be nice:
 *
 *  1) Command variables: username, toUser
 *  2) Counters, count up / down
 *  3) Say in chat, Mention user or Reply to user
 */

export interface CommandDescription {
  template: string;
  response: "say" | "mention" | "reply";
  content?: Record<string, string[]>;
}

// REMOVE BEFORE FLIGHT

// !add <command> <templateString>

// !modify <command>

// !remove <command>

// !set <command> response say

const gift: CommandDescription = {
  template: "Here you go {%username%}, it's {from:attributes} {from:items}!",
  response: "say",
  content: { attributes: ["a pink", "a brown"], items: ["stone", "chair"] },
};

const testMessage = {
  username: "adriandotjs",
  message: "!gift",
  tags: {
    display_name: "AdrianDotJS",
  },
} as PrivateMessage;

console.log(parseTemplate(testMessage, gift));

/////////

function pickFrom(list: string[]): string {
  const randomIndex = Math.floor(Math.random() * list.length);

  return list[randomIndex] || "";
}

function parseTemplate(message: PrivateMessage, command: CommandDescription) {
  let response = command.template;
  // System %variables%
  const systemVariables = command.template.match(/{%[:\w]+%}/g);

  for (const variable of systemVariables ?? []) {
    switch (variable) {
      case "{%username%}":
        response = response.replace(
          variable,
          message.tags.display_name || message.username,
        );
        break;
    }
  }

  const commandVariables = command.template.match(/{[:\w]+}/g);

  for (const variable of commandVariables ?? []) {
    if (variable.startsWith("{from:")) {
      const listName = variable.replace("{from:", "").replace("}", "");

      if (!command.content) {
        continue;
      }

      const list = command.content[listName];

      if (!list) {
        continue;
      }

      response = response.replace(variable, pickFrom(list));
    }
  }

  return response;
}

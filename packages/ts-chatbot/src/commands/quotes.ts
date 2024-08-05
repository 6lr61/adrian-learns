import { botStorage } from "../botStorage.js";
import type { CommandResponse } from "./commands.js";
import { randomInt } from "crypto";

export function getQuote(attr: string): CommandResponse {
  const quotes = botStorage.get("quotes", []);

  if (quotes.length === 0) {
    return {
      type: "chat",
      message: "Adrian hasn't said anything notable?",
    };
  }

  const numberInput = Number(attr.match(/^\d+/g)?.[0]);
  const randomNumber = randomInt(quotes.length);

  if (!Number.isNaN(numberInput) && numberInput < quotes.length) {
    return {
      type: "chat",
      message: `#${numberInput}: ${quotes[numberInput]}`,
    };
  }

  return {
    type: "chat",
    message: `#${randomNumber}: ${quotes[randomNumber]}`,
  };
}

export function setQuote(quote: string): CommandResponse {
  const quotes = botStorage.get("quotes", []);
  quotes.push(quote);
  botStorage.set("quotes", quotes);

  return {
    type: "chat",
    message: `Added quote #${quotes.length - 1}: ${quote}`,
  };
}

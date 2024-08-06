import { events } from "./events/events.js";
import {
  EventSubscription,
  EventSubRequestBody,
} from "./events/types/eventSubRequest.js";
import { readFileSync } from "node:fs";

const CONFIG_FILE = "config.json";

interface ConfigurationFile {
  subscribeToEvent: Record<string, boolean>;
}

export async function subscribeToEvents(sessionId: string): Promise<void> {
  const configuration = JSON.parse(
    readFileSync(CONFIG_FILE, "utf-8")
  ) as ConfigurationFile;
  const eventList = configuration.subscribeToEvent;

  for (const event of events) {
    if (eventList[event.type]) {
      void subscribeToEvent(sessionId, event);
    }
  }
}

async function subscribeToEvent(
  sessionID: string,
  request: EventSubscription
): Promise<boolean> {
  const requestBody: EventSubRequestBody = {
    type: request.type,
    version: request.version,
    condition: request.condition,
    transport: {
      method: "websocket",
      session_id: sessionID,
    },
  };

  const response = await fetch(process.env.TWITCH_SUBSCRIBE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
      "Client-Id": `${process.env.CLIENT_ID}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.debug(response);

  return response.ok;
}

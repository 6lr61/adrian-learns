import { WebSocket } from "ws";
import type { UserBadges } from ".";
import type { Emotes } from "./emotes";
import type { Emote } from "./types";

const BTTV_WEBSOCKETSERVER = "wss://sockets.betterttv.net/ws";

type BTTVWebSocketEvent =
  | UserUpdateEvent
  | EmoteCreateEvent
  | EmoteDeleteEvent
  | EmoteUpdateEvent;

interface UserUpdateEvent {
  name: "lookup_user";
  data: {
    name: string;
    providerId: string;
    channel: string;
    pro: true;
    emotes: Emote[];
    badge?: {
      url: string;
      startedAt?: string;
    };
  };
}

interface EmoteCreateEvent {
  name: "emote_create";
  data: {
    emote: Emote;
    channel: string; // "twitch:38974721"
  };
}

interface EmoteDeleteEvent {
  name: "emote_delete";
  data: {
    emoteId: string;
    channel: string;
  };
}

interface EmoteUpdateEvent {
  name: "emote_update";
  data: {
    emote: {
      id: string;
      code: string;
    };
    channel: string;
  };
}

export class EventSocket {
  private emotes: Emotes;
  private badges: UserBadges;
  private ws: WebSocket;

  constructor(userId: string, emotes: Emotes, badges: UserBadges) {
    this.emotes = emotes;
    this.badges = badges;
    this.ws = new WebSocket(BTTV_WEBSOCKETSERVER);

    this.ws.on("open", () => {
      const joinMessage = {
        name: "join_channel",
        data: {
          name: `twitch:${userId}`,
        },
      };

      this.ws.send(JSON.stringify(joinMessage));
    });

    this.ws.on("message", (data) => {
      const message = JSON.parse(data.toString()) as BTTVWebSocketEvent;
      switch (message.name) {
        case "lookup_user": {
          if (message.data.badge) {
            this.badges.addBadge(message.data.name, message.data.badge.url);
          }
          break;
        }
        case "emote_create": {
          this.emotes.add(message.data.emote);
          break;
        }
        case "emote_delete": {
          this.emotes.remove(message.data.emoteId);
          break;
        }
        case "emote_update": {
          const emote = message.data.emote;
          this.emotes.rename(emote.id, emote.code);
          break;
        }
      }
    });
  }
}

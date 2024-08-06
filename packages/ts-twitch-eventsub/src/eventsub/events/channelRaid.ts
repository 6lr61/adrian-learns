import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelRaidNotificationPayload = NotificationPayloadTemplate & {
  subscription: {
    type: "channel.raid";
    condition: ChannelRaidCondition;
  };
  event: ChannelRaidEvent;
};

interface ChannelRaidCondition {
  from_broadcaster_user_id?: string; // Broadcaster user ID that created the channel raid
  to_broadcaster_user_id?: string; // Broadcaster user ID that received the channel raid
}

export interface ChannelRaidEvent {
  from_broadcaster_user_id: string; // Creator of the raid
  from_broadcaster_user_login: string;
  from_broadcaster_user_name: string;
  to_broadcaster_user_id: string; // Receiver of the raid
  to_broadcaster_user_login: string;
  to_broadcaster_user_name: string;
  viewers: number;
}

export const channelRaid: EventSubscription = {
  type: "channel.raid",
  version: "1",
  condition: {
    to_broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: [], // no authorization required
  },
};

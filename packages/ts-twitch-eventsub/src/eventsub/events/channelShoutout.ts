import { EventSubscription } from "./types/eventSubRequest.js";
import { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelShoutoutNotificationPayload = NotificationPayloadTemplate & {
  subscription: {
    type: "channel.shoutout.create";
    condition: ChannelShoutoutCondition;
  };
  event: ChannelShoutoutEvent;
};

interface ChannelShoutoutCondition {
  broadcaster_user_id: string;
  moderator_user_id: string;
}

export interface ChannelShoutoutEvent {
  broadcaster_user_id: string;
  broadcaster_user_name: string;
  broadcaster_user_login: string;
  moderator_user_id: string;
  moderator_user_name: string;
  moderator_user_login: string;
  to_broadcaster_user_id: string;
  to_broadcaster_user_name: string;
  to_broadcaster_user_login: string;
  viewer_count: number;
  /** UTC timpestamp */
  started_at: string;
  /** UTC timpestamp */
  cooldown_ends_at: string;
  /** UTC timpestamp */
  target_cooldown_ends_at: string;
}

export const channelShoutout: EventSubscription = {
  type: "channel.shoutout.create",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
    moderator_user_id: process.env.MODERATOR_USER_ID,
  },
  authorization: {
    scope: ["moderator:read:shoutouts", "moderator:manage:shoutouts"],
  },
};

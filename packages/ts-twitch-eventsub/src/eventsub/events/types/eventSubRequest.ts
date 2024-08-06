import { NotificationPayloadTemplate } from "./notificationMessage.js";

export interface EventSubRequestBody
  extends Omit<EventSubscription, "authorization"> {
  transport: EventSubTransport;
}

export interface EventSubscription {
  readonly type: string;
  readonly version: "1" | "2";
  readonly condition: EventSubCondition;
  readonly authorization: {
    scope: readonly string[];
  };
}

interface EventSubCondition {
  readonly broadcaster_user_id?: string;
  readonly moderator_user_id?: string;
  readonly from_broadcaster_user_id?: string;
  readonly to_broadcaster_user_id?: string;
}

export interface EventSubTransport {
  method: string;
  session_id: string;
}

export type EventSubRequestResponse = NotificationPayloadTemplate;

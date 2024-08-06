import { NotificationPayload } from "./events/types/notificationMessage.js";

export type EventSubListener = (payload: NotificationPayload) => void;

export function eventListener(payload: NotificationPayload): void {
  console.log(payload);
}

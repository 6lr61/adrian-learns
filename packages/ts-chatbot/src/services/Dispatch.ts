import type { Chat } from "ts-twitch-irc";
import type { Helix, HighlightColor } from "ts-twitch-helix";

export class Dispatch {
  constructor(private chat: Chat, private helix: Helix) {}

  announce(message: string, color?: HighlightColor): void {
    this.helix.chat.announcements.post(
      { broadcasterId: process.env.BROADCASTER_ID },
      { message, color },
    );
  }

  say(message: string): void {
    this.chat.send(message);
  }

  shoutout(username: string): void {
    this.helix.users
      .get({ login: username })
      .then((data) => {
        const userData = data[0];

        if (!userData) {
          throw new Error("shoutout: couldn't find user");
        }

        this.helix.chat.shoutouts.post({
          fromBroadcasterId: process.env.BROADCASTER_ID,
          toBroadcasterId: userData.id,
        });
      })
      .catch((error) => console.error(error));
  }

  reply(messageId: string, message: string): void {
    this.chat.sendReply(messageId, message);
  }

  whisper(userId: string, message: string): void {
    this.helix.whispers.post({ toUserId: userId }, { message });
  }

  error(message: string, options?: { userId?: string; messageId?: string }) {
    if (options) {
      if (options.userId) {
        this.whisper(options.userId, message);
      } else if (options.messageId) {
        this.chat.sendReply(options.messageId, message);
      }
    } else {
      this.chat.send(message);
    }
  }
}

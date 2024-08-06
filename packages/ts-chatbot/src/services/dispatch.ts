import type { Chat } from "ts-twitch-irc";

type WhisperCallback = (userId: string, message: string) => void;

export class Dispatch {
  constructor(private chat: Chat, private whisperCallback: WhisperCallback) {}

  say(message: string): void {
    this.chat.send(message);
  }

  reply(messageId: string, message: string): void {
    this.chat.sendReply(messageId, message);
  }

  whisper(userId: string, message: string): void {
    this.whisperCallback(userId, message);
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

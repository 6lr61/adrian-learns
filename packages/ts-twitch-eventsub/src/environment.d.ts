declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLIENT_ID: string;
      CLIENT_SECRET: string;
      BROADCASTER_USER_ID: string;
      MODERATOR_USER_ID: string;
      TWITCH_EVENTSUB: string;
      TWITCH_SUBSCRIBE_API: string;
      TOKEN: string;
    }
  }
}

export {};

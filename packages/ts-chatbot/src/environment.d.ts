declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLIENT_ID: string;
      CLIENT_SECRET: string;
      BROADCASTER_LOGIN: string;
      USER_LOGIN: string;
      CHANNEL: string;
      USER_ID: string;
      BROADCASTER_ID: string;
    }
  }
}

export {};

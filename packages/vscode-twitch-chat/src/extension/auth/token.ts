import type * as Chat from "ts-twitch-irc";
import type * as vscode from "vscode";

const TWITCH_OAUTH2_VALIDATE = "https://id.twitch.tv/oauth2/validate";

type ResponseData = ValidTokenResponse | InvalidTokenResponse;

interface ValidTokenResponse {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
}

interface InvalidTokenResponse {
  status: number;
  message: string;
}

export class Token {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async store(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      await this.context.secrets.store(key, value);
    }
  }

  private static async validateToken(
    token: string,
  ): Promise<ValidTokenResponse | undefined> {
    try {
      // TODO: We might need to retry this, because this endpoint
      //       is really that bad!
      const response = await fetch(TWITCH_OAUTH2_VALIDATE, {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Bad HTTP response: ${response.status}, ${response.statusText}`,
        );
      }

      const data = (await response.json()) as ResponseData;

      if ("status" in data) {
        throw new Error(`Invalid token: ${data.status}, ${data.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Token#validateToken:", error.message);
      } else {
        console.error("Token#validateToken:", error);
      }

      return;
    }
  }

  keepToken = (accessToken: string, scope: string) =>
    this.storeToken(accessToken, scope);

  private async storeToken(accessToken: string, scope: string): Promise<void> {
    // TODO: Figure out a way to restart the login process instead of crashing
    const tokenDetails = (await Token.validateToken(
      accessToken,
    )) as ValidTokenResponse; // If it throws this is never evaluated

    const token: Chat.Token = {
      ...tokenDetails,
      token: accessToken,
      scopes: scope.split(" "),
      expires: Date.now() + Number(tokenDetails.expires_in) * 1000 - 60_000,
    };

    await this.context.secrets.store("token", JSON.stringify(token));
  }

  async borrowToken(): Promise<Chat.Token | undefined> {
    const data = await this.context.secrets.get("token");

    if (data === undefined) {
      console.error("Token.borrowToken: Failed to get token");
      return;
    }

    const token = JSON.parse(data) as Chat.Token;

    if (token.expires < Date.now()) {
      throw new Error("Token has expired!");
    }

    return token;
  }

  async getToken(): Promise<Chat.Token | null> {
    // TODO: Figure out how to tell something that the token has expired
    try {
      const data = await this.context.secrets.get("token");

      if (data === undefined) {
        throw new Error("Secret Storage entry is empty?");
      }

      const token = JSON.parse(data) as Chat.Token;

      const response = await Token.validateToken(token.token);

      if (!response) {
        throw new Error("The token from the secret storage isn't valid!");
      }

      return token;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Token.getToken:", error.message);
      } else {
        console.error("Token.getToken:", error);
      }

      console.debug("Token.getToken: Waiting for new token");

      const wait = await new Promise((resolve) =>
        this.context.secrets.onDidChange(async () => resolve(this.getToken())),
      );

      return wait as Chat.Token | null;
    }
  }
}

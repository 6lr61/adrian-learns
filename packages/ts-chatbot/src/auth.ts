import { readFileSync, writeFileSync } from "node:fs";
import type { Token } from "ts-twitch-irc";

const TWITCH_API = "https://id.twitch.tv/oauth2";
const TOKENS_FILE = "tokens.json";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

let TOKENS: Tokens = JSON.parse(readFileSync(TOKENS_FILE, "utf8")); // might throw

if (!("access_token" in TOKENS && "refresh_token" in TOKENS)) {
  throw new Error(`Couldn't read in tokens from ${TOKENS_FILE}`);
}

interface ValidTokenResponse {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: string;
}

interface InvalidTokenResponse {
  status: number;
  message: string;
}

interface ValidRefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  scope: string[];
  token_type: string;
}

interface InvalidRefreshTokenResponse {
  error: string;
  status: number;
  message: string;
}

// Try to get a valid token or refresh the token
export async function getToken(): Promise<Token> {
  function assembleToken(response: ValidTokenResponse): Token {
    const expires = Date.now() + Number(response.expires_in) * 1_000 - 60_000;
    return {
      ...response,
      token: TOKENS.access_token,
      expires: expires,
    };
  }

  let response = await validateToken(TOKENS.access_token);

  if (response) {
    return assembleToken(response);
  } else {
    if (await refreshToken()) {
      response = await validateToken(TOKENS.access_token);

      if (response) {
        return assembleToken(response);
      }
    }
  }

  throw new Error("Failed to acquire a valid OAuth token");
}

async function twitchValidateToken(
  accessToken: string,
  timeout = 30_000,
  attemptsLeft = 5,
): Promise<Response | null> {
  try {
    if (attemptsLeft === 0) {
      return null;
    }

    return await fetch(`${TWITCH_API}/validate`, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    console.error("validateToken:", error);
    return await twitchValidateToken(
      accessToken,
      timeout + 30_000,
      attemptsLeft - 1,
    );
  }
}

export function borrowToken(): Token {
  const token = {
    login: process.env.BROADCASTER_LOGIN,
    user_id: process.env.BROADCASTER_ID,
    client_id: process.env.CLIENT_ID,
    scopes: [],
    expires: 0,
    token: TOKENS.access_token,
  };

  return token;
}

async function validateToken(
  accessToken: string,
): Promise<ValidTokenResponse | null> {
  /*
    1) The request might time out => TypeError from .json I think?
    2) The connection is dropped early?
  */

  const response = await twitchValidateToken(accessToken);
  if (!response) {
    throw new Error("Failed to validate the token");
  }

  const data = (await response.json()) as
    | ValidTokenResponse
    | InvalidTokenResponse;

  if ("status" in data) {
    console.error("validateToken: Got bad response", data.status, data.message);
    return null;
  }

  return data;
}

async function refreshToken() {
  // TODO: Write a .catch()
  const response = await fetch(`${TWITCH_API}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: TOKENS.refresh_token as string,
    }),
  });
  const data = (await response.json()) satisfies
    | ValidRefreshTokenResponse
    | InvalidRefreshTokenResponse;

  if ("status" in data) {
    console.error("refreshToken: Got bad response:", data.status, data.message);
    return false;
  }

  TOKENS = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };

  writeFileSync(TOKENS_FILE, JSON.stringify(TOKENS));

  return true;
}

import type { GetUsersResponse, UserData } from "../types";

export async function getUsers(
  accessToken: string,
  clientId: string,
  loginName: string,
): Promise<UserData | undefined> {
  const ENDPOINT_URL = "https://api.twitch.tv/helix/users";
  const url = new URL(ENDPOINT_URL);
  url.searchParams.set("login", loginName);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Bad HTTP response: ${response.status}: ${response.statusText}`,
      );
    }

    const result = (await response.json()) as GetUsersResponse;

    if (result.data.length === 0) {
      throw new Error("No user data");
    }

    return result.data[0];
  } catch (error) {
    if (error instanceof Error) {
      console.error("getUsers:", error.message);
      return;
    }

    console.error("getUsers:", error);
    return;
  }
}

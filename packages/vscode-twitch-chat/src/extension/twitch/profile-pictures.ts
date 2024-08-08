import type { Token } from "../auth/token.js";
import { getUsers } from "./helix/get-users.js";

export const profilePictures = new Map<string, ProfilePicture>();

interface ProfilePicture {
  url: string;
  vaildUntil: number;
}

export async function getProfilePicture(
  username: string,
  clientId: string,
  token: Token
): Promise<string | undefined> {
  const picture = profilePictures.get(username);
  const loginToken = await token.borrowToken();

  if (picture && picture.vaildUntil > Date.now()) {
    return picture.url;
  }

  if (!loginToken) {
    console.error("getProfiePictures: Couldn't get an access token");
    return;
  }

  const userData = await getUsers(loginToken.token, clientId, username);

  if (!userData) {
    console.error("getProfilePictures: Failed to get user data");
    return;
  }

  const profileImageUrl = userData.profile_image_url.replaceAll(
    /\d+x\d+/g,
    "70x70"
  );
  profilePictures.set(username, {
    url: profileImageUrl,
    vaildUntil: Date.now() + 10 * 60 * 1000,
  });

  return profileImageUrl;
}

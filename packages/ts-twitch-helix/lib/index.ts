import { Helix } from "./api/Helix.js";

const clientsResponse = await fetch("http://localhost:8080/units/clients");
const { ID: clientId, Secret: clientSecret } = (await clientsResponse.json())
  .data[0];

const userId = "52175458";
const username = "davedave148";

const url = new URL("http://localhost:8080/auth/authorize");
url.searchParams.set("client_id", clientId);
url.searchParams.set("client_secret", clientSecret);
url.searchParams.set("grant_type", "user_token");
url.searchParams.set("user_id", userId);
url.searchParams.set("scope", "user:read:email user:edit");

const authorizeResponse = await fetch(url, {
  method: "POST",
});
const {
  access_token: accessToken,
  expires_in: expiresIn,
  scope: scopes,
} = await authorizeResponse.json();

const auth = {
  userId,
  username,
  accessToken,
  clientId,
  expires: new Date(Date.now() + expiresIn * 1000),
  scopes,
};

const helix = new Helix(auth, "http://localhost:8080/mock");

const user = await helix.users.get({ id: userId });
console.log(user);
const user2 = await helix.users.put({ description: "Hello, world!" });
console.log(user2);

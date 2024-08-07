interface Token {
  login: string;
  user_id: string;
  client_id: string;
  scopes: string[];
  /** Unix timestamp in milliseconds */
  expires: number;
  token: string;
}

interface Auth {
  userId: string;
  username: string;
  accessToken: string;
  clientId: string;
  expires: Date;
  scopes: string[];
}

export function tokenToAuth(token: Token): Auth {
  return {
    userId: token.user_id,
    username: token.login,
    accessToken: token.token,
    clientId: token.client_id,
    expires: new Date(token.expires),
    scopes: token.scopes,
  };
}

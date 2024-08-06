import { Users } from "./endpoint/Users.js";

interface Auth {
  userId: string;
  username: string;
  accessToken: string;
  clientId: string;
  expires: Date;
  scopes: string[];
}

export type QueryParameters = Record<string, string | string[] | undefined>;

export class Helix {
  constructor(
    private auth: Auth,
    private baseUrl = "https://api.twitch.tv/helix"
  ) {}

  hasScope(scope: string): boolean {
    return this.auth.scopes.includes(scope);
  }

  hasAnyScope(scopes: string[]): boolean {
    return scopes.some((scope) => this.auth.scopes.includes(scope));
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      "Client-Id": this.auth.clientId,
    };
  }

  private urlWithParameters(endPoint: string, params: QueryParameters): URL {
    const url = new URL(`${this.baseUrl}/${endPoint}`);

    Object.entries(params).forEach(([param, value]) => {
      if (Array.isArray(value)) {
        value.forEach((value) => url.searchParams.append(param, value));
      } else if (typeof value === "string") {
        url.searchParams.append(param, value);
      }
    });

    return url;
  }

  async get<R>(
    endPoint: string,
    params: QueryParameters,
    controller?: AbortController
  ): Promise<R[]> {
    const url = this.urlWithParameters(endPoint, params);
    // TODO: Deal with exceptions from fetch
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      signal: controller?.signal,
    });

    console.log("response:", response);

    if (!response.ok) {
      // TODO: Make a custom error type?
      //  Possible reason: Bad token, missing permissions (not a mod)
      throw new Error(
        `Bad HTTP response: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.data;
  }

  async put<R>(
    endPoint: string,
    params: QueryParameters,
    controller?: AbortController
  ): Promise<R[]> {
    const url = this.urlWithParameters(endPoint, params);

    // TODO: Deal with exceptions from fetch
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      signal: controller?.signal,
    });

    if (!response.ok) {
      // TODO: Make a custom error type?
      //  Possible reason: Bad token, missing permissions (not a mod)
      throw new Error(
        `Bad HTTP response: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  }

  get users() {
    return new Users(this);
  }
}

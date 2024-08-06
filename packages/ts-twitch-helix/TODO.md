## First thing

Not having to pass in authentication information.
But also not trying to replace the Twitch documentation
with "nicer" method names or abstractions.

```typescript
const helix = new Helix(auth);
```

```typescript
const users = helix.user.get({ userId: "123456" });
const users = helix.user.get({ login: "adrian_learns" });
```

```typescript
type Params = { login: string } | { userId: string };
get<Params>(params);
```

```typescript
const response = helix.user.put({
  description: "Learning about computers with chat",
});
```

```typescript
const response = helix.channels.patch(
  { broadcasterId: "123456" },
  { tags: ["Linux"] }
);
```

### For the CRUD we'd like a base class

The methods one can use depends on the endpoint.
For example, some might only allow GET or PUT.

For most of the endpoints, the only difference is
the set off query parameters and the return type.

BaseAPI -> constructor(helix)

get -> helix.get()

```typescript
get<P, R>(params: P): Promise<R> {};
put<P, B, R>(params: P, body: B): Promise<R> {};
patch<P, B, R>(params: P, body: B): Promise<R> {};
post<P, B, R>(params: P, body: B): Promise<R> {};
```

## Second thing Rate Limiting!

Twitch limits the amount of requests done in a 1 minute window.
https://dev.twitch.tv/docs/api/guide/#twitch-rate-limits

There are three headers in every response that communicates how
far away we are from the rate limit. There's also a 429 response
when the limit is exceeded.

## Third thing Custom Errors!

It would be really nice, if we got a custom errors.

Before the request:

- Missing scope - for re-auth

After the request:

- Bad/Expired token - for re-auth
- Missing permission (e.g. not a moderator)

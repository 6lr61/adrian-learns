import {
  type ParsedMessage,
  type SystemMessage,
  parseMessage,
} from "./parser.js";

test("Unknown command", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
    /* do nothing */
  });
  const ircMessage = ":tmi.twitch.tv 421 <user> WHO :Unknown command";

  parseMessage(ircMessage);

  expect(consoleError).toBeCalledWith(
    "Twitch IRC responded with unknown command:",
    ircMessage
  );
  consoleError.mockRestore();
});

test("Respond to PING command", () => {
  const actual = parseMessage("PING :tmi.twitch.tv");
  expect(actual).toEqual({
    type: "system",
    system_type: "ping",
    message: "PONG :tmi.twitch.tv",
  });
});

test("Respond to RECONNECT command", () => {
  const actual = parseMessage(":tmi.twitch.tv RECONNECT");
  expect(actual).toEqual({
    type: "system",
    system_type: "reconnect",
  });
});

test("Parse a regular chat message", () => {
  const input =
    "@badge-info=founder/2;badges=moderator/1,founder/0,sub-gift-leader/1;" +
    "client-nonce=a0cd8aa75c3dadbad72ede2184b1937e;color=#5052B2;display-name=Athano;" +
    "emotes=;first-msg=0;flags=;id=a82e7734-bba6-48ed-a386-291b53de5761;mod=1;" +
    "returning-chatter=0;room-id=909303784;subscriber=1;tmi-sent-ts=1697457413335;" +
    "turbo=0;user-id=30458956;user-type=mod" +
    " :athano!athano@athano.tmi.twitch.tv PRIVMSG #adriandotjs :sorry";
  const expected = {
    type: "privateMessage",
    username: "athano",
    identity: "athano",
    hostname: "athano.tmi.twitch.tv",
    command: "PRIVMSG",
    channel: "#adriandotjs",
    message: "sorry",
    tags: {
      badge_info: "founder/2",
      badges: "moderator/1,founder/0,sub-gift-leader/1",
      client_nonce: "a0cd8aa75c3dadbad72ede2184b1937e",
      color: "#5052B2",
      display_name: "Athano",
      emotes: "",
      first_msg: "0",
      flags: "",
      id: "a82e7734-bba6-48ed-a386-291b53de5761",
      mod: "1",
      returning_chatter: "0",
      room_id: "909303784",
      subscriber: "1",
      tmi_sent_ts: "1697457413335",
      turbo: "0",
      user_id: "30458956",
      user_type: "mod",
    },
  };

  expect(parseMessage(input)).toEqual(expected);
});

test("Parse a raid USERNOTICE message", () => {
  const input =
    "@badge-info=founder/1;badges=founder/0,premium/1;color=;display-name=FullBodyGamer;emotes=;flags=;id=a61302df-0257-4b00-b11f-42983159b012;login=fullbodygamer;mod=0;msg-id=raid;msg-param-displayName=FullBodyGamer;msg-param-login=fullbodygamer;msg-param-profileImageURL=https://static-cdn.jtvnw.net/jtv_user_pictures/b3327c26-b34e-4b4f-bc86-ad16723bb9eb-profile_image-%s.png;msg-param-viewerCount=4;room-id=909303784;subscriber=1;system-msg=4sraiderssfromsFullBodyGamershavesjoined!;tmi-sent-ts=1697196367453;user-id=102222066;user-type=;vip=0 :tmi.twitch.tv USERNOTICE #adriandotjs";

  expect(parseMessage(input)).toEqual(
    expect.objectContaining({ type: "userNotice", notice_type: "raid" })
  );
});

test("Parse a subscription USERNOTICE message", () => {
  const input =
    "@badge-info=founder/1;badges=founder/0,premium/1;color=;display-name=FullBodyGamer;emotes=;flags=;id=d3f81656-49fe-484a-8a87-5ab0314c6c1c;login=fullbodygamer;mod=0;msg-id=sub;msg-param-cumulative-months=1;msg-param-months=0;msg-param-multimonth-duration=1;msg-param-multimonth-tenure=0;msg-param-should-share-streak=0;msg-param-sub-plan-name=Subscriptions(adriandotjs);msg-param-sub-plan=Prime;msg-param-was-gifted=false;room-id=909303784;subscriber=1;system-msg=FullBodyGamerssubscribedswithsPrime.;tmi-sent-ts=1697181396978;user-id=102222066;user-type=;vip=0 :tmi.twitch.tv USERNOTICE #adriandotjs";

  expect(parseMessage(input)).toEqual(
    expect.objectContaining({ type: "userNotice", notice_type: "subscription" })
  );
});

test("Parse a WHISPER message", () => {
  const input =
    ":petsgomoo!petsgomoo@petsgomoo.tmi.twitch.tv WHISPER foo :hello";
  const expected = {
    type: "whisper",
    username: "petsgomoo",
    identity: "petsgomoo",
    hostname: "petsgomoo",
    recipient: "foo",
    message: "hello",
  } satisfies ParsedMessage;

  expect(parseMessage(input)).toEqual(expected);
});

test("Prase a WHISPER message with tags", () => {
  const input =
    "1700746823227: @badges=;color=;display-name=AdrianDotJS;emotes=;message-id=6;thread-id=909303784_961288084;turbo=0;user-id=909303784;user-type= :adriandotjs!adriandotjs@adriandotjs.tmi.twitch.tv WHISPER adrianbotjs :hello?";
  const expected = {
    type: "whisper",
    username: "adriandotjs",
    identity: "adriandotjs",
    hostname: "adriandotjs",
    recipient: "adrianbotjs",
    message: "hello?",
  } satisfies ParsedMessage;

  expect(parseMessage(input)).toEqual(expected);
});

test("Parse a CAP * ACK message", () => {
  const input =
    ":tmi.twitch.tv CAP * ACK :twitch.tv/commands twitch.tv/tags twitch.tv/membership";
  const expected = {
    type: "system",
    system_type: "capabilities",
    reply: "ack",
    capabilities: [
      "twitch.tv/commands",
      "twitch.tv/tags",
      "twitch.tv/membership",
    ],
  } satisfies SystemMessage;

  expect(parseMessage(input)).toEqual(expected);
});

test("Parse a CAP * NAK message", () => {
  const input = ":tmi.twitch.tv CAP * NAK :twitch.tv/foo";
  const expected = {
    type: "system",
    system_type: "capabilities",
    reply: "nak",
    capabilities: ["twitch.tv/foo"],
  } satisfies SystemMessage;

  expect(parseMessage(input)).toEqual(expected);
});

test("Parse a JOIN message", () => {
  const input = ":ronni!ronni@ronni.tmi.twitch.tv JOIN #dallas";
  const expected = {
    type: "membership",
    membership_type: "join",
    login_name: "ronni",
    channel: "dallas",
  } satisfies ParsedMessage;

  expect(parseMessage(input)).toEqual(expected);
});

test("Parse a PART message", () => {
  const input = ":ronni!ronni@ronni.tmi.twitch.tv PART #dallas";
  const expected = {
    type: "membership",
    membership_type: "part",
    login_name: "ronni",
    channel: "dallas",
  } satisfies ParsedMessage;

  expect(parseMessage(input)).toEqual(expected);
});

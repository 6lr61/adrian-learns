type CommandCooldown = Map<string, Date>;
type CooldownScope = "user" | "global";

const globalCooldowns: CommandCooldown = new Map<string, Date>();
const userCooldowns = new Map<string, CommandCooldown>();

function dateSecondsFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1_000);
}

export function coolingDownUntil(
  username: string,
  commandName: string,
  scope: CooldownScope,
): Date {
  const endingTime =
    scope === "global"
      ? globalCooldowns.get(commandName)
      : userCooldowns.get(username)?.get(commandName);

  if (endingTime && endingTime.valueOf() > Date.now()) {
    return endingTime;
  } else {
    return new Date(0);
  }
}

export function setCooldown(
  username: string,
  commandName: string,
  scope: CooldownScope,
  periodSeconds: number,
): void {
  if (scope === "global") {
    globalCooldowns.set(commandName, dateSecondsFromNow(periodSeconds));
  } else {
    if (!userCooldowns.has(username)) {
      userCooldowns.set(username, new Map());
    }

    const cooldownPeriods = userCooldowns.get(username);
    if (cooldownPeriods) {
      cooldownPeriods.set(commandName, dateSecondsFromNow(periodSeconds));
    }
  }
}

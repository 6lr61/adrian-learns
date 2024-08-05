type CommandCooldown = Map<string, number>;
type CooldownScope = "user" | "global";

const globalCooldowns: CommandCooldown = new Map<string, number>();
const userCooldowns = new Map<string, CommandCooldown>();

function formatTimeUntil(endingTime: number) {
  // The command is on cooldown for another `1 minute and 31 seconds`
  const timeLeft = new Date(endingTime - Date.now());
  const minutesLeft = timeLeft.getMinutes();
  const secondsLeft = timeLeft.getSeconds();
  const minutes = `${minutesLeft} minute` + (minutesLeft !== 1 ? "s" : "");
  const seconds = `${secondsLeft} second` + (secondsLeft !== 1 ? "s" : "");

  return (minutesLeft > 0 ? `${minutes} and ` : "") + seconds;
}

export function onCooldownUntil(
  username: string,
  commandName: string,
  scope: CooldownScope,
): string | undefined {
  switch (scope) {
    case "global": {
        const cooldownEndingTime = globalCooldowns.get(commandName);
        if (cooldownEndingTime && cooldownEndingTime > Date.now()) {
          return formatTimeUntil(cooldownEndingTime);
        } else {
          return;
        }
      }
    case "user": {
      const cooldownPeriods = userCooldowns.get(username);
      if (!cooldownPeriods) {
        return;
      }

      const commandCooldownPeriod = cooldownPeriods.get(commandName);
      if (commandCooldownPeriod && commandCooldownPeriod > Date.now()) {
        return formatTimeUntil(commandCooldownPeriod);
      } else {
        return;
      }
    }
    default:
      return;
  }
}

export function setCooldown(
  username: string,
  commandName: string,
  scope: CooldownScope,
  periodSeconds: number,
): void {
  switch (scope) {
    case "global":
      globalCooldowns.set(commandName, Date.now() + periodSeconds * 1_000);
      break;
    case "user":
      {
        if (!userCooldowns.has(username)) {
          userCooldowns.set(username, new Map());
        }

        const cooldownPeriods = userCooldowns.get(username);
        if (cooldownPeriods) {
          cooldownPeriods.set(commandName, Date.now() + periodSeconds * 1_000);
        }
      }
      break;
    default:
  }
}

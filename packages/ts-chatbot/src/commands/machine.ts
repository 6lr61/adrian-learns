import { readFile } from "node:fs/promises";
import type { CommandResponse } from "./commands.js";
import type { PrivateMessage } from "ts-twitch-irc";

/** !os */
export async function getDebianVersion(
  content: PrivateMessage
): Promise<CommandResponse> {
  const debianVersion = (await readFile("/etc/debian_version", "ascii")).trim();
  const osRelease = (await readFile("/etc/os-release", "ascii"))
    .trim()
    .split("\n")
    .map((row) => row.replaceAll('"', "").split("="));
  const os: Record<string, string> = Object.fromEntries(osRelease);

  return {
    type: "reply",
    message: `I'm currently running on ${os["NAME"]} ${debianVersion} (${os["VERSION_CODENAME"]})`,
    messageId: content.tags.id,
  };
}

/** !cpu */
export async function getCpuInfo(
  content: PrivateMessage
): Promise<CommandResponse> {
  const procCpuModelName = (await readFile("/proc/cpuinfo", "ascii"))
    .trim()
    .split("\n")
    .find((entry) => entry.includes("model name"))
    ?.split(":")[1]
    ?.trim();

  return {
    type: "reply",
    message: `It's an old ${procCpuModelName}`,
    messageId: content.tags.id,
  };
}

/** !kernel */
export async function getKernelVersion(
  content: PrivateMessage
): Promise<CommandResponse> {
  const kernelVersion = (await readFile("/proc/version", "ascii"))
    .split(" ")
    .slice(0, 3)
    .join(" ");

  return {
    type: "reply",
    message: `I'm currently using ${kernelVersion}`,
    messageId: content.tags.id,
  };
}

/** !meminfo */
export function getMemoryUsage(content: PrivateMessage): CommandResponse {
  const usedMemoryBytes = process.memoryUsage.rss();

  let usage: string;
  if (usedMemoryBytes > 2 ** 30) {
    usage = `${(usedMemoryBytes / 2 ** 30).toFixed(3)} GB`;
  } else if (usedMemoryBytes > 2 ** 20) {
    usage = `${Math.round(usedMemoryBytes / 2 ** 20)} MB`;
  } else if (usedMemoryBytes > 2 ** 10) {
    usage = `${Math.round(usedMemoryBytes / 2 ** 10)} kB`;
  } else {
    usage = `${usedMemoryBytes} bytes`;
  }

  return {
    type: "reply",
    message: `I'm currently using ${usage} of RAM`,
    messageId: content.tags.id,
  };
}

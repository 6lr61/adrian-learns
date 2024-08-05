import { type CommandResponse } from "./commands.js";
import { sendChatAnnouncement } from "../helix.js";
import { hideVotingOverlay, updateVotingOverlay } from "../services/voting.js";
import { type PrivateMessage } from "ts-twitch-irc";

const votes = new Map<string, string>();
let votingInProgress = false;
let votingTopic = "";
let votingKind = "";

// What are the diffrent voting options?
// 1) yes or no -> 1 or 2
// 2) S A-F

const yesOrNo = new Set(["1", "2"]);
const tierList = new Set(["S", "A", "B", "C", "D", "E", "F"]);
let validVotes: Set<string> = new Set([]);

export function startVoting(thing: string, kind: "yesno" | "tier"): void {
  votingInProgress = true;
  votingTopic = thing;
  votingKind = kind;

  let initialState: Record<string, number>;

  if (kind === "yesno") {
    validVotes = yesOrNo;
    initialState = { "1": 50, "2": 50 };
  } else {
    validVotes = tierList;
    initialState = { S: 14, A: 14, B: 14, C: 14, D: 14, E: 14, F: 14 };
  }

  void sendChatAnnouncement(
    `A vote has started for: ${thing}, ${
      kind === "yesno" ? "vote 1 or 2!" : "rate S to F!"
    }`,
    "primary"
  );

  updateVotingOverlay(thing, kind, initialState);
}

export async function stopVoting(): Promise<void> {
  votingInProgress = false;
  await announceResult();
  clearVotes();

  hideVotingOverlay();
}

export function countVotes(): Record<string, number> {
  const numberOfVotes = votes.size;

  const result: Record<string, number> = {};

  for (const [option] of validVotes) {
    let count = 0;
    votes.forEach((vote) => (count = vote === option ? count + 1 : count));
    result[option || ""] = Math.floor(100 * (count / numberOfVotes));
  }

  if (votingKind === "yesno" || votingKind === "tier") {
    updateVotingOverlay(votingTopic, votingKind, result);
  }

  return result;
}

async function announceResult(): Promise<void> {
  const result = countVotes();
  const results = [];
  // result = [["1", 33], ["2", 66]]
  // The result of is 1: 33%, 2: 66%
  for (const [option, percentage] of Object.entries(result)) {
    results.push(`${option} : ${percentage}%`);
  }

  await sendChatAnnouncement(
    `The result of the vote is ${results.join(", ")}`,
    "blue"
  );
}

function clearVotes(): void {
  votes.clear();
}

export function countVote(content: PrivateMessage): void {
  const vote = content.message.toUpperCase().match(/[12SA-F]{1}/)?.[0];

  if (vote && validVotes.has(vote)) {
    votes.set(content.username, vote);
  }
}

export function activeVote(): boolean {
  return votingInProgress;
}

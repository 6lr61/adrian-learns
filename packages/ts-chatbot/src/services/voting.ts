import { WebSocketServer } from "ws";
import { countVotes } from "../commands/vote.js";

const wss = new WebSocketServer({ port: 8086 });

wss.on("connection", function connection(ws) {
  ws.on("error", (event) =>
    console.error("Voting: The websocked had an error", event)
  );

  ws.on("close", (event) =>
    console.error("Voting: The websocket was closed", event)
  );
});

interface VotingMessage {
  reason?: string;
  kind?: "yesno" | "tier";
  visible: boolean;
  votes?: Record<string, number>;
}

export function updateVotingOverlay(
  reason: string,
  kind: "yesno" | "tier",
  result?: Record<string, number>
): undefined {
  if (wss.clients.size === 0) {
    console.error("Can't sent timer: No one is listening!");
  }

  const voteMessage: VotingMessage = {
    reason: reason,
    kind: kind,
    visible: true,
    votes: result,
  };

  wss.clients.forEach((client) => client.send(JSON.stringify(voteMessage)));
}

export function hideVotingOverlay(): undefined {
  const voteMessage: VotingMessage = {
    visible: false,
  };

  wss.clients.forEach((client) => client.send(JSON.stringify(voteMessage)));
}

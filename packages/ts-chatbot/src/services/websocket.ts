import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  // This isn't a 100% fixing the issue
  ws.on("close", clearTimer);
});

interface BeRightBackTimer {
  showTimer: boolean;
  remainingTime?: number;
  reasonText?: string;
}

let intervalID: NodeJS.Timeout;
let timerRunning: boolean = false;

export function startTimer(time: number, reason: string): undefined {
  if (wss.clients.size === 0) {
    console.error("Can't sent timer: No one is listening!");
  }

  if (timerRunning) {
    console.error("A timer is alread running!");
    return;
  }

  const setTimer: BeRightBackTimer = {
    showTimer: true,
    remainingTime: time,
    reasonText: reason,
  };

  intervalID = setInterval(() => {
    // Maybe we shouldn't send it to all of the clients?
    wss.clients.forEach((client) => client.send(JSON.stringify(setTimer)));

    if (setTimer.remainingTime && setTimer.remainingTime > 0) {
      setTimer.remainingTime--;
    } else {
      clearInterval(intervalID);
      timerRunning = false;
    }
  }, 1_000);
  timerRunning = true;

  // !brb 5 Getting more tea -> a 5 minute timer
  console.log(`Set a ${time} seconds timer for ${reason}.`);
}

export function clearTimer(): undefined {
  const clearTimer: BeRightBackTimer = {
    showTimer: false,
  };

  clearInterval(intervalID);
  timerRunning = false;

  wss.clients.forEach((client) => client.send(JSON.stringify(clearTimer)));
}

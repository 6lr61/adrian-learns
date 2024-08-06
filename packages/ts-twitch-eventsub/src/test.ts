import { connectEventSubWebSocket } from "./eventsub/websocket.js";
import { eventListener } from "./eventsub/listener.js";

connectEventSubWebSocket(eventListener);

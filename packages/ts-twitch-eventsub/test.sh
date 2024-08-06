export TWITCH_EVENTSUB="ws://127.0.0.1:9000/ws"
export TWITCH_SUBSCRIBE_API="http://127.0.0.1:9000/eventsub/subscriptions"

twitch event websocket start-server --require-subscription --port=9000 &
TWICH_PID=$!

node ./dist/test.js

kill $TWICH_PID

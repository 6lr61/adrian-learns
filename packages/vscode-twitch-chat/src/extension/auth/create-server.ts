import http from "node:http";

const REDIRECT_HOST = "localhost";

export function createServer(
  callback: (
    accessToken: string,
    scope: string,
    tokenType: string
  ) => Promise<void>,
  redirectPort: string
) {
  const requestListener = function (
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    if (!request.url) {
      response.setHeader("Content-Type", "text/plain");
      response.writeHead(500);
      response.end("The wheel is spinning, but the hamster is dead.");
      return;
    }

    const url = new URL(request.url, "http://localhost");
    const accessToken = url.searchParams.get("access_token");
    const scope = url.searchParams.get("scope");
    const tokenType = url.searchParams.get("token_type");

    if (accessToken && scope && tokenType) {
      callback(accessToken, scope, tokenType);
      console.debug("Forwarding tokens");
    }

    response.setHeader("Content-Type", "text/html");
    response.writeHead(200);
    response.end(
      `<html>
        <body>
          <p>Hello! I see you're visiting from: ${request.url}</p>
          
          <script>
            if (window.location.hash) {
              window.location.replace("http://localhost:${redirectPort}?" + window.location.hash.slice(1));
            }
          </script>
        </body>
      </html>`
    );
  };

  const server = http.createServer(requestListener);
  server.listen(Number.parseInt(redirectPort), REDIRECT_HOST, () => {
    console.debug(
      `WebServer is running on http://${REDIRECT_HOST}:${redirectPort}`
    );
  });
}

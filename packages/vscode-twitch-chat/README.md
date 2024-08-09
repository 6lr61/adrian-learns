# Twitch Chat for VSCode

This extension is a work in progress and a learning project to work on while streaming on Twitch. The code is terrible, just a disgusting mess of spaghetti, sprinkled with an all too liberal use of regular expressions and singletons.

## Setup

### Dependencies

The extension depends on the `ts-twitch-irc` package from this monorepo, which has to be compiled before building this extension.

### Building

A `VSIX` package for installing in VSCode can be built using `npm`:

```console
npm run build
```

### Debugging

The monorepo is setup to run the debugger on the VSCode Extension and can be selected from the _Run and Debug_ side panel.

## Usage

Once installed the extension can be started from the _Command Palette_ in VSCode by typing in `Twitch Chat` and choosing _Twitch Chat: Open a new Twitch Chat WebView_.

> [!NOTE]
> If there's no valid token in the `SecretStorage` then the webview window will wait for one.

Use the external browser option _Twitch Chat: Login to Twitch in an external browser_ to connect to Twitch and get a new token.

> [!CAUTION]
> The extension uses the implicit code grant flow and will show the token in the browser during the process.

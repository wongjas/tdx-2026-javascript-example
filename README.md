# Reaction Emails

A Slack app that adds a message shortcut to look up the email addresses of everyone who reacted to a message, grouped by reaction.

## What it does

Right-click any message → **Reaction emails** to get a reply like:

```
*Reaction emails:*

:thumbsup: @alice, @bob
`alice@example.com, bob@example.com`

:heart: @carol
`carol@example.com`
```

## Setup

Before getting started, make sure you have a development workspace where you have permissions to install apps. If you don't have one, [create one](https://slack.com/create).

### Create a Slack App

1. Open [https://api.slack.com/apps/new](https://api.slack.com/apps/new) and choose "From an app manifest"
2. Choose the workspace you want to install the application to
3. Copy the contents of [manifest.json](./manifest.json) into the text box that says `*Paste your manifest code here*` (within the JSON tab) and click _Next_
4. Review the configuration and click _Create_
5. Click _Install to Workspace_ and _Allow_ on the screen that follows. You'll then be redirected to the App Configuration dashboard.

### Environment Variables

1. Rename `.env.sample` to `.env`
2. Open your app's configuration page from [this list](https://api.slack.com/apps), click _OAuth & Permissions_ in the left hand menu, then copy the _Bot User OAuth Token_ into your `.env` file under `SLACK_BOT_TOKEN`
3. Click _Basic Information_ from the left hand menu and copy the _Signing Secret_ into your `.env` as `SLACK_SIGNING_SECRET`
4. Follow the steps in the _App-Level Tokens_ section to create an app-level token with the `connections:write` scope. Copy that token into your `.env` as `SLACK_APP_TOKEN`

### Run Locally

```zsh
# Install dependencies
npm install

# Start with auto-restart on file changes
npm run dev

# Or start normally
npm start
```

### Linting

```zsh
npm run lint
```

### Testing

```zsh
npm test
```

## Project Structure

```
app.js                              # Entry point — starts the Bolt app
manifest.json                       # Slack app configuration
listeners/
├── index.js                        # Registers all listeners
└── shortcuts/
    ├── index.js                    # Registers the reaction_emails shortcut
    └── reaction-emails.js          # Shortcut handler logic
tests/
└── shortcuts/
    └── reaction-emails.spec.js     # Unit tests
```

## Required OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `chat:write` | Post the reaction summary to the channel |
| `reactions:read` | Read reactions on a message |
| `users:read` | Look up user profiles |
| `users:read.email` | Read user email addresses |

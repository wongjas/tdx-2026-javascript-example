import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reactionEmailsCallback } from '../../listeners/shortcuts/reaction-emails.js';

describe('reactionEmailsCallback', () => {
  let ack;
  let logger;
  let client;
  let shortcut;

  beforeEach(() => {
    ack = mock.fn(async () => {});
    logger = { error: mock.fn(), warning: mock.fn() };
    shortcut = {
      channel: { id: 'C123' },
      message: { ts: '1234567890.000100' },
    };
    client = {
      reactions: { get: mock.fn() },
      chat: { postMessage: mock.fn(async () => {}) },
      users: { info: mock.fn() },
    };
  });

  it('acknowledges the shortcut immediately', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({ message: { reactions: [] } }));
    await reactionEmailsCallback({ shortcut, ack, client, logger });
    assert.equal(ack.mock.calls.length, 1);
  });

  it('posts "no reactions" when the message has no reactions', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({ message: { reactions: [] } }));
    await reactionEmailsCallback({ shortcut, ack, client, logger });
    assert.equal(client.chat.postMessage.mock.calls.length, 1);
    assert.equal(
      client.chat.postMessage.mock.calls[0].arguments[0].text,
      'No reactions found on this message.',
    );
  });

  it('formats reactions with user mentions and emails', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({
      message: {
        reactions: [
          { name: 'thumbsup', users: ['U1', 'U2'] },
          { name: 'heart', users: ['U3'] },
        ],
      },
    }));
    client.users.info.mock.mockImplementation(async ({ user }) => {
      const users = {
        U1: { id: 'U1', profile: { email: 'alice@example.com' } },
        U2: { id: 'U2', profile: { email: 'bob@example.com' } },
        U3: { id: 'U3', profile: { email: 'carol@example.com' } },
      };
      return { user: users[user] };
    });

    await reactionEmailsCallback({ shortcut, ack, client, logger });

    assert.equal(client.chat.postMessage.mock.calls.length, 1);
    const { text } = client.chat.postMessage.mock.calls[0].arguments[0];
    assert.ok(text.startsWith('*Reaction emails:*'));
    assert.ok(text.includes(':thumbsup: <@U1>, <@U2>'));
    assert.ok(text.includes('alice@example.com, bob@example.com'));
    assert.ok(text.includes(':heart: <@U3>'));
    assert.ok(text.includes('carol@example.com'));
  });

  it('deduplicates user lookups when a user reacted with multiple emojis', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({
      message: {
        reactions: [
          { name: 'thumbsup', users: ['U1'] },
          { name: 'heart', users: ['U1'] },
        ],
      },
    }));
    client.users.info.mock.mockImplementation(async () => ({
      user: { id: 'U1', profile: { email: 'alice@example.com' } },
    }));

    await reactionEmailsCallback({ shortcut, ack, client, logger });

    assert.equal(client.users.info.mock.calls.length, 1);
  });

  it('skips users with no email', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({
      message: { reactions: [{ name: 'thumbsup', users: ['U1'] }] },
    }));
    client.users.info.mock.mockImplementation(async () => ({
      user: { id: 'U1', profile: {} },
    }));

    await reactionEmailsCallback({ shortcut, ack, client, logger });

    const { text } = client.chat.postMessage.mock.calls[0].arguments[0];
    assert.ok(text.includes(':thumbsup: <@U1>'));
    assert.ok(!text.includes('```'));
  });

  it('posts to the correct channel without thread_ts', async () => {
    client.reactions.get.mock.mockImplementation(async () => ({
      message: { reactions: [{ name: 'thumbsup', users: ['U1'] }] },
    }));
    client.users.info.mock.mockImplementation(async () => ({
      user: { id: 'U1', profile: { email: 'alice@example.com' } },
    }));

    await reactionEmailsCallback({ shortcut, ack, client, logger });

    const args = client.chat.postMessage.mock.calls[0].arguments[0];
    assert.equal(args.channel, 'C123');
    assert.equal(args.thread_ts, undefined);
  });

  it('logs errors and does not throw', async () => {
    client.reactions.get.mock.mockImplementation(async () => { throw new Error('API failure'); });
    await assert.doesNotReject(() =>
      reactionEmailsCallback({ shortcut, ack, client, logger }),
    );
    assert.equal(logger.error.mock.calls.length, 1);
  });
});

const reactionEmailsCallback = async ({ shortcut, ack, client, logger }) => {
  try {
    await ack();
    const { channel, message } = shortcut;

    const reactionsResult = await client.reactions.get({
      channel: channel.id,
      timestamp: message.ts,
      full: true,
    });

    const reactions = reactionsResult.message?.reactions ?? [];
    if (reactions.length === 0) {
      await client.chat.postMessage({
        channel: channel.id,
        text: 'No reactions found on this message.',
      });
      return;
    }

    // Fetch each unique user once across all reactions
    const allUserIds = new Set(reactions.flatMap((r) => r.users));
    const userCache = {};
    await Promise.all(
      [...allUserIds].map(async (uid) => {
        try {
          const result = await client.users.info({ user: uid });
          userCache[uid] = result.user;
        } catch (e) {
          logger.warning(`Failed to fetch info for user ${uid}: ${e}`);
        }
      }),
    );

    const sections = [];
    for (const reaction of reactions) {
      const mentions = [];
      const emails = [];
      for (const uid of [...reaction.users].sort()) {
        const user = userCache[uid];
        if (!user) continue;
        mentions.push(`<@${uid}>`);
        if (user.profile?.email) emails.push(user.profile.email);
      }
      if (mentions.length === 0) continue;
      let section = `:${reaction.name}: ${mentions.join(', ')}`;
      if (emails.length > 0) section += `\n\`\`\`${emails.join(', ')}\`\`\``;
      sections.push(section);
    }

    const text =
      sections.length > 0
        ? `*Reaction emails:*\n\n${sections.join('\n\n')}`
        : 'No users found for reactions on this message.';

    await client.chat.postMessage({
      channel: channel.id,
      text,
    });
  } catch (error) {
    logger.error(error);
  }
};

export { reactionEmailsCallback };

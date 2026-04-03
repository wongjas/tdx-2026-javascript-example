import { reactionEmailsCallback } from './reaction-emails.js';

export const register = (app) => {
  app.shortcut('reaction_emails_shortcut', reactionEmailsCallback);
};

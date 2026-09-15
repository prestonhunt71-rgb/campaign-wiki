// Telegram state is derived from Media ancestry, Actor parents, aliases and currentStatus.
const key = value => String(value ?? '').trim().toLowerCase();
const access = new WeakMap();
export function isTelegram(data, article) {
  if (!article || article.organizer) return false;
  const visit = (id, seen = new Set()) => {
    if (seen.has(id)) return false;
    const parent = data.articles[id];
    if (!parent) return false;
    const next = new Set(seen).add(id);
    const category = id === 'organizer:telegrams' || ['telegram','telegrams'].includes(key(parent.title));
    if (category && parent.parentIds.some(mediaId => {
      const media = data.articles[mediaId];
      return media && (mediaId === 'organizer:media' || key(media.title) === 'media') && media.parentIds.includes('root:images');
    })) return true;
    return parent.parentIds.some(parentId => visit(parentId, next));
  };
  return article.parentIds.some(id => visit(id));
}
export const isActiveTelegram = (data, article) => isTelegram(data, article) && (article.currentStatus || 'active') === 'active';
export const isGametable = user => key(user?.name) === 'gametable';
export function telegramRecipient(data, article, users = []) {
  const parents = [...new Set(article?.parentIds || [])].map(id => data.articles[id]).filter(a => a?.source?.documentType === 'Actor' && !a.source.missing);
  const matches = parents.map(actor => ({actor, users: users.filter(user => !user.isGM && !isGametable(user) &&
    (typeof user.character === 'string' ? user.character : user.character?.id) === actor.source.id)})).filter(match => match.users.length);
  return {matches, recipient: matches.length === 1 && matches[0].users.length === 1 ? matches[0] : null};
}
export function mayReceiveTelegram(data, article, user, users) {
  if (!user || user.isGM || isGametable(user)) return false;
  return telegramRecipient(data, article, users).recipient?.users[0].id === user.id;
}
export function telegramWarning(data, article, users) {
  if (!isActiveTelegram(data, article)) return '';
  const {matches, recipient} = telegramRecipient(data, article, users);
  if (!matches.length) return 'Telegram has no parent Actor assigned as a player character. Check the parent article Foundry Actor link and the assigned character in Foundry User Configuration. Delivery is disabled.';
  if (!recipient) return 'Telegram recipient is ambiguous: use exactly one parent Actor assigned to exactly one player. Delivery is disabled.';
  return '';
}
export function telegramVisibility(data, article) {
  if (article && isTelegram(data, article) && access.get(data)?.has(article.id)) return true;
  return isActiveTelegram(data, article) ? false : null;
}
// Project before any renderer traverses the graph, including counts and derived dates.
export function telegramView(data, user, users = []) {
  if (user?.isGM && !isGametable(user)) return data;
  const allowed = new Set(), hidden = new Set();
  for (const article of Object.values(data.articles)) if (isActiveTelegram(data, article)) {
    (mayReceiveTelegram(data, article, user, users) ? allowed : hidden).add(article.id);
  }
  const view = {...data, articles: Object.fromEntries(Object.entries(data.articles).filter(([id]) => !hidden.has(id)).map(([id, article]) => [id, {
    ...article, parentIds: article.parentIds.filter(parentId => !hidden.has(parentId)),
    parentPathHints: Object.fromEntries(Object.entries(article.parentPathHints || {}).filter(([parentId,path]) => !hidden.has(parentId) && !path.some(part => hidden.has(part))))
  }]))};
  access.set(view, allowed);
  return view;
}
export function telegramOldestFirst(a, b) {
  return String(a.date || a.createdAt || '').localeCompare(String(b.date || b.createdAt || '')) ||
    String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || a.id.localeCompare(b.id);
}
export function waitingTelegram(data, user, users) {
  return Object.values(data.articles).filter(article => isActiveTelegram(data, article) && mayReceiveTelegram(data, article, user, users)).sort(telegramOldestFirst)[0] || null;
}
export function markTelegramOpened(data, articleId, user, users) {
  const article = data.articles[articleId];
  if (!isActiveTelegram(data, article) || !mayReceiveTelegram(data, article, user, users)) return false;
  article.currentStatus = 'inactive';
  article.updatedAt = new Date().toISOString();
  return true;
}
export function telegramNoticeHtml(data, user, users) {
  const article = waitingTelegram(data, user, users);
  if (!article) return '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const addressee = article.aliases?.[0]?.trim();
  return '<div class="cw-telegram-delivery"><button type="button" class="cw-telegram-notice" data-action="open" data-id="' + esc(article.id) + '"><span aria-hidden="true">✉</span> ' + esc(addressee ? 'TELEGRAM FOR ' + addressee.toUpperCase() + '!' : 'TELEGRAM WAITING!') + '</button></div>';
}

export function setupTelegramEditor(element, data, article, getUsers) {
  const warning = element.querySelector("[data-telegram-warning]");
  if (!warning) return;
  const refresh = () => {
    const draft = {...article, parentIds: Array.from(element.querySelectorAll("[name=parentIds]"), input => input.value), currentStatus: element.querySelector("[name=currentStatus]")?.value || article.currentStatus};
    const message = telegramWarning(data, draft, getUsers());
    warning.textContent = message;
    warning.hidden = !message;
  };
  element.addEventListener("cw-parents-changed", refresh);
  element.querySelector("[name=currentStatus]")?.addEventListener("change", refresh);
  refresh();
}

import { readFile } from 'node:fs/promises';

const decode = s => s.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const plain = s => decode(s.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const gameDate = date => new Date(date.getTime() - 2 * 3600000);

export function buildMessage(html, todayJs, now = new Date()) {
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  const date = gameDate(now);
  const day = date.getUTCDay() || 7;
  const template = [...html.matchAll(/<template\b([^>]*)>([\s\S]*?)<\/template>/g)]
    .find(m => new RegExp(`data-plan="${day}"`).test(m[1]));
  if (!template) throw new Error('На сайте нет плана текущего дня');
  const title = template[1].match(/data-title="([^"]+)"/)?.[1];
  if (!title) throw new Error('Не найден заголовок плана');
  const names = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const label = date.toISOString().slice(0, 10).split('-').reverse().join('.');
  const lines = [`📅 ${names[day]}, ${label} · [ALP] АльфА`, '', plain(title), ''];
  for (const m of template[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)) lines.push(`• ${plain(m[1])}`);
  for (const m of template[2].matchAll(/<p class="note">([\s\S]*?)<\/p>/g)) lines.push('', plain(m[1]));
  const prep = template[2].match(/<p class="prep">([\s\S]*?)<\/p>/);
  if (prep) lines.push('', plain(prep[1]));

  // Dated calendar entries belong to the game day (05:00 MSK reset),
  // so Friday's message includes the event during Friday–Saturday night.
  for (const m of html.matchAll(/<span\b[^>]*data-event-end="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g)) {
    const end = new Date(m[1]);
    if (now < end && gameDate(end).toISOString().slice(0, 10) === date.toISOString().slice(0, 10)) lines.push('', plain(m[2]));
  }
  const driversText = todayJs.match(/var drivers = \[([^\]]+)\]/)?.[1];
  const drivers = driversText ? [...driversText.matchAll(/'([^']*)'|"([^"]*)"/g)].map(m => m[1] ?? m[2]) : [];
  const start = todayJs.match(/driverIndex = Math\.floor\(\(now\.getTime\(\) - Date\.UTC\((\d+),\s*(\d+),\s*(\d+)\)\)/);
  if (!start || !drivers.length) throw new Error('Не удалось прочитать расписание машинистов');
  const index = Math.floor((date - Date.UTC(Number(start[1]), Number(start[2]), Number(start[3]))) / 86400000);
  const duration = Number(todayJs.match(/driverIndex < (\d+)/)?.[1] || 0);
  if (index >= 0 && index < duration) lines.push('', `🚂 Машинист: ${drivers[index % drivers.length]}`);
  lines.push('', 'День сервера: с 05:00 до 05:00 МСК.', 'Подробности: https://alp-alfa.github.io/alp-wiki/');
  const content = lines.join('\n');
  if (content.length > 2000) throw new Error('Сообщение превышает 2000 символов');
  return content;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/lolka-events.mjs')) {
  const [html, js] = await Promise.all(['index.html', 'today.js'].map(p => readFile(new URL(p, import.meta.url), 'utf8')));
  const content = buildMessage(html, js);
  if (process.argv.includes('--preview')) console.log(content);
  else {
    const webhook = process.env.LOLKA_WEBHOOK_URL;
    if (!webhook) throw new Error('Добавьте секрет LOLKA_WEBHOOK_URL в GitHub Actions');
    const url = new URL(webhook);
    if (url.origin !== 'https://lolka.app' || !url.pathname.startsWith('/api/webhooks/')) throw new Error('Неверный адрес вебхука Lolka');
    const response = await fetch(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username: 'АльфА · События дня', allowed_mentions: { parse: [] } })
    });
    // Never log the URL, token, or response body. Do not retry uncertain sends.
    if (!response.ok) throw new Error(`Lolka вернула HTTP ${response.status}`);
    console.log('События дня отправлены в Lolka.');
  }
}

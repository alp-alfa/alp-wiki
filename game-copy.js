/* Copy plain text so the game receives the formatting tags literally. */
(function () {
  'use strict';
  function bind(id, buildText) {
    var button = document.getElementById(id);
    var status = document.getElementById(id + '-status');
    if (!button || !status) return;
    button.disabled = false;
    button.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(buildText());
        status.textContent = 'Скопировано!';
      } catch (error) {
        status.textContent = 'Не удалось скопировать. Проверьте разрешение на буфер обмена.';
      }
    });
  }
  window.GameCopy = { bind: bind };
  var plan = document.getElementById('today-plan');
  if (!plan) return;
  var weekdays = ['ВОСКРЕСЕНЬЕ','ПОНЕДЕЛЬНИК','ВТОРНИК','СРЕДА','ЧЕТВЕРГ','ПЯТНИЦА','СУББОТА'];
  var icons = [ ['🩹','📡','⛏️'], [], ['🚚','🎯','👥','🏗️'], ['📡','🧪','🔬'], ['🧩','👥','📚'], ['📡','⏩','🪖'], ['🌍','🔥','🎁','⚠️','🎯'] ];
  var monday = [
    '📡 Выполняем накопленные задания радара! Очки зависят от изученных исследований.',
    '✈️ Тратим выносливость, улучшаем истребитель и используем части бойца. Коробки с запчастями НЕ открываем до среды!',
    '⛏️ Собираем ресурсы с плиток! Сбор радаром очков не даёт.',
    '📚 Опыт героев НЕ тратим! Оставляем на четверг.',
    '🏗️ Запускаем стройку, но готовые здания с галочкой НЕ забираем! Жмём во вторник, чтобы сила пошла в VS.',
    '🔬 Запускаем длительные исследования к среде. Завершаем ускорениями в день науки!',
    '📦 Готовим на завтра: UR-грузовик, UR-спецоперацию, билеты выживших и ускорения строительства.'
  ];
  bind('copy-today', function () {
    var day = new Date(Date.now() - 7200000).getUTCDay();
    var title = document.getElementById('today-title').textContent.replace(/^VS:\s*/i, '').trim();
    var blocks = ['📢 ' + weekdays[day] + ' | ' + title.toLocaleUpperCase('ru-RU')];
    if (day === 1) return blocks.concat(monday).join('\n\n');
    var step = 0;
    plan.querySelectorAll('li, p.note, p.prep').forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.querySelectorAll('a').forEach(function (link) { link.remove(); });
      var line = copy.textContent.trim().replace(/\s+/g, ' ');
      if (item.matches('li')) line = (icons[day][step++] || '🔹') + ' ' + line;
      if (item.matches('.prep')) line = '📦 ' + line.replace(/^Готовимся к завтра:/, 'Готовим на завтра:');
      if (line) blocks.push(line);
    });
    return blocks.join('\n\n');
  });
})();


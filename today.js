// Подсветка сегодняшнего дня по игровому времени (UTC-2, как в настройках игры).
// Элементы с data-day="1".."7" (1 = понедельник, 7 = воскресенье) получают класс "today".
(function () {
  var GAME_UTC_OFFSET = -2; // часовой пояс игры
  var now = new Date(Date.now() + GAME_UTC_OFFSET * 3600 * 1000);
  var day = now.getUTCDay() || 7; // 1..7, воскресенье = 7

  document.querySelectorAll('[data-day]').forEach(function (el) {
    if (Number(el.getAttribute('data-day')) === day) el.classList.add('today');
  });

  // Даты текущей недели (пн–вс) в блоке #week-dates
  var box = document.getElementById('week-dates');
  if (box) {
    var mon = new Date(now.getTime() - (day - 1) * 86400000);
    var sun = new Date(mon.getTime() + 6 * 86400000);
    var f = function (d) {
      return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0');
    };
    box.textContent = 'Неделя: ' + f(mon) + ' – ' + f(sun);
  }

  // Блок «Сегодня»: заголовок, дата и план действий из <template data-plan="N">
  var names = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  var dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = 'Сегодня · ' + names[day] + ', ' +
    String(now.getUTCDate()).padStart(2, '0') + '.' + String(now.getUTCMonth() + 1).padStart(2, '0');
  var tpl = document.querySelector('template[data-plan="' + day + '"]');
  var title = document.getElementById('today-title');
  var plan = document.getElementById('today-plan');
  if (title) title.textContent = (tpl && tpl.getAttribute('data-title')) || names[day];
  if (plan && tpl) plan.appendChild(tpl.content.cloneNode(true));
})();

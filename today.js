// Подсветка сегодняшнего дня по времени сервера: новый день начинается в 05:00 МСК (= 02:00 UTC).
// Элементы с data-day="1".."7" (1 = понедельник, 7 = воскресенье) получают класс "today".
(function () {
  var GAME_UTC_OFFSET = -2; // 05:00 МСК = полночь сервера
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
  var drv = document.getElementById('today-driver');
  // Очередь на 30 дней с 9 ноября 2026: RumanticK.
  var drivers = ["RumanticK","Золотой","Психопат","OLLi","AlenaMiy (R5)","Man'yak","Nemmi","Балдеж"];
  var driverIndex = Math.floor((now.getTime() - Date.UTC(2026, 10, 9)) / 86400000);
  var currentDriver = driverIndex >= 0 && driverIndex < 30 ? drivers[driverIndex % drivers.length] : 'расписание уточняется';
  if (drv) {
    drv.innerHTML = '🚂 Машинист сегодня: <b></b>';
    drv.querySelector('b').textContent = currentDriver;
    drv.hidden = false;
  }

  // Сколько осталось до смены дня (05:00 МСК) + автообновление страницы в момент смены
  var DAY = 86400000, SHIFT = -GAME_UTC_OFFSET * 3600000;
  var nextReset = Math.floor((Date.now() - SHIFT) / DAY + 1) * DAY + SHIFT;
  var left = document.getElementById('day-left');
  function tick() {
    document.querySelectorAll('[data-event-end]').forEach(function (el) {
      if (Date.now() >= Date.parse(el.getAttribute('data-event-end'))) el.hidden = true;
    });
    var ms = nextReset - Date.now();
    if (ms <= 0) { location.reload(); return; }
    if (left) {
      var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
      left.textContent = 'Новый день через ' + (h || m ? h + ' ч ' + m + ' мин' : 'минуту') + ' (в 05:00 МСК)';
    }
  }
  tick();
  setInterval(tick, 30000);
  // Телефон «усыпляет» вкладку — проверяем, когда к ней вернулись
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();

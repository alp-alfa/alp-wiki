(function () {
  'use strict';
  var DAY = 86400000, RESET = 2 * 3600000;
  var names = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  function gameDate(time) { return Math.floor((time - RESET) / DAY) * DAY; }
  function parseDate(value) { return Date.parse(value + 'T00:00:00Z'); }
  function format(time) { return new Date(time).toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}); }
  function normalize(value) { return value.normalize('NFKC').toLocaleLowerCase('ru-RU').trim(); }
  function createList(players, query) {
    var list = document.createElement('ol'); list.className = 'train-list';
    players.forEach(function (name) {
      var item = document.createElement('li'); item.textContent = name;
      if (query && normalize(name).includes(query)) item.className = 'match';
      list.appendChild(item);
    });
    return list;
  }
  function createTrain(day, query) {
    var wrapper=document.createElement('div');
    var engine=document.createElement('p'); engine.className='train-engine';
    engine.textContent='🚂 Локомотив → вагон 1 → вагон 2 → вагон 3 → вагон 4';
    wrapper.appendChild(engine);
    var cars=document.createElement('div'); cars.className='train-carriages';
    day.wagons.forEach(function(players,i){
      var car=document.createElement('section'); car.className='train-carriage';
      var title=document.createElement('h3'); title.textContent='Вагон '+(i+1);
      var caption=document.createElement('small'); caption.textContent='5 пассажиров';
      car.append(title,caption,createList(players,query)); cars.appendChild(car);
    });
    wrapper.appendChild(cars); return wrapper;
  }
  fetch('train-data.json', {cache:'no-store'}).then(function (response) {
    if (!response.ok) throw new Error('load');
    return response.json();
  }).then(function (data) {
    var passengers = data.passengers;
    var excluded = new Set(data.excludedDrivers.map(normalize));
    var start = parseDate(data.startDate), initialToday = gameDate(Date.now());
    if (!Array.isArray(passengers) || !Number.isInteger(data.seats) || data.seats < 1 || passengers.length < data.seats ||
        new Set(passengers.map(normalize)).size !== passengers.length || passengers.some(function (name) { return excluded.has(normalize(name)); }) ||
        !Number.isFinite(start) || new Date(start).getUTCDay() !== 2) throw new Error('invalid');
    var week = Math.max(0, Math.floor((initialToday - start) / (7 * DAY)));
    var weekStart = start + week * 7 * DAY;
    var history=Object.create(null), days=[];
    for(var dayIndex=0;dayIndex<week*7+7;dayIndex++) {
      var date=start+dayIndex*DAY;
      var players=Array.from({length:data.seats},function(_,j){return passengers[(dayIndex*data.seats+j)%passengers.length];});
      var wagons=TrainWagons.assign(players,history);
      if(dayIndex>=week*7) days.push({date:date,name:names[new Date(date).getUTCDay()],players:players,wagons:wagons});
    }
    document.getElementById('train-total').textContent = passengers.length + ' участников · ' + data.seats + ' мест в день';
    document.getElementById('train-updated').textContent = 'Состав обновлён ' + format(parseDate(data.updatedDate));
    document.getElementById('train-week-dates').textContent = format(weekStart) + ' — ' + format(weekStart + 6 * DAY) + ' · вторник — понедельник';
    var min = Math.floor(7 * data.seats / passengers.length), max = Math.ceil(7 * data.seats / passengers.length);
    document.getElementById('train-fairness').textContent = min === max ? 'С текущим составом каждый участник едет ровно ' + min + ' раза за неделю.' : 'С текущим составом каждый участник едет ' + min + '–' + max + ' раз за неделю. Очередь продолжается на следующей неделе.';
    var today = days.find(function (d) { return d.date === initialToday; });
    document.getElementById('train-today-date').textContent = 'Сегодня · ' + format(initialToday);
    var todayBody = document.getElementById('train-today-body'); todayBody.replaceChildren();
    if (today) {
      document.getElementById('train-today-title').textContent = today.name + ' · ' + data.seats + ' пассажиров';
      todayBody.appendChild(createTrain(today, ''));
      GameCopy.bind('copy-train', function () {
        var driver = document.querySelector('#today-driver b');
        var blocks = [
          '<style title><#FF0000>🚂 РАСПИСАНИЕ НА ПОЕЗД ‼️</color></style>',
          '📅 ' + format(today.date)
        ];
        if (driver && driver.textContent) blocks.push('🚂 Машинист: ' + driver.textContent);
        blocks.push(
          '⚠️ Садитесь только в свой вагон!',
          '🎟️ Каждый пассажир обязательно сдаёт 3 билета.',
          '📋 Кого сегодня нет в списке, поедут в другие дни. Расписание: https://alp-alfa.github.io/alp-wiki/train.html'
        );
        today.wagons.forEach(function (players, index) {
          blocks.push('🚃 ВАГОН №' + (index + 1) + '\n' + players.join(', ') + '.');
        });
        return blocks.join('\n⠀\n');
      });
    } else {
      document.getElementById('train-today-title').textContent = 'Начинаем во вторник, ' + format(start);
      var message = document.createElement('p'); message.textContent = 'Первый состав уже в расписании ниже.'; todayBody.appendChild(message);
    }
    var containers = days.map(function (d, i) {
      var details = document.createElement('details'); details.className = 'train-day' + (d.date === initialToday ? ' today' : ''); details.id = 'train-day-' + i;
      details.open = d.date === initialToday || (!today && i === 0);
      var summary = document.createElement('summary');
      var title = document.createElement('span'); title.textContent = d.name + ', ' + format(d.date) + (d.date === initialToday ? ' · сегодня' : '');
      var count = document.createElement('small'); count.textContent = data.seats + ' пассажиров';
      summary.append(title, count); var body = document.createElement('div'); body.appendChild(createTrain(d, ''));
      details.append(summary, body); document.getElementById('train-days').appendChild(details);
      return {details:details,body:body};
    });
    document.getElementById('train-query').addEventListener('input', function (event) {
      var query = normalize(event.target.value), result = document.getElementById('train-result');
      containers.forEach(function (c, i) {
        var matches = !query || days[i].players.some(function (name) { return normalize(name).includes(query); });
        c.details.hidden = !matches; c.details.open = query ? matches : (days[i].date === initialToday || (!today && i === 0));
        c.body.replaceChildren(createTrain(days[i],query));
      });
      if (today) todayBody.replaceChildren(createTrain(today,query));
      if (!query) { result.textContent = 'Здесь появятся дни ваших поездок.'; return; }
      var matching = passengers.filter(function (name) { return normalize(name).includes(query); });
      if (!matching.length) { result.textContent = 'Игрок не найден в пассажирской очереди. Машинисты в неё не входят.'; return; }
      var trips = days.filter(function (d) { return d.players.some(function (name) { return normalize(name).includes(query); }); });
      result.textContent = 'Найдено игроков: ' + matching.length + '. Дни поездок: ' + trips.map(function (d) { return d.name + ' ' + format(d.date) + ' — ' + d.wagons.map(function(w,i){return w.some(function(n){return normalize(n).includes(query);}) ? 'вагон '+(i+1) : '';}).filter(Boolean).join(', '); }).join(' · ');
    });
    function checkDay() { if (gameDate(Date.now()) !== initialToday) location.reload(); }
    setInterval(checkDay,30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDay(); });
  }).catch(function () {
    document.getElementById('train-total').textContent = 'Расписание временно недоступно';
    document.getElementById('train-today-body').textContent = 'Не удалось загрузить составы.';
    var error = document.getElementById('train-error'); error.hidden = false; error.textContent = 'Обновите страницу. Если расписание не появится, сообщите руководству альянса.';
  });
})();

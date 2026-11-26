(async function(){
  const status=document.getElementById('base-status'),grid=document.getElementById('building-cards'),detail=document.getElementById('building-detail');
  try{
    const response=await fetch('base-data.json');if(!response.ok)throw Error();const data=await response.json();
    const entries=[...Object.values(data.buildings).map(b=>({...b,kind:'Здание'})),...Object.values(data.decorations).map(b=>({...b,kind:'Декорация',group:'Декорации'}))];
    const names={level:'Уровень',power:'Мощность',dpower:'Прирост мощности',food:'Еда',metal:'Металл',oil:'Нефть',time:'Время',req:'Требования',heroExp:'Опыт героев',upCost:'Материалов для улучшения',cost:'Стоимость',star:'Звезда',ben:'Бонусы',total:'Суммарные бонусы',extra:'Дополнительные бонусы',stars:'Звёзды',maxLevel:'Максимальный уровень',maxPower:'Максимальная мощность',maxTotal:'Максимальные бонусы',workers:'Выжившие',desc:'Описание',partOf:'В составе',gives:'Открывает',contains:'Содержит'};
    const number=n=>typeof n==='number'?n.toLocaleString('ru-RU'):String(n);
    function value(v,key){
      if(v===null||v===undefined||v==='')return '—';
      if(key==='workers')return v.map(w=>w[1]+' — '+w[2]).join(' · ')||'—';
      if(key==='time'){const n=Math.round(v);return Math.floor(n/86400)+' д '+Math.floor(n%86400/3600)+' ч '+Math.floor(n%3600/60)+' мин '+n%60+' с';}
      if(['ben','total','extra','maxTotal'].includes(key)&&Array.isArray(v))return v.map(([id,n])=>(Array.isArray(data.stats[id])?data.stats[id][0]:(data.stats[id]||id))+' — '+(data.stats[id]&&data.stats[id][1]===1?number(n*100)+'%':number(n))).join(' · ')||'—';
      if(Array.isArray(v))return v.map(x=>typeof x==='object'?Object.entries(x).map(([k,n])=>(names[k]||k)+' — '+value(n,k)).join('; '):number(x)).join(' · ')||'—';
      if(typeof v==='object')return Object.entries(v).map(([k,n])=>(names[k]||k)+' — '+value(n,k)).join(' · ');
      return number(v);
    }
    function smallIcon(src,alt) {
      const image=document.createElement('img');image.src=src;image.alt=alt||'';image.className='fact-icon';return image;
    }
    function facts(obj,skip){
      const dl=document.createElement('dl');dl.className='base-facts';
      Object.entries(obj).filter(([k])=>!skip.includes(k)).forEach(([k,v])=>{const box=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=names[k]||k;dd.textContent=value(v,k);
      const resources={food:'Icon_Item_Food_0',metal:'Icon_Item_Wood_0',oil:'Icon_Item_Stone_0',heroExp:'Icon_Item_EXPWater_0'};
      const symbols={maxLevel:'🏗️',desc:'📖',level:'🏗️',power:'💪',dpower:'📈',time:'⏱️',req:'🏗️',upCost:'📦',stars:'⭐',ben:'✨',total:'✨',maxPower:'💪',maxTotal:'✨'};
      if(resources[k])dt.prepend(smallIcon('detail-'+resources[k]+'.png'));
      else if(symbols[k])dt.prepend(symbols[k]+' ');
      if(k==='workers') {
        dd.replaceChildren();
        v.forEach(w=>{const person=document.createElement('span');person.className='worker-item';person.append(smallIcon('detail-'+w[4]+'.png'),document.createTextNode(w[1]+' — '+w[2]));dd.append(person);});
      }
      if(k==='req'&&obj.rq) {
        dd.replaceChildren();
        obj.rq.forEach(q=>{if(q.type==='b'&&data.buildings[q.id]){const line=document.createElement('span');line.className='worker-item';line.append(picture(data.buildings[q.id]),document.createTextNode(q.name+' · ур. '+q.level));dd.append(line);}else if(q.text&&q.text.trim()!==';')dd.append(document.createTextNode(q.text));});
        if(!dd.textContent.trim())dd.textContent=value(v,k);
      }
      box.append(dt,dd);dl.append(box);});return dl;
    }
    function picture(b) {
      const img=document.createElement('img');
      img.src='game-'+(b.iconFolder||'buildings')+'-'+b.icon+'.png';
      img.alt=''; img.loading='lazy'; img.className='building-icon';
      return img;
    }
    const mobileLabel=document.createElement('label');mobileLabel.className='mobile-building-picker';mobileLabel.textContent='Выбрать постройку';
    const mobileSelect=document.createElement('select');mobileSelect.setAttribute('aria-label','Выбрать постройку');
    [...new Set(entries.map(b=>b.group))].forEach(group=>{const optgroup=document.createElement('optgroup');optgroup.label=group;entries.filter(b=>b.group===group).forEach(b=>{const option=document.createElement('option');option.value=b.id;option.textContent=b.name;optgroup.append(option);});mobileSelect.append(optgroup);});
    mobileSelect.addEventListener('change',()=>select(mobileSelect.value));mobileLabel.append(mobileSelect);const mobileMenu=document.createElement('details');mobileMenu.className='mobile-catalog-menu';const menuTitle=document.createElement('summary');menuTitle.textContent='🏗️ Выбрать постройку';mobileMenu.append(menuTitle);grid.before(mobileMenu);mobileMenu.append(grid);

    const desktopLayout=matchMedia('(min-width:701px)');
    function syncLayout(){mobileMenu.open=desktopLayout.matches;}
    desktopLayout.addEventListener('change',syncLayout);syncLayout();
    function select(id){
      const b=entries.find(b=>b.id===id);if(!b)return;
      mobileSelect.value=id;menuTitle.replaceChildren(picture(b),document.createTextNode(b.name+' — выбрать другую'));mobileMenu.open=matchMedia('(min-width:701px)').matches;detail.replaceChildren();detail.hidden=false;
      const h=document.createElement('h2');h.textContent=b.name;detail.append(picture(b),h);
      detail.append(facts(b,['id','name','icon','iconFolder','levels','kind','group','quality','hasStars','workers']));
      const levels=b.levels||[];
      if(levels.length){
        const label=document.createElement('label'),range=document.createElement('input'),body=document.createElement('div');
        range.type='range';range.min=0;range.max=levels.length-1;range.value=0;range.setAttribute('aria-label','Уровень '+b.name);
        function draw(){const level=levels[Number(range.value)];label.textContent='Уровень '+level.level;body.replaceChildren(facts(level,['rq']));}
        range.addEventListener('input',draw);detail.append(label,range,body);draw();
      }
      if(b.workers&&b.workers.length) detail.append(facts({workers:b.workers},[]));
      history.replaceState(null,'','#b-'+id);if(matchMedia('(max-width:700px)').matches)detail.scrollIntoView({block:'start'});
    }
    function render(){
      const query=document.getElementById('base-search').value.toLocaleLowerCase('ru');grid.replaceChildren();
      let previousGroup='';
      entries.filter(b=>(b.name+' '+b.group).toLocaleLowerCase('ru').includes(query)).sort((a,b)=>a.group.localeCompare(b.group,'ru')).forEach(b=>{if(b.group!==previousGroup){const heading=document.createElement('h3');heading.className='catalog-category';heading.textContent=b.group;grid.append(heading);previousGroup=b.group;}const button=document.createElement('button');button.type='button';button.className='catalog-tile';const title=document.createElement('b'),small=document.createElement('small');title.textContent=b.name;small.textContent=b.group+' · '+b.kind;button.append(picture(b),title,small);button.addEventListener('click',()=>select(b.id));grid.append(button);});
      status.textContent='Найдено: '+grid.querySelectorAll('button').length;
    }
    document.getElementById('base-search').addEventListener('input',render);render();select(location.hash.startsWith('#b-')?location.hash.slice(3):'1001');
  }catch(e){status.textContent='Не удалось загрузить здания. Обновите страницу.';}
})();

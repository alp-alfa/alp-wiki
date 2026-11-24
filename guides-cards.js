(function(){
  const main=document.querySelector('main');
  const grid=document.createElement('div');grid.className='catalog-grid';
  const entries=[...main.querySelectorAll(':scope > details')];
  const categories=new Map();
  entries.forEach(d=>{let p=d.previousElementSibling;while(p&&p.tagName!=='H2')p=p.previousElementSibling;categories.set(d,p?p.textContent:'Основное');});
  const equipment=main.querySelector('a[href="equipment.html"]');
  if(equipment){const card=equipment.closest('.card');const tile=document.createElement('a');tile.href='equipment.html';tile.className='catalog-tile';tile.textContent='🛡️ Экипировка первого отряда';grid.append(tile);card.remove();}
  const layout=document.createElement('div');layout.className='guides-layout';
  const content=document.createElement('section');content.className='selected-guide';
  grid.className='guide-list';const menu=document.createElement('details');menu.className='mobile-catalog-menu guide-menu';const title=document.createElement('summary');title.textContent='📖 Выбрать гайд';menu.append(title,grid);layout.append(menu,content);main.querySelector('h1').after(layout);
  let previousCategory='';
  entries.forEach((detail,index)=>{
    const category=categories.get(detail);if(category!==previousCategory){const heading=document.createElement('h3');heading.className='catalog-category';heading.textContent=category;grid.append(heading);previousCategory=category;}
    if(!detail.id)detail.id='guide-'+(index+1);
    content.append(detail);detail.removeAttribute('open');detail.hidden=true;detail.classList.add('guide-content');
    const button=document.createElement('button');button.className='catalog-tile';button.type='button';button.textContent=detail.querySelector('summary').textContent;
    const image=document.createElement('img');image.alt='';image.className='guide-icon';image.loading='lazy';
    image.src=button.textContent.includes('Радар')?'game-buildings-Icon_Build_Radar.png':button.textContent.includes('отряд')||button.textContent.includes('Геро')?'game-buildings-Icon_Build_Hospital.png':'game-buildings-Icon_Build_Castle01.png';button.prepend(image);
    button.addEventListener('click',()=>select(detail.id));grid.append(button);
  });
  main.querySelectorAll(':scope > h2').forEach(h=>h.hidden=true);
  function select(id){
    const selected=entries.find(d=>d.id===id||d.querySelector('[id="'+CSS.escape(id)+'"]'));
    if(!selected)return;
    entries.forEach(d=>{d.hidden=d!==selected;d.open=d===selected;});
    let back=document.getElementById('guide-back');
    if(!back){back=document.createElement('button');back.id='guide-back';back.type='button';back.className='catalog-tile';back.textContent='← Выбрать другой гайд';content.prepend(back);back.addEventListener('click',()=>{entries.forEach(d=>{d.hidden=true;d.open=false});back.hidden=true;history.replaceState(null,'',location.pathname);grid.scrollIntoView({block:'start'});});}
    title.textContent=selected.querySelector('summary').textContent+' — выбрать другой';menu.open=false;back.hidden=false;history.replaceState(null,'','#'+id);if(matchMedia('(max-width:700px)').matches)selected.scrollIntoView({block:'start'});
  }
  if(location.hash)select(decodeURIComponent(location.hash.slice(1)));else if(entries.length)select(entries[0].id);
  window.addEventListener('hashchange',()=>select(decodeURIComponent(location.hash.slice(1))));
})();

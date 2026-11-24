(function(){
  const main=document.querySelector('main');
  const grid=document.createElement('div');grid.className='catalog-grid';
  const entries=[...main.querySelectorAll(':scope > details')];
  const equipment=main.querySelector('a[href="equipment.html"]');
  if(equipment){const card=equipment.closest('.card');const tile=document.createElement('a');tile.href='equipment.html';tile.className='catalog-tile';tile.textContent='🛡️ Экипировка первого отряда';grid.append(tile);card.remove();}
  main.querySelector('h1').after(grid);
  entries.forEach((detail,index)=>{
    if(!detail.id)detail.id='guide-'+(index+1);
    detail.removeAttribute('open');detail.hidden=true;detail.classList.add('guide-content');
    const button=document.createElement('button');button.className='catalog-tile';button.type='button';button.textContent=detail.querySelector('summary').textContent;
    button.addEventListener('click',()=>select(detail.id));grid.append(button);
  });
  main.querySelectorAll(':scope > h2').forEach(h=>h.hidden=true);
  function select(id){
    const selected=entries.find(d=>d.id===id||d.querySelector('[id="'+CSS.escape(id)+'"]'));
    if(!selected)return;
    entries.forEach(d=>{d.hidden=d!==selected;d.open=d===selected;});
    let back=document.getElementById('guide-back');
    if(!back){back=document.createElement('button');back.id='guide-back';back.type='button';back.className='catalog-tile';back.textContent='← Выбрать другой гайд';grid.after(back);back.addEventListener('click',()=>{entries.forEach(d=>{d.hidden=true;d.open=false});back.hidden=true;history.replaceState(null,'',location.pathname);grid.scrollIntoView({block:'start'});});}
    back.hidden=false;history.replaceState(null,'','#'+id);selected.scrollIntoView({block:'start'});
  }
  if(location.hash)select(decodeURIComponent(location.hash.slice(1)));
  window.addEventListener('hashchange',()=>select(decodeURIComponent(location.hash.slice(1))));
})();

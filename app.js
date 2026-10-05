(async function(){
  const app=document.getElementById('app');
  try{
    const unit=await getUnitFromLocation();
    const bg=document.getElementById('background');
    if(unit&&unit.backgroundData){bg.style.backgroundImage=`url("${unit.backgroundData}")`;bg.style.opacity='1';document.documentElement.style.setProperty('--bg-blur',`${Number.isFinite(Number(unit.backgroundBlur))?Number(unit.backgroundBlur):7}px`)}
    if(!unit||unit.status!=='configured'){app.innerHTML=`<section class="empty"><strong>Toque+</strong>Esta unidade ainda não foi configurada.</section>`;return}
    const links=[['whatsapp','WhatsApp','Fale conosco',unit.whatsapp],['instagram','Instagram','Siga nosso perfil',unit.instagram],['google','Google','Avalie nossa empresa',unit.google],['maps','Como chegar','Abra no Maps',unit.maps],['site','Nosso site','Conheça mais',unit.site]].filter(x=>x[3]);
    app.innerHTML=`<section class="profile"><div class="logo-wrap">${unit.logoData?`<img src="${unit.logoData}" alt="Logo de ${esc(unit.name)}">`:`<span class="initials">${esc((unit.name||'').slice(0,2).toUpperCase())}</span>`}</div><h1 class="name">${esc(unit.name)}</h1>${unit.description?`<p class="description">${esc(unit.description)}</p>`:''}</section><section class="links">${links.map(([type,title,sub,href])=>`<a class="link link-${type}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-track="${type}"><span class="icon">${icon(type)}</span><span class="copy"><span class="title">${title}</span><span class="subtitle">${sub}</span></span><span class="arrow">›</span></a>`).join('')}</section><footer class="footer"><div class="brand">${logoMark()} <span>TOQUE+</span></div><div class="tagline">Conectando negócios a pessoas.</div></footer>`;
    try{await trackAction(unit.id,'visualizacao')}catch(e){console.warn('Não foi possível registrar a visualização:',e)}
    document.querySelectorAll('.link').forEach(el=>el.addEventListener('click',async()=>{const type=el.dataset.track;try{await trackAction(unit.id,type)}catch(e){console.warn('Não foi possível registrar o clique:',e)}el.classList.remove('burst');void el.offsetWidth;el.classList.add('burst')}));
  }catch(e){console.error(e);app.innerHTML=`<section class="empty"><strong>Toque+</strong>Não foi possível carregar esta unidade agora.<small>${esc(e.message||'Erro de conexão')}</small></section>`}
})();

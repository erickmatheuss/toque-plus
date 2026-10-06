const unitsEl=document.getElementById('units'),
form=document.getElementById('form'),
empty=document.getElementById('empty'),
title=document.getElementById('editorTitle'),
status=document.getElementById('status'),
preview=document.getElementById('logoPreview'),
logoInput=document.getElementById('logo'),
backgroundInput=document.getElementById('background'),
backgroundPreview=document.getElementById('backgroundPreview'),
backgroundBlur=document.getElementById('backgroundBlur'),
backgroundBlurValue=document.getElementById('backgroundBlurValue'),
unitUrl=document.getElementById('unitUrl'),
slugInput=document.getElementById('slug'),
copyUrl=document.getElementById('copyUrl'),
statsBox=document.getElementById('statsBox'),
refreshStats=document.getElementById('refreshStats'),
createUnit=document.getElementById('createUnit');

const markEl=document.getElementById('mark'),
brandLogoInput=document.getElementById('brandLogoInput'),
brandStatus=document.getElementById('brandStatus'),
removeBrandLogo=document.getElementById('removeBrandLogo');

const loginGate=document.getElementById('loginGate'),
adminApp=document.getElementById('adminApp'),
loginForm=document.getElementById('loginForm'),
loginEmail=document.getElementById('loginEmail'),
loginPassword=document.getElementById('loginPassword'),
loginError=document.getElementById('loginError'),
logout=document.getElementById('logout');

let selected=null;
let currentLogo='';
let currentBackground='';
let currentBackgroundBlur=7;


/* =========================================================
   IDENTIDADE DO TOQUE+
========================================================= */

function refreshBrandUI(){

  markEl.innerHTML=logoMark();

  brandStatus.textContent=
    getBrandLogo()
      ? 'Logo personalizado carregado.'
      : 'Logo oficial instalado.';

}


/* =========================================================
   LOGIN
========================================================= */

function showAdmin(){

  loginGate.hidden=true;
  adminApp.hidden=false;

  refreshBrandUI();
  renderUnits();

}


function showLogin(){

  adminApp.hidden=true;
  loginGate.hidden=false;

}


async function boot(){

  const {
    data:{
      session
    }
  }=await sb.auth.getSession();

  if(session){
    showAdmin();
  }else{
    showLogin();
  }

}


loginForm.addEventListener('submit',async e=>{

  e.preventDefault();

  loginError.textContent='Entrando...';

  const {
    error
  }=await sb.auth.signInWithPassword({
    email:loginEmail.value.trim(),
    password:loginPassword.value
  });

  if(error){

    loginError.textContent=error.message;
    return;

  }

  loginError.textContent='';

  showAdmin();

});


logout.addEventListener('click',async()=>{

  await sb.auth.signOut();

  location.reload();

});


sb.auth.onAuthStateChange((_event,session)=>{

  if(session){
    showAdmin();
  }else{
    showLogin();
  }

});


/* =========================================================
   LOGO DA MARCA
========================================================= */

brandLogoInput.addEventListener('change',()=>{

  const file=brandLogoInput.files[0];

  if(!file)return;

  if(file.type!=='image/png'){

    alert('Envie somente um arquivo PNG.');

    brandLogoInput.value='';

    return;

  }

  if(file.size>2*1024*1024){

    alert('O PNG deve ter no máximo 2 MB.');

    brandLogoInput.value='';

    return;

  }

  const reader=new FileReader();

  reader.onload=()=>{

    try{

      setBrandLogo(reader.result);

      refreshBrandUI();

    }catch{

      alert(
        'Não foi possível salvar o PNG no navegador. Tente uma imagem menor.'
      );

    }

  };

  reader.readAsDataURL(file);

});


removeBrandLogo.addEventListener('click',()=>{

  clearBrandLogo();

  brandLogoInput.value='';

  refreshBrandUI();

});


/* =========================================================
   URL PÚBLICA
========================================================= */

function publicUrl(u){

  return getPublicUrl(u);

}


/* =========================================================
   LISTA DE UNIDADES
========================================================= */

async function renderUnits(){

  unitsEl.innerHTML=
    '<div class="hint">Carregando unidades...</div>';

  try{

    const units=await getUnits();

    const ordered=Object.values(units).sort((a,b)=>{

      const na=parseInt(String(a.id).replace(/\D/g,''),10)||0;
      const nb=parseInt(String(b.id).replace(/\D/g,''),10)||0;

      return na-nb;

    });

    unitsEl.innerHTML=
      ordered.map(u=>`

        <button
          class="unit ${selected===u.id?'active':''}"
          data-id="${esc(u.id)}"
        >

          <strong>${esc(u.id)}</strong>

          <small>
            ${
              u.status==='configured'
                ? esc(u.name||u.slug)
                : 'Disponível'
            }
          </small>

          <span class="unit-state ${u.status}">
            ${
              u.status==='configured'
                ? 'ATIVA'
                : 'LIVRE'
            }
          </span>

        </button>

      `).join('');

    document
      .querySelectorAll('.unit')
      .forEach(b=>{

        b.onclick=()=>selectUnit(b.dataset.id);

      });

  }catch(e){

    unitsEl.innerHTML=
      `<div class="hint">
        Erro ao carregar: ${esc(e.message)}
      </div>`;

  }

}


/* =========================================================
   CRIAR NOVA UNIDADE
========================================================= */

function nextUnitCode(units){

  let highest=0;

  Object.values(units||{}).forEach(u=>{

    const match=String(u.id||'').toUpperCase().match(/^A(\d+)$/);

    if(match){

      const number=parseInt(match[1],10);

      if(number>highest){
        highest=number;
      }

    }

  });

  return `A${String(highest+1).padStart(3,'0')}`;

}


async function createNextUnit(){

  if(createUnit){
    createUnit.disabled=true;
    createUnit.querySelector('strong').textContent='Criando unidade...';
  }

  try{

    const units=await getUnits();

    const code=nextUnitCode(units);

    const exists=Object.values(units).some(
      u=>String(u.id).toUpperCase()===code
    );

    if(exists){
      throw new Error(`A unidade ${code} já existe.`);
    }

    const {
      error
    }=await sb
      .from('unidades')
      .insert({
        codigo:code,
        cliente_id:null,
        status:'LIVRE',
        apelido:null,
        atualizado_em:new Date().toISOString()
      });

    if(error)throw error;

    await renderUnits();

    await selectUnit(code);

  }catch(e){

    alert(
      `Não foi possível criar a unidade: ${e.message}`
    );

  }finally{

    if(createUnit){

      createUnit.disabled=false;

      createUnit.querySelector('strong').textContent=
        'Criar nova unidade';

    }

  }

}


createUnit?.addEventListener(
  'click',
  createNextUnit
);


/* =========================================================
   URL DA UNIDADE
========================================================= */

function updateUrl(u){

  unitUrl.textContent=publicUrl(u);

  if(copyUrl){

    copyUrl.dataset.url=publicUrl(u);

  }

}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

async function updateStats(u){

  statsBox.innerHTML=`

    <div>
      <strong>…</strong>
      <small>Carregando</small>
    </div>

  `;

  try{

    const s=await getStats(u.id);

    statsBox.innerHTML=`

      <div>
        <strong>${s.views||0}</strong>
        <small>Acessos</small>
      </div>

      <div>
        <strong>${s.whatsapp||0}</strong>
        <small>WhatsApp</small>
      </div>

      <div>
        <strong>${s.instagram||0}</strong>
        <small>Instagram</small>
      </div>

      <div>
        <strong>${s.google||0}</strong>
        <small>Google</small>
      </div>

      <div>
        <strong>${s.maps||0}</strong>
        <small>Maps</small>
      </div>

    `;

  }catch(e){

    statsBox.innerHTML=`

      <div>
        <strong>—</strong>
        <small>Erro nas métricas</small>
      </div>

    `;

  }

}


refreshStats?.addEventListener('click',async()=>{

  if(!selected)return;

  refreshStats.disabled=true;

  refreshStats.textContent='↻ Atualizando...';

  try{

    const u=await getUnit(selected);

    if(u){

      await updateStats(u);

    }

  }catch(e){

    alert(
      `Não foi possível atualizar os acessos: ${e.message}`
    );

  }finally{

    refreshStats.disabled=false;

    refreshStats.textContent='↻ Atualizar acessos';

  }

});


/* =========================================================
   SELECIONAR UNIDADE
========================================================= */

async function selectUnit(id){

  selected=id;

  const u=
    await getUnit(id)||
    {
      id,
      status:'available'
    };

  renderUnits();

  form.hidden=false;

  empty.hidden=true;

  title.textContent=
    u.name||
    `Unidade ${id}`;

  status.textContent=
    u.status==='configured'
      ? 'Configurada'
      : 'Disponível';

  document.getElementById('name').value=
    u.name||'';

  document.getElementById('description').value=
    u.description||'';

  slugInput.value=
    u.slug||
    id.toLowerCase();

  document.getElementById('whatsapp').value=
    u.whatsappRaw||'';

  document.getElementById('instagram').value=
    u.instagramRaw||'';

  document.getElementById('google').value=
    u.google||'';

  document.getElementById('maps').value=
    u.maps||'';

  document.getElementById('site').value=
    u.site||'';

  currentLogo=
    u.logoData||'';

  currentBackground=
    u.backgroundData||'';

  currentBackgroundBlur=
    Number.isFinite(
      Number(u.backgroundBlur)
    )
      ? Number(u.backgroundBlur)
      : 7;

  backgroundBlur.value=
    currentBackgroundBlur;

  backgroundBlurValue.textContent=
    `${currentBackgroundBlur}px`;

  preview.innerHTML=
    currentLogo
      ? `<img src="${esc(currentLogo)}" alt="Prévia">`
      : 'Prévia da logo';

  backgroundPreview.style.backgroundImage=
    currentBackground
      ? `url("${currentBackground}")`
      : '';

  backgroundPreview.style.filter=
    `blur(${currentBackgroundBlur}px)`;

  backgroundPreview.style.transform=
    'scale(1.015)';

  backgroundPreview.textContent=
    currentBackground
      ? ''
      : 'Prévia da imagem de fundo';

  updateUrl(u);

  updateStats(u);

}


/* =========================================================
   LOGO DO CLIENTE
========================================================= */

logoInput.addEventListener('change',()=>{

  const file=logoInput.files[0];

  if(!file)return;

  const reader=new FileReader();

  reader.onload=()=>{

    const img=new Image();

    img.onload=()=>{

      const max=600;

      const scale=
        Math.min(
          1,
          max/img.width,
          max/img.height
        );

      const canvas=
        document.createElement('canvas');

      canvas.width=
        Math.max(
          1,
          Math.round(img.width*scale)
        );

      canvas.height=
        Math.max(
          1,
          Math.round(img.height*scale)
        );

      const ctx=
        canvas.getContext('2d');

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      currentLogo=
        canvas.toDataURL(
          'image/webp',
          .84
        );

      preview.innerHTML=
        `<img src="${esc(currentLogo)}" alt="Prévia">`;

    };

    img.src=reader.result;

  };

  reader.readAsDataURL(file);

});


/* =========================================================
   DESFOQUE
========================================================= */

backgroundBlur.addEventListener('input',()=>{

  currentBackgroundBlur=
    Number(backgroundBlur.value);

  backgroundBlurValue.textContent=
    `${currentBackgroundBlur}px`;

  backgroundPreview.style.filter=
    `blur(${currentBackgroundBlur}px)`;

});


/* =========================================================
   IMAGEM DE FUNDO
========================================================= */

backgroundInput.addEventListener('change',()=>{

  const file=backgroundInput.files[0];

  if(!file)return;

  const reader=new FileReader();

  reader.onload=()=>{

    const img=new Image();

    img.onload=()=>{

      const max=1400;

      const scale=
        Math.min(
          1,
          max/img.width,
          max/img.height
        );

      const canvas=
        document.createElement('canvas');

      canvas.width=
        Math.max(
          1,
          Math.round(img.width*scale)
        );

      canvas.height=
        Math.max(
          1,
          Math.round(img.height*scale)
        );

      const ctx=
        canvas.getContext('2d');

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      currentBackground=
        canvas.toDataURL(
          'image/webp',
          .78
        );

      backgroundPreview.style.backgroundImage=
        `url("${currentBackground}")`;

      backgroundPreview.style.filter=
        `blur(${currentBackgroundBlur}px)`;

      backgroundPreview.style.transform=
        'scale(1.015)';

      backgroundPreview.textContent='';

    };

    img.src=reader.result;

  };

  reader.readAsDataURL(file);

});


/* =========================================================
   SALVAR
========================================================= */

form.addEventListener('submit',async e=>{

  e.preventDefault();

  const button=
    form.querySelector(
      'button[type="submit"]'
    );

  button.disabled=true;

  button.textContent='Salvando...';

  /*
    Abre a nova aba imediatamente,
    antes das operações assíncronas,
    evitando bloqueio do navegador.
  */

  const previewWindow=
    window.open(
      'about:blank',
      '_blank'
    );

  try{

    const name=
      document
        .getElementById('name')
        .value
        .trim();

    const slug=
      slugify(
        slugInput.value.trim()||
        name||
        selected
      );

    const u={

      id:selected,

      name:name,

      description:
        document
          .getElementById('description')
          .value
          .trim(),

      slug:slug,

      logoData:currentLogo,

      backgroundData:currentBackground,

      backgroundBlur:
        currentBackgroundBlur,

      whatsappRaw:
        document
          .getElementById('whatsapp')
          .value
          .trim(),

      whatsapp:
        normalizeWhatsApp(
          document.getElementById('whatsapp').value
        ),

      instagramRaw:
        document
          .getElementById('instagram')
          .value
          .trim(),

      instagram:
        normalizeInstagram(
          document.getElementById('instagram').value
        ),

      google:
        normalizeUrl(
          document.getElementById('google').value
        ),

      maps:
        normalizeUrl(
          document.getElementById('maps').value
        ),

      site:
        normalizeUrl(
          document.getElementById('site').value
        )

    };


    const saved=
      await setUnit(u);


    await renderUnits();


    status.textContent=
      'Configurada';


    updateUrl(saved);


    await updateStats(saved);


    const target=
      `index.html?unit=${encodeURIComponent(selected)}`;


    if(
      previewWindow&&
      !previewWindow.closed
    ){

      previewWindow.location.href=
        target;

      previewWindow.focus();

    }else{

      location.href=target;

    }


  }catch(e){

    if(
      previewWindow&&
      !previewWindow.closed
    ){

      previewWindow.close();

    }

    alert(
      `Não foi possível salvar: ${e.message}`
    );

  }finally{

    button.disabled=false;

    button.textContent=
      'Salvar e visualizar';

  }

});


/* =========================================================
   LIBERAR UNIDADE
========================================================= */

document
  .getElementById('release')
  .onclick=async()=>{

    if(!selected)return;

    if(
      confirm(
        `Liberar ${selected} para reutilização?`
      )
    ){

      try{

        await releaseUnit(selected);

        await selectUnit(selected);

      }catch(e){

        alert(
          `Não foi possível liberar: ${e.message}`
        );

      }

    }

  };


/* =========================================================
   COPIAR URL
========================================================= */

copyUrl?.addEventListener(
  'click',
  async()=>{

    const url=
      copyUrl.dataset.url;

    if(!url)return;

    try{

      await navigator.clipboard.writeText(url);

      copyUrl.textContent=
        'Copiado!';

      setTimeout(
        ()=>copyUrl.textContent='Copiar URL',
        1200
      );

    }catch{

      prompt(
        'Copie a URL:',
        url
      );

    }

  }
);


/* =========================================================
   INICIAR
========================================================= */

boot();

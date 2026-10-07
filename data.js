const SUPABASE_URL='https://snihyrudiyuslimhlkvq.supabase.co';
const SUPABASE_KEY='sb_publishable_sebHe5m45BFJGvTnp3N51A_0wveqQLr';
const TOQUE_BRAND_KEY='toqueplus_brand_logo_v2';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const defaultUnits={};
for(let i=1;i<=5;i++){
  const id=`A${String(i).padStart(3,'0')}`;
  defaultUnits[id]={id,status:'available',name:'',description:'',logoData:'',backgroundData:'',backgroundBlur:7,whatsappRaw:'',whatsapp:'',instagramRaw:'',instagram:'',google:'',maps:'',site:'',slug:id.toLowerCase(),createdAt:'',updatedAt:'',stats:{views:0,whatsapp:0,instagram:0,google:0,maps:0,site:0}};
}
function clone(v){return JSON.parse(JSON.stringify(v));}
function slugify(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function normalizeWhatsApp(v){v=(v||'').trim();if(!v)return'';if(/^https?:\/\//i.test(v))return v;const digits=v.replace(/\D/g,'');return digits?`https://wa.me/${digits}`:''}
function normalizeInstagram(v){v=(v||'').trim();if(!v)return'';if(/^https?:\/\//i.test(v))return v;const handle=v.replace(/^@/,'').replace(/^instagram\.com\//i,'').split(/[\/?#]/)[0];return handle?`https://instagram.com/${handle}`:''}
function normalizeUrl(v){v=(v||'').trim();if(!v)return'';return /^https?:\/\//i.test(v)?v:`https://${v}`}
function getBrandLogo(){try{return localStorage.getItem(TOQUE_BRAND_KEY)||''}catch{return''}}
function setBrandLogo(data){localStorage.setItem(TOQUE_BRAND_KEY,data)}
function clearBrandLogo(){localStorage.removeItem(TOQUE_BRAND_KEY)}
function logoMark(){const src=getBrandLogo()||'/logo-toque.png';return `<img class="brand-mark brand-logo-image" src="${src}" alt="Toque+" aria-hidden="true" draggable="false">`}
function getPublicUrl(unit){const base=location.href.replace(/[^/]*$/,'');return `${base}q/${encodeURIComponent(String(unit.id||'').toUpperCase())}`}
function emptyUnit(id){return clone(defaultUnits[String(id).toUpperCase()]||{id:String(id).toUpperCase(),status:'available',stats:{views:0,whatsapp:0,instagram:0,google:0,maps:0,site:0}})}

async function dbGetUnits(){
  const {data,error}=await sb.from('unidades').select('*,clientes(*)').order('codigo');
  if(error) throw error;
  const out={};
  for(const row of data||[]){
    const c=row.clientes;
    const u=emptyUnit(row.codigo);
    u.id=row.codigo;u.status=row.status==='ATIVA'?'configured':'available';u.slug=(row.apelido||row.codigo).toLowerCase();
    if(c){
      u.name=c.nome||'';u.description=c.descricao||'';u.logoData=c.logo_url||'';u.backgroundData=c.fundo_url||'';u.backgroundBlur=Number.isFinite(Number(c.blur))?Number(c.blur):7;
      u.whatsapp=u.whatsapp||normalizeWhatsApp(c.whatsapp||'');u.whatsappRaw=c.whatsapp||'';
      u.instagram=normalizeInstagram(c.instagram||'');u.instagramRaw=c.instagram||'';u.google=c.google||'';u.maps=c.maps||'';u.site=c.website||'';
      u.slug=row.apelido||slugify(c.nome)||row.codigo.toLowerCase();u.createdAt=c.criado_em||'';u.updatedAt=c.atualizado_em||'';
    }
    out[u.id]=u;
  }
  for(const id of Object.keys(defaultUnits)) if(!out[id]) out[id]=emptyUnit(id);
  return out;
}
async function getUnits(){return dbGetUnits()}
async function getUnit(id){const key=String(id).toUpperCase();const {data,error}=await sb.from('unidades').select('*,clientes(*)').eq('codigo',key).maybeSingle();if(error)throw error;if(!data)return null;const u=emptyUnit(key);u.id=key;u.status=data.status==='ATIVA'?'configured':'available';u.slug=(data.apelido||key).toLowerCase();const c=data.clientes;if(c){u.name=c.nome||'';u.description=c.descricao||'';u.logoData=c.logo_url||'';u.backgroundData=c.fundo_url||'';u.backgroundBlur=Number.isFinite(Number(c.blur))?Number(c.blur):7;u.whatsappRaw=c.whatsapp||'';u.whatsapp=normalizeWhatsApp(c.whatsapp||'');u.instagramRaw=c.instagram||'';u.instagram=normalizeInstagram(c.instagram||'');u.google=c.google||'';u.maps=c.maps||'';u.site=c.website||'';u.createdAt=c.criado_em||'';u.updatedAt=c.atualizado_em||'';}return u}
async function setUnit(unit){
  if(!unit?.id) throw new Error('Unidade inválida');
  const id=String(unit.id).toUpperCase();
  const {data:existing,error:e1}=await sb.from('unidades').select('id,cliente_id,apelido').eq('codigo',id).single();
  if(e1) throw e1;
  const clientPayload={nome:unit.name.trim(),descricao:unit.description||'',logo_url:unit.logoData||'',fundo_url:unit.backgroundData||'',blur:Number(unit.backgroundBlur)||0,whatsapp:unit.whatsappRaw||'',instagram:unit.instagramRaw||'',google:unit.google||'',maps:unit.maps||'',website:unit.site||'',atualizado_em:new Date().toISOString()};
  let clientId=existing.cliente_id;
  if(clientId){const {error}=await sb.from('clientes').update(clientPayload).eq('id',clientId);if(error)throw error}
  else {const {data,error}=await sb.from('clientes').insert(clientPayload).select('id').single();if(error)throw error;clientId=data.id}
  const unitPayload={cliente_id:clientId,status:'ATIVA',apelido:slugify(unit.slug||unit.name||id),atualizado_em:new Date().toISOString()};
  const {error}=await sb.from('unidades').update(unitPayload).eq('codigo',id);if(error)throw error;
  return getUnit(id)
}
async function releaseUnit(id){const u=await getUnit(id);if(!u)return null;const {data:row,error:e1}=await sb.from('unidades').select('id,cliente_id').eq('codigo',String(id).toUpperCase()).single();if(e1)throw e1;if(row.cliente_id){const {error}=await sb.from('clientes').delete().eq('id',row.cliente_id);if(error)throw error}const {error}=await sb.from('unidades').update({cliente_id:null,status:'LIVRE',apelido:null,atualizado_em:new Date().toISOString()}).eq('codigo',String(id).toUpperCase());if(error)throw error;return getUnit(id)}
async function getUnitFromLocation(){const path=location.pathname.replace(/\\/g,'/');const m=path.match(/\/q\/([^/]+)/i);if(m){const key=decodeURIComponent(m[1]).toLowerCase();const units=await getUnits();return Object.values(units).find(u=>u.slug===key||u.id.toLowerCase()===key)||null}const params=new URLSearchParams(location.search);return getUnit((params.get('unit')||'A001').toUpperCase())}
async function trackAction(id,type){
  const codigo=String(id||'').toUpperCase().trim();

  if(!codigo || !type) return;

  const {error}=await sb.rpc('registrar_acesso',{
    p_codigo:codigo,
    p_tipo:type
  });

  if(error){
    console.error('Erro ao registrar acesso:',error);
  }
}
async function getStats(id){const {data:row,error:e1}=await sb.from('unidades').select('id').eq('codigo',String(id).toUpperCase()).single();if(e1)throw e1;const types=['visualizacao','whatsapp','instagram','google','maps','site'];const out={views:0,whatsapp:0,instagram:0,google:0,maps:0,site:0};for(const type of types){const {count,error}=await sb.from('acessos').select('id',{count:'exact',head:true}).eq('unidade_id',row.id).eq('tipo',type);if(error)throw error;out[type==='visualizacao'?'views':type]=count||0}return out}
function icon(type){const common='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';if(type==='whatsapp')return `<svg viewBox="0 0 24 24" ${common}><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.2 7.7c.3-.5.6-.5 1-.4l1 .8c.3.2.4.5.2.8l-.5.7c.7 1.3 1.7 2.2 3 2.9l.7-.5c.3-.2.6-.1.8.1l.8 1c.2.3.1.7-.2.9-.5.4-1.2.7-1.8.5-3.4-.8-6-3.4-6.8-6.8-.1-.6.1-1.3.5-1.8Z"/></svg>`;if(type==='instagram')return `<svg viewBox="0 0 24 24" ${common}><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.7" r=".8" fill="currentColor" stroke="none"/></svg>`;if(type==='google')return `<svg viewBox="0 0 24 24" ${common}><path d="M20.5 12.2c0 4.9-3.4 8.3-8.4 8.3a8.5 8.5 0 1 1 5.9-14.7l-2.2 2.1"/><path d="M12 12h8"/></svg>`;if(type==='maps')return `<svg viewBox="0 0 24 24" ${common}><path d="M20 10.2c0 5.1-8 11-8 11s-8-5.9-8-11a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;return `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3Z"/> </svg>`}

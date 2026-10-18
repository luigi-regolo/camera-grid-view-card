/**
 * Camera Grid View Card — Home Assistant dashboard card.
 * Copyright (c) 2026 luigi-regolo. SPDX-License-Identifier: GPL-3.0-only.
 * No telemetry, remote scripts, external assets, or credentials.
 */
const CG_TAG = 'camera-grid-view-card';
const CG_EDITOR_TAG = 'camera-grid-view-card-editor';
const CG_DOMAINS = Object.freeze({
  image_entity: ['image'], motion_entity: ['binary_sensor'],
  last_event_entity: ['sensor', 'input_datetime'],
  battery_entity: ['sensor'],
  audio_state_entity: ['switch', 'input_boolean', 'binary_sensor', 'sensor'],
  audio_control_entity: ['switch', 'input_boolean'],
});
const CG_DEFAULTS = Object.freeze({
  title: 'Telecamere', eyebrow: 'CAMERA GRID VIEW CARD', theme_mode: 'auto',
  layout: 'auto', custom_columns: 3, controls_enabled: false, cameras: [],
});
function cgText(value, max=100) { return String(value ?? '').trim().slice(0,max); }
function cgEsc(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cgEntity(value, domains) {
  const id=cgText(value,160);
  return domains.includes(id.split('.')[0]) && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(id) ? id : '';
}
function cgCamera(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  const c={name:cgText(r.name,60),show_preview:r.show_preview===true,audio_control_enabled:r.audio_control_enabled===true};
  for(const [key,domains] of Object.entries(CG_DOMAINS)) c[key]=cgEntity(r[key],domains);
  return c;
}
function cgConfig(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  return {
    type: 'custom:camera-grid-view-card',
    title:cgText(r.title??CG_DEFAULTS.title,60),
    eyebrow:cgText(r.eyebrow??CG_DEFAULTS.eyebrow,60),
    theme_mode:['auto','light','dark'].includes(r.theme_mode)?r.theme_mode:'auto',
    layout:['auto','1','2','4','custom'].includes(String(r.layout))?String(r.layout):'auto',
    custom_columns:Number.isInteger(Number(r.custom_columns)) ? Math.max(1,Math.min(12,Number(r.custom_columns))) : 3,
    controls_enabled:r.controls_enabled===true,
    // No fixed maximum: users decide how many camera panels to configure.
    cameras:Array.isArray(r.cameras)?r.cameras.map(cgCamera):[],
  };
}
function cgKnown(entity) {return !!entity && !['unknown','unavailable',''].includes(entity.state);}
function cgImageUrl(entity) {
  if(!cgKnown(entity))return '';
  const url=entity?.attributes?.entity_picture;
  if(typeof url!=='string' || !url.startsWith('/') || url.startsWith('//') || url.includes('\\') || /[\x00-\x1f]/.test(url))return '';
  // Whitelist same-origin Home Assistant paths. Never accept external or javascript/data URLs.
  const v=encodeURIComponent(String(entity.state).slice(0,100));
  return v?`${url}${url.includes('?')?'&':'?'}cg_v=${v}`:url;
}
function cgTime(iso, now=Date.now()) {
  if(typeof iso!=='string')return null;
  const ms=Date.parse(iso);
  if(!Number.isFinite(ms)||ms>now+60000)return null;
  const min=Math.floor(Math.max(0,now-ms)/60000);
  const relative=min<1?'adesso':min<60?`${min} min fa`:min<1440?`${Math.floor(min/60)} ore fa`:`${Math.floor(min/1440)} giorni fa`;
  const exact=new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));
  return {ms,relative,exact};
}
function cgLatestMovement(rows, fromMs) {
  if(!Array.isArray(rows))return null;
  let best=null;
  for(const row of rows){
    if(!Array.isArray(row))continue;
    for(let i=1;i<row.length;i++){
      if(row[i]?.state==='on'&&row[i-1]?.state!=='on'){
        const iso=row[i].last_changed||row[i].last_updated;
        const t=Date.parse(iso);
        if(Number.isFinite(t)&&t>=fromMs&&(!best||t>Date.parse(best)))best=iso;
      }
    }
  }
  return best;
}
function cgBoolState(entity){
  if(!cgKnown(entity))return null;
  if(entity.state==='on')return true;
  if(entity.state==='off')return false;
  return null;
}
const cgIcon=(name)=>`<ha-icon icon="mdi:${name}" aria-hidden="true"></ha-icon>`;
const CG_STYLE=`
:host{display:block;color:var(--primary-text-color,#17211d);font-family:var(--ha-font-family-body,Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif)}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}
.cg-root{--cg-accent:#0a7156;--cg-muted:#56675c;--cg-surface:#f0f2ef;--cg-border:#e0e5df;--cg-bg:#fafbf9;--cg-fg:#18221c;--cg-shadow:0 16px 50px #0003;background:var(--cg-bg);color:var(--cg-fg);border-radius:22px;padding:20px;position:relative}
.cg-root.cg-dark{--cg-accent:#0e795d;--cg-muted:#bbc5bd;--cg-surface:#191c1a;--cg-border:#2b302c;--cg-bg:#101211;--cg-fg:#f5f7f4}
.cg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}.cg-eyebrow{font-size:10px;letter-spacing:2.2px;font-weight:700;color:var(--cg-muted);text-transform:uppercase}.cg-title{font-size:25px;line-height:1.14;font-weight:780;letter-spacing:-.7px;margin-top:6px;overflow-wrap:anywhere}.cg-title b{color:var(--cg-accent);font-weight:800}
.cg-grid{display:grid;grid-template-columns:repeat(var(--cg-cols,2),minmax(0,1fr));gap:12px}.cg-cell{background:var(--cg-surface);border:1px solid var(--cg-border);color:inherit;padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:10px;text-align:left;min-width:0;transition:border-color .16s,transform .16s}.cg-cell:hover{border-color:var(--cg-accent)}.cg-cell:focus-visible,.cg-btn:focus-visible{outline:2px solid var(--cg-accent);outline-offset:2px}.cg-top{display:flex;align-items:center;gap:9px;min-width:0}.cg-top ha-icon{color:var(--cg-accent)}.cg-name{font-size:14px;font-weight:640;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}.cg-arrow{color:var(--cg-muted)}.cg-preview{width:100%;aspect-ratio:16/10;border-radius:11px;background:var(--cg-bg);object-fit:cover;display:block}.cg-placeholder{border:1px dashed var(--cg-border);border-radius:11px;min-height:70px;display:flex;align-items:center;gap:9px;justify-content:center;color:var(--cg-muted);font-size:12px}.cg-open-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;background:var(--cg-accent);color:#fff;font-size:11px;font-weight:700;line-height:1.2;letter-spacing:.05px}.cg-open-badge ha-icon{--mdc-icon-size:14px;width:14px;height:14px;color:#fff}.cg-meta{font-size:12px;color:var(--cg-muted);line-height:1.4}.cg-empty{padding:12px;color:var(--cg-muted);font-size:13px}
.cg-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px}.cg-dialog{width:min(460px,100%);max-height:min(90vh,850px);overflow:auto;background:var(--cg-bg);border:1px solid var(--cg-border);border-radius:22px;padding:20px;box-shadow:var(--cg-shadow)}.cg-dialog-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:17px;font-size:19px}.cg-btn{border:1px solid var(--cg-border);border-radius:12px;padding:10px 12px;background:var(--cg-surface);color:var(--cg-fg);display:inline-flex;align-items:center;gap:8px}.cg-icon-btn{padding:6px;border:0;background:transparent;color:var(--cg-muted)}.cg-snapshot-title{font-size:12px;font-weight:650;color:var(--cg-muted);margin-bottom:8px}.cg-dialog .cg-preview{aspect-ratio:4/3}.cg-event{margin-top:13px;padding:12px;border-radius:13px;background:var(--cg-surface);display:flex;gap:11px;align-items:center}.cg-event ha-icon{color:var(--cg-accent);flex:none}.cg-event strong{font-size:13px;font-weight:650}.cg-event .cg-meta{margin-top:3px}.cg-split{justify-content:space-between}.cg-action{margin-top:13px;width:100%;justify-content:center}.cg-error{margin-top:12px;color:#c74f4f;font-size:12px}.cg-badge{font-size:12px;color:var(--cg-muted)}
@media(max-width:580px){.cg-root{padding:15px}.cg-grid{grid-template-columns:repeat(min(var(--cg-cols,2),2),minmax(0,1fr))}.cg-cell{padding:10px}.cg-name{font-size:12px}.cg-title{font-size:20px}}@media(max-width:340px){.cg-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.cg-cell{transition:none}}
`;
class CameraGridViewCard extends HTMLElement {
  static getStubConfig(){return cgConfig();}
  static getConfigElement(){return document.createElement(CG_EDITOR_TAG);}
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._opened=null;
    this._busy=false;this._error='';this._lastSignature='';this._movement=new Map();this._querying=new Set();
    this.shadowRoot.addEventListener('click',event=>this._click(event));
    this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape'&&this._opened!==null)this._close();});
    this._onAppearance=()=>this._paint();
    this._media=typeof window!=='undefined'&&typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme:dark)'):null;
  }
  connectedCallback(){this._media?.addEventListener?.('change',this._onAppearance);this._paint();}
  disconnectedCallback(){this._media?.removeEventListener?.('change',this._onAppearance);}
  setConfig(raw){this._config=cgConfig(raw);this._opened=null;this._movement.clear();this._lastSignature='';this._paint();}
  set hass(hass){this._hass=hass;this._paint();}
  getCardSize(){return Math.max(2,Math.ceil(this._config.cameras.length/2)*2+1);}
  _state(id){return id?this._hass?.states?.[id]:undefined;}
  _isDark(){return this._config.theme_mode==='dark'||(this._config.theme_mode==='auto'&&(this._hass?.themes?.darkMode===true||(!this._hass?.themes&&this._media?.matches)));}
  _lastEvent(c){
    const e=this._state(c.last_event_entity);const raw=c.last_event_entity&&cgKnown(e)?e.state:null;
    if(raw&&cgTime(raw))return raw;
    const motion=this._state(c.motion_entity);
    if(cgBoolState(motion)===true&&cgTime(motion.last_changed))return motion.last_changed;
    return this._movement.get(c.motion_entity)||null;
  }
  _row(c,i){
    const title=c.name||this._state(c.image_entity)?.attributes?.friendly_name||`Telecamera ${i+1}`;
    // IMPORTANT: when show_preview=false, the snapshot URL never enters the DOM.
    const image=c.show_preview?cgImageUrl(this._state(c.image_entity)):'';
    const visual=c.show_preview?(image?`<img class="cg-preview" alt="Ultima immagine: ${cgEsc(title)}" src="${cgEsc(image)}" loading="lazy"/>`:'<div class="cg-placeholder">'+cgIcon('image-off-outline')+'Immagine non disponibile</div>'):'';
    const last=cgTime(this._lastEvent(c));
    return `<button type="button" class="cg-cell" data-open="${i}" aria-label="Apri dettaglio ${cgEsc(title)}"><div class="cg-top">${cgIcon('cctv')}<span class="cg-name">${cgEsc(title)}</span><span class="cg-arrow">${cgIcon('chevron-right')}</span></div>${visual}<div class="cg-meta">${last?'Ultimo movimento · '+cgEsc(last.relative):'Ultimo movimento · Non disponibile'}</div><span class="cg-open-badge">${cgIcon('camera-outline')} Apri telecamera</span></button>`;
  }
  _audio(c){
    const entity=this._state(c.audio_state_entity||c.audio_control_entity);
    return cgBoolState(entity);
  }
  _popup(index){
    const c=this._config.cameras[index];if(!c)return '';
    const title=c.name||this._state(c.image_entity)?.attributes?.friendly_name||`Telecamera ${index+1}`;
    const url=cgImageUrl(this._state(c.image_entity));
    const last=cgTime(this._lastEvent(c));
    const bat=this._state(c.battery_entity);const n=Number(bat?.state);
    const battery=c.battery_entity&&cgKnown(bat)&&Number.isFinite(n)&&n>=0&&n<=100?Math.round(n):null;
    const control=this._state(c.audio_control_entity);
    const current=cgBoolState(control);const audio=this._audio(c);
    const mayControl=this._config.controls_enabled&&c.audio_control_enabled&&!!c.audio_control_entity&&current!==null;
    let content=`<div class="cg-dialog-head"><strong>${cgEsc(title)}</strong><button class="cg-btn cg-icon-btn" type="button" data-close="1" aria-label="Chiudi">${cgIcon('close')}</button></div>`;
    content+=`<div class="cg-snapshot-title">Ultima immagine rilevata</div>${url?`<img class="cg-preview" src="${cgEsc(url)}" alt="Ultima immagine rilevata: ${cgEsc(title)}"/>`:'<div class="cg-placeholder">Immagine non disponibile. Configura un’entità image.*</div>'}`;
    content+=`<div class="cg-event">${cgIcon('motion-sensor')}<div><strong>Ultimo movimento rilevato</strong><div class="cg-meta">${last?cgEsc(last.relative)+' · '+cgEsc(last.exact):'Non disponibile negli eventi recenti'}</div></div></div>`;
    if(c.audio_state_entity||c.audio_control_entity){
      const label=audio===true?'Attivo':audio===false?'Disattivo':'Non disponibile';
      content+=`<div class="cg-event cg-split"><div style="display:flex;align-items:center;gap:11px">${cgIcon('microphone')}<div><strong>Audio</strong><div class="cg-meta">${label}</div></div></div>${mayControl?`<button type="button" class="cg-btn" data-audio="${index}" ${this._busy?'disabled':''}>${current===true?'Disattiva':'Attiva'}</button>`:''}</div>`;
    }
    if(c.battery_entity&&battery!==null)content+=`<div class="cg-event">${cgIcon('battery')}<div><strong>Batteria</strong><div class="cg-meta">${battery}%</div></div></div>`;
    if(c.image_entity)content+=`<button type="button" class="cg-btn cg-action" data-more="${cgEsc(c.image_entity)}">${cgIcon('arrow-expand')} Apri dettagli immagine</button>`;
    if(this._error)content+=`<div class="cg-error" role="alert">${cgEsc(this._error)}</div>`;
    return `<div class="cg-backdrop" data-backdrop="1"><div class="cg-dialog" role="dialog" aria-modal="true" aria-label="Dettaglio ${cgEsc(title)}">${content}</div></div>`;
  }
  _signature(){
    const ids=this._config.cameras.flatMap(c=>Object.keys(CG_DOMAINS).map(k=>c[k]).filter(Boolean));
    const rows=[...new Set(ids)].map(id=>{const e=this._state(id);return [id,e?.state,e?.last_changed,e?.attributes?.entity_picture];});
    return JSON.stringify([this._config,rows,this._opened,this._busy,this._error,[...this._movement],this._isDark(),Math.floor(Date.now()/60000)]);
  }
  _paint(){
    if(!this.shadowRoot||!this.isConnected)return;
    const sig=this._signature();if(sig===this._lastSignature)return;this._lastSignature=sig;
    const cfg=this._config;
    const columns=cfg.layout==='auto'?2:cfg.layout==='1'?1:cfg.layout==='2'?2:cfg.layout==='4'?2:cfg.custom_columns;
    this.shadowRoot.innerHTML=`<style>${CG_STYLE}</style><ha-card><div class="cg-root ${this._isDark()?'cg-dark':'cg-light'}" style="--cg-cols:${columns}"><div class="cg-head"><div><div class="cg-eyebrow">${cgEsc(cfg.eyebrow)}</div><div class="cg-title">${cgEsc(cfg.title)}<b>.</b></div></div></div>${cfg.cameras.length?`<div class="cg-grid">${cfg.cameras.map((c,i)=>this._row(c,i)).join('')}</div>`:'<div class="cg-empty">Aggiungi una telecamera dall’editor grafico della card.</div>'}${this._opened!==null?this._popup(this._opened):''}</div></ha-card>`;
    if(this._opened!==null)this.shadowRoot.querySelector('[data-close]')?.focus({preventScroll:true});
  }
  _close(){this._opened=null;this._error='';this._lastSignature='';this._paint();}
  async _loadMovement(c){
    if(!c.motion_entity||c.last_event_entity||this._querying.has(c.motion_entity)||typeof this._hass?.callApi!=='function')return;
    this._querying.add(c.motion_entity);
    const from=Date.now()-7*86400000;
    const endpoint=`history/period/${new Date(from).toISOString()}?filter_entity_id=${encodeURIComponent(c.motion_entity)}&no_attributes=1&significant_changes_only=0`;
    try {const rows=await this._hass.callApi('GET',endpoint);const latest=cgLatestMovement(rows,from);if(latest)this._movement.set(c.motion_entity,latest);}
    catch { /* Recorder history is optional; missing history must not be invented. */ }
    finally {this._querying.delete(c.motion_entity);this._lastSignature='';this._paint();}
  }
  async _toggleAudio(index){
    const c=this._config.cameras[index],id=c?.audio_control_entity;
    if(!c||!this._config.controls_enabled||!c.audio_control_enabled||this._busy||!id)return;
    const entity=this._state(id),state=cgBoolState(entity);
    if(state===null)return;
    const domain=id.split('.')[0];if(!['switch','input_boolean'].includes(domain))return;
    if(typeof this._hass?.callService!=='function')return;
    this._busy=true;this._error='';this._lastSignature='';this._paint();
    try {await this._hass.callService(domain,state?'turn_off':'turn_on',{entity_id:id});}
    catch(err){this._error=`Comando audio non riuscito: ${cgText(err?.message||'Errore Home Assistant',140)}`;}
    finally {this._busy=false;this._lastSignature='';this._paint();}
  }
  _click(event){
    if(event.target?.dataset?.backdrop==='1'){this._close();return;}
    if(event.target.closest('[data-close]')){this._close();return;}
    const more=event.target.closest('[data-more]');if(more){const id=more.dataset.more;this._close();this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));return;}
    const audio=event.target.closest('[data-audio]');if(audio){this._toggleAudio(Number(audio.dataset.audio));return;}
    const btn=event.target.closest('[data-open]');if(btn){const idx=Number(btn.dataset.open);if(!this._config.cameras[idx])return;this._opened=idx;this._error='';this._lastSignature='';this._paint();this._loadMovement(this._config.cameras[idx]);}
  }
}
const CG_EDITOR_CSS=`
:host{display:block;color:var(--primary-text-color,#18221c);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px)}
*,*:before,*:after{box-sizing:border-box}
.cg-editor{display:block}
.cg-tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:14px;border-bottom:1px solid var(--divider-color,#dfe5df)}
.cg-tab{border:0;background:none;color:var(--secondary-text-color,#536359);border-radius:13px;padding:10px 13px;white-space:nowrap;font:inherit;cursor:pointer}
.cg-tab.active{color:var(--primary-text-color,#17231c);background:var(--secondary-background-color,#f0f2ef);font-weight:650}
.cg-heading{font-size:21px;font-weight:500;margin:25px 0 9px}
.cg-desc{color:var(--secondary-text-color,#55665a);font-size:13px;line-height:1.5;margin-bottom:24px}
.cg-field{display:block;margin:20px 0}
.cg-label{font-size:14px;margin-bottom:10px}
.cg-input{display:block;width:100%;background:var(--secondary-background-color,#f0f2ef);color:var(--primary-text-color,#18221c);border:0;border-bottom:1px solid var(--divider-color,#a5afa5);padding:14px 13px;min-height:50px;border-radius:11px 11px 0 0;font:inherit}
.cg-editor ha-selector{display:block;width:100%;--mdc-theme-primary:var(--primary-color,#0b7457)}
.cg-fallback{display:none}.cg-no-native .cg-fallback{display:block}.cg-no-native ha-selector{display:none}
.cg-row{border-bottom:1px solid var(--divider-color,#e3e7e3);padding:13px 0;display:flex;align-items:center;justify-content:space-between;gap:15px}
.cg-row label{flex:1}.cg-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#0c7157)}
.cg-muted{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#5e6c62)}
.cg-action{background:var(--secondary-background-color,#eff2ee);border:1px solid var(--divider-color,#dbe2db);color:var(--primary-text-color,#18221c);padding:10px 14px;border-radius:14px;font:inherit;cursor:pointer}
.cg-action:disabled{opacity:.45;cursor:not-allowed}
.cg-tiny{font-size:11px;color:var(--secondary-text-color,#55665a);margin:9px 0}
.cg-input:focus-visible,.cg-action:focus-visible,.cg-tab:focus-visible,.cg-clear:focus-visible{outline:2px solid var(--primary-color,#0b7457);outline-offset:2px}
.cg-more{margin:19px 0 10px;border-bottom:1px solid var(--divider-color,#dfe5df);padding:0 0 11px}
.cg-more summary{cursor:pointer;padding:13px 4px;color:var(--secondary-text-color,#56665d);font-size:13px;list-style:none}
.cg-more summary:before{content:"▸";font-size:10px;margin-right:10px}
.cg-more[open] summary:before{content:"▾"}.cg-more summary::-webkit-details-marker{display:none}
.cg-more-body{padding:2px 0 8px}
.cg-selector-line{display:flex;align-items:center;gap:8px;min-width:0}
.cg-selector-grow{flex:1;min-width:0}
.cg-clear{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--secondary-background-color,#eef1ef);border:1px solid var(--divider-color,#dfe5df);border-radius:50%;cursor:pointer;color:var(--secondary-text-color,#57655c);padding:0}
.cg-clear ha-icon{width:18px;height:18px;--mdc-icon-size:18px}
.cg-camera-group{padding-bottom:20px;border-bottom:1px solid var(--divider-color,#e0e5df);margin-bottom:20px}
.cg-camera-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}
.cg-camera-head strong{font-size:15px;font-weight:600}
.cg-controls{display:flex;gap:6px;flex:none}
.cg-controls .cg-action{padding:5px 9px;border-radius:10px}
.cg-add{display:block;margin:12px 0 25px}
.cg-notice{margin-top:10px;color:var(--error-color,#bd4b42);font-size:12px}
`;
class CameraGridViewCardEditor extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._nativeTried=false;
    this._tab='telecamere';this._details={};
    this.shadowRoot.addEventListener('click',e=>this._click(e));
    this.shadowRoot.addEventListener('change',e=>this._change(e));
  }
  set hass(hass){this._hass=hass;this.shadowRoot.querySelectorAll('ha-selector').forEach(el=>el.hass=hass);}
  setConfig(raw){
    const config=cgConfig(raw);
    if(JSON.stringify(config)===JSON.stringify(this._config)&&this.shadowRoot.querySelector('.cg-editor'))return;
    this._config=config;this._render();
  }
  connectedCallback(){this._render();this._ensureNative();}
  async _ensureNative(){
    if(this._nativeTried)return;this._nativeTried=true;
    if(!customElements.get('ha-selector')){
      try{const helper=await window.loadCardHelpers?.();await helper?.importSelector?.();}
      catch {/* Native selector is optional; use entity ID input instead. */}
    }
    this._render();
  }
  _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
  _update(patch){this._config=cgConfig({...this._config,...patch});this._emit();this._render();}
  _updateCamera(index,patch){const cams=this._config.cameras.map((c,i)=>i===index?{...c,...patch}:c);this._update({cameras:cams});}
  _field(label,inner,help=''){return `<div class="cg-field"><div class="cg-label">${cgEsc(label)}</div>${inner}${help?`<div class="cg-tiny">${cgEsc(help)}</div>`:''}</div>`;}
  _input(scope,key,label,value){return this._field(label,`<input class="cg-input" type="text" maxlength="100" data-scope="${scope}" data-key="${key}" value="${cgEsc(value)}"/>`);}
  _entityField(index,key,label,help=''){
    const value=this._config.cameras[index][key];
    return this._field(label,`<div class="cg-selector-line"><div class="cg-selector-grow"><div data-entity-slot="${index}:${key}"></div><div class="cg-fallback"><input class="cg-input" type="text" placeholder="${cgEsc(CG_DOMAINS[key][0])}.*" value="${cgEsc(value)}" data-scope="${index}" data-key="${key}"/></div></div>${value?`<button type="button" class="cg-clear" data-clear="${index}:${key}" title="Rimuovi ${cgEsc(label)}" aria-label="Rimuovi ${cgEsc(label)}">${cgIcon('close')}</button>`:''}</div>`,help);
  }
  _check(index,key,label,help=''){
    const c=index==='global'?this._config:this._config.cameras[index];
    return `<div class="cg-row"><label for="cg-${index}-${key}">${cgEsc(label)}${help?`<div class="cg-muted">${cgEsc(help)}</div>`:''}</label><input id="cg-${index}-${key}" type="checkbox" data-scope="${index}" data-key="${key}" ${c[key]?'checked':''}/></div>`;
  }
  _more(key,body){return `<details class="cg-more" data-details="${key}" ${this._details[key]?'open':''}><summary>Altre opzioni</summary><div class="cg-more-body">${body}</div></details>`;}
  _camera(index,cam){
    const extra=this._entityField(index,'motion_entity','Entità movimento (facoltativa)')+
      this._entityField(index,'last_event_entity','Data ultimo movimento (facoltativa)')+
      this._entityField(index,'audio_state_entity','Stato audio (facoltativo)')+
      this._entityField(index,'audio_control_entity','Controllo audio (facoltativo)','Richiede switch.* o input_boolean.* comandabile.')+
      this._check(index,'audio_control_enabled','Consenti controllo audio per questa telecamera','Richiede anche Abilita i comandi reali in Avanzate.')+
      this._entityField(index,'battery_entity','Batteria (facoltativa)');
    return `<section class="cg-camera-group"><div class="cg-camera-head"><strong>${index+1}. ${cgEsc(cam.name||`Telecamera ${index+1}`)}</strong><div class="cg-controls"><button type="button" class="cg-action" data-move="${index}:-1" aria-label="Sposta su" ${index===0?'disabled':''}>↑</button><button type="button" class="cg-action" data-move="${index}:1" aria-label="Sposta giù" ${index===this._config.cameras.length-1?'disabled':''}>↓</button><button type="button" class="cg-clear" data-delete="${index}" aria-label="Rimuovi telecamera">${cgIcon('close')}</button></div></div>`+
      this._entityField(index,'image_entity','Ultima immagine rilevata (image.*)')+
      this._input(index,'name','Nome visualizzato',cam.name)+
      this._check(index,'show_preview','Mostra ultima immagine nella dashboard','Disattivata di default per privacy. Il popup resta disponibile.')+
      this._more(`camera-${index}`,extra)+'</section>';
  }
  _render(){
    if(!this.isConnected)return;
    this.shadowRoot.querySelectorAll('details[data-details]').forEach(el=>{this._details[el.dataset.details]=el.open;});
    const c=this._config;
    // Home Assistant supplies top-level Configurazione, Visibilità and Layout tabs.
    const tabs=[['telecamere','Telecamere'],['aspetto','Aspetto'],['avanzate','Avanzate']];
    let body='';
    if(this._tab==='telecamere'){
      body='<div class="cg-heading">Configurazione telecamere</div><div class="cg-desc">Configura le telecamere e scegli per ciascuna se mostrare l’ultima immagine nella dashboard.</div>'+
        c.cameras.map((cam,i)=>this._camera(i,cam)).join('')+
        '<button type="button" class="cg-action cg-add" data-add="1">+ Aggiungi telecamera</button>'+
        '<div class="cg-muted">È possibile aggiungere più telecamere, senza un limite fisso. Ogni telecamera apre il proprio popup.</div>';
    }
    if(this._tab==='aspetto'){
      const options=[['auto','Automatico'],['1','1 telecamera per riga'],['2','2 telecamere per riga'],['4','4 telecamere (griglia 2×2)'],['custom','Personalizzato']];
      const layout=`<select class="cg-input" data-scope="global" data-key="layout">${options.map(([val,label])=>`<option value="${val}" ${c.layout===val?'selected':''}>${label}</option>`).join('')}</select>`;
      const themes=`<select class="cg-input" data-scope="global" data-key="theme_mode">${[['auto','Auto (Home Assistant)'],['light','Light Edera'],['dark','Dark Edera']].map(([val,label])=>`<option value="${val}" ${c.theme_mode===val?'selected':''}>${label}</option>`).join('')}</select>`;
      body='<div class="cg-heading">Aspetto Edera</div><div class="cg-desc">Tema, tipografia e disposizione delle telecamere, coerenti con Security Panel Card.</div>'+
        this._input('global','eyebrow','Intestazione superiore',c.eyebrow)+this._input('global','title','Titolo',c.title)+
        this._field('Tema',themes)+this._field('Layout',layout)+
        (c.layout==='custom'?this._field('Numero colonne (1–12)',`<input class="cg-input" type="number" min="1" max="12" data-scope="global" data-key="custom_columns" value="${c.custom_columns}"/>`):'');
    }
    if(this._tab==='avanzate'){
      body='<div class="cg-heading">Avanzate</div><div class="cg-desc">La card è inizialmente in sola lettura. Abilita i comandi soltanto dopo aver verificato le entità configurate.</div>'+
        this._check('global','controls_enabled','Abilita i comandi reali','Permette il controllo audio esclusivamente per le telecamere autorizzate. I permessi Home Assistant restano necessari.')+
        '<div class="cg-muted" style="margin-top:18px">Le anteprime nascoste impediscono la visualizzazione delle immagini nella dashboard, ma non sostituiscono le autorizzazioni di Home Assistant.</div>';
    }
    this.shadowRoot.innerHTML=`<style>${CG_EDITOR_CSS}</style><div class="cg-editor"><div class="cg-tabs">${tabs.map(([id,label])=>`<button type="button" class="cg-tab ${this._tab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</div>${body}</div>`;
    this.shadowRoot.querySelector('.cg-editor').classList.toggle('cg-no-native',!customElements.get('ha-selector'));
    this._mountSelectors();
  }
  _mountSelectors(){
    if(!customElements.get('ha-selector'))return;
    this.shadowRoot.querySelectorAll('[data-entity-slot]').forEach(slot=>{
      const [idx,key]=slot.dataset.entitySlot.split(':');const index=Number(idx);
      const selector=document.createElement('ha-selector');selector.hass=this._hass;
      const domains=CG_DOMAINS[key];selector.selector={entity:{domain:domains.length===1?domains[0]:domains}};
      selector.value=this._config.cameras[index]?.[key]||'';
      selector.setAttribute('aria-label',key);
      selector.addEventListener('value-changed',e=>{
        e.stopPropagation();
        if(!selector.isConnected||!e.detail||!Object.prototype.hasOwnProperty.call(e.detail,'value'))return;
        const value=cgEntity(e.detail.value,domains);this._updateCamera(index,{[key]:value});
      });
      slot.appendChild(selector);
    });
  }
  _click(event){
    const tab=event.target.closest('[data-tab]');if(tab){this._tab=tab.dataset.tab;this._render();return;}
    const clear=event.target.closest('[data-clear]');if(clear){const [i,key]=clear.dataset.clear.split(':');this._updateCamera(Number(i),{[key]:''});return;}
    const add=event.target.closest('[data-add]');if(add){this._update({cameras:[...this._config.cameras,cgCamera()]});return;}
    const del=event.target.closest('[data-delete]');if(del){const index=Number(del.dataset.delete);this._update({cameras:this._config.cameras.filter((_,i)=>i!==index)});return;}
    const move=event.target.closest('[data-move]');if(move){const [idx,d]=move.dataset.move.split(':').map(Number);const cams=[...this._config.cameras];const next=idx+d;if(next<0||next>=cams.length)return;[cams[idx],cams[next]]=[cams[next],cams[idx]];this._update({cameras:cams});}
  }
  _change(event){
    const el=event.target,key=el.dataset?.key,scope=el.dataset?.scope;if(!key||scope===undefined)return;
    const value=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
    if(scope==='global'){if(!(key in CG_DEFAULTS))return;this._update({[key]:value});return;}
    const index=Number(scope);if(!Number.isInteger(index)||!this._config.cameras[index]||!(key in cgCamera()))return;
    const v=CG_DOMAINS[key]?cgEntity(value,CG_DOMAINS[key]):value;
    this._updateCamera(index,{[key]:v});
  }
}
if(typeof customElements!=='undefined'){
  if(!customElements.get(CG_TAG))customElements.define(CG_TAG,CameraGridViewCard);
  if(!customElements.get(CG_EDITOR_TAG))customElements.define(CG_EDITOR_TAG,CameraGridViewCardEditor);
}
if(typeof window!=='undefined'){
  window.customCards=window.customCards||[];
  if(!window.customCards.some(c=>c.type===CG_TAG))window.customCards.push({type:CG_TAG,name:'Camera Grid View Card',description:'Galleria Edera con popup snapshot, audio e anteprime privacy-first.',preview:true});
}
export {cgConfig,cgImageUrl,cgLatestMovement,cgTime,cgBoolState};

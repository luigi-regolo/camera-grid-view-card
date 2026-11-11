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
  recording_state_entity: ['switch', 'input_boolean', 'binary_sensor', 'sensor'],
  recording_control_entity: ['switch', 'input_boolean'],
  // Optional live camera (any integration). Live video is rendered by the native Home Assistant card.
  camera_entity: ['camera'],
});
const CG_DEFAULTS = Object.freeze({
  title: 'Telecamere', eyebrow: 'CAMERA GRID VIEW CARD', show_eyebrow: true, show_title: true, theme_mode: 'auto',
  layout: 'auto', custom_columns: 3, controls_enabled: false, auto_popup_enabled: false, auto_popup_seconds: 15, cameras: [],
});
function cgText(value, max=100) { return String(value ?? '').trim().slice(0,max); }
function cgEsc(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cgEntity(value, domains) {
  const id=cgText(value,160);
  return domains.includes(id.split('.')[0]) && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(id) ? id : '';
}
function cgCamera(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  const c={name:cgText(r.name,60),show_preview:r.show_preview===true,audio_control_enabled:r.audio_control_enabled===true,recording_control_enabled:r.recording_control_enabled===true,auto_popup:r.auto_popup===true,live_preview:r.live_preview===true};
  for(const [key,domains] of Object.entries(CG_DOMAINS)) c[key]=cgEntity(r[key],domains);
  return c;
}
function cgSeconds(v){const n=Math.round(Number(v));return v!=null&&v!==''&&Number.isFinite(n)?Math.max(5,Math.min(60,n)):15;}
function cgConfig(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  return {
    type: 'custom:camera-grid-view-card',
    title:cgText(r.title??CG_DEFAULTS.title,60),
    eyebrow:cgText(r.eyebrow??CG_DEFAULTS.eyebrow,60),
    // Header label and title are shown unless explicitly switched off (existing dashboards are unchanged).
    show_eyebrow:r.show_eyebrow!==false,
    show_title:r.show_title!==false,
    theme_mode:['auto','light','dark'].includes(r.theme_mode)?r.theme_mode:'auto',
    layout:['auto','1','2','4','custom'].includes(String(r.layout))?String(r.layout):'auto',
    custom_columns:Number.isInteger(Number(r.custom_columns)) ? Math.max(1,Math.min(12,Number(r.custom_columns))) : 3,
    controls_enabled:r.controls_enabled===true,
    auto_popup_enabled:r.auto_popup_enabled===true,
    auto_popup_seconds:cgSeconds(r.auto_popup_seconds),
    // No fixed maximum: users decide how many camera panels to configure.
    cameras:Array.isArray(r.cameras)?r.cameras.map(cgCamera):[],
  };
}
function cgKnown(entity) {return !!entity && !['unknown','unavailable',''].includes(entity.state);}
function cgImageUrl(entity, bucket='') {
  if(!cgKnown(entity))return '';
  const url=entity?.attributes?.entity_picture;
  if(typeof url!=='string' || !url.startsWith('/') || url.startsWith('//') || url.includes('\\') || /[\x00-\x1f]/.test(url))return '';
  // Whitelist same-origin Home Assistant paths. Never accept external or javascript/data URLs.
  // `bucket` refreshes still images of camera entities (their state does not change with each frame).
  const v=encodeURIComponent(String(entity.state).slice(0,100)+(bucket!==''?`-${String(bucket).slice(0,20)}`:''));
  return v?`${url}${url.includes('?')?'&':'?'}cg_v=${v}`:url;
}
// Smartphone = shortest side of the physical screen below 600 px (portrait and landscape).
// The viewport alone is not reliable: some containers report a window wider than the real screen.
function cgIsPhone(scr=(typeof window!=='undefined'?window.screen:null)) {
  const w=Number(scr?.width),h=Number(scr?.height);
  return Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0&&Math.min(w,h)<600;
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
:host{display:block;box-sizing:border-box;color:var(--primary-text-color,#18221c);font-family:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif));font-size:14px}
*,*:before,*:after{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}
ha-icon{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex-shrink:0;--mdc-icon-size:21px;width:21px;height:21px}
.cg-root{--cg-accent:#0a7156;--cg-muted:#56675c;--cg-surface:#f0f2ef;--cg-circle:#fff;--cg-border:#e0e5df;--cg-bg:#fafbf9;--cg-fg:#18221c;background:var(--cg-bg);color:var(--cg-fg);font-family:inherit;font-size:14px;font-weight:400;border:1px solid var(--cg-border);border-radius:26px;padding:18px;min-width:0;position:relative}
.cg-root.cg-dark{--cg-accent:#0e795d;--cg-muted:#bbc5bd;--cg-surface:#191c1a;--cg-circle:#282b29;--cg-border:#2b302c;--cg-bg:#101211;--cg-fg:#f5f7f4}
.cg-head{margin:2px 4px 17px}.cg-eyebrow{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--cg-muted);margin-bottom:7px}.cg-title{font-size:25px;line-height:1.14;font-weight:780;letter-spacing:-.7px;overflow-wrap:anywhere}.cg-title b{color:var(--cg-accent);font-weight:800}
.cg-grid-host{container:cg-camera-grid/inline-size;min-width:0;width:100%}
.cg-grid{display:grid;grid-template-columns:repeat(var(--cg-cols,2),minmax(0,1fr));gap:12px}
.cg-cell{border:1px solid var(--cg-border);background:var(--cg-surface);color:inherit;padding:7px 10px;height:auto;min-height:82px;border-radius:16px;display:flex;flex-direction:column;gap:2px;justify-content:space-between;text-align:left;min-width:0;transition:border-color .16s,transform .16s}.cg-cell.cg-with-preview{height:auto;min-height:82px}
.cg-cell:hover,.cg-cell:focus{border-color:var(--cg-accent)}.cg-cell:active{transform:scale(.99)}.cg-cell:focus-visible,.cg-btn:focus-visible,.cg-confirm-btn:focus-visible{outline:2px solid var(--cg-accent);outline-offset:2px}
.cg-top{display:flex;align-items:center;gap:10px;min-width:0}.cg-icon-orb{display:grid;place-items:center;flex:none;width:43px;height:43px;border-radius:50%;background:var(--cg-circle)}.cg-icon-orb ha-icon{color:var(--cg-fg);width:22px;height:22px;--mdc-icon-size:22px}
.cg-info{flex:1;min-width:0}.cg-name{display:block;font-size:13px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cg-arrow{display:flex;color:var(--cg-muted)}.cg-arrow ha-icon{width:14px;height:14px;--mdc-icon-size:14px}
.cg-preview{width:100%;aspect-ratio:16/10;border-radius:12px;background:var(--cg-circle);object-fit:cover;display:block}.cg-placeholder{border:1px dashed var(--cg-border);border-radius:12px;min-height:70px;display:flex;align-items:center;gap:9px;justify-content:center;color:var(--cg-muted);font-size:11px}
.cg-open-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:var(--cg-accent);color:#fff;font-size:11px;font-weight:650;line-height:1.2}.cg-open-badge ha-icon{--mdc-icon-size:14px;width:14px;height:14px;color:#fff}
.cg-meta{font-size:11.5px;color:var(--cg-muted);line-height:1.3;overflow-wrap:anywhere}.cg-info .cg-meta{display:block;margin-top:3px}.cg-empty{padding:12px;color:var(--cg-muted);font-size:12px}
.cg-backdrop{position:fixed;inset:0;overscroll-behavior:contain;z-index:9999;background:#0009;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}.cg-dialog{width:min(390px,100%);height:min(calc(100vh - 40px),680px);height:min(calc(100dvh - 40px),680px);display:flex;flex-direction:column;background:var(--cg-bg);color:var(--cg-fg);border:1px solid var(--cg-border);border-radius:26px;overflow:hidden;box-shadow:0 18px 60px #0005}
.cg-dialog-body{overflow-y:auto;overscroll-behavior:contain;padding:12px 18px 18px;min-width:0}
.cg-dialog-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 16px 12px 18px;background:var(--cg-bg);border-bottom:1px solid var(--cg-border)}.cg-dialog-head strong{flex:1;min-width:0;margin:0;font-size:17px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}.cg-icon-btn{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid var(--cg-border);background:var(--cg-surface);color:var(--cg-fg);display:grid;place-items:center;padding:0}.cg-icon-btn ha-icon{--mdc-icon-size:20px;width:20px;height:20px}.cg-icon-btn:focus-visible{outline:2px solid var(--cg-accent);outline-offset:2px}
.cg-snapshot-box{margin:12px 0;border-radius:17px;background:var(--cg-surface);padding:15px;text-align:center}.cg-snapshot-title{font-size:12px;font-weight:650;color:var(--cg-muted);margin-bottom:9px}.cg-snapshot{display:block;width:100%;max-height:340px;object-fit:contain;border-radius:12px}
.cg-event{margin-top:9px;padding:11px 12px;border-radius:14px;background:var(--cg-surface);border:1px solid var(--cg-border);display:flex;gap:10px;align-items:center;min-height:67px;font-size:12px}.cg-event-icon{display:grid;place-items:center;background:var(--cg-circle);width:38px;height:38px;border-radius:50%;flex:none}.cg-event-icon ha-icon{color:var(--cg-fg)}.cg-event-text{flex:1;min-width:0}.cg-event strong{font-weight:600}.cg-event .cg-meta{display:block;margin-top:3px}.cg-btn{border:1px solid var(--cg-border);border-radius:999px;padding:8px 11px;background:var(--cg-circle);color:var(--cg-fg);font-size:12px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.cg-btn:disabled{opacity:.45}
.cg-wide{display:block;width:100%;border:0;border-radius:14px;margin-top:13px;padding:13px;background:var(--cg-accent);color:white;font-weight:730;font-size:inherit;text-align:center}.cg-wide ha-icon{color:#fff;--mdc-icon-size:18px;width:18px;height:18px;margin-right:7px}.cg-error{margin-top:12px;color:#c74f4f;font-size:12px}.cg-dialog-text{font-size:13px;color:var(--cg-muted);line-height:1.5;margin:10px 0 14px}.cg-dialog-buttons{display:flex;gap:9px}.cg-dialog-buttons .cg-btn,.cg-dialog-buttons .cg-wide{flex:1;justify-content:center;display:flex;align-items:center;margin-top:0}
@media(max-width:420px){.cg-root{padding:13px;border-radius:23px}.cg-cell{padding:7px 8px;gap:2px;height:77px}.cg-cell.cg-with-preview{height:auto;min-height:77px}.cg-icon-orb{width:36px;height:36px}.cg-name{font-size:11.5px}.cg-meta{font-size:10.5px}.cg-title{font-size:23px}.cg-open-badge{font-size:10px;padding:5px 8px}}
/* Container-based adaptation: dashboard columns can be narrow even on wide screens.
   Keep the approved 2-column compact geometry whenever the host is wide enough. */
@container cg-camera-grid (max-width:480px){
  .cg-grid{grid-template-columns:repeat(var(--cg-narrow-cols,2),minmax(0,1fr))}
  .cg-cell,.cg-cell.cg-with-preview{height:auto;min-height:82px;padding:9px 8px;gap:7px}
  .cg-top{gap:6px;min-width:0}
  .cg-icon-orb{width:34px;height:34px}
  .cg-icon-orb ha-icon{width:18px;height:18px;--mdc-icon-size:18px}
  .cg-arrow ha-icon{width:12px;height:12px;--mdc-icon-size:12px}
  .cg-info .cg-meta{line-height:1.35;overflow-wrap:break-word}
  .cg-open-badge{max-width:100%;flex-shrink:0;min-width:0;padding:5px 7px;gap:4px;font-size:10px;white-space:normal;overflow-wrap:break-word}
}
@container cg-camera-grid (max-width:280px){.cg-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.cg-cell{transition:none}.cg-cell:active{transform:none}}

.cg-root{padding:14px}
.cg-root .cg-head{margin:2px 4px 12px}
.cg-root .cg-title{font-size:23px}
.cg-root .cg-grid{gap:8px}
.cg-root .cg-cell,.cg-root .cg-cell.cg-with-preview{border-radius:20px;padding:10px;gap:8px;min-height:0;height:auto}
.cg-root .cg-icon-orb{width:38px;height:38px}
.cg-root .cg-icon-orb ha-icon{width:20px;height:20px;--mdc-icon-size:20px}
.cg-root .cg-cell .cg-name{font-size:14px}
.cg-root .cg-cell .cg-meta{font-size:12px;line-height:1.35}
.cg-root .cg-cell .cg-preview,.cg-root .cg-cell .cg-placeholder{border-radius:14px}

.cg-root{--cg-amber:#8a5a00;--cg-amber-bg:#f6ead0}
.cg-root.cg-dark{--cg-amber:#e8b04d;--cg-amber-bg:#3a2d12}
.cg-root .cg-head{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px 12px}
.cg-chips{display:flex;gap:6px;flex-wrap:wrap}
.cg-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cg-border);background:var(--cg-surface);border-radius:999px;padding:5px 9px;font-size:11px;font-weight:600;line-height:1.2;color:var(--cg-muted)}
.cg-chip ha-icon{width:14px;height:14px;--mdc-icon-size:14px}
.cg-chip.on{color:var(--cg-fg)}.cg-chip.on ha-icon{color:var(--cg-accent)}
.cg-icon-orb{position:relative}
.cg-motion{position:absolute;top:-1px;right:-1px;width:11px;height:11px;border-radius:50%;background:var(--cg-accent);border:2px solid var(--cg-surface)}
.cg-foot{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0}
.cg-root .cg-cell .cg-meta{display:block}
.cg-root .cg-cell .cg-k{display:block;font-size:10.5px;line-height:1.3;letter-spacing:.15px}
.cg-root .cg-cell .cg-v{display:block;font-size:12px;line-height:1.35;font-weight:600;color:var(--cg-fg)}


.cg-root{--cg-btn-fg:var(--cg-accent)}
.cg-root.cg-dark{--cg-btn-fg:var(--cg-fg)}
.cg-root .cg-open-badge{align-self:stretch;flex:1;min-width:0;width:100%;justify-content:center;gap:6px;min-height:36px;padding:8px 12px;font-size:12.5px;font-weight:600;line-height:1.2;border-radius:999px;color:var(--cg-btn-fg);border:1px solid color-mix(in srgb,var(--cg-accent) 45%,transparent);background:color-mix(in srgb,var(--cg-accent) 12%,transparent);transition:background .15s}
.cg-root .cg-open-badge ha-icon{color:inherit;--mdc-icon-size:16px;width:16px;height:16px}
.cg-root .cg-cell:hover .cg-open-badge,.cg-root .cg-cell:focus-visible .cg-open-badge{background:color-mix(in srgb,var(--cg-accent) 20%,transparent)}
.cg-root .cg-cell{container:cg-cell/inline-size}
.cg-root .cg-open-badge{white-space:nowrap;flex:1 1 auto;min-width:max-content}
/* Narrow tiles (tablets, many columns): keep the label on one line by compacting the button. */
@container cg-cell (max-width:175px){.cg-root .cg-open-badge{font-size:11px;padding:8px;gap:3px;min-height:34px}.cg-root .cg-open-badge ha-icon{--mdc-icon-size:14px;width:14px;height:14px}}
@container cg-cell (max-width:175px){.cg-root .cg-arrow{display:none}.cg-root .cg-cell .cg-v{font-size:11.5px}.cg-root .cg-cell .cg-icon-orb{width:32px;height:32px}.cg-root .cg-cell .cg-top{gap:5px}}
@container cg-cell (max-width:150px){.cg-root .cg-cell .cg-v{font-size:10.5px}}
@container cg-cell (max-width:145px){.cg-root .cg-open-badge ha-icon{display:none}}
@container cg-cell (max-width:128px){.cg-root .cg-open-badge{font-size:10px;padding:7px 5px;min-height:32px}}
@container cg-cell (max-width:112px){.cg-root .cg-open-badge{white-space:normal;min-width:0;line-height:1.15}}
.cg-bat{display:inline-flex;align-items:center;gap:3px;flex:none;border-radius:999px;padding:3px 8px 3px 5px;background:var(--cg-amber-bg);color:var(--cg-amber);font-size:11px;font-weight:700}.cg-bat b{font-weight:700}.cg-bat ha-icon{width:14px;height:14px;--mdc-icon-size:14px;color:var(--cg-amber)}
@container cg-cell (max-width:175px){.cg-root .cg-bat{padding:4px}.cg-root .cg-bat b{display:none}}

/* Popup (standard v1.4): fixed height on every device, content scrolls inside the body, header stays still. */
.cg-dialog.cg-compact{height:auto;max-height:min(88vh,680px)}
.cg-dialog-body{flex:1 1 auto;min-height:0}
.cg-pop-media,.cg-pop-info{min-width:0}
.cg-pop-info>.cg-event:first-child{margin-top:0}
.cg-snapshot-box{display:block}
.cg-live-actions{display:flex;justify-content:center;margin-top:11px}
.cg-live-btn{min-height:36px;justify-content:center}
/* Tablet and desktop only (never smartphones: .cg-phone is set from the physical screen size): wide horizontal popup in columns. */
@media(min-width:640px) and (min-height:600px){
  .cg-backdrop:not(.cg-phone) .cg-dialog:not(.cg-compact){width:min(1120px,100%);height:min(80vh,560px);height:min(80dvh,560px)}
  .cg-backdrop:not(.cg-phone) .cg-pop-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:14px;align-items:start}
  .cg-backdrop:not(.cg-phone) .cg-pop-grid .cg-snapshot-box{margin:0}
}
/* Live video (native Home Assistant card projected through named slots). */
.cg-live-box{position:relative;width:100%;aspect-ratio:16/10;border-radius:14px;overflow:hidden;background:var(--cg-circle)}
.cg-live-box ::slotted(*){position:absolute;inset:0;display:block;width:100%;height:100%;overflow:hidden;border-radius:inherit;--ha-card-border-radius:0px;--ha-card-box-shadow:none;--ha-card-border-width:0px}
.cg-cell .cg-live-box ::slotted(*){pointer-events:none}
.cg-live-popup{width:min(100%,544px);margin:0 auto}
.cg-live-badge{position:absolute;top:8px;left:8px;z-index:2;display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;background:var(--cg-accent);color:#fff;font-size:10px;font-weight:700;letter-spacing:.6px;line-height:1.2;pointer-events:none}
.cg-live-note{position:absolute;inset:0;display:grid;place-items:center;color:var(--cg-muted);font-size:11px;text-align:center;padding:8px}

`;
class CameraGridViewCard extends HTMLElement {
  static getStubConfig(){return cgConfig();}
  static getConfigElement(){return document.createElement(CG_EDITOR_TAG);}
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._opened=null;
    this._busy=false;this._error='';this._confirmation=null;this._lastSignature='';this._movement=new Map();this._querying=new Set();this._autoTimer=null;this._autoOpened=false;this._autoCloseAt=0;this._autoLast=new Map();this._popupLive=false;this._liveEls=new Map();this._liveFail=false;
    this.shadowRoot.addEventListener('click',event=>this._click(event));
    this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape'&&this._opened!==null)this._close();});
    this._onAppearance=()=>this._paint();
    this._media=typeof window!=='undefined'&&typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme:dark)'):null;
  }
  connectedCallback(){this._media?.addEventListener?.('change',this._onAppearance);this._paint();this._syncLive();}
  disconnectedCallback(){this._media?.removeEventListener?.('change',this._onAppearance);this._clearAuto();this._stopLive();}
  setConfig(raw){this._clearAuto();this._config=cgConfig(raw);this._opened=null;this._popupLive=false;this._liveFail=false;this._confirmation=null;this._movement.clear();this._lastSignature='';this._paint();}
  set hass(hass){const prev=this._hass;this._hass=hass;this._detect(prev,hass);for(const w of this._liveEls.values()){if(w.card)w.card.hass=hass;}this._paint();}
  getCardSize(){return Math.max(2,Math.ceil(this._config.cameras.length/2)*2+1);}
  _clearAuto(){clearTimeout(this._autoTimer);this._autoTimer=null;this._autoOpened=false;this._autoCloseAt=0;}
  _detect(prev,hass){
    const cfg=this._config;
    if(!cfg.auto_popup_enabled||!prev||!hass?.states)return;
    if(typeof document!=='undefined'&&document.visibilityState==='hidden')return;
    const now=Date.now();let hit=-1;
    cfg.cameras.forEach((c,i)=>{
      if(!c.auto_popup||!c.image_entity)return;
      const a=prev.states?.[c.image_entity],b=hass.states[c.image_entity];
      // Only a genuine new image: both states known and different (no popup on reconnect or unavailable).
      if(!cgKnown(a)||!cgKnown(b)||a.state===b.state)return;
      if(now-(this._autoLast.get(i)||0)<2000)return;
      this._autoLast.set(i,now);hit=i;
    });
    if(hit<0)return;
    // Never interrupt a popup opened by the user or a pending command confirmation.
    if((this._opened!==null&&!this._autoOpened)||this._confirmation||this._busy)return;
    this._clearAuto();
    this._opened=hit;this._popupLive=false;this._error='';this._lastSignature='';this._autoOpened=true;
    const ms=cfg.auto_popup_seconds*1000;this._autoCloseAt=now+ms;
    this._autoTimer=setTimeout(()=>{if(this._autoOpened&&this._opened===hit&&!this._confirmation&&!this._busy)this._close();else this._clearAuto();},ms);
    this._loadMovement(cfg.cameras[hit]);
  }
  _state(id){return id?this._hass?.states?.[id]:undefined;}
  _isDark(){return this._config.theme_mode==='dark'||(this._config.theme_mode==='auto'&&(this._hass?.themes?.darkMode===true||(!this._hass?.themes&&this._media?.matches)));}
  _lastEvent(c){
    const e=this._state(c.last_event_entity);const raw=c.last_event_entity&&cgKnown(e)?e.state:null;
    if(raw&&cgTime(raw))return raw;
    const motion=this._state(c.motion_entity);
    if(cgBoolState(motion)===true&&cgTime(motion.last_changed))return motion.last_changed;
    return this._movement.get(c.motion_entity)||null;
  }
  _name(c,i){return c.name||this._state(c.image_entity)?.attributes?.friendly_name||this._state(c.camera_entity)?.attributes?.friendly_name||`Telecamera ${i+1}`;}
  // Still image: the event snapshot (image.*) when configured, otherwise the camera entity picture, refreshed every minute.
  _still(c){
    if(c.image_entity)return cgImageUrl(this._state(c.image_entity));
    if(c.camera_entity)return cgImageUrl(this._state(c.camera_entity),Math.floor(Date.now()/60000));
    return '';
  }
  _liveNote(){return `<div class="cg-live-note">${this._liveFail?'Live non disponibile':'Avvio live…'}</div>`;}
  _row(c,i){
    const title=this._name(c,i);
    // Dashboard privacy: no image element, stream or image URL when the preview is disabled.
    const image=c.show_preview?this._still(c):'';
    const liveTile=c.show_preview&&c.live_preview&&!!c.camera_entity;
    const visual=liveTile?`<div class="cg-live-box" aria-label="Live: ${cgEsc(title)}"><span class="cg-live-badge">LIVE</span><slot name="cg-live-tile-${i}">${this._liveNote()}</slot></div>`:c.show_preview?(image?`<img class="cg-preview" alt="Ultima immagine: ${cgEsc(title)}" src="${cgEsc(image)}" loading="lazy"/>`:'<div class="cg-placeholder">'+cgIcon('image-off-outline')+'Immagine non disponibile</div>'):'';
    const last=cgTime(this._lastEvent(c));
    const mot=this._state(c.motion_entity);const motionOn=cgBoolState(mot)===true;
    const bs=this._state(c.battery_entity);const bn=Number(bs?.state);
    const lowBat=!!c.battery_entity&&cgKnown(bs)&&Number.isFinite(bn)&&bn>=0&&bn<20;
    const badge=`<span class="cg-open-badge">Dettagli e stato ${cgIcon('chevron-right')}</span>`;
    return `<button type="button" class="cg-cell ${c.show_preview?'cg-with-preview':''}" data-open="${i}" aria-label="Apri dettaglio ${cgEsc(title)}${motionOn?', movimento in corso':''}"><div class="cg-top"><span class="cg-icon-orb">${cgIcon('cctv')}${motionOn?'<i class="cg-motion" title="Movimento in corso"></i>':''}</span><span class="cg-info"><span class="cg-name">${cgEsc(title)}</span><span class="cg-meta"><span class="cg-k">Movimento</span><span class="cg-v">${last?cgEsc(last.relative).replace(/ /g,' '):'Non disponibile'}</span></span></span>${lowBat?`<span class="cg-bat" title="Batteria bassa: ${Math.round(bn)}%">${cgIcon('battery-alert')}<b>${Math.round(bn)}%</b></span>`:`<span class="cg-arrow">${cgIcon('chevron-right')}</span>`}</div>${visual}<span class="cg-foot">${badge}</span></button>`;
  }
  _status(c,kind){
    const stateId=c[`${kind}_state_entity`], controlId=c[`${kind}_control_entity`];
    return cgBoolState(this._state(stateId||controlId));
  }
  _popup(index){
    const c=this._config.cameras[index];if(!c)return '';
    const title=this._name(c,index);
    const phone=cgIsPhone();
    const head=`<div class="cg-dialog-head"><strong>${cgEsc(title)}</strong><button class="cg-icon-btn" type="button" data-close="1" aria-label="Chiudi">${cgIcon('close')}</button></div>`;
    if(this._confirmation){
      const confirm=this._confirmation;
      const label=confirm.kind==='audio'?'audio':'registrazione';
      const verb=confirm.expected?'disattivare':'attivare';
      return `<div class="cg-backdrop${phone?' cg-phone':''}" data-backdrop="1"><div class="cg-dialog cg-compact" role="dialog" aria-modal="true" aria-label="Conferma ${label}">${head}<div class="cg-dialog-body"><div class="cg-dialog-text">Vuoi ${verb} ${label} per ${cgEsc(title)}?</div><div class="cg-dialog-buttons"><button type="button" class="cg-btn" data-cancel="1">Annulla</button><button type="button" class="cg-wide" data-confirm="1" ${this._busy?'disabled':''}>Conferma</button></div>${this._error?`<div class="cg-error" role="alert">${cgEsc(this._error)}</div>`:''}</div></div></div>`;
    }
    const url=this._still(c);
    const last=cgTime(this._lastEvent(c));
    const bat=this._state(c.battery_entity);const n=Number(bat?.state);
    const battery=c.battery_entity&&cgKnown(bat)&&Number.isFinite(n)&&n>=0&&n<=100?Math.round(n):null;
    // Live video starts only on an explicit tap and stops when the popup closes.
    const hasCam=!!c.camera_entity;
    const liveOn=hasCam&&this._popupLive;
    const camKnown=cgKnown(this._state(c.camera_entity));
    const liveBtn=hasCam?`<button type="button" class="cg-btn cg-live-btn" data-live="${liveOn?'stop':'start'}" ${camKnown?'':'disabled'}>${cgIcon(liveOn?'stop-circle-outline':'video')}${liveOn?'Ferma live':'Avvia live'}</button>`:'';
    const still=url?`<img class="cg-snapshot" src="${cgEsc(url)}" alt="${c.image_entity?'Ultima immagine rilevata':'Immagine telecamera'}: ${cgEsc(title)}"/>`:'<div class="cg-placeholder">Immagine non disponibile. Configura un’entità image.* o camera.*</div>';
    const media=liveOn?`<div class="cg-live-box cg-live-popup" aria-label="Live: ${cgEsc(title)}"><span class="cg-live-badge">LIVE</span><slot name="cg-live-popup">${this._liveNote()}</slot></div>`:still;
    let content='';
    content+=`<div class="cg-snapshot-box"><div class="cg-snapshot-title">${liveOn?'Live':(c.image_entity||!hasCam)?'Ultima immagine rilevata':'Immagine telecamera'}</div>${media}${liveBtn?`<div class="cg-live-actions">${liveBtn}</div>`:''}</div>`;
    let info='';
    info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon('motion-sensor')}</span><div class="cg-event-text"><strong>Ultimo movimento rilevato</strong><div class="cg-meta">${last?cgEsc(last.relative)+' · '+cgEsc(last.exact):'Non disponibile negli eventi recenti'}</div></div></div>`;
    for(const kind of ['audio','recording']){
      if(!c[`${kind}_state_entity`]&&!c[`${kind}_control_entity`])continue;
      const state=this._status(c,kind);
      const control=c[`${kind}_control_entity`];
      const switchState=cgBoolState(this._state(control));
      const authorized=this._config.controls_enabled&&c[`${kind}_control_enabled`]&&!!control&&switchState!==null;
      const label=state===true?(kind==='audio'?'Attivo':'In registrazione'):state===false?(kind==='audio'?'Disattivo':'Non in registrazione'):'Non disponibile';
      const action=authorized?`<button type="button" class="cg-btn" data-request="${kind}:${index}" ${this._busy?'disabled':''}>${switchState?'Disattiva':'Attiva'}</button>`:'';
      info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon(kind==='audio'?'microphone':'cctv')}</span><div class="cg-event-text"><strong>${kind==='audio'?'Audio':'Stato registrazione'}</strong><div class="cg-meta">${label}</div></div>${action}</div>`;
    }
    if(c.battery_entity&&battery!==null)info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon('battery')}</span><div class="cg-event-text"><strong>Batteria</strong><div class="cg-meta">${battery}%</div></div></div>`;
    const moreId=c.image_entity||c.camera_entity;
    if(moreId)info+=`<button type="button" class="cg-wide" data-more="${cgEsc(moreId)}">${cgIcon('arrow-expand')}${c.image_entity?'Apri dettagli immagine':'Apri dettagli telecamera'}</button>`;
    if(this._error)info+=`<div class="cg-error" role="alert">${cgEsc(this._error)}</div>`;
    return `<div class="cg-backdrop${phone?' cg-phone':''}" data-backdrop="1"><div class="cg-dialog" role="dialog" aria-modal="true" aria-label="Dettaglio ${cgEsc(title)}">${head}<div class="cg-dialog-body"><div class="cg-pop-grid"><div class="cg-pop-media">${content}</div><div class="cg-pop-info">${info}</div></div></div></div></div>`;
  }
  _signature(){
    const ids=this._config.cameras.flatMap(c=>Object.keys(CG_DOMAINS).map(k=>c[k]).filter(Boolean));
    const rows=[...new Set(ids)].map(id=>{const e=this._state(id);return [id,e?.state,e?.last_changed,e?.attributes?.entity_picture];});
    return JSON.stringify([this._config,rows,this._opened,this._busy,this._error,this._confirmation,[...this._movement],this._isDark(),Math.floor(Date.now()/60000),this._popupLive,this._liveFail]);
  }
  _paint(){
    if(!this.shadowRoot||!this.isConnected)return;
    const sig=this._signature();if(sig===this._lastSignature)return;this._lastSignature=sig;
    const cfg=this._config;
    const nowMs=Date.now();
    const recent=cfg.cameras.filter(c=>{const t=cgTime(this._lastEvent(c),nowMs);return !!t&&nowMs-t.ms<3600000;}).length;
    const nCam=cfg.cameras.length;
    const chips=nCam?`<div class="cg-chips"><span class="cg-chip">${cgIcon('cctv')}${nCam} ${nCam===1?'telecamera':'telecamere'}</span>${recent?`<span class="cg-chip on" title="Ultimo movimento entro 1 ora">${cgIcon('motion-sensor')}${recent} con movimento recente</span>`:''}</div>`:'';
    // Label and title can be switched off; the camera-count chips stay visible.
    const headText=(cfg.show_eyebrow?`<div class="cg-eyebrow">${cgEsc(cfg.eyebrow)}</div>`:'')+(cfg.show_title?`<div class="cg-title">${cgEsc(cfg.title)}<b>.</b></div>`:'');
    const headHtml=headText||chips?`<div class="cg-head">${headText?`<div>${headText}</div>`:''}${chips}</div>`:'';
    const columns=cfg.layout==='auto'?2:cfg.layout==='1'?1:cfg.layout==='2'?2:cfg.layout==='4'?2:cfg.custom_columns;
    const bodyTop=this.shadowRoot.querySelector?.('.cg-dialog-body')?.scrollTop||0;
    this.shadowRoot.innerHTML=`<style>${CG_STYLE}</style><div class="cg-root ${this._isDark()?'cg-dark':'cg-light'}" style="--cg-cols:${columns};--cg-narrow-cols:${cfg.layout==='1'?1:2}">${headHtml}${cfg.cameras.length?`<div class="cg-grid-host"><div class="cg-grid">${cfg.cameras.map((c,i)=>this._row(c,i)).join('')}</div></div>`:'<div class="cg-empty">Aggiungi una telecamera dall’editor grafico della card.</div>'}${this._opened!==null?this._popup(this._opened):''}</div>`;
    if(bodyTop){const b=this.shadowRoot.querySelector('.cg-dialog-body');if(b)b.scrollTop=bodyTop;}
    // Keep keyboard focus inside the popup (on the close button) so Escape works; never move focus if it is already on a popup control.
    if(this._opened!==null&&!this.shadowRoot.activeElement){const x=this.shadowRoot.querySelector('[data-close]');x?.focus?.({preventScroll:true});}
    this._syncLive();
  }
  // Live video is rendered by the native Home Assistant card (picture-entity, camera_view: live).
  // The native element lives in the light DOM and is projected into the shadow DOM through named slots,
  // so repainting the card never restarts a running stream.
  _liveKeys(){
    const keys=new Map();
    this._config.cameras.forEach((c,i)=>{if(c.show_preview&&c.live_preview&&c.camera_entity)keys.set(`tile-${i}`,c.camera_entity);});
    if(this._opened!==null&&this._popupLive&&!this._confirmation){const c=this._config.cameras[this._opened];if(c?.camera_entity)keys.set('popup',c.camera_entity);}
    return keys;
  }
  _syncLive(){
    if(typeof document==='undefined'||typeof this.appendChild!=='function'||!this.isConnected)return;
    const want=this._liveKeys();
    for(const [key,w] of [...this._liveEls]){if(want.get(key)!==w.entity){w.node.remove();this._liveEls.delete(key);}}
    for(const [key,entity] of want){if(!this._liveEls.has(key))this._mountLive(key,entity);}
  }
  _mountLive(key,entity){
    const node=document.createElement('div');node.slot=`cg-live-${key}`;node.className='cg-live-wrap';
    const w={entity,node,card:null};this._liveEls.set(key,w);this.appendChild(node);
    (async()=>{
      try{
        const helpers=await window.loadCardHelpers?.();
        if(typeof helpers?.createCardElement!=='function')throw new Error('card helpers unavailable');
        const card=await helpers.createCardElement({type:'picture-entity',entity,camera_view:'live',show_name:false,show_state:false,tap_action:{action:'none'},hold_action:{action:'none'}});
        if(this._liveEls.get(key)!==w)return; // stopped meanwhile
        card.hass=this._hass;w.card=card;node.appendChild(card);
      }catch{
        if(this._liveEls.get(key)===w){this._liveFail=true;this._lastSignature='';this._paint();}
      }
    })();
  }
  _stopLive(){for(const w of this._liveEls.values())w.node.remove();this._liveEls.clear();}
  _close(){this._clearAuto();this._opened=null;this._popupLive=false;this._confirmation=null;this._error='';this._lastSignature='';this._paint();}
  async _loadMovement(c){
    if(!c.motion_entity||c.last_event_entity||this._querying.has(c.motion_entity)||typeof this._hass?.callApi!=='function')return;
    this._querying.add(c.motion_entity);
    const from=Date.now()-7*86400000;
    const endpoint=`history/period/${new Date(from).toISOString()}?filter_entity_id=${encodeURIComponent(c.motion_entity)}&no_attributes=1&significant_changes_only=0`;
    try {const rows=await this._hass.callApi('GET',endpoint);const latest=cgLatestMovement(rows,from);if(latest)this._movement.set(c.motion_entity,latest);}
    catch { /* Recorder history is optional; missing history must not be invented. */ }
    finally {this._querying.delete(c.motion_entity);this._lastSignature='';this._paint();}
  }
  _requestControl(kind,index){
    const c=this._config.cameras[index];
    if(!c||this._opened!==index||!this._config.controls_enabled||!c[`${kind}_control_enabled`]||this._busy)return;
    const id=c[`${kind}_control_entity`];
    if(!id||!['switch','input_boolean'].includes(id.split('.')[0]))return;
    const state=cgBoolState(this._state(id));if(state===null)return;
    this._confirmation={kind,index,entity_id:id,expected:state};
    this._error='';this._lastSignature='';this._paint();
  }
  async _performControl(kind,index,expected=null){
    const c=this._config.cameras[index],id=c?.[`${kind}_control_entity`];
    if(!c||!this._config.controls_enabled||!c[`${kind}_control_enabled`]||this._busy||!id)return;
    const domain=id.split('.')[0];if(!['switch','input_boolean'].includes(domain))return;
    const state=cgBoolState(this._state(id));if(state===null)return;
    if(expected!==null&&state!==expected){this._error='Stato modificato nel frattempo. Riapri il controllo e verifica lo stato attuale.';this._confirmation=null;this._lastSignature='';this._paint();return;}
    if(typeof this._hass?.callService!=='function')return;
    this._busy=true;this._error='';this._lastSignature='';this._paint();
    try {await this._hass.callService(domain,state?'turn_off':'turn_on',{entity_id:id});this._confirmation=null;}
    catch(err){this._confirmation=null;this._error=`Comando ${kind==='audio'?'audio':'registrazione'} non riuscito: ${cgText(err?.message||'Errore Home Assistant',140)}`;}
    finally {this._busy=false;this._lastSignature='';this._paint();}
  }
  async _toggleAudio(index){return this._performControl('audio',index);}
  async _toggleRecording(index){return this._performControl('recording',index);}
  _click(event){
    this._clearAuto();
    if(event.target?.dataset?.backdrop==='1'){this._close();return;}
    if(event.target.closest('[data-close]')){this._close();return;}
    if(event.target.closest('[data-cancel]')){this._confirmation=null;this._lastSignature='';this._paint();return;}
    if(event.target.closest('[data-confirm]')){
      const p=this._confirmation;if(!p)return;
      const cam=this._config.cameras[p.index];
      if(!cam||cam[`${p.kind}_control_entity`]!==p.entity_id){this._confirmation=null;this._lastSignature='';this._paint();return;}
      this._performControl(p.kind,p.index,p.expected);return;
    }
    const live=event.target.closest('[data-live]');if(live){if(this._opened===null)return;this._popupLive=live.dataset.live==='start';this._liveFail=false;this._lastSignature='';this._paint();return;}
    const more=event.target.closest('[data-more]');if(more){const id=more.dataset.more;this._close();this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));return;}
    const request=event.target.closest('[data-request]');if(request){const [kind,idx]=request.dataset.request.split(':');if(['audio','recording'].includes(kind))this._requestControl(kind,Number(idx));return;}
    const btn=event.target.closest('[data-open]');if(btn){const idx=Number(btn.dataset.open);if(!this._config.cameras[idx])return;this._opened=idx;this._popupLive=false;this._confirmation=null;this._error='';this._lastSignature='';this._paint();this._loadMovement(this._config.cameras[idx]);}
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
.cg-camera-group{padding-bottom:20px}
.cg-camera-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}.cg-camera-picker{display:flex;gap:5px;overflow-x:auto;border-bottom:1px solid var(--divider-color,#dfe5df);padding:14px 0 12px}.cg-camera-chip{border:0;border-radius:13px;padding:10px 12px;flex:none;background:none;color:var(--secondary-text-color,#536359);font:inherit;font-size:13px;cursor:pointer}.cg-camera-chip.active{background:var(--secondary-background-color,#f0f2ef);color:var(--primary-text-color,#17231c);font-weight:650}
.cg-camera-head strong{font-size:15px;font-weight:600}
.cg-controls{display:flex;gap:6px;flex:none}
.cg-controls .cg-action{padding:5px 9px;border-radius:10px}
.cg-add{display:block;margin:12px 0 25px}
.cg-notice{margin-top:10px;color:var(--error-color,#bd4b42);font-size:12px}
`;
class CameraGridViewCardEditor extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._nativeTried=false;
    this._tab='telecamere';this._details={};this._selectedCamera=0;
    this.shadowRoot.addEventListener('click',e=>this._click(e));
    this.shadowRoot.addEventListener('change',e=>this._change(e));
  }
  set hass(hass){this._hass=hass;this.shadowRoot.querySelectorAll('ha-selector').forEach(el=>el.hass=hass);}
  setConfig(raw){
    const config=cgConfig(raw);
    if(JSON.stringify(config)===JSON.stringify(this._config)&&this.shadowRoot.querySelector('.cg-editor'))return;
    this._config=config;this._selectedCamera=Math.min(this._selectedCamera,Math.max(0,config.cameras.length-1));this._render();
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
      this._entityField(index,'recording_state_entity','Stato registrazione (facoltativo)')+
      this._entityField(index,'recording_control_entity','Controllo registrazione (facoltativo)','Richiede switch.* o input_boolean.* che comandi realmente la registrazione di questa telecamera.')+
      this._check(index,'recording_control_enabled','Consenti controllo registrazione per questa telecamera','Richiede anche Abilita i comandi reali in Avanzate.')+
      this._entityField(index,'battery_entity','Batteria (facoltativa)');
    return `<section class="cg-camera-group"><div class="cg-camera-head"><strong>${cgEsc(cam.name||`Telecamera ${index+1}`)}</strong><div class="cg-controls"><button type="button" class="cg-action" data-move="${index}:-1" aria-label="Sposta su" ${index===0?'disabled':''}>↑</button><button type="button" class="cg-action" data-move="${index}:1" aria-label="Sposta giù" ${index===this._config.cameras.length-1?'disabled':''}>↓</button><button type="button" class="cg-clear" data-delete="${index}" aria-label="Rimuovi telecamera">${cgIcon('close')}</button></div></div>`+
      this._entityField(index,'camera_entity','Telecamera live (camera.*)','Facoltativa. Funziona con qualsiasi telecamera di Home Assistant e abilita il live nel popup.')+
      this._entityField(index,'image_entity','Ultima immagine rilevata (image.*)','Facoltativa se è configurata una telecamera live.')+
      this._input(index,'name','Nome visualizzato',cam.name)+
      this._check(index,'show_preview','Mostra ultima immagine nella dashboard','Disattivata di default per privacy. Il popup resta disponibile.')+
      this._check(index,'live_preview','Mostra il live nell’anteprima della dashboard','Richiede una telecamera live e Mostra ultima immagine nella dashboard. Avvia un flusso video per ogni telecamera: usalo con parsimonia.')+
      this._check(index,'auto_popup','Apri il popup a una nuova immagine rilevata','Richiede anche l’opzione generale in Avanzate. Funziona solo con la dashboard aperta.')+
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
      body='<div class="cg-heading">Configurazione telecamere</div><div class="cg-desc">Seleziona una telecamera, poi configura le sue entità e le opzioni disponibili.</div>'+
        (c.cameras.length?`<div class="cg-camera-picker">${c.cameras.map((cam,i)=>`<button type="button" class="cg-camera-chip ${i===this._selectedCamera?'active':''}" data-select-camera="${i}">${cgEsc(cam.name||`Telecamera ${i+1}`)}</button>`).join('')}</div>`:'')+
        (c.cameras[this._selectedCamera]?this._camera(this._selectedCamera,c.cameras[this._selectedCamera]):'<div class="cg-muted">Nessuna telecamera configurata.</div>')+
        '<button type="button" class="cg-action cg-add" data-add="1">+ Aggiungi telecamera</button>'+
        '<div class="cg-muted">Nessun limite fisso al numero di telecamere.</div>';
    }
    if(this._tab==='aspetto'){
      const options=[['auto','Automatico'],['1','1 telecamera per riga'],['2','2 telecamere per riga'],['4','4 telecamere (griglia 2×2)'],['custom','Personalizzato']];
      const layout=`<select class="cg-input" data-scope="global" data-key="layout">${options.map(([val,label])=>`<option value="${val}" ${c.layout===val?'selected':''}>${label}</option>`).join('')}</select>`;
      const themes=`<select class="cg-input" data-scope="global" data-key="theme_mode">${[['auto','Auto (Home Assistant)'],['light','Light Edera'],['dark','Dark Edera']].map(([val,label])=>`<option value="${val}" ${c.theme_mode===val?'selected':''}>${label}</option>`).join('')}</select>`;
      body='<div class="cg-heading">Aspetto Edera</div><div class="cg-desc">Tema, tipografia e disposizione delle telecamere, coerenti con Security Panel Card.</div>'+
        this._check('global','show_eyebrow','Mostra intestazione superiore')+(c.show_eyebrow?this._input('global','eyebrow','Intestazione superiore',c.eyebrow):'')+
        this._check('global','show_title','Mostra titolo')+(c.show_title?this._input('global','title','Titolo',c.title):'')+
        this._field('Tema',themes)+this._field('Layout',layout)+
        (c.layout==='custom'?this._field('Numero colonne (1–12)',`<input class="cg-input" type="number" min="1" max="12" data-scope="global" data-key="custom_columns" value="${c.custom_columns}"/>`):'');
    }
    if(this._tab==='avanzate'){
      body='<div class="cg-heading">Avanzate</div><div class="cg-desc">La card è inizialmente in sola lettura. Abilita i comandi soltanto dopo aver verificato le entità configurate.</div>'+
        this._check('global','controls_enabled','Abilita i comandi reali','Permette il controllo audio e registrazione esclusivamente per le telecamere autorizzate. I permessi Home Assistant restano necessari.')+
        this._check('global','auto_popup_enabled','Apri il popup a una nuova immagine rilevata','Mostra automaticamente l’ultima immagine rilevata e la chiude dopo il tempo indicato. Solo con la dashboard aperta. Disattivato di default.')+
        this._field('Secondi prima della chiusura automatica (5–60)',`<input class="cg-input" type="number" min="5" max="60" data-scope="global" data-key="auto_popup_seconds" value="${c.auto_popup_seconds}"/>`)+
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
    const select=event.target.closest('[data-select-camera]');if(select){this._selectedCamera=Number(select.dataset.selectCamera);this._render();return;}
    const clear=event.target.closest('[data-clear]');if(clear){const [i,key]=clear.dataset.clear.split(':');this._updateCamera(Number(i),{[key]:''});return;}
    const add=event.target.closest('[data-add]');if(add){this._selectedCamera=this._config.cameras.length;this._update({cameras:[...this._config.cameras,cgCamera()]});return;}
    const del=event.target.closest('[data-delete]');if(del){const index=Number(del.dataset.delete);this._selectedCamera=Math.max(0,Math.min(index,this._config.cameras.length-2));this._update({cameras:this._config.cameras.filter((_,i)=>i!==index)});return;}
    const move=event.target.closest('[data-move]');if(move){const [idx,d]=move.dataset.move.split(':').map(Number);const cams=[...this._config.cameras];const next=idx+d;if(next<0||next>=cams.length)return;[cams[idx],cams[next]]=[cams[next],cams[idx]];this._selectedCamera=next;this._update({cameras:cams});}
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
  if(!window.customCards.some(c=>c.type===CG_TAG))window.customCards.push({type:CG_TAG,name:'Camera Grid View Card',description:'Galleria Edera con popup snapshot, live, audio e anteprime privacy-first.',preview:true});
}
export {cgConfig,cgImageUrl,cgLatestMovement,cgTime,cgBoolState,cgIsPhone};

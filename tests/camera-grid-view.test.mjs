import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
// Home Assistant supplies HTMLElement and customElements in the browser; mock before import.
class StubElement {
  constructor(){this.shadowRoot=null;this.isConnected=true;}
  attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){},querySelectorAll(){return []},querySelector(){return {focus(){},classList:{toggle(){}}}}};return this.shadowRoot;}
}
globalThis.HTMLElement=StubElement;
const definitions=new Map();
globalThis.customElements={get:n=>definitions.get(n),define:(n,c)=>definitions.set(n,c)};
globalThis.window={customCards:[]};
const {cgConfig,cgImageUrl,cgLatestMovement,cgTime,cgBoolState,cgIsPhone,cgT,cgPickLang,CG_TR,CG_LANGS,CG_DOMAINS}=await import('../src/camera-grid-view-card.js');
const Card=definitions.get('camera-grid-view-card');

test('defaults protect privacy and disallow real commands',()=>{
  const c=cgConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  assert.equal(c.controls_enabled,false);
  assert.equal(c.cameras[0].show_preview,false);
  assert.equal(c.cameras[0].audio_control_enabled,false);
  assert.equal(c.cameras[0].image_entity,'image.ingresso');
});

test('unlimited list is preserved without truncation',()=>{
  const c=cgConfig({cameras:Array.from({length:101},(_,i)=>({name:`Telecamera ${i}`}))});
  assert.equal(c.cameras.length,101);
});

test('reject unsafe or unsupported entities, malicious names are not used as entity IDs',()=>{
  const c=cgConfig({cameras:[{name:'<img onerror=alert(1)>',image_entity:'https://example.com/a',audio_control_entity:'sensor.temperatura',motion_entity:'binary_sensor.a'}]});
  assert.equal(c.cameras[0].image_entity,'');
  assert.equal(c.cameras[0].audio_control_entity,'');
  assert.equal(c.cameras[0].motion_entity,'binary_sensor.a');
});

test('only local image paths are accepted and invalid state ignored',()=>{
  const e=state=>({state,attributes:{entity_picture:'/api/image_proxy/image.porta?token=x'}});
  assert.match(cgImageUrl(e('2026-10-18T12:10:00')), /^\/api\/image_proxy\//);
  for(const url of ['https://evil.example/p','//evil.example/p','javascript:alert(1)','/foo\\bar']){
    assert.equal(cgImageUrl({state:'on',attributes:{entity_picture:url}}),'');
  }
  assert.equal(cgImageUrl(e('unavailable')),'');
});

test('binary control uses only known on/off states',()=>{
  assert.equal(cgBoolState({state:'on'}),true);
  assert.equal(cgBoolState({state:'off'}),false);
  assert.equal(cgBoolState({state:'unknown'}),null);
  assert.equal(cgBoolState({state:'volume_on'}),null);
});

test('motion history requires an actual off-to-on transition',()=>{
  const from=Date.parse('2026-10-16T00:00:00Z');
  const history=[[{state:'on',last_changed:'2026-10-16T09:00:00Z'},
    {state:'off',last_changed:'2026-10-16T10:00:00Z'},
    {state:'on',last_changed:'2026-10-16T11:00:00Z'}]];
  assert.equal(cgLatestMovement(history,from),'2026-10-16T11:00:00Z');
  assert.equal(cgLatestMovement([[{state:'on',last_changed:'2026-10-16T09:00:00Z'}]],from),null);
});

test('future dates are not reported as actual events',()=>{
  assert.equal(cgTime('2099-01-01T00:00:00Z'),null);
  assert.ok(cgTime('2026-10-16T09:00:00Z',Date.parse('2026-10-18T09:00:00Z')));
});

test('no image URL appears in dashboard when camera preview is disabled',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Porta',image_entity:'image.porta',show_preview:false}]});
  card.hass={states:{'image.porta':{state:'2026-10-18',attributes:{entity_picture:'/api/image_proxy/image.porta'}}}};
  assert.doesNotMatch(card.shadowRoot.innerHTML,/<img\b/);
  card._opened=0;card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML,/<img\b/);
});

test('real audio commands require both global and camera authorization',async()=>{
  const actions=[];const card=new Card();card.setConfig({cameras:[{audio_control_entity:'switch.audio',audio_control_enabled:true}]});
  card.hass={states:{'switch.audio':{state:'on'}},callService:async(...args)=>actions.push(args)};
  await card._toggleAudio(0);assert.equal(actions.length,0);
  card.setConfig({controls_enabled:true,cameras:[{audio_control_entity:'switch.audio',audio_control_enabled:true}]});
  await card._toggleAudio(0);
  assert.deepEqual(actions,[['switch','turn_off',{entity_id:'switch.audio'}]]);
});


test('Edera title uses attached green punctuation, not a detached decorative dot',()=>{
  const card=new Card();card.setConfig({title:'Telecamere'});
  assert.match(card.shadowRoot.innerHTML, /class="cg-title">Telecamere<b>\.<\/b>/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /cg-dot/);
});

test('dashboard tile contains the Weather Pulse style Dettagli e stato button',()=>{
  const card=new Card();card.setConfig({language:'it',cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  assert.match(card.shadowRoot.innerHTML,/class="cg-open-badge">Dettagli e stato[\s\S]*mdi:chevron-right/);
  assert.match(card.shadowRoot.innerHTML,/\.cg-root \.cg-open-badge\{[^}]*border-radius:999px[^}]*color-mix\(in srgb,var\(--cg-accent\) 12%,transparent\)/);
});

test('editor has Security Panel style tabs and vertical fields',()=>{
  const source=readFileSync(new URL('../src/camera-grid-view-card.js',import.meta.url),'utf8');
  assert.match(source,/class="cg-tabs"/);
  assert.match(source,/\['telecamere',this\._t\('tCam'\)\],\['moduli',this\._t\('tMod'\)\],\['aspetto',this\._t\('tAsp'\)\]/);
  assert.doesNotMatch(source,/class="cg-more"/);
  assert.doesNotMatch(source,/avanzate/i);
  assert.match(source,/\.cg-field\{display:block;margin:20px 0\}/);
  assert.doesNotMatch(source,/\.cg-fields\{display:grid;grid-template-columns:1fr 1fr/);
  assert.doesNotMatch(source,/Aspetto e disposizione/);
});


test('real editor renders one-column Security Panel sections and existing camera config',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const editor=new Editor();
  editor.setConfig({language:'it',cameras:[{name:'Spioncino',image_entity:'image.spioncino',show_preview:true,motion_entity:'binary_sensor.spioncino'}]});
  assert.match(editor.shadowRoot.innerHTML,/class="cg-tabs"/);
  assert.match(editor.shadowRoot.innerHTML,/Ultima immagine rilevata/);
  assert.match(editor.shadowRoot.innerHTML,/Rimuovi telecamera/);
  assert.match(editor.shadowRoot.innerHTML,/checked/);
  assert.doesNotMatch(editor.shadowRoot.innerHTML,/Altre opzioni/);
  editor._tab='moduli';editor._render();
  assert.match(editor.shadowRoot.innerHTML,/Entità movimento \(facoltativa\)/);
  assert.match(editor.shadowRoot.innerHTML,/Abilita i comandi reali/);
  editor._tab='aspetto';editor._render();
  assert.match(editor.shadowRoot.innerHTML,/class="cg-heading">Aspetto</);
  assert.match(editor.shadowRoot.innerHTML,/CAMERA GRID VIEW CARD/);
  assert.doesNotMatch(editor.shadowRoot.innerHTML,/CAMERA GALLERY CARD/);
});

test('dashboard matches Security Panel typography and circular device icons',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Spioncino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html, /class="cg-icon-orb"/);
  assert.match(html, /\.cg-icon-orb\{[^}]*width:43px;height:43px;border-radius:50%/);
  assert.match(html, /\.cg-name\{[^}]*font-size:13px;font-weight:600/);
  assert.match(html, /\.cg-head\{margin:2px 4px 17px/);
});

test('image details in popup use Security Panel green full-width action',()=>{
  const card=new Card();card.setConfig({cameras:[{image_entity:'image.porta'}]});
  card._opened=0;card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML, /class="cg-wide" data-more="image.porta"/);
  assert.match(card.shadowRoot.innerHTML, /\.cg-wide\{[^}]*background:var\(--cg-accent\)/);
});

test('recording control is per-camera, off by default, and limited to commandable domains',()=>{
  const cfg=cgConfig({cameras:[{recording_state_entity:'binary_sensor.rec',recording_control_entity:'switch.record',recording_control_enabled:true},{recording_state_entity:'sensor.recording'}]});
  assert.equal(cfg.cameras[0].recording_control_entity,'switch.record');
  assert.equal(cfg.cameras[1].recording_control_enabled,false);
  assert.equal(cgConfig({cameras:[{recording_control_entity:'binary_sensor.record'}]}).cameras[0].recording_control_entity,'');
});

test('recording command requires global and individual authorizations',async()=>{
  const actions=[];const card=new Card();card.setConfig({controls_enabled:true,cameras:[{recording_control_entity:'switch.rec',recording_control_enabled:false}]});
  card.hass={states:{'switch.rec':{state:'off'}},callService:async(...args)=>actions.push(args)};
  await card._toggleRecording(0);assert.equal(actions.length,0);
  card.setConfig({controls_enabled:true,cameras:[{recording_control_entity:'switch.rec',recording_control_enabled:true}]});
  await card._toggleRecording(0);
  assert.deepEqual(actions,[['switch','turn_on',{entity_id:'switch.rec'}]]);
});

test('UI requires explicit confirmation for audio and recording',async()=>{
  const actions=[];const card=new Card();card.setConfig({language:'it',controls_enabled:true,cameras:[{name:'Ingresso',audio_control_entity:'switch.audio',audio_control_enabled:true,recording_control_entity:'switch.rec',recording_control_enabled:true}]});
  card.hass={states:{'switch.audio':{state:'on'},'switch.rec':{state:'off'}},callService:async(...args)=>actions.push(args)};
  card._opened=0;card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML, /data-request="audio:0"/);
  assert.match(card.shadowRoot.innerHTML, /data-request="recording:0"/);
  card._requestControl('recording',0);
  assert.equal(actions.length,0);
  assert.match(card.shadowRoot.innerHTML,/Vuoi attivare registrazione/);
  const confirm=card._confirmation;
  await card._performControl(confirm.kind,confirm.index,confirm.expected);
  assert.deepEqual(actions,[['switch','turn_on',{entity_id:'switch.rec'}]]);
});

test('stale confirmation does not toggle wrong state',async()=>{
  const actions=[];const card=new Card();card.setConfig({language:'it',controls_enabled:true,cameras:[{audio_control_entity:'switch.audio',audio_control_enabled:true}]});
  const entity={state:'on'};
  card.hass={states:{'switch.audio':entity},callService:async(...args)=>actions.push(args)};
  card._opened=0;card._requestControl('audio',0);
  assert.equal(card._confirmation?.expected,true);
  entity.state='off';
  await card._performControl('audio',0,true);
  assert.equal(actions.length,0);
  assert.match(card.shadowRoot.innerHTML,/Stato modificato nel frattempo/);
});

test('editor displays only the selected camera to match Security Panel layout',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');const editor=new Editor();
  editor.setConfig({language:'it',cameras:[{name:'Porta'},{name:'Giardino'}]});
  assert.match(editor.shadowRoot.innerHTML,/data-select-camera="0"/);
  assert.match(editor.shadowRoot.innerHTML,/data-select-camera="1"/);
  assert.equal((editor.shadowRoot.innerHTML.match(/class="cg-camera-head"/g)||[]).length,1);
  editor._selectedCamera=1;editor._render();
  assert.match(editor.shadowRoot.innerHTML, /class="cg-camera-chip active" data-select-camera="1"/);
  editor._tab='moduli';editor._render();
  assert.match(editor.shadowRoot.innerHTML, /class="cg-camera-chip active" data-select-camera="1"/);
  assert.match(editor.shadowRoot.innerHTML, /Controllo registrazione \(facoltativo\)/);
});

test('compact dashboard dimensions and focus border remain as approved',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Spioncino'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/\.cg-grid\{[^}]*gap:12px\}/);
  assert.match(html,/\.cg-cell\{[^}]*height:auto;min-height:82px;[^}]*border-radius:16px/);
  assert.match(html,/\.cg-cell:hover,\.cg-cell:focus\{border-color:var\(--cg-accent\)\}/);
  assert.match(html,/class="cg-icon-orb"/);
});

test('popup close is circular and image action is fully green',()=>{
  const card=new Card();card.setConfig({language:'it',cameras:[{image_entity:'image.ingresso'}]});
  card._opened=0;card._lastSignature='';card._paint();
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/\.cg-icon-btn\{[^}]*width:40px;height:40px;border-radius:50%;border:1px solid var\(--cg-border\)/);
  assert.match(html,/class="cg-icon-btn"[^>]*data-close="1"/);
  assert.match(html,/class="cg-wide" data-more="image\.ingresso"[^>]*>[^<]*<ha-icon[^>]*>[^<]*<\/ha-icon>Apri dettagli immagine<\/button>/);
  assert.match(html,/\.cg-wide\{[^}]*width:100%;border:0;[^}]*background:var\(--cg-accent\);color:white/);
});

test('details button shares the full tile click target and opens the matching camera popup',()=>{
  const card=new Card();
  card.setConfig({language:'it',cameras:[{name:'Ingresso'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/<button[^>]*class="cg-cell[^>]*data-open="0"[^>]*>[\s\S]*?<span class="cg-open-badge">Dettagli e stato [\s\S]*?<\/span><\/button>/);
  const tile={dataset:{open:'1'}};
  card._click({target:{closest(selector){return selector==='[data-open]'?tile:null;}}});
  assert.equal(card._opened,1);
  assert.match(card.shadowRoot.innerHTML,/Dettaglio Giardino/);
});


test('dashboard uses an inner container instead of viewport-only media rules',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Porta'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html, /class="cg-grid-host"><div class="cg-grid">/);
  assert.match(html, /\.cg-grid-host\{container:cg-camera-grid\/inline-size/);
  assert.match(html, /@container cg-camera-grid \(max-width:480px\)\{/);
  assert.match(html, /@container cg-camera-grid \(max-width:480px\)\{[\s\S]*?\.cg-grid\{grid-template-columns:repeat\(var\(--cg-narrow-cols,2\),minmax\(0,1fr\)\)\}/);
  assert.match(html, /\.cg-cell,\.cg-cell\.cg-with-preview\{height:auto;min-height:82px/);
  assert.match(html, /\.cg-cell\{[^}]*height:auto;min-height:82px/);
  assert.match(html, /\.cg-cell:hover,\.cg-cell:focus\{border-color:var\(--cg-accent\)\}/);
});

test('narrow responsive container encloses only grid, not fixed-position modal',()=>{
  const card=new Card();card.setConfig({language:'it',cameras:[{name:'Ingresso'}]});
  card._opened=0;card._lastSignature='';card._paint();
  const html=card.shadowRoot.innerHTML;
  assert.match(html, /<div class="cg-grid-host"><div class="cg-grid">/);
  assert.match(html, /<\/div><\/div><div class="cg-backdrop"/);
  assert.match(html, /Dettagli e stato/);
});


test('narrow dashboard keeps two cameras side-by-side with fluid tile heights',()=>{
  const card=new Card();card.setConfig({layout:'auto',cameras:[{name:'Porta'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html, /--cg-cols:2;--cg-narrow-cols:2/);
  assert.match(html, /\.cg-grid\{grid-template-columns:repeat\(var\(--cg-narrow-cols,2\),minmax\(0,1fr\)\)\}/);
  assert.match(html, /\.cg-open-badge\{max-width:100%;flex-shrink:0;min-width:0/);
  assert.match(html, /@container cg-camera-grid \(max-width:280px\)\{\.cg-grid\{grid-template-columns:1fr\}\}/);
});

test('explicit single-column layout is respected in narrow dashboards',()=>{
  const card=new Card();card.setConfig({layout:'1',cameras:[{name:'Porta'},{name:'Giardino'}]});
  assert.match(card.shadowRoot.innerHTML, /--cg-cols:1;--cg-narrow-cols:1/);
});


test('dashboard uses a single outer frame matching Security Panel Card',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Porta'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.ok(!html.includes('<ha-card'));
  assert.ok(html.includes('<style>'));
  assert.ok(html.includes('<div class="cg-root cg-'));
  assert.ok(html.includes('border:1px solid var(--cg-border);border-radius:26px;padding:18px'));
  assert.ok(html.includes('@media(max-width:420px){.cg-root{padding:13px;border-radius:23px'));
});

test('auto popup is opt-in with a 15 s default clamped to 5-60',()=>{
  assert.equal(cgConfig({}).auto_popup_enabled,false);
  assert.equal(cgConfig({}).auto_popup_seconds,15);
  assert.equal(cgConfig({auto_popup_seconds:1}).auto_popup_seconds,5);
  assert.equal(cgConfig({auto_popup_seconds:999}).auto_popup_seconds,60);
  assert.equal(cgConfig({auto_popup_seconds:'abc'}).auto_popup_seconds,15);
  assert.equal(cgConfig({cameras:[{name:'A'}]}).cameras[0].auto_popup,false);
  assert.equal(cgConfig({cameras:[{name:'A',auto_popup:true}]}).cameras[0].auto_popup,true);
});

const img=(state)=>({state,attributes:{entity_picture:'/api/image_proxy/image.spioncino'}});
function autoCard(extra={}){
  const card=new Card();
  card.setConfig({auto_popup_enabled:true,auto_popup_seconds:5,cameras:[{name:'Spioncino',image_entity:'image.spioncino',auto_popup:true},{name:'Garage',image_entity:'image.garage'}],...extra});
  card.hass={states:{'image.spioncino':img('2026-10-29T10:00:00+00:00'),'image.garage':img('2026-10-29T10:00:00+00:00')}};
  return card;
}

test('auto popup: no popup on first load, opens on a new image, never for cameras not enabled',()=>{
  const card=autoCard();
  assert.equal(card._opened,null);
  card.hass={states:{'image.spioncino':img('2026-10-29T10:05:00+00:00'),'image.garage':img('2026-10-29T10:00:00+00:00')}};
  assert.equal(card._opened,0);
  card._close();
  card.hass={states:{'image.spioncino':img('2026-10-29T10:05:00+00:00'),'image.garage':img('2026-10-29T10:06:00+00:00')}};
  assert.equal(card._opened,null);
  card._clearAuto();
});

test('auto popup: disabled globally, unavailable transitions and user-opened popups are respected',()=>{
  const off=autoCard({auto_popup_enabled:false});
  off.hass={states:{'image.spioncino':img('2026-10-29T10:05:00+00:00')}};
  assert.equal(off._opened,null);
  const card=autoCard();
  card.hass={states:{'image.spioncino':{state:'unavailable',attributes:{}}}};
  card.hass={states:{'image.spioncino':img('2026-10-29T10:07:00+00:00')}};
  assert.equal(card._opened,null);
  const manual=autoCard();
  manual._opened=1;
  manual.hass={states:{'image.spioncino':img('2026-10-29T10:09:00+00:00'),'image.garage':img('2026-10-29T10:00:00+00:00')}};
  assert.equal(manual._opened,1);
  assert.equal(manual._autoOpened,false);
});

test('auto popup: closes after the configured time and a click cancels the auto-close',async()=>{
  const card=autoCard({auto_popup_seconds:5});
  card.hass={states:{'image.spioncino':img('2026-10-29T10:05:00+00:00'),'image.garage':img('2026-10-29T10:00:00+00:00')}};
  assert.equal(card._opened,0);
  assert.ok(card._autoCloseAt>Date.now()+4000&&card._autoCloseAt<=Date.now()+5100);
  card._click({target:{closest:()=>null,dataset:{}}});
  assert.equal(card._autoTimer,null);
  assert.equal(card._opened,0);
  card._close();
  assert.equal(card._opened,null);
});

test('details button stays on one line and compacts in narrow tiles',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/\.cg-root \.cg-open-badge\{white-space:nowrap;flex:1 1 auto;min-width:max-content\}/);
  assert.match(html,/@container cg-cell \(max-width:175px\)/);
});

test('popup has a fixed header (title and X) above a scrolling body, like Entity Health Card',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  card._opened=0;card._lastSignature='';card._paint();
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/<div class="cg-dialog-head"><strong>Ingresso<\/strong><button class="cg-icon-btn"[^>]*data-close="1"[^>]*>[\s\S]*?<\/button><\/div><div class="cg-dialog-body">/);
  assert.match(html,/\.cg-dialog-head\{flex:none;[^}]*border-bottom:1px solid var\(--cg-border\)/);
  assert.match(html,/\.cg-dialog\{[^}]*display:flex;flex-direction:column;[^}]*overflow:hidden/);
  assert.match(html,/\.cg-dialog-body\{overflow-y:auto/);
});

test('low battery is shown as a chip in the tile header, not next to the details button',()=>{
  const card=new Card();
  card.setConfig({language:'it',cameras:[{name:'Giardino',image_entity:'image.g',battery_entity:'sensor.b'},{name:'Garage',image_entity:'image.h',battery_entity:'sensor.c'}]});
  card.hass={states:{'sensor.b':{state:'14',attributes:{}},'sensor.c':{state:'80',attributes:{}}}};
  const html=card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="cg-bat"/g)||[]).length,1);
  assert.match(html,/class="cg-bat" title="Batteria bassa: 14%"[^>]*>[\s\S]*?<b>14%<\/b>/);
  assert.doesNotMatch(html,/class="cg-foot"><span class="cg-open-badge">[^]*?<\/span><span class="cg-flag"/);
});

test('opening the popup moves focus to the close button so Escape works',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  let focused=0;
  const sr=card.shadowRoot;const q=sr.querySelector;
  sr.querySelector=s=>s==='[data-close]'?{focus(){focused++;}}:q.call(sr,s);
  card._opened=0;card._lastSignature='';card._paint();
  assert.equal(focused,1);
});

test('title and label are shown by default and can be switched off independently',()=>{
  const c=cgConfig({});assert.equal(c.show_eyebrow,true);assert.equal(c.show_title,true);
  const card=new Card();card.setConfig({language:'it',show_eyebrow:false,cameras:[{name:'A',image_entity:'image.a'}]});
  let html=card.shadowRoot.innerHTML;
  assert.doesNotMatch(html,/class="cg-eyebrow"/);assert.match(html,/class="cg-title">Telecamere<b>\.<\/b>/);
  card.setConfig({language:'it',show_title:false,cameras:[{name:'A',image_entity:'image.a'}]});
  html=card.shadowRoot.innerHTML;
  assert.match(html,/class="cg-eyebrow"/);assert.doesNotMatch(html,/class="cg-title"/);
  card.setConfig({show_eyebrow:false,show_title:false,cameras:[]});
  assert.doesNotMatch(card.shadowRoot.innerHTML,/class="cg-head"/);
});

test('camera_entity accepts only camera.* and live_preview is off by default',()=>{
  const c=cgConfig({cameras:[{camera_entity:'camera.ingresso'},{camera_entity:'image.x'},{camera_entity:'https://example.com'}]});
  assert.equal(c.cameras[0].camera_entity,'camera.ingresso');assert.equal(c.cameras[1].camera_entity,'');assert.equal(c.cameras[2].camera_entity,'');
  assert.equal(c.cameras[0].live_preview,false);
});

test('a camera.* entity alone is enough: name, still image and details come from it',()=>{
  const card=new Card();card.setConfig({cameras:[{camera_entity:'camera.giardino',show_preview:true}]});
  card.hass={states:{'camera.giardino':{state:'idle',attributes:{friendly_name:'Giardino',entity_picture:'/api/camera_proxy/camera.giardino?token=abc'}}}};
  let html=card.shadowRoot.innerHTML;
  assert.match(html,/class="cg-name">Giardino</);assert.match(html,/<img class="cg-preview"[^>]*src="\/api\/camera_proxy\/camera\.giardino\?token=abc&amp;cg_v=idle-\d+"/);
  assert.doesNotMatch(html,/<slot name="cg-live-tile-0">/);
  card._opened=0;card._lastSignature='';card._paint();html=card.shadowRoot.innerHTML;
  assert.match(html,/data-live="start"/);assert.match(html,/data-more="camera\.giardino"/);
});

test('existing image.* configurations are unchanged (no live controls, same snapshot URL)',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Porta',image_entity:'image.porta',show_preview:true}]});
  card.hass={states:{'image.porta':{state:'2026-10-18',attributes:{entity_picture:'/api/image_proxy/image.porta'}}}};
  card._opened=0;card._lastSignature='';card._paint();const html=card.shadowRoot.innerHTML;
  assert.doesNotMatch(html,/data-live=/);assert.match(html,/data-more="image\.porta"/);assert.match(html,/cg_v=2026-10-18"/);
});

test('live never appears in the dashboard unless preview and live_preview are both on',()=>{
  const states={'camera.a':{state:'idle',attributes:{entity_picture:'/api/camera_proxy/camera.a?token=t'}}};
  for(const cam of [{show_preview:false,live_preview:true},{show_preview:true,live_preview:false}]){
    const card=new Card();card.setConfig({cameras:[{name:'A',camera_entity:'camera.a',...cam}]});card.hass={states};
    assert.doesNotMatch(card.shadowRoot.innerHTML,/class="cg-live-box/);
    assert.equal(card._liveKeys().size,0);
  }
  const card=new Card();card.setConfig({cameras:[{name:'A',camera_entity:'camera.a',show_preview:true,live_preview:true}]});card.hass={states};
  assert.match(card.shadowRoot.innerHTML,/<slot name="cg-live-tile-0">/);assert.deepEqual([...card._liveKeys()],[['tile-0','camera.a']]);
});

test('popup live starts only on tap and stops when the popup closes',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'A',camera_entity:'camera.a'}]});
  card.hass={states:{'camera.a':{state:'idle',attributes:{entity_picture:'/api/camera_proxy/camera.a?token=t'}}}};
  card._opened=0;card._lastSignature='';card._paint();
  assert.equal(card._liveKeys().size,0);assert.doesNotMatch(card.shadowRoot.innerHTML,/<slot name="cg-live-popup">/);
  card._popupLive=true;card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML,/<slot name="cg-live-popup">/);assert.match(card.shadowRoot.innerHTML,/data-live="stop"/);
  assert.deepEqual([...card._liveKeys()],[['popup','camera.a']]);
  card._close();assert.equal(card._popupLive,false);assert.equal(card._liveKeys().size,0);
});

test('popup has a fixed height (not max-height) with vh fallback, on every device',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'A',image_entity:'image.a'}]});card._opened=0;card._lastSignature='';card._paint();
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/\.cg-dialog\{width:min\(390px,100%\);height:min\(calc\(100vh - 40px\),680px\);height:min\(calc\(100dvh - 40px\),680px\)/);
  assert.match(html,/@media\(min-width:640px\) and \(min-height:600px\)\{[^@]*\.cg-backdrop:not\(\.cg-phone\) \.cg-dialog:not\(\.cg-compact\)\{width:min\(1120px,100%\);height:min\(80vh,560px\);height:min\(80dvh,560px\)\}/);
  assert.match(html,/grid-template-columns:minmax\(0,1\.6fr\) minmax\(260px,1fr\)/);
  assert.match(html,/\.cg-dialog\.cg-compact\{height:auto/);
  assert.match(html,/<div class="cg-dialog-body"><div class="cg-pop-grid"><div class="cg-pop-media">/);
});

test('smartphone detection uses the physical screen (shortest side below 600 px), not the viewport',()=>{
  assert.equal(cgIsPhone({width:390,height:844}),true);
  assert.equal(cgIsPhone({width:844,height:390}),true);   // phone in landscape
  assert.equal(cgIsPhone({width:768,height:1024}),false); // tablet
  assert.equal(cgIsPhone({width:1920,height:1080}),false);
  assert.equal(cgIsPhone(null),false);
  globalThis.window.screen={width:390,height:844};
  const card=new Card();card.setConfig({cameras:[{name:'A',image_entity:'image.a'}]});card._opened=0;card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML,/<div class="cg-backdrop cg-phone"/);
  globalThis.window.screen={width:1024,height:768};card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML,/<div class="cg-backdrop" data-backdrop/);
  delete globalThis.window.screen;
});

test('confirmation dialogs stay compact (exempt from the fixed height)',()=>{
  const card=new Card();card.setConfig({controls_enabled:true,cameras:[{name:'A',image_entity:'image.a',audio_control_entity:'switch.au',audio_control_enabled:true}]});
  card.hass={states:{'switch.au':{state:'on',attributes:{}}}};
  card._opened=0;card._confirmation={kind:'audio',index:0,entity_id:'switch.au',expected:true};card._lastSignature='';card._paint();
  assert.match(card.shadowRoot.innerHTML,/class="cg-dialog cg-compact"/);
});


/* ---------------------------------------------------------------- languages (1.5) */
test('four languages with the same texts: Italian, English, German, French',()=>{
  assert.deepEqual(CG_LANGS.map(l=>l[0]),['it','en','de','fr']);
  const keys=Object.keys(CG_TR.en).sort();
  for(const l of ['it','de','fr']){
    assert.deepEqual(Object.keys(CG_TR[l]).sort(),keys,`missing or extra texts in ${l}`);
  }
  for(const l of Object.keys(CG_TR))for(const [k,v] of Object.entries(CG_TR[l]))assert.ok(typeof v==='string'&&v.trim(),`${l}.${k} is empty`);
});

test('language follows the Home Assistant user, the card option wins, English is the fallback',()=>{
  assert.equal(cgPickLang('auto',{locale:{language:'de'}}),'de');
  assert.equal(cgPickLang(undefined,{language:'fr-CA'}),'fr');
  assert.equal(cgPickLang('auto',{locale:{language:'es'}}),'en');
  assert.equal(cgPickLang('auto',null),'en');
  assert.equal(cgPickLang('it',{locale:{language:'de'}}),'it');
  assert.equal(cgConfig({language:'de'}).language,'de');
  assert.equal(cgConfig({language:'es'}).language,'auto');
  assert.equal(cgConfig({}).language,'auto');
  const card=new Card();card.setConfig({cameras:[{name:'A',image_entity:'image.a'}]});
  card.hass={locale:{language:'de'},states:{}};assert.match(card.shadowRoot.innerHTML,/Details und Status/);
  card.hass={locale:{language:'fr'},states:{}};assert.match(card.shadowRoot.innerHTML,/Détails et état/);
  card.hass={locale:{language:'es'},states:{}};assert.match(card.shadowRoot.innerHTML,/Details and status/);
  card.hass={locale:{language:'it'},states:{}};assert.match(card.shadowRoot.innerHTML,/Dettagli e stato/);
  card.setConfig({language:'en',cameras:[{name:'A',image_entity:'image.a'}]});
  assert.match(card.shadowRoot.innerHTML,/Details and status/);
});

test('default title is translated, a title saved by the user is kept, nothing extra is saved',()=>{
  assert.equal(cgConfig({}).title,null);
  assert.equal(cgConfig({title:'Casa'}).title,'Casa');
  const card=new Card();card.setConfig({language:'en',cameras:[]});assert.match(card.shadowRoot.innerHTML,/class="cg-title">Cameras<b>\.<\/b>/);
  card.setConfig({language:'fr',cameras:[]});assert.match(card.shadowRoot.innerHTML,/class="cg-title">Caméras<b>\.<\/b>/);
  card.setConfig({language:'en',title:'Telecamere',cameras:[]});assert.match(card.shadowRoot.innerHTML,/class="cg-title">Telecamere<b>\.<\/b>/);
  assert.equal('title' in Card.getStubConfig(),false);
  assert.equal(Card.getStubConfig().type,'custom:camera-grid-view-card');
});

test('relative times use the right plural and language; the Italian date format is unchanged',()=>{
  const now=Date.parse('2026-11-19T12:00:00Z');
  const at=(minutes)=>new Date(now-minutes*60000).toISOString();
  assert.equal(cgTime(at(0),now,'it').relative,'adesso');
  assert.equal(cgTime(at(5),now,'it').relative,'5 min fa');
  assert.equal(cgTime(at(60),now,'it').relative,'1 ora fa');
  assert.equal(cgTime(at(180),now,'it').relative,'3 ore fa');
  assert.equal(cgTime(at(1440),now,'it').relative,'1 giorno fa');
  assert.equal(cgTime(at(2880),now,'en').relative,'2 days ago');
  assert.equal(cgTime(at(60),now,'en').relative,'1 hour ago');
  assert.equal(cgTime(at(120),now,'de').relative,'vor 2 Stunden');
  assert.equal(cgTime(at(5),now,'fr').relative,'il y a 5 min');
  assert.equal(cgTime(at(5),now).relative,'5 min fa');
  assert.match(cgTime(at(5),now,'it').exact,/^\d{2}\/\d{2}\/2026, \d{2}:\d{2}$/);
});

test('popup, confirmations and errors are translated; Italian texts stay as they were',async()=>{
  const states={'switch.rec':{state:'off',attributes:{}},'image.a':{state:'x',attributes:{}}};
  for(const [lang,popup,ask,cancel] of [['it','Dettaglio Porta','Vuoi attivare registrazione per Porta?','Annulla'],['en','Details: Porta','Turn on recording for Porta?','Cancel'],['de','Details: Porta','Aufzeichnung für Porta einschalten?','Abbrechen'],['fr','Détails : Porta','Activer l’enregistrement pour Porta ?','Annuler']]){
    const card=new Card();card.setConfig({language:lang,controls_enabled:true,cameras:[{name:'Porta',image_entity:'image.a',recording_control_entity:'switch.rec',recording_control_enabled:true}]});
    card.hass={states,callService:async()=>{}};
    card._opened=0;card._lastSignature='';card._paint();
    assert.ok(card.shadowRoot.innerHTML.includes(popup),lang+' popup');
    card._requestControl('recording',0);
    assert.ok(card.shadowRoot.innerHTML.includes(ask),lang+' confirmation');
    assert.ok(card.shadowRoot.innerHTML.includes('>'+cancel+'<'),lang+' cancel');
  }
  const en=new Card();en.setConfig({language:'en',controls_enabled:true,cameras:[{recording_control_entity:'switch.rec',recording_control_enabled:true}]});
  en.hass={states:{'switch.rec':{state:'off',attributes:{}}},callService:async()=>{throw new Error('boom');}};
  en._opened=0;await en._performControl('recording',0);
  assert.match(en.shadowRoot.innerHTML,/Recording command failed: boom/);
});

/* ---------------------------------------------------------------- editor tabs (1.5) */
test('editor has exactly three tabs: Cameras, Modules, Appearance (no Advanced)',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const names={it:['Telecamere','Moduli','Aspetto'],en:['Cameras','Modules','Appearance'],de:['Kameras','Module','Darstellung'],fr:['Caméras','Modules','Apparence']};
  for(const [lang,[a,b,c]] of Object.entries(names)){
    const editor=new Editor();editor.setConfig({language:lang,cameras:[{name:'Porta'}]});
    const html=editor.shadowRoot.innerHTML;
    assert.deepEqual([...html.matchAll(/data-tab="(\w+)">([^<]+)</g)].map(m=>[m[1],m[2]]),[['telecamere',a],['moduli',b],['aspetto',c]]);
    assert.doesNotMatch(html,/data-tab="avanzate"/);
  }
});

test('every existing option is still in the editor: nothing was removed, only moved',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const editor=new Editor();editor.setConfig({language:'it',cameras:[{name:'Porta'}]});
  const dump=(tab)=>{editor._tab=tab;editor._render();return editor.shadowRoot.innerHTML;};
  const cam=dump('telecamere'),mod=dump('moduli'),look=dump('aspetto');
  const keysOf=html=>new Set([...html.matchAll(/data-(?:key|entity-slot)="(?:\d+:)?([a-z_]+)"/g)].map(m=>m[1]));
  const camKeys=keysOf(cam),modKeys=keysOf(mod),lookKeys=keysOf(look);
  for(const k of ['camera_entity','image_entity','name','show_preview','live_preview'])assert.ok(camKeys.has(k),'cameras tab: '+k);
  for(const k of ['motion_entity','last_event_entity','audio_state_entity','audio_control_entity','audio_control_enabled','recording_state_entity','recording_control_entity','recording_control_enabled','battery_entity','auto_popup','controls_enabled','auto_popup_enabled','auto_popup_seconds'])assert.ok(modKeys.has(k),'modules tab: '+k);
  for(const k of ['show_eyebrow','eyebrow','show_title','title','theme_mode','layout','language'])assert.ok(lookKeys.has(k),'appearance tab: '+k);
  // Every camera entity setting from the card definition is reachable.
  const reachable=new Set([...camKeys,...modKeys]);
  for(const k of Object.keys(CG_DOMAINS))assert.ok(reachable.has(k),'entity not reachable: '+k);
  assert.doesNotMatch(cam+mod+look,/Altre opzioni|Avanzate/);
});

test('editor: language option, translated texts, default title and clean config-changed',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const events=[];const editor=new Editor();editor.dispatchEvent=e=>events.push(e);
  editor.setConfig({cameras:[{name:'Porta'}]});
  editor.hass={locale:{language:'de'},states:{}};
  assert.match(editor.shadowRoot.innerHTML,/data-tab="moduli">Module</);
  editor._tab='aspetto';editor._render();
  let html=editor.shadowRoot.innerHTML;
  assert.match(html,/<option value="auto" selected>Automatisch \(Home Assistant\)<\/option><option value="it" >Italiano<\/option><option value="en" >English<\/option><option value="de" >Deutsch<\/option><option value="fr" >Français<\/option>/);
  assert.match(html,/data-key="title" value="Kameras"/);
  editor._change({target:{dataset:{scope:'global',key:'language'},type:'select-one',value:'fr'}});
  assert.equal(events.at(-1).detail.config.language,'fr');
  assert.equal('title' in events.at(-1).detail.config,false);
  assert.match(editor.shadowRoot.innerHTML,/data-tab="moduli">Modules</);
  assert.match(editor.shadowRoot.innerHTML,/data-key="title" value="Caméras"/);
  editor._change({target:{dataset:{scope:'global',key:'title'},type:'text',value:'Casa'}});
  assert.equal(events.at(-1).detail.config.title,'Casa');
  // Existing settings are never lost when the language is changed.
  editor.setConfig({language:'it',title:'Telecamere',controls_enabled:true,auto_popup_enabled:true,auto_popup_seconds:20,cameras:[{name:'Porta',image_entity:'image.porta',show_preview:true}]});
  editor._change({target:{dataset:{scope:'global',key:'language'},type:'select-one',value:'en'}});
  const out=events.at(-1).detail.config;
  assert.equal(out.title,'Telecamere');assert.equal(out.controls_enabled,true);assert.equal(out.auto_popup_seconds,20);
  assert.equal(out.cameras[0].image_entity,'image.porta');assert.equal(out.cameras[0].show_preview,true);
});

test('modules tab shows the options of the selected camera and the shared ones, in the chosen language',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const editor=new Editor();editor.setConfig({language:'en',cameras:[{name:'Porta'},{name:'Giardino'}]});
  editor._tab='moduli';editor._selectedCamera=1;editor._render();
  const html=editor.shadowRoot.innerHTML;
  assert.match(html,/class="cg-camera-chip active" data-select-camera="1"/);
  for(const text of ['Motion','Audio','Recording','Battery','Automatic popup','All cameras','Enable real commands','Seconds before automatic closing'])assert.ok(html.includes(text),text);
  assert.match(html,/data-entity-slot="1:motion_entity"/);
  assert.doesNotMatch(html,/data-entity-slot="0:motion_entity"/);
  const empty=new Editor();empty.setConfig({language:'en',cameras:[]});empty._tab='moduli';empty._render();
  assert.match(empty.shadowRoot.innerHTML,/No camera configured\./);
});

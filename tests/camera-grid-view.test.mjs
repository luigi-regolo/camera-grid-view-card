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
const {cgConfig,cgImageUrl,cgLatestMovement,cgTime,cgBoolState}=await import('../src/camera-grid-view-card.js');
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

test('dashboard tile contains the green Dettagli e stato badge',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  assert.match(card.shadowRoot.innerHTML,/class="cg-open-badge"[^>]*>[\s\S]*mdi:information-outline[\s\S]*Dettagli e stato/);
  assert.match(card.shadowRoot.innerHTML,/\.cg-open-badge\{[^}]*background:var\(--cg-accent\)/);
});

test('editor has Security Panel style tabs and vertical fields',()=>{
  const source=readFileSync(new URL('../src/camera-grid-view-card.js',import.meta.url),'utf8');
  assert.match(source,/class="cg-tabs"/);
  assert.match(source,/\['telecamere','Telecamere'\],\['aspetto','Aspetto'\],\['avanzate','Avanzate'\]/);
  assert.match(source,/class="cg-more"/);
  assert.match(source,/Altre opzioni/);
  assert.match(source,/\.cg-field\{display:block;margin:20px 0\}/);
  assert.doesNotMatch(source,/\.cg-fields\{display:grid;grid-template-columns:1fr 1fr/);
  assert.doesNotMatch(source,/Aspetto e disposizione/);
});


test('real editor renders one-column Security Panel sections and existing camera config',()=>{
  const Editor=definitions.get('camera-grid-view-card-editor');
  const editor=new Editor();
  editor.setConfig({cameras:[{name:'Spioncino',image_entity:'image.spioncino',show_preview:true,motion_entity:'binary_sensor.spioncino'}]});
  assert.match(editor.shadowRoot.innerHTML,/Configurazione telecamere/);
  assert.match(editor.shadowRoot.innerHTML,/class="cg-tabs"/);
  assert.match(editor.shadowRoot.innerHTML,/class="cg-more"/);
  assert.match(editor.shadowRoot.innerHTML,/Ultima immagine rilevata/);
  assert.match(editor.shadowRoot.innerHTML,/Rimuovi telecamera/);
  assert.match(editor.shadowRoot.innerHTML,/checked/);
  editor._tab='aspetto';editor._render();
  assert.match(editor.shadowRoot.innerHTML,/Aspetto Edera/);
  assert.match(editor.shadowRoot.innerHTML,/CAMERA GRID VIEW CARD/);
  assert.doesNotMatch(editor.shadowRoot.innerHTML,/CAMERA GALLERY CARD/);
  editor._tab='avanzate';editor._render();
  assert.match(editor.shadowRoot.innerHTML,/Abilita i comandi reali/);
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
  const actions=[];const card=new Card();card.setConfig({controls_enabled:true,cameras:[{name:'Ingresso',audio_control_entity:'switch.audio',audio_control_enabled:true,recording_control_entity:'switch.rec',recording_control_enabled:true}]});
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
  const actions=[];const card=new Card();card.setConfig({controls_enabled:true,cameras:[{audio_control_entity:'switch.audio',audio_control_enabled:true}]});
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
  editor.setConfig({cameras:[{name:'Porta'},{name:'Giardino'}]});
  assert.match(editor.shadowRoot.innerHTML,/data-select-camera="0"/);
  assert.match(editor.shadowRoot.innerHTML,/data-select-camera="1"/);
  assert.equal((editor.shadowRoot.innerHTML.match(/class="cg-camera-head"/g)||[]).length,1);
  editor._selectedCamera=1;editor._render();
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
  const card=new Card();card.setConfig({cameras:[{image_entity:'image.ingresso'}]});
  card._opened=0;card._lastSignature='';card._paint();
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/\.cg-icon-btn\{[^}]*width:36px;height:36px;[^}]*border-radius:50%/);
  assert.match(html,/class="cg-icon-btn"[^>]*data-close="1"/);
  assert.match(html,/class="cg-wide" data-more="image\.ingresso"[^>]*>[^<]*<ha-icon[^>]*>[^<]*<\/ha-icon>Apri dettagli immagine<\/button>/);
  assert.match(html,/\.cg-wide\{[^}]*width:100%;border:0;[^}]*background:var\(--cg-accent\);color:white/);
});

test('green badge shares the full tile click target and opens the matching camera popup',()=>{
  const card=new Card();
  card.setConfig({cameras:[{name:'Ingresso'},{name:'Giardino'}]});
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/<button[^>]*class="cg-cell[^>]*data-open="0"[^>]*>[\s\S]*?<span class="cg-open-badge">[\s\S]*?Dettagli e stato<\/span><\/button>/);
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
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso'}]});
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

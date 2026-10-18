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

test('dashboard tile contains the green Apri telecamera badge',()=>{
  const card=new Card();card.setConfig({cameras:[{name:'Ingresso',image_entity:'image.ingresso'}]});
  assert.match(card.shadowRoot.innerHTML,/class="cg-open-badge"[^>]*>[\s\S]*Apri telecamera/);
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

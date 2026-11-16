import {spawn} from 'node:child_process';
import {mkdir,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=path.join(root,'qa');await mkdir(qa,{recursive:true});
const browser=process.env.POTATO_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await access(browser);
let child,ws,seq=0;const pending=new Map(),errors=[],checks=[],requests=[];let browserLog='';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timed out: '+method));},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+' '+JSON.stringify(r.exceptionDetails.exception));return r.result.value;}
async function frames(){await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');}
async function screenshot(name){await frames();const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(qa,name+'.png'),Buffer.from(r.data,'base64'));}
function check(name,value){assert.ok(value,name);checks.push(name);console.log('PASS '+name);}
try{
  child=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--window-size=1440,900','--user-data-dir='+path.join(qa,'browser-profile'),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  child.stderr.on('data',d=>browserLog+=d.toString());
  let endpoint;for(let i=0;i<100;i++){const match=browserLog.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){endpoint=match[1];break;}if(child.exitCode!==null)throw new Error('Browser exited: '+browserLog);await delay(100);}if(!endpoint)throw new Error('No DevTools endpoint: '+browserLog);
  const origin=endpoint.replace('ws:','http:').split('/devtools')[0];const tabs=await(await fetch(origin+'/json/list')).json();const page=tabs.find(t=>t.type==='page');ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);});
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href+'?qa=1'});
  let ready=false;for(let i=0;i<100;i++){ready=await evaluate('Boolean(window.PotatoQA)');if(ready)break;await delay(100);}check('Local file opens and scene initializes',ready);
  await screenshot('01-title');
  await evaluate("document.getElementById('start').click()");await delay(1300);
  check('Start activates scene and audio',await evaluate("PotatoQA.state.started && PotatoQA.audio.ctx.state === 'running'"));
  await screenshot('02-garden');
  check('Cuckoo and dog recordings decode offline',await evaluate("PotatoQA.audio.ready.then(()=>PotatoQA.audio.samples.cuckoo.duration>6 && PotatoQA.audio.samples.dog.duration>2 && PotatoQA.audio.sampleErrors.length===0)"));
  check('Cuckoo and dog are scheduled and stop on a chapter change',await evaluate(`(()=>{
    const a=PotatoQA.audio;a.nextCuckoo=PotatoQA.state.real;a.nextDog=PotatoQA.state.real;a.update(10,PotatoQA.state.real);
    const playing=a.activeSounds.size===2;PotatoQA.jump(10);return playing&&a.activeSounds.size===0;
  })()`));
  const windReport=await evaluate(`(async()=>{
    PotatoQA.pause(true);const a=PotatoQA.audio;await a.ctx.resume();
    const analyser=a.ctx.createAnalyser();analyser.fftSize=8192;analyser.smoothingTimeConstant=0;a.wind.connect(analyser);
    const data=new Float32Array(analyser.fftSize),spectrum=new Float32Array(analyser.frequencyBinCount);
    const rms=()=>{analyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length);};
    a.update(10,1);await new Promise(r=>setTimeout(r,350));const calm=rms();
    a.update(10,15);PotatoQA.world.render(10,15,false);await new Promise(r=>setTimeout(r,350));const gust=rms();
    analyser.getFloatFrequencyData(spectrum);let low=0,total=0;
    for(let i=0;i<spectrum.length;i++){const power=10**(spectrum[i]/10);total+=power;if(i*a.ctx.sampleRate/analyser.fftSize<250)low+=power;}
    const synchronized=a.windStrength===PotatoQA.world.nature.windStrength;
    a.wind.disconnect(analyser);await a.ctx.suspend();PotatoQA.pause(false);
    return {calm,gust,lowFrequencyRatio:low/total,synchronized};
  })()`);
  check('Wind is silent in calm periods and audible during gusts',windReport.calm<1e-7&&windReport.gust>.0001);
  check('Wind has no prominent low-frequency hum',windReport.lowFrequencyRatio<.01);
  check('Foliage and wind sound share the same gust',windReport.synchronized);
  await evaluate('PotatoQA.jump(60)');await frames();check('Beetle appears on the stem',await evaluate('PotatoQA.world.stats().beetle'));await screenshot('07-beetle');
  const climbReport=await evaluate(`(()=>{
    PotatoQA.pause(true);const w=PotatoQA.world,b=w.visitors.models.beetle.root,heights=[];let maxGap=0;
    for(const t of [55,57,60,63,66,68]){
      w.render(t,15,false);const p=w.heroPlant.worldToLocal(b.position.clone());heights.push(p.y);
      let distance=Infinity;for(let i=0;i<=400;i++)distance=Math.min(distance,w.beetleStem.getPointAt(i/400).distanceTo(p));maxGap=Math.max(maxGap,distance);
    }
    w.render(60,1,false);const localBefore=w.heroPlant.worldToLocal(b.position.clone());const positionBefore=b.position.clone();const plantBefore=w.heroPlant.quaternion.clone();
    w.render(60,3,false);const localAfter=w.heroPlant.worldToLocal(b.position.clone());
    const follows=localBefore.distanceTo(localAfter)<.0001&&positionBefore.distanceTo(b.position)>.001;
    const movesInCalm=plantBefore.angleTo(w.heroPlant.quaternion)>.001;
    PotatoQA.jump(60);PotatoQA.pause(false);return {heights,maxGap,follows,movesInCalm};
  })()`);
  check('Beetle climbs from the base to the leaf without leaving the stem',climbReport.heights[0]<.15&&climbReport.heights.at(-1)>.73&&climbReport.heights.every((h,i,a)=>i===0||h>=a[i-1])&&climbReport.maxGap<.021);
  check('Beetle follows its swaying stem',climbReport.follows);
  check('Stems still move gently between wind gusts',climbReport.movesInCalm);
  await evaluate('PotatoQA.wiggle()');for(let i=0;i<20;i++){await delay(500);if(await evaluate('!PotatoQA.world.stats().beetle'))break;}check('Wiggle sends the beetle away',await evaluate('!PotatoQA.world.stats().beetle'));
  await evaluate("PotatoQA.jump(100);document.getElementById('bed-view').click()");await delay(600);await screenshot('14-potato-worm');
  check('Worm approaches and its hint offers a way to look',await evaluate("PotatoQA.world.visitors.info().kind==='worm' && PotatoQA.world.visitors.info().status==='approaching' && !document.getElementById('visitor-hint').classList.contains('hidden') && PotatoQA.world.view.pitch<-.3"));
  await evaluate('PotatoQA.jump(108);PotatoQA.pause(true);PotatoQA.world.lookAtBed();PotatoQA.world.render(108,PotatoQA.state.real,false)');
  check('Worm tries to eat when left alone',await evaluate("PotatoQA.world.visitors.info().status==='eating'"));
  const frozenVisitor=await evaluate('JSON.stringify(PotatoQA.world.visitors.models.worm.root.position)');await delay(200);
  check('Pause also freezes visitors',await evaluate('JSON.stringify(PotatoQA.world.visitors.models.worm.root.position)')===frozenVisitor);
  await evaluate('PotatoQA.world.render(112,PotatoQA.state.real+4,false)');
  check('Nibbling leaves a small mark on the tuber',await evaluate('PotatoQA.world.potato.bites.some(b=>b.visible)'));
  check('A shake interrupts nibbling and starts retreat',await evaluate("(()=>{const w=PotatoQA.world,r=PotatoQA.state.real+4;const result=w.wiggle(r);w.render(112,r+.2,false);return !!result&&w.visitors.info().status==='fleeing';})()"));
  await evaluate('PotatoQA.world.render(115,PotatoQA.state.real+7,false)');
  check('Scared worm stays gone for the rest of its encounter',await evaluate("!PotatoQA.world.visitors.info().visible && PotatoQA.world.visitors.info().status==='gone'"));
  await evaluate('PotatoQA.jump(207);PotatoQA.world.lookAtBed();PotatoQA.world.render(207,PotatoQA.state.real,false);document.getElementById("pause-panel").classList.add("hidden")');await screenshot('15-potato-slug');
  check('Slug appears and can be repelled too',await evaluate("(()=>{const w=PotatoQA.world,r=PotatoQA.state.real;const appeared=w.visitors.info().kind==='slug'&&w.visitors.info().visible;w.wiggle(r);w.render(208,r+3,false);return appeared&&!w.visitors.info().visible;})()"));
  await evaluate('PotatoQA.jump(360);PotatoQA.world.render(360,PotatoQA.state.real+75,false)');
  check('Visitors keep arriving after the six-minute evening',await evaluate('PotatoQA.world.visitors.info().visible'));
  await evaluate('PotatoQA.jump(0);PotatoQA.pause(false)');
  check('Restart clears visitors and bite marks',await evaluate("!PotatoQA.world.visitors.info().visible && !PotatoQA.world.potato.bites.some(b=>b.visible)"));
  await evaluate("PotatoQA.jump(100);document.getElementById('wiggle').click()");
  check('On-screen movement button scares a visitor',await evaluate("PotatoQA.world.visitors.info().status==='fleeing'"));
  await evaluate("PotatoQA.jump(207);document.getElementById('world').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  check('Space also scares the next visitor',await evaluate("PotatoQA.world.visitors.info().status==='fleeing'"));
  await evaluate('PotatoQA.jump(0)');
  await evaluate('PotatoQA.jump(145)');await frames();check('Grandmother and watering appear',await evaluate('PotatoQA.world.stats().grandma && PotatoQA.world.stats().water'));
  const grandmaReport=await evaluate(`(()=>{
    PotatoQA.pause(true);const g=PotatoQA.world.grandmother;let finite=true,maxArm=0,minFoot=Infinity;
    for(const t of [120,123,129,136,139,140,142,146,159,162,164,166,176,191]){
      g.update(t,20);for(const a of g.arms){maxArm=Math.max(maxArm,a.upper.scale.y,a.lower.scale.y);finite=finite&&a.hand.position.toArray().every(Number.isFinite);}
      for(const l of g.legs)minFoot=Math.min(minFoot,l.foot.position.y);
    }
    g.update(150,20);const source=g.waterSource();const right=g.arms[1].hand.getWorldPosition(new THREE.Vector3());const grip=g.can.localToWorld(new THREE.Vector3(.075,.265,0));
    const holds=right.distanceTo(grip)<.001,tilts=g.can.rotation.x>.3;
    g.update(130,20);const travel=g.legs.map(l=>l.foot.position.z);g.update(130.2,20.2);const steps=g.legs.some((l,i)=>Math.abs(l.foot.position.z-travel[i])>.005);
    PotatoQA.world.render(145,PotatoQA.state.real,false);PotatoQA.pause(false);return {finite,maxArm,minFoot,holds,tilts,steps,source:source.toArray()};
  })()`);
  check('Grandmother joints stay connected throughout the route',grandmaReport.finite&&grandmaReport.maxArm<.30&&grandmaReport.minFoot>=.069);
  check('Hand stays on the watering-can handle while it tilts',grandmaReport.holds&&grandmaReport.tilts);
  check('Grandmother takes alternating steps',grandmaReport.steps);
  await screenshot('03-watering');
  await evaluate("PotatoQA.audio.speak('watering')");await delay(500);check('Local Russian voice file is playable',await evaluate('PotatoQA.audio.voice.readyState >= 2 && !PotatoQA.audio.voice.error'));
  await evaluate("PotatoQA.audio.playAmbient('cuckoo',-.6); PotatoQA.pause(true)");const paused=await evaluate('PotatoQA.state.t');const pausedAudio=await evaluate('PotatoQA.audio.ctx.currentTime');await delay(300);check('Pause freezes the evening',await evaluate('PotatoQA.state.t')===paused);check('Pause suspends audio',await evaluate("PotatoQA.audio.ctx.state === 'suspended'"));check('Pause freezes recorded ambience playback',await evaluate('PotatoQA.audio.ctx.currentTime')===pausedAudio&&await evaluate('PotatoQA.audio.activeSounds.size>0'));await evaluate('PotatoQA.pause(false)');
  await evaluate("document.getElementById('sound').click()");check('Mute sets master gain target',await evaluate('PotatoQA.audio.muted'));await evaluate("document.getElementById('sound').click()");
  const before=await evaluate('PotatoQA.world.view.yaw');await send('Input.dispatchMouseEvent',{type:'mousePressed',x:700,y:450,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:900,y:450,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:900,y:450,button:'left',clickCount:1});check('Mouse drag changes the viewing angle',await evaluate('PotatoQA.world.view.yaw')!==before);
  const beforeKey=await evaluate('PotatoQA.world.view.yaw');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await delay(200);await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});check('Right arrow turns the camera right',await evaluate('PotatoQA.world.view.yaw')>beforeKey);
  await evaluate('PotatoQA.jump(246);PotatoQA.pause(true);PotatoQA.world.render(252.16,15,false)');
  check('Summer storm has rain, splashes and visible lightning',await evaluate('PotatoQA.world.storm.rain.visible && PotatoQA.world.storm.splashes.visible && PotatoQA.world.storm.bolt.visible'));
  check('Bees and butterflies shelter during the rain',await evaluate('PotatoQA.world.airlife.bees.every(b=>!b.root.visible) && PotatoQA.world.nature.insects.every(i=>!i.b.visible)'));
  await evaluate("document.getElementById('pause-panel').classList.add('hidden')");await screenshot('24-summer-storm');
  const frozenRain=await evaluate('Array.from(PotatoQA.world.storm.rain.geometry.attributes.position.array.slice(0,12))');await delay(200);
  check('Pause freezes raindrops',JSON.stringify(await evaluate('Array.from(PotatoQA.world.storm.rain.geometry.attributes.position.array.slice(0,12))'))===JSON.stringify(frozenRain));
  check('Thunder starts after lightning and clears when changing chapter',await evaluate(`(async()=>{
    const a=PotatoQA.audio;await a.ctx.resume();a.resetAmbience();a.update(251,15);a.update(252.16,15);
    const waiting=a.pendingThunder.length===1&&![...a.activeSounds].some(s=>s.weather==='thunder');a.update(254.5,17.5);
    const sounds=[...a.activeSounds].some(s=>s.weather==='thunder');PotatoQA.jump(10);
    const cleared=a.pendingThunder.length===0&&a.activeSounds.size===0&&a.rain.gain.value===0;await a.ctx.suspend();return waiting&&sounds&&cleared;
  })()`));
  await evaluate("PotatoQA.jump(252.16);const lightningSetting=document.getElementById('lightning');lightningSetting.checked=false;lightningSetting.dispatchEvent(new Event('change'))");
  check('Lightning setting disables flash but keeps the rain',await evaluate('!PotatoQA.state.flashes && !PotatoQA.world.storm.bolt.visible && PotatoQA.world.storm.light.intensity===0 && PotatoQA.world.storm.rain.visible'));
  await evaluate("document.getElementById('lightning').checked=true;document.getElementById('lightning').dispatchEvent(new Event('change'));PotatoQA.jump(290)");
  check('Rain ends and evening mosquitoes appear',await evaluate('!PotatoQA.world.storm.rain.visible && PotatoQA.world.airlife.mosquitoes.every(m=>m.root.visible)'));
  check('Movement scatters the mosquitoes',await evaluate('(()=>{const w=PotatoQA.world;w.render(290,20,false);const p=w.airlife.mosquitoes[0].root.position.clone();w.wiggle(20);w.render(290,20.2,false);return p.distanceTo(w.airlife.mosquitoes[0].root.position)>.5;})()'));
  await evaluate('PotatoQA.jump(30)');check('Bees visit flowers in dry weather',await evaluate('PotatoQA.world.airlife.bees.every(b=>b.root.visible) && PotatoQA.world.airlife.mosquitoes.every(m=>!m.root.visible)'));
  await evaluate('PotatoQA.pause(false);PotatoQA.jump(305)');await frames();check('Dusk brings cat and window light',await evaluate('PotatoQA.world.stats().cat && PotatoQA.world.stats().windowLight > 1'));
  await screenshot('04-evening');
  await evaluate('PotatoQA.jump(360)');await frames();check('Evening can continue after its ending',await evaluate('PotatoQA.state.started && !PotatoQA.state.paused'));
  await evaluate('PotatoQA.jump(200); PotatoQA.world.view.yaw=-.72; PotatoQA.world.view.pitch=-.025');await screenshot('08-left-details');
  await evaluate('PotatoQA.world.view.yaw=1.3; PotatoQA.world.view.pitch=.08');await screenshot('09-orchard');
  await evaluate('const direction=new THREE.Vector3(-5,1.3,12.1).sub(PotatoQA.world.camera.position).normalize(); PotatoQA.world.view.yaw=Math.atan2(direction.x,-direction.z); PotatoQA.world.view.pitch=Math.asin(direction.y)');await frames();await delay(300);await screenshot('10-swing');
  await evaluate("document.getElementById('observe').click()");check('New scenery can be observed with its own caption',await evaluate("document.getElementById('speaker').textContent === 'Качели' && document.getElementById('caption').classList.contains('visible')"));
  await evaluate('PotatoQA.world.view.yaw=-1.04; PotatoQA.world.view.pitch=.39; PotatoQA.world.view.fov=48');await screenshot('11-birches');
  await evaluate('PotatoQA.pause(true)');await screenshot('05-pause');
  // Close inspection of the models, with the world frozen. This does not change play controls.
  await evaluate("document.getElementById('pause-panel').classList.add('hidden'); for(const id of ['caption','notice','observe','hud','bottom-hud','crosshair'])document.getElementById(id).style.visibility='hidden'; PotatoQA.world.render(100,8.1,false); const butterfly=PotatoQA.world.nature.insects[0].b; PotatoQA.world.camera.position.copy(butterfly.position).add(new THREE.Vector3(.06,.16,.32)); PotatoQA.world.camera.lookAt(butterfly.position); PotatoQA.world.camera.fov=40; PotatoQA.world.camera.updateProjectionMatrix(); PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)");await screenshot('12-butterfly-detail');
  await evaluate('const dragon=PotatoQA.world.nature.insects[2].b; PotatoQA.world.camera.position.copy(dragon.position).add(new THREE.Vector3(.07,.16,.22)); PotatoQA.world.camera.lookAt(dragon.position); PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('13-dragonfly-detail');
  await evaluate("document.getElementById('visitor-hint').classList.add('hidden'); PotatoQA.world.reset();PotatoQA.world.render(60,15,false);const climbing=PotatoQA.world.visitors.models.beetle.root;PotatoQA.world.camera.position.copy(climbing.position).add(new THREE.Vector3(.25,.12,.6));PotatoQA.world.camera.lookAt(climbing.position);PotatoQA.world.camera.fov=40;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)");await screenshot('16-beetle-climbing');
  await evaluate('PotatoQA.world.render(68,15,false);const onLeaf=PotatoQA.world.visitors.models.beetle.root;PotatoQA.world.camera.position.copy(onLeaf.position).add(new THREE.Vector3(.3,.3,.55));PotatoQA.world.camera.lookAt(onLeaf.position);PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('17-beetle-on-leaf');
  await evaluate('PotatoQA.world.render(100,15,false);PotatoQA.world.camera.position.set(-1,6.8,1);PotatoQA.world.camera.lookAt(-2.7,8,-10.6);PotatoQA.world.camera.fov=36;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('18-chimney-smoke');
  await evaluate('PotatoQA.world.render(150,15,false);const granny=PotatoQA.world.grandmother;PotatoQA.world.camera.position.copy(granny.root.localToWorld(new THREE.Vector3(1.8,1.4,3.2)));PotatoQA.world.camera.lookAt(granny.root.localToWorld(new THREE.Vector3(0,.9,.1)));PotatoQA.world.camera.fov=36;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('19-grandmother-watering');
  await evaluate('const portrait=PotatoQA.world.grandmother;PotatoQA.world.camera.position.copy(portrait.root.localToWorld(new THREE.Vector3(.12,1.5,1.25)));PotatoQA.world.camera.lookAt(portrait.head.getWorldPosition(new THREE.Vector3()));PotatoQA.world.camera.fov=30;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('20-grandmother-portrait');
  await evaluate('PotatoQA.world.render(136,15,false);const walkingGranny=PotatoQA.world.grandmother;PotatoQA.world.camera.position.copy(walkingGranny.root.localToWorld(new THREE.Vector3(1.1,1.05,3.2)));PotatoQA.world.camera.lookAt(walkingGranny.root.localToWorld(new THREE.Vector3(0,.85,0)));PotatoQA.world.camera.fov=36;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('21-grandmother-walking');
  await evaluate('PotatoQA.world.render(100,15,false);PotatoQA.world.camera.position.set(10.2,1.85,2.8);PotatoQA.world.camera.lookAt(9,1.4,-3.7);PotatoQA.world.camera.fov=48;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('22-greenhouse-crops');
  await evaluate('PotatoQA.world.camera.position.set(9,1.5,-.7);PotatoQA.world.camera.lookAt(9,1.25,-4.6);PotatoQA.world.camera.fov=68;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('23-greenhouse-detail');
  await evaluate('PotatoQA.world.render(30,3,false);const bee=PotatoQA.world.airlife.bees[0].root;PotatoQA.world.camera.position.copy(bee.position).add(new THREE.Vector3(.07,.08,.13));PotatoQA.world.camera.lookAt(bee.position);PotatoQA.world.camera.fov=40;PotatoQA.world.camera.updateProjectionMatrix();PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('25-bee-detail');
  await evaluate('PotatoQA.world.render(290,15,false);const mosquito=PotatoQA.world.airlife.mosquitoes[0].root;PotatoQA.world.camera.position.copy(mosquito.position).add(new THREE.Vector3(.035,.04,.08));PotatoQA.world.camera.lookAt(mosquito.position);PotatoQA.world.renderer.render(PotatoQA.world.scene,PotatoQA.world.camera)');await screenshot('26-mosquito-detail');
  await evaluate("for(const id of ['caption','notice','observe','hud','bottom-hud','crosshair'])document.getElementById(id).style.visibility=''; document.getElementById('restart').click()");check('Restart resets time and resumes',await evaluate('PotatoQA.state.t < 1 && !PotatoQA.state.paused'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await frames();await screenshot('06-mobile');check('Small screen has no horizontal overflow',await evaluate('document.documentElement.scrollWidth <= innerWidth'));
  check('No external network requests',requests.every(u=>u.startsWith('file:')||u.startsWith('data:')));
  check('No browser runtime errors',errors.length===0);
  const stats=await evaluate('PotatoQA.world.stats()');await writeFile(path.join(qa,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks,stats,windReport,errors,externalRequests:requests.filter(u=>!u.startsWith('file:')&&!u.startsWith('data:'))},null,2));
  console.log(JSON.stringify({checks:checks.length,stats}));
}catch(e){await writeFile(path.join(qa,'failure.json'),JSON.stringify({error:e.stack,errors,browserLog},null,2));throw e;}
finally{if(ws?.readyState===1){try{await send('Browser.close');}catch{}ws.close();}if(child&&child.exitCode===null)child.kill();for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Browser closed'));}}

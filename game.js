(() => {
  'use strict';
  const $=id=>document.getElementById(id),world=window.SummerScene;
  if(!world){$('error').classList.remove('hidden');$('error-text').textContent=window.sceneError||'Не удалось открыть сцену. Проверьте наличие файлов игры.';return;}
  const audio=new SummerAudio();
  const state={started:false,paused:false,t:0,real:0,captions:true,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,noticeUntil:0,captionUntil:0,lastWiggle:-9,drag:false,focus:null,finished:false};
  state.flashes=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters=[{t:0,name:'Тихий двор'},{t:55,name:'Маленький гость'},{t:120,name:'Вечерний полив'},{t:220,name:'Пора домой'},{t:300,name:'Свет в окне'}];
  const events=[
    {t:4,note:'Июль. Кажется, всё на своих местах.'},
    {t:30,speaker:'Где-то за сараем',text:'Дед снова что-то чинит. Значит, всё в порядке.',duration:6},
    {t:56,note:'Жук поднимается по стеблю. Пошевелитесь — он отцепится.'},
    {t:121,note:'Знакомые шаги на дорожке.'},
    {t:140,speaker:'Бабушка',text:'Ну что, растёте? Сейчас попьём водички.',voice:'watering',duration:8},
    {t:166,note:'После полива земля пахнет совсем по-другому.'},
    {t:221,speaker:'Бабушка, с крыльца',text:'Миша! Домой иди, ужин готов! И руки помой!',voice:'dinner',duration:8},
    {t:232,speaker:'Миша, из-за забора',text:'Ба, ну ещё пять мину-у-ут!',duration:5},
    {t:244,note:'???????? ????. ?????? ??????.'},
    {t:280,note:'????? ??????. ??? ???????? ????? ????.'},
    {t:278,note:'Кажется, кот уже закончил все свои дела.'},
    {t:311,speaker:'Бабушка',text:'Хороший сегодня денёк был. Ну, до завтра.',voice:'goodnight',duration:8},
    {t:355,note:'И всё-таки хороший был день. Растём дальше.',duration:12},
  ];
  const seen=new Set();
  try{const saved=JSON.parse(localStorage.getItem('potato-summer-settings')||'null');if(saved){audio.volume=Math.max(0,Math.min(1,Number(saved.volume)||0));state.captions=saved.captions!==false;state.flashes=typeof saved.lightning==='boolean'?saved.lightning:state.flashes;state.motion=saved.motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}}catch{}
  $('volume').value=audio.volume*100;$('captions').checked=state.captions;$('motion').checked=state.motion;$('lightning').checked=state.flashes;
  const save=()=>{try{localStorage.setItem('potato-summer-settings',JSON.stringify({volume:audio.volume,captions:state.captions,motion:state.motion,lightning:state.flashes}));}catch{}};
  function notice(text,duration=6){$('notice').textContent=text;$('notice').classList.add('visible');state.noticeUntil=state.real+duration;}
  function caption(speaker,text,duration=7){$('speaker').textContent=speaker;$('caption-text').textContent=text;state.captionUntil=state.real+duration;$('caption').classList.toggle('visible',state.captions);}
  function closeMoments(){$('moments').classList.add('hidden');$('moments-toggle').setAttribute('aria-expanded','false');}
  function syncHud(){const chapter=[...chapters].reverse().find(c=>state.t>=c.t);$('chapter-name').textContent=chapter.name;const clock=18*60+10+Math.min(state.t/360,1)*170;$('time').textContent=String(Math.floor(clock/60)).padStart(2,'0')+':'+String(Math.floor(clock%60)).padStart(2,'0');$('progress').style.width=Math.min(100,state.t/3.6)+'%';$('progress-label').textContent=state.t>=360?'Можно ещё немного побыть':state.t>280?'В доме уже горит свет':state.t>160?'Лето никуда не спешит':'Вечер только начинается';}
  function setPause(value){if(!state.started||state.paused===value)return;state.paused=value;$('pause-panel').classList.toggle('hidden',!value);closeMoments();state.drag=false;if(value){audio.suspend();$('resume').focus();}else{audio.resume();$('world').focus({preventScroll:true});}}
  function start(){if(state.started)return;state.started=true;audio.start();audio.gain(audio.volume);$('intro').classList.add('leaving');setTimeout(()=>$('intro').classList.add('hidden'),1100);$('hud').classList.remove('hidden');$('bottom-hud').classList.remove('hidden');$('crosshair').classList.remove('hidden');$('world').focus({preventScroll:true});notice('Вы уже на месте. Можно просто побыть.',7);}
  function jump(t){state.t=Math.max(0,Math.min(360,t));state.finished=state.t>=360;seen.clear();events.forEach((e,i)=>{if(e.t<state.t)seen.add(i);});audio.stopVoice();audio.resetAmbience();audio.lastTime=361;state.captionUntil=0;$('caption').classList.remove('visible');world.reset();closeMoments();syncHud();notice(chapters.slice().reverse().find(c=>state.t>=c.t).name,4);world.render(state.t,state.real,state.motion,state.flashes);state.lastWiggle=-9;syncVisitor();}
  function wiggle(){if(!state.started||state.paused||state.real-state.lastWiggle<.45)return;state.lastWiggle=state.real;audio.wiggle();const response=world.wiggle(state.real);notice(response||'Листья дрогнули, земля чуть осыпалась.',4);}
  function syncVisitor(){
    const guest=world.visitors.info(),show=state.started&&guest.visible&&['approaching','eating','fleeing'].includes(guest.status);
    $('visitor-hint').classList.toggle('hidden',!show);
    const text=guest.name+(guest.status==='eating'?' пробует грызть!':guest.status==='fleeing'?' отступает.':guest.kind==='beetle'?' поднимается по стеблю.':' подбирается к картошке.');
    if($('visitor-text').textContent!==text)$('visitor-text').textContent=text;
    $('wiggle').classList.toggle('guest-near',show&&guest.status!=='fleeing');
  }
  function observe(){if(state.focus&&state.started&&!state.paused){caption(state.focus.name,state.focus.text,6);audio.rustle(.025,.2,900);}}
  $('start').disabled=false;$('start').innerHTML='Побыть картошкой <span>↗</span>';
  $('start').addEventListener('click',start);$('pause').addEventListener('click',()=>setPause(true));$('resume').addEventListener('click',()=>setPause(false));
  $('restart').addEventListener('click',()=>{jump(0);setPause(false);notice('И снова целый вечер впереди.',6);});
  $('sound').addEventListener('click',()=>{audio.mute(!audio.muted);$('sound').textContent=audio.muted?'♪̸':'♫';$('sound').setAttribute('aria-label',audio.muted?'Включить звук':'Выключить звук');$('sound').setAttribute('aria-pressed',String(audio.muted));});
  $('volume').addEventListener('input',e=>{audio.gain(Number(e.target.value)/100);save();});
  $('captions').addEventListener('change',e=>{state.captions=e.target.checked;$('caption').classList.toggle('visible',state.captions&&state.real<state.captionUntil);save();});
  $('motion').addEventListener('change',e=>{state.motion=e.target.checked;save();});
  $('lightning').addEventListener('change',e=>{state.flashes=e.target.checked;save();world.render(state.t,state.real,state.motion,state.flashes);});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notice('Полный экран можно включить клавишей F11.',5);}});
  $('wiggle').addEventListener('click',wiggle);$('observe').addEventListener('click',observe);
  $('bed-view').addEventListener('click',()=>{if(world.view.pitch<-.3){world.view.yaw=-.14;world.view.pitch=.08;world.view.fov=64;}else world.lookAtBed();$('world').focus({preventScroll:true});});
  $('visitor-look').addEventListener('click',()=>{world.lookAtVisitor();$('world').focus({preventScroll:true});});
  $('wiggle').addEventListener('click',()=>$('world').focus({preventScroll:true}));
  $('moments-toggle').addEventListener('click',()=>{const open=$('moments').classList.toggle('hidden')===false;$('moments-toggle').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.time))));
  const keys=new Set();
  document.addEventListener('keydown',e=>{
    if(e.code==='Escape'){if(!$('moments').classList.contains('hidden'))closeMoments();else setPause(!state.paused);return;}
    if(state.paused){if(e.key==='Tab'){const focusables=[...$('pause-panel').querySelectorAll('button,input')],first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
    if(!state.started)return;
    if(['INPUT','BUTTON'].includes(document.activeElement.tagName))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyE'].includes(e.code)){e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat)wiggle();if(e.code==='KeyE'&&!e.repeat)observe();}
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  const canvas=$('world');let lastX=0,lastY=0,downX=0,downY=0;
  canvas.addEventListener('pointerdown',e=>{if(!state.started||state.paused)return;closeMoments();state.drag=true;lastX=downX=e.clientX;lastY=downY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',e=>{if(!state.drag)return;world.view.yaw-=(e.clientX-lastX)*.004;world.view.pitch=Math.max(-.9,Math.min(1.08,world.view.pitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;});
  canvas.addEventListener('pointerup',e=>{if(state.drag&&Math.hypot(e.clientX-downX,e.clientY-downY)<5)observe();state.drag=false;});canvas.addEventListener('pointercancel',()=>state.drag=false);
  canvas.addEventListener('wheel',e=>{if(!state.started||state.paused)return;e.preventDefault();world.view.fov=Math.max(32,Math.min(72,world.view.fov+e.deltaY*.025));},{passive:false});
  window.addEventListener('blur',()=>{keys.clear();state.drag=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.started)setPause(true);});
  window.addEventListener('resize',()=>world.resize());
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPause(true);$('error').classList.remove('hidden');$('error-text').textContent='Браузер приостановил 3D-графику. Закройте тяжёлые вкладки и нажмите «Попробовать снова».';});
  let last=performance.now(),lastHud=0,lastFocus=0;
  function frame(now){const dt=Math.min(1,(now-last)/1000);last=now;
    if(!state.paused){state.real+=dt;if(state.started){state.t=Math.min(360,state.t+dt);if(keys.has('ArrowLeft'))world.view.yaw-=dt*.85;if(keys.has('ArrowRight'))world.view.yaw+=dt*.85;if(keys.has('ArrowUp'))world.view.pitch=Math.min(1.08,world.view.pitch+dt*.6);if(keys.has('ArrowDown'))world.view.pitch=Math.max(-.9,world.view.pitch-dt*.6);
      events.forEach((e,i)=>{if(!seen.has(i)&&state.t>=e.t){seen.add(i);if(e.note)notice(e.note,e.duration||6);if(e.text)caption(e.speaker,e.text,e.duration||7);if(e.voice)audio.speak(e.voice);}});audio.update(state.t,state.real);
      if(state.real>lastHud+.5){syncHud();syncVisitor();lastHud=state.real;}if(state.real>lastFocus+.15){state.focus=world.focus();$('observe').classList.toggle('hidden',!state.focus);if(state.focus)$('observe').innerHTML=state.focus.name+' <kbd>E</kbd>';lastFocus=state.real;}
    }
    if(state.real>state.noticeUntil)$('notice').classList.remove('visible');if(state.real>state.captionUntil)$('caption').classList.remove('visible');world.render(state.started?state.t:25,state.real,state.motion,state.flashes);
    }requestAnimationFrame(frame);
  }
  syncHud();requestAnimationFrame(frame);
  if(new URLSearchParams(location.search).has('qa'))window.PotatoQA={start,jump,pause:setPause,wiggle,observe,state,world,audio,events,seen};
})();

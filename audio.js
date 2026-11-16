/* Local recordings and synthesized details. Recording licenses: assets/CREDITS.md. */
(() => {
  class SummerAudio {
    constructor(){this.volume=.55;this.muted=false;this.ctx=null;this.nextBird=0;this.nextHammer=20;this.nextStep=0;this.nextCricket=0;this.voice=null;this.enabled=true;this.lastTime=0;this.samples={};this.activeSounds=new Set();this.sampleErrors=[];this.nextCuckoo=null;this.nextDog=null;}
    start(){
      if(this.ctx){this.ctx.resume().catch(()=>{});return;}
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){this.enabled=false;return;}
      this.ctx=new AudioContext();const c=this.ctx;
      this.master=c.createGain();this.master.gain.value=this.muted?0:this.volume;this.master.connect(c.destination);
      this.ambience=c.createGain();this.ambience.gain.value=1;this.ambience.connect(this.master);
      this.ready=Promise.all(Object.entries(window.SummerSamples||{}).map(async([name,encoded])=>{
        try{const bytes=Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));this.samples[name]=await c.decodeAudioData(bytes.buffer);}
        catch(error){this.sampleErrors.push(name+': '+error.message);}
      }));
      // Brown noise is only used for footsteps and watering, never as a constant background.
      this.buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate);const data=this.buffer.getChannelData(0);let brown=0;
      for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*3.5;}
      this.windBuffer=c.createBuffer(1,c.sampleRate*6,c.sampleRate);const air=this.windBuffer.getChannelData(0);
      for(let i=0;i<air.length;i++)air[i]=Math.random()*2-1;
      const breeze=c.createBufferSource();breeze.buffer=this.windBuffer;breeze.loop=true;
      const high=c.createBiquadFilter();high.type='highpass';high.frequency.value=750;high.Q.value=.7;
      const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=4200;low.Q.value=.7;
      this.wind=c.createGain();this.wind.gain.value=0;
      breeze.connect(high).connect(low).connect(this.wind).connect(this.ambience);breeze.start();
      const shower=c.createBufferSource();shower.buffer=this.windBuffer;shower.loop=true;shower.playbackRate.value=.91;
      const rainHigh=c.createBiquadFilter();rainHigh.type='highpass';rainHigh.frequency.value=650;
      const rainLow=c.createBiquadFilter();rainLow.type='lowpass';rainLow.frequency.value=6500;
      this.rain=c.createGain();this.rain.gain.value=0;shower.connect(rainHigh).connect(rainLow).connect(this.rain).connect(this.ambience);shower.start();
      this.pendingThunder=[];this.lastStormTime=null;
      const water=c.createBufferSource();water.buffer=this.buffer;water.loop=true;water.playbackRate.value=2;const wf=c.createBiquadFilter();wf.type='highpass';wf.frequency.value=450;this.water=c.createGain();this.water.gain.value=0;water.connect(wf).connect(this.water).connect(this.master);water.start();
      this.ctx.resume().catch(()=>{});
    }
    gain(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:value,this.ctx.currentTime,.08);if(this.voice)this.voice.volume=this.muted?0:value*.9;}
    mute(value){this.muted=value;this.gain(this.volume);}
    suspend(){if(this.ctx)this.ctx.suspend().catch(()=>{});if(this.voice&&!this.voice.paused){this.voice.pause();this.resumeVoice=true;}}
    resume(){if(this.ctx)this.ctx.resume().catch(()=>{});if(this.voice&&this.resumeVoice){this.voice.play().catch(()=>{});this.resumeVoice=false;}}
    stopVoice(){if(this.voice){this.voice.pause();this.voice.currentTime=0;}this.voice=null;this.resumeVoice=false;}
    resetAmbience(){for(const source of this.activeSounds)source.stop();this.activeSounds.clear();this.nextCuckoo=null;this.nextDog=null;this.pendingThunder=[];this.lastStormTime=null;if(this.rain)this.rain.gain.setValueAtTime(0,this.ctx.currentTime);}
    thunder(){
      if(!this.ctx||this.muted)return;const c=this.ctx,source=c.createBufferSource(),high=c.createBiquadFilter(),low=c.createBiquadFilter(),gain=c.createGain(),pan=c.createStereoPanner(),at=c.currentTime;
      source.buffer=this.buffer;source.loop=true;source.playbackRate.value=.65;source.weather='thunder';
      high.type='highpass';high.frequency.value=45;low.type='lowpass';low.frequency.value=850;pan.pan.value=-.45;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.34,at+.12);gain.gain.exponentialRampToValueAtTime(.19,at+.8);gain.gain.exponentialRampToValueAtTime(.07,at+2.6);gain.gain.exponentialRampToValueAtTime(.0001,at+5);
      source.connect(high).connect(low).connect(gain).connect(pan).connect(this.ambience);this.activeSounds.add(source);
      source.onended=()=>{this.activeSounds.delete(source);source.disconnect();high.disconnect();low.disconnect();gain.disconnect();pan.disconnect();};source.start();source.stop(at+5.1);
    }
    playAmbient(name,pan=0){
      if(!this.ctx||!this.samples[name]||this.ctx.state!=='running'||this.muted)return false;
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.samples[name];gain.gain.value=name==='dog'?.65:.85;
      const position=this.ctx.createStereoPanner();position.pan.value=pan;
      source.connect(gain).connect(position).connect(this.ambience);this.activeSounds.add(source);
      source.onended=()=>{this.activeSounds.delete(source);source.disconnect();gain.disconnect();position.disconnect();};source.start();return true;
    }
    speak(file){this.stopVoice();if(this.muted)return;this.voice=new Audio('assets/'+file+'.wav');this.voice.volume=this.volume*.9;this.voice.play().catch(()=>{});}
    tone(frequency,end,duration,volume,delay=0,type='sine',pan=0){if(!this.ctx)return;const c=this.ctx,at=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,at);o.frequency.exponentialRampToValueAtTime(end,at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.015);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;g.connect(p).connect(this.master);}else g.connect(this.master);o.start(at);o.stop(at+duration+.02);}
    rustle(volume=.07,duration=.25,frequency=800){if(!this.ctx)return;const c=this.ctx,at=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.buffer;s.playbackRate.value=1.7;f.type='bandpass';f.frequency.value=frequency;f.Q.value=.5;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+duration);s.connect(f).connect(g).connect(this.master);s.start(at,Math.random()*2);s.stop(at+duration+.02);}
    wiggle(){this.rustle(.3,.45,600);}
    update(t,real=t){
      if(!this.ctx||this.ctx.state!=='running')return;const at=this.ctx.currentTime;
      if(t<this.lastTime){this.nextBird=t+2;this.nextHammer=t+12;this.nextStep=t;this.nextCricket=t+2;this.pendingThunder=[];this.lastStormTime=null;}this.lastTime=t;
      const speaking=this.voice&&!this.voice.paused&&!this.voice.ended;
      const weather=SummerWeather.at(t);this.rain.gain.setValueAtTime(weather.rain*.12,at);
      if(this.lastStormTime!==null&&t>=this.lastStormTime){for(const strike of SummerWeather.strikes)if(this.lastStormTime<strike.at&&t>=strike.at)this.pendingThunder.push(strike.at+strike.delay);}
      this.lastStormTime=t;this.pendingThunder=this.pendingThunder.filter(due=>{if(t>=due){this.thunder();return false;}return true;});
      this.ambience.gain.setTargetAtTime(speaking?.3:1,at,.25);
      // The same envelope moves the leaves. Exactly silent between gusts; no low drone.
      this.windStrength=SummerWeather.windAt(real);
      this.wind.gain.setValueAtTime(this.windStrength*.065,at);
      if(this.nextCuckoo===null)this.nextCuckoo=real+12;
      if(this.nextDog===null)this.nextDog=real+29;
      if(real>=this.nextCuckoo&&!speaking){
        if(t<295&&weather.rain<.08)this.playAmbient('cuckoo',-.6);
        this.nextCuckoo=real+48+Math.random()*22;this.nextBird=Math.max(this.nextBird,t+9);
      }
      if(real>=this.nextDog&&!speaking){this.playAmbient('dog',.7);this.nextDog=real+72+Math.random()*35;}
      this.water.gain.setTargetAtTime(t>=141&&t<163?.68:0,at,.3);
      if(t>=this.nextBird&&t<300&&!speaking&&weather.rain<.08){this.nextBird=t+13+Math.random()*13;const f=2100+Math.random()*900,pan=Math.random()*1.6-.8;this.tone(f,f*1.32,.13,.018,0,'sine',pan);this.tone(f*1.25,f*.9,.18,.015,.19,'sine',pan);if(Math.random()>.4)this.tone(f,f*1.2,.12,.012,.48,'sine',pan);}
      if(t>=this.nextHammer&&t<110){this.nextHammer=t+18+Math.random()*9;this.tone(530,200,.09,.025,0,'triangle',.7);this.tone(530,200,.09,.022,.7,'triangle',.7);}
      const walking=(t>=120&&t<140)||(t>=164&&t<192);
      if(walking&&t>=this.nextStep){this.nextStep=t+.53;this.rustle(.27,.12,280);}
      if(t>245&&t>=this.nextCricket){this.nextCricket=t+2.5+Math.random()*3;for(let i=0;i<3;i++)this.tone(4300,4400,.055,.012,i*.13,'sine',-.5);}
    }
  }
  window.SummerAudio=SummerAudio;
})();

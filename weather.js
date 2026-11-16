/* One shared gust envelope for rustling leaves, grass, cloth and sound. */
window.SummerWeather = {
  strikes:[{at:252,delay:2.4},{at:265,delay:3.1}],
  at(t){
    const smooth=(a,b,x)=>{const k=Math.max(0,Math.min(1,(x-a)/(b-a)));return k*k*(3-2*k);};
    const cloud=smooth(238,246,t)*(1-smooth(274,287,t));
    const rain=smooth(244,250,t)*(1-smooth(270,278,t));
    let flash=0;for(const strike of this.strikes){const age=t-strike.at;if(age>=0&&age<.32)flash=Math.max(flash,Math.sin(age/.32*Math.PI)**2);}
    return {cloud,rain,flash,wet:smooth(244,269,t)*Math.exp(-Math.max(0,t-278)/500)};
  },
  // A barely audible breeze keeps vegetation alive between the stronger gusts.
  motionAt(seconds){return .2+.035*Math.sin(seconds*.43)+this.windAt(seconds);},
  windAt(seconds) {
    const cycle=Math.floor(seconds/43), phase=seconds-cycle*43;
    if(phase<7||phase>23)return 0;
    const envelope=Math.sin((phase-7)/16*Math.PI)**2;
    return envelope*(.64+.12*Math.sin(cycle*2.37))*(.9+.1*Math.sin(seconds*1.3));
  }
};

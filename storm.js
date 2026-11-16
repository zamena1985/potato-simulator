/* Deterministic rain, small ground splashes and distant lightning. */
window.SummerStorm={
  create(T,scene){
    let seed=1972;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const count=1700,positions=new Float32Array(count*6),seeds=[];
    function roof(x,z){if(x>-9.3&&x<-1.2&&z>-13&&z<-6.3)return 5.8;if(x>7.05&&x<10.95&&z>-6.45&&z<-1)return 3.2;if(x>6.3&&x<10.8&&z>-13&&z<-9)return 2.9;return .15;}
    for(let i=0;i<count;i++){const x=random()*36-18,z=random()*31-18;seeds.push({x,z,phase:random(),speed:7+random()*4,floor:roof(x,z)});}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
    const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#c6d6df',transparent:true,opacity:0,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
    const splashPositions=new Float32Array(80*8*6),splashGeo=new T.BufferGeometry(),spots=[];
    for(let i=0;i<80;i++){const x=random()*17-8,z=random()*14-3;spots.push({x,z,phase:random(),y:roof(x,z)>.2?-2:.17});}
    splashGeo.setAttribute('position',new T.BufferAttribute(splashPositions,3));const splashes=new T.LineSegments(splashGeo,new T.LineBasicMaterial({color:'#b1c4c8',transparent:true,opacity:0,depthWrite:false}));splashes.frustumCulled=false;scene.add(splashes);
    const vertices=[],main=[[-14,19,-29],[-13,16,-29],[-14.8,13.5,-29],[-13.9,11.7,-29],[-16,8.7,-29],[-15.3,6,-29],[-17,2,-29]];
    for(let i=1;i<main.length;i++)vertices.push(...main[i-1],...main[i]);vertices.push(...main[2],-17,11,-29,-17,11,-29,-18,7.5,-29,...main[4],-13.9,7,-29,-13.9,7,-29,-13,5,-29);
    const boltGeo=new T.BufferGeometry();boltGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const bolt=new T.LineSegments(boltGeo,new T.LineBasicMaterial({color:'#eef3ff',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));scene.add(bolt);
    const light=new T.DirectionalLight('#d9e6ff',0);light.position.set(-14,20,-29);scene.add(light);
    let state={rain:0,cloud:0,flash:0,wet:0};
    function update(t,real,flashes=true){
      state=SummerWeather.at(t);rain.visible=state.rain>.001;splashes.visible=rain.visible;
      rain.material.opacity=state.rain*.5;splashes.material.opacity=state.rain*.25;
      const drift=.12+SummerWeather.motionAt(real)*.1;
      if(rain.visible)for(let i=0;i<count;i++){const s=seeds[i],height=12-s.floor,y=s.floor+(1-((real*s.speed/height+s.phase)%1))*height,x=s.x+(12-y)*drift,j=i*6;positions.set([x,y,s.z,x+.045,y-.27,s.z+.015],j);}geometry.attributes.position.needsUpdate=rain.visible;
      if(splashes.visible)for(let i=0;i<spots.length;i++){const s=spots[i],phase=(real*1.8+s.phase)%1,r=.018+phase*.09;for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4;splashPositions.set([s.x+Math.cos(a)*r,s.y+(1-phase)*.018,s.z+Math.sin(a)*r,s.x+Math.cos(b)*r,s.y+(1-phase)*.018,s.z+Math.sin(b)*r],(i*8+j)*6);}}splashGeo.attributes.position.needsUpdate=splashes.visible;
      const flash=flashes?state.flash:0;bolt.visible=flash>.03;bolt.material.opacity=flash;light.intensity=flash*.9;
      return {...state,flash};
    }
    return {rain,splashes,bolt,light,update,get state(){return state;}};
  }
};

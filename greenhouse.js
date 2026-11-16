/* Two recognisable kitchen-garden crops: compound tomato leaves and cucumber vines. */
window.SummerGreenhouse={
  plant({T,parent,M,material,mesh,box,rod,group}){
    let seed=7821;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const stem=material('#49733d',{flatShading:false}),tomatoLeaf=material('#426d38',{flatShading:false,side:T.DoubleSide}),cucumberLeaf=material('#548442',{flatShading:false,side:T.DoubleSide});
    const red=material('#b83f27',{flatShading:false,roughness:.67}),orange=material('#c57c35',{flatShading:false,roughness:.7}),unripe=material('#78924c',{flatShading:false,roughness:.8});
    const string=material('#b3ad87'),flower=material('#e6c34d',{flatShading:false,side:T.DoubleSide});
    const skin=document.createElement('canvas');skin.width=skin.height=128;const c=skin.getContext('2d');c.fillStyle='#5c8b42';c.fillRect(0,0,128,128);
    for(let i=0;i<14;i++){c.fillStyle=i%2?'#466e3d':'#74994a';c.globalAlpha=.3;c.fillRect(i*10,0,3,128);}c.globalAlpha=1;
    for(let i=0;i<650;i++){c.fillStyle=i%3?'#a4b16b88':'#304d2d88';c.beginPath();c.arc(random()*128,random()*128,.3+random()*.65,0,7);c.fill();}
    const skinMap=new T.CanvasTexture(skin);skinMap.encoding=T.sRGBEncoding;
    const cucumber=material('#8eaa66',{map:skinMap,bumpMap:skinMap,bumpScale:.0007,flatShading:false,roughness:.83});
    function leafGeometry(wide){
      const pts=wide?[[-.08,-.4],[-.55,-.29],[-.88,.02],[-.7,.34],[-.43,.46],[0,1],[.43,.46],[.7,.34],[.88,.02],[.55,-.29],[.08,-.4]]:[[-.14,-.8],[-.32,-.58],[-.24,-.4],[-.47,-.18],[-.32,.02],[-.44,.2],[-.25,.47],[0,.91],[.25,.47],[.44,.2],[.32,.02],[.47,-.18],[.24,-.4],[.32,-.58],[.14,-.8]];
      const p=[0,.07,0],uv=[.5,.5],index=[];for(const [x,z] of pts){p.push(x,Math.sin(z*2)*.08,z);uv.push(x*.5+.5,z*.5+.5);}for(let i=0;i<pts.length;i++)index.push(0,i+1,(i+1)%pts.length+1);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
    }
    const tomatoGeo=leafGeometry(false),cucumberGeo=leafGeometry(true),fruitGeo=new T.SphereGeometry(1,20,16);
    // Visible veins on broad leaves, without using solid green spheres.
    function leaf(mat,geo,p,size,angle,g){const l=mesh(geo,mat,p[0],p[1],p[2],size,size,size,g);l.rotation.set(-.15-random()*.25,angle,(random()-.5)*.3);return l;}
    const cucumberGeoFruit=new T.SphereGeometry(1,18,24),p=cucumberGeoFruit.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),ridge=1+.035*Math.cos(a*10);p.setXYZ(i,p.getX(i)*.038*ridge+.014*y*y,y*.145,p.getZ(i)*.038*ridge);}cucumberGeoFruit.computeVertexNormals();
    const tomatoCount=6,cucumberCount=6;
    for(const x of [-1.08,1.08]){
      box(M.dirt,x,.285,0,1.08,.04,5.05,parent);
      for(const side of [-1,1])box(M.wood,x+side*.55,.31,0,.055,.18,5.1,parent);
      rod(string,[x,2.38,-2.45],[x,2.38,2.45],.007,parent);
    }
    for(let i=0;i<tomatoCount;i++){
      const g=group(-1.08,.31,-2.05+i*.82,parent),h=1.35+random()*.25;
      rod(M.woodLight,[.04,0,-.04],[.04,h+.2,-.04],.013,g);
      const shoot=[];for(let j=0;j<=7;j++)shoot.push(new T.Vector3(Math.sin(j*.85+i)*.035,j*h/7,Math.sin(j*.6)*.025));
      const curve=new T.CatmullRomCurve3(shoot);mesh(new T.TubeGeometry(curve,28,.012,7,false),stem,0,0,0,1,1,1,g);
      for(let j=0;j<5;j++){
        const y=.3+j*.23,a=j*2.4+i*.7,tip=[Math.cos(a)*.34,y+.065,Math.sin(a)*.34];rod(stem,[0,y,0],tip,.005,g);
        leaf(tomatoLeaf,tomatoGeo,tip,.14,a+Math.PI/2,g);
        for(const side of [-1,1])for(let k=1;k<=2;k++){const s=k/3;leaf(tomatoLeaf,tomatoGeo,[tip[0]*s+Math.sin(a)*side*.065,y+.065*s,tip[2]*s-Math.cos(a)*side*.065],.095,a+side*.8,g);}
      }
      for(let cluster=0;cluster<3;cluster++){
        const y=.48+cluster*.31,a=cluster*2.1+i*.4,center=[Math.cos(a)*.19,y,Math.sin(a)*.19];rod(stem,[0,y+.12,0],center,.004,g);
        for(let j=0;j<3;j++){
          const x=center[0]+(j-1)*.078,z=center[2]+Math.sin(j*2)*.035,fy=y-j*.045,r=.052+random()*.018;
          rod(stem,center,[x,fy+.055,z],.0025,g);mesh(fruitGeo,cluster===2&&j===2?unripe:j===0&&i%2?orange:red,x,fy,z,r,r*.91,r, g);
          for(let k=0;k<5;k++){const b=k*Math.PI*2/5;rod(stem,[x,fy+r*.88,z],[x+Math.cos(b)*r*.62,fy+r*.93,z+Math.sin(b)*r*.62],.002,g);}
        }
      }
      for(const y of [.6,1.1]){const tie=mesh(new T.TorusGeometry(.035,.003,4,12),string,0,y,0,1,1,1,g);tie.rotation.x=Math.PI/2;}
    }
    for(let i=0;i<cucumberCount;i++){
      const g=group(1.08,.31,-2.05+i*.82,parent);
      rod(string,[0,0,0],[0,2.07,0],.003,g);
      const points=[];for(let j=0;j<=24;j++){const y=j/24*1.94;points.push(new T.Vector3(Math.sin(j*.65+i)*.035,y,Math.cos(j*.65+i)*.035));}
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),60,.008,6,false),stem,0,0,0,1,1,1,g);
      for(let j=0;j<6;j++){
        const y=.28+j*.28,a=j*2.4+i*.8,tip=[Math.cos(a)*.25,y+.04,Math.sin(a)*.25];rod(stem,[0,y,0],tip,.004,g);
        leaf(cucumberLeaf,cucumberGeo,tip,.19+random()*.035,a+Math.PI/2,g);
        if(j%2===0){const curl=[];for(let k=0;k<=24;k++){const t=k/24;curl.push(new T.Vector3(Math.cos(a)*(.04+t*.11)+Math.sin(t*15)*.012,y+t*.085,Math.sin(a)*(.04+t*.11)+Math.cos(t*15)*.012));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(curl),24,.0015,4,false),stem,0,0,0,1,1,1,g);}
      }
      for(let j=0;j<4;j++){
        const y=.55+j*.33,a=j*2.2+i*.7,x=Math.cos(a)*.13,z=Math.sin(a)*.13;
        rod(stem,[0,y+.15,0],[x,y+.12,z],.003,g);const fruit=mesh(cucumberGeoFruit,cucumber,x,y-.025,z,1,1+random()*.12,1,g);fruit.rotation.z=(random()-.5)*.3;
        for(let k=0;k<5;k++){const b=k*1.257;const petal=mesh(fruitGeo,flower,x+Math.cos(b)*.013,y-.18,z+Math.sin(b)*.013,.012,.003,.007,g);petal.rotation.y=-b;}
      }
    }
    return {tomatoCount,cucumberCount};
  }
};

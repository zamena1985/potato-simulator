/* A locally built character with articulated limbs and two-handed watering. */
window.SummerGrandma={
  create({T,scene,material,batch}){
    const root=new T.Group();scene.add(root);root.visible=false;
    let seed=937;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const smooth=(a,b,t)=>{const k=Math.max(0,Math.min(1,(t-a)/(b-a)));return k*k*(3-2*k);};
    const mix=(a,b,k)=>a+(b-a)*k;
    function fabric(base,flower){
      const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.fillStyle=base;p.fillRect(0,0,256,256);
      for(let i=0;i<256;i+=2){p.fillStyle=i%4?'#ffffff09':'#00000009';p.fillRect(i,0,1,256);p.fillRect(0,i,256,1);}
      if(flower)for(let i=0;i<55;i++){const x=random()*256,y=random()*256,r=1.5+random()*1.2;p.fillStyle=flower;for(let j=0;j<5;j++){p.beginPath();p.ellipse(x+Math.cos(j*1.257)*r,y+Math.sin(j*1.257)*r,r*.7,r*.6,0,0,7);p.fill();}p.fillStyle='#ddd4aa';p.fillRect(x-.5,y-.5,1,1);}
      const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
    }
    const skin=material('#c5a18b',{flatShading:false,roughness:.92}),warmSkin=material('#bd9580',{flatShading:false}),crease=material('#997c6b',{flatShading:false});
    const dress=material('#c5ced1',{map:fabric('#586d7a','#adb7ae'),flatShading:false,side:T.DoubleSide});
    const scarf=material('#e4d4cb',{map:fabric('#9d7974','#d7c9b1'),flatShading:false,side:T.DoubleSide});
    const apronMat=material('#e5dfc8',{map:fabric('#d0c9ac'),flatShading:false,side:T.DoubleSide});
    const shoe=material('#4c473e',{flatShading:false,roughness:.85}),sole=material('#34362e',{flatShading:false});
    const hair=material('#a6a396',{flatShading:false}),eyeWhite=material('#c8c4b3',{flatShading:false}),eyeDark=material('#403b30',{flatShading:false}),lip=material('#9f786b',{flatShading:false});
    const metal=material('#667a73',{flatShading:false,roughness:.52,metalness:.35}),rim=material('#90978a',{flatShading:false,roughness:.45,metalness:.45});
    const sphere=new T.SphereGeometry(1,24,18),cylinder=new T.CylinderGeometry(1,1,1,12);
    const v=(x,y,z)=>new T.Vector3(x,y,z);
    function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
    function mesh(parent,geo,mat){const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
    function oval(parent,mat,x,y,z,sx,sy,sz){const m=mesh(parent,sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
    function tube(parent,mat,points,r=.003){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?v(...p):p)),Math.max(8,points.length*5),r,6,false),mat);}
    function segment(parent,mat,a,b,r1,r2){const m=mesh(parent,new T.CylinderGeometry(r1,r2,1,16),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(v(0,1,0),a.clone().sub(b).normalize());return m;}
    const torso=group(root,0,.91,0),clothes=group(torso);
    oval(clothes,dress,0,.19,0,.235,.285,.155);
    oval(clothes,skin,0,.43,.035,.058,.085,.057);
    // A shaped skirt with fine folds and a softly irregular hem.
    const skPos=[],skUV=[],skIndex=[];
    for(let i=0;i<=18;i++)for(let j=0;j<=64;j++){
      const k=i/18,a=j/64*Math.PI*2,r=mix(.205,.315,k)+Math.sin(a*14+.4)*.012*k;
      skPos.push(Math.sin(a)*r,.06-k*.66+Math.cos(a*14)*.006*k,Math.cos(a)*r*.86);
      skUV.push(j/64,k);
      if(i<18&&j<64){const n=i*65+j;skIndex.push(n,n+65,n+1,n+1,n+65,n+66);}
    }
    const skirtGeo=new T.BufferGeometry();skirtGeo.setAttribute('position',new T.Float32BufferAttribute(skPos,3));skirtGeo.setAttribute('uv',new T.Float32BufferAttribute(skUV,2));skirtGeo.setIndex(skIndex);skirtGeo.computeVertexNormals();const skirt=mesh(clothes,skirtGeo,dress);
    function apronPanel(){const p=[],uv=[],index=[];for(let i=0;i<=22;i++)for(let j=0;j<=18;j++){
      const k=i/22,x=j/18*2-1,width=k<.3?mix(.105,.19,k/.3):mix(.19,.265,(k-.3)/.7),xx=x*width,y=.36-k*.91;
      const torsoSurface=.155*Math.sqrt(Math.max(0,1-(xx/.235)**2-((y-.19)/.285)**2));
      const r=mix(.205,.315,Math.max(0,Math.min(1,(.06-y)/.66))),skirtSurface=y<.09?r*.86*Math.sqrt(Math.max(0,1-(xx/r)**2)):0;
      p.push(xx,y,Math.max(torsoSurface,skirtSurface)+.017+Math.cos(x*8+k)*.003);uv.push(j/18,k);if(i<22&&j<18){const n=i*19+j;index.push(n,n+19,n+1,n+1,n+19,n+20);}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return mesh(clothes,g,apronMat);}
    apronPanel();
    for(const side of [-1,1])tube(clothes,apronMat,[[side*.1,.36,.156],[side*.12,.43,.1],[side*.15,.44,-.025]],.012);
    tube(clothes,apronMat,[[-.21,.02,0],[-.19,.025,.105],[0,.025,.207],[.19,.025,.105],[.21,.02,0]],.011);
    // Pocket edge and a few tiny fastenings make the clothing read at garden distance.
    const pocket=oval(clothes,apronMat,.12,-.24,.19,.055,.065,.009);
    tube(clothes,crease,[[.073,-.18,.199],[.12,-.182,.199],[.167,-.18,.193]],.001);
    for(let i=0;i<3;i++)oval(clothes,sole,0,.31-i*.065,.164,.005,.005,.003);
    batch(clothes);
    const head=group(torso,0,.58,.035),face=group(head);
    const faceGeo=new T.SphereGeometry(1,48,36),facePos=faceGeo.attributes.position;
    for(let i=0;i<facePos.count;i++){const x=facePos.getX(i),y=facePos.getY(i),z=facePos.getZ(i),jaw=1-.12*smooth(.2,1,-y),cheek=Math.exp(-(((y+.12)/.28)**2))*.004;facePos.setXYZ(i,x*.112*jaw,y*.15,z*(.098+cheek));}faceGeo.computeVertexNormals();mesh(face,faceGeo,skin);
    for(const side of [-1,1]){
      oval(face,skin,side*.109,-.015,0,.017,.032,.017);
      oval(face,eyeWhite,side*.043,.022,.092,.021,.0065,.008);
      oval(face,eyeDark,side*.043,.021,.099,.005,.005,.0025);
      tube(face,crease,[[side*.023,.027,.095],[side*.043,.031,.102],[side*.063,.026,.091]],.0017);
      tube(face,crease,[[side*.025,.012,.092],[side*.044,.009,.096],[side*.065,.013,.086]],.0009);
      tube(face,hair,[[side*.023,.047,.092],[side*.044,.052,.087],[side*.067,.045,.077]],.002);
      for(let i=0;i<2;i++)tube(face,crease,[[side*.065,.019-i*.009,.087],[side*.081,.016-i*.008,.074]],.0007);
      tube(face,crease,[[side*.023,-.026,.095],[side*.032,-.047,.087],[side*.034,-.066,.075]],.0008);
    }
    oval(face,skin,0,.003,.096,.012,.027,.017);oval(face,warmSkin,0,-.021,.112,.017,.012,.016);
    tube(face,lip,[[-.026,-.065,.078],[0,-.069,.092],[.026,-.065,.078]],.002);
    for(let i=0;i<2;i++)tube(face,crease,[[-.045,.073+i*.012,.073],[0,.078+i*.012,.083],[.045,.073+i*.012,.073]],.00065);
    // Thin, small spectacles; the face remains visible through the open lenses.
    for(const side of [-1,1]){const points=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;points.push(v(side*.043+Math.cos(a)*.03,.021+Math.sin(a)*.019,.107));}tube(face,rim,points,.0014);tube(face,rim,[[side*.073,.023,.105],[side*.108,.023,.025]],.0014);}
    tube(face,rim,[[-.012,.026,.108],[0,.033,.116],[.012,.026,.108]],.0014);
    oval(face,hair,0,.122,.014,.099,.026,.08);
    for(let i=0;i<13;i++){const x=(i-6)*.013;const front=.014+.08*Math.sqrt(Math.max(.1,1-(x/.1)**2));tube(face,crease,[[x-.008,.119,front],[x,.13,front-.004],[x+.009,.137,front-.012]],.00065);}
    batch(face);
    // A fitted scarf open at the face, with a knot and two cloth tails.
    const hp=[],huv=[],hi=[];
    for(let i=0;i<=20;i++)for(let j=0;j<=40;j++){const theta=i/20*Math.PI*.87,phi=.72+j/40*(Math.PI*2-1.44);hp.push(Math.sin(phi)*Math.sin(theta)*.13,Math.cos(theta)*.165+.009,Math.cos(phi)*Math.sin(theta)*.118-.01);huv.push(j/40,i/20);if(i<20&&j<40){const n=i*41+j;hi.push(n,n+1,n+41,n+1,n+42,n+41);}}
    const hoodGeo=new T.BufferGeometry();hoodGeo.setAttribute('position',new T.Float32BufferAttribute(hp,3));hoodGeo.setAttribute('uv',new T.Float32BufferAttribute(huv,2));hoodGeo.setIndex(hi);hoodGeo.computeVertexNormals();mesh(head,hoodGeo,scarf);
    const capP=[],capUV=[],capI=[];for(let i=0;i<=10;i++)for(let j=0;j<=16;j++){const theta=i/10*.8,phi=-.72+j/16*1.44;capP.push(Math.sin(phi)*Math.sin(theta)*.13,Math.cos(theta)*.165+.009,Math.cos(phi)*Math.sin(theta)*.118-.01);capUV.push(j/16,i/10);if(i<10&&j<16){const n=i*17+j;capI.push(n,n+1,n+17,n+1,n+18,n+17);}}const capGeo=new T.BufferGeometry();capGeo.setAttribute('position',new T.Float32BufferAttribute(capP,3));capGeo.setAttribute('uv',new T.Float32BufferAttribute(capUV,2));capGeo.setIndex(capI);capGeo.computeVertexNormals();mesh(head,capGeo,scarf);
    for(const side of [-1,1]){tube(head,scarf,[[side*.078,-.01,.082],[side*.074,-.098,.075],[side*.018,-.15,.084]],.013);oval(head,scarf,side*.078,-.01,.082,.013,.013,.013);}
    oval(head,scarf,0,-.153,.086,.026,.021,.019);
    for(const side of [-1,1]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([side*.012,-.15,.08,side*.075,-.225,.055,side*.045,-.275,.08,side*.007,-.19,.1],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,3,1,2,3]);g.computeVertexNormals();mesh(head,g,scarf);}
    batch(head);
    function limb(side,upperMat,lowerMat,lengths,radii){const g=group(root),upper=mesh(g,new T.CylinderGeometry(radii[0],radii[1],1,16),upperMat),lower=mesh(g,new T.CylinderGeometry(radii[1],radii[2],1,16),lowerMat);const shoulder=oval(g,upperMat,0,0,0,radii[0],radii[0],radii[0]),joint=oval(g,lowerMat,0,0,0,radii[1],radii[1],radii[1]);return {g,side,upper,lower,shoulder,joint,lengths};}
    function placeBone(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(v(0,1,0),a.clone().sub(b).normalize());}
    function solve(l,start,end,bend){const delta=end.clone().sub(start),distance=Math.min(delta.length(),l.lengths[0]+l.lengths[1]-.001),dir=delta.normalize();const along=(l.lengths[0]**2-l.lengths[1]**2+distance**2)/(2*distance);const height=Math.sqrt(Math.max(0,l.lengths[0]**2-along**2));const outward=bend.clone().addScaledVector(dir,-bend.dot(dir)).normalize();const elbow=start.clone().addScaledVector(dir,along).addScaledVector(outward,height);placeBone(l.upper,start,elbow);placeBone(l.lower,elbow,end);l.shoulder.position.copy(start);l.joint.position.copy(elbow);return elbow;}
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const l=limb(side,dress,shoe,[.37,.36],[.075,.052,.044]);const foot=group(root,side*.115,.07,0);oval(foot,sole,0,-.024,.047,.067,.026,.128);oval(foot,shoe,0,.01,.045,.064,.045,.116);oval(foot,shoe,0,.05,-.015,.052,.073,.06);batch(foot);l.foot=foot;legs.push(l);
      const a=limb(side,dress,skin,[.255,.25],[.078,.058,.031]);const hand=group(root);oval(hand,skin,0,0,0,.034,.047,.018);for(let i=0;i<4;i++)oval(hand,skin,-.023+i*.015,-.048,.006,.007,.025-i*.002,.008);oval(hand,skin,side*.031,-.01,.014,.011,.027,.011);batch(hand);a.hand=hand;arms.push(a);
    }
    const can=group(root),canBody=group(can);
    const body=mesh(canBody,new T.CylinderGeometry(.15,.135,.25,32),metal);body.position.y=-.075;
    const top=mesh(canBody,new T.TorusGeometry(.147,.006,6,36),rim);top.rotation.x=Math.PI/2;top.position.y=.052;
    oval(canBody,sole,0,.055,0,.105,.002,.105);
    tube(canBody,rim,[[.09,.03,0],[.09,.23,0],[0,.285,0],[-.09,.23,0],[-.09,.03,0]],.009);
    tube(canBody,metal,[[0,-.1,.1],[0,-.04,.28],[0,.08,.49],[0,.09,.55]],.023);
    const rose=group(canBody,0,.09,.55);rose.rotation.x=Math.PI/2;const disc=mesh(rose,new T.CylinderGeometry(.057,.035,.035,24),rim);for(let i=0;i<13;i++){const a=i*2.4,r=.008+Math.sqrt(i/13)*.037;oval(rose,sole,Math.cos(a)*r,.018,Math.sin(a)*r,.002,.001,.002);}
    batch(canBody);
    const spout=group(can,0,.09,.574),rightGrip=v(.075,.265,0),leftGrip=v(-.14,.035,-.045);
    let pour=0,walking=false;
    function route(k){if(k<.43)return v(-3+k/.43*6.1,0,-5.8);const p=(k-.43)/.57;return v(3.1-p*.3,0,-5.8+p*8.1);}
    function localPoint(parent,point){root.updateMatrixWorld(true);return root.worldToLocal(parent.localToWorld(point.clone()));}
    function update(t,real){
      root.visible=t>=120&&t<192;if(!root.visible)return;
      const arriving=t<140,departing=t>=164;walking=arriving||departing;
      const k=arriving?smooth(120,140,t):departing?1-smooth(164,192,t):1;
      const p=route(k),before=route(Math.max(0,k-.015)),after=route(Math.min(1,k+.015)),direction=after.sub(before);
      const travelYaw=Math.atan2(direction.x,direction.z)+(departing?Math.PI:0),turn=arriving?smooth(137,140,t):departing?1-smooth(164,167,t):1;
      root.position.copy(p);root.rotation.y=travelYaw+Math.atan2(Math.sin(-1.25-travelYaw),Math.cos(-1.25-travelYaw))*turn;
      pour=smooth(140,143,t)*(1-smooth(160.8,164,t));
      const distance=k<.43?k/.43*6.1:6.1+(k-.43)/.57*Math.hypot(.3,8.1),travel=arriving?distance:Math.hypot(.3,8.1)+6.1-distance;
      const step=walking?travel/.6*Math.PI*2:0;
      const walkWeight=arriving?smooth(120,122,t)*(1-smooth(138,140,t)):departing?smooth(164,167,t)*(1-smooth(190,192,t)):0;
      torso.rotation.set(.02+pour*.045,Math.sin(real*.7)*.008,Math.sin(step)*.012*walkWeight);
      const greeting=smooth(139,141,t)*(1-smooth(145,149,t));
      torso.position.y=.91+Math.cos(step*2)*.009*walkWeight;head.rotation.set(-.02+pour*.11,.55*greeting-.06*pour,Math.sin(real*.6)*.008);
      for(let i=0;i<legs.length;i++){const l=legs[i],phase=(step/(Math.PI*2)+i*.5)%1,swing=phase>=.5,lift=swing?Math.sin((phase-.5)*Math.PI*2)*.055*walkWeight:0;const stride=swing?-.15+.3*smooth(0,1,(phase-.5)*2):.15-.6*phase;l.foot.position.set(l.side*.115,.07+lift,stride*walkWeight);l.foot.rotation.x=swing?Math.sin((phase-.5)*Math.PI*2)*.15*walkWeight:0;solve(l,v(l.side*.105,.82,0),l.foot.position.clone().add(v(0,.05,-.025)),v(0,0,1));}
      can.position.set(mix(.35,.1,pour),mix(.55,.80,pour)+Math.sin(step)*.012*walkWeight,mix(.13,.33,pour));can.rotation.set(pour*.43,0,Math.sin(step)*.045*walkWeight);
      for(const a of arms){const shoulder=localPoint(torso,v(a.side*.225,.35,.005));const grip=localPoint(can,a.side>0?rightGrip:leftGrip);const rest=v(-.29,.79,.04+Math.sin(step)*.09*walkWeight);const hand=a.side>0?grip:rest.lerp(grip,pour);solve(a,shoulder,hand,v(a.side*.5,-.2,-.6));a.hand.position.copy(hand);a.hand.rotation.set(a.side>0?-.5:mix(.05,-.55,pour),0,a.side*.08);}
      root.updateMatrixWorld(true);
    }
    return {root,head,torso,can,spout,arms,legs,update,waterSource(){return spout.getWorldPosition(new T.Vector3());},get pouring(){return pour;},get walking(){return walking;}};
  }
};

/* Branch-grown foliage and small, anatomically recognisable garden insects. */
window.SummerNature = {
  create({T,scene,world,material,mesh,ball,rod,group,M,geo}) {
    let seed=8173;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const range=(a,b)=>a+(b-a)*random();
    const leaves=[],insects=[];
    const time={value:0},wind={value:0};
    function canvasTexture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return tex;}
    const bark=canvasTexture((c,w,h)=>{
      c.fillStyle='#dbddd3';c.fillRect(0,0,w,h);
      for(let i=0;i<17000;i++){const v=Math.floor(range(140,240));c.fillStyle=`rgba(${v},${v},${v-5},.13)`;c.fillRect(random()*w,random()*h,range(.3,2),range(.5,4));}
      for(let i=0;i<150;i++){
        const x=random()*w,y=random()*h,wide=range(3,45);
        c.fillStyle=i%5?'#55564f':'#363e38';c.beginPath();c.moveTo(x,y);c.lineTo(x+wide*.7,y-range(1,3));c.lineTo(x+wide,y+range(1,3));c.lineTo(x+wide*.2,y+range(2,5));c.closePath();c.fill();
        c.fillStyle='rgba(255,255,237,.6)';c.fillRect(x,y+5,wide*.7,1);
      }
    });bark.wrapS=bark.wrapT=T.RepeatWrapping;bark.repeat.set(1,2.4);
    const birchBark=material('#f0eee3',{map:bark,flatShading:false});
    const darkBark=material('#655c46',{flatShading:false});
    const twigMat=material('#655e43',{flatShading:false});
    const foliageTexture=canvasTexture((c,w,h)=>{
      c.fillStyle='#e0e9c4';c.fillRect(0,0,w,h);c.strokeStyle='rgba(78,105,39,.28)';c.lineWidth=5;
      c.beginPath();c.moveTo(w*.5,h);c.lineTo(w*.5,0);c.stroke();
      for(let i=1;i<8;i++)for(const side of [-1,1]){c.lineWidth=2;c.beginPath();c.moveTo(w*.5,h*i/9);c.quadraticCurveTo(w*(.5+side*.14),h*(i-.4)/9,w*(.5+side*.43),h*(i-1.2)/9);c.stroke();}
    },128,128);
    const leafMat=material('#ffffff',{map:foliageTexture,side:T.DoubleSide,flatShading:false});
    leafMat.onBeforeCompile=shader=>{
      shader.uniforms.uNatureTime=time;
      shader.uniforms.uNatureWind=wind;
      shader.vertexShader='uniform float uNatureTime;\nuniform float uNatureWind;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 anchor = instanceMatrix[3].xyz;
        float flutter = sin(uNatureTime * 2.1 + anchor.x * 1.7 + anchor.z * 2.0);
        float breeze = 0.2 + 0.035 * sin(uNatureTime * 0.43) + uNatureWind;
        transformed.z += flutter * 0.28 * (position.y + 0.5) * breeze;
        transformed.x += sin(uNatureTime * 0.8 + anchor.y) * 0.19 * (position.y + 0.5) * breeze;
      `);
    };
    // A small pointed, slightly toothed leaf; a raised centre gives it a fold.
    const outline=[[-.16,-.48],[-.36,-.3],[-.47,-.12],[-.43,.06],[-.31,.25],[-.2,.39],[0,.72],[.19,.39],[.33,.24],[.44,.05],[.46,-.13],[.34,-.31],[.14,-.48]];
    const lp=[0,0,.065],luv=[.5,.42],li=[];
    outline.forEach(([x,y])=>{lp.push(x,y,0);luv.push(x+.5,(y+.48)/1.2);});
    for(let i=0;i<outline.length;i++)li.push(0,i+1,(i+1)%outline.length+1);
    const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(lp,3));leafGeo.setAttribute('uv',new T.Float32BufferAttribute(luv,2));leafGeo.setIndex(li);leafGeo.computeVertexNormals();
    function tapered(a,b,r1,r2,mat,parent){const v=b.clone().sub(a);const g=new T.CylinderGeometry(r2,r1,v.length(),6,1);const o=mesh(g,mat,...a.clone().add(b).multiplyScalar(.5).toArray(),1,1,1,parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
    function branch(points,r,mat,parent){for(let i=0;i<points.length-1;i++)tapered(points[i],points[i+1],r*(1-i/points.length),r*(1-(i+1)/points.length),mat,parent);}
    function addLeaf(p,size){leaves.push({p,size,rotation:[range(-1.5,1.5),random()*Math.PI*2,range(-1.3,1.3)],color:new T.Color().setHSL(range(.19,.255),range(.33,.55),range(.29,.48)).convertSRGBToLinear()});}
    function tree(x,z,h,birch=true,fruit=false){
      const parent=group(x,0,z),near=Math.abs(x)<20&&Math.abs(z)<19;
      const lean=range(-.45,.45),bend=range(-.18,.18),baseRadius=h*(birch?.019:.027);
      const trunk=new T.CylinderGeometry(.014,baseRadius,h,12,18),p=trunk.attributes.position;
      for(let i=0;i<p.count;i++){const k=(p.getY(i)+h/2)/h;p.setX(i,p.getX(i)+lean*k*k);p.setZ(i,p.getZ(i)+Math.sin(k*2.6)*bend);}
      trunk.computeVertexNormals();mesh(trunk,birch?birchBark:darkBark,0,h/2,0,1,1,1,parent);
      // Branches grow along the trunk, rather than radiating from one junction.
      const count=near?23:13;
      for(let i=0;i<count;i++){
        const fraction=.34+(i/count)*.61,y=h*fraction,a=i*2.399+range(-.22,.22);
        const reach=(birch?2.4:2.8)*(h/8)*Math.pow(Math.sin((fraction-.18)/.84*Math.PI),.7)*range(.8,1.15);
        const start=new T.Vector3(lean*fraction*fraction,y,Math.sin(fraction*2.6)*bend);
        const middle=start.clone().add(new T.Vector3(Math.cos(a)*reach*.55,h*.085,Math.sin(a)*reach*.55));
        const end=start.clone().add(new T.Vector3(Math.cos(a)*reach,h*(birch?.015:.09),Math.sin(a)*reach));
        branch([start,middle,end],(1-fraction)*baseRadius*.5,birch?birchBark:darkBark,parent);
        const twigs=near?6:3;
        for(let j=0;j<twigs;j++){
          const t=.32+j/twigs*.64,root=start.clone().lerp(end,t);root.y+=Math.sin(t*Math.PI)*h*.07;
          const side=(j%2?1:-1),spread=range(.3,.65)*(h/8),drop=birch?range(.65,1.35)*(h/8):range(.1,.55);
          const tip=root.clone().add(new T.Vector3(Math.cos(a)*spread+Math.sin(a)*side*.22,-drop,Math.sin(a)*spread-Math.cos(a)*side*.22));
          const curve=new T.QuadraticBezierCurve3(root,root.clone().lerp(tip,.5).add(new T.Vector3(0,.15,0)),tip);
          branch(curve.getPoints(4),near?.009:.007,twigMat,parent);
          const stations=near?9:5,perStation=near?3:2;
          for(let k=0;k<stations;k++)for(let n=0;n<perStation;n++){
            const q=curve.getPoint(.12+k/stations*.88);q.x+=x+range(-.12,.12);q.y+=range(-.1,.1);q.z+=z+range(-.12,.12);
            addLeaf(q,near?range(.095,.16):range(.15,.23));
          }
          if(fruit&&j%3===0){const q=curve.getPoint(.7);ball(M.insect,q.x,q.y-.08,q.z,.065,.075,.065,parent);}
        }
      }
      return parent;
    }
    let leafMesh;
    function finishTrees(){
      leafMesh=new T.InstancedMesh(leafGeo,leafMat,leaves.length);const dummy=new T.Object3D();
      for(let i=0;i<leaves.length;i++){const l=leaves[i];dummy.position.copy(l.p);dummy.rotation.set(...l.rotation);dummy.scale.set(l.size,l.size*1.12,l.size);dummy.updateMatrix();leafMesh.setMatrixAt(i,dummy.matrix);leafMesh.setColorAt(i,l.color);}
      leafMesh.castShadow=true;leafMesh.receiveShadow=true;leafMesh.frustumCulled=false;scene.add(leafMesh);
    }
    // Thin wing surfaces, not solid oval volumes. Each wing folds about its root.
    const butterflyWing=canvasTexture((c,w,h)=>{
      c.fillStyle='#f2edd8';c.fillRect(0,0,w,h);
      c.fillStyle='#4b4939';c.beginPath();c.ellipse(w*.76,h*.16,w*.19,h*.23,-.5,0,7);c.fill();
      for(const [x,y,r] of [[.65,.48,.043],[.63,.71,.035]]){c.beginPath();c.ellipse(w*x,h*y,w*r,h*r,0,0,7);c.fill();}
      c.strokeStyle='rgba(106,108,73,.22)';c.lineWidth=1.5;
      for(let i=0;i<7;i++){c.beginPath();c.moveTo(w*.05,h*.65);c.lineTo(w*(.5+i*.07),h*(.1+i*.12));c.stroke();}
    },128,128);
    const cream=material('#fff9dd',{map:butterflyWing,side:T.DoubleSide,flatShading:false});
    const bodyMat=material('#514a32',{flatShading:false});
    function wingShape(points){const s=new T.Shape();s.moveTo(...points[0]);for(let i=1;i<points.length;i++)s.quadraticCurveTo(...points[i].slice(0,2),...points[i].slice(2,4));const g=new T.ShapeGeometry(s,10);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/.065,(pos.getZ(i)+.045)/.09);return g;}
    const fore=wingShape([[0,0],[.025,.055,.055,.042],[.08,.025,.057,-.01],[.03,-.02,0,0]]);
    const hind=wingShape([[0,0],[.055,.018,.052,-.025],[.045,-.056,.015,-.041],[.002,-.025,0,0]]);
    for(let i=0;i<2;i++){
      const b=group(0,0,0,scene),wings=[];b.name='garden-butterfly';
      mesh(geo.round,bodyMat,0,0,0,.004,.005,.027,b);mesh(geo.round,bodyMat,0,.002,-.028,.006,.006,.006,b);
      for(const side of [-1,1]){
        const w=group(0,0,0,b);w.scale.x=side;mesh(fore,cream,0,0,-.009,1,1,1,w);mesh(hind,cream,0,-.001,.018,.85,1,.85,w);wings.push(w);
        rod(bodyMat,[side*.003,.003,-.03],[side*.014,.014,-.045],.00065,b);
        for(let j=0;j<3;j++)rod(bodyMat,[side*.002,-.002,-.01+j*.008],[side*.012,-.01,-.014+j*.008],.0006,b);
      }
      insects.push({b,wings,kind:'butterfly',offset:i*7.3});
    }
    const transparentWing=material('#bacfd0',{side:T.DoubleSide,transparent:true,opacity:.33,depthWrite:false,roughness:.35,flatShading:false});
    const dragonBody=material('#406b77',{metalness:.12,roughness:.56,flatShading:false});
    const dragonVein=material('#769794',{transparent:true,opacity:.55});
    const dragon=group(0,0,0,scene);dragon.name='garden-dragonfly';
    mesh(geo.round,dragonBody,0,0,-.014,.007,.007,.012,dragon);
    mesh(geo.round,bodyMat,0,0,-.029,.005,.004,.005,dragon);
    const eyeMat=material('#335a58',{roughness:.3,flatShading:false});
    for(const side of [-1,1])mesh(geo.round,eyeMat,side*.0045,.001,-.029,.005,.0055,.0055,dragon);
    // A continuous tapered abdomen with fine bands, rather than separate beads.
    mesh(new T.CylinderGeometry(.0012,.004,.051,10),dragonBody,0,0,.0215,1,1,1,dragon).rotation.x=Math.PI/2;
    for(let i=0;i<7;i++){const z=.001+i*.0068,r=.004-(z+.004)/.051*.0028;mesh(new T.CylinderGeometry(r,r,.0008,10),bodyMat,0,0,z,1,1,1,dragon).rotation.x=Math.PI/2;}
    const wings=[];
    for(const side of [-1,1])for(let pair=0;pair<2;pair++){
      const w=group(0,0,-.015+pair*.018,dragon);w.scale.x=side;w.rotation.y=(pair?.18:-.18)*side;
      const shape=wingShape([[0,0],[.025,.014,.057,.008],[.074,0,.057,-.006],[.025,-.01,0,0]]);
      mesh(shape,transparentWing,0,0,0,1,1,1,w);
      rod(dragonVein,[0,0,0],[.06,0,0],.00035,w);
      for(let k=1;k<6;k++){const x=k*.009;rod(dragonVein,[x,0,-.005],[x+.002,0,.006],.00018,w);}
      wings.push(w);
    }
    for(const side of [-1,1])for(let i=0;i<3;i++)rod(bodyMat,[side*.004,-.002,-.02+i*.007],[side*.012,-.012,-.02+i*.008],.0006,dragon);
    insects.push({b:dragon,wings,kind:'dragonfly',offset:3});
    function flight(real,insect){
      const t=real+insect.offset;
      if(insect.kind==='dragonfly'){
        // Hold a position, then dart to the next spot. Smooth endpoints avoid teleporting.
        const points=[[-1.8,1.3,3.3],[1.3,1.65,.8],[.3,1.15,3.9],[-2.4,1.8,.4]],cycle=t/7,index=Math.floor(cycle)%4;
        const phase=cycle-Math.floor(cycle),k=Math.max(0,Math.min(1,(phase-.62)/.38)),e=k*k*(3-2*k);
        const a=new T.Vector3(...points[index]),b=new T.Vector3(...points[(index+1)%4]);return a.lerp(b,e).add(new T.Vector3(Math.sin(t*3)*.012,Math.sin(t*4)*.015,0));
      }
      return new T.Vector3(-1+Math.sin(t*.19)*2.7,1.05+Math.sin(t*.7)*.16+Math.sin(t*.23)*.12,1.6+Math.cos(t*.14)*2.2);
    }
    function update(t,real,strength=SummerWeather.windAt(real)){
      time.value=real;wind.value=strength;
      for(const insect of insects){
        const p=flight(real,insect),next=flight(real+.035,insect),d=next.clone().sub(p);
        insect.b.position.copy(p);insect.b.rotation.y=Math.atan2(-d.x,-d.z);
        insect.b.rotation.z=insect.kind==='butterfly'?Math.sin(real*1.5+insect.offset)*.15:0;
        insect.b.visible=t<295&&SummerWeather.at(t).rain<.08;
        if(t>265)insect.b.position.y+=(t-265)*.08;
        for(let i=0;i<insect.wings.length;i++){
          const speed=insect.kind==='dragonfly'?38:9;
          insect.wings[i].rotation.z=insect.wings[i].scale.x*Math.sin(real*speed+insect.offset+(insect.kind==='dragonfly'?(i%2)*.3:0))*(insect.kind==='dragonfly'?.22:.95);
        }
      }
    }
    return {tree,finishTrees,update,insects,get windStrength(){return wind.value;},get leafCount(){return leaves.length;}};
  }
};

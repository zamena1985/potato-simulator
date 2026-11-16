/* Quiet, repeatable encounters: approach, nibble, and retreat on a plant shake. */
window.SummerVisitors={
  create({T,scene,material,heroPlant,potato,beetleStem}){
    const sphere=new T.SphereGeometry(1,14,10),models={},up=new T.Vector3(0,1,0);
    const smooth=(a,b,x)=>{const k=Math.max(0,Math.min(1,(x-a)/(b-a)));return k*k*(3-2*k);};
    function ellipsoid(parent,mat,x,y,z,sx,sy,sz){const o=new T.Mesh(sphere,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
    function line(parent,mat,a,b,r){const from=new T.Vector3(...a),to=new T.Vector3(...b),d=to.clone().sub(from),m=new T.Mesh(new T.CylinderGeometry(r*.6,r,d.length(),6),mat);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(up,d.normalize());parent.add(m);return m;}
    const dark=material('#3b3023',{flatShading:false}),gold=material('#b98237',{flatShading:false,roughness:.7}),wormSkin=material('#88572f',{flatShading:false,roughness:.72}),slugSkin=material('#514c3f',{flatShading:false,roughness:.58});
    for(const kind of ['beetle','worm','slug']){const root=new T.Group();root.visible=false;scene.add(root);models[kind]={root,parts:[]};}
    const beetle=models.beetle.root;
    beetle.scale.setScalar(.85*heroPlant.scale.x);
    ellipsoid(beetle,gold,0,.028,0,.051,.037,.072);ellipsoid(beetle,dark,0,.022,-.065,.032,.025,.03);
    for(const side of [-1,1]){
      for(let j=0;j<4;j++){
        const angle=(j+.6)*.27*side,curve=[];
        for(let k=0;k<=12;k++){const z=-.058+k*.0095,r=Math.sqrt(Math.max(.04,1-(z/.074)**2));curve.push(new T.Vector3(Math.sin(angle)*.052*r,.028+Math.cos(angle)*.038*r,z));}
        beetle.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(curve),12,.002,4,false),dark));
      }
      for(let j=0;j<3;j++){const leg=new T.Group();beetle.add(leg);line(leg,dark,[side*.035,.024,-.035+j*.035],[side*.065,.014,-.05+j*.04],.003);line(leg,dark,[side*.065,.014,-.05+j*.04],[side*.081,0,-.06+j*.048],.002);models.beetle.parts.push(leg);}
      line(beetle,dark,[side*.014,.035,-.08],[side*.03,.045,-.105],.0015);
    }
    // Continuous surfaces: fine rings on the worm and a smooth, tapered slug body.
    function softBody(kind,mat){
      const n=72,sides=12,positions=[],uv=[],indices=[];
      for(let i=0;i<=n;i++)for(let j=0;j<=sides;j++){
        const u=i/n,a=j/sides*Math.PI*2,taper=Math.pow(Math.max(.0001,Math.sin(u*Math.PI)),kind==='worm'?.22:.7);
        const radius=(kind==='worm'?.018:.038)*taper*(kind==='worm'?.96+.04*Math.cos(u*Math.PI*36):1);
        positions.push(Math.cos(a)*radius,(kind==='worm'?.022:.025)+Math.sin(a)*radius*(kind==='worm'?1:.68),(u-.5)*(kind==='worm'?.29:.27));uv.push(j/sides,u);
        if(i<n&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
      }
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const body=new T.Mesh(geometry,mat);body.castShadow=body.receiveShadow=true;models[kind].root.add(body);models[kind].body=body;models[kind].rest=new Float32Array(positions);
    }
    const worm=models.worm.root;softBody('worm',wormSkin);
    ellipsoid(worm,dark,0,.022,-.143,.013,.012,.013);
    const slug=models.slug.root;softBody('slug',slugSkin);
    ellipsoid(slug,slugSkin,0,.036,-.047,.034,.022,.055);
    for(const side of [-1,1]){line(slug,slugSkin,[side*.018,.045,-.07],[side*.031,.083,-.11],.003);ellipsoid(slug,dark,side*.031,.083,-.11,.004,.004,.004);line(slug,slugSkin,[side*.021,.023,-.07],[side*.04,.027,-.097],.002);}
    const labels={beetle:'Колорадский жук',worm:'Червячок',slug:'Слизень'};
    const departures={beetle:'Жук отцепился и упал в траву.',worm:'Червячок испугался и спрятался в землю.',slug:'Слизень отступает в траву.'};
    const schedule=[{at:55,kind:'beetle',duration:30},{at:94,kind:'worm',duration:35},{at:195,kind:'slug',duration:34},{at:256,kind:'worm',duration:34},{at:330,kind:'beetle',duration:28}];
    let active=null,status='idle',entryId='',fledAt=-1,lastBite=0,lateStart=null,clock=0,biteCount=0;
    const escapeFrom=new T.Vector3(),escapeRotation=new T.Quaternion(),target=new T.Vector3();
    const routePoint=new T.Vector3(),forward=new T.Vector3(),normal=new T.Vector3(),right=new T.Vector3(),back=new T.Vector3(),basis=new T.Matrix4(),parentRotation=new T.Quaternion();
    let grip=1;
    function crawl(progress,reverse=false){
      const u=Math.max(0,Math.min(1,progress));beetleStem.getPointAt(u,routePoint);beetleStem.getTangentAt(u,forward).normalize();
      normal.set(0,0,1).lerp(up,smooth(.65,1,u));normal.addScaledVector(forward,-normal.dot(forward)).normalize();
      routePoint.addScaledVector(normal,.018);heroPlant.updateMatrixWorld(true);beetle.position.copy(heroPlant.localToWorld(routePoint));
      if(reverse)forward.negate();right.crossVectors(forward,normal).normalize();back.copy(forward).negate();basis.makeBasis(right,normal,back);
      heroPlant.getWorldQuaternion(parentRotation);beetle.quaternion.setFromRotationMatrix(basis).premultiply(parentRotation);
      grip=1-smooth(.65,.95,u);
    }
    function reset(){Object.values(models).forEach(m=>m.root.visible=false);active=null;status='idle';entryId='';fledAt=-1;lateStart=null;biteCount=0;potato.reset();}
    function update(t,real){
      if(t<360)lateStart=null;else if(lateStart===null)lateStart=real;
      clock=t<360?t:360+real-lateStart;
      const cycle=Math.floor(clock/380),local=clock-cycle*380,entry=schedule.find(e=>local>=e.at&&local<e.at+e.duration);
      const id=entry?cycle+':'+entry.at:'';
      if(id!==entryId){Object.values(models).forEach(m=>m.root.visible=false);entryId=id;active=entry?models[entry.kind]:null;status=entry?'approaching':'idle';fledAt=-1;lastBite=real;}
      if(!entry||!active)return;
      const root=active.root,age=local-entry.at,kind=entry.kind;root.visible=true;
      if(fledAt>=0){
        const elapsed=real-fledAt,k=smooth(0,2.4,elapsed);status=elapsed<2.4?'fleeing':'gone';root.visible=elapsed<2.4;root.position.copy(escapeFrom);
        if(kind==='beetle'){root.position.x+=k*.25;root.position.z+=k*.2;root.position.y=Math.max(.09,escapeFrom.y+.12*elapsed-1.6*elapsed*elapsed);root.quaternion.copy(escapeRotation);if(root.position.y>.1)root.rotateZ(elapsed*7);else{root.position.x+=Math.max(0,elapsed-.7)*.4;root.rotation.set(0,-1.2,0);}grip=0;}
        else{root.position.add(new T.Vector3(k*(kind==='worm'?.45:1.15),kind==='worm'?-k*.3:0,k*.4));root.rotation.y=-1.8;}
      }else{
        const next=age<12?'approaching':age<entry.duration-5?'eating':'leaving';if(status!==next){status=next;lastBite=real;}
        const approach=smooth(0,12,age),leave=smooth(entry.duration-5,entry.duration,age);
        if(kind==='beetle'){
          crawl(leave>0?1-leave:approach,leave>0);
        }else{
          target.set(-.3,.18,6.35);root.position.set(target.x+(1-approach)*.7+leave*.8,.14+approach*.04,target.z+(1-approach)*.3+leave*.3);root.rotation.set(0,1.05,0);
        }
        if(status==='eating'){
          if(kind!=='beetle')root.position.y+=Math.sin(real*8)*.003;
          if(kind!=='beetle'&&real-lastBite>3){potato.nibble();biteCount++;lastBite=real;}
        }
      }
      for(let i=0;i<active.parts.length;i++){
        const part=active.parts[i];if(kind==='beetle'){const side=i<3?-1:1;part.rotation.y=Math.sin(real*12+i*2)*(status==='eating'?.025:.14);part.scale.x=1-grip*.75;part.rotation.z=-side*grip*.65;}
        else{part.position.x=Math.sin(real*(status==='fleeing'?12:5)-i*.6)*.007;part.scale.z=(kind==='worm'?.012:.027)*(1+Math.sin(real*5-i*.5)*.14);}
      }
      if(active.body){const p=active.body.geometry.attributes.position,rest=active.rest;for(let i=0;i<p.count;i++){const z=rest[i*3+2],wave=Math.sin(real*(status==='fleeing'?11:4)-z*24);p.setXYZ(i,rest[i*3]+wave*.005,rest[i*3+1],z*(1+Math.sin(real*4)*.025));}p.needsUpdate=true;active.body.geometry.computeVertexNormals();}
    }
    function scare(real){if(!active||!['approaching','eating','leaving'].includes(status))return null;escapeFrom.copy(active.root.position);escapeRotation.copy(active.root.quaternion);fledAt=real;status='fleeing';return departures[schedule.find(e=>entryId.endsWith(':'+e.at)).kind];}
    function info(){const kind=Object.keys(models).find(k=>models[k]===active);return {kind:kind||null,name:kind?labels[kind]:'',status,visible:!!active?.root.visible,bites:biteCount,position:active?.root.position||target};}
    return {update,reset,scare,info,models};
  }
};

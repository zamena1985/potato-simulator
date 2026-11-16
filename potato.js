/* A soil-covered tuber, with actual eye depressions rather than painted dots. */
window.SummerPotato={
  create({T,scene,material,batch}){
    let seed=6204;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
    c.fillStyle='#b69968';c.fillRect(0,0,512,512);
    for(let i=0;i<650;i++){
      const x=random()*512,y=random()*512,r=8+random()*32,g=c.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,i%3?'rgba(106,77,43,.13)':'rgba(228,204,151,.2)');g.addColorStop(1,'rgba(146,112,67,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<24000;i++){const v=Math.floor(70+random()*130);c.fillStyle=`rgba(${v},${v*.8},${v*.55},${.08+random()*.2})`;c.fillRect(random()*512,random()*512,.4+random()*1.5,.4+random()*1.3);}
    const map=new T.CanvasTexture(canvas);map.encoding=T.sRGBEncoding;map.wrapS=map.wrapT=T.RepeatWrapping;
    const skin=material('#cbb995',{map,bumpMap:map,bumpScale:.001,roughness:1,flatShading:false});
    const root=new T.Group();root.position.set(-.55,.205,6.05);root.rotation.y=-.2;scene.add(root);
    const eyes=[];
    for(let i=0;i<13;i++){const y=-.65+random()*1.5,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);eyes.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}
    function surface(n){
      const bulge=1+.06*Math.sin(n.x*5+n.z*3)+.035*Math.cos(n.y*9-n.x*2);
      let dent=0;for(const eye of eyes)dent+=.047*Math.exp(-n.distanceToSquared(eye)/.009);
      return new T.Vector3(n.x*.34,n.y*.18,n.z*.245).multiplyScalar(bulge-dent);
    }
    const geometry=new T.SphereGeometry(1,72,48),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const p=surface(new T.Vector3().fromBufferAttribute(positions,i).normalize());positions.setXYZ(i,p.x,p.y,p.z);}geometry.computeVertexNormals();
    const tuber=new T.Mesh(geometry,skin);tuber.castShadow=tuber.receiveShadow=true;root.add(tuber);
    const eyeMat=material('#6f5435',{roughness:1,flatShading:false}),soil=material('#544333',{roughness:1,flatShading:false});
    const sphere=new T.SphereGeometry(1,10,7),details=new T.Group();root.add(details);
    for(const n of eyes){const eye=new T.Mesh(sphere,eyeMat);eye.position.copy(surface(n)).addScaledVector(n,-.001);eye.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);eye.scale.set(.009,.004,.002);details.add(eye);}
    // Flecks of dry earth mostly around the buried shoulder, without a glossy finish.
    for(let i=0;i<95;i++){const y=-.7+random()*1.15,a=random()*Math.PI*2,r=Math.sqrt(1-y*y),n=new T.Vector3(r*Math.cos(a),y,r*Math.sin(a));const speck=new T.Mesh(sphere,soil);speck.position.copy(surface(n));speck.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);const s=.002+random()*.007;speck.scale.set(s,s*.65,.0015);details.add(speck);}batch(details);
    const biteMat=material('#ddc59a',{roughness:1,side:T.DoubleSide,flatShading:false}),bites=[];
    for(let i=0;i<4;i++){const n=new T.Vector3(-.28+i*.19,.45,.85).normalize(),mark=new T.Mesh(new T.CircleGeometry(.014,12),biteMat);mark.position.copy(surface(n)).addScaledVector(n,.0015);mark.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);mark.scale.y=.6;mark.visible=false;root.add(mark);bites.push(mark);}
    return {root,tuber,bites,update(shake){root.rotation.z=shake*.055;root.position.y=.205+Math.abs(shake)*.009;},nibble(){const mark=bites.find(b=>!b.visible);if(mark)mark.visible=true;},reset(){bites.forEach(b=>b.visible=false);root.rotation.z=0;root.position.y=.205;}};
  }
};

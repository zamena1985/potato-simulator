/* Bees visit flowers; a small mosquito swarm comes out after the shower. */
window.SummerAirlife={
  create({T,scene,material,batch,heroPlant}){
    const bees=[],mosquitoes=[],sphere=new T.SphereGeometry(1,12,8);
    const gold=material('#ba9148',{flatShading:false}),dark=material('#453c2d',{flatShading:false}),grey=material('#686b5a',{flatShading:false});
    const wingMat=material('#d6dfd4',{transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false,roughness:.45});
    const wingGeo=new T.CircleGeometry(1,12);wingGeo.rotateX(-Math.PI/2);
    function oval(g,mat,x,y,z,sx,sy,sz){const m=new T.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
    function rod(g,a,b,r){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),5),dark);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());g.add(m);}
    function insect(kind,index){
      const root=new T.Group(),body=new T.Group();root.add(body);scene.add(root);const bee=kind==='bee';
      oval(body,bee?gold:grey,0,0,.008,bee?.008:.002,bee?.008:.002,bee?.018:.009);
      oval(body,dark,0,.001,bee?-.012:-.005,bee?.007:.0025,bee?.007:.0025,bee?.008:.003);
      oval(body,dark,0,.002,bee?-.022:-.01,bee?.005:.002,bee?.005:.002,bee?.005:.002);
      if(bee)for(const z of [-.001,.007,.015]){const r=.008*Math.sqrt(1-((z-.008)/.019)**2),ring=new T.Mesh(new T.TorusGeometry(r,.0016,4,14),dark);ring.position.z=z;body.add(ring);}
      for(const side of [-1,1]){
        for(let j=0;j<3;j++){const z=-.009+j*.006,reach=bee?.014:.021;rod(body,[side*.003,0,z],[side*reach,-.009,z+.006],.00055);rod(body,[side*reach,-.009,z+.006],[side*reach*1.35,-.018,z+.013],.0004);}
        if(bee)rod(body,[side*.002,.004,-.023],[side*.005,.01,-.03],.0005);
      }
      if(!bee)rod(body,[0,0,-.011],[0,-.003,-.022],.00035);batch(body);
      const wings=[];for(const side of [-1,1]){const pivot=new T.Group();pivot.position.set(side*.002,.005,-.008);const wing=new T.Mesh(wingGeo,wingMat);wing.scale.set(bee?.014:.009,1,bee?.005:.003);wing.position.x=side*(bee?.012:.008);pivot.add(wing);root.add(pivot);wings.push(pivot);}
      return {root,wings,index,kind};
    }
    for(let i=0;i<3;i++)bees.push(insect('bee',i));for(let i=0;i<8;i++)mosquitoes.push(insect('mosquito',i));
    let scaredAt=-100;
    function flower(index){if(index%3===0){heroPlant.updateMatrixWorld(true);return heroPlant.localToWorld(new T.Vector3(0,.85,0));}return new T.Vector3(index%3===1?1.1:-1.2,1.25,index%3===1?4.5:3.2);}
    function beePosition(real,i){const cycle=(real+i*7)/12,index=Math.floor(cycle),phase=cycle-index,a=flower(index),b=flower(index+1);if(phase<.28)return a.add(new T.Vector3(.02,.022,0));const k=(phase-.28)/.72,e=k*k*(3-2*k);return a.lerp(b,e).add(new T.Vector3(Math.sin(k*Math.PI*3)*.12,Math.sin(k*Math.PI)*.45+.022,Math.sin(k*Math.PI*2)*.18));}
    function update(t,real,rain){
      for(const b of bees){b.root.visible=t<292&&rain<.08;const p=beePosition(real,b.index),next=beePosition(real+.03,b.index),d=next.sub(p);b.root.position.copy(p);if(d.lengthSq()>.000001)b.root.rotation.y=Math.atan2(-d.x,-d.z);for(let i=0;i<2;i++)b.wings[i].rotation.z=(i?1:-1)*Math.sin(real*85+b.index)*.55;}
      const retreat=Math.max(0,1-(real-scaredAt)/8);
      for(const m of mosquitoes){const i=m.index,s=real*.8+i*2.4;m.root.visible=t>=279&&rain<.08;const spread=1+retreat*2.5;m.root.position.set(Math.sin(s*.7)*1.1*spread,1.05+Math.sin(s*1.3)*.25+retreat*.8,6.1+Math.cos(s*.9)*.65*spread);m.root.rotation.y=-s;m.root.scale.setScalar(Math.min(1,Math.max(0,(t-279)/5)));for(let j=0;j<2;j++)m.wings[j].rotation.z=(j?1:-1)*Math.sin(real*110+i)*.7;}
    }
    return {bees,mosquitoes,update,scare(real){scaredAt=real;},reset(){scaredAt=-100;}};
  }
};

/* Hand-built village details and locally generated surface textures. */
window.SummerEnvironment = {
  create(api) {
    const {T, M, geo, world, scene, material, mesh, box, ball, rod, torus, group, rand, between,nature} = api;
    // A separate seeded stream means adding a scratch cannot rearrange the garden.
    let textureSeed = 1947;
    const random = () => { textureSeed = (textureSeed * 1664525 + 1013904223) >>> 0; return textureSeed / 4294967296; };
    function texture(draw, size=256) {
      const canvas = document.createElement('canvas'); canvas.width=canvas.height=size;
      draw(canvas.getContext('2d'),size);
      const map = new T.CanvasTexture(canvas);
      map.wrapS=map.wrapT=T.RepeatWrapping; map.encoding=T.sRGBEncoding;
      map.anisotropy=4;
      return map;
    }
    const soil=texture((c,n)=>{
      c.fillStyle='#ded2ba'; c.fillRect(0,0,n,n);
      for(let i=0;i<6500;i++){
        const x=random()*n,y=random()*n,r=.25+random()*1.8;
        c.fillStyle=i%3?'rgba(69,47,31,.15)':'rgba(255,248,220,.22)';
        c.beginPath();c.ellipse(x,y,r,r*.65,random()*6,0,Math.PI*2);c.fill();
      }
      for(let i=0;i<42;i++){
        const x=random()*n,y=random()*n;
        c.strokeStyle='rgba(81,61,40,.16)';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*9-4,y+random()*10-5);c.stroke();
      }
    });
    // Humus has broad uneven clods as well as fine grains. Keep colour and height
    // separate: dark organic flecks should not all turn into deep punctures.
    const fields=[8,32,128,512].map(n=>({n,values:Float32Array.from({length:n*n},()=>random())}));
    function noise(x,y,field){const {n,values}=field,xx=x*n,yy=y*n,ix=Math.floor(xx),iy=Math.floor(yy),fx=xx-ix,fy=yy-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);const at=(a,b)=>values[(b%n)*n+a%n];return (at(ix,iy)*(1-sx)+at(ix+1,iy)*sx)*(1-sy)+(at(ix,iy+1)*(1-sx)+at(ix+1,iy+1)*sx)*sy;}
    const size=512,heights=new Float32Array(size*size);
    const bedMap=texture((c,n)=>{
      const pixels=c.createImageData(n,n);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const u=x/n,v=y/n,broad=noise(u,v,fields[0]),clod=noise(u,v,fields[1]),grain=noise(u,v,fields[2]),fine=noise(u,v,fields[3]);
        const valley=Math.max(0,.42-clod)*80,shade=(broad-.5)*32+(clod-.5)*42+(grain-.5)*23+(fine-.5)*12-valley;
        const i=y*n+x;heights[i]=.3+broad*.12+clod*.4+grain*.12+fine*.06;
        pixels.data.set([95+shade,91+shade,81+shade,255],i*4);
      }c.putImageData(pixels,0,0);
      for(let i=0;i<650;i++){const x=random()*n,y=random()*n;c.strokeStyle=i%4?'rgba(35,34,28,.35)':'rgba(159,151,126,.3)';c.lineWidth=.5+random();c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*5-2.5,y+random()*4-2);c.stroke();}
    },size);
    const bedHeight=texture((c,n)=>{const pixels=c.createImageData(n,n);for(let i=0;i<heights.length;i++){const h=heights[i]*255;pixels.data.set([h,h,h,255],i*4);}c.putImageData(pixels,0,0);},size);
    bedMap.repeat.set(3,19);bedHeight.repeat.copy(bedMap.repeat);bedHeight.encoding=T.LinearEncoding;
    M.bed.map=bedMap;M.bed.bumpMap=bedHeight;M.bed.bumpScale=.011;M.bed.roughness=1;M.bed.flatShading=false;
    const pathMap=soil.clone();pathMap.needsUpdate=true;pathMap.repeat.set(2,16);M.path.map=pathMap;M.path.bumpMap=pathMap;M.path.bumpScale=.014;
    const grassMap=texture((c,n)=>{
      c.fillStyle='#d3d7b0';c.fillRect(0,0,n,n);
      for(let i=0;i<1800;i++){
        c.fillStyle=i%2?'rgba(74,100,48,.13)':'rgba(229,219,154,.16)';
        c.beginPath();c.ellipse(random()*n,random()*n,2+random()*7,1+random()*4,random()*6,0,7);c.fill();
      }
    });grassMap.repeat.set(55,55);M.grass.map=grassMap;
    const grain=texture((c,n)=>{
      c.fillStyle='#e7d9c0';c.fillRect(0,0,n,n);
      for(let i=0;i<180;i++){
        const y=random()*n;c.strokeStyle=i%4?'rgba(79,51,29,.16)':'rgba(255,244,211,.4)';
        c.lineWidth=.4+random();c.beginPath();
        for(let x=0;x<=n;x+=8)c.lineTo(x,y+Math.sin(x*.055+i)*2);c.stroke();
      }
      for(let i=0;i<5;i++){c.strokeStyle='rgba(92,66,43,.17)';c.beginPath();c.ellipse(random()*n,random()*n,9+random()*10,2+random()*3,0,0,7);c.stroke();}
    });grain.repeat.set(2,1);
    M.wall.map=grain;M.wood.map=grain;M.woodLight.map=grain;
    const leafMap=texture((c,n)=>{
      c.fillStyle='#f1f5dc';c.fillRect(0,0,n,n);
      c.strokeStyle='rgba(64,94,33,.28)';c.lineWidth=2;c.beginPath();c.moveTo(0,n/2);c.lineTo(n,n/2);c.stroke();
      for(let i=1;i<9;i++)for(const side of [-1,1]){c.lineWidth=.8;c.strokeStyle='rgba(68,98,34,.16)';c.beginPath();c.moveTo(i*n/10,n/2);c.quadraticCurveTo((i+.5)*n/10,n/2+side*45,(i+1.5)*n/10,n/2+side*110);c.stroke();}
    });M.leaf.map=leafMap;M.leafLight.map=leafMap;
    const checked=texture((c,n)=>{
      c.fillStyle='#e2e3c9';c.fillRect(0,0,n,n);
      for(let i=0;i<n;i+=32){c.fillStyle='rgba(80,130,148,.25)';c.fillRect(i,0,14,n);c.fillRect(0,i,n,14);}
      for(let i=0;i<n;i+=4){c.fillStyle='rgba(255,255,255,.13)';c.fillRect(i,0,1,n);}
    });M.clothBlue.map=checked;
    const leafRed=material('#697843'), berry=material('#a8473e'), enamel=material('#c5d6c5',{roughness:.6}), enamelBlue=material('#4d7b87'), logEnd=material('#c6ac7e'), rusty=material('#8f6651');

    // Worn stone threshold and a few mismatched bricks; all keep the walking path open.
    for(let i=0;i<9;i++){
      const z=-5.4+i*.79,x=3.45+Math.sin(i*.8)*.14;
      const stone=box(i%3?M.woodLight:M.wood,x,.045,z,.52+rand()*.15,.08,.37+rand()*.1);
      stone.rotation.y=between(-.15,.15);
    }
    // Firewood under a small lean-to next to the house.
    const logs=group(-10.7,0,-6.4);
    for(let row=0;row<4;row++)for(let col=0;col<6-row%2;col++){
      const x=col*.29+(row%2)*.14,y=.17+row*.26,length=between(.65,.95);
      rod(M.woodDark,[x,y,-length/2],[x,y,length/2],.135,logs);
      rod(logEnd,[x,y,length/2+.005],[x,y,length/2+.018],.119,logs);
      const ring=torus(M.wood,x,y,length/2+.02,.075,.006,logs);ring.scale.y=.9;
    }
    for(const x of [-.2,1.7])rod(M.wood,[x,0,-.55],[x,1.4,-.55],.055,logs);
    box(M.wood, .75,1.43,0,2.2,.09,1.65,logs).rotation.x=.15;

    // A stump with an axe and pale chips on the ground.
    const stump=group(-9.2,0,-3.4);
    mesh(geo.cylinder,M.woodDark,0,.25,0,.32,.5,.3,stump);
    mesh(geo.cylinder,logEnd,0,.505,0,.29,.012,.27,stump);
    for(const r of [.11,.21])torus(M.wood,0,.516,0,r,.007,stump).rotation.x=Math.PI/2;
    rod(M.woodLight,[0,.55,0],[.45,1.03,.1],.025,stump);
    box(M.metal,.03,.61,0,.25,.19,.055,stump).rotation.z=-.3;
    for(let i=0;i<13;i++){const a=rand()*7,r=between(.4,.8);box(logEnd,Math.cos(a)*r,.02,Math.sin(a)*r,.06,.025,.12,stump).rotation.y=a;}

    function bucket(x,z,scale=1){
      const b=group(x,.02,z);b.scale.setScalar(scale);
      mesh(new T.CylinderGeometry(.22,.17,.37,14,1,true),enamel,0,.21,0,1,1,1,b);
      mesh(geo.cylinder,M.woodDark,0,.052,0,.166,.025,.166,b);
      for(const y of [.04,.4])torus(enamelBlue,0,y,0,y>.1?.222:.175,.014,b).rotation.x=Math.PI/2;
      const handle=new T.Mesh(new T.TorusGeometry(.23,.011,5,18,Math.PI),M.metal);handle.position.y=.38;b.add(handle);
      for(let i=0;i<4;i++)ball(rusty,Math.cos(i*1.7)*.2,.3-i*.045,Math.sin(i*1.7)*.2,.02,.012,.015,b);
      return b;
    }
    bucket(4.7,-2.1,1.25);bucket(-8,-5.9,.85);
    // Garden hose makes a loose coil beside the rain barrel.
    const hose=material('#6b7754');
    for(let i=0;i<3;i++){const ring=torus(hose,-9.1,.04+i*.026,-5.3,.46-i*.075,.019);ring.rotation.x=Math.PI/2;ring.scale.z=.7;}
    const hoseCurve=new T.CatmullRomCurve3([new T.Vector3(-9.6,.08,-5.3),new T.Vector3(-10,.05,-5.7),new T.Vector3(-10,.6,-6.4),new T.Vector3(-9.55,1.14,-6.6)]);
    mesh(new T.TubeGeometry(hoseCurve,22,.021,5,false),hose,0,0,0);

    // Rake and spade leaning beside the shed, plus a crate of terracotta pots.
    const tools=group(6.2,0,-8.7);tools.rotation.z=-.14;
    rod(M.woodLight,[0,.15,0],[0,1.8,0],.028,tools);
    rod(M.metal,[-.28,.16,0],[.28,.16,0],.025,tools);
    for(let i=0;i<7;i++)rod(M.metal,[-.25+i*.083,.16,0],[-.25+i*.083,.03,.08],.012,tools);
    rod(M.woodLight,[.5,.32,0],[.5,1.65,0],.032,tools);box(M.metal,.5,.22,0,.25,.32,.035,tools);
    torus(M.woodLight,.5,1.75,0,.095,.024,tools);
    const crate=group(5.35,0,-8.8);
    for(const z of [-.4,.4])for(let j=0;j<3;j++)box(M.woodLight,0,.12+j*.17,z,1.1,.13,.055,crate);
    for(const x of [-.53,.53])for(let j=0;j<3;j++)box(M.wood,x,.12+j*.17,0,.055,.13,.8,crate);
    for(let i=0;i<3;i++){mesh(new T.CylinderGeometry(.15,.1,.25,10,1,true),M.terracotta,-.3+i*.3,.58,0,1,1,1,crate);torus(M.terracotta,-.3+i*.3,.71,0,.15,.022,crate).rotation.x=Math.PI/2;}

    // Redcurrants by the fence: irregular shoots, little strings of berries.
    for(let n=0;n<4;n++){
      const bush=group(-8.2,0,-.6+n*1.35);
      for(let j=0;j<7;j++){
        const a=j*2.4,h=between(.45,.95),x=Math.cos(a)*.4,z=Math.sin(a)*.4;
        rod(M.woodDark,[0,.05,0],[x,h,z],.014,bush);
        for(let k=0;k<3;k++){
          const leaf=mesh(geo.leaf,leafRed,x+between(-.17,.17),h-.1+k*.06,z+between(-.17,.17),.2,.1,.13,bush);leaf.rotation.y=a+k;
        }
        if(j%2===0)for(let k=0;k<4;k++)ball(berry,x+.06,h-.1-k*.05,z+.08,.025,.03,.025,bush);
      }
    }
    // An apple tree to discover when turning right.
    nature.tree(12.6,6.5,4.5,false,true);
    for(let i=0;i<5;i++)ball(berry,12.6+between(-1.5,1.5),.08,6.5+between(-1.4,1.4),.075,.065,.075);
    // A swing sits behind the bed, visible when the player turns around.
    const swing=group(-5,0,12.1);for(const x of [-1.15,1.15])for(const z of [-.7,.7])rod(M.wood,[x,0,z],[x,2.8,0],.065,swing);
    rod(M.wood,[-1.4,2.8,0],[1.4,2.8,0],.085,swing);
    const swingSeat=group(-5,2.76,12.1,scene);
    for(const x of [-.35,.35])rod(M.woodLight,[x,0,0],[x,-2.05,0],.012,swingSeat);
    box(M.blue,0,-2.05,0,.9,.07,.36,swingSeat);

    // Rain gutter and small enamel washbasin by the porch.
    rod(M.metal,[-9.05,3.5,-6.97],[-1.5,3.5,-6.97],.045);
    rod(M.metal,[-9.05,3.5,-6.97],[-9.5,1.25,-6.55],.045);
    const basin=group(-1.65,.85,-6.65);mesh(new T.CylinderGeometry(.28,.2,.14,14,1,true),enamel,0,0,0,1,1,1,basin);
    torus(enamelBlue,0,.075,0,.28,.018,basin).rotation.x=Math.PI/2;box(M.wood,0,-.12,0,.67,.08,.6,basin);
    for(const x of [-.25,.25])box(M.wood,x,-.49,0,.045,.72,.5,basin);
    // Moss between the fence posts, petals and dry fallen twigs.
    for(let i=0;i<50;i++){
      const x=between(-16,16),z=between(10.5,13.4);
      const leaf=mesh(geo.leaf,i%3?M.canopy:M.woodLight,x,.01,z,.07,.02,.04);leaf.rotation.y=rand()*7;
    }
    for(let i=0;i<14;i++){const x=between(-7.1,1.8),z=between(-1,9);rod(M.woodDark,[x,.13,z],[x+.12,.14,z+.08],.008);}

    const earth=[M.bed,M.dirt,M.soilClod].map(mat=>({mat,dry:mat.color.clone(),wet:mat.color.clone().multiplyScalar(.64)}));
    return {
      update(t,real,wind=0){
        swingSeat.rotation.x=Math.sin(real*.8)*.035*wind;
        const damp=Math.max(t<141?0:t<163?(t-141)/22:Math.max(.35,1-(t-163)/700),SummerWeather.at(t).wet);
        for(const {mat,dry,wet} of earth)mat.color.copy(dry).lerp(wet,damp);
      },
      focusTargets:[
        {name:'Смородина',p:new T.Vector3(-8.2,.7,1.5),r:1.2,text:'Самые спелые ягоды всегда прячутся под листьями.'},
        {name:'Дрова',p:new T.Vector3(-10, .7,-6),r:1.1,text:'Дед сложил ещё весной. Чтобы зимой было тепло.'},
        {name:'Ведро',p:new T.Vector3(4.7,.3,-2.1),r:.45,text:'Эмалированное. С маленьким сколом, который здесь был всегда.'},
        {name:'Качели',p:new T.Vector3(-5,1.3,12.1),r:1,text:'Ещё чуть-чуть качаются. Кто-то только что убежал домой.'},
        {name:'Яблоня',p:new T.Vector3(12.6,3.1,6.5),r:2,text:'Пока кислые. Бабушка говорит: надо ещё подождать.'},
      ]
    };
  }
};

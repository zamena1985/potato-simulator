/* Procedural artwork for Potato Simulator. Three.js is vendored locally. */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T) { window.sceneError = 'Не удалось загрузить локальную 3D-библиотеку. Проверьте папку vendor.'; return; }
  let seed = 4719;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const between = (a,b) => a + rand() * (b-a);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const smooth = (a,b,t) => { const x = clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); };
  const material = (color, extra={}) => {const m=new T.MeshStandardMaterial({color,roughness:.92,flatShading:true,...extra});m.color.convertSRGBToLinear();m.emissive.convertSRGBToLinear();return m;};
  const M = {
    grass:material('#74875a'), dirt:material('#403d34'), bed:material('#aaa79d'), soilClod:material('#4a453b'), path:material('#b3a081'),
    wood:material('#867258'), woodDark:material('#504938'), woodLight:material('#a39270'),
    wall:material('#8d795d'), roof:material('#59695f'), blue:material('#729eab'), trim:material('#d6d8b7'),
    leaf:material('#4e7542',{side:T.DoubleSide}), leafLight:material('#6c8c4d',{side:T.DoubleSide}), stem:material('#5c7540'),
    birch:material('#d9d7bc'), bark:material('#505247'), canopy:material('#7f9958'), canopyLight:material('#9cac64'),
    flower:material('#f0e7c8'), center:material('#dcb34f'), terracotta:material('#966849'),
    metal:material('#647976',{metalness:.25,roughness:.52}), black:material('#343c35'),
    skin:material('#d9b58c'), dress:material('#6e7a91'), apron:material('#c0bea4'), scarf:material('#bb9389'),
    cat:material('#b99c70'), catDark:material('#775c42'), glass:material('#c0dac5',{transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide}),
    window:material('#456763',{emissive:'#f5b863',emissiveIntensity:0}),
    water:material('#b7e2d7',{transparent:true,opacity:.55,roughness:.2}),
    insect:material('#cf9a42'), insectBlack:material('#3b352b'), ball:material('#ba795e'),
    cloth:material('#dfd5b2',{side:T.DoubleSide}), clothBlue:material('#95aba9',{side:T.DoubleSide}),
  };
  let renderer;
  try {
    renderer = new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:true,alpha:false,powerPreference:'high-performance'});
  } catch (e) { window.sceneError = 'Браузер не смог включить 3D-графику. Откройте игру в Chrome или Edge с включённым аппаратным ускорением.'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new T.Scene();
  scene.fog = new T.Fog('#d9cdb0',25,80);
  const camera = new T.PerspectiveCamera(58,innerWidth/innerHeight,.06,130);
  camera.position.set(0,1.12,7.5);
  const hemi = new T.HemisphereLight('#e4edf1','#67685b',.94); scene.add(hemi);
  const sunlight = new T.DirectionalLight('#fff4e1',2.15); sunlight.position.set(-18,24,10);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048,2048);
  Object.assign(sunlight.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:75});
  sunlight.shadow.bias=-.0003; sunlight.shadow.normalBias=.035;
  sunlight.target.position.set(0,0,-3);scene.add(sunlight,sunlight.target);
  const fill = new T.DirectionalLight('#d9e5ec',.34);fill.position.set(12,10,-15);scene.add(fill);
  const staticRoot = new T.Group(); scene.add(staticRoot);
  const world = staticRoot;
  const geo = {box:new T.BoxGeometry(1,1,1),sphere:new T.IcosahedronGeometry(1,1),round:new T.SphereGeometry(1,10,7),cylinder:new T.CylinderGeometry(1,1,1,8),cone:new T.CylinderGeometry(.65,1,1,12),leaf:new T.SphereGeometry(1,8,5)};
  // Tapered thin leaves with a lifted midrib, rather than solid ellipsoids.
  const leafVertices=[],leafIndices=[],leafUV=[];
  for(let i=0;i<=10;i++){const x=-1+i/5,width=Math.pow(Math.max(0,1-x*x),.7);for(let j=0;j<3;j++){const side=j-1;leafVertices.push(x,(1-Math.abs(side))*.18+Math.sin(x*2)*.15,side*width);leafUV.push(i/10,j/2);}}
  for(let i=0;i<10;i++)for(let j=0;j<2;j++){const a=i*3+j;leafIndices.push(a,a+1,a+3,a+1,a+4,a+3);}
  geo.leaf=new T.BufferGeometry();geo.leaf.setAttribute('position',new T.Float32BufferAttribute(leafVertices,3));geo.leaf.setAttribute('uv',new T.Float32BufferAttribute(leafUV,2));geo.leaf.setIndex(leafIndices);geo.leaf.computeVertexNormals();
  function mesh(g,m,x,y,z,sx=1,sy=1,sz=1,parent=world){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(m,x,y,z,sx,sy,sz,p=world)=>mesh(geo.box,m,x,y,z,sx,sy,sz,p);
  const ball=(m,x,y,z,sx,sy=sx,sz=sx,p=world)=>mesh(geo.sphere,m,x,y,z,sx,sy,sz,p);
  function rod(m,a,b,r=.04,parent=world){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(geo.cylinder,m,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,d.length(),r,parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
  function torus(m,x,y,z,r,t,p=world){return mesh(new T.TorusGeometry(r,t,6,20),m,x,y,z,1,1,1,p);}
  function group(x=0,y=0,z=0,p=world){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
  const nature=SummerNature.create({T,M,geo,world,scene,material,mesh,ball,rod,group});
  const environment=SummerEnvironment.create({T,M,geo,world,scene,material,mesh,box,ball,rod,torus,group,rand,between,nature});
  // Batch static geometry by material to keep this quiet scene light on the GPU.
  function batch(root){
    root.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(root.matrixWorld).invert(), bins=new Map();
    root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));const key=o.material.uuid;if(!bins.has(key))bins.set(key,{m:o.material,p:[],n:[],uv:[]});const b=bins.get(key);b.p.push(g.attributes.position.array);b.n.push(g.attributes.normal.array);if(g.attributes.uv)b.uv.push(g.attributes.uv.array);g.dispose();});
    root.clear();
    const join=(arr)=>{const out=new Float32Array(arr.reduce((s,a)=>s+a.length,0));let at=0;for(const a of arr){out.set(a,at);at+=a.length;}return out;};
    for(const b of bins.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(join(b.p),3));g.setAttribute('normal',new T.BufferAttribute(join(b.n),3));if(b.uv.length===b.p.length)g.setAttribute('uv',new T.BufferAttribute(join(b.uv),2));g.computeBoundingSphere();const o=new T.Mesh(g,b.m);o.castShadow=true;o.receiveShadow=true;root.add(o);}return root;
  }
  const skyUniforms={top:{value:new T.Color('#8fbfc2')},horizon:{value:new T.Color('#ead7ad')}};
  const sky=new T.Mesh(new T.SphereGeometry(95,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 v;void main(){float h=clamp(normalize(v).y,0.0,1.0);gl_FragColor=vec4(mix(horizon,top,pow(h,.65)),1.0);}'}));scene.add(sky);
  // Gently uneven meadow, with patches of warm soil and a worn footpath.
  const land=new T.PlaneGeometry(160,160,44,44);land.rotateX(-Math.PI/2);
  const pos=land.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,-.08+Math.sin(x*.16)*Math.sin(z*.12)*.14);}land.computeVertexNormals();
  const ground=new T.Mesh(land,M.grass);ground.receiveShadow=true;world.add(ground);
  function soilStrip(x,z,width,length,mat,mound=false,angle=0){
    // Preserve the layout random stream when increasing only the soil resolution.
    const originalJitter=Array.from({length:(mound?13:7)*61},()=>between(-.009,.009));
    const g=new T.PlaneGeometry(width,length,mound?24:6,mound?150:60);g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const xx=p.getX(i),zz=p.getZ(i),edge=1-Math.abs(xx)/(width*.5);
      const h=mound?.025+Math.sin(Math.max(0,edge)*Math.PI*.5)*(.13+Math.sin(zz*3)*.02):.008;
      const uneven=mound?Math.sin(xx*22+zz*11)*Math.cos(zz*17-xx*9)*.012:0;
      p.setXYZ(i,xx+Math.sin(zz*.8+x)*.045,h+uneven+(mound?0:originalJitter[i]),zz);
    }
    g.computeVertexNormals();const patch=new T.Mesh(g,mat);patch.position.set(x,0,z);patch.rotation.y=angle;patch.receiveShadow=true;world.add(patch);
  }
  soilStrip(3.4,-1.3,2.6,24,M.path);
  soilStrip(-1.4,-5.4,2,11,M.path,false,Math.PI/2);
  for(let i=0;i<70;i++){const x=between(2.1,4.6),z=between(-11,10);const pebble=ball(i%3?M.woodLight:M.woodDark,x,.025,z,between(.025,.075),.025,between(.04,.09));pebble.rotation.y=rand()*6;}
  let earthSeed=8741;const earthBetween=(a,b)=>{earthSeed=(earthSeed*1664525+1013904223)>>>0;return a+(b-a)*earthSeed/4294967296;};
  for(const x of [-6,-3.6,-1.2,1.15]){
    soilStrip(x,3.4,1.85,11.8,M.bed,true);
    for(let i=0;i<180;i++){
      const sample=i<70?between:earthBetween;
      const xx=x+sample(-.85,.85),zz=sample(-2.4,9.3),sx=sample(.02,.07),sy=sample(.015,.045),sz=sample(.025,.055),edge=Math.max(0,1-Math.abs(xx-x)/.925);
      const h=.025+Math.sin(edge*Math.PI*.5)*(.13+Math.sin((zz-3.4)*3)*.02);
      const scale=i>65?.45:.8,clod=ball(i%3?M.dirt:M.soilClod,xx,h-.004,zz,sx*scale,sy*scale,sz*scale);clod.rotation.y=earthBetween(0,Math.PI);clod.rotation.z=earthBetween(-.2,.2);
    }
    for(const side of [-1,1])box(M.woodDark,x+side*.94,.12,9.25,.065,.24,.065).rotation.z=side*.08;
  }
  // Soft footprints in the packed earth: small dents, not a perfectly straight road.
  for(let i=0;i<26;i++){const x=3.2+(i%2)*.34+Math.sin(i*.4)*.09,z=-4.8+i*.45;const mark=ball(M.path,x,.009,z,.095,.006,.16);mark.rotation.y=between(-.25,.25);}
  // The log house. Windows face the bed; its porch feels close and lived in.
  const house=group(-5.3,0,-10);
  box(M.woodDark,0,.2,0,7.2,.4,5,house);
  box(M.wall,0,2,0,7,3.6,4.8,house);
  for(let i=0;i<15;i++){
    const y=.42+i*.225;
    rod(i%3?M.wall:M.wood,[-3.6,y,2.46],[3.6,y,2.46],.135,house);
    rod(M.wood,[-3.52,y,-2.5],[-3.52,y,2.6],.14,house);
    rod(M.wood,[3.52,y,-2.5],[3.52,y,2.6],.14,house);
  }
  const triangle=new T.Shape();triangle.moveTo(-2.6,0);triangle.lineTo(2.6,0);triangle.lineTo(0,2);triangle.closePath();
  for(const x of [-3.51,3.51]){const face=mesh(new T.ShapeGeometry(triangle),M.wood,x,3.7,0,1,1,1,house);face.rotation.y=Math.PI/2;face.material.side=T.DoubleSide;}
  const roofPitch=Math.atan2(2,2.8);
  const r1=box(M.roof,0,4.58,1.42,7.9,.14,3.5,house);r1.rotation.x=roofPitch;
  const r2=box(M.roof,0,4.58,-1.42,7.9,.14,3.5,house);r2.rotation.x=-roofPitch;
  for(let x=-3.8;x<4;x+=.43){rod(M.metal,[x,5.64,0],[x,3.5,3],.022,house);rod(M.metal,[x,5.64,0],[x,3.5,-3],.022,house);}
  box(M.terracotta,1.8,5.48,-.6,.6,1.8,.64,house);box(M.woodDark,1.8,6.37,-.6,.79,.12,.82,house);
  function windowAt(x){const z=2.66;box(M.blue,x,2.1,z,1.5,1.7,.13,house);box(M.window,x,2.1,z+.08,1.22,1.4,.025,house);for(const side of [-1,1]){box(M.trim,x+side*.61,2.1,z+.13,.09,1.44,.08,house);const shutter=box(M.blue,x+side*.99,2.1,z-.04,.4,1.5,.12,house);shutter.rotation.y=side*.15;for(let j=0;j<6;j++)box(M.woodLight,x+side*.99,1.52+j*.23,z+.035,.33,.025,.025,house);box(M.cloth,x+side*.36,2.08,z+.115,.3,1.27,.025,house);}
    box(M.trim,x,2.1,z+.13,.06,1.4,.06,house);box(M.trim,x,2.1,z+.13,1.24,.06,.06,house);box(M.trim,x,2.94,z,1.65,.16,.2,house);box(M.blue,x,3.06,z,1.35,.09,.16,house);box(M.trim,x,1.23,z+.05,1.7,.13,.3,house);
    for(let j=0;j<5;j++)ball(M.trim,x-.52+j*.26,3.15,z,.08,.12,.04,house);
    box(M.terracotta,x,1.14,z+.15,1.18,.19,.3,house);for(let j=0;j<5;j++){rod(M.stem,[x-.45+j*.22,1.22,z+.2],[x-.45+j*.22,1.5+rand()*.15,z+.2],.025,house);ball(M.scarf,x-.45+j*.22,1.5,z+.2,.12,.1,.12,house);}
  }
  windowAt(-1.9);windowAt(.2);
  box(M.woodDark,2.3,1.4,2.63,1.1,2.55,.14,house);for(let j=0;j<6;j++)box(M.wood,1.85+j*.17,1.4,2.72,.14,2.45,.03,house);ball(M.metal,1.95,1.4,2.8,.045,.045,.045,house);
  box(M.wood,2.3,.18,3.23,2,.35,1.4,house);box(M.wood,2.3,.08,4.12,2.3,.16,.5,house);
  for(const x of [1.4,3.2])rod(M.woodLight,[x,.3,3.75],[x,3.1,3.75],.065,house);
  box(M.roof,2.3,3.25,3.3,2.4,.12,1.8,house).rotation.x=.12;
  const lamp=ball(material('#e9c287',{emissive:'#ffbc63',emissiveIntensity:0}),2.95,2.5,2.85,.11,.15,.11,house);
  const porchLight=new T.PointLight('#ffb661',0,10,2);porchLight.position.set(-3,2.2,-6.9);scene.add(porchLight);
  // Bench, barrel and slippers near the porch.
  const bench=group(-8.5,0,-5.2);for(let i=0;i<3;i++){box(M.blue,0,.55,-.25+i*.22,2,.1,.18,bench);box(M.blue,0,.92+i*.18,-.45,2,.14,.07,bench);}for(const x of [-.75,.75]){box(M.woodDark,x,.28,0,.1,.56,.6,bench);box(M.woodDark,x,.85,-.45,.1,1,.1,bench);}
  const barrel=group(-9.55,0,-6.6);mesh(geo.cylinder,M.wood,.0,.55,0,.47,1.1,.47,barrel);for(const y of [.14,.9]){const ring=torus(M.metal,0,y,0,.48,.025,barrel);ring.rotation.x=Math.PI/2;}mesh(geo.cylinder,M.window,0,1.11,0,.44,.015,.44,barrel);
  for(const x of [-3.4,-3.08])ball(M.blue,x,.12,-5.7,.12,.07,.25);
  // Leaning bicycle: a small recognizable detail by the wall.
  const bike=group(-6.7,.48,-6.3);bike.rotation.y=-.15;
  for(const x of [-.65,.65]){torus(M.black,x,0,0,.46,.035,bike);torus(M.metal,x,0,0,.4,.012,bike);for(let j=0;j<8;j++){const a=j*Math.PI/4;rod(M.metal,[x,0,0],[x+Math.cos(a)*.4,Math.sin(a)*.4,0],.008,bike);}}
  for(const [a,b] of [[[.65,0,0],[.35,.8,0]],[[.35,.8,0],[-.2,.65,0]],[[-.2,.65,0],[-.65,0,0]],[[-.65,0,0],[0,0,0]],[[0,0,0],[-.2,.65,0]],[[0,0,0],[.35,.65,0]]])rod(M.blue,a,b,.025,bike);
  box(M.woodDark,-.2,.72,0,.35,.06,.2,bike);rod(M.metal,[.35,.8,0],[.3,.95,.25],.025,bike);
  // Shed and greenhouse across the path.
  const shed=group(8.5,0,-11);box(M.woodDark,0,1.25,0,4,2.5,3.5,shed);
  for(let i=0;i<18;i++)box(i%3?M.wood:M.woodLight,-1.92+i*.225,1.25,1.8,.2,2.45,.06,shed);
  box(M.roof,0,2.7,0,4.5,.15,4.2,shed).rotation.x=.12;
  box(M.woodDark,-.2,1.1,1.86,1.5,2.1,.07,shed);rod(M.woodLight,[-.9,.2,1.91],[.5,2,1.91],.05,shed);
  for(let i=0;i<5;i++)rod(M.woodLight,[2.3,.1,1.6],[2.2,1.3+i*.16,1],.04,shed);
  const greenhouse=group(9,0,-3.7);
  const greenhouseGlass=M.glass.clone();greenhouseGlass.opacity=.09;
  box(M.wood,0,.14,0,3.8,.28,5.5,greenhouse);
  for(const x of [-1.8,1.8])box(greenhouseGlass,x,1.25,0,.035,2.2,5.3,greenhouse);
  for(const z of [-2.65,2.65])box(greenhouseGlass,0,1.25,z,3.6,2.2,.035,greenhouse);
  for(let z=-2.65;z<=2.7;z+=1.32){for(const x of [-1.8,1.8]){rod(M.trim,[x,.2,z],[x,2.35,z],.035,greenhouse);rod(M.trim,[x,2.35,z],[0,3.15,z],.035,greenhouse);}rod(M.trim,[-1.8,.3,z],[1.8,.3,z],.03,greenhouse);}
  rod(M.trim,[0,3.15,-2.7],[0,3.15,2.7],.04,greenhouse);
  for(const side of [-1,1]){const g=box(greenhouseGlass,side*.9,2.75,0,1.98,.025,5.3,greenhouse);g.rotation.z=-side*.42;}
  // Keep the previous layout stream stable; crop details use their own seed.
  for(let i=0;i<36;i++)rand();
  const greenhouseCrops=SummerGreenhouse.plant({T,parent:greenhouse,M,material,mesh,box,rod,group});
  // Picket fence and the distant roofs beyond it.
  function fence(x,z,n,angle){const f=group(x,0,z);f.rotation.y=angle;for(let i=0;i<n;i++){const xx=i*.55,h=between(1.47,1.68),slat=group(xx,0,between(-.025,.025),f);slat.rotation.z=between(-.025,.025);box(i%5?M.woodLight:M.wood,0,h/2,0,.36,h,.075,slat);mesh(new T.ConeGeometry(.255,.17,4),M.woodLight,0,h+.06,0,1,1,.25,slat).rotation.y=Math.PI/4;for(const y of [.48,1.2])ball(M.woodDark,0,y,.043,.014,.014,.006,slat);}for(const y of [.48,1.2])box(M.wood,((n-1)*.55)/2,y,-.09,n*.55,.12,.1,f);}
  fence(-18,-15,67,0);fence(-18,-15,55,-Math.PI/2);fence(18,14,55,Math.PI/2);
  fence(-18,15.5,67,0);
  for(const x of [-26,22]){box(M.wood,x,1.4,-27,6,2.8,5);const roof=mesh(new T.ConeGeometry(4.8,2.2,4),M.roof,x,3.9,-27,1,1,1);roof.rotation.y=Math.PI/4;}
  // Birch trunks, broken bark markings, airy clusters of leaves.
  const tree=(x,z,h,birch=true)=>nature.tree(x,z,h,birch);
  tree(-11,1,7.8);tree(-13,4.5,8.3);tree(13,3,7.5);tree(15,-10,9);tree(-15,-10,8.5);
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;tree(Math.cos(a)*between(27,42),Math.sin(a)*between(27,42)-7,between(5,9),i%3===0);}
  nature.finishTrees();
  // Grass blades are instanced; the entire meadow costs one draw call.
  const bladeGeo=new T.BufferGeometry();bladeGeo.setAttribute('position',new T.Float32BufferAttribute([-.025,0,0,.025,0,0,-.009,.18,.015,.025,0,0,.02,.18,.015,-.009,.18,.015,-.009,.18,.015,.02,.18,.015,.055,.34,.07],3));bladeGeo.computeVertexNormals();
  const grassMat=material('#7c8c52',{side:T.DoubleSide});
  const grassWind={value:0},grassTime={value:0};
  for(const leafMat of [M.leaf,M.leafLight])leafMat.onBeforeCompile=shader=>{
    shader.uniforms.uPlantBreeze=grassWind;shader.uniforms.uPlantTime=grassTime;
    shader.vertexShader='uniform float uPlantBreeze;\nuniform float uPlantTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      transformed.y += sin(uPlantTime * 2.6 + position.x * 9.0 + position.z * 7.0) * sin(uv.x * 3.141593) * 0.006 * uPlantBreeze;
    `);
  };
  grassMat.onBeforeCompile=shader=>{
    shader.uniforms.uGrassWind=grassWind;shader.uniforms.uGrassTime=grassTime;
    shader.vertexShader='uniform float uGrassWind;\nuniform float uGrassTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 anchor = instanceMatrix[3].xyz;
      float tip = max(position.y, 0.0);
      transformed.x += tip * tip * (0.5 + sin(uGrassTime * 1.4 + anchor.x * 0.6 + anchor.z * 0.4)) * uGrassWind;
      transformed.z += tip * tip * cos(uGrassTime + anchor.z) * uGrassWind * 0.45;
    `);
  };
  const grass=new T.InstancedMesh(bladeGeo,grassMat,6000);const dummy=new T.Object3D();const grassColor=new T.Color();let gi=0;
  for(let i=0;i<6000;i++){let x=between(-20,20),z=between(-18,18);const inBed=x>-7&&x<2.15&&z>-2.7&&z<9.6;const path=x>1.95&&x<4.8;const nearHouse=z<-4.5&&z>-13&&x>-10&&x<-1.5;if(inBed||path||nearHouse){x=between(-17,-8);z=between(-3,15);}dummy.position.set(x,0,z);dummy.rotation.set(0,rand()*Math.PI*2,between(-.2,.2));dummy.scale.setScalar(between(.45,1.4));dummy.updateMatrix();grass.setMatrixAt(gi,dummy.matrix);grassColor.setHSL(.18+rand()*.055,.26+rand()*.1,.28+rand()*.15);grass.setColorAt(gi++,grassColor);}
  grass.receiveShadow=true;world.add(grass);
  // Plants nearest the player sway as a whole. The bed has a clear view corridor.
  const plants=[];
  function plant(x,z,s=1){const p=group(x,.16,z,scene);
    for(let shoot=0;shoot<3;shoot++){
      const a=shoot*2.1+between(-.25,.25),lean=shoot?.18:0,h=shoot?between(.48,.73):.82;
      const tip=new T.Vector3(Math.cos(a)*lean,h,Math.sin(a)*lean);
      rod(M.stem,[0,0,0],tip.toArray(),shoot?.012:.019,p);
      for(let j=0;j<4;j++){
        const y=.15+j*(h-.19)/4,angle=a+j*2.35,reach=between(.23,.34);
        const start=new T.Vector3(tip.x*y/h,y,tip.z*y/h),end=start.clone().add(new T.Vector3(Math.cos(angle)*reach,.03,Math.sin(angle)*reach));
        rod(M.stem,start.toArray(),end.toArray(),.007,p);
        const terminal=mesh(geo.leaf,j%3?M.leaf:M.leafLight,end.x,end.y,end.z,between(.14,.21),.12,between(.085,.12),p);terminal.rotation.set(between(-.2,.2),-angle,between(-.24,.24));
        for(const side of [-1,1]){
          const point=start.clone().lerp(end,.56);point.x+=Math.sin(angle)*side*.085;point.z-=Math.cos(angle)*side*.085;
          const l=mesh(geo.leaf,M.leaf,point.x,point.y,point.z,.12,.09,.075,p);l.rotation.y=-angle+side*.7;l.rotation.z=side*.2;
        }
      }
    }
    for(let j=0;j<3;j++){
      const a=j*2.1,fx=Math.cos(a)*.065,fz=Math.sin(a)*.065,y=.83+j*.025;
      rod(M.stem,[0,.7,0],[fx,y,fz],.006,p);
      for(let k=0;k<5;k++){const angle=k*Math.PI*2/5;const petal=mesh(geo.round,M.flower,fx+Math.cos(angle)*.027,y,fz+Math.sin(angle)*.027,.033,.008,.018,p);petal.rotation.y=-angle;}
      ball(M.center,fx,y+.012,fz,.012,.017,.012,p);
    }
    batch(p);p.scale.setScalar(s);plants.push({p,phase:rand()*6,base:s});return p;}
  for(const x of [-6,-3.6,-1.2,1.15])for(let z=-1.8;z<9;z+=1.55){if(Math.abs(x)<1.3&&z>5.5)continue;plant(x+between(-.15,.15),z,between(.85,1.3));}
  const heroPlant=plant(-.65,5.85,1.25);const rightPlant=plant(1.2,6.6,1.3);
  // The beetle's route uses the same curve as its supporting stem and petiole.
  const beetleStem=new T.CatmullRomCurve3([new T.Vector3(0,.08,0),new T.Vector3(0,.36,0),new T.Vector3(0,.62,0),new T.Vector3(.035,.69,.012),new T.Vector3(.13,.72,.046),new T.Vector3(.24,.73,.085)],false,'centripetal');
  mesh(new T.TubeGeometry(beetleStem,48,.012,8,false),M.stem,0,0,0,1,1,1,heroPlant);
  const beetleLeaf=mesh(geo.leaf,M.leafLight,.272,.73,.096,.19,.1,.11,heroPlant);beetleLeaf.rotation.y=-.25;
  const potato=SummerPotato.create({T,scene,material,batch});
  const visitors=SummerVisitors.create({T,scene,material,heroPlant,potato,beetleStem});
  const airlife=SummerAirlife.create({T,scene,material,batch,heroPlant});
  // Daisies and sunflowers around the garden edges.
  for(let i=0;i<38;i++){const x=i<20?between(-9,-7.3):between(5,7),z=between(-4,10),h=between(.17,.4);rod(M.stem,[x,0,z],[x,h,z],.008);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(M.flower,x+Math.cos(a)*.04,h,z+Math.sin(a)*.04,.04,.015,.025);}ball(M.center,x,h+.012,z,.025,.015,.025);}
  for(let i=0;i<6;i++){const x=5+i*.58,z=-13.8,h=between(1.9,2.6);rod(M.stem,[x,0,z],[x,h,z],.035);for(let j=0;j<8;j++){const a=j*Math.PI/4;ball(M.center,x+Math.cos(a)*.21,h+Math.sin(a)*.21,z,.12,.12,.06);}ball(M.woodDark,x,h,z+.04,.17,.17,.04);ball(M.leaf,x-.2,h*.5,z,.32,.08,.15);}
  // Laundry shifts gently on the line.
  const laundry=[];
  for(const x of [3.5,10.7])rod(M.wood,[x,0,-7],[x,2.8,-7],.07);
  rod(M.woodDark,[3.5,2.7,-7],[10.7,2.7,-7],.012);
  for(let i=0;i<4;i++){const c=group(4.2+i*1.65,2.68,-7,scene),height=i%2?1.12:1.46;
    const clothGeo=new T.PlaneGeometry(1.15,height,14,12),p=clothGeo.attributes.position;
    for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j);p.setXYZ(j,x,y-height/2,Math.sin(x*24+i)*.025*(1-(y/height+.5))+.04*Math.cos(x*4));}clothGeo.computeVertexNormals();
    mesh(clothGeo,i%2?M.clothBlue:M.cloth,0,0,0,1,1,1,c);for(const x of [-.45,.45])box(M.woodLight,x,0,0,.04,.14,.05,c);batch(c);laundry.push(c);}
  const grandmother=SummerGrandma.create({T,scene,material,batch}),grandma=grandmother.root;
  // The cat wanders in at the end, then curls up beside the path.
  const cat=group(0,0,0,scene);ball(M.cat,0,.24,0,.3,.23,.5,cat);ball(M.cat,0,.46,.35,.22,.2,.2,cat);
  for(const x of [-.13,.13]){mesh(new T.ConeGeometry(.09,.2,3),M.cat,x,.66,.34,1,1,.55,cat);ball(M.catDark,x*.65,.48,.53,.025,.03,.012,cat);}
  ball(M.catDark,0,.42,.55,.025,.02,.018,cat);for(const x of [-.16,.16])ball(M.cat,x,.08,.27,.1,.08,.2,cat);
  const tail=new T.Mesh(new T.TorusGeometry(.28,.07,6,14,Math.PI*1.3),M.cat);tail.position.set(.15,.3,-.38);tail.rotation.x=Math.PI/2;cat.add(tail);cat.visible=false;
  const football=ball(M.ball,0,.23,0,.23,.23,.23,scene);football.visible=false;for(let i=0;i<6;i++){const a=i*Math.PI/3;const patch=ball(M.trim,Math.cos(a)*.204,Math.sin(a)*.204,0,.07,.07,.04,football);}
  const clouds=[];const cloudMat=material('#f5e7ca',{transparent:true,opacity:.55,depthWrite:false});for(let i=0;i<9;i++){const c=group(between(-45,45),between(17,24),between(-50,-22),scene);for(let j=0;j<4;j++)ball(cloudMat,j*2,rand()*.6,0,between(2,3.5),between(.5,1),between(1,2),c);batch(c);clouds.push(c);}
  const chimneySmoke=SummerSmoke.create(T,scene);
  const storm=SummerStorm.create(T,scene);
  const particleCanvas=document.createElement('canvas');particleCanvas.width=32;particleCanvas.height=32;const particleContext=particleCanvas.getContext('2d');const particleGradient=particleContext.createRadialGradient(16,16,2,16,16,16);particleGradient.addColorStop(0,'rgba(255,255,255,1)');particleGradient.addColorStop(.4,'rgba(255,255,255,.7)');particleGradient.addColorStop(1,'rgba(255,255,255,0)');particleContext.fillStyle=particleGradient;particleContext.fillRect(0,0,32,32);const particleTexture=new T.CanvasTexture(particleCanvas);
  const waterCount=160,waterPositions=new Float32Array(waterCount*3),waterGeo=new T.BufferGeometry();waterGeo.setAttribute('position',new T.BufferAttribute(waterPositions,3));const drops=new T.Points(waterGeo,new T.PointsMaterial({color:'#e6f6db',map:particleTexture,size:.055,transparent:true,opacity:.8,depthWrite:false}));scene.add(drops);drops.visible=false;
  const motePositions=new Float32Array(100*3);for(let i=0;i<100;i++){motePositions[i*3]=between(-10,10);motePositions[i*3+1]=between(.3,4);motePositions[i*3+2]=between(-5,12);}
  const moteGeo=new T.BufferGeometry();moteGeo.setAttribute('position',new T.BufferAttribute(motePositions,3));const motes=new T.Points(moteGeo,new T.PointsMaterial({color:'#ffefb1',map:particleTexture,size:.035,transparent:true,opacity:.55,depthWrite:false}));scene.add(motes);
  // Keep instances outside the static batch.
  world.remove(grass);batch(world);scene.add(grass);
  const focusTargets=[
    {name:'Дом',p:new T.Vector3(-5.3,2.1,-7.2),r:2.4,text:'За этим окном всегда кто-нибудь дома.'},
    {name:'Велосипед',p:new T.Vector3(-6.7,.7,-6.3),r:.85,text:'Брошен у крыльца. Значит, Миша ещё где-то рядом.'},
    {name:'Берёзы',p:new T.Vector3(-11,4,1),r:2.3,text:'Листья шепчутся о чём-то своём.'},
    {name:'Бельё на верёвке',p:new T.Vector3(6.6,2,-7),r:1.5,text:'До вечера высохнет. Пахнет ветром и солнцем.'},
    {name:'Кот',p:new T.Vector3(),r:.5,text:'Кажется, на сегодня у него тоже никаких планов.',visible:()=>cat.visible},
    {name:'Картофелина',p:potato.root.position,r:.3,text:'Тёплая земля на кожуре, маленькие глазки. Растём потихоньку.'},
    ...environment.focusTargets,
    {name:'Теплица',p:new T.Vector3(9,1.3,-3.7),r:1.8,text:'Помидоры наливаются на кустах, огурцы прячутся среди плетей.'},
  ];
  let wiggleAt=-10,lastShadow=-1;const view={yaw:-.14,pitch:.08,fov:64};
  const dayTop=new T.Color('#9bc7ca'),nightTop=new T.Color('#596a84'),dayHorizon=new T.Color('#e9d4a6'),nightHorizon=new T.Color('#d8a188');
  const dayFog=new T.Color('#d9cdb0'),nightFog=new T.Color('#9e8e88');
  const sunDay=new T.Color('#fff4e1').convertSRGBToLinear(),sunDusk=new T.Color('#edc4a2').convertSRGBToLinear();
  const stormTop=new T.Color('#43525f'),stormHorizon=new T.Color('#889594'),stormFog=new T.Color('#86918c'),flashTint=new T.Color('#cbd8e2');
  const clearCloud=new T.Color('#f5e7ca').convertSRGBToLinear(),stormCloud=new T.Color('#87918f').convertSRGBToLinear();
  function render(t,real,motion=true,flashes=true){
    const weather=storm.update(t,real,flashes),wind=SummerWeather.windAt(real),breeze=SummerWeather.motionAt(real)+weather.rain*.3;grassWind.value=breeze;grassTime.value=real;
    environment.update(t,real,wind);
    nature.update(t,real,wind);
    const dusk=smooth(160,360,t),pulse=Math.max(0,1-(real-wiggleAt)/1.4),shake=Math.sin((real-wiggleAt)*28)*pulse;
    skyUniforms.top.value.copy(dayTop).lerp(nightTop,dusk);skyUniforms.horizon.value.copy(dayHorizon).lerp(nightHorizon,dusk);scene.fog.color.copy(dayFog).lerp(nightFog,dusk);
    sunlight.intensity=2.15-dusk*1.45;sunlight.position.y=24-dusk*17;sunlight.color.copy(sunDay).lerp(sunDusk,dusk);hemi.intensity=.94-dusk*.3;fill.intensity=.34+dusk*.08;
    skyUniforms.top.value.lerp(stormTop,weather.cloud*.92).lerp(flashTint,weather.flash*.14);skyUniforms.horizon.value.lerp(stormHorizon,weather.cloud*.85);scene.fog.color.lerp(stormFog,weather.cloud*.75);
    sunlight.intensity*=1-weather.cloud*.78;hemi.intensity*=1-weather.cloud*.3;cloudMat.color.copy(clearCloud).lerp(stormCloud,weather.cloud);cloudMat.opacity=.55+weather.cloud*.18;
    M.window.emissiveIntensity=smooth(275,310,t)*1.6;lamp.material.emissiveIntensity=smooth(280,310,t)*2;porchLight.intensity=smooth(280,310,t)*1.5;
    for(const {p,phase} of plants){p.rotation.z=(Math.sin(real*1.1+phase)+Math.sin(real*.47+phase)*.3)*.065*breeze;p.rotation.x=Math.cos(real*.7+phase)*.045*breeze;if(p===heroPlant)p.rotation.z+=shake*.1;}
    potato.update(shake);visitors.update(t,real);
    airlife.update(t,real,weather.rain);
    for(let i=0;i<laundry.length;i++){laundry[i].rotation.x=Math.sin(real*.8+i)*.1*breeze;laundry[i].rotation.z=Math.sin(real*.5+i)*.04*breeze;}
    chimneySmoke.update(real,breeze);
    for(let i=0;i<clouds.length;i++)clouds[i].position.x+=Math.sin(i+real*.008)*.0006;
    grandmother.update(t,real);
    drops.visible=t>=141&&t<163;
    if(drops.visible){const source=grandmother.waterSource();for(let i=0;i<waterCount;i++){const p=((real*1.5+i/waterCount)%1);waterPositions[i*3]=source.x+(1.35-source.x)*p+Math.sin(i*6.3)*p*.09;waterPositions[i*3+1]=source.y-.08*p-(source.y-.13)*p*p;waterPositions[i*3+2]=source.z+(2.7-source.z)*p+Math.cos(i*7.7)*p*.12;}waterGeo.attributes.position.needsUpdate=true;}
    football.visible=t>=226&&t<241;if(football.visible){const k=(t-226)/15;football.position.set(8-k*12,.23+Math.abs(Math.sin(k*22))*.12,1-k*.7);football.rotation.x=t*1.8;football.rotation.z=-t;}
    cat.visible=t>=275;if(cat.visible){const k=smooth(275,299,t);cat.position.set(6-k*3.5,.02,-1+k*3);cat.rotation.y=-1.6;cat.scale.y=t>300?.85:1;tail.rotation.z=Math.sin(real*.8)*.13;focusTargets[4].p.copy(cat.position).y=.4;}
    for(let i=0;i<100;i++){motePositions[i*3+1]+=.0007;if(motePositions[i*3+1]>4)motePositions[i*3+1]=.3;}moteGeo.attributes.position.needsUpdate=true;motes.material.opacity=.35+dusk*.25;
    const shadowTick=Math.floor(real*2);if(shadowTick!==lastShadow){renderer.shadowMap.needsUpdate=true;lastShadow=shadowTick;}
    camera.position.set(Math.sin(real*.4)*(motion?.012:0)+shake*.008,1.12+Math.sin(real*.6)*(motion?.008:0),7.5);
    const direction=new T.Vector3(Math.sin(view.yaw)*Math.cos(view.pitch),Math.sin(view.pitch),-Math.cos(view.yaw)*Math.cos(view.pitch));camera.lookAt(camera.position.clone().add(direction));camera.fov+=(view.fov-camera.fov)*.1;camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  window.SummerScene={scene,camera,renderer,view,render,nature,potato,visitors,heroPlant,beetleStem,chimneySmoke,grandmother,storm,airlife,
    resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();},
    wiggle(real){wiggleAt=real;airlife.scare(real);return visitors.scare(real);},
    lookAtBed(){view.yaw=-.36;view.pitch=-.56;view.fov=40;},
    lookAtVisitor(){const p=visitors.info().position,d=p.clone().sub(camera.position).normalize();view.yaw=Math.atan2(d.x,-d.z);view.pitch=Math.asin(d.y);view.fov=40;},
    reset(){wiggleAt=-10;visitors.reset();airlife.reset();view.yaw=-.14;view.pitch=.08;view.fov=64;},
    focus(){const direction=new T.Vector3();camera.getWorldDirection(direction);let best=null,score=0;for(const target of focusTargets){if(target.visible&&!target.visible())continue;const v=target.p.clone().sub(camera.position);const distance=v.length();const dot=v.normalize().dot(direction);const threshold=Math.cos(Math.atan2(target.r,distance));if(dot>threshold&&dot>score){best=target;score=dot;}}return best;},
    stats(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,grandma:grandma.visible,water:drops.visible,cat:cat.visible,beetle:visitors.models.beetle.root.visible,visitor:visitors.info(),windowLight:M.window.emissiveIntensity};}
  };
})();

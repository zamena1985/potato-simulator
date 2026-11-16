/* Soft, irregular chimney smoke. Local procedural texture; no opaque puff meshes. */
window.SummerSmoke={
  create(T,scene){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const nx=(x-63.5)/63.5,ny=(y-63.5)/63.5;
      const noise=.5+.18*Math.sin(nx*8+Math.cos(ny*6))+.13*Math.sin(ny*13-nx*6)+.07*Math.cos(nx*23+ny*17);
      const radius=Math.sqrt(nx*nx+ny*ny),edge=Math.max(0,1-radius);
      const alpha=Math.min(1,edge*edge*2.7)*(.38+noise*.62),shade=175+noise*70,i=(y*128+x)*4;
      pixels.data.set([shade,shade,shade,alpha*255],i);
    }
    ctx.putImageData(pixels,0,0);const map=new T.CanvasTexture(canvas);map.encoding=T.sRGBEncoding;
    const puffs=[],origin=new T.Vector3(-3.5,6.44,-10.6),dark=new T.Color('#60615e'),light=new T.Color('#9c9d94');
    for(let i=0;i<28;i++){const mat=new T.SpriteMaterial({map,color:dark,transparent:true,depthWrite:false,opacity:0,toneMapped:false});const puff=new T.Sprite(mat);scene.add(puff);puffs.push(puff);}
    const smooth=(a,b,v)=>{const k=Math.max(0,Math.min(1,(v-a)/(b-a)));return k*k*(3-2*k);};
    function update(real,wind){
      for(let i=0;i<puffs.length;i++){
        const phase=(real/11+i/puffs.length)%1,p=puffs[i],spread=.28+phase*1.15;
        p.position.copy(origin).add(new T.Vector3(Math.pow(phase,1.35)*(1.1+wind*1.7)+Math.sin(real*.65+phase*11)*phase*.19,phase*4.5,Math.sin(real*.35+phase*7)*phase*.32));
        p.scale.set(spread*(1+.12*Math.sin(i*2.3+real*.4)),spread*1.18,1);
        p.material.rotation=i*2.399+real*.055;
        p.material.opacity=.58*smooth(0,.035,phase)*(1-smooth(.15,1,phase));
        p.material.color.copy(dark).lerp(light,smooth(.1,.95,phase));
      }
    }
    return {puffs,origin,update};
  }
};

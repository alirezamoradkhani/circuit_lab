import * as T from '../engine/three.js';
function grain(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle='#d4c9ad';c.fillRect(0,0,256,256);
  let seed=79;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<8500;i++){
    c.fillStyle=random()>.5?'#40372612':'#fff5d718';
    c.fillRect(random()*256,random()*256,random()*3+.3,random()*2+.3);
  }
  for(let i=0;i<130;i++){
    c.strokeStyle='#4f493018';c.lineWidth=random()*.7+.2;c.beginPath();
    const x=random()*256,y=random()*256;c.moveTo(x,y);c.lineTo(x+random()*24,y+random()*3);c.stroke();
  }
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function makeMaterials(){
  const map=grain();
  const make=(color,roughness=.94)=>new T.MeshStandardMaterial({color,roughness,metalness:.08,map,bumpMap:map,bumpScale:.025});
  return {plaster:make('#c4b99b'),dark:make('#514c42'),rust:make('#986448'),brass:make('#bb9c61'),
    green:make('#829078'),wood:make('#9d825c'),floor:make('#aaa18a'),cream:make('#e7dfc4'),
    ink:make('#2f3938'),blue:make('#667e7b'),glass:new T.MeshStandardMaterial({color:'#bbcfba',roughness:.7,emissive:'#9baf87',emissiveIntensity:.25}),
    light:new T.MeshStandardMaterial({color:'#f3dc94',emissive:'#ffcc72',emissiveIntensity:1.6}),
    cable:new T.MeshStandardMaterial({color:'#514a35',roughness:1}),
    live:new T.MeshStandardMaterial({color:'#d2a95d',roughness:.75,emissive:'#6b4917',emissiveIntensity:.5}),
    paper:make('#eee0b8'),red:make('#a85940')};
}
export function plaque(text,color='#ded0a6',ink='#403b30',width=256,height=80){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,width,height);
  c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(5,5,width-10,height-10);
  c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='bold '+Math.floor(height*.39)+'px Tahoma';
  c.fillText(text,width/2,height/2,width-20);
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map:t,roughness:1,side:T.DoubleSide});
}

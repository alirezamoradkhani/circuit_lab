import {box,cylinder,ball,rod,ring} from '../../visual/shapes.js';
export function propAsset(root,m,e){
 const style=e.config.visual??'toolbox';
 if(style==='hat'){cylinder(root,m.wood,0,.04,0,.35,.06);cylinder(root,m.wood,0,.16,0,.22,.22);}
 else if(style==='key'){ring(root,m.brass,0,.08,0,.1,.025).rotation.x=Math.PI/2;rod(root,m.brass,[.1,.08,0],[.4,.08,0],.025);box(root,m.brass,.34,.08,.07,.04,.04,.15);}
 else if(style==='boat'){box(root,m.blue,0,.08,0,.65,.15,.3);rod(root,m.wood,[0,.12,0],[0,.65,0],.025);box(root,m.paper,.14,.4,0,.25,.3,.025);}
 else if(style==='papers'||style==='receipt'){for(let i=0;i<(style==='papers'?4:1);i++){const p=box(root,m.paper,(i%2)*.12,.02+i*.018,0,.35,.01,.5);p.rotation.y=i*.4;}}
 else if(style==='spoon'){rod(root,m.brass,[0,.02,0],[.4,.02,0],.018);const bowl=ball(root,m.brass,.47,.02,0,.1);bowl.scale.y=.2;}
 else if(style==='flower'){cylinder(root,m.rust,0,.12,0,.17,.24);rod(root,m.green,[0,.24,0],[0,.65,0],.025);for(let i=0;i<5;i++)ball(root,m.cream,Math.cos(i*1.25)*.1,.65+Math.sin(i*1.25)*.1,0,.08);}
 else if(style==='table'){box(root,m.wood,0,.75,0,1.8,.13,.85);for(const x of [-.75,.75])for(const z of [-.3,.3])rod(root,m.dark,[x,0,z],[x,.7,z],.04);}
 else if(style==='rail'){for(const x of [-.4,.4])rod(root,m.dark,[x,0,-1.2],[x,0,1.2],.045);for(let i=0;i<6;i++)box(root,m.wood,0,-.04,-1+i*.4,1,.08,.1);}
 else if(style==='wall')box(root,m.plaster,0,1.2,0,2.5,2.4,.2);
 else if(style==='pipe'){rod(root,m.rust,[0,.1,0],[0,1,0],.09);rod(root,m.rust,[0,1,0],[.7,1,0],.09);}
 else if(style==='landing'||style==='bumper'){box(root,style==='bumper'?m.dark:m.wood,0,.12,0,1.4,.24,1);}
 else if(style==='statue'){cylinder(root,m.wood,0,.12,0,.4,.24);box(root,m.dark,0,.7,0,.45,.8,.35);ball(root,m.brass,0,1.3,0,.27);}
 else {box(root,style==='module'?m.green:m.rust,0,.18,0,.6,.36,.4);rod(root,m.brass,[-.15,.4,0],[.15,.4,0],.035);if(style==='transmitter')rod(root,m.dark,[.2,.3,0],[.2,.9,0],.015);}
 return {};
}

import {box,cylinder,ball,rod,ring,group} from '../../visual/shapes.js';
import {createRobot} from '../../visual/Robot.js';
// Silhouette, tools and clothing identify roles even without colour.
export function characterAsset(parent,m,entity){
 const role=entity.config.appearance??(entity.id==='ray'?'ray':entity.kind==='Guard'?'guard':entity.kind==='Companion'?(entity.id==='pakro'?'cleaner':'companion'):'worker');
 if(role==='ray'){
  const robot=createRobot(parent,m);robot.root.userData.appearance=role;
  m.blue.color.set('#397d7b');box(robot.body,m.blue,0,.86,.08,.48,.11,.48);
  const scarf=box(robot.body,m.blue,-.2,.68,-.34,.14,.4,.045);scarf.rotation.z=-.18;
  const rim=ring(robot.root,m.brass,0,.025,0,.43,.024);rim.rotation.x=-Math.PI/2;
  return robot;
 }
 const root=group(parent),body=group(root),head=group(body),arms=[],legs=[];root.userData.appearance=role;
 if(role==='guard'||role==='cleaner'){
  m.blue.color.set('#527a79');m.red.color.set('#b66b49');
  cylinder(body,m.dark,0,.2,0,.44,.25);cylinder(body,role==='guard'?m.blue:m.green,0,.59,0,.36,.62,.46);
  for(const x of [-.43,.43]){const wheel=cylinder(root,m.ink,x,.18,0,.2,.15);wheel.rotation.z=Math.PI/2;ring(root,m.brass,x,.18,.08,.09,.023).rotation.y=Math.PI/2;}
  head.position.y=1.02;box(head,m.dark,0,0,0,.72,.28,.48);box(head,m.brass,0,.16,0,.86,.06,.57);
  const eye=ball(head,m.light,0,0,.26,.09);ring(head,m.rust,0,0,.27,.14,.036);box(head,m.red,0,.26,0,.13,.13,.13);
  box(body,m.cream,0,.61,.4,.3,.14,.035);rod(body,m.rust,[-.39,.8,0],[-.65,.28,.35],.045);
  box(root,m.wood,-.66,.08,.38,.52,.13,.24);for(let i=0;i<7;i++)rod(root,m.brass,[-.88+i*.075,.03,.34],[-.88+i*.075,.02,.5],.012);
  box(body,m.dark,0,.63,-.4,.4,.4,.22);
 }else if(role==='companion'){
  m.blue.color.set('#729aaa');cylinder(body,m.blue,0,.35,0,.27,.4,.32);head.position.y=.73;
  ball(head,m.cream,0,0,0,.3);for(const x of [-.12,.12]){ring(head,m.dark,x,.02,.25,.075,.023);ball(head,m.light,x,.02,.28,.045);}
  for(const x of [-.17,.17]){box(root,m.rust,x,.09,.05,.2,.15,.3);rod(head,m.brass,[x,.22,0],[x*1.2,.43,0],.017);ball(head,m.blue,x*1.2,.44,0,.04);}
  box(body,m.blue,0,.38,-.25,.25,.27,.15);
 }else{
  m.green.color.set('#687458');cylinder(body,m.green,0,.77,0,.29,.62,.4);box(body,m.wood,0,.7,.28,.45,.5,.075);
  for(const x of [-.22,.22]){rod(root,m.dark,[x,.51,0],[x,.13,0],.06);box(root,m.dark,x,.06,.05,.2,.12,.32);rod(body,m.brass,[x*1.7,1,0],[x*1.8,.55,.1],.045);}
  head.position.y=1.32;box(head,m.cream,0,0,0,.46,.4,.4);cylinder(head,m.rust,0,.23,0,.35,.1);cylinder(head,m.wood,0,.35,0,.22,.2);
  for(const x of [-.11,.11]){ring(head,m.dark,x,0,.22,.07,.018);ball(head,m.light,x,0,.23,.035);}
  box(head,m.rust,0,-.12,.24,.26,.035,.05);box(body,m.paper,.11,.76,.34,.15,.12,.02);
 }
 return {root,body,head,arms,legs};
}

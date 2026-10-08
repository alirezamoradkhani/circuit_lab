import * as T from '../engine/three.js';
import {box,cylinder,ball,rod,ring,group} from './shapes.js';
export function createRobot(parent,m,cleaner=false){
  const root=group(parent,cleaner?null:'battery'),body=group(root),legs=[],arms=[];
  const shell=cleaner?m.green:m.cream;
  cylinder(body,shell,0,.61,0,.31,.45,.36);
  ring(body,m.rust,0,.64,.303,.21,.025);
  box(body,m.ink,0,.66,.32,.3,.12,.035);
  for(let i=0;i<3;i++)box(body,m.brass,-.085+i*.085,.66,.345,.04,.055,.02);
  cylinder(body,m.dark,0,.88,0,.1,.12);
  const head=group(body);head.position.y=1.08;
  cylinder(head,shell,0,0,0,.31,.34,.29);
  cylinder(head,m.rust,0,.18,0,.335,.045);
  box(head,m.ink,0,.012,.265,.43,.16,.075);
  for(const x of [-.11,.11]){
    const eye=ball(head,m.light,x,.025,.312,.053);eye.scale.y=.8;
    ring(head,m.brass,x,.025,.31,.066,.012);
  }
  box(head,m.dark,0,-.105,.283,.11,.018,.018);
  rod(head,m.rust,[.12,.18,0],[.17,.37,0],.018);ball(head,m.brass,.17,.38,0,.04);
  for(const sign of [-1,1]){
    const leg=group(root);leg.position.set(sign*.17,.38,0);
    cylinder(leg,m.dark,0,-.105,0,.067,.22);ball(leg,m.rust,0,-.2,0,.076);
    box(leg,shell,0,-.3,.045,.19,.13,.32);legs.push(leg);
    const arm=group(body);arm.position.set(sign*.37,.78,0);
    ball(arm,m.rust,0,0,0,.09);rod(arm,m.dark,[0,-.04,0],[sign*.06,-.25,.015],.055);
    ball(arm,m.brass,sign*.06,-.25,.015,.074);
    rod(arm,m.rust,[sign*.06,-.25,.015],[sign*.02,-.42,.08],.04);
    for(const a of [-.045,.045])rod(arm,shell,[sign*.02+a,-.42,.08],[sign*.02+a,-.49,.13],.02);
    arms.push(arm);
  }
  box(body,m.rust,0,.62,-.31,.32,.32,.16);
  if(cleaner){
    const battery=group(arms[1]);box(battery,m.brass,0,-.35,.2,.3,.4,.24);
    box(battery,m.dark,0,-.35,.33,.25,.045,.025);
    box(battery,m.light,0,-.24,.33,.08,.05,.025);
  }
  return {root,head,body,legs,arms};
}
export function animateRobot(robot,time,moving,pose=false){
  const wave=Math.sin(time*11)*(moving?1:0);
  robot.legs.forEach((leg,i)=>leg.rotation.x=wave*(i?-.42:.42));
  robot.arms.forEach((arm,i)=>arm.rotation.x=pose?(i?-.9:-.6):wave*(i?.35:-.35));
  robot.body.position.y=moving?Math.abs(Math.sin(time*11))*.025:Math.sin(time*2)*.009;
  robot.head.rotation.z=pose?Math.sin(time*3)*.16:Math.sin(time*1.2)*.025;
}

import {WorkshopScene} from './visual/WorkshopScene.js';
import {WorkshopHUD} from './ui/WorkshopHUD.js';
import {WorkshopAudio} from './engine/WorkshopAudio.js';
import {Movement} from './engine/Movement.js';
import {bindWorkshopInput} from './engine/input.js';
import {InteractionController} from './workshop/InteractionController.js';
import {freshState,restoreState,snapshot,resetObjects,SAVE_KEY,tick,powered} from './workshop/state.js';
export class WorkshopGame {
  constructor(root){
    this.root=root;this.abort=new AbortController();this.active=false;this.saved=true;this.time=0;this.saveTime=0;
    try{this.storage=window.localStorage;this.state=restoreState(JSON.parse(this.storage.getItem(SAVE_KEY)));}
    catch{this.state=freshState();this.saved=false;}
    this.intro=this.state.started?9:0;this.save();
    this.hud=new WorkshopHUD(root,action=>this.action(action));
    this.scene=new WorkshopScene(this.hud.world);
    this.audio=new WorkshopAudio();this.movement=new Movement(this);
    this.interactions=new InteractionController(this);this.interactions.setTool('hand');
    bindWorkshopInput(this);
    this.frame=this.frame.bind(this);
    if(this.state.completed)this.hud.showDialog('complete',this.state,this.saved);
  }
  save(){
    try{this.storage?.setItem(SAVE_KEY,JSON.stringify(snapshot(this.state)));this.saved=!!this.storage;}
    catch{this.saved=false;}
  }
  setActive(active){
    this.active=active;cancelAnimationFrame(this.raf);this.movement.clear();
    if(active){if(this.state.completed&&!this.hud.dialog.open)this.hud.showDialog('complete',this.state,this.saved);this.last=performance.now();this.scene.resize();this.raf=requestAnimationFrame(this.frame);}
    else{this.save();this.audio.suspend();if(this.hud.dialog.open)this.hud.closeDialog();}
  }
  action(action){
    if(!this.active)return;this.audio.unlock();
    if(action==='close'){this.hud.closeDialog();this.last=performance.now();return;}
    if(action==='begin'){
      this.state.started=true;this.intro=0;this.save();this.scene.renderer.domElement.focus({preventScroll:true});return;
    }
    if(action==='skip'){this.intro=5;this.hud.message('نورا: باتری یدکی کجاست؟… فعلاً خودت باتری داری.');return;}
    if(action==='view'){this.scene.toggleOverview();return;}
    if(action==='sound'){
      const enabled=this.audio.toggle();
      this.root.querySelector('[data-story-action="sound"]').setAttribute('aria-pressed',String(!enabled));return;
    }
    if(action==='lab'){this.hud.closeDialog();document.querySelector('[data-mode="lab"]').click();return;}
    if(action==='restart'){
      this.hud.closeDialog();this.state=freshState();this.intro=0;this.time=0;
      this.movement.clear();this.interactions.setTool('hand');this.hud.bubble.hidden=true;this.save();return;
    }
    if(action==='recover'){
      this.hud.closeDialog();resetObjects(this.state);this.movement.clear();this.interactions.setTool('hand');this.save();
      this.hud.message('وسایل بازچینی شدند؛ چیزهایی که پیدا کرده‌ای همراهت هستند.');return;
    }
    if(['help','reset','bag','circuit'].includes(action)){
      this.movement.clear();this.save();this.hud.showDialog(action,this.state,this.saved);return;
    }
    if(action==='hint'){
      if(this.hud.dialog.open)this.hud.closeDialog();this.interactions.hint();return;
    }
    if(action==='interact'&&this.state.completed){this.hud.showDialog('complete',this.state,this.saved);return;}
    if(!this.state.started||this.intro<4.6||this.state.completed)return;
    if(['hand','cable','meter'].includes(action)){this.interactions.setTool(action);return;}
    if(action==='battery'){this.interactions.setTool('cable');this.interactions.object('battery');return;}
    if(action==='disconnect'){this.interactions.unplug();return;}
    if(action==='interact'){
      const id=this.interactions.nearest();if(id)this.interactions.object(id);
    }
  }
  events(events){
    const messages={cart:'راه باز شد! پریز و قرقرهٔ پشت چرخ‌دستی را ببین.',door:'تق! ضامن باز شد؛ حالا کرکره بدون برق هم باز می‌ماند.',
      empty:'باتری خالی شد. کابل را جدا کن و کنار پریز شارژ بگیر.',secret:'♫ شیفت صبح! رادیو بالاخره همکارش را پیدا کرد.'};
    for(const event of events){
      if(event==='cart')this.interactions.selected=null;
      this.audio.play(event);
      if(messages[event])this.hud.message(messages[event],event==='empty'?'error':'success',6);
      if(event==='complete'){this.movement.clear();this.hud.showDialog('complete',this.state,this.saved);}
      this.save();
    }
  }
  frame(now){
    if(!this.active)return;
    const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
    if(!document.hidden){
      const paused=this.hud.dialog.open||!this.state.started||this.focusPaused;
      if(!paused){
        this.time+=dt;
        if(this.intro<4.6){
          this.intro+=dt;
          if(this.intro>=4.6)this.hud.message('نورا: باتری یدکی کجاست؟… فعلاً خودت باتری داری.', 'info',6);
        }else{
          this.movement.update(dt);this.events(tick(this.state,dt));
          this.audio.music(this.time,powered(this.state,'radio'));
        }
        this.saveTime+=dt;if(this.saveTime>1.5){this.save();this.saveTime=0;}
      }
      this.scene.render(this.state,this.time,this.movement.moving||this.state.pushing,this.intro,this.interactions.selected,paused?0:dt);
      this.hud.update(this.state,this.scene,this.interactions.tool,this.interactions.selected,this.interactions.nearest(),this.intro,paused?0:dt);
    }
    this.raf=requestAnimationFrame(this.frame);
  }
  dispose(){this.setActive(false);this.abort.abort();this.scene.dispose();this.audio.dispose();}
}

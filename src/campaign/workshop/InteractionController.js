import {HintProgress} from './hints.js';
import {connect,disconnect,interact,measure} from './actions.js';
import {NAMES,available,walkPoint,distance,PORTS,portPosition} from './layout.js';
export class InteractionController {
  constructor(game){this.game=game;this.tool='hand';this.selected=null;this.hints=new HintProgress();}
  setTool(tool){
    this.tool=tool;this.selected=null;this.game.hud.setTool(tool);
    this.game.movement.path=[];this.game.movement.arrive=null;
  }
  result(result){this.game.hud.message(result.message,result.ok?'info':'error');this.game.audio.play(result.sound);this.game.save();}
  object(id){
    const g=this.game,s=g.state;if(!available(id,s)||s.pushing||s.completed)return;
    if(this.tool==='meter'){g.hud.message(measure(s,id),'meter',7);this.selected=id;return;}
    if(this.tool==='cable'){
      if(!['battery','mains','lamp','radio','latch'].includes(id))return;
      if(!this.selected){this.selected=id;g.hud.message(NAMES[id]+' انتخاب شد؛ حالا سر دیگر کابل را بزن.');return;}
      const from=this.selected;this.selected=null;
      const target=from==='battery'?id:id==='battery'?from:null;
      if(target&&PORTS[target]&&distance(s.player,portPosition(target,s))>2.65){
        g.movement.go(walkPoint(target,s),()=>this.result(connect(s,from,id)));return;
      }
      this.result(connect(s,from,id));return;
    }
    if(id==='battery'){this.setTool('cable');this.selected='battery';return;}
    this.selected=id;
    g.movement.go(walkPoint(id,s),()=>{this.result(interact(s,id));if(!available(id,s))this.selected=null;});
  }
  nearest(){
    const s=this.game.state;let nearest=null,best=1.3;
    for(const id of ['cart','receipt','reel','mains','latch','lamp','radio','exit']){
      if(!available(id,s))continue;
      const d=distance(s.player,walkPoint(id,s));
      if(d<best){best=d;nearest=id;}
    }
    return nearest;
  }
  unplug(){
    if(this.selected){this.result(disconnect(this.game.state,this.selected));this.selected=null;}
  }
  hint(){
    this.game.hud.message(this.hints.next(this.game.state),'info',12);
  }
}

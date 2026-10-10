export class GameAudio {
  constructor(){this.enabled=true;this.context=null;this.masterGain=null;this.compressor=null;this.lastNote=0;this.loops=new Map();}
  unlock(){
    if(!this.enabled)return;
    try{this.context??=new (window.AudioContext||window.webkitAudioContext)();
      if(!this.masterGain){
        this.masterGain=this.context.createGain();
        this.masterGain.gain.setValueAtTime(2.2,this.context.currentTime);
        this.compressor=this.context.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-10,this.context.currentTime);
        this.compressor.knee.setValueAtTime(6,this.context.currentTime);
        this.compressor.ratio.setValueAtTime(12,this.context.currentTime);
        this.compressor.attack.setValueAtTime(0.001,this.context.currentTime);
        this.compressor.release.setValueAtTime(0.18,this.context.currentTime);
        this.masterGain.connect(this.compressor).connect(this.context.destination);
      }
      this.context.resume().catch(()=>{});}catch{}
  }
  tone(frequency,duration=.12,type='sine',volume=.14){
    if(!this.enabled||this.context?.state!=='running')return;
    const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.015);
    gain.gain.linearRampToValueAtTime(volume*.85,start+duration*.4);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain).connect(this.masterGain??ctx.destination);osc.start();osc.stop(start+duration+.02);
  }
  play(name){
    const sounds={plug:[330,.12],unplug:[165,.09],door:[220,.55],paper:[850,.07],pickup:[520,.15],push:[85,.22],empty:[110,.28],complete:[660,.7],secret:[784,.4]};
    const [hz,duration]=sounds[name]||[440,.06];this.tone(hz,duration,name==='push'?'triangle':'sine');
  }
  music(time,playing){
    if(!playing||time-this.lastNote<.36)return;
    this.lastNote=time;const melody=[262,330,392,330,294,349,440,392];
    this.tone(melody[Math.floor(time/.36)%melody.length],.29,'triangle',.075);
  }
  equipment(id,kind,intensity=0){
    if(!this.context||this.context.state!=='running'||!this.enabled)intensity=0;
    let loop=this.loops.get(id);
    if(!loop&&intensity>0){
      const osc=this.context.createOscillator(),gain=this.context.createGain();
      osc.type=kind==='Fan'?'triangle':'sine';osc.connect(gain).connect(this.masterGain??this.context.destination);gain.gain.value=0;osc.start();
      loop={osc,gain};this.loops.set(id,loop);
    }
    if(loop){loop.osc.frequency.setTargetAtTime((kind==='Pump'?65:90)+Math.max(0,intensity)*90,this.context.currentTime,.08);loop.gain.gain.setTargetAtTime(Math.min(1,Math.max(0,intensity))*.04,this.context.currentTime,.08);}
  }
  toggle(){this.enabled=!this.enabled;if(this.enabled)this.unlock();else for(const id of this.loops.keys())this.equipment(id,'',0);return this.enabled;}
  suspend(){this.context?.suspend().catch(()=>{});}
  dispose(){for(const {osc} of this.loops.values())osc.stop();this.loops.clear();this.context?.close().catch(()=>{});}
}

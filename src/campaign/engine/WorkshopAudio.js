export class WorkshopAudio {
  constructor(){this.enabled=true;this.context=null;this.lastNote=0;}
  unlock(){
    if(!this.enabled)return;
    try{this.context??=new (window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{}
  }
  tone(frequency,duration=.12,type='sine',volume=.035){
    if(!this.enabled||this.context?.state!=='running')return;
    const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(start+duration+.02);
  }
  play(name){
    const sounds={plug:[330,.12],unplug:[165,.09],door:[220,.55],paper:[850,.07],pickup:[520,.15],push:[85,.22],empty:[110,.28],complete:[660,.7],secret:[784,.4]};
    const [hz,duration]=sounds[name]||[440,.06];this.tone(hz,duration,name==='push'?'triangle':'sine');
  }
  music(time,playing){
    if(!playing||time-this.lastNote<.36)return;
    this.lastNote=time;const melody=[262,330,392,330,294,349,440,392];
    this.tone(melody[Math.floor(time/.36)%melody.length],.29,'triangle',.018);
  }
  toggle(){this.enabled=!this.enabled;if(this.enabled)this.unlock();return this.enabled;}
  suspend(){this.context?.suspend().catch(()=>{});}
  dispose(){this.context?.close().catch(()=>{});}
}

export class ProgressiveHints {
 constructor(resolve){this.resolve=resolve;this.reset();}
 reset(){this.key=null;this.index=0;}
 next(state){
  const advice=this.resolve(state);
  if(this.key!==advice.key){this.key=advice.key;this.index=0;}
  const messages=[advice.clue,...advice.steps];
  return messages[Math.min(this.index++,messages.length-1)];
 }
}

export const deviceLabels={backup:['چراغ','تهویه','بی‌سیم','گرم‌کن'],pumps:['پمپ اول','پمپ دوم','روشنایی'],radio:['مقاومت بالا','مقاومت پایین','گیرنده']};
export function fail(s,message){s.mistakes++;s.message=message;return false;}
export function finish(s){s.won=true;s.message=s.mission.success;return true;}
export function parallelBoard(s,powers){
  const b=s.board;b.parts=[];b.wires=[];b.serial=0;
  const source=b.add('battery'),sw=b.add('switch');sw.closed=true;
  b.connect(source.id+':0',sw.id+':0');
  return powers.map((power,i)=>{const p=b.add('resistor');p.value=144/power;p.label=deviceLabels[s.mission.id][i];b.connect(sw.id+':1',p.id+':0');b.connect(p.id+':1',source.id+':1');return p;});
}
export const extraSpecs={
 ...Object.fromEntries(['feeder','isolation','transfer','bridge'].map(id=>[id,{id,parts:{battery:1,switch:1,resistor:1}}])),
  backup:{id:'backup',parts:{battery:1,switch:1,resistor:4}},
  pumps:{id:'pumps',parts:{battery:1,switch:1,resistor:3}},
  radio:{id:'radio',parts:{battery:1,switch:1,resistor:3}},
};

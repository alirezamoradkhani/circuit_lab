import {measureCircuit} from './CircuitMeter.js';
const names={battery:'منبع',switch:'کلید',lamp:'لامپ',resistor:'مقاومت'};
export function measurePart(session,id){
  const part=session.board.parts.find(p=>p.id===id);if(!part)return null;
  const board={parts:session.board.parts.map(p=>session.tripped&&p.type==='switch'?{...p,closed:false}:p),wires:session.board.wires};
  const m=measureCircuit(board),a=m.terminals?.[id+':0'],b=m.terminals?.[id+':1'];
  const voltage=Number.isFinite(a)&&Number.isFinite(b)?Math.abs(a-b):null;
  return {id,name:part.label||names[part.type],voltage,current:['lamp','resistor'].includes(part.type)?part.disconnected?0:voltage===null?null:voltage/part.value:null,error:m.short?'اتصال کوتاه؛ اندازه‌گیری معتبر نیست.':voltage===null?'پایانهٔ شناور؛ اختلاف ولتاژ مشخص نیست.':''};
}
export function componentMeterView(s){
  if(s.tool!=='meter')return '';
  let r=measurePart(s,s.meteredPart);
  if(Number.isInteger(s.meteredWire)&&s.board.wires[s.meteredWire]){
    const m=measureCircuit(s.board);r={name:'سیم',voltage:m.short?null:0,current:null,error:m.short?'اتصال کوتاه؛ اندازه‌گیری معتبر نیست.':'اختلاف ولتاژ دو سر سیم ایده‌آل صفر است.'};
  }
  if(!r)return '<div class="component-meter" role="status">⌁ روی بدنهٔ یک قطعه بزن تا ولتاژ دو سر آن را بخوانی.</div>';
  return `<div class="component-meter" role="status" aria-live="polite"><strong>${r.name}</strong><output dir="ltr">${r.voltage===null?'—':r.voltage.toFixed(2)} V</output>${r.current===null?'':`<span dir="ltr">I = ${r.current.toFixed(2)} A</span>`}<small>${r.error||'ولتاژ دو سر قطعه'+(r.current===null?'':' · جریان محاسبه‌شده')}</small></div>`;
}

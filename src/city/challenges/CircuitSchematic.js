import {deviceLabels} from './common.js';

const escape = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const number = value => Number(value.toFixed(2)).toLocaleString('en-US', {maximumFractionDigits:2});

// Layouts describe electrical nodes, not one arbitrary detour for every wire.
// Terminal groups are checked against the actual mission graph in the tests.
export function schematicLayout(s) {
  const parts = s.board.parts;
  const nodes = [];
  const place = (index,x,y,axis='v',width=126) => {
    const part = parts[index];
    const half = axis==='v' ? 28 : width/2;
    const ports = axis==='v' ? [[x,y-half],[x,y+half]] : [[x-half,y],[x+half,y]];
    nodes.push({part,x,y,width,ports});
    return nodes.at(-1);
  };
  const nets = [];
  const wire = (terminals,paths,dots=[]) => nets.push({terminals,paths,dots});
  const t = (i,end) => `${parts[i].id}:${end}`;
  const id = s.mission.id;

  if (!['radio','feeder','bridge'].includes(id)) {
    const source=place(0,92,60,'h',100);
    place(1,286,60,'h',100);
    // Positive source terminal faces the main switch.
    source.ports.reverse();
    const rows=parts.slice(2).map((_,i)=>place(i+2,200,148+i*78,'h',144));
    rows.forEach(row=>row.ports.reverse());
    const last=rows.at(-1).y;
    wire([t(0,0),t(1,0)], [[[142,60],[236,60]]]);
    wire([t(1,1),...rows.map((_,i)=>t(i+2,0))], [
      [[336,60],[376,60],[376,last]],
      ...rows.map(row=>[[376,row.y],row.ports[0]])
    ],rows.slice(0,-1).map(row=>[376,row.y]));
    wire([t(0,1),...rows.map((_,i)=>t(i+2,1))], [
      [[42,60],[24,60],[24,last]],
      ...rows.map(row=>[[24,row.y],row.ports[1]])
    ],rows.slice(0,-1).map(row=>[24,row.y]));
    return {width:400,height:last+54,nodes,nets};
  }

  const bridge=id==='bridge', height=bridge?430:id==='radio'?370:294;
  const source=place(0,58,height/2,'v',96);
  place(1,158,54,'h',100);
  wire([t(0,0),t(1,0)], [[source.ports[0],[58,54],[108,54]]]);
  if (id==='radio') {
    place(2,220,144,'v',120);place(3,220,282,'v',120);place(4,354,282,'v',112);
    wire([t(1,1),t(2,0)], [[[208,54],[220,54],[220,116]]]);
    wire([t(2,1),t(3,0),t(4,0)], [
      [[220,172],[220,254]], [[220,214],[354,214],[354,254]]
    ],[[220,214]]);
    wire([t(0,1),t(3,1),t(4,1)], [
      [source.ports[1],[58,342],[354,342],[354,310]], [[220,310],[220,342]]
    ],[[220,342]]);
    return {width:424,height,nodes,nets};
  }
  if (id==='feeder') {
    place(2,320,54,'h',128);place(3,220,192,'v',120);place(4,354,192,'v',112);
    wire([t(1,1),t(2,0)], [[[208,54],[256,54]]]);
    wire([t(2,1),t(3,0),t(4,0)], [
      [[384,54],[402,54],[402,120],[220,120],[220,164]], [[354,120],[354,164]]
    ],[[354,120]]);
    wire([t(0,1),t(3,1),t(4,1)], [
      [source.ports[1],[58,266],[354,266],[354,220]], [[220,220],[220,266]]
    ],[[220,266]]);
    return {width:424,height,nodes,nets};
  }
  place(2,220,148,'v',104);place(3,220,326,'v',104);
  place(4,372,148,'v',104);place(5,372,326,'v',104);
  place(6,296,237,'h',104);
  wire([t(1,1),t(2,0),t(4,0)], [
    [[208,54],[266,54],[266,92],[220,92],[220,120]], [[266,92],[372,92],[372,120]]
  ],[[266,92]]);
  wire([t(2,1),t(3,0),t(6,0)], [
    [[220,176],[220,298]], [[220,237],[244,237]]
  ],[[220,237]]);
  wire([t(4,1),t(5,0),t(6,1)], [
    [[372,176],[372,298]], [[348,237],[372,237]]
  ],[[372,237]]);
  wire([t(0,1),t(3,1),t(5,1)], [
    [source.ports[1],[58,398],[372,398],[372,354]], [[220,354],[220,398]]
  ],[[220,398]]);
  return {width:440,height,nodes,nets};
}

export function challengeSchematic(s) {
  const layout=schematicLayout(s);
  const wires=layout.nets.map(net=>net.paths.map(points=>`<path d="M${points.map(p=>p.join(' ')).join('L')}"/>`).join('')).join('');
  const dots=layout.nets.flatMap(net=>net.dots).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.5"/>`).join('');
  const components=layout.nodes.map(({part:p,x,y,width,ports},i)=>{
    const label=p.label || (i===0?'منبع':i===1?(s.challenge.modern?'کلید اصلی':'محافظ'):deviceLabels[s.mission.id]?.[i-2]);
    const open=p.disconnected || p.type==='switch' && (s.tripped || !p.closed);
    const value=p.type==='battery'?`${number(p.value)} V`:p.type==='switch'?(open?'قطع':'وصل'):s.challenge.modern||s.mission.id==='radio'?`${number(p.value)} Ω${open?' · قطع':''}`:(open?'قطع':'وصل');
    const measure=s.tool==='meter';
    return `<g class="schematic-part ${open?'is-open':''} ${s.meteredPart===p.id?'meter-selected':''} ${measure?'meter-component':''}" ${measure?`data-measure-part="${p.id}" role="button" tabindex="0" aria-label="اندازه‌گیری ${escape(label)}"`:''}>
      <rect class="schematic-body ${p.type==='battery'?'schematic-source':''}" x="${x-width/2}" y="${y-28}" width="${width}" height="56" rx="6"/>
      <text class="schematic-name" x="${x}" y="${y-6}" text-anchor="middle">${escape(label)}</text>
      <text class="schematic-value" x="${x}" y="${y+16}" text-anchor="middle" direction="ltr">${escape(value)}</text>
      ${ports.map(([px,py],end)=>`<circle class="schematic-terminal" cx="${px}" cy="${py}" r="3"><title>${escape(label)} · پایانه ${end+1}</title></circle>`).join('')}
    </g>`;
  }).join('');
  return `<div class="circuit-diagram-scroll schematic-scroll"><svg class="repair-wiring challenge-circuit city-schematic" viewBox="0 0 ${layout.width} ${layout.height}" style="--schematic-width:${layout.width}px" role="group" aria-label="مدار مأموریت؛ نقطه‌های پر محل اتصال سیم‌ها هستند"><g class="schematic-wires">${wires}</g><g class="schematic-junctions">${dots}</g>${components}</svg></div>`;
}

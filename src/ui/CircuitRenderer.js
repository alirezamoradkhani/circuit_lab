export class CircuitRenderer {
  constructor(svg) { this.svg = svg; }
  drawBasic(state) {
    this.svg.innerHTML = `<defs><filter id="glow"><feGaussianBlur stdDeviation="10"/></filter></defs>
      ${this.wire(110,95,260,95,state.connected[0])}${this.wire(340,95,435,95,state.switchClosed)}${this.wire(510,95,580,95,state.connected[1])}${this.wire(620,95,700,95,state.connected[1])}
      ${this.wire(700,95,700,300,state.connected[1])}${this.wire(700,340,700,370,state.connected[2])}${this.wire(700,370,390,370,state.connected[2])}
      ${this.wire(310,370,110,370,state.connected[2])}${this.wire(110,370,110,220,state.connected[0])}${this.battery(110,182)}
      ${this.lamp(390,370,state.basicPowered)}${this.gap(300,95,40,26,0,state.connected[0])}${this.gap(580,95,40,26,1,state.connected[1])}${this.gap(350,370,40,26,2,state.connected[2])}
      ${this.switch(470,95,state.switchClosed)}`;
  }
  drawOhm(state) {
    const passed=state.ohmPassed; this.svg.innerHTML=`<defs><filter id="glow"><feGaussianBlur stdDeviation="10"/></filter></defs>
      ${this.wire(120,220,230,220,true)}${this.wire(670,220,780,220,true)}${this.wire(120,220,120,330,true)}${this.wire(780,220,780,330,true)}${this.wire(120,330,780,330,true)}
      ${this.battery(120,270)}${this.resistor(390,330)}${this.lamp(500,220,passed)}
      <text x="390" y="388" class="component-label" text-anchor="middle">R = ${state.resistance} Ω</text><text x="500" y="175" class="component-label" text-anchor="middle">لامپ هدف: ۳ آمپر</text>`;
  }
  drawSeries(state) {
    const parallel = state.seriesPassed;
    const topology = parallel
      ? `${this.wire(100,270,280,270,true)}${this.wire(280,270,280,155,true)}${this.wire(280,155,450,155,true)}${this.wire(450,155,450,175,true)}${this.wire(280,270,280,365,true)}${this.wire(280,365,450,365,true)}${this.wire(450,365,450,345,true)}${this.wire(450,155,650,155,true)}${this.wire(650,155,650,270,true)}${this.wire(450,365,650,365,true)}${this.wire(650,365,650,270,true)}${this.wire(650,270,800,270,true)}${this.wire(800,270,800,390,true)}${this.wire(800,390,100,390,true)}${this.wire(100,390,100,300,true)}`
      : `${this.wire(100,270,250,270,true)}${this.wire(250,270,340,270,true)}${this.wire(500,270,590,270,true)}${this.wire(590,270,800,270,true)}${this.wire(800,270,800,390,true)}${this.wire(800,390,100,390,true)}${this.wire(100,390,100,300,true)}`;
    const lamps = parallel ? `${this.lamp(450,155,true)}${this.lamp(450,365,true)}` : `${this.lamp(420,270,true)}${this.lamp(660,270,false)}`;
    const explanation = parallel ? 'موازی: هر لامپ شاخهٔ مستقل دارد و جریان بین شاخه‌ها تقسیم می‌شود.' : 'سری: هر دو لامپ در یک مسیر هستند و جریان از هر دو عبور می‌کند.';
    this.svg.innerHTML = `${topology}${this.battery(100,270)}${lamps}<text x="450" y="425" class="component-label" text-anchor="middle">${explanation}</text><text x="450" y="62" class="component-value" text-anchor="middle">${parallel ? 'آرایش موازی فعال است' : 'آرایش سری فعال است'}</text>`;
  }

  drawKcl(state) {
    const passed=state.kclPassed;
    this.svg.innerHTML=`${this.wire(120,230,345,230,true)}${this.wire(450,230,780,230,true)}${this.wire(450,230,450,125,true)}${this.wire(450,230,450,340,true)}${this.battery(120,230)}<circle cx="398" cy="230" r="34" class="node-circle"/><text x="398" y="237" text-anchor="middle" class="component-value">گره</text><text x="450" y="106" text-anchor="middle" class="component-label">خروجی I₂ = ${state.kclOutA} A</text><text x="450" y="380" text-anchor="middle" class="component-label">خروجی I₃ = ${state.kclOutB} A</text><text x="210" y="205" text-anchor="middle" class="component-label">ورودی I₁ = ${state.kclIn} A</text><text x="650" y="205" text-anchor="middle" class="component-label">${passed?'Σ جریان‌ها برابر است ✓':'جریان باید در گره حفظ شود'}</text>`;
  }
  drawKvl(state) {
    const passed=state.kvlPassed;
    this.svg.innerHTML=`${this.wire(130,150,760,150,true)}${this.wire(760,150,760,350,true)}${this.wire(760,350,130,350,true)}${this.wire(130,350,130,150,true)}${this.battery(130,250)}${this.resistor(350,150)}${this.resistor(550,150)}<text x="350" y="105" text-anchor="middle" class="component-label">افت V₁ = ${state.kvlDropA} V</text><text x="550" y="105" text-anchor="middle" class="component-label">افت V₂ = ${state.kvlDropB} V</text><text x="450" y="415" text-anchor="middle" class="component-label">منبع = ${state.kvlSource} V · ${passed?'جمع افت‌ها برابر منبع است ✓':'جمع افت‌ها باید با منبع برابر شود'}</text>`;
  }
  drawDirection(state) {
    const forward=state.direction==='forward';
    this.svg.innerHTML=`${this.wire(120,260,780,260,true)}${this.battery(120,260)}${this.lamp(780,260,forward)}<text x="450" y="150" text-anchor="middle" class="component-value">${forward?'جهت قراردادی: + به −':'جهت انتخاب‌شده برعکس است'}</text><g data-action="direction"><rect x="330" y="180" width="240" height="58" rx="14" class="switch-base"/><text x="450" y="216" text-anchor="middle" class="component-value">↔ تغییر جهت جریان</text></g><text x="450" y="350" text-anchor="middle" class="component-label">در مدار خارجی، جهت قراردادی جریان از قطب مثبت به منفی است.</text>`;
  }
  drawPolarity(state) {
    const normal=state.polarity==='normal';
    this.svg.innerHTML=`${this.wire(130,150,770,150,true)}${this.wire(770,150,770,350,true)}${this.wire(770,350,130,350,true)}${this.wire(130,350,130,150,true)}${this.battery(130,250)}${this.resistor(450,150)}<g data-action="polarity"><rect x="340" y="245" width="220" height="58" rx="14" class="switch-base"/><text x="450" y="281" text-anchor="middle" class="component-value">${normal?'قطبش عادی + / −':'قطبش برعکس − / +'}</text></g><text x="450" y="410" text-anchor="middle" class="component-label">قطبش، جهت فرضی ولتاژ بین دو پایانه است.</text>`;
  }
  drawPower(state) {
    const passed=state.powerPassed;
    this.svg.innerHTML=`${this.wire(120,220,780,220,true)}${this.wire(780,220,780,350,true)}${this.wire(780,350,120,350,true)}${this.wire(120,350,120,220,true)}${this.battery(120,285)}${this.lamp(450,220,passed)}<text x="450" y="115" text-anchor="middle" class="component-value">P = V × I = ${state.powerVoltage*state.powerCurrent} W</text><text x="450" y="410" text-anchor="middle" class="component-label">هدف: توان ۱۲ وات</text>`;
  }
  drawCompare(state) {
    const parallel=state.compare==='parallel';
    this.svg.innerHTML=`${parallel?`${this.wire(120,270,280,270,true)}${this.wire(280,270,280,155,true)}${this.wire(280,155,680,155,true)}${this.wire(280,270,280,365,true)}${this.wire(280,365,680,365,true)}${this.wire(680,155,680,270,true)}${this.wire(680,365,680,270,true)}${this.wire(680,270,780,270,true)}`:`${this.wire(120,270,780,270,true)}`}${this.wire(780,270,780,390,true)}${this.wire(780,390,120,390,true)}${this.wire(120,390,120,300,true)}${this.battery(120,270)}${this.lamp(parallel?480:330,parallel?155:270,true)}${this.lamp(parallel?480:365,parallel?365:270,parallel)}<text x="450" y="90" text-anchor="middle" class="component-value">${parallel?'موازی: دو شاخهٔ مستقل':'سری: یک مسیر مشترک'}</text><g data-action="compare"><rect x="340" y="190" width="220" height="55" rx="14" class="switch-base"/><text x="450" y="225" text-anchor="middle" class="component-value">تغییر آرایش</text></g>`;
  }
  wire(x1,y1,x2,y2,active=false){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wire ${active?'active':''}"/>`;}
  gap(x,y,w,h,i,on){const tone=on?'connected-hit':'';const terminal=on?'connected':'';const mark=on?'✓':i+1;return `<g data-gap="${i}"><rect x="${x}" y="${y-h/2}" width="${w}" height="${h}" rx="9" class="gap-hit ${tone}"/><circle cx="${x+5}" cy="${y}" r="6" class="terminal ${terminal}"/><circle cx="${x+w-5}" cy="${y}" r="6" class="terminal ${terminal}"/><text x="${x+w/2}" y="${y+5}" text-anchor="middle" class="component-value">${mark}</text></g>`;}
  battery(x,y){return `<g><rect x="${x-22}" y="${y-30}" width="44" height="60" rx="8" class="battery"/><line x1="${x-11}" y1="${y-9}" x2="${x+11}" y2="${y-9}" stroke="#6ca8ff" stroke-width="5"/><line x1="${x-7}" y1="${y+10}" x2="${x+7}" y2="${y+10}" stroke="#6ca8ff" stroke-width="5"/><text x="${x+36}" y="${y+5}" class="component-label">باتری ۹V</text></g>`;}
  lamp(x,y,on){return `${on?`<circle cx="${x}" cy="${y}" r="46" class="lamp-glow" filter="url(#glow)"/>`:''}<circle cx="${x}" cy="${y}" r="30" class="lamp-bulb ${on?'on':''}"/><path d="M${x-13},${y-13} l26,26 M${x+13},${y-13} l-26,26" stroke="${on?'#6d5420':'#91a8c2'}" stroke-width="4"/><text x="${x}" y="${y+62}" text-anchor="middle" class="component-label">لامپ</text>`;}
  resistor(x,y){return `<g><path d="M${x-72},${y} h20 l10,-18 20,36 20,-36 20,36 20,-36 10,18 h20" fill="none" stroke="#ffd468" stroke-width="7" stroke-linejoin="round"/><text x="${x}" y="${y+52}" class="component-label" text-anchor="middle">مقاومت متغیر</text></g>`;}
  switch(x,y,closed){return `<g data-action="switch"><rect x="${x-50}" y="${y-42}" width="100" height="84" rx="14" class="switch-base"/><line x1="${x-30}" y1="${y}" x2="${x+30}" y2="${closed?y:y-28}" class="switch-arm"/><circle cx="${x-30}" cy="${y}" r="7" class="terminal connected"/><circle cx="${x+30}" cy="${y}" r="7" class="terminal connected"/><text x="${x}" y="${y+62}" text-anchor="middle" class="component-label">${closed?'کلید بسته':'کلید باز'}</text></g>`;}
}




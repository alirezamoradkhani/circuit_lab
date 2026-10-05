export class CircuitState {
  constructor() { this.reset(); }
  reset() { this.connected=[false,false,false]; this.switchClosed=false; this.voltage=9; this.resistance=3; this.arrangement='series'; this.direction='forward'; this.polarity='normal'; this.powerVoltage=6; this.powerCurrent=1; this.compare='series'; this.kclIn=5; this.kclOutA=2; this.kclOutB=2; this.kvlSource=12; this.kvlDropA=7; this.kvlDropB=4; this.moves=0; }
  get basicPowered(){return this.connected.every(Boolean)&&this.switchClosed;}
  get current(){return this.voltage/this.resistance;}
  get ohmPassed(){return Math.abs(this.current-3)<0.26;}
  get seriesPassed(){return this.arrangement==='parallel';}
  get directionPassed(){return this.direction==='forward';} get polarityPassed(){return this.polarity==='normal';} get powerPassed(){return this.powerVoltage*this.powerCurrent===12;} get comparePassed(){return this.compare==='parallel';} get kclPassed(){return this.kclIn===this.kclOutA+this.kclOutB;}
  get kvlPassed(){return this.kvlSource===this.kvlDropA+this.kvlDropB;}
  toggleGap(index){this.connected[index]=!this.connected[index];this.moves++;}
  toggleSwitch(){this.switchClosed=!this.switchClosed;this.moves++;}
}


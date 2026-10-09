// Campaign contracts from docs/game-plan/01..12. Instances always own their state.
export const presets=Object.freeze({
 mains:{type:'Source',voltage:12,maxWatts:24,portable:false},
 limitedMains:{type:'Source',voltage:12,maxWatts:12,portable:false},
 backup:{type:'Source',voltage:12,maxWatts:12,portable:false},
 battery:{type:'Battery',voltage:12,maxWatts:12,capacity:72},
 capacitor:{type:'Capacitor',voltage:12,maxWatts:12,capacitance:1,cutoff:6,efficiency:.9},
 charger:{type:'Charger',watts:24},guardDock:{type:'HoldingCoil',watts:6,visual:'charger'},gardenCharger:{type:'HoldingCoil',watts:6,visual:'charger'}, companionDock:{type:'TimedDevice',watts:6,duration:1},
 lamp:{type:'Lamp',watts:3},workLamp:{type:'Lamp',watts:6},beamLamp:{type:'BeamLamp',watts:6},
 radio:{type:'Radio',watts:3},sign:{type:'Sign',watts:3,confetti:true},heater:{type:'Heater',watts:12},
 fan:{type:'Fan',speeds:[6,12]},ventilation:{type:'Fan',speeds:[3,6,9]},pump:{type:'Pump',startWatts:18,runningWatts:6,startSeconds:1},
 latch:{type:'PulseLatch',watts:6,duration:1},holder:{type:'HoldingCoil',watts:6},
 elevator:{type:'Platform',startWatts:24,runningWatts:18,startSeconds:1,travelSeconds:3},
 craneRail:{type:'Platform',startWatts:12,runningWatts:6,startSeconds:1,travelSeconds:3},
 conveyor:{type:'Conveyor',watts:6},magnet:{type:'Magnet',watts:12},
 actuator:{type:'Platform',startWatts:24,runningWatts:18,startSeconds:1,travelSeconds:3},
 bench:{type:'RepairBench',watts:6,duration:6},
 switch:{type:'Switch'},breaker:{type:'Breaker'},selector:{type:'SourceSelector'},socket:{type:'Socket'},
 cable:{type:'Cable',length:2.65},reel:{type:'Cable',length:20,visual:'reel'},damagedCable:{type:'Cable',length:20,damaged:true},hose:{type:'Hose',length:20},
 resistor:{type:'Resistor',ohms:12,rating:6},divider:{type:'Divider'},antenna:{type:'Antenna'},receiver:{type:'Receiver',resistance:12,targetVoltage:4,tolerance:.08},
 cart:{type:'Cart'},woodCrate:{type:'RailCrate',material:'wood',weight:2},metalCrate:{type:'RailCrate',material:'metal',weight:2},
 basin:{type:'WaterBasin'},plate:{type:'PressurePlate'},jack:{type:'Jack',weight:2},
 door:{type:'Door'},bridge:{type:'Bridge'},ladder:{type:'Ladder'},canopy:{type:'Canopy'},
 mirror:{type:'Mirror'},sensor:{type:'LightSensor'},fog:{type:'Fog',blocksLight:true},
 ray:{type:'Actor'},worker:{type:'Actor'},guard:{type:'Guard'},companion:{type:'Companion'},ride:{type:'PathRide'},sequence:{type:'Sequence'},
 receipt:{type:'Prop',visual:'receipt'},key:{type:'Prop',visual:'key'},hat:{type:'WindProp',visual:'hat',threshold:.5},boat:{type:'Prop',visual:'boat'},
 transmitter:{type:'Prop',visual:'transmitter'},module:{type:'Prop',visual:'module'},toolbox:{type:'Prop',visual:'toolbox',weight:1},
 papers:{type:'WindProp',visual:'papers',threshold:.1,lockAtEnd:false},spoon:{type:'Prop',visual:'spoon',material:'metal'},flower:{type:'Prop',visual:'flower'},
 table:{type:'Prop',visual:'table',portable:false},rail:{type:'Prop',visual:'rail',portable:false},
 wall:{type:'Prop',visual:'wall',portable:false,blocksLight:true},pipe:{type:'Prop',visual:'pipe',portable:false},
 landing:{type:'Prop',visual:'landing',portable:false},bumper:{type:'Prop',visual:'bumper',portable:false},statue:{type:'Prop',visual:'statue',portable:false}
});
export function componentSpec(preset,id,overrides={}){
 if(!presets[preset])throw new TypeError('Unknown preset: '+preset);
 return {...structuredClone(presets[preset]),...structuredClone(overrides),id};
}

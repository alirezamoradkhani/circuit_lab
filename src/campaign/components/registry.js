import {Source,Battery,Capacitor} from './electrical/Source.js';
import {Lamp,Radio,Heater,Sign,HoldingCoil,TimedDevice,PulseLatch,RepairBench,Charger} from './electrical/Loads.js';
import {Motor,Fan,Pump} from './electrical/Motor.js';
import {Switch,Breaker,SourceSelector,Cable,Hose,Socket} from './electrical/Connections.js';
import {Resistor,Divider,Antenna,Receiver} from './electrical/Electronics.js';
import {Prop,WindProp,RailCrate,Cart,WaterBasin,PressurePlate,Jack,Door,Ladder,Canopy,Bridge} from './mechanical/Objects.js';
import {Platform,Conveyor,Magnet} from './mechanical/Transport.js';
import {Actor,Companion,Guard,PathRide} from './actors/Actor.js';
import {BeamLamp,Mirror,LightSensor,Fog} from './optical/Optics.js';
import {Sequence} from './core/Sequence.js';
export const componentTypes=Object.freeze({Source,Battery,Capacitor,Lamp,Radio,Heater,Sign,HoldingCoil,TimedDevice,PulseLatch,RepairBench,Charger,Motor,Fan,Pump,Switch,Breaker,SourceSelector,Cable,Hose,Socket,Resistor,Divider,Antenna,Receiver,Prop,WindProp,RailCrate,Cart,WaterBasin,PressurePlate,Jack,Door,Ladder,Canopy,Bridge,Platform,Conveyor,Magnet,Actor,Companion,Guard,PathRide,BeamLamp,Mirror,LightSensor,Fog,Sequence});
export function createComponent(spec){const Type=componentTypes[spec.type];if(!Type)throw new TypeError('Unknown component type: '+spec.type);return new Type(spec);}

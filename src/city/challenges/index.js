import {FeederChallenge} from './FeederChallenge.js';
import {IsolationChallenge} from './IsolationChallenge.js';
import {TransferChallenge} from './TransferChallenge.js';
import {BridgeChallenge} from './BridgeChallenge.js';
import {BackupChallenge} from './BackupChallenge.js';
import {PumpChallenge} from './PumpChallenge.js';
import {RadioChallenge} from './RadioChallenge.js';
export {extraSpecs} from './common.js';
export function createChallenge(s){const Type={backup:BackupChallenge,pumps:PumpChallenge,radio:RadioChallenge,feeder:FeederChallenge,isolation:IsolationChallenge,transfer:TransferChallenge,bridge:BridgeChallenge}[s.mission.id];return Type?new Type(s):null;}

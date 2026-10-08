import {BackupChallenge} from './BackupChallenge.js';
import {PumpChallenge} from './PumpChallenge.js';
import {RadioChallenge} from './RadioChallenge.js';
export {extraSpecs} from './common.js';
export function createChallenge(s){const Type={backup:BackupChallenge,pumps:PumpChallenge,radio:RadioChallenge}[s.mission.id];return Type?new Type(s):null;}

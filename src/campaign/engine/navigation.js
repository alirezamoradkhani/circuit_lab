import {createNavigation} from './createNavigation.js';
import {ROOM,obstacles,distance,portPosition} from '../workshop/layout.js';
export const workshopNavigation=createNavigation({
 bounds:ROOM,obstacles,blocked:s=>s.pushing||s.completed,
 tetherAllows:(p,s)=>Object.entries(s.connections).every(([id,source])=>source!=='battery'||distance(p,portPosition(id,s))<=2.65)
  &&(!s.charging||distance(p,portPosition('mains',s))<=2.65)
});
export const {walkable,tetherAllows,movePlayer,findPath}=workshopNavigation;

workshopNavigation.blockedMessage=s=>Object.values(s.connections).includes('battery')||s.charging?'کابل رِی کشیده می‌شود؛ اول آن را جدا کن.':'این راه بسته است؛ چرخ‌دستی را عقب بکش.';

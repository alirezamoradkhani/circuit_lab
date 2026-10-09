import {Device,Source} from '../components/index.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>Number(n).toLocaleString('fa-IR',{maximumFractionDigits:2});
export function equipmentStatus(e,world){
 if(e instanceof Source)return (e.state.tripped?'محافظ قطع است':e.available()?'منبع آماده':'منبع خاموش')+' · '+fa(e.voltage)+' ولت · سقف '+fa(e.maxWatts)+' وات'+(Number.isFinite(e.state.energy)?' · '+fa(e.state.energy)+' ژول':'');
 if(e.kind==='Divider')return 'خروجی تقسیم‌کننده: '+fa(e.state.output)+' ولت'+(e.state.safe?'':' · توان نامی قطعه کافی نیست');
 if(e.kind==='Receiver')return ({off:'خاموش',noise:'پیام بریده؛ ولتاژ یا آنتن را بررسی کن',clear:'پیام واضح',alternate:'برنامهٔ دیگری دریافت می‌شود'})[e.state.quality];
 if(e instanceof Device){const d=e.measure(world);return (e.state.complete?'کار کامل شده':e.state.powered?'برق برقرار':'برق قطع')+' · '+fa(d.voltage)+' ولت · '+fa(d.watts)+' وات';}
 if(e.kind==='Resistor')return fa(e.state.ohms)+' اهم';
 if(e.kind==='WaterBasin')return 'سطح آب: '+fa(e.state.level*100)+'٪';
 if(e.kind==='PressurePlate')return e.state.pressed?'صفحه پایین است':'صفحه آزاد است';
 if(e.state.collected)return 'در کیف نگه داشته شده';
 if(e.state.locked||e.state.latched)return 'در جای خود قفل شده';
 if(e.state.holder==='ray')return 'همراه رِی';
 return e.config.description??'';
}

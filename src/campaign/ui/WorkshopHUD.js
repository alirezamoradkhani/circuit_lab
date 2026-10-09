import {SceneHUD} from './SceneHUD.js';
import {dialogContent} from './dialogs.js';
import {NAMES,available} from '../workshop/layout.js';
const configuration={
 names:NAMES,available,dialogContent,pins:['battery','mains','latch','lamp','radio'],
 labels:{chapter:'مدار گمشده / فصل اول',title:'بیداری در تعمیرگاه',introChapter:'۰۱ / تعمیرگاه نورا',introTitle:'صبحِ بعد از خاموشی',introText:'یک ربات کوچک. یک باتری گمشده. و دری که منتظر یک جرقه است.'},
 goal:s=>s.cart<1?'cart':!s.door?'latch':!s.receipt?'receipt':'exit',
 objective:s=>s.completed?'رد پاک‌رو به کوچه می‌رسد.':s.cart<1?'چرخ‌دستی راه را بسته؛ عقبش بکش.':!s.door?'ضامن کنار کرکره را برق بده.':!s.receipt?'رسید پاک‌رو را کنار میز بردار.':'کابل رِی را جدا کن و از در بیرون برو.',
 canUnplug:(s,id)=>s.connections[id]||id==='battery'&&(s.charging||Object.values(s.connections).includes('battery'))||id==='mains'&&(s.charging||Object.values(s.connections).includes('mains')),
 interactionLabel:(s,id)=>s.completed?'پایان مرحله':id==='cart'?'عقب کشیدن چرخ‌دستی':id==='receipt'?'برداشتن رسید':id==='reel'?'برداشتن کابل بلند':NAMES[id]||'تعامل',
 visible:(id,s,{tool,selected,nearest,goal,pin})=>tool==='hand'?id===(selected||nearest)||id===goal||(id==='reel'&&s.cart>=1):pin,
};
export class WorkshopHUD extends SceneHUD {
 constructor(root,onAction){super(root,onAction,configuration);}
}

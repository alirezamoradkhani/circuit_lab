export function sceneMessage(s,insideCabinet=false){
  const target=s.messageTarget;
  if(!target||(insideCabinet?(target!=='cabinet'||!s.panel):(target==='cabinet'&&s.panel&&!s.won)))return '';
  const title=target==='person'?s.mission.person:target==='cabinet'?'جعبه‌برق':target==='source'?'منبع برق':s.tool==='meter'?'مولتی‌متر':'مصرف‌کننده';
  return `<section class="scene-message ${insideCabinet?'cabinet-message':'bubble-'+target} ${s.tripped?'fault':''}" role="status" aria-live="polite"><header><strong>${title}</strong><button data-action="dismiss-message" aria-label="بستن پیام">×</button></header><p>${s.message}</p>${s.tripped?'<button class="reset-protector" data-action="reset-fuse">بازنشانی محافظ</button>':''}</section>`;
}

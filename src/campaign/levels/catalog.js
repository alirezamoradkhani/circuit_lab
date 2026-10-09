export const campaignCatalog=[
 [1,'01-workshop','بیداری در تعمیرگاه'],[2,'02-wind-alley','بادِ خلاف'],[3,'03-market','بازارِ جاروها'],[4,'04-elevator','آسانسور بی‌حوصله'],
 [5,'05-flooded-square','میدانِ زیر آب'],[6,'06-night-shift','شیفت شب'],[7,'07-magnetic-depot','انبار وارونه'],[8,'08-radio-rooftop','صدایی روی پشت‌بام'],
 [9,'09-capacitor-passage','یک جرقه وقت'],[10,'10-quiet-garden','باغِ خاموش'],[11,'11-rescue','فراری که فرار نمی‌کرد'],[12,'12-lights-return','شب روشن']
].map(([number,id,title])=>({number,id,title}));
export async function loadDefinition(number){
 const entry=campaignCatalog.find(e=>e.number===number);
 if(!entry||number===1)throw new Error('Invalid component stage');
 const module=await import('./'+entry.id+'.js');return module.default();
}

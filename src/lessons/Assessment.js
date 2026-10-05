export function parseNumber(value){
  if(value===undefined||value===null||String(value).trim()==='')return null;
  const normalized=String(value).trim().replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/−/g,'-');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))return null;
  const n=Number(normalized);return Number.isFinite(n)?n:null;
}
export function assess(level,answers){
  const missing=[],wrong=[];
  for(const f of level.fields){
    const value=answers[f.key];
    if(f.options){if(!f.options.some(([id])=>id===value))missing.push(f.label);else if(value!==f.answer)wrong.push(f.label);}
    else{const n=parseNumber(value);if(n===null)missing.push(f.label);else if(Math.abs(n-f.answer)>Math.max(0.002,Math.abs(f.answer)*0.005))wrong.push(f.label);}
  }
  if(missing.length)return {ok:false,message:'پاسخ این بخش‌ها را وارد کن: '+missing.join('، ')};
  if(wrong.length)return {ok:false,message:'این پاسخ‌ها نیاز به بازبینی دارند: '+wrong.join('، ')+'. جهت فلش‌ها، علامت ولتاژ و واحدها را بررسی کن.'};
  return {ok:true,message:level.explanation};
}

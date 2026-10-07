// Layered vector characters share proportions, but have distinct clothes and faces.
const people={
  gate:{skin:'#c68e65',hair:'#393a35',shirt:'#456779',pants:'#304759',hat:'cap',beard:true},
  shop:{skin:'#d8a17b',hair:'#534237',shirt:'#b37050',pants:'#4b575b',apron:true,beard:true},
  street:{skin:'#bc825a',hair:'#302f34',shirt:'#5b829d',pants:'#364b65',hat:'helmet'},
  clinic:{skin:'#d7a57d',hair:'#47362f',shirt:'#91b6ad',pants:'#405f65',glasses:true},
  station:{skin:'#a56d4c',hair:'#3d332e',shirt:'#b8954c',pants:'#475966',hat:'hardhat',vest:true},
  visitor:{skin:'#d3a17c',hair:'#51433b',shirt:'#818f69',pants:'#4a5968'},
};
export function character(id,{x=145,y=260,scale=1}={}){
  const p=people[id]||people.visitor;
  return `<g class="character character-${id}" transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="111" rx="30" ry="6" fill="#415a4c" opacity=".18"/>
    <path d="M-18 58L-16 102H-3L1 64L5 102H18L20 58Z" fill="${p.pants}"/>
    <path d="M-17 99H-3V109H-25Q-27 103-17 99M5 99H19L26 106Q27 110 5 109Z" fill="#354044"/>
    <path d="M-18 10Q-31 12-33 29L-36 57Q-32 64-27 60L-18 32M18 10Q29 14 30 31L34 54Q30 62 24 57L17 31" fill="${p.shirt}"/>
    <path d="M-35 54L-37 67Q-33 75-28 67L-27 56M25 54L27 68Q31 73 35 65L33 54" fill="${p.skin}"/>
    <path d="M-17 8Q0 2 18 9L22 62Q0 70-22 62Z" fill="${p.shirt}"/>
    <path d="M-7 3V14Q0 22 8 13V2" fill="${p.skin}"/>
    <path d="M-17 10L-8 8L0 20L-9 25ZM8 8L18 11L10 25L0 20" fill="#ffffff45"/>
    <path d="M0 23V58" stroke="#203b4133" stroke-width="2"/>
    ${p.apron?'<path d="M-11 21H12L20 64H-20Z" fill="#e3cf9f"/><path d="M-11 43H12V54H-11Z" fill="#c4ad7d"/><path d="M-9 21L-8 10M10 21L9 10" stroke="#e3cf9f" stroke-width="4"/>':''}
    ${p.vest?'<path d="M-18 10L-7 14L-9 61H-22M18 10L7 14L9 61H22" fill="#e5af4a"/><path d="M-22 43H-8M8 43H22" stroke="#efeed5" stroke-width="5"/>':''}
    <rect x="7" y="28" width="10" height="13" rx="2" fill="#eef0de" opacity=".85"/><path d="M9 32H15M9 35H14" stroke="#6c8480"/>
    <ellipse cx="-17" cy="-14" rx="4" ry="7" fill="${p.skin}"/><ellipse cx="17" cy="-14" rx="4" ry="7" fill="${p.skin}"/>
    <path d="M-17 -29Q0 -43 17 -29L16 -9Q13 7 0 9Q-15 6-17-10Z" fill="${p.skin}"/>
    <path d="M-18 -18Q-25-42-5-44Q19-48 20-24L16-15L12-30Q-1-22-12-31L-15-17Z" fill="${p.hair}"/>
    <path d="M-11-20L-5-21M5-21L11-20" fill="none" stroke="${p.hair}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="-8" cy="-16" rx="1.8" ry="2" fill="#283637"/><ellipse cx="8" cy="-16" rx="1.8" ry="2" fill="#283637"/>
    <path d="M1-15L-1-8L3-7" fill="none" stroke="#8f5c43" stroke-width="1.2"/>
    ${p.beard?`<path d="M-14-5Q0 5 14-5L10 5Q0 13-10 5Z" fill="${p.hair}" opacity=".8"/>`:''}
    <path d="M-5-2Q0 1 5-2" fill="none" stroke="#794b3b" stroke-width="1.5" stroke-linecap="round"/>
    ${p.glasses?'<g fill="none" stroke="#4a5250" stroke-width="1.6"><rect x="-14" y="-21" width="11" height="9" rx="3"/><rect x="3" y="-21" width="11" height="9" rx="3"/><path d="M-3-18H3"/></g>':''}
    ${p.hat==='cap'?'<path d="M-21-30Q-18-51 5-49Q18-47 20-32Z" fill="#344f65"/><path d="M-23-32H24Q31-25 17-26H-22Z" fill="#293e50"/><rect x="-4" y="-42" width="8" height="7" rx="2" fill="#dbba66"/>':''}
    ${p.hat==='helmet'||p.hat==='hardhat'?`<path d="M-22-29Q-21-53 0-53Q22-51 23-29Z" fill="${p.hat==='helmet'?'#c27751':'#edbf58'}"/><path d="M-24-29H26M0-51V-33" stroke="${p.hat==='helmet'?'#8a503d':'#c38e31'}" stroke-width="4" stroke-linecap="round"/>`:''}
  </g>`;
}

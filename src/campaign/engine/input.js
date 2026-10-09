import {bindGameInput} from './GameInput.js';
export const bindWorkshopInput=game=>bindGameInput(game,{isUnlocked:()=>game.state.started&&game.intro>=4.6});

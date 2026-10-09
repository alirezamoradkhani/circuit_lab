import {createCart,createReel,createReceipt,createLamp,createRadio} from '../components/visual/WorkshopAssets.js';
export function buildProps(scene,m){
 const cart=createCart(scene,m),reel=createReel(scene,m,{position:{x:-4.55,y:.48,z:-2.55}});
 const receipt=createReceipt(scene,m,{position:{x:3.65,y:.065,z:2.85}});
 const lamp=createLamp(scene,m,{position:{x:4.1,y:1.2,z:1.05}});
 const radio=createRadio(scene,m,{position:{x:5.25,y:1.45,z:1.05}});
 return {cart:cart.root,reel:reel.root,receipt:receipt.root,bulb:lamp.bulb,light:lamp.light,radio:radio.root,dial:radio.dial};
}

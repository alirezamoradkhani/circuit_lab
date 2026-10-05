export function assertCircuitMath(){
  const voltage=9, resistance=3;
  if(voltage/resistance!==3) throw new Error('Ohm calculation failed');
  console.log('PASS: Ohm law calculation');
}

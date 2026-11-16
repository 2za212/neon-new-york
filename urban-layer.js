// Untextured secondary volumes make the street canyon read as a layered machine.
export function buildUrbanLayer({box}){
 const solid={solid:true};
 function gantry(x,z,hand){
   box(x,7.2,z,1.3,14.4,1.35,'metal',solid);
   for(let j=0;j<18;j++)box(x+hand*.11,.44+j*.78,z+hand*.03,1.72,.19,1.65,'body');
   box(x+hand*2.5,13.6,z,6.5,1.1,2.1,'body');
   box(x+hand*5.9,13.6,z,2.1,1.45,2.8,'trim');
 }
 gantry(-17.4,12.0,1);gantry(17.4,12.0,-1);
 // Blank billboard on an elevated equipment frame; its lower edge clears the roadway.
 box(0,14.3,12.0,24.0,1.2,2.5,'metal');
 box(0,17.0,12.0,16.9,4.8,1.15,'metal');
 box(0,17.0,12.65,15.7,3.9,.14,'trim');
 for(let k=0;k<10;k++)box(-7.8+k*1.73,14.9,12.73,.28,.32,.28,'recess');
 for(const side of [-1,1]){
   // Vertical blank sign blades with stepped frames face the main pedestrian axis.
   const x=side*17.0,z=-9.4;
   for(let j=0;j<4;j++)box(x+side*.8,10.0+j*3.4,z,2.3,.45,1.6,'metal');
   box(x,15.0,z,1.2,12.5,4.5,'metal');
   box(x-side*.67,15.0,z,.18,11.6,3.7,'trim');
   for(let j=0;j<12;j++)box(x+side*.10,9.4+j*.96,z+2.4,1.15,.22,.32,'body');
 }
 // Service stacks, conduits and small delivery cabinets cluster at the building feet.
 for(const side of [-1,1]){
   const x=side*15.5;
   for(let j=0;j<4;j++){
     const z=-15.5-j*7.4;
     box(x,1.7,z,1.7,3.4,2.2,'metal',solid);
     box(x-side*.91,1.8,z,.18,2.3,1.65,'recess');
     for(let k=0;k<7;k++)box(x-side*1.02,.9+k*.28,z,.12,.10,1.53,'body');
     box(x,3.54,z,2.08,.24,2.6,'trim');
   }
   for(let j=0;j<3;j++){
     const xx=side*(18.4+j*.42);
     for(let k=0;k<25;k++)box(xx,.35+k*.29,-10.8,.25,.30,.28,'metal');
     for(let k=0;k<9;k++)box(xx,7.6,-10.8+k*.34,.25,.28,.37,'metal');
   }
 }
}


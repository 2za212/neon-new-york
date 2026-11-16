export function buildFigures({box}){
 function person(x,z,a,coat=false){
   function cube(u,y,v,w,h,d,kind){box(x+Math.cos(a)*u+Math.sin(a)*v,y,z-Math.sin(a)*u+Math.cos(a)*v,w,h,d,kind,{yaw:a});}
   cube(0,1.60,0,.26,.27,.25,'body');
   cube(0,1.14,0,.41,.58,.26,coat?'metal':'recess');
   cube(0,.84,0,.34,.18,.26,'metal');
   for(const s of [-1,1]){
     cube(s*.105,.47,-s*.08,.16,.60,.18,'metal');
     cube(s*.105,.12,-s*.08-.045,.18,.13,.29,'recess');
     cube(s*.28,1.13,s*.06,.13,.51,.15,'body');
   }
 }
 for(const [x,z,a,c] of [[-5,36,.2,true],[5,34,2.8,false],[13,21,-.8,true],[-12,28,1.1,false],[-7,-20,-.2,true],[9,-43,2.9,false],[58,24,-1,false]])person(x,z,a,c);
}

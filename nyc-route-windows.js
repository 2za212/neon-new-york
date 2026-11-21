// Room types share the existing batched window geometry. Lit bays
// follow floors and neighbouring rooms, with a dark stair bay at one end.
export function routeWindow(profile,floor,bay,count){
  if(bay===count-1 && floor%3!==1)return 'glass';
  if(profile==='workroom')return floor===0||floor===2?(bay%3===1?'routeBlinds':'routeStudio'):'glass';
  if(profile==='tailor')return floor===0||floor===1?(bay%2?'routeBlinds':'routeAtelier'):'glass';
  if(profile==='pantry')return floor===0?(bay%3?'routeStock':'routeBlinds'):floor===2&&bay<2?'routeHome':'glass';
  return (floor+bay*2)%5<2?'routeHome':floor===1&&bay<2?'routeBlinds':'glass';
}

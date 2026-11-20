// One cell is one cube. Four neighboring modules use a different corner as
// the key so the recessed ends do not form continuous horizontal ridges.
export function unitDepth(x,y,style=0){
  const bx=Math.floor(x/2),by=Math.floor(y/2);
  const rotation=(bx+by*3+style)&3;
  const halfX=(x&1)^(rotation&1),halfY=(y&1)^(rotation>>1);
  if(halfX&&halfY)return -1;
  if(!halfX&&!halfY&&((bx+by+style)&3)===2)return -1;
  return 0;
}

export function unitTone(x,y,style=0){
  const col=x&15,row=y&15;
  let n=Math.imul(col+19+style,1597334677)^Math.imul(row+61,3812015801);
  n=Math.imul(n^(n>>>16),2246822519);
  const tone=((n>>>0)%7)-3;
  return 1+tone*.033+(unitDepth(x,y,style)<0?-.10:.026);
}

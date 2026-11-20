// Courses are laid from the two wall returns. A header which projects on one
// elevation comes back flush on the next. The crown grows out of these piers.
export function bondBuilding(family,w,h,d,base,place){
  if(w<4.8||d<4.8||h<3.84||Math.max(w,d)>110||base+h<4)return;
  if(!['clay','stone','glass','alloy','timber'].includes(family))return;
  const industrial=family==='alloy'||family==='glass';
  const pitch=industrial?1.28:.64,projection=industrial?.32:.16;
  const top=h/2,low=Math.max(-top,2.56-base-top),count=Math.floor((top-low)/pitch);
  for(const ex of [-1,1])for(const ez of [-1,1]){
    for(let i=0;i<count;i++){
      const y=top-(i+.5)*pitch,odd=i%2,reach=(industrial?1.60:.96)+(odd?.32:0);
      const tx=ex*(w/2-reach/2+projection),tz=ez*(d/2-reach/2+projection);
      place(tx,y,ez*(d/2+projection*.25),reach,pitch*.72,projection*(odd?1:2),odd?.93:1.08);
      place(ex*(w/2+projection*.25),y,tz,projection*(odd?2:1),pitch*.72,reach,odd?1.08:.93);
    }
  }
  // Three layers of square corbels take the top load. The gaps between their
  // exposed ends make a stepped silhouette even at the far side of a street.
  for(let axis=0;axis<2;axis++){
    const run=axis?d:w,other=axis?w:d,count=Math.max(2,Math.round(run/(industrial?2.56:1.60))),bay=run/count;
    for(let i=0;i<count;i++)for(const side of [-1,1]){
      const along=(i+.5)*bay-run/2;
      for(let j=0;j<3;j++){
        const across=side*(other/2+(.5+j)*projection*.56),breadth=bay*(.39+.18*j);
        const y=top-(2.5-j)*.16,reach=projection*(1.2+j*.75);
        if(axis)place(across,y,along,reach,.16,breadth,.91+j*.07);
        else place(along,y,across,breadth,.16,reach,.91+j*.07);
      }
    }
  }
}

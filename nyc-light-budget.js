// Fixed-size nearest-light selection keeps the point-light shader count stable
// while the observer moves between districts. Emissive signs stay visible.
export function createLightBudget(scene){
  const points=[];scene.traverse(o=>{if(o.isPointLight)points.push(o);});
  const stats={available:points.length,active:0,limit:10,quality:'balanced'};
  let elapsed=Infinity;
  function setQuality(level){stats.quality=level;stats.limit=level==='high'?14:level==='low'?6:10;elapsed=Infinity;}
  function update(dt,observer,force=false){
    elapsed+=dt;if(!force&&elapsed<.35)return;elapsed=0;
    const p=observer.position||observer;
    const ranked=points.map(light=>({light,d:(light.position.x-p.x)**2+(light.position.z-p.z)**2})).sort((a,b)=>a.d-b.d);
    const count=Math.min(points.length,stats.limit);
    for(let i=0;i<ranked.length;i++)ranked[i].light.visible=i<count;
    stats.active=count;
  }
  return {stats,setQuality,update};
}

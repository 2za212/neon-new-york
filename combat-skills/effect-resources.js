export function disposeEffectNodes(roots,sharedRoots=[]){
  const shared=new Set();
  function resources(node,emit){
    if(node.geometry)emit(node.geometry);
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      if(material)emit(material);
    }
  }
  for(const root of sharedRoots)root.traverse(node=>resources(node,resource=>shared.add(resource)));
  const owned=new Set();
  for(const root of roots){
    root.removeFromParent();
    root.traverse(node=>{
      if(node.isInstancedMesh)node.dispose();
      resources(node,resource=>{if(!shared.has(resource))owned.add(resource);});
    });
  }
  for(const resource of owned)resource.dispose();
}

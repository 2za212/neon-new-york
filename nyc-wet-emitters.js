// The under-awning strip runs along Z; the south-facing station screen spans X.
// Both use world metres so grazing reflections move with the observing camera.
export const streetLightReflection = `
vec3 wetEmitter(vec3 p,vec3 n,vec3 eye,vec3 centre,vec3 halfSpan,vec3 hue,float reach){
  vec3 segment=halfSpan*2.0;
  vec3 reflectedRay=reflect(-eye,n);
  vec3 relative=centre-halfSpan-p;
  vec3 crossSpan=segment-reflectedRay*dot(segment,reflectedRay);
  float t=clamp(-dot(relative,crossSpan)/max(dot(crossSpan,crossSpan),0.0001),0.0,1.0);
  vec3 delta=relative+segment*t;
  float distanceToLamp=length(delta);
  vec3 l=delta/max(distanceToLamp,.001);
  float facing=max(dot(n,l),0.0);
  float alignment=max(dot(reflectedRay,l),0.0);
  float fade=1.0-smoothstep(reach*.36,reach,distanceToLamp);
  return hue*fade*facing*(.18+1.7*pow(alignment,9.0)+3.8*pow(alignment,64.0));
}
vec3 streetGlints(vec3 p,vec3 n,vec3 eye){
  return wetEmitter(p,n,eye,vec3(-9.93,3.115,34.78),vec3(0.,0.,1.8),vec3(1.9,.59,.115),14.)
       + wetEmitter(p,n,eye,vec3(-8.6,1.12,14.27),vec3(.66,0.,0.),vec3(.055,1.05,1.65),11.);
}
`;

export function coatStreetVehicle(material){
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vWetVehiclePosition;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvWetVehiclePosition=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 vWetVehiclePosition;\n'+streetLightReflection+shader.fragmentShader.replace('#include <opaque_fragment>',`
      if(vWetVehiclePosition.x > -16. && vWetVehiclePosition.x < 7. && vWetVehiclePosition.z > 3. && vWetVehiclePosition.z < 49.){
        vec3 worldNormal=inverseTransformDirection(normal,viewMatrix);
        vec3 eyeDirection=normalize(cameraPosition-vWetVehiclePosition);
        outgoingLight+=streetGlints(vWetVehiclePosition,worldNormal,eyeDirection)*(.23+.49*abs(worldNormal.x));
      }
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>'nyc-wet-vehicle-v1';
}

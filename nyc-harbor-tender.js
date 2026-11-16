// Permanently moored Hudson maintenance tender. Frames narrow at the bow.
// Quantised deck and plating retain visible steps at normal player distance.
export function mooredTender(B,L,label){
  const x=-157,z=-6;
  // A broadside workboat fills the waterline between the low jetty and skyline.
  const scale=1.62;
  const localBox=B,localBeam=L;
  B=(mat,xx,y,zz,w,h,d,tint)=>localBox(mat,x+(xx-x)*scale,y*scale,z+(zz-z)*scale,w*scale,h*scale,d*scale,tint);
  const scaled=p=>[x+(p[0]-x)*scale,p[1]*scale,z+(p[2]-z)*scale];
  L=(mat,a,b,w,d)=>localBeam(mat,scaled(a),scaled(b),w*scale,d*scale);

  const deck=(mat,u,y,v,w,h,d,tint)=>B(mat,x+u,y,z+v,w,h,d,tint);
  const rail=(mat,a,b,w)=>L(mat,[x+a[0],a[1],z+a[2]],[x+b[0],b[1],z+b[2]],w,w);
  for(let i=0;i<19;i++){
    const v=i-9;
    const width=5.1-Math.max(0,v-3)*.64-Math.max(0,-v-6)*.36;
    deck('harborRust',0,-.32,v,width,1.07,1.02);
    deck('harborPaint',0,.39,v,width+.13,.44,1.02);
    deck('harborTimber',0,.635,v,width-.12,.08,.98);
    for(const side of [-1,1]){
      deck('yellow',side*(width*.5+.078),.44,v,.028,.10,1.0);
      if(i%2===0)deck('metal',side*(width*.5-.13),1.02,v,.066,.74,.066);
      if(i<18){
        const next=5.1-Math.max(0,v-2)*.64-Math.max(0,-v-7)*.36;
        rail('harborPaint',[side*(width*.5-.13),1.36,v],[side*(next*.5-.13),1.36,v+1],.074);
      }
    }
  }
  deck('yellow',0,1.48,-1.7,3.6,1.6,6);
  deck('trim',0,2.85,-.4,3.35,1.2,3.35);
  for(let i=-1;i<=1;i++){
    deck('coolWindow',i*.92,2.98,1.30,.80,.63,.09);
    for(const side of [-1,1])deck('warmWindow',side*1.70,2.98,-.4+i*.94,.08,.64,.79);
  }
  deck('harborPaint',0,3.55,-.4,3.92,.20,3.9);
  deck('lamp',2.03,3.48,-.6,.18,.17,3.65);
  deck('lamp',2.17,1.63,-3.0,.09,.12,4.5);
  // World-space 32 cm courses: offset bridge, lookout and stern winch.
  // This kit is attached after the hull transform to preserve the city grid.
  const course=.32;
  const module=(material,u,level,v,w,h,d,tint)=>localBox(material,x+u*course,
    3.65*scale+(level+h/2)*course,z+v*course,w*course,h*course,d*course,tint);
  module('harborPaint',0,0,-2,17,1,17);
  module('harborPaint',0,1,-4,13,6,12);
  module('coolWindow',6.6,3,-4,1,3,10);
  module('metal',0,7,-4,15,1,14);
  module('lamp',7.6,7,-4,1,1,5);
  module('metal',-2,8,-6,5,3,5);
  for(const side of [-1,1]){
    deck('harborPaint',side*1.34,1.85,5.3,.32,2.4,.64);
    deck('yellow',side*1.34,3.23,5.3,.48,.48,.80);
  }
  deck('harborPaint',0,3.52,5.3,3.36,.48,.80);
  deck('metal',0,2.86,5.3,1.52,.48,.48);
  deck('metal',0,4.73,-.9,.16,2.26,.16);
  deck('trim',0,5.72,-.9,1.95,.11,.12);
  deck('lamp',0,5.98,-.9,.19,.23,.19);
  rail('harborRust',[.6,.78,-6],[.6,3.2,-5.6],.3);
  rail('harborPaint',[.6,3.2,-5.6],[.6,4.48,-8.38],.22);
  rail('metal',[.6,4.45,-8.38],[.6,2.0,-8.38],.032);
  for(const v of [-3.6,2.4])rail('harborTimber',[2.38,.80,v],[9.6,.68,v-1],.065);
  label(x,1.60*scale,z+1.34*scale,2.15*scale,.43*scale,'NYH 07','HARBOR SERVICE','#e5bb82',0);
}


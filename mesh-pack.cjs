'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {classifySurface}=require('./material-zones.cjs');

// Bake the union's exterior directly. No per-cell JS objects, array push loops,
// or hidden cube faces are retained in the packed output.
function packMesh({cells, dims, origin, step, kinds, palette, outputDir,reliefEnabled=true}) {
  const [nx, ny, nz] = dims;
  if (!dims.every(v => Number.isInteger(v) && v > 0) || cells.length !== nx*ny*nz) {
    throw new Error('The occupancy length must match dims [x,y,z]');
  }
  if (!origin.every(Number.isFinite) || !Number.isFinite(step) || step <= 0) {
    throw new Error('Invalid voxel origin or step');
  }
  // Centimetre-scale brick relief uses 1/64-cell packed coordinates. A small
  // origin pad lets negative-facing caps cross a chunk's zero boundary safely.
  const positionDivisions=64, reliefUnits=16, insetUnits=1, raisedUnits=32, positionPad=raisedUnits;
  if (ny*positionDivisions+positionPad+raisedUnits > 65535) throw new Error('Packed vertical coordinates exceed Uint16');
  if (!Array.isArray(palette) || palette.length < 2) throw new Error('Expected palette indexed by occupancy kind');

  const stride = nx*nz;
  const tileCells = Math.max(1, Math.round(24/step));
  if (tileCells*positionDivisions+positionPad+raisedUnits > 65535) throw new Error('Packed tile coordinates exceed Uint16');
  const tilesX = Math.ceil(nx/tileCells), tilesZ = Math.ceil(nz/tileCells);
  const tileCount = tilesX*tilesZ;
  const faceCounts = new Uint32Array(tileCount);
  const xTile = new Uint16Array(nx), zTile = new Uint16Array(nz);
  for (let x=0; x<nx; x++) xTile[x] = Math.floor(x/tileCells);
  for (let z=0; z<nz; z++) zTile[z] = Math.floor(z/tileCells)*tilesX;
  const baseSlot = kinds.indexOf('base');
  const baseKind = baseSlot < 0 ? -1 : baseSlot + (kinds.length === palette.length ? 0 : 1);
  const lowestRetainedBottom = Math.ceil((-.5-origin[1])/step);

  // Bit order -X,+X,-Y,+Y,-Z,+Z. A bottom of the deep base board is
  // deliberately omitted; every other air-facing boundary remains exact.
  function exposedMask(n,x,y,z,kind) {
    let mask = 0;
    if (x===0 || cells[n-1]===0) mask|=1;
    if (x===nx-1 || cells[n+1]===0) mask|=2;
    if ((kind!==baseKind || y>=lowestRetainedBottom) && (y===0 || cells[n-stride]===0)) mask|=4;
    if (y===ny-1 || cells[n+stride]===0) mask|=8;
    if (z===0 || cells[n-nx]===0) mask|=16;
    if (z===nz-1 || cells[n+nx]===0) mask|=32;
    return mask;
  }
  const bitCounts = new Uint8Array(64);
  for (let i=1; i<64; i++) bitCounts[i] = bitCounts[i>>1]+(i&1);

  const slot=name=>{const at=kinds.indexOf(name);return at<0?-1:at+(kinds.length===palette.length?0:1);};
  const bodyKind=slot('body'), trimKind=slot('trim'), metalKind=slot('metal'),recessKind=slot('recess');
  const isReliefKind=kind=>kind===bodyKind||kind===trimKind||kind===metalKind||kind===recessKind;
  function isReliefSurface(x,y,z,kind,face,material) {
    if(!reliefEnabled)return false;
    if(face===2||face===3||!isReliefKind(kind))return false;
    const frontShoulder=z>31&&z<56&&Math.abs(x)>24&&Math.abs(x)<56;
    if(y<.5||y>(frontShoulder?14:6))return false;
    const streets=(Math.abs(x)<31&&z>-52&&z<56)||
      (z>29&&z<56&&Math.abs(x)<56)||(z>-.2&&z<17&&Math.abs(x)<66);
    return streets&&(material>=0&&material<=3||material===14);
  }

  function raisedCap(x,y,z,face) {
    // Two adjacent cells in each wall direction share the same depth. These
    // half-metre patches are stable in world space across mesh chunk borders.
    const wx=Math.floor(origin[0]/step)+x,wy=Math.floor(origin[1]/step)+y,wz=Math.floor(origin[2]/step)+z;
    const axis=Math.floor(face/2);
    const u=Math.floor((axis===0?wz:wx)/2),v=Math.floor(wy/2),plane=Math.floor((axis===0?wx:wz)/4);
    let hash=Math.imul(u+613,1597334677)^Math.imul(v+337,3812015801)^Math.imul(plane+71,1103515245);
    hash=Math.imul(hash^(hash>>>16),2246822519);
    return ((hash^(hash>>>13))>>>0)<.12*4294967296;
  }

  let occupiedCells = 0, surfaceCells = 0, totalFaces = 0;
  let sourceFaces=0, reliefCaps=0,raisedCaps=0;
  for (let y=0; y<ny; y++) {
    const plane = y*stride, wy=origin[1]+(y+.5)*step;
    for (let z=0; z<nz; z++) {
      const row = plane+z*nx, tileRow=zTile[z], wz=origin[2]+(z+.5)*step;
      for (let x=0; x<nx; x++) {
        const n=row+x, kind=cells[n];
        if (!kind) continue;
        if(kind>=palette.length)throw new Error('Missing palette entry for cell kind '+kind);
        occupiedCells++;
        const mask=exposedMask(n,x,y,z,kind);
        if (!mask) continue;
        surfaceCells++;
        const plain=bitCounts[mask],wx=origin[0]+(x+.5)*step;
        let capCount=0;
        if(wy>=.5&&wy<=14&&isReliefKind(kind)) {
          for(const face of [0,1,4,5]) {
            if(!(mask&(1<<face))||!isReliefSurface(wx,wy,wz,kind,face,0))continue;
            const {material}=classifySurface(wx,wy,wz,kinds[kind-1],face);
            if(isReliefSurface(wx,wy,wz,kind,face,material)){capCount++;if(raisedCap(x,y,z,face))raisedCaps++;}
          }
        }
        const count=plain+capCount*5;
        faceCounts[tileRow+xTile[x]] += count;
        totalFaces += count;sourceFaces+=plain;reliefCaps+=capCount;
      }
    }
  }

  const file='model-mesh.bin', chunks=[], views=new Array(tileCount);
  let totalBytes=0;
  for (let tile=0; tile<tileCount; tile++) {
    const faces=faceCounts[tile];
    if (!faces) continue;
    const vertexCount=faces*4, indexCount=faces*6;
    const byteLength=16*vertexCount+4*indexCount;
    const tx=tile%tilesX, tz=Math.floor(tile/tilesX);
    const chunk={
      origin:[origin[0]+tx*tileCells*step-positionPad*step/positionDivisions, origin[1]-positionPad*step/positionDivisions, origin[2]+tz*tileCells*step-positionPad*step/positionDivisions],
      vertexCount, indexCount, byteOffset:totalBytes, byteLength
    };
    chunks.push(chunk);
    views[tile]={chunk,xStart:tx*tileCells,zStart:tz*tileCells,vertex:0,index:0};
    totalBytes += byteLength;
  }

  const output=Buffer.allocUnsafe(totalBytes);
  const storageOffset=output.byteOffset;
  for (const view of views) {
    if (!view) continue;
    const {chunk}=view, start=storageOffset+chunk.byteOffset, v=chunk.vertexCount;
    view.positions=new Uint16Array(output.buffer,start,3*v);
    view.normals=new Int8Array(output.buffer,start+6*v,3*v);
    view.colors=new Uint8Array(output.buffer,start+9*v,3*v);
    view.surfaces=new Uint8Array(output.buffer,start+12*v,4*v);
    view.indices=new Uint32Array(output.buffer,start+16*v,chunk.indexCount);
  }

  const linear=new Float64Array(palette.length*3);
  function srgbToLinear(channel) {
    const v=channel/255;
    return v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
  }
  for (let i=1; i<palette.length; i++) {
    const c=typeof palette[i]==='string' ? Number.parseInt(palette[i].replace(/^#/,''),16) : palette[i];
    if (!Number.isInteger(c) || c<0 || c>0xffffff) throw new Error('Invalid palette entry '+i);
    linear[3*i]=srgbToLinear((c>>>16)&255);
    linear[3*i+1]=srgbToLinear((c>>>8)&255);
    linear[3*i+2]=srgbToLinear(c&255);
  }

  // A complete original face seals the narrow joints behind a square cap.
  // Every cap has a front and four perpendicular sides; no chamfer normals or
  // diagonal geometry remains. The footprint is inset by one packed unit.
  const corners=new Uint8Array([
    0,0,1, 0,1,1, 0,1,0, 0,0,0,
    1,0,0, 1,1,0, 1,1,1, 1,0,1,
    0,0,1, 0,0,0, 1,0,0, 1,0,1,
    0,1,0, 0,1,1, 1,1,1, 1,1,0,
    0,0,0, 0,1,0, 1,1,0, 1,0,0,
    1,0,1, 1,1,1, 0,1,1, 0,0,1
  ]);
  const faceNormals=new Int8Array([-127,0,0, 127,0,0, 0,-127,0, 0,127,0, 0,0,-127, 0,0,127]);
  function normalOf(points) {
    const a=points[0],b=points[1],c=points[2];
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
    const vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const length=Math.hypot(nx,ny,nz);
    if(!length)throw Error('Degenerate brick relief quad');
    return [Math.round(nx/length*127),Math.round(ny/length*127),Math.round(nz/length*127)];
  }
  const plainTemplates=[],reliefTemplates=[];
  for(let face=0;face<6;face++) {
    const axis=Math.floor(face/2),direction=face%2?1:-1;
    const normal=Array.from(faceNormals.slice(face*3,face*3+3));
    const outer=Array.from({length:4},(_,v)=>Array.from(corners.slice(face*12+v*3,face*12+v*3+3),n=>n*positionDivisions));
    plainTemplates.push({points:outer,normal,shade:1});
    const variants=[];
    for(const height of [reliefUnits,raisedUnits]) {
      const foot=outer.map(p=>p.map((n,a)=>a===axis?n:n===0?insetUnits:positionDivisions-insetUnits));
      const top=foot.map(p=>p.map((n,a)=>a===axis?n+direction*height:n));
      const cap=[{points:outer,normal,shade:.92,part:3},{points:top,normal,shade:1,part:1}];
      for(let edge=0;edge<4;edge++) {
        const next=(edge+1)%4,points=[foot[edge],foot[next],top[next],top[edge]],sideNormal=normalOf(points);
        if(sideNormal[axis]!==0||sideNormal.filter(n=>Math.abs(n)===127).length!==1)throw Error('Brick relief side is not perpendicular');
        cap.push({points,normal:sideNormal,shade:.92,part:2});
      }
      // The extruded cap's open bottom is entirely covered by its original
      // complete backing face. Top/side edges must occur twice; exactly four
      // lower footprint edges and four source boundary edges remain single.
      const edgeUse=new Map();
      for(const quad of cap) {
        const actual=normalOf(quad.points);
        if(actual.some((n,a)=>n!==quad.normal[a]))throw Error('Brick relief quad has reversed winding');
        for(let e=0;e<4;e++) {
          const a=quad.points[e].join(','),b=quad.points[(e+1)%4].join(',');
          const key=a<b?a+'|'+b:b+'|'+a;
          edgeUse.set(key,(edgeUse.get(key)||0)+1);
        }
      }
      const boundary=Array.from(edgeUse.values()).filter(n=>n===1).length;
      if(boundary!==8||Array.from(edgeUse.values()).some(n=>n!==1&&n!==2))throw Error('Brick relief cap is not sealed by its backing face');
      if(foot.some(p=>p[axis]!==outer[0][axis]||p.some((n,a)=>a!==axis&&(n<=0||n>=positionDivisions))))throw Error('Brick relief footprint leaves its backing face');
      variants.push(cap);
    }
    reliefTemplates.push(variants);
  }
  function emitQuad(view,localX,localY,localZ,quad,red,green,blue,material,emission,hash,reliefPart=0) {
    const vertex=view.vertex;
    for(let v=0;v<4;v++) {
      const offset=3*(vertex+v),point=quad.points[v];
      view.positions[offset]=localX+point[0];view.positions[offset+1]=localY+point[1];view.positions[offset+2]=localZ+point[2];
      view.normals[offset]=quad.normal[0];view.normals[offset+1]=quad.normal[1];view.normals[offset+2]=quad.normal[2];
      view.colors[offset]=Math.round(red*quad.shade);view.colors[offset+1]=Math.round(green*quad.shade);view.colors[offset+2]=Math.round(blue*quad.shade);
      const surface=4*(vertex+v);
      view.surfaces[surface]=material;view.surfaces[surface+1]=emission||0;
      view.surfaces[surface+2]=(hash>>>0)%256;view.surfaces[surface+3]=reliefPart;
    }
    const i=view.index,indices=view.indices;
    indices[i]=vertex;indices[i+1]=vertex+1;indices[i+2]=vertex+2;
    indices[i+3]=vertex;indices[i+4]=vertex+2;indices[i+5]=vertex+3;
    view.vertex+=4;view.index+=6;
  }

  for (let y=0; y<ny; y++) {
    const plane=y*stride;
    for (let z=0; z<nz; z++) {
      const row=plane+z*nx, tileRow=zTile[z];
      for (let x=0; x<nx; x++) {
        const n=row+x, kind=cells[n];
        if (!kind) continue;
        const mask=exposedMask(n,x,y,z,kind);
        if (!mask) continue;
        const view=views[tileRow+xTile[x]];
        const localX=positionDivisions*(x-view.xStart)+positionPad, localY=positionDivisions*y+positionPad, localZ=positionDivisions*(z-view.zStart)+positionPad;
        let hash=Math.imul(x+41,73856093)^Math.imul(y+17,19349663)^Math.imul(z+29,83492791);
        hash=Math.imul(hash^(hash>>>13),1274126177);
        const tone=1+(((hash^(hash>>>16))>>>0)/4294967295-.5)*.012;
        for (let face=0; face<6; face++) {
          if (!(mask&(1<<face))) continue;
          const {material,tint,emission}=classifySurface(origin[0]+(x+.5)*step,origin[1]+(y+.5)*step,origin[2]+(z+.5)*step,kinds[kind-1],face);
          const red=Math.min(255,Math.max(0,Math.round(srgbToLinear(tint[0]*255)*tone*255)));
          const green=Math.min(255,Math.max(0,Math.round(srgbToLinear(tint[1]*255)*tone*255)));
          const blue=Math.min(255,Math.max(0,Math.round(srgbToLinear(tint[2]*255)*tone*255)));
          const wx=origin[0]+(x+.5)*step,wy=origin[1]+(y+.5)*step,wz=origin[2]+(z+.5)*step;
          if(isReliefSurface(wx,wy,wz,kind,face,material)) {
            const templates=reliefTemplates[face][raisedCap(x,y,z,face)?1:0];
            for(const quad of templates)emitQuad(view,localX,localY,localZ,quad,red,green,blue,material,emission,hash,quad.part);
          } else emitQuad(view,localX,localY,localZ,plainTemplates[face],red,green,blue,material,emission,hash);

        }
      }
    }
  }

  for (const view of views) {
    if (view && (view.vertex!==view.chunk.vertexCount || view.index!==view.chunk.indexCount)) {
      throw new Error('Packed voxel count mismatch');
    }
  }
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,file),output);
  return {
    file, chunks, byteLength:totalBytes, vertexCount:totalFaces*4, indexCount:totalFaces*6,
    faceCount:totalFaces, occupiedCells, surfaceCells, tileCells,
    positionUnits:'cell/64', scale:step/positionDivisions,
    relief:{capCount:reliefCaps,sourceFaceCount:sourceFaces,extraFaceCount:reliefCaps*5,height:step*reliefUnits/positionDivisions,maxHeight:step*raisedUnits/positionDivisions,inset:step*insetUnits/positionDivisions,raisedCapCount:raisedCaps,raisedPatchCells:[2,2],orthogonalNormals:true,cellSize:step,heightRange:[.5,6],frontShoulderHeightRange:[.5,14],windingAudit:true,boundaryAudit:true},
    layout:{position:'uint16x3',normal:'int8x3-normalized',color:'uint8x3-normalized-linear',surface:'uint8x4',index:'uint32'},
    offsets:{position:0,normal:'6 * vertexCount',color:'9 * vertexCount',surface:'12 * vertexCount',index:'16 * vertexCount'}
  };
}

module.exports={packMesh};

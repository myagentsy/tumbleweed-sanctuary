import * as THREE from './assets/three.module.js';
import {parkingOutline,profiles,parkingY,contextY,channelY,ditchSpots,northZ,gutterZ,ditchX,basinZ} from './plan-grading.js?v=grade3';

// Layer 5 has joined surfaces, rather than individually warped overlapping boxes.
// All distances/spot heights retain the existing plan interpretation. Frontage
// tie-ins and the ditch cross-section remain illustrative, as before.
const soilColors=new Set(['cfbda0','d9c9ac','cabb9d','d0bea0']);
const rect=(x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
const patch=rect(60,-80,340,50);
const ditch=rect(ditchX-1.5,northZ,ditchX+1.5,basinZ-1.5);
const basin=rect(ditchX-1.5,basinZ-1.5,ditchX+1.5,basinZ+1.5);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function split(poly,a,b){
 const inside=[],outside=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=cross(a,b,p),dq=cross(a,b,q);
  (dp>=-1e-9?inside:outside).push(p);
  if((dp>=-1e-9)!==(dq>=-1e-9)){
   const t=dp/(dp-dq),hit=p.map((v,j)=>v+(q[j]-v)*t);inside.push(hit);outside.push(hit);
  }
 }
 return {inside,outside};
}
function clip(poly,outline){for(let i=0;i<outline.length&&poly.length;i++)poly=split(poly,outline[i],outline[(i+1)%outline.length]).inside;return poly;}
function subtract(poly,outline){
 const pieces=[];
 for(let i=0;i<outline.length&&poly.length;i++){
  const s=split(poly,outline[i],outline[(i+1)%outline.length]);if(s.outside.length>=3)pieces.push(s.outside);poly=s.inside;
 }
 return pieces;
}
function triangulate(poly,values,height){
 if(poly.reduce((s,p,i)=>s+p[0]*poly[(i+1)%poly.length][1]-p[1]*poly[(i+1)%poly.length][0],0)<0)poly=poly.slice().reverse();
 for(let i=1;i<poly.length-1;i++){
  const tri=[poly[0],poly[i+1],poly[i]];
  if(Math.abs(cross(...tri))<1e-9)continue;
  for(const p of tri)values.push(p[0],height?height(...p):p[2],p[1]);
 }
}
function geometry(values,smooth=false){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(values,3));g.computeVertexNormals();
 if(smooth){
  const p=g.attributes.position,n=g.attributes.normal,buckets=new Map();
  const key=i=>`${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  for(let i=0;i<p.count;i++){const k=key(i),v=buckets.get(k)||new THREE.Vector3();v.add(new THREE.Vector3().fromBufferAttribute(n,i));buckets.set(k,v);}
  for(const v of buckets.values())v.normalize();
  for(let i=0;i<p.count;i++){const v=buckets.get(key(i));n.setXYZ(i,v.x,v.y,v.z);}
 }
 return g;
}
function ticks(min,max,step,extra=[]){
 const a=[min,max,...extra.filter(v=>v>min&&v<max)];for(let v=min+step;v<max;v+=step)a.push(v);
 return [...new Set(a.map(v=>+v.toFixed(6)))].sort((a,b)=>a-b);
}
function grid(outline,height,{step=2,x=[],z=[],holes=[]}={}){
 const xs=ticks(Math.min(...outline.map(p=>p[0])),Math.max(...outline.map(p=>p[0])),step,x),zs=ticks(Math.min(...outline.map(p=>p[1])),Math.max(...outline.map(p=>p[1])),step,z),values=[];
 for(let j=1;j<zs.length;j++)for(let i=1;i<xs.length;i++){
  let pieces=[clip(rect(xs[i-1],zs[j-1],xs[i],zs[j]),outline)];
  for(const hole of holes)pieces=pieces.flatMap(p=>subtract(p,hole));
  for(const p of pieces)triangulate(p,values,height);
 }
 return geometry(values,true);
}
function add(group,g,material,name){const m=new THREE.Mesh(g,material);m.name=name;m.receiveShadow=true;group.add(m);return m;}
const material=color=>new THREE.MeshStandardMaterial({color,roughness:.94,side:THREE.DoubleSide});
function soilCopy(m,context,soil){const g=m.geometry.clone();g.translate(0,-.06,0);return add(context,g,soil,`Supporting soil — ${m.name}`);}

export function buildJoinedSurfaces(model,context,graded,surface){
 const concrete=material('#d0d2cf'),drainConcrete=material('#d7e5e2'),asphalt=material('#595f5b'),soil=material('#c4b08d'),sand=material('#d9c9ac'),wall=material('#c9b79b');
 const x=profiles.flatMap(p=>p.points.map(p=>p[0])),z=[...profiles.map(p=>p.z),gutterZ-1.5,gutterZ+1.5];
 const ribbonHole=rect(80.8,gutterZ-1.5,290,gutterZ+1.5);
 const pavement=add(graded,grid(parkingOutline,parkingY,{x,z,holes:[ribbonHole]}),asphalt,'Finished parking pavement');
 const ribbon=add(surface,grid(ribbonHole,parkingY,{x,z:[gutterZ]}),drainConcrete,'3-ft concrete ribbon gutter');
 const ditchHeight=(x,z)=>channelY(z)+Math.abs(x-ditchX)/1.5*.1;
 const channel=add(surface,grid(ditch,ditchHeight,{x:[ditchX],z:ditchSpots.map(p=>p[0])}),drainConcrete,'West concrete ditch — width schematic');
 for(const m of [pavement,ribbon,channel])soilCopy(m,context,soil);

 // Replace every old soil layer in this patch with one continuous ground mesh.
 // Cutting actual triangles avoids z-fighting between independently tessellated layers.
 for(const o of [...context.children]){
  if(!soilColors.has(o.material.color?.getHexString())&&o.material.color?.getHexString()!=='595f5b')continue;
  const p=o.geometry.attributes.position,values=[];
  for(let i=0;i<p.count;i+=3){
   const tri=[0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k),p.getY(i+k)]);
   for(const poly of subtract(tri,patch))triangulate(poly,values);
  }
  o.geometry.dispose();o.geometry=geometry(values);
 }
 const streetBreaks=[75.8,290,334],streetRows=[0,16,44];
 add(context,grid(patch,(x,z)=>contextY(x,z)-.06,{step:1.5,x:[80.8,...streetBreaks,ditchX-1.5,ditchX,ditchX+1.5],z:[northZ,basinZ-1.5,basinZ+1.5,...streetRows],holes:[parkingOutline,ditch,basin]}),sand,'Continuous ground around parking and sidewalk');
 // The adjoining existing road uses the same break lines as its ground, too.
 // Otherwise its old coarse triangles can expose thin slivers of soil at the bend.
 add(context,grid(rect(306,-80,334,16),(x,z)=>contextY(x,z)+.14,{step:1.5,x:streetBreaks,z:streetRows}),asphalt,'Connected east road');
 add(context,grid(rect(60,16,340,44),(x,z)=>contextY(x,z)+.14,{step:1.5,x:streetBreaks,z:streetRows}),asphalt,'Connected Pueblo Trail road');

 // Each screening wall has one longitudinal grade at both edges of its cap.
 // It cannot twist across the parking/ditch boundary or acquire T-junction cracks.
 const wallSegments=[[[80.8,northZ],[265.3,northZ],6],[[265.3,northZ],[290,northZ],4],[[80.8,northZ],[80.8,-15],6],[[80.8,-15],[80.8,0],4],[[290,northZ],[290,-20],4]];
 for(let a=0;a<Math.PI/2-.001;a+=Math.PI/16)wallSegments.push([[270+20*Math.cos(a),-20+20*Math.sin(a)],[270+20*Math.cos(a+Math.PI/16),-20+20*Math.sin(a+Math.PI/16)],4]);
 for(const [a,b] of [[80.8,91],[99,172.467],[196.467,257],[265,270]])wallSegments.push([[a,0],[b,0],4]);
 const wallValues=[];
 function quad(a,b,c,d,values){values.push(...a,...b,...d,...b,...c,...d);}
 for(const [a,b,h] of wallSegments){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*.35,nz=dx/len*.35;
  const breaks=[0,1];
  if(Math.abs(dx)>1e-8)for(const v of x)breaks.push((v-a[0])/dx);
  if(Math.abs(dz)>1e-8)for(const v of z)breaks.push((v-a[1])/dz);
  const ts=ticks(0,1,2/len,breaks),sections=ts.map(t=>{
   const px=a[0]+dx*t,pz=a[1]+dz*t,y=parkingY(px,pz);
   return [[px-nx,y-.15,pz-nz],[px+nx,y-.15,pz+nz],[px+nx,y+h,pz+nz],[px-nx,y+h,pz-nz]];
  });
  for(let i=1;i<sections.length;i++)for(let j=0;j<4;j++)quad(sections[i-1][j],sections[i][j],sections[i][(j+1)%4],sections[i-1][(j+1)%4],wallValues);
  quad(...sections[0].slice().reverse(),wallValues);quad(...sections.at(-1),wallValues);
 }
 const walls=add(graded,geometry(wallValues),wall,'Continuous solid screening walls');walls.castShadow=true;

 // A shared centerline/normal at each station gives the sidewalk and curb a
 // single joined edge, including the curved corner and both straight approaches.
 const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(269,0,7),new THREE.Vector3(288,0,7),new THREE.Vector3(297,0,-3),new THREE.Vector3(297,0,-22));
 const corner=curve.getPoints(60).map(p=>[p.x,p.z]);
 const path=[];
 for(let px=196.467;px<269;px+=1.5)path.push([px,7]);path.push(...corner);
 for(let pz=-23.5;pz>-131;pz-=1.5)path.push([297,pz]);path.push([297,-131]);
 const west=[];for(let px=0;px<172.467;px+=1.5)west.push([px,7]);west.push([172.467,7]);
 const joins=[];let cornerOuter;
 function stroke(points,left,right,bottom,top,name){
  const values=[],sections=points.map((p,i)=>{
   const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   let nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len;
   if(p[1]===7&&p[0]<=269){nx=0;nz=1;}else if(p[0]===297&&p[1]<=-22){nx=1;nz=0;}
   return ticks(left,right,.75,[0]).map(t=>{const x=p[0]+nx*t,z=p[1]+nz*t;return [x,contextY(x,z),z];});
  });
  const lift=(p,h)=>[p[0],p[1]+h,p[2]];
  for(let i=1;i<sections.length;i++){
   const row=sections[i-1],next=sections[i],a=row[0],b=row.at(-1),d=next[0],c=next.at(-1);
   for(let j=1;j<row.length;j++)quad(lift(row[j-1],top),lift(row[j],top),lift(next[j],top),lift(next[j-1],top),values);
   quad(lift(a,bottom),lift(a,top),lift(d,top),lift(d,bottom),values);
   quad(lift(b,top),lift(b,bottom),lift(c,bottom),lift(c,top),values);
  }
  for(const ends of [sections[0],sections.at(-1)])quad(lift(ends[0],bottom),lift(ends.at(-1),bottom),lift(ends.at(-1),top),lift(ends[0],top),values);
  const m=add(graded,geometry(values),concrete,name);m.castShadow=true;return sections.map(s=>[s[0],s.at(-1)]);
 }
 for(const [points,name] of [[west,'West sidewalk'],[path,'Continuous corner sidewalk']]){
  const sidewalk=stroke(points,-3,3,-.08,.30,name),curb=stroke(points,3,3.55,-.08,.45,`${name} curb`);
  for(let i=0;i<sidewalk.length;i++)joins.push([sidewalk[i][1],curb[i][0]]);
  if(points===path)cornerOuter=curb.filter((_,i)=>points[i][0]>=269&&points[i][1]>=-22).map(s=>[s[1][0],s[1][2]]);
 }
 // Fill the outside of the curved curb, with no missing triangular street patch
 // and no overlapping arms at the corner.
 const insideCorner=[[269,-22],...cornerOuter.slice().reverse()];
 add(graded,grid(rect(0,8,269,16),(x,z)=>contextY(x,z)+.12,{step:1.5,z:[10,16]}),asphalt,'South street widening');
 add(graded,grid(rect(298,-131,306,-22),(x,z)=>contextY(x,z)+.12,{step:1.5}),asphalt,'East street widening');
 add(graded,grid(rect(269,-22,306,16),(x,z)=>contextY(x,z)+.12,{step:1.5,z:[0,16],holes:[insideCorner]}),asphalt,'Continuous street corner');
 add(graded,grid(rect(172.467,0,196.467,10),(x,z)=>contextY(x,z)+.24,{step:1.5,z:[0]}),concrete,'Driveway apron');
 return {pavement,ribbon,channel,walls,joins,wallSegments};
}

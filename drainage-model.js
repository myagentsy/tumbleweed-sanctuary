import * as THREE from './assets/three.module.js';
import {datum,gutterZ,ditchX,basinZ,northZ,profiles,ditchSpots,elevation,parkingY,channelY,ribbonY,contextY} from './plan-grading.js?v=grade2';

// Figure 3-4, IS/MND PDF p.37, and drainage narrative p.23.
// XY placement is traced/aligned to the retained architectural footprint.
// Missing civil details are identified as schematic, never treated as dimensions.
export function buildDrainage(model) {
 const root=new THREE.Group();root.name='Drainage overlay — Figure 3-4';root.visible=false;model.root.add(root);
 const context=new THREE.Group(),graded=new THREE.Group(),cars=new THREE.Group(),surface=new THREE.Group(),network=new THREE.Group();root.add(context,graded,cars,surface,network);context.name="Grounded Layer 5 context";
 graded.name='Layer 5 — finished grades';surface.name='Permanent surface drainage';network.name='Optional drainage explanation';
 const wellX=75.8,wellZ=-7,anchors=profiles[2].points.map(([x,h])=>[x,h-datum]),screeningMaterials=[];
 const interpolate=ribbonY;
 const sharedNative=model.proposed.children.filter(o=>o.isInstancedMesh);
 // Bake copies, retaining X/Z coordinates and leaving all original layers untouched.
 model.root.updateMatrixWorld(true);
 function bake(source,destination){const batches=new Map();source.traverse(o=>{if(!o.isMesh)return;const transforms=[];if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const a=new THREE.Matrix4();o.getMatrixAt(i,a);transforms.push(a.premultiply(o.matrixWorld));}}else transforms.push(o.matrixWorld);
  let material=o.material;if(o===model.parkingSurface){material=material.clone();material.color.set('#595f5b');}
  // Concrete walls remain opaque in both graded and drainage views.
  if(o.parent===model.screening){material=material.clone();screeningMaterials.push(material);}
  const key=material.uuid;let batch=batches.get(key);if(!batch){batch={material,values:[],cast:o.castShadow};batches.set(key,batch);}
  const g=o.geometry,index=g.index,position=g.attributes.position;
  function emit(a,b,c,refine){if(source===model.common&&(Math.min(a.z,b.z,c.z)>84||Math.max(a.z,b.z,c.z)<-205||Math.max(a.x,b.x,c.x)<-30||Math.min(a.x,b.x,c.x)>380))refine=false;if(refine){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);if(Math.max(ab,bc,ca)>(source===model.common?64:16)){if(ab>=bc&&ab>=ca){const m=a.clone().add(b).multiplyScalar(.5);emit(a,m,c,true);emit(m,b,c,true);}else if(bc>=ca){const m=b.clone().add(c).multiplyScalar(.5);emit(a,b,m,true);emit(a,m,c,true);}else{const m=c.clone().add(a).multiplyScalar(.5);emit(a,b,m,true);emit(m,b,c,true);}return;}}
   for(const v of [a,b,c]){const lift=source===model.common?contextY(v.x,v.z):elevation(v.x,v.z);batch.values.push(v.x,v.y+lift-(source===model.parkingLayout?.22:source===model.common&&['cfbda0','d9c9ac','cabb9d','d0bea0'].includes(material.color?.getHexString())?.06:0),v.z);}
  }
  for(const transform of transforms)for(let i=0;i<(index?index.count:position.count);i+=3){const points=[0,1,2].map(n=>new THREE.Vector3().fromBufferAttribute(position,index?index.getX(i+n):i+n).applyMatrix4(transform));emit(...points,source===model.common?points.every(v=>v.y<.5):source!==model.carsProposed);}
 });for(const b of batches.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.values,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=true;destination.add(mesh);}}
 bake(model.common,context);bake(model.parkingLayout,graded);const parkingMeshes=[...graded.children];bake(model.originalDesign,graded);for(const o of sharedNative)bake(o,graded);bake(model.carsProposed,cars);
 const concrete=new THREE.MeshStandardMaterial({color:'#d7e5e2',roughness:.94,side:THREE.DoubleSide});
 const blue=new THREE.MeshBasicMaterial({color:'#057eb1',depthTest:false,depthWrite:false});
 const cyan=new THREE.MeshBasicMaterial({color:'#42cfec',depthTest:false,depthWrite:false});
 const amber=new THREE.MeshBasicMaterial({color:'#d88229',depthTest:false,depthWrite:false,transparent:true,opacity:.65,wireframe:true});
 function mesh(g,m,name,parent=network){const o=new THREE.Mesh(g,m);o.name=name;o.renderOrder=m.depthTest===false?30:0;parent.add(o);return o;}
 function tube(points,radius,material,name){const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return mesh(new THREE.TubeGeometry(path,Math.max(1,(points.length-1)*6),radius,8,false),material,name);}
 function strip(points,width,heightAt,name){const v=[],ix=[];points.forEach(([x,z],i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;for(const side of [-1,0,1])v.push(x+nx*width/2*side,heightAt(x,z)+(side===0?0:.1),z+nz*width/2*side);if(i){const k=i*3;ix.push(k-3,k,k-2,k-2,k,k+1,k-2,k+1,k-1,k-1,k+1,k+2);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return mesh(g,concrete,name,surface);}
 const ribbonPoints=[];for(let x=80.8;x<=290;x+=2)ribbonPoints.push([x,gutterZ]);ribbonPoints.push([290,gutterZ]);
 strip(ribbonPoints,3,(x)=>interpolate(x)+.025,'3-ft concrete ribbon gutter');
 const ditchPoints=ditchSpots.map(([z])=>[ditchX,z]);
 strip(ditchPoints,3,(_,z)=>channelY(z)+.025,'West concrete ditch — width schematic');
 tube([[80.8,ribbonY(80.8)+.06,gutterZ],[ditchX,channelY(gutterZ)+.06,gutterZ]],.15,blue,'Ribbon gutter transition to ditch — coordination schematic');
 function arrow(a,b,size=1){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);const arrow=new THREE.ArrowHelper(d.clone().normalize(),va,d.length(),blue.color,2.3*size,1.5*size);arrow.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.depthWrite=false;}o.renderOrder=35;});network.add(arrow);return arrow;}
 for(const x of [112,155,202,250]){
  arrow([x,elevation(x,-50)+.8,-50],[x,elevation(x,-36)+.8,-36]);
  arrow([x,elevation(x,-10)+.8,-10],[x,elevation(x,-30)+.8,-30]);
 }
 for(const z of [-57,-9])for(const x of [140,200,260])arrow([x,elevation(x,z)+.8,z],[x-23,elevation(x-23,z)+.8,z],.75);
 for(const x of [120,160,200,240,278])arrow([x,interpolate(x)+.8,gutterZ],[x-24,interpolate(x-24)+.8,gutterZ]);
 for(const z of [-57,-38])arrow([ditchX,channelY(z)+.5,z],[ditchX,channelY(z+13)+.5,z+13],.65);
 // 36-inch nominal catch-basin grate; lower box extent is NOT inferred from invert.
 const grateMaterial=new THREE.MeshStandardMaterial({color:'#39656d',roughness:.8});
 const grate=mesh(new THREE.BoxGeometry(3,.14,3),grateMaterial,'36-inch nominal catch-basin grate',surface);grate.position.set(ditchX,-.07,basinZ);
 for(let x=-1.2;x<=1.21;x+=.4){const bar=mesh(new THREE.BoxGeometry(.07,.035,2.6),concrete,'Grate bar',surface);bar.position.set(ditchX+x,.018,basinZ);}
 const boxFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3,1,3)),new THREE.LineBasicMaterial({color:'#057eb1',depthTest:false,depthWrite:false}));boxFrame.position.set(ditchX,-.5,basinZ);boxFrame.renderOrder=31;network.add(boxFrame);boxFrame.name='Grate-to-invert interval only — full basin depth unspecified';
 const inlet=tube([[ditchX,-.75,basinZ],[wellX,-.85,wellZ]],.25,cyan,'6-inch storm-drain connection');
 inlet.userData.diameterInches=6;
 // Open wire symbol rather than an invented solid storage tank or claimed capacity.
 const well=mesh(new THREE.CylinderGeometry(2.5,2.5,5,12,1,true),amber,'Drywell symbol only — diameter and total depth unspecified');well.position.set(wellX,-1.5,wellZ);well.userData.schematic=true;
 arrow([wellX,.5,wellZ],[wellX,-3.6,wellZ],.5);
 const overflow=tube([[wellX,-.933333,wellZ],[wellX,-.933333,12],[72,-.933333,16]],1/6,cyan,'4-inch overflow to parkway drain — route/profile schematic');overflow.userData.diameterInches=4;
 for(const z of [0,8])arrow([wellX,-.75,z],[wellX,-.75,z+5],.4);
 const outlet=mesh(new THREE.BoxGeometry(2,.35,.7),blue,'Parkway drain marker — SD 406');outlet.position.set(72,-.93,16);
 const sectionMaterial=new THREE.MeshStandardMaterial({color:'#c4b08d',roughness:1,side:THREE.DoubleSide});
 const edge=[[80.8,northZ],[290,northZ],[290,-20]];
 for(let a=0;a<=Math.PI/2+.001;a+=Math.PI/24)edge.push([270+20*Math.cos(a),-20+20*Math.sin(a)]);
 edge.push([80.8,0],[80.8,northZ]);
 // Excavate the context surface at the parking footprint. Clipping the real
 // triangles prevents interpolated soil edges from protruding through asphalt.
 const footprint=edge.slice(0,-1);
 function outsideParking(poly){
  let inside=poly;const outside=[];
  for(let j=0;j<footprint.length&&inside.length;j++){
   const a=footprint[j],b=footprint[(j+1)%footprint.length],distance=p=>(b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]),keep=[],reject=[];
   for(let k=0;k<inside.length;k++){
    const p=inside[k],q=inside[(k+1)%inside.length],dp=distance(p),dq=distance(q);
    (dp>=0?keep:reject).push(p);
    if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq),hit=p.map((v,n)=>v+(q[n]-v)*t);keep.push(hit);reject.push(hit);}
   }
   if(reject.length>=3)outside.push(reject);inside=keep;
  }
  return outside;
 }
 for(const o of context.children){
  if(!['cfbda0','d9c9ac','cabb9d','d0bea0'].includes(o.material.color?.getHexString()))continue;
  const a=o.geometry.attributes.position,result=[];
  for(let i=0;i<a.count;i+=3){const tri=[0,1,2].map(k=>[a.getX(i+k),a.getY(i+k),a.getZ(i+k)]);
   const pieces=tri.every(v=>v[0]<80.8)||tri.every(v=>v[0]>290)||tri.every(v=>v[2]<northZ)||tri.every(v=>v[2]>0)?[tri]:outsideParking(tri);
   for(const poly of pieces)for(let j=1;j<poly.length-1;j++)result.push(...poly[0],...poly[j],...poly[j+1]);
  }
  o.geometry.dispose();o.geometry=new THREE.BufferGeometry();o.geometry.setAttribute('position',new THREE.Float32BufferAttribute(result,3));o.geometry.computeVertexNormals();
 }
 for(const o of parkingMeshes.filter(o=>o.material.color?.getHexString()==='595f5b')){
  const g=o.geometry.clone();g.translate(0,-.06,0);mesh(g,sectionMaterial,'Soil directly beneath finished pavement',context);
 }
 const section=[];
 for(let i=1;i<edge.length;i++){
  const a=edge[i-1],b=edge[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);
  for(let j=0;j<steps;j++){
   const u=j/steps,v=(j+1)/steps,x1=THREE.MathUtils.lerp(a[0],b[0],u),z1=THREE.MathUtils.lerp(a[1],b[1],u),x2=THREE.MathUtils.lerp(a[0],b[0],v),z2=THREE.MathUtils.lerp(a[1],b[1],v),y1=parkingY(x1,z1)-.025,y2=parkingY(x2,z2)-.025;
   const b1=contextY(x1,z1)-.3,b2=contextY(x2,z2)-.3;section.push(x1,b1,z1,x2,b2,z2,x1,y1,z1,x1,y1,z1,x2,b2,z2,x2,y2,z2);
  }
 }
 const sectionGeo=new THREE.BufferGeometry();sectionGeo.setAttribute('position',new THREE.Float32BufferAttribute(section,3));sectionGeo.computeVertexNormals();
 mesh(sectionGeo,sectionMaterial,'Soil connection beneath pavement edge',surface);
 // Labels follow the rebuilt finished surface when the overlay is off.
 for(const label of model.labels.filter(l=>l.original))label.point[1]+=elevation(label.point[0],label.point[2]);
 const labels=[
  {text:'36″ catch basin',sub:'GRATE 3362.00 · PIPE INVERT 3361.00',point:[ditchX,3,basinZ],kind:'callout drainage-label',drainage:true},
  {text:'Drywell + 4″ overflow',sub:'UNDERGROUND · DRYWELL SIZE UNSPECIFIED',point:[wellX,-2,wellZ+5],kind:'callout drainage-label',drainage:true},
  {text:'Parking falls west → ditch falls south',sub:'FIGURE 3-4 · TRUE VERTICAL SCALE',point:[185,interpolate(185)+2,gutterZ],kind:'callout drainage-label',drainage:true}
 ];model.labels.unshift(...labels);
 return {root,context,graded,cars,surface,network,labels,datum,elevation,contextY,parkingY,channelY,profiles,ditchSpots,anchors,inlet,overflow,well,
  setVisible(active,showCars,showOverlay=false){
   root.visible=active;model.common.visible=!active;cars.visible=active&&showCars;network.visible=showOverlay;
   model.parkingLayout.visible=!active;for(const o of sharedNative)o.visible=!active;
   for(const material of screeningMaterials){material.transparent=false;material.opacity=1;material.depthWrite=true;}
   if(active){model.originalDesign.visible=false;model.carsProposed.visible=false;}
  },
  stats:{catchBasinNominalInches:36,ribbonWidthFeet:3,inletDiameterInches:6,overflowDiameterInches:4,drywellDimensionsKnown:false}
 };
}

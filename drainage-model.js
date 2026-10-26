import * as THREE from './assets/three.module.js';

// Figure 3-4, IS/MND PDF p.37, and drainage narrative p.23.
// XY placement is traced/aligned to the retained architectural footprint.
// Missing civil details are identified as schematic, never treated as dimensions.
export function buildDrainage(model) {
 const root=new THREE.Group();root.name='Drainage overlay — Figure 3-4';root.visible=false;model.root.add(root);
 const graded=new THREE.Group(),cars=new THREE.Group(),network=new THREE.Group();root.add(graded,cars,network);
 const datum=3362, gutterZ=-33.3, ditchX=77.8, basinZ=-16, wellX=75.8, wellZ=-7;
 const anchors=[[80.8,.3],[130,2.65],[164,4],[230,5.85],[290,8.05]];
 function interpolate(x){for(let i=1;i<anchors.length;i++){if(x<=anchors[i][0]){const [a,b]=[anchors[i-1],anchors[i]];return THREE.MathUtils.lerp(a[1],b[1],THREE.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1));}}return anchors.at(-1)[1];}
 function elevation(x,z){if(x<73||x>310||z<-70||z>17)return 0;return interpolate(x)+Math.abs(z-gutterZ)*.027;}
 function channelY(z){return z<gutterZ?THREE.MathUtils.lerp(1.2,.3,(z+66.83)/(gutterZ+66.83)):THREE.MathUtils.lerp(.3,0,THREE.MathUtils.clamp((z-gutterZ)/(basinZ-gutterZ),0,1));}
 const sharedNative=model.proposed.children.filter(o=>o.isInstancedMesh);
 // Bake copies, retaining X/Z coordinates and leaving all original layers untouched.
 model.root.updateMatrixWorld(true);
 function bake(source,destination){const batches=new Map();source.traverse(o=>{if(!o.isMesh)return;const transforms=[];if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const a=new THREE.Matrix4();o.getMatrixAt(i,a);transforms.push(a.premultiply(o.matrixWorld));}}else transforms.push(o.matrixWorld);
  let material=o.material;if(o===model.parkingSurface){material=material.clone();material.color.set('#595f5b');}
  // Walls remain recognizable but translucent in this explanatory overlay.
  if(o.parent===model.screening){material=material.clone();material.transparent=true;material.opacity=.28;material.depthWrite=false;}
  const key=material.uuid;let batch=batches.get(key);if(!batch){batch={material,values:[],cast:o.castShadow};batches.set(key,batch);}
  const g=o.geometry,index=g.index,position=g.attributes.position;
  function emit(a,b,c,refine){if(refine){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);if(Math.max(ab,bc,ca)>64){if(ab>=bc&&ab>=ca){const m=a.clone().add(b).multiplyScalar(.5);emit(a,m,c,true);emit(m,b,c,true);}else if(bc>=ca){const m=b.clone().add(c).multiplyScalar(.5);emit(a,b,m,true);emit(a,m,c,true);}else{const m=c.clone().add(a).multiplyScalar(.5);emit(a,b,m,true);emit(m,b,c,true);}return;}}
   for(const v of [a,b,c])batch.values.push(v.x,v.y+elevation(v.x,v.z),v.z);
  }
  for(const transform of transforms)for(let i=0;i<(index?index.count:position.count);i+=3){const points=[0,1,2].map(n=>new THREE.Vector3().fromBufferAttribute(position,index?index.getX(i+n):i+n).applyMatrix4(transform));emit(...points,o===model.parkingSurface);}
 });for(const b of batches.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.values,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=true;destination.add(mesh);}}
 bake(model.parkingLayout,graded);bake(model.originalDesign,graded);for(const o of sharedNative)bake(o,graded);bake(model.carsProposed,cars);
 const concrete=new THREE.MeshStandardMaterial({color:'#d7e5e2',roughness:.94,side:THREE.DoubleSide});
 const blue=new THREE.MeshBasicMaterial({color:'#057eb1',depthTest:false,depthWrite:false});
 const cyan=new THREE.MeshBasicMaterial({color:'#42cfec',depthTest:false,depthWrite:false});
 const amber=new THREE.MeshBasicMaterial({color:'#d88229',depthTest:false,depthWrite:false,transparent:true,opacity:.65,wireframe:true});
 function mesh(g,m,name){const o=new THREE.Mesh(g,m);o.name=name;o.renderOrder=m.depthTest===false?30:0;network.add(o);return o;}
 function tube(points,radius,material,name){const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return mesh(new THREE.TubeGeometry(path,Math.max(1,(points.length-1)*6),radius,8,false),material,name);}
 function strip(points,width,heightAt,name){const v=[],ix=[];points.forEach(([x,z],i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;for(const side of [-1,0,1])v.push(x+nx*width/2*side,heightAt(x,z)+(side===0?0:.1),z+nz*width/2*side);if(i){const k=i*3;ix.push(k-3,k,k-2,k-2,k,k+1,k-2,k+1,k-1,k-1,k+1,k+2);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return mesh(g,concrete,name);}
 const ribbonPoints=[];for(let x=80.8;x<=290;x+=2)ribbonPoints.push([x,gutterZ]);ribbonPoints.push([290,gutterZ]);
 strip(ribbonPoints,3,(x)=>interpolate(x)+.27,'3-ft concrete ribbon gutter');
 const ditchPoints=[];for(let z=-66.83;z<basinZ;z+=2)ditchPoints.push([ditchX,z]);ditchPoints.push([ditchX,basinZ]);
 strip(ditchPoints,3,(_,z)=>channelY(z)+.05,'West concrete ditch — width schematic');
 tube([[80.8,.57,gutterZ],[ditchX,.35,gutterZ]],.3,blue,'Ribbon gutter transition to ditch — coordination schematic');
 function arrow(a,b,size=1){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);const arrow=new THREE.ArrowHelper(d.clone().normalize(),va,d.length(),blue.color,2.3*size,1.5*size);arrow.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.depthWrite=false;}o.renderOrder=35;});network.add(arrow);return arrow;}
 for(const x of [112,155,202,250]){
  arrow([x,elevation(x,-50)+.8,-50],[x,elevation(x,-36)+.8,-36]);
  arrow([x,elevation(x,-10)+.8,-10],[x,elevation(x,-30)+.8,-30]);
 }
 for(const x of [120,160,200,240,278])arrow([x,interpolate(x)+.8,gutterZ],[x-24,interpolate(x-24)+.8,gutterZ]);
 for(const z of [-57,-38])arrow([ditchX,channelY(z)+.5,z],[ditchX,channelY(z+13)+.5,z+13],.65);
 // 36-inch nominal catch-basin grate; lower box extent is NOT inferred from invert.
 const grate=mesh(new THREE.BoxGeometry(3,.14,3),cyan,'36-inch nominal catch-basin grate');grate.position.set(ditchX,.07,basinZ);
 for(let x=-1.2;x<=1.21;x+=.4)tube([[ditchX+x,.17,basinZ-1.3],[ditchX+x,.17,basinZ+1.3]],.035,blue,'Grate bar');
 const boxFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3,1,3)),new THREE.LineBasicMaterial({color:'#057eb1',depthTest:false,depthWrite:false}));boxFrame.position.set(ditchX,-.5,basinZ);boxFrame.renderOrder=31;network.add(boxFrame);boxFrame.name='Grate-to-invert interval only — full basin depth unspecified';
 const inlet=tube([[ditchX,-.75,basinZ],[wellX,-.85,wellZ]],.25,cyan,'6-inch storm-drain connection');
 inlet.userData.diameterInches=6;
 // Open wire symbol rather than an invented solid storage tank or claimed capacity.
 const well=mesh(new THREE.CylinderGeometry(2.5,2.5,5,12,1,true),amber,'Drywell symbol only — diameter and total depth unspecified');well.position.set(wellX,-1.5,wellZ);well.userData.schematic=true;
 arrow([wellX,.5,wellZ],[wellX,-3.6,wellZ],.5);
 const overflow=tube([[wellX,-.933333,wellZ],[wellX,-.933333,12],[72,-.933333,16]],1/6,cyan,'4-inch overflow to parkway drain — route/profile schematic');overflow.userData.diameterInches=4;
 for(const z of [0,8])arrow([wellX,-.75,z],[wellX,-.75,z+5],.4);
 const outlet=mesh(new THREE.BoxGeometry(2,.35,.7),blue,'Parkway drain marker — SD 406');outlet.position.set(72,-.93,16);
 const labels=[
  {text:'36″ catch basin',sub:'GRATE 3362.00 · PIPE INVERT 3361.00',point:[ditchX,3,basinZ],kind:'callout drainage-label',drainage:true},
  {text:'Drywell + 4″ overflow',sub:'UNDERGROUND · DRYWELL SIZE UNSPECIFIED',point:[wellX,-2,wellZ+5],kind:'callout drainage-label',drainage:true},
  {text:'3-ft ribbon gutter → west ditch',sub:'BLUE ARROWS = SURFACE FLOW',point:[185,interpolate(185)+2,gutterZ],kind:'callout drainage-label',drainage:true}
 ];model.labels.unshift(...labels);
 return {root,graded,cars,network,labels,datum,elevation,anchors,inlet,overflow,well,
  setVisible(active,showCars){root.visible=active;cars.visible=active&&showCars;model.parkingLayout.visible=!active;for(const o of sharedNative)o.visible=!active;if(active){model.originalDesign.visible=false;model.carsProposed.visible=false;}},
  stats:{catchBasinNominalInches:36,ribbonWidthFeet:3,inletDiameterInches:6,overflowDiameterInches:4,drywellDimensionsKnown:false}
 };
}

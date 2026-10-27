import * as THREE from './assets/three.module.js';
import {datum,gutterZ,ditchX,basinZ,northZ,profiles,ditchSpots,elevation,parkingY,channelY,ribbonY,contextY} from './plan-grading.js?v=grade3';

import {buildJoinedSurfaces} from './graded-surfaces.js?v=frontage1';

// Figure 3-4, IS/MND PDF p.37, and drainage narrative p.23.
// XY placement is traced/aligned to the retained architectural footprint.
// Missing civil details are identified as schematic, never treated as dimensions.
export function buildDrainage(model) {
 const root=new THREE.Group();root.name='Drainage overlay — Figure 3-4';root.visible=false;model.root.add(root);
 const context=new THREE.Group(),graded=new THREE.Group(),cars=new THREE.Group(),surface=new THREE.Group(),network=new THREE.Group();root.add(context,graded,cars,surface,network);context.name="Grounded Layer 5 context";
 graded.name='Layer 5 — finished grades';surface.name='Permanent surface drainage';network.name='Optional drainage explanation';
 const wellX=75.8,wellZ=-7,anchors=profiles[2].points.map(([x,h])=>[x,h-datum]);
 const interpolate=ribbonY;
 const sharedNative=model.proposed.children.filter(o=>o.isInstancedMesh);
 // Bake copies, retaining X/Z coordinates and leaving all original layers untouched.
 model.root.updateMatrixWorld(true);
 function bake(source,destination){const batches=new Map();source.traverse(o=>{if(!o.isMesh||o===model.parkingSurface||o.parent===model.screening||o.parent===model.originalFrontage)return;const transforms=[];if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const a=new THREE.Matrix4();o.getMatrixAt(i,a);transforms.push(a.premultiply(o.matrixWorld));}}else transforms.push(o.matrixWorld);
  const material=o.material;
  const key=material.uuid;let batch=batches.get(key);if(!batch){batch={material,values:[],cast:o.castShadow};batches.set(key,batch);}
  const g=o.geometry,index=g.index,position=g.attributes.position;if(g.attributes.color){const copy=o.clone();copy.geometry=g.clone().applyMatrix4(o.matrixWorld);const p=copy.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+contextY(p.getX(i),p.getZ(i)));copy.geometry.computeVertexNormals();copy.position.set(0,0,0);copy.quaternion.identity();copy.scale.set(1,1,1);destination.add(copy);return;}
  function emit(a,b,c,refine){if(source===model.common&&(Math.min(a.z,b.z,c.z)>84||Math.max(a.z,b.z,c.z)<-205||Math.max(a.x,b.x,c.x)<-30||Math.min(a.x,b.x,c.x)>380))refine=false;if(refine){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);if(Math.max(ab,bc,ca)>(source===model.common?64:16)){if(ab>=bc&&ab>=ca){const m=a.clone().add(b).multiplyScalar(.5);emit(a,m,c,true);emit(m,b,c,true);}else if(bc>=ca){const m=b.clone().add(c).multiplyScalar(.5);emit(a,b,m,true);emit(a,m,c,true);}else{const m=c.clone().add(a).multiplyScalar(.5);emit(a,b,m,true);emit(m,b,c,true);}return;}}
   for(const v of [a,b,c]){const lift=source===model.common?contextY(v.x,v.z):elevation(v.x,v.z);batch.values.push(v.x,v.y+lift-(source===model.parkingLayout?.22:source===model.common&&['cfbda0','d9c9ac','cabb9d','d0bea0'].includes(material.color?.getHexString())?.06:0),v.z);}
  }
  for(const transform of transforms)for(let i=0;i<(index?index.count:position.count);i+=3){const points=[0,1,2].map(n=>new THREE.Vector3().fromBufferAttribute(position,index?index.getX(i+n):i+n).applyMatrix4(transform));emit(...points,source===model.common?points.every(v=>v.y<.5):source!==model.carsProposed);}
 });for(const b of batches.values()){if(!b.values.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.values,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=true;destination.add(mesh);}}
 bake(model.common,context);bake(model.parkingLayout,graded);bake(model.originalDesign,graded);for(const o of sharedNative)bake(o,graded);bake(model.carsProposed,cars);
 const roadTicks=model.puebloRoad.annotations.clone(true);roadTicks.traverse(o=>{if(o.isLine){o.geometry=o.geometry.clone();const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+contextY(p.getX(i),p.getZ(i)));}});root.add(roadTicks);
 const joined=buildJoinedSurfaces(model,context,graded,surface);
 const concrete=new THREE.MeshStandardMaterial({color:'#d7e5e2',roughness:.94,side:THREE.DoubleSide});
 const blue=new THREE.MeshBasicMaterial({color:'#057eb1',depthTest:false,depthWrite:false});
 const cyan=new THREE.MeshBasicMaterial({color:'#42cfec',depthTest:false,depthWrite:false});
 const amber=new THREE.MeshBasicMaterial({color:'#d88229',depthTest:false,depthWrite:false,transparent:true,opacity:.65,wireframe:true});
 function mesh(g,m,name,parent=network){const o=new THREE.Mesh(g,m);o.name=name;o.renderOrder=m.depthTest===false?30:0;parent.add(o);return o;}
 function tube(points,radius,material,name){const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return mesh(new THREE.TubeGeometry(path,Math.max(1,(points.length-1)*6),radius,8,false),material,name);}
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
 // Labels follow the rebuilt finished surface when the overlay is off.
 for(const label of model.labels.filter(l=>l.original))label.point[1]+=elevation(label.point[0],label.point[2]);
 const labels=[
  {text:'36″ catch basin',sub:'GRATE 3362.00 · PIPE INVERT 3361.00',point:[ditchX,3,basinZ],kind:'callout drainage-label',drainage:true},
  {text:'Drywell + 4″ overflow',sub:'UNDERGROUND · DRYWELL SIZE UNSPECIFIED',point:[wellX,-2,wellZ+5],kind:'callout drainage-label',drainage:true},
  {text:'Parking falls west → ditch falls south',sub:'FIGURE 3-4 · TRUE VERTICAL SCALE',point:[185,interpolate(185)+2,gutterZ],kind:'callout drainage-label',drainage:true}
 ];model.labels.unshift(...labels);
 return {root,context,graded,cars,surface,network,labels,joined,datum,elevation,contextY,parkingY,channelY,profiles,ditchSpots,anchors,inlet,overflow,well,
  setVisible(active,showCars,showOverlay=false){
   root.visible=active;model.common.visible=!active;cars.visible=active&&showCars;network.visible=showOverlay;
   model.parkingLayout.visible=!active;for(const o of sharedNative)o.visible=!active;
   if(active){model.originalDesign.visible=false;model.carsProposed.visible=false;}
  },
  stats:{catchBasinNominalInches:36,ribbonWidthFeet:3,inletDiameterInches:6,overflowDiameterInches:4,drywellDimensionsKnown:false}
 };
}

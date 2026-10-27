import * as THREE from './assets/three.module.js';

// Feet, x east / z south. Pavement boundary follows the resident's location.
// Rounded corridor length from Esri aerial/street context, checked 2026-10-27.
// Photos have no survey control. The local channel is a visual reconstruction,
// not an exact trace or a claim that the rest of the corridor has been surveyed.
export const roadExtent={west:-1000,bonita:-360,transition:0,lengthFeet:1000};
const lerp=(x,points)=>{for(let i=1;i<points.length;i++)if(x<=points[i][0]){const [a,b]=[points[i-1],points[i]],t=Math.max(0,(x-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*t;}return points.at(-1)[1];};
export function roadSection(x){
 const center=lerp(x,[[-230,30],[-190,28],[-150,32],[-110,29],[-70,32],[-35,35],[0,40]]);
 const fade=Math.max(0,Math.min(1,(-x)/8,(x+230)/30));
 const depth=lerp(x,[[-230,1],[-190,1.25],[-155,1.6],[-125,2],[-85,1.25],[-52,1.8],[-25,1.2],[0,1]])*fade;
 const halfWidth=(2.5+.45*Math.sin(x*.17)+.25*Math.sin(x*.61))*fade;
 return {center,depth,halfWidth};
}
export function buildPuebloRoad(common,labels){
 const group=new THREE.Group();group.name='Existing Pueblo Trail road condition';common.add(group);
 const make=(positions,colors,name)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colors?'#ffffff':'#c5b28e',vertexColors:!!colors,roughness:1,side:THREE.DoubleSide}));m.name=name;m.receiveShadow=true;group.add(m);return m;};
 const triangles=[],colors=[];const sand=new THREE.Color('#bfa983'),bank=new THREE.Color('#a18462'),bed=new THREE.Color('#87765f');
 const stations=[];for(let x=-1000;x<=-232;x+=8)stations.push(x);for(let x=-230;x<=0;x+=1)stations.push(x);
 function ring(x){const {center:c,depth:d,halfWidth:w}=roadSection(x),inner=Math.min(.55,w*.3);return [[x,.015,16],[x,.14,18],[x,.14,c-w-.3],[x,.14-Math.min(d,.02),c-w],[x,.14-d*.82,c-inner],[x,.14-d,c],[x,.14-d*.8,c+inner],[x,.14-Math.min(d,.02),c+w],[x,.14,c+w+.3],[x,.14,42],[x,.015,44]];}
 function vertex(p,k){triangles.push(...p);const color=roadSection(p[0]).depth===0?sand:k>=4&&k<=6?bed:k===3||k===7?bank:sand;colors.push(color.r,color.g,color.b);}
 for(let i=1;i<stations.length;i++){const a=ring(stations[i-1]),b=ring(stations[i]);for(let j=0;j<a.length-1;j++){for(const [p,k] of [[a[j],j],[a[j+1],j+1],[b[j],j],[a[j+1],j+1],[b[j+1],j+1],[b[j],j]])vertex(p,k);}}
 const dirt=make(triangles,colors,'Dirt roadway with incised channel — approximate photo reconstruction');
 // Remote context is intentionally spare; road profile and parcels are not surveyed.
 // Solid earth reaches the same bottom as the site, with a cutout under the road.
 function earth(x0,z0,x1,z1,top){const g=new THREE.BoxGeometry(x1-x0,top+7,z1-z0);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#cabb9d',roughness:1}));m.position.set((x0+x1)/2,(top-7)/2,(z0+z1)/2);m.receiveShadow=true;group.add(m);}
 earth(-1120,-205,-210,16,0);earth(-1120,44,-210,190,0);earth(-1120,16,-210,44,-2.6);
 const rect=(x0,z0,x1,z1,y)=>[x0,y,z0,x0,y,z1,x1,y,z0,x0,y,z1,x1,y,z1,x1,y,z0];
 make([...rect(-1060,0,-210,16,.015),...rect(-1060,44,-210,62,.015)],null,'Dirt corridor shoulders — schematic context');
 const paved=make([...rect(-1014,-85,-986,16,.14),...rect(-1014,44,-986,140,.14),...rect(-1100,16,-1000,44,.14)],null,'Paved connection at Warren Vista — approximate context');paved.material.color.set('#595f5b');
 make([...rect(-374,-85,-346,16,.08),...rect(-374,44,-346,130,.08)],null,'Bonita Avenue crossing — context');
 const annotations=new THREE.Group();annotations.name='Road condition annotations';common.add(annotations);
 // Depth tick at the reconstructed deepest section; depth itself is resident-reported.
 const {center}=roadSection(-125),p=[[-125,.14,center],[-125,-1.86,center],[-125,-1.86,center-1],[-125,-1.86,center+1],[-125,.14,center-1],[-125,.14,center+1]];
 const geo=new THREE.BufferGeometry().setFromPoints(p.map(a=>new THREE.Vector3(...a)));
 const tick=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#c76536',depthTest:false,depthWrite:false}));tick.renderOrder=25;annotations.add(tick);
 labels.unshift(
  {text:'Existing runoff washout',sub:'REPORTED DEPTH 1–2 FT · APPROXIMATE TRACE',point:[-125,3,center],kind:'callout road-condition',roadDetail:true},
  {text:'Pavement ends here',sub:'NORTH LOT / HOME BOUNDARY',point:[0,1,44],kind:'callout road-condition',roadContext:true},
  {text:'Dirt Pueblo Trail · ≈1,000 ft',sub:'TO WARREN VISTA · VIA BONITA',point:[-590,1,30],kind:'road road-condition',roadWide:true},
  {text:'Warren Vista Ave',sub:'PAVED CONNECTION',point:[-1000,1,-45],kind:'road road-condition',roadWide:true},
  {text:'Bonita Ave',sub:'',point:[-360,1,-48],kind:'road road-condition',roadWide:true}
 );
 return {group,dirt,annotations,roadExtent,roadSection};
}

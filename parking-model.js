import * as THREE from './assets/three.module.js';
import {buildPuebloRoad} from './pueblo-road.js?v=road1';

export function buildModel(data) {
 const root=new THREE.Group();root.name='Tumbleweed Sanctuary';
 const common=new THREE.Group(),existing=new THREE.Group(),proposed=new THREE.Group(),boundaries=new THREE.Group(),carsExisting=new THREE.Group(),carsProposed=new THREE.Group();
 root.add(common,existing,proposed,boundaries,carsExisting,carsProposed);
 common.name='Common site';existing.name='Existing north lot';proposed.name='Proposed improvements';boundaries.name='Parcel outlines';
 const parkingLayout=new THREE.Group(),steelFence=new THREE.Group(),bollards=new THREE.Group(),architectFixtures=new THREE.Group(),bollardLighting=new THREE.Group(),architectLighting=new THREE.Group(),people=new THREE.Group();
 const alternativeDesign=new THREE.Group(),originalDesign=new THREE.Group(),screening=new THREE.Group(),originalFrontage=new THREE.Group(),originalFixtures=new THREE.Group();
 alternativeDesign.name='Current alternative';originalDesign.name='Original submitted plan';screening.name='Submitted screening walls';originalFrontage.name='Submitted street frontage';originalFixtures.name='Submitted C1 fixtures';
 parkingLayout.name='Shared 41-space parking layout';proposed.add(parkingLayout,alternativeDesign,originalDesign);alternativeDesign.add(steelFence,bollards,architectFixtures,bollardLighting,architectLighting,people);originalDesign.add(screening,originalFrontage,originalFixtures);
 steelFence.name='Solid weathered-steel fence';bollards.name='18 low bollards';architectFixtures.name='9 architect fixtures';people.name='Event pedestrians';
 const labels=[],parkingStalls=[];
 const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...opts});
 const m={sand:mat('#cfbda0'),site:mat('#d9c9ac'),native:mat('#cabb9d'),asphalt:mat('#595f5b'),oldpave:mat('#b6b4a5'),concrete:mat('#ded8c6'),wall:mat('#c9b79b'),wood:mat('#694d3b'),bark:mat('#7a664b'),leaf:mat('#75845c'),leaf2:mat('#a2a17a'),shrub:mat('#929774'),roof:mat('#576e67',{metalness:.25,roughness:.68}),white:mat('#eae5d7'),glass:mat('#6c807c',{roughness:.42}),dark:mat('#46524a'),stripe:mat('#f0e8d3'),clay:mat('#ad7552'),rock:mat('#b9ad95'),blue:mat('#638994')};
 function add(geo,material,group=common,x=0,y=0,z=0){let o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function box(x,z,w,d,h,material,group=common,y=0){const o=add(new THREE.BoxGeometry(w,h,d),material,group,x,y+h/2,z);o.castShadow=h>.5;return o;}
 function poly(points,material,group=common,y=.03,depth=0){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();const geo=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}):new THREE.ShapeGeometry(s);geo.rotateX(-Math.PI/2);const o=add(geo,material,group,0,y,0);o.castShadow=depth>.5;return o;}
 function line(points,color='#758a69',group=common,y=.24,dashed=false){const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],y,p[1])));const material=dashed?new THREE.LineDashedMaterial({color,dashSize:3,gapSize:2}):new THREE.LineBasicMaterial({color});const o=new THREE.Line(geo,material);if(dashed)o.computeLineDistances();group.add(o);return o;}
 function wall(a,b,height,material=m.wall,group=common,width=.7){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);const o=box((a[0]+b[0])/2,(a[1]+b[1])/2,l,width,height,material,group);o.rotation.y=-Math.atan2(dz,dx);return o;}
 function path(points,width,material=m.concrete,group=common,y=.08,smooth=true){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],y,p[1])));const pts=smooth?c.getPoints(90):points.map(p=>new THREE.Vector3(p[0],y,p[1]));const vs=[],ix=[];pts.forEach((p,i)=>{const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],v=next.clone().sub(prev).normalize(),n=new THREE.Vector3(-v.z,0,v.x).multiplyScalar(width/2);vs.push(...p.clone().add(n).toArray(),...p.clone().sub(n).toArray());if(i)ix.push((i-1)*2,(i-1)*2+1,i*2,(i-1)*2+1,i*2+1,i*2);});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();const o=add(g,material,group);o.castShadow=false;o.material.side=THREE.DoubleSide;return o;}
 function roof(x,z,w,d,eave,ridge,group=common,material=m.roof){const v=[[-w/2,eave,-d/2],[w/2,eave,-d/2],[0,ridge,-d/2],[-w/2,eave,d/2],[w/2,eave,d/2],[0,ridge,d/2]];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v.flat(),3));g.setIndex([0,3,2,2,3,5,2,5,1,1,5,4]);g.computeVertexNormals();const o=add(g,material,group,x,0,z);o.material.side=THREE.DoubleSide;const gable=new THREE.BufferGeometry();gable.setAttribute('position',new THREE.Float32BufferAttribute(v.flat(),3));gable.setIndex([0,2,1,3,4,5]);gable.computeVertexNormals();add(gable,m.white,group,x,0,z).material.side=THREE.DoubleSide;return o;}
 const instanced=[];const geo={bush:new THREE.IcosahedronGeometry(1,1),tuft:new THREE.IcosahedronGeometry(1,0),trunk:new THREE.CylinderGeometry(1,1,1,6),leaf:new THREE.ConeGeometry(1,1,4),rock:new THREE.IcosahedronGeometry(1,0)};
 const buckets=new Map();const temp=new THREE.Object3D();
 function instance(type,material,group,x,y,z,sx,sy,sz,q=null){const key=group.uuid+type+material.uuid;let b=buckets.get(key);if(!b){b={type,material,group,matrices:[]};buckets.set(key,b);}temp.position.set(x,y,z);temp.scale.set(sx,sy,sz);temp.quaternion.copy(q||new THREE.Quaternion());temp.updateMatrix();b.matrices.push(temp.matrix.clone());}
 let seed=791;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function branch(a,b,r,group){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),mid=av.clone().add(bv).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());instance('trunk',m.bark,group,...mid.toArray(),r,delta.length(),r,q);}
 function bush(x,z,s,group=common){instance('bush',rnd()>.6?m.leaf2:m.shrub,group,x,s*.63,z,s,s*.76,s*.8);instance('bush',m.shrub,group,x+s*.5,s*.4,z-s*.4,s*.56,s*.55,s*.55);}
 function joshua(x,z,h,group=common){branch([x,0,z],[x,h*.65,z],h*.052,group);const arms=3+Math.floor(rnd()*3);for(let i=0;i<arms;i++){const a=i*6.283/arms+rnd()*.7,reach=h*(.17+rnd()*.16),yy=h*(.66+rnd()*.31),bx=x+Math.cos(a)*reach,bz=z+Math.sin(a)*reach;branch([x,h*.44,z],[bx,yy*.84,bz],h*.028,group);branch([bx,yy*.84,bz],[bx,yy,bz],h*.022,group);instance('tuft',m.leaf,group,bx,yy,bz,h*.14,h*.12,h*.14);for(let k=0;k<5;k++){const aa=k*6.283/5,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(aa)*.9,aa,Math.sin(aa)*.9));instance('leaf',m.leaf2,group,bx+Math.sin(aa)*h*.07,yy+h*.055,bz+Math.cos(aa)*h*.07,h*.055,h*.29,h*.055,q);}}}
 function yucca(x,z,h,group=common){instance('trunk',m.bark,group,x,h*.28,z,.25,h*.55,.25);for(let i=0;i<7;i++){let a=i*6.283/7,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(a)*.8,a,Math.sin(a)*.8));instance('leaf',m.leaf2,group,x+Math.sin(a)*h*.22,h*.66,z+Math.cos(a)*h*.22,h*.16,h,h*.16,q);}}
 function shadeTree(x,z,h){branch([x,0,z],[x,h*.7,z],.55,common);for(let i=0;i<5;i++){const a=i*1.257;instance('bush',m.leaf,common,x+Math.sin(a)*h*.15,h*.7+rnd()*h*.16,z+Math.cos(a)*h*.15,h*.25,h*.2,h*.21);}}
 function palm(x,z,h){branch([x,0,z],[x+.8,h,z],.65,common);instance('bush',m.bark,common,x+.8,h-2,z,1.1,3,1.1);for(let i=0;i<9;i++){const a=i*6.283/9,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(a)*1.2,a,Math.sin(a)*1.2));instance('leaf',m.leaf,common,x+.8+Math.sin(a)*2.4,h+.5,z+Math.cos(a)*2.4,1.2,7,1.2,q);}}

 // Leave a genuine opening below the dirt road, so soil cannot fill the washout.
 box(190,265,380,940,7,m.sand,common,-7);
 box(-105,-94.5,210,221,7,m.sand,common,-7);
 box(-105,389.5,210,691,7,m.sand,common,-7);
 box(-105,30,210,28,4.4,m.sand,common,-7);
 poly([[-210,-205],[380,-205],[380,735],[-210,735],[-210,44],[0,44],[0,16],[-210,16]],m.native,common,.015);
 for(const p of data.parcels)poly(p.points,p.apn.endsWith('01')?m.site:m.sand,common,.045);
 // The parcel extends into the ROW; its soil skin stops at the traveled road.
 const homeSoil=[];for(let i=0;i<data.house.parcel.length;i++){const a=data.house.parcel[i],b=data.house.parcel[(i+1)%data.house.parcel.length];if(a[1]<=16)homeSoil.push(a);if((a[1]<=16)!==(b[1]<=16)){const t=(16-a[1])/(b[1]-a[1]);homeSoil.push([a[0]+t*(b[0]-a[0]),16]);}}
 poly(homeSoil,mat('#d0bea0'),common,.06);
 // Existing roads, including the T-junction on the east.
 // One continuous road surface: no coplanar intersection at the junction.
 const road=poly([[0,16],[306,16],[306,-209],[334,-209],[334,16],[380,16],[380,44],[0,44]],m.asphalt,common,.14);road.name='Existing paved road — north lot south and east';
 const puebloRoad=buildPuebloRoad(common,labels);
 // House: county footprint is preserved; roof and facade are simplified.
 poly(data.house.footprint,m.white,common,.1,data.house.height*.74);
 poly(data.house.footprint,mat('#9c8e76'),common,data.house.height*.74,.6);
 roof(-60,-58,89,29,data.house.height*.74,data.house.height,common,mat('#a29074'));
 roof(-61,-83,22,28,data.house.height*.74,data.house.height-1,common,mat('#a29074'));
 path([[-44,-43],[-44,-22],[-36,-5],[-36,15]],18,m.oldpave,common,.17);
 for(let i=0;i<4;i++)box(-91+i*18,-43.3,5,.25,3,m.glass,common,3.5);
 wall([-158,-131],[-158,10],4.5,m.wood,common,.45);
 // Existing sanctuary, patios and parking: traced from A2 at 1 in = 20 ft.
 const churchX=185.2,churchZ=154.2,eave=14.7;
 box(churchX,churchZ,47.5,80.2,eave,m.white);
 roof(churchX,churchZ,52,85,eave,data.sanctuaryHeight);
 // Standing seams make the dark green metal roof readable while rotating.
 for(let dz=-40;dz<=40;dz+=4){line([[churchX-26,churchZ+dz],[churchX,churchZ+dz]],'#6f8376',common,eave+.15);}
 box(churchX,202,51,21,.25,m.oldpave);
 box(churchX,205,53,18,.7,m.roof,common,10.4);
 for(const x of [160,176,194,209])box(x,211,.65,.65,10.3,m.wood);
 box(223,205,26,21,.65,m.roof,common,8.8);
 for(const x of [211,235])for(const z of [196,214])box(x,z,.55,.55,8.8,m.wood);
 box(churchX,114,10,.4,7,m.wood);
 for(const z of [126,147,169,185]){box(161.3,z,.3,6,4,m.glass,common,5);box(209.1,z,.3,6,4,m.glass,common,5);}
 // Building footing, entrance court, vehicle aisle and event paving.
 poly([[213,51],[294,51],[288,60],[288,140],[276,179],[276,272],[202,272],[202,214],[240,214],[240,169],[233,148],[233,116],[212,116]],m.oldpave,common,.18);
 poly([[132,215],[202,215],[202,273],[150,273],[150,245],[132,245]],m.oldpave,common,.19);
 poly([[127,114],[158,114],[158,161],[111,161],[111,145],[127,145]],m.oldpave,common,.18);
 poly([[111,161],[157,161],[157,199],[110,207]],m.oldpave,common,.18);
 path([[236,80],[219,80],[199,74],[155,74],[109,76]],8,m.concrete,common,.18);
 // Landscape court walls from the reference photos, kept in both conditions.
 wall([0,84],[0,285],6.4,m.wood);wall([0,84],[34,84],6.4,m.wood);
 wall([36,76],[94,76],6.4,m.wood);wall([103,76],[152,76],6.4,m.wood);wall([152,76],[162,87],6.4,m.wood);
 wall([0,285],[47,291],6.4,m.wood);wall([300,72],[327,72],6.4,m.wood);
 // Manual gate across existing drive.
 for(const x of [257,266,275,284,288])box(x,60,.55,.55,3.6,m.wood);
 wall([257,60],[288,60],.2,m.wood,common,.3).position.y=3.4;
 wall([257,60],[288,60],.2,m.wood,common,.3).position.y=.65;
 // Pergola and garden seating.
 for(const x of [108,143])for(const z of [128,160])box(x,z,.6,.6,8,m.wood);
 for(let z=127;z<=162;z+=3)box(125.5,z,38,.65,.45,m.wood,common,8);
 const circle=new THREE.CircleGeometry(25,64);circle.rotateX(-Math.PI/2);add(circle,mat('#c4b392'),common,47,.16,223);
 for(let r=5;r<=25;r+=4){const pts=[];for(let a=.3;a<6.28;a+=.08)pts.push([47+Math.sin(a)*r,223+Math.cos(a)*r]);path(pts,.45,m.rock,common,.21,false);}
 const roundSeat=new THREE.CircleGeometry(11.5,32);roundSeat.rotateX(-Math.PI/2);add(roundSeat,m.concrete,common,58,.14,180);
 for(let a=0;a<6.2;a+=.7){const x=58+Math.sin(a)*13,z=180+Math.cos(a)*13;const b=box(x,z,4,1.3,1.7,m.wood);b.rotation.y=a;}
 path([[76,60],[114,78],[162,104],[160,185],[112,209],[108,247],[87,279],[66,305],[73,338],[98,360]],4,m.concrete,common,.13);
 path([[73,338],[160,339],[219,337],[286,340],[320,343]],3.4,m.concrete,common,.13);
 box(268,307,16,31,8,m.wood);roof(268,307,18,33,8,10.2,common,m.wood);
 box(312,347,32,26,7,m.wood);box(313,347,33,27,.5,m.roof,common,7);
 // Garden paths follow the curved routes on A3; both parcels remain unchanged.
 path([[99,360],[104,401],[91,442],[62,485],[43,531],[19,561],[24,598],[63,608],[108,593],[157,569],[176,545],[178,478],[177,433],[198,398],[192,370]],6,mat('#dfcfad'),common,.12);
 path([[157,569],[140,574],[124,582]],2,m.rock,common,.18);
 wall([0,372],[65,372],6,m.wood,common,.45);wall([270,401],[270,418],6,m.wood,common,.45);wall([270,446],[270,468.5],6,m.wood,common,.45);
 for(const [x,z] of [[22,548],[112,582],[177,510]]){box(x,z,5,1.5,1.6,m.wood);box(x,z+.6,5,.3,1.3,m.wood,common,1.6);}
 // Parking pavement with a rounded southeast corner.
 const lot=[[80.8,-66.83],[290,-66.83],[290,-20]];
 for(let a=0;a<=Math.PI/2+.001;a+=Math.PI/24)lot.push([270+20*Math.cos(a),-20+20*Math.sin(a)]);
 lot.push([80.8,0]);const parkingSurface=poly(lot,m.asphalt,parkingLayout,.22);parkingSurface.name='North parking surface';
 // Plant islands retained within the architect’s original parking footprint.
 poly([[265,-66.4],[289.5,-66.4],[289.5,-51.3],[271,-51.3],[266,-53]],m.site,parkingLayout,.27);
 poly([[266,-18],[288,-18],[283,-7],[273,-1],[266,-1]],m.site,parkingLayout,.27);
 function stripe(a,b,group=parkingLayout,color=m.stripe){wall(a,b,.035,color,group,.18).position.y=.27;}
 function stall(x,z,w,d,angle=0,group=parkingLayout,type='standard'){
  const co=Math.cos(angle),si=Math.sin(angle),pt=(xx,zz)=>[x+xx*co-zz*si,z+xx*si+zz*co];
  stripe(pt(-w/2,-d/2),pt(-w/2,d/2),group);stripe(pt(w/2,-d/2),pt(w/2,d/2),group);stripe(pt(-w/2,-d/2),pt(w/2,-d/2),group);
  if(group===parkingLayout)parkingStalls.push({x,z,w,d,angle,type});
  if(type==='accessible'){const o=box(x,z,5,6,.045,m.blue,group,.28);o.rotation.y=-angle;const r=new THREE.RingGeometry(1.35,1.55,20);r.rotateX(-Math.PI/2);add(r,m.stripe,group,x,.35,z);}
  const stop=box(x-Math.sin(angle)*(d/2-1.5),z+Math.cos(angle)*(d/2-1.5),w*.66,.5,.35,m.concrete,group);stop.rotation.y=-angle;
 }
 // A1: 16 standard + 5 compact on north row, 4 compact east row,
 // 14 standard + 2 accessible south row = 41 spaces.
 for(let i=0;i<16;i++)stall(85.3+i*9,-56.9,9,19);
 for(let i=0;i<5;i++)stall(228.55+i*7.5,-58.9,7.5,15,0,parkingLayout,'compact');
 for(let i=0;i<4;i++)stall(282,-47.1+i*7.5,7.5,15,Math.PI/2,parkingLayout,'compact');
 for(let i=0;i<9;i++)stall(95.967+i*9,-9.7,9,19,Math.PI);
 for(let i=0;i<5;i++)stall(200.967+i*9,-9.7,9,19,Math.PI);
 stall(245.967,-9.7,9,19,Math.PI,parkingLayout,'accessible');stall(262.967,-9.7,9,19,Math.PI,parkingLayout,'accessible');
 // Accessible aisles and west turnaround hatch.
 for(const [x,w] of [[254.467,8],[86.1,10.6]])for(let z=-18;z<-2;z+=2.5)stripe([x-w/2,z],[x+w/2,z+2],parkingLayout);
 // Drive arrows and aisle direction marks.
 for(const x of [177.5,190.5]){stripe([x,-5],[x,-16]);stripe([x,-16],[x-1.5,-13]);stripe([x,-16],[x+1.5,-13]);}
 // Existing southern parking is kept; EV designation appears with proposal.
 for(let i=0;i<9;i++)stall(269,194.7+i*9,9,19,Math.PI/2,common);
 for(let i=0;i<4;i++)stall(217,244+i*7.5,7.5,15,Math.PI/2,common,'compact');
 stall(269,187,11,19,Math.PI/2,common,'accessible');
 for(let i=0;i<4;i++){stall(238+i*5.0,134+i*8,9,19,-.52,common);}
 // Native planting positions from B1/B2 and traced A3 symbols. Sizes illustrative.
 for(const t of data.trees){if(t.x<0||t.x>330||t.z>695)continue;let g=common;
  // Existing Joshua trees outside the original parking footprint remain in every layer.
  // Keep the entrance yucca in the existing view only; preserve every Joshua tree.
  if(t.type==='MY'&&t.x>172.467&&t.x<196.467&&t.z>=0&&t.z<=16)g=existing;
  if(t.type==='JT')joshua(t.x,t.z,8+rnd()*7,g);else if(t.type==='MY')yucca(t.x,t.z,3+rnd()*3,g);else shadeTree(t.x,t.z,12+rnd()*6);
 }
 for(let i=0;i<170;i++){const x=rnd()*290,z=-131+rnd()*131;if(x<75||z<-111)bush(x,z,1+rnd()*2.8);}
 for(let i=0;i<330;i++){const x=rnd()*326,z=370+rnd()*317;const d=Math.abs(x-60);bush(x,z,.8+rnd()*2.4);}
 for(let i=0;i<90;i++){const x=rnd()*328,z=67+rnd()*281;if((x<95&&Math.hypot(x-47,z-223)>28)||x>292)bush(x,z,1+rnd()*2.5);}
 for(let i=0;i<40;i++){const x=-150+rnd()*140,z=-130+rnd()*110;if(x<-108||z<-101)bush(x,z,1+rnd()*2.2);}
 for(let i=0;i<85;i++){const x=95+rnd()*165,z=-106+rnd()*35;bush(x,z,.75+rnd()*.8,proposed);}

 // Restore the earlier frontage planting without changing the landscape random sequence.
 for(let i=0;i<17;i++){const x=99+i*9.3;if(x<170.467||x>198.467)bush(x,2,1.05,originalDesign);else rnd();}
 for(const [x,z] of [[271,-61],[282,-57],[279,-11]])bush(x,z,2,proposed);
 for(const [x,z,h] of [[213,87,28],[244,93,19],[160,85,24]])palm(x,z,h);
 for(const [x,z,h] of [[243,80,26],[221,104,25],[138,95,19],[306,110,25],[117,177,20]])shadeTree(x,z,h);
 for(let i=0;i<60;i++){const x=10+rnd()*310,z=365+rnd()*320;instance('rock',m.rock,common,x,.4,z,.6+rnd(),.5,.8+rnd());}
 // Parcel outlines use the dimensioned drawing grid, independent of view state.
 for(const p of data.parcels){line([...p.points,p.points[0]],'#849977',boundaries,.6,true);labels.push({text:p.name,sub:p.apn,point:[p.label[0],1,p.label[1]],kind:p.apn.endsWith('01')?'parking':''});}
 line([...data.house.parcel,data.house.parcel[0]],'#ba8255',boundaries,.7,true);
 labels.push({text:'57890 Pueblo Trail',sub:'YOUR RESIDENCE',point:[-79,17,-57],kind:'home'});
 labels.push({text:'Sanctuary',sub:'EXISTING BUILDING',point:[185.2,28,152],kind:'building'});
 labels.push({text:'Pueblo Trail',sub:'',point:[83,.2,31],kind:'road'});
 labels.push({text:'Chula Vista',sub:'',point:[320,.2,-94],kind:'road'});
 // Optional cars are a scale reference, not actual event counts or a traffic model.
 const carColors=['#e4d8bd','#f1eee3','#65756b','#b18f70','#7c8486'],carMaterials=carColors.map(color=>mat(color));
 function car(x,z,angle,group,i){const c=new THREE.Group();group.add(c);c.position.set(x,0,z);c.rotation.y=-angle;box(0,0,5.9,14.5,1.7,carMaterials[i%5],c,1);box(0,-.6,5.1,7.9,1.7,m.glass,c,2.6);box(0,-.6,5.05,5.9,.25,carMaterials[i%5],c,4.2);for(const wx of [-2.95,2.95])for(const wz of [-4.7,4.7]){let o=add(new THREE.CylinderGeometry(1.05,1.05,.65,10),m.dark,c,wx,1.05,wz);o.rotation.z=Math.PI/2;}return c;}
 const eventStalls=parkingStalls.filter((s,i)=>i%3!==0&&s.type!=='accessible').slice(0,25);
 eventStalls.forEach((s,i)=>car(s.x,s.z,s.angle,carsProposed,i));carsProposed.name='25 event cars';
 for(let i=0;i<6;i++)car(266,213+i*9,Math.PI/2,carsExisting,i);
 carsExisting.name='6 cars in existing southern parking';
 // Screening: residential faces are six feet, with four-foot returns as A1.
 wall([80.8,-66.83],[265.3,-66.83],6,m.wall,screening);
 wall([265.3,-66.83],[290,-66.83],4,m.wall,screening);
 wall([80.8,-66.83],[80.8,-15],6,m.wall,screening);
 wall([80.8,-15],[80.8,0],4,m.wall,screening);
 wall([290,-66.83],[290,-20],4,m.wall,screening);
 for(let a=0;a<Math.PI/2-.001;a+=Math.PI/16)wall([270+20*Math.cos(a),-20+20*Math.sin(a)],[270+20*Math.cos(a+Math.PI/16),-20+20*Math.sin(a+Math.PI/16)],4,m.wall,screening);
 for(const [a,b] of [[80.8,91],[99,172.467],[196.467,257],[265,270]])wall([a,0],[b,0],4,m.wall,screening);
 // Original frontage restored from the earlier submitted-plan model (A1).
 box(145,12,290,8,.17,m.asphalt,originalFrontage);
 box(302,-65.5,8,131,.17,m.asphalt,originalFrontage);
 box(172.467/2,7,172.467,6,.3,m.concrete,originalFrontage);
 box((196.467+269)/2,7,269-196.467,6,.3,m.concrete,originalFrontage);
 box(297,-76.5,6,109,.3,m.concrete,originalFrontage);
 path([[269,7],[283,7],[292,2],[297,-8],[297,-22]],6,m.concrete,originalFrontage,.32);
 // Keep the 24-ft vehicle opening clear through the curb and concrete apron.
 for(const [a,b] of [[0,172.467],[196.467,269]])wall([a,10],[b,10],.45,m.concrete,originalFrontage,.5);
 wall([300,-131],[300,-17],.45,m.concrete,originalFrontage,.5);
 path([[269,10],[287,10],[296,4],[300,-8],[300,-17]],.55,m.concrete,originalFrontage,.49);
 box(184.467,5,24,10,.24,m.concrete,originalFrontage);
 const originalLights=[[102,-61],[152,-61],[197,-61],[246,-61],[102,-5],[152,-5],[197,-5],[246,-5],[279,-23]];
 for(const [x,z] of originalLights){box(x,z,.3,.3,8,m.dark,originalFixtures);box(x+.65,z,1.6,.8,.3,m.dark,originalFixtures,7.85);box(x+.65,z,1.2,.65,.04,m.white,originalFixtures,7.8);}
 for(let i=0;i<4;i++){box(227+i*5,128+i*8,1.25,1.2,4,m.dark,originalDesign);box(227+i*5,127.3+i*8,.6,.2,1,m.blue,originalDesign,2.3);}
 // New alternative geometry: all sizes not on the submitted plan are approximate.
 function noiseTexture(base,amount,repeat){const bytes=new Uint8Array(128*128*4);let q=381;for(let i=0;i<bytes.length;i+=4){q=(q*1664525+1013904223)>>>0;const n=(q/4294967296-.5)*amount;for(let c=0;c<3;c++)bytes[i+c]=Math.max(0,Math.min(255,base[c]+n));bytes[i+3]=255;}const t=new THREE.DataTexture(bytes,128,128);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;}
 const tanAsphalt=mat('#ae9670',{roughness:.95});parkingSurface.material=tanAsphalt;
 const steel=mat('#9b5031',{map:noiseTexture([208,184,156],72,3),roughness:.88,metalness:.18}),bronze=mat('#4c382b',{metalness:.35,roughness:.65});
 const fenceSegments=[{a:[80.8,-66.83],b:[298,-66.83],h:6},{a:[80.8,-66.83],b:[80.8,-15],h:6},{a:[80.8,-15],b:[80.8,8],h:4}];
 for(const seg of fenceSegments){wall(seg.a,seg.b,seg.h,steel,steelFence,.12);const n=Math.ceil(Math.hypot(seg.b[0]-seg.a[0],seg.b[1]-seg.a[1])/8);for(let i=0;i<=n;i++){box(seg.a[0]+(seg.b[0]-seg.a[0])*i/n,seg.a[1]+(seg.b[1]-seg.a[1])*i/n,.16,.16,seg.h,bronze,steelFence);}}
 // Rounded 3-ft earth berm, 14-ft base, south and east only. Two breaks in south run.
 const berms=new THREE.Group();berms.name='3-ft planted berms';alternativeDesign.add(berms);
 function berm(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,n=Math.ceil(length/3),v=[],uv=[],ix=[];for(let i=0;i<=n;i++){const along=length*i/n,taper=Math.min(1,along/5,(length-along)/5);for(let j=0;j<=16;j++){const lateral=(j/16-.5)*14,y=.08+3*Math.pow(Math.cos(lateral/7*Math.PI/2),2)*Math.sin(Math.max(0,taper)*Math.PI/2);v.push(a[0]+dx*i/n+nx*lateral,y,a[1]+dz*i/n+nz*lateral);uv.push(along/14,j/16);if(i&&j){const k=i*17+j;ix.push(k,k-1,k-17,k-1,k-18,k-17);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const mound=add(g,m.sand,berms);mound.material.side=THREE.DoubleSide;return {a,b,length};}
 const bermRuns=[berm([80.8,8],[172.467,8]),berm([196.467,8],[268,8]),berm([277,8],[298,8]),berm([298,-66.83],[298,8])];
 // Same driveway center as A1. Asphalt connects to existing road, with no hard frontage.
 poly([[172.467,0],[196.467,0],[196.467,16],[172.467,16]],tanAsphalt,alternativeDesign,.22).name='Alternative driveway';
 const slidingGate=new THREE.Group();slidingGate.name='Bi-parting open-frame steel gate';alternativeDesign.add(slidingGate);slidingGate.position.set(172.467,0,.6);
 const gateLeaves=[];for(const x of [0,12]){const leaf=new THREE.Group();leaf.position.x=x;slidingGate.add(leaf);gateLeaves.push(leaf);
  // Rectangular steel rails and open bays match reference photo IMG_0754.
  for(const y of [.65,4.15])box(6,0,12,.18,.18,bronze,leaf,y);
  for(const xx of [.09,4,8,11.91])box(xx,0,.18,.18,3.5,bronze,leaf,.74);
  for(const xx of [1,11]){const wheel=add(new THREE.CylinderGeometry(.23,.23,.14,12),bronze,leaf,xx,.45,0);wheel.rotation.x=Math.PI/2;}
 }
 for(const x of [172.1,196.8])box(x,.6,.4,.4,4.6,bronze,alternativeDesign);
 function setGateClosed(closed){gateLeaves[0].position.x=closed?0:-12;gateLeaves[1].position.x=closed?12:24;}
 // Firm pedestrian route outside the stalls, aligned with the existing south drive.
 const pedestrianPath=path([[254.467,-10],[254.467,.6],[272.5,.6],[272.5,16]],4,m.concrete,alternativeDesign,.25,false);pedestrianPath.name='Firm accessible path (approximate)';
 for(let z=17;z<44;z+=3)box(272.5,z,9,1.5,.025,m.stripe,alternativeDesign,.18);
 path([[272.5,44],[272.5,59]],5,m.oldpave,alternativeDesign,.2,false);
 // Additional outside planting is intentionally schematic, not a surveyed planting plan.
 const addedNative=new THREE.Group();addedNative.name='Concept native planting outside fence and on berm';alternativeDesign.add(addedNative);
 function rockAt(x,z,scale,y=0){instance('rock',m.rock,addedNative,x,y+.3,z,scale,.5*scale,scale*.8);}
 function cactusAt(x,z,type,y=0){if(type==='beavertail'){for(let i=0;i<4;i++)instance('bush',m.leaf2,addedNative,x+(i-1.5)*.38,y+.55+i*.15,z,.45,.65,.13);}else{for(let i=0;i<4;i++){const a=i*1.57;branch([x,y,z],[x+Math.cos(a)*.6,y+1.7+i*.2,z+Math.sin(a)*.6],.12,addedNative);instance('tuft',m.leaf2,addedNative,x+Math.cos(a)*.6,y+1.7+i*.2,z+Math.sin(a)*.6,.32,.5,.32);}}}
 function nativeCluster(x,z,i,y=0){if(data.trees.some(t=>Math.hypot(t.x-x,t.z-z)<5))return;if(i%5===0)cactusAt(x,z,'beavertail',y);else if(i%5===1)cactusAt(x,z,'cholla',y);else if(i%5===2&&y===0)yucca(x,z,3.7,addedNative);else{instance('bush',i%2?m.shrub:m.leaf2,addedNative,x,y+1.2,z,1.6,1.4,1.45);instance('bush',m.shrub,addedNative,x+.65,y+.8,z+.3,1.1,.9,1);}
 rockAt(x+2.2,z+.7,.8,y);}
 for(let i=0;i<24;i++)nativeCluster(85+i*8.5,-81-(i%3)*2,i);
 for(let i=0;i<10;i++)nativeCluster(75-(i%2)*2,-66+i*7,i+2);
 for(const run of bermRuns){for(let i=1;i<run.length/7;i++){const f=i*7/run.length;nativeCluster(run.a[0]+(run.b[0]-run.a[0])*f,run.a[1]+(run.b[1]-run.a[1])*f,i,3*Math.sin(Math.min(1,i*7/5,(run.length-i*7)/5)*Math.PI/2));}}
 // 18 warm, shielded, low fixtures; positions and 15 W specification are conceptual.
 const bollardPositions=[...([98.8,125.8,152.8,179.8,206.8,232.3,254.8].map(x=>[x,-66.3])),...([100.467,127.467,154.467,172.467,196.467,205.467,223.467,232.467].map(x=>[x,.05])),[268,16],[277,16],[289.75,-35.85]];
 function downlight(x,z,height,radius,intensity,group){const light=new THREE.SpotLight('#ffcf93',intensity,radius*2.4,Math.atan(radius/(height-.15)),.45,2);light.position.set(x,height,z);light.target.position.set(x,0,z);light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.15;light.shadow.camera.far=radius*2.4;light.shadow.bias=-.00012;light.shadow.normalBias=.03;group.add(light,light.target);return light;}
 const warmLens=new THREE.MeshStandardMaterial({color:'#ffe0b4',emissive:'#ffbd72',emissiveIntensity:1.4,roughness:.5});
 for(const [i,[x,z]] of bollardPositions.entries()){const body=add(new THREE.CylinderGeometry(.22,.22,2.8,12),bronze,bollards,x,1.4,z);body.name='3.5-ft shielded bollard';box(x,z,.12,.12,.5,bronze,bollards,2.8);box(x,z,.65,.65,.2,bronze,bollards,3.3);const lens=add(new THREE.CircleGeometry(.2,16),warmLens,bollards,x,3.28,z);lens.rotation.x=Math.PI/2;const pool=downlight(x,z,3.25,30,400,bollardLighting);pool.castShadow=i<7||i===17;}
 const lights=[[107.8,-66.3],[152.8,-66.3],[197.8,-66.3],[247.3,-66.3],[109.467,.05],[154.467,.05],[205.467,.05],[232.467,.05],[289.75,-35.85]];
 for(const [x,z] of lights){box(x,z,.3,.3,7.85,bronze,architectFixtures);box(x,z,1.6,.8,.3,bronze,architectFixtures,7.85);box(x,z,1.2,.65,.04,warmLens,architectFixtures,7.8);downlight(x,z,7.78,48,6000,architectLighting);}
 // Simplified centered emitters must not be occluded by their own fixture posts.
 // Cars, planting, fencing and other site geometry still cast night shadows.
 architectFixtures.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 // Four generic human figures, about 5.6 ft tall, kept identical between night views.
 for(const [i,x,z] of [[0,254.467,-1],[1,272.5,4],[2,272.5,25],[3,272.5,44]]){const person=new THREE.Group();person.position.set(x,0,z);people.add(person);const cloth=mat(['#675b4c','#8d8271','#40545c','#7e5746'][i]);add(new THREE.SphereGeometry(.35,12,8),mat('#a57e5f'),person,0,5.2,0);add(new THREE.CylinderGeometry(.5,.4,1.8,10),cloth,person,0,3.8,0);for(const side of [-1,1]){box(side*.24,side*.25,.3,.4,2.8,m.dark,person,.1);const arm=box(side*.65,0,.22,.26,1.65,cloth,person,2.8);arm.rotation.z=side*.12;}}
 const callouts=[
 {text:'6-ft weathered steel fence, native planting outside',point:[162,7,-66.83]},
 {text:'Fence steps to 4 ft near street',point:[80.8,5,-8]},
 {text:'3-ft planted berm (no wall)',point:[228,4,8]},
 {text:'No curbs, sidewalks or streetlights',point:[302,1,25]},
 {text:'Tan asphalt',point:[170,.5,-37]},
 {text:'Low bollard lights (about 18)',point:[118,4,-9],bollardOnly:true},
 {text:'Bi-parting sliding gate at driveway opening',point:[184.467,5,.6]},
 {text:'Proposed crosswalk, subject to Town Engineer approval',point:[272.5,.5,31]}
 ].map(l=>({...l,sub:'',kind:'callout',alternative:true}));
 labels.push(...callouts);
 labels.push(...[
  {text:'6-ft screening walls',point:[162,7,-66.83]},
  {text:'4-ft street-facing screening walls',point:[228,5,0]},
  {text:'Dark asphalt · 41 spaces',point:[170,.5,-37]},
  {text:'6-ft sidewalk, curb and street widening',point:[297,1,-15]},
  {text:'24-ft driveway · concrete apron',point:[184.467,1,7]},
  {text:'Nine 8-ft pole fixtures · C1',point:[152,9,-61]}
 ].map(l=>({...l,sub:'',kind:'callout',original:true})));
 for(const b of buckets.values()){const inst=new THREE.InstancedMesh(geo[b.type],b.material,b.matrices.length);b.matrices.forEach((v,i)=>inst.setMatrixAt(i,v));inst.castShadow=true;inst.receiveShadow=true;b.group.add(inst);instanced.push(inst);}
 // Batch repeated static parts without changing their geometry or placement.
 // Keep the movable gate and independently controlled groups separate.
 root.updateMatrixWorld(true);
 const unitBox=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),scale=new THREE.Matrix4();
 function batchParts(group){
  const batches=new Map(),inverse=group.matrixWorld.clone().invert();
  group.traverse(o=>{
   if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||!['BoxGeometry','CylinderGeometry'].includes(o.geometry.type))return;
   const isBox=o.geometry.type==='BoxGeometry',key=[isBox?'box':JSON.stringify(o.geometry.parameters),o.material.uuid,o.castShadow,o.receiveShadow].join('|');
   let batch=batches.get(key);if(!batch){batch={geometry:isBox?unitBox:o.geometry,material:o.material,objects:[]};batches.set(key,batch);}batch.objects.push(o);
  });
  for(const batch of batches.values()){
   if(batch.objects.length<2)continue;
   const combined=new THREE.InstancedMesh(batch.geometry,batch.material,batch.objects.length);
   combined.name='Batched static parts';combined.userData.staticBatch=true;combined.castShadow=batch.objects[0].castShadow;combined.receiveShadow=batch.objects[0].receiveShadow;
   batch.objects.forEach((o,i)=>{matrix.multiplyMatrices(inverse,o.matrixWorld);if(o.geometry.type==='BoxGeometry'){const p=o.geometry.parameters;matrix.multiply(scale.makeScale(p.width,p.height,p.depth));}combined.setMatrixAt(i,matrix);o.removeFromParent();});
   combined.computeBoundingSphere();group.add(combined);
  }
 }
 for(const group of [common,parkingLayout,steelFence,bollards,architectFixtures,people,carsExisting,carsProposed,screening,originalFrontage,originalFixtures])batchParts(group);
 proposed.visible=false;carsExisting.visible=false;carsProposed.visible=false;
 return {root,common,existing,proposed,boundaries,carsExisting,carsProposed,labels,parkingStalls,lights,bollardPositions,parkingLayout,parkingSurface,slidingGate,gateLeaves,steelFence,berms,bollards,architectFixtures,bollardLighting,architectLighting,people,setGateClosed,alternativeDesign,originalDesign,screening,originalFrontage,originalFixtures,originalLights,puebloRoad,
  setState(layer,showCars=true){const developed=layer!==1,original=layer===5,night=layer===3||layer===4;existing.visible=!developed;proposed.visible=developed;alternativeDesign.visible=developed&&!original;originalDesign.visible=original;parkingSurface.material=original?m.asphalt:tanAsphalt;carsExisting.visible=showCars&&!developed;carsProposed.visible=showCars&&developed;people.visible=night;bollards.visible=layer===2||layer===3;architectFixtures.visible=layer===4;bollardLighting.visible=layer===3;architectLighting.visible=layer===4;warmLens.emissiveIntensity=night?1.4:0;setGateClosed(!night);},
  stats:{northStalls:parkingStalls.length,standard:parkingStalls.filter(s=>s.type==='standard').length,compact:parkingStalls.filter(s=>s.type==='compact').length,accessible:parkingStalls.filter(s=>s.type==='accessible').length,fixtures:lights.length,bollards:bollardPositions.length,eventCars:eventStalls.length,parcels:data.parcels.length,trees:data.trees.length}
 };
}

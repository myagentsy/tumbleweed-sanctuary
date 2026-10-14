import * as THREE from './three.module.js';

export function buildModel(data) {
 const root=new THREE.Group();root.name='Tumbleweed Sanctuary';
 const common=new THREE.Group(),existing=new THREE.Group(),proposed=new THREE.Group(),boundaries=new THREE.Group(),carsExisting=new THREE.Group(),carsProposed=new THREE.Group();
 root.add(common,existing,proposed,boundaries,carsExisting,carsProposed);
 common.name='Common site';existing.name='Existing north lot';proposed.name='Proposed improvements';boundaries.name='Parcel outlines';
 const labels=[],parkingStalls=[];
 const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...opts});
 const m={sand:mat('#cfbda0'),site:mat('#d9c9ac'),native:mat('#cabb9d'),asphalt:mat('#595f5b'),oldpave:mat('#b6b4a5'),concrete:mat('#ded8c6'),wall:mat('#c9b79b'),wood:mat('#694d3b'),bark:mat('#7a664b'),leaf:mat('#75845c'),leaf2:mat('#a2a17a'),shrub:mat('#929774'),roof:mat('#576e67',{metalness:.25,roughness:.68}),white:mat('#eae5d7'),glass:mat('#6c807c',{roughness:.42}),dark:mat('#46524a'),stripe:mat('#f0e8d3'),clay:mat('#ad7552'),rock:mat('#b9ad95'),blue:mat('#638994')};
 function add(geo,material,group=common,x=0,y=0,z=0){let o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function box(x,z,w,d,h,material,group=common,y=0){return add(new THREE.BoxGeometry(w,h,d),material,group,x,y+h/2,z);}
 function poly(points,material,group=common,y=.03,depth=0){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();const geo=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}):new THREE.ShapeGeometry(s);geo.rotateX(-Math.PI/2);return add(geo,material,group,0,y,0);}
 function line(points,color='#758a69',group=common,y=.24,dashed=false){const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],y,p[1])));const material=dashed?new THREE.LineDashedMaterial({color,dashSize:3,gapSize:2}):new THREE.LineBasicMaterial({color});const o=new THREE.Line(geo,material);if(dashed)o.computeLineDistances();group.add(o);return o;}
 function wall(a,b,height,material=m.wall,group=common,width=.7){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);const o=box((a[0]+b[0])/2,(a[1]+b[1])/2,l,width,height,material,group);o.rotation.y=-Math.atan2(dz,dx);return o;}
 function path(points,width,material=m.concrete,group=common,y=.08,smooth=true){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],y,p[1])));const pts=smooth?c.getPoints(90):points.map(p=>new THREE.Vector3(p[0],y,p[1]));const vs=[],ix=[];pts.forEach((p,i)=>{const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],v=next.clone().sub(prev).normalize(),n=new THREE.Vector3(-v.z,0,v.x).multiplyScalar(width/2);vs.push(...p.clone().add(n).toArray(),...p.clone().sub(n).toArray());if(i)ix.push((i-1)*2,(i-1)*2+1,i*2,(i-1)*2+1,i*2+1,i*2);});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();const o=add(g,material,group);o.material.side=THREE.DoubleSide;return o;}
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

 // Level ground: vertical terrain is explicitly out of scope of the source set.
 const earth=box(85,265,590,940,7,m.sand,common,-7);earth.receiveShadow=true;
 poly([[-210,-205],[380,-205],[380,735],[-210,735]],m.native,common,.015);
 for(const p of data.parcels)poly(p.points,p.apn.endsWith('01')?m.site:m.sand,common,.045);
 poly(data.house.parcel,mat('#d0bea0'),common,.06);
 // Existing roads, including the T-junction on the east.
 box(85,30,590,28,.14,m.asphalt,common);
 box(320,-90,28,238,.14,m.asphalt,common);
 // Proposed frontage widening, curb, gutter and sidewalk.
 box(145,12,290,8,.17,m.asphalt,proposed);
 box(302,-65.5,8,131,.17,m.asphalt,proposed);
 box(145,7,290,6,.3,m.concrete,proposed);
 box(297,-65.5,6,131,.3,m.concrete,proposed);
 path([[267,7],[283,7],[292,2],[297,-8],[297,-22]],6,m.concrete,proposed,.32);
 wall([0,10],[269,10],.45,m.concrete,proposed,.5);wall([300,-131],[300,-17],.45,m.concrete,proposed,.5);
 path([[269,10],[287,10],[296,4],[300,-8],[300,-17]],.55,m.concrete,proposed,.49);
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
 lot.push([80.8,0]);poly(lot,m.asphalt,proposed,.22);
 // Plant islands at northeast and southeast, drawn over paving.
 poly([[265,-66.4],[289.5,-66.4],[289.5,-51.3],[271,-51.3],[266,-53]],m.site,proposed,.27);
 poly([[266,-18],[288,-18],[283,-7],[273,-1],[266,-1]],m.site,proposed,.27);
 // Screening: residential faces are six feet, with four-foot returns as A1.
 wall([80.8,-66.83],[265.3,-66.83],6,m.wall,proposed);
 wall([265.3,-66.83],[290,-66.83],4,m.wall,proposed);
 wall([80.8,-66.83],[80.8,-15],6,m.wall,proposed);
 wall([80.8,-15],[80.8,0],4,m.wall,proposed);
 wall([290,-66.83],[290,-20],4,m.wall,proposed);
 for(let a=0;a<Math.PI/2-.001;a+=Math.PI/16)wall([270+20*Math.cos(a),-20+20*Math.sin(a)],[270+20*Math.cos(a+Math.PI/16),-20+20*Math.sin(a+Math.PI/16)],4,m.wall,proposed);
 for(const [a,b] of [[80.8,91],[99,172.467],[196.467,257],[265,270]])wall([a,0],[b,0],4,m.wall,proposed);
 // Drive entry (24 ft), with a clear sightline through the screening wall.
 box(184.467,5,24,10,.24,m.concrete,proposed);
 function stripe(a,b,group=proposed,color=m.stripe){wall(a,b,.035,color,group,.18).position.y=.27;}
 function stall(x,z,w,d,angle=0,group=proposed,type='standard'){
  const co=Math.cos(angle),si=Math.sin(angle),pt=(xx,zz)=>[x+xx*co-zz*si,z+xx*si+zz*co];
  stripe(pt(-w/2,-d/2),pt(-w/2,d/2),group);stripe(pt(w/2,-d/2),pt(w/2,d/2),group);stripe(pt(-w/2,-d/2),pt(w/2,-d/2),group);
  if(group===proposed)parkingStalls.push({x,z,w,d,angle,type});
  if(type==='accessible'){const o=box(x,z,5,6,.045,m.blue,group,.28);o.rotation.y=-angle;const r=new THREE.RingGeometry(1.35,1.55,20);r.rotateX(-Math.PI/2);add(r,m.stripe,group,x,.35,z);}
  const stop=box(x-Math.sin(angle)*(d/2-1.5),z+Math.cos(angle)*(d/2-1.5),w*.66,.5,.35,m.concrete,group);stop.rotation.y=-angle;
 }
 // A1: 16 standard + 5 compact on north row, 4 compact east row,
 // 14 standard + 2 accessible south row = 41 spaces.
 for(let i=0;i<16;i++)stall(85.3+i*9,-56.9,9,19);
 for(let i=0;i<5;i++)stall(228.55+i*7.5,-58.9,7.5,15,0,proposed,'compact');
 for(let i=0;i<4;i++)stall(282,-47.1+i*7.5,7.5,15,Math.PI/2,proposed,'compact');
 for(let i=0;i<9;i++)stall(95.967+i*9,-9.7,9,19,Math.PI);
 for(let i=0;i<5;i++)stall(200.967+i*9,-9.7,9,19,Math.PI);
 stall(245.967,-9.7,9,19,Math.PI,proposed,'accessible');stall(262.967,-9.7,9,19,Math.PI,proposed,'accessible');
 // Accessible aisles and west turnaround hatch.
 for(const [x,w] of [[254.467,8],[86.1,10.6]])for(let z=-18;z<-2;z+=2.5)stripe([x-w/2,z],[x+w/2,z+2],proposed);
 // Drive arrows and aisle direction marks.
 for(const x of [177.5,190.5]){stripe([x,-5],[x,-16]);stripe([x,-16],[x-1.5,-13]);stripe([x,-16],[x+1.5,-13]);}
 // Existing southern parking is kept; EV designation appears with proposal.
 for(let i=0;i<9;i++)stall(269,194.7+i*9,9,19,Math.PI/2,common);
 for(let i=0;i<4;i++)stall(217,244+i*7.5,7.5,15,Math.PI/2,common,'compact');
 stall(269,187,11,19,Math.PI/2,common,'accessible');
 for(let i=0;i<4;i++){stall(238+i*5.0,134+i*8,9,19,-.52,common);box(227+i*5,128+i*8,1.25,1.2,4,m.dark,proposed);box(227+i*5,127.3+i*8,.6,.2,1,m.blue,proposed,2.3);}
 // Lighting fixture locations from C1. MH 8 ft, nine luminaires.
 const lights=[[102,-61],[152,-61],[197,-61],[246,-61],[102,-5],[152,-5],[197,-5],[246,-5],[279,-23]];
 for(const [x,z] of lights){box(x,z,.3,.3,8,m.dark,proposed);box(x+.65,z,1.6,.8,.3,m.dark,proposed,7.85);box(x+.65,z,1.2,.65,.04,m.white,proposed,7.8);}
 // Native planting positions from B1/B2 and traced A3 symbols. Sizes illustrative.
 for(const t of data.trees){if(t.x<0||t.x>330||t.z>695)continue;let g=common;
  if(t.source==='B1'&&t.z>-8){g=existing;}
  if(t.type==='JT')joshua(t.x,t.z,8+rnd()*7,g);else if(t.type==='MY')yucca(t.x,t.z,3+rnd()*3,g);else shadeTree(t.x,t.z,12+rnd()*6);
 }
 for(let i=0;i<170;i++){const x=rnd()*290,z=-131+rnd()*131;if(x<75||z<-111)bush(x,z,1+rnd()*2.8);}
 for(let i=0;i<330;i++){const x=rnd()*326,z=370+rnd()*317;const d=Math.abs(x-60);bush(x,z,.8+rnd()*2.4);}
 for(let i=0;i<90;i++){const x=rnd()*328,z=67+rnd()*281;if((x<95&&Math.hypot(x-47,z-223)>28)||x>292)bush(x,z,1+rnd()*2.5);}
 for(let i=0;i<40;i++){const x=-150+rnd()*140,z=-130+rnd()*110;if(x<-108||z<-101)bush(x,z,1+rnd()*2.2);}
 for(let i=0;i<85;i++){const x=95+rnd()*165,z=-106+rnd()*35;bush(x,z,.75+rnd()*.8,proposed);}
 for(let i=0;i<17;i++){const x=99+i*9.3;bush(x,2,1.05,proposed);}
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
 const carColors=['#e4d8bd','#f1eee3','#65756b','#b18f70','#7c8486'];
 function car(x,z,angle,group,i){const c=new THREE.Group();group.add(c);c.position.set(x,0,z);c.rotation.y=-angle;box(0,0,5.9,14.5,1.7,mat(carColors[i%5]),c,1);box(0,-.6,5.1,7.9,1.7,m.glass,c,2.6);box(0,-.6,5.05,5.9,.25,mat(carColors[i%5]),c,4.2);for(const wx of [-2.95,2.95])for(const wz of [-4.7,4.7]){let o=add(new THREE.CylinderGeometry(1.05,1.05,.65,10),m.dark,c,wx,1.05,wz);o.rotation.z=Math.PI/2;}return c;}
 parkingStalls.forEach((s,i)=>{if(i%3!==0&&s.type!=='accessible')car(s.x,s.z,s.angle,carsProposed,i);});
 for(let i=0;i<6;i++){car(266,213+i*9,Math.PI/2,carsExisting,i);car(266,213+i*9,Math.PI/2,carsProposed,i);}
 for(const b of buckets.values()){const inst=new THREE.InstancedMesh(geo[b.type],b.material,b.matrices.length);b.matrices.forEach((v,i)=>inst.setMatrixAt(i,v));inst.castShadow=true;inst.receiveShadow=true;b.group.add(inst);instanced.push(inst);}
 proposed.visible=false;carsExisting.visible=false;carsProposed.visible=false;
 return {root,common,existing,proposed,boundaries,carsExisting,carsProposed,labels,parkingStalls,lights,
  setState(isProposed,showCars){existing.visible=!isProposed;proposed.visible=isProposed;carsExisting.visible=showCars&&!isProposed;carsProposed.visible=showCars&&isProposed;},
  stats:{northStalls:parkingStalls.length,standard:parkingStalls.filter(s=>s.type==='standard').length,compact:parkingStalls.filter(s=>s.type==='compact').length,accessible:parkingStalls.filter(s=>s.type==='accessible').length,fixtures:lights.length,parcels:data.parcels.length,trees:data.trees.length}
 };
}

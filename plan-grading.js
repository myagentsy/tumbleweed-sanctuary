// Figure 3-4, Grading Plan, IS/MND printed p.31 / PDF p.37.
// Heights are feet; x increases east and z increases south.
// Civil spot locations are aligned approximately to the retained A1 footprint.
// Intermediate/end points without a drawn spot are interpolated, not survey data.
export const datum = 3362;
export const gutterZ = -33.3;
export const ditchX = 77.8;
export const basinZ = -16;
export const northZ = -66.83;

export const profiles = [
 {z:northZ, points:[[80.8,3363.25],[96.7,3364.25],[134.8,3365.60],[222.1,3368.80],[265.3,3370.70],[290,3371.00]]},
 {z:-47.4, points:[[80.8,3363.10],[100.3,3363.95],[136.4,3365.10],[182.2,3366.66],[218.6,3367.90],[290,3370.65]]},
 {z:gutterZ, points:[[80.8,3362.30],[130.9,3364.65],[171.4,3366.00],[222.0,3367.85],[290,3370.05]]},
 {z:-19.2, points:[[80.8,3364.40],[130.9,3365.15],[171.4,3366.50],[228.4,3368.35],[265.2,3369.85],[290,3371.15]]},
 {z:0, points:[[80.8,3364.70],[101.3,3365.25],[128.7,3366.00],[174.3,3367.25],[201.5,3368.00],[237.8,3369.75],[290,3371.15]]}
];

export function interpolate(points, x) {
 for(let i=1;i<points.length;i++) if(x<=points[i][0]) {
  const a=points[i-1],b=points[i],t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
  return a[1]+(b[1]-a[1])*t;
 }
 return points.at(-1)[1];
}

export function parkingY(x,z) {
 if(z<=profiles[0].z)return interpolate(profiles[0].points,x)-datum;
 for(let i=1;i<profiles.length;i++)if(z<=profiles[i].z){
  const a=profiles[i-1],b=profiles[i],t=(z-a.z)/(b.z-a.z);
  return interpolate(a.points,x)*(1-t)+interpolate(b.points,x)*t-datum;
 }
 return interpolate(profiles.at(-1).points,x)-datum;
}

export const ditchSpots = [[northZ,3362.50],[-47.4,3362.40],[gutterZ,3362.30],[-23,3362.20],[basinZ,3362.00]];
export const channelY = z => interpolate(ditchSpots,z)-datum;
export const ribbonY = x => parkingY(x,gutterZ);

// Finished surfaces and their supporting ground use one field. Unsurveyed
// street and boundary tie-ins remain illustrative.
const clamp=t=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>a+(b-a)*clamp(t);
// Broad existing-ground plane fitted to the 35 USGS 3DEP samples verified for
// APN 0588-016-01 (1-m CA_SE_Fault_Zone_2017). Aligned to A1's 290 x 131-ft frame.
// Beyond that parcel, the context blends back to the retained model; it is not
// a survey of the residence, street or southern sanctuary parcels.
export const naturalY=(x,z)=>.034806109634305*x+.020230178893138*z+.453501501996;
const streetY=x=>interpolate([[0,.45],[75.8,2.10],[290,9.15],[334,10.6]],x);
export function contextY(x,z) {
 let y=naturalY(x,z);
 const curvedEast=z>-20?270+Math.sqrt(Math.max(0,400-(z+20)**2)):290;
 if(z>=northZ&&z<=0&&x>=80.8&&x<=curvedEast)y=parkingY(x,z);
 else if(z>=northZ-3&&z<northZ&&x>=80.8&&x<=290)y=mix(y,parkingY(x,northZ),(z-northZ+3)/3);
 if(z>=northZ&&z<=basinZ&&Math.abs(x-ditchX)<3.1)y=mix(y,channelY(z),clamp((3.1-Math.abs(x-ditchX))/1.5));
 if(z>0&&z<=16&&x>=73&&x<=310)y=mix(parkingY(x,0),streetY(x),z/16);
 else if(z>0&&z<=16)y=mix(y,streetY(x),z/16);
 if(z>16)y=mix(streetY(x),0,(z-44)/40);
 y*=clamp((x+30)/30)*clamp((380-x)/40)*clamp((z+205)/74);
 return y;
}
export function elevation(x,z) {
 if(z>=northZ&&z<=0&&x>=80.8&&x<=290)return parkingY(x,z);
 return contextY(x,z);
}

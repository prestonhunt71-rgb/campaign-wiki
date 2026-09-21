export const districtLabelFontSize=14;

const inside=(points,x,y)=>{
 let result=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
 }
 return result;
};
const longestAxis=points=>{
 let best={length:0,dx:1,dy:0};
 for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++){
  const dx=points[b][0]-points[a][0],dy=points[b][1]-points[a][1],length=Math.hypot(dx,dy);
  if(length>best.length)best={length,dx:dx/length,dy:dy/length};
 }
 if(best.dx<0)best={...best,dx:-best.dx,dy:-best.dy};
 return best;
};
const chordThrough=(points,anchor,axis)=>{
 const hits=[],nx=-axis.dy,ny=axis.dx;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[j],[bx,by]=points[i],ex=bx-ax,ey=by-ay;
  const denominator=ex*nx+ey*ny;
  if(Math.abs(denominator)<1e-7)continue;
  const edgePosition=((anchor.x-ax)*nx+(anchor.y-ay)*ny)/denominator;
  if(edgePosition>=0&&edgePosition<=1){const x=ax+edgePosition*ex,y=ay+edgePosition*ey;hits.push((x-anchor.x)*axis.dx+(y-anchor.y)*axis.dy);}
 }
 hits.sort((a,b)=>a-b);
 const before=[...hits].reverse().find(value=>value<=0),after=hits.find(value=>value>=0);
 if(before!==undefined&&after!==undefined)return {start:before,end:after};
 return {start:-axis.length/2,end:axis.length/2};
};
const longestChord=(points,axis)=>{
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 let best=null;
 for(let row=0;row<=32;row++)for(let col=0;col<=32;col++){
  const anchor={x:left+(right-left)*col/32,y:top+(bottom-top)*row/32};
  if(!inside(points,anchor.x,anchor.y))continue;
  const chord=chordThrough(points,anchor,axis),length=chord.end-chord.start;
  if(!best||length>best.length)best={anchor,chord,length};
 }
 return best??{anchor:{x:(left+right)/2,y:(top+bottom)/2},chord:{start:-axis.length/2,end:axis.length/2},length:axis.length};
};
const layoutCache=new WeakMap();
export function districtLabelLayout(district){
 if(layoutCache.has(district))return layoutCache.get(district);
 const axis=longestAxis(district.points),best=longestChord(district.points,axis);
 const {anchor,chord}=best,inset=best.length*.1;
 const start=chord.start+inset,end=chord.end-inset;
 const x=anchor.x+(start+end)*axis.dx/2,y=anchor.y+(start+end)*axis.dy/2;
 let angle=Math.atan2(axis.dy,axis.dx)*180/Math.PI;
 if(angle>90)angle-=180;
 if(angle<-90)angle+=180;
 const layout={x,y,angle,length:Math.max(10,end-start),size:districtLabelFontSize};
 layoutCache.set(district,layout);
 return layout;
}

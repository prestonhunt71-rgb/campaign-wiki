const inside=(points,x,y)=>{
 let result=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
 }
 return result;
};
const fits=(points,x,y,width,height)=>{
 for(let row=0;row<=4;row++)for(let col=0;col<=8;col++){
  if(!inside(points,x-width/2+width*col/8,y-height/2+height*row/4))return false;
 }
 return true;
};
const arrangements=name=>{
 const words=name.split(/\s+/);
 const result=[[name]];
 for(let cut=1;cut<words.length;cut++)result.push([words.slice(0,cut).join(' '),words.slice(cut).join(' ')]);
 for(let a=1;a<words.length-1;a++)for(let b=a+1;b<words.length;b++)
  result.push([words.slice(0,a).join(' '),words.slice(a,b).join(' '),words.slice(b).join(' ')]);
 return result.sort((a,b)=>a.length-b.length);
};
const layoutCache=new WeakMap();
export function districtLabelLayout(district){
 if(layoutCache.has(district))return layoutCache.get(district);
 const points=district.points,xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const centerX=(left+right)/2,centerY=(top+bottom)/2;
 const positions=[];
 for(let row=0;row<=12;row++)for(let col=0;col<=12;col++){
  const x=left+(right-left)*col/12,y=top+(bottom-top)*row/12;
  positions.push({x,y,distance:(x-centerX)**2+(y-centerY)**2});
 }
 positions.sort((a,b)=>a.distance-b.distance);
 const variants=arrangements(district.name);
 for(let size=38;size>=3;size-=.5)for(const lines of variants){
  const width=Math.max(...lines.map(line=>line.length))*.67*size+4;
  const height=lines.length*size*1.2+4;
  if(width>right-left||height>bottom-top)continue;
  for(const {x,y} of positions)if(fits(points,x,y,width,height))
   return layoutCache.set(district,{x,y,size,lines}).get(district);
 }
 layoutCache.set(district,null);
 return null;
}

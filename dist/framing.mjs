// Head geometry is estimated from landmarks plus the original portrait mask.
export function headBounds(faceResult,mask,mw,mh){
 const faces=faceResult.faceLandmarks||[];if(faces.length!==1)return {error:faces.length?'Auto-frame needs one person. Crop manually to isolate the applicant.':'No face found for auto-framing. Use a clear front-facing photo.'};
 const f=faces[0],chin=f[152],forehead=f[10],fw=Math.abs(f[454].x-f[234].x),cx=(f[454].x+f[234].x)/2;
 let top=1,left=1,right=0,total=0;
 for(let y=0;y<mh;y++){let row=0;for(let x=0;x<mw;x++){const nx=x/mw,ny=y/mh,c=mask[y*mw+x];if((c===1||c===3||c===5)&&nx>cx-fw*.85&&nx<cx+fw*.85&&ny<chin.y){row++;total++;left=Math.min(left,nx);right=Math.max(right,nx);}}if(row>=Math.max(3,fw*mw*.12))top=Math.min(top,y/mh);}
 if(total<120||top>=forehead.y||chin.y-top<.05||right<=left)return {error:'Could not reliably locate the full head. Adjust zoom and position manually.'};
 if(top<.015||chin.y>.985||left<.005||right>.995)return {error:'The original may cut off hair or chin. Use a wider photo, or frame manually.'};
 return {top,bottom:chin.y,left,right,cx};
}
export function fitHead(width,height,head,maxZoom=4,target=.825){
 if(!Number.isFinite(target)||target<.75||target>.9||!width||!height||!head||head.error||!(head.bottom>head.top)||!(head.right>head.left))return null;
 const base=Math.max(630/width,810/height),headH=(head.bottom-head.top)*height,headW=(head.right-head.left)*width;
 const desired=Math.min(810*target/headH,630*.92/headW),scale=Math.max(1,Math.min(maxZoom,desired/base)),actual=base*scale;
 const clamp=(value,limit)=>Math.max(-limit,Math.min(limit,value));
 const x=clamp((width/2-head.cx*width)*actual,(width*actual-630)/2),y=clamp((height/2-(head.top+head.bottom)*height/2)*actual,(height*actual-810)/2);
 const coverage=headH*actual/810,center=315+(head.cx*width-width/2)*actual+x;
 return {base,scale,x,y,coverage,limited:Math.abs(coverage-target)>.005||Math.abs(center-315)>25};
}

// Eye line in pixel coordinates: rotate the whole image, never facial features.
export function levelingAngle(faceResult,width,height){
 const faces=faceResult.faceLandmarks||[];if(faces.length!==1)return 0;
 let a=faces[0][33],b=faces[0][263];if(!a||!b)return 0;
 if(a.x>b.x)[a,b]=[b,a];
 const dx=(b.x-a.x)*width,dy=(b.y-a.y)*height;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||dx<=0)return 0;
 const angle=-Math.atan2(dy,dx);
 return Math.abs(angle)<Math.PI/360?0:angle;
}
export function rotatedSize(width,height,angle){
 return {width:Math.ceil(Math.abs(width*Math.cos(angle))+Math.abs(height*Math.sin(angle))),height:Math.ceil(Math.abs(height*Math.cos(angle))+Math.abs(width*Math.sin(angle)))};
}

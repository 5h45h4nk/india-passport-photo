// Composite the original RGB onto white using background probabilities.
// Confident foreground pixels retain their original colors; uncertain edges feather.
export function compositeWhite(pixels,width,height,background,mw,mh){
  if(pixels.length!==width*height*4||background.length!==mw*mh)throw new Error('Invalid image or mask dimensions');
  const output=new Uint8ClampedArray(pixels.length);let foreground=0;
  const sample=(x,y)=>{const xx=Math.max(0,Math.min(mw-1,(x+.5)*mw/width-.5)),yy=Math.max(0,Math.min(mh-1,(y+.5)*mh/height-.5)),x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(mw-1,x0+1),y1=Math.min(mh-1,y0+1),dx=xx-x0,dy=yy-y0;return (background[y0*mw+x0]*(1-dx)+background[y0*mw+x1]*dx)*(1-dy)+(background[y1*mw+x0]*(1-dx)+background[y1*mw+x1]*dx)*dy;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,p=sample(x,y);if(!Number.isFinite(p))throw new Error('Invalid mask probability');let t=Math.max(0,Math.min(1,(p-.1)/.8));t=t*t*(3-2*t);const a=(1-t)*(pixels[i+3]/255);if(a>.5)foreground++;for(let c=0;c<3;c++)output[i+c]=pixels[i+c]*a+255*(1-a);output[i+3]=255;}
  return {pixels:output,foregroundFraction:foreground/(width*height)};
}

// PDF points encode physical dimensions independently of image DPI metadata.
const mm = value => value * 72 / 25.4;
export function printLayout() {
  const width = mm(35), height = mm(45), gap = mm(5);
  const left = (288 - 2 * width - gap) / 2;
  const bottom = (432 - 2 * height - gap) / 2;
  return {pageWidth:288, pageHeight:432, width, height,
    copies:[0,1].flatMap(row => [0,1].map(col => ({x:left+col*(width+gap), y:bottom+row*(height+gap)})))};
}
export function createPrintPdf(jpeg, imageWidth=630, imageHeight=810) {
  const enc = new TextEncoder(), parts=[], offsets=[0]; let length=0;
  const append = value => {const bytes=typeof value==='string'?enc.encode(value):value;parts.push(bytes);length+=bytes.length;};
  const object = (id, body) => {offsets[id]=length;append(`${id} 0 obj\n${body}\nendobj\n`);};
  const layout=printLayout(), n=value=>value.toFixed(6);
  append('%PDF-1.4\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 288 432] /Resources << /XObject << /Photo 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4]=length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  append(jpeg);append('\nendstream\nendobj\n');
  const commands=layout.copies.map(({x,y})=>`q ${n(layout.width)} 0 0 ${n(layout.height)} ${n(x)} ${n(y)} cm /Photo Do Q\n`).join('');
  object(5,`<< /Length ${enc.encode(commands).length} >>\nstream\n${commands}endstream`);
  const xref=length;
  append('xref\n0 6\n0000000000 65535 f \n');
  for(let i=1;i<=5;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const output=new Uint8Array(length);let at=0;for(const part of parts){output.set(part,at);at+=part.length;}return output;
}

export function renderPrintSheet(context, photo) {
  const layout=printLayout(), scale=300/72;
  context.fillStyle='#fff';context.fillRect(0,0,1200,1800);
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  for(const {x,y} of layout.copies)context.drawImage(photo,x*scale,(layout.pageHeight-y-layout.height)*scale,layout.width*scale,layout.height*scale);
}

// Canvas JPEG encoders commonly use 96 DPI; write explicit 300 DPI JFIF density.
export function setPrintJpegDensity(bytes) {
  if(bytes[0]!==255||bytes[1]!==216)throw new Error('Invalid JPEG');
  const result=bytes.slice();
  for(let at=2;at+4<result.length;) {
    if(result[at]!==255)break;
    const marker=result[at+1];if(marker===218||marker===217)break;
    const size=(result[at+2]<<8)|result[at+3];if(size<2||at+size+2>result.length)break;
    if(marker===224&&size>=16&&result[at+4]===74&&result[at+5]===70&&result[at+6]===73&&result[at+7]===70&&result[at+8]===0) {
      result[at+11]=1;result[at+12]=1;result[at+13]=44;result[at+14]=1;result[at+15]=44;return result;
    }
    at+=size+2;
  }
  const jfif=new Uint8Array([255,224,0,16,74,70,73,70,0,1,1,1,1,44,1,44,0,0]);
  const output=new Uint8Array(bytes.length+jfif.length);output.set(bytes.subarray(0,2));output.set(jfif,2);output.set(bytes.subarray(2),2+jfif.length);return output;
}

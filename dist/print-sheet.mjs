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

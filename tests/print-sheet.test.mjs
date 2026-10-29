import test from 'node:test';
import assert from 'node:assert/strict';
import {printLayout,createPrintPdf} from '../dist/print-sheet.mjs';
test('four separate 35 by 45 mm portraits fit inside a 4 by 6 inch page',()=>{
  const p=printLayout();assert.equal(p.pageWidth,4*72);assert.equal(p.pageHeight,6*72);
  assert.ok(Math.abs(p.width/72*25.4-35)<1e-10);assert.ok(Math.abs(p.height/72*25.4-45)<1e-10);
  assert.equal(p.copies.length,4);
  for(const a of p.copies){assert.ok(a.x>0&&a.y>0&&a.x+p.width<288&&a.y+p.height<432);
    for(const b of p.copies)if(a!==b)assert.ok(a.x+p.width<=b.x||b.x+p.width<=a.x||a.y+p.height<=b.y||b.y+p.height<=a.y);}
});
test('PDF binary offsets remain valid with binary JPEG data and four image placements',()=>{
  const jpeg=new Uint8Array([255,216,0,128,255,217]);const bytes=createPrintPdf(jpeg);
  const text=new TextDecoder('latin1').decode(bytes);assert.match(text,/\/MediaBox \[0 0 288 432\]/);
  assert.equal((text.match(/\/Photo Do/g)||[]).length,4);
  const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(xref,xref+4)),'xref');
  const rows=text.slice(xref).split('\n').slice(3,8);
  rows.forEach((row,i)=>assert.equal(new TextDecoder().decode(bytes.slice(Number(row.slice(0,10)),Number(row.slice(0,10))+7)),`${i+1} 0 obj`));
  assert.match(text,/\/Length 6 >>\nstream/);
});

test('JPG sheet draws four portraits at 300 PPI with white margins',async()=>{
  const {renderPrintSheet}=await import('../dist/print-sheet.mjs');
  const calls=[],photo={};const ctx={fillRect:(...args)=>calls.push(['fill',...args]),drawImage:(...args)=>calls.push(['photo',...args])};
  renderPrintSheet(ctx,photo);assert.deepEqual(calls[0],['fill',0,0,1200,1800]);assert.equal(ctx.fillStyle,'#fff');assert.equal(calls.length,5);
  for(const [,source,x,y,w,h] of calls.slice(1)){assert.equal(source,photo);assert.ok(Math.abs(w/300*25.4-35)<1e-10);assert.ok(Math.abs(h/300*25.4-45)<1e-10);assert.ok(x>0&&y>0&&x+w<1200&&y+h<1800);}
});
test('JPG density is inserted or replaced without changing image payload',async()=>{
  const {setPrintJpegDensity}=await import('../dist/print-sheet.mjs');
  const input=new Uint8Array([255,216,255,218,0,2,128,255,217]);const output=setPrintJpegDensity(input);
  assert.deepEqual(output.slice(20),input.slice(2));assert.equal(output[13],1);assert.equal(output[14]*256+output[15],300);assert.equal(output[16]*256+output[17],300);
  const old=output.slice();old[15]=96;old[17]=96;assert.deepEqual(setPrintJpegDensity(old),output);assert.equal(old[15],96);
});

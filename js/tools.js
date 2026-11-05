// صفحة: tools — استخراج الصور من PDF (بأعلى جودة وبدون علامة مائية)
const toBin=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return s};
const inflate=async u=>new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
function unpred(d,cols,bpp,w){const rb=cols*bpp*w/8|0,pb=Math.max(1,bpp*cols/8|0),rows=d.length/(rb+1)|0,o=new Uint8Array(rows*rb);
 for(let r=0;r<rows;r++){const f=d[r*(rb+1)],s=r*(rb+1)+1,q=r*rb;for(let i=0;i<rb;i++){const x=d[s+i],a=i>=pb?o[q+i-pb]:0,b=r?o[q-rb+i]:0,c=r&&i>=pb?o[q-rb+i-pb]:0;let v=x;
  if(f==1)v=x+a;else if(f==2)v=x+b;else if(f==3)v=x+((a+b)>>1);else if(f==4){const p=a+b-c,pa=Math.abs(p-a),pbb=Math.abs(p-b),pc=Math.abs(p-c);v=x+(pa<=pbb&&pa<=pc?a:pbb<=pc?b:c)}o[q+i]=v&255}}return o}
function objDict(bin,n){const m=new RegExp('(?:^|[\\r\\n\\s])'+n+'\\s+0\\s+obj').exec(bin);if(!m)return null;const i=m.index+m[0].length,e=bin.indexOf('endobj',i);return{dict:bin.slice(i,e<0?i+4000:Math.min(e,i+4000)),pos:i}}
async function streamOf(bin,buf,n){const o=objDict(bin,n);if(!o)return null;const si=bin.indexOf('stream',o.pos);if(si<0)return null;let st=si+6;if(bin[st]=='\r')st++;if(bin[st]=='\n')st++;const lm=/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(o.dict);let en=lm&&bin.startsWith('endstream',st+ +lm[1])||lm&&/^\s*endstream/.test(bin.substr(st+ +lm[1],12))?st+ +lm[1]:bin.indexOf('endstream',st);return{dict:o.dict,bytes:buf.subarray(st,en)}}
async function pdfImages(file,prog){const buf=new Uint8Array(await file.arrayBuffer()),bin=toBin(buf);if(/\/Encrypt\s/.test(bin.slice(-3000))||/\/Encrypt\s/.test(bin.slice(0,3000)))throw new Error('encrypted');
 const out=[],masks=new Set();let skipped=0,pos=0,guard=0;const cv=document.createElement('canvas');
 while(guard++<200000){const i=bin.indexOf('stream',pos);if(i<0)break;if(bin.substr(i-3,3)=='end'){pos=i+6;continue}let st=i+6;if(bin[st]=='\r')st++;if(bin[st]=='\n')st++;
  let en=bin.indexOf('endstream',st);if(en<0)break;pos=en+9;const head=bin.slice(Math.max(0,i-4000),i),oi=head.lastIndexOf('obj'),dict=head.slice(oi+3);
  if(!/\/Subtype\s*\/Image/.test(dict))continue;
  const mk=/\/S?Mask\s+(\d+)\s+0\s+R/.exec(dict);if(mk)masks.add(mk[1]);const on=(/(\d+)\s+\d+\s*$/.exec(head.slice(0,oi))||[])[1];
  const lm=/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);if(lm&&bin.substr(st+ +lm[1],14).replace(/^\s+/,'').startsWith('endstream'))en=st+ +lm[1];else{if(bin[en-1]=='\n')en--;if(bin[en-1]=='\r')en--}
  let bytes=buf.subarray(st,en);const w=+(/\/Width\s+(\d+)/.exec(dict)||[])[1],h=+(/\/Height\s+(\d+)/.exec(dict)||[])[1],fm=/\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/.exec(dict),fl=fm?fm[1].match(/[A-Za-z0-9]+/g):[];
  try{
   if(fl.length&&fl[fl.length-1]=='DCTDecode'){if(fl.length==2&&fl[0]=='FlateDecode')bytes=await inflate(bytes);else if(fl.length>1){skipped++;continue}out.push({n:on,blob:new Blob([bytes],{type:'image/jpeg'}),ext:'jpg',w,h,size:bytes.length});continue}
   if(fl.length!=1||fl[0]!='FlateDecode'||!w||!h){skipped++;continue}
   const bpc=+(/\/BitsPerComponent\s+(\d+)/.exec(dict)||[0,8])[1];if(bpc!=8){skipped++;continue}
   let comp=0;const csm=/\/ColorSpace\s*(\/Device(?:RGB|Gray)|\[?\s*\/ICCBased\s+(\d+)\s+0\s+R\s*\]?|\/CalRGB|\/CalGray)/.exec(dict);if(!csm){skipped++;continue}
   if(/DeviceRGB|CalRGB/.test(csm[1]))comp=3;else if(/DeviceGray|CalGray/.test(csm[1]))comp=1;else{const od=objDict(bin,csm[2]),nn=od&&/\/N\s+(\d)/.exec(od.dict);comp=nn?+nn[1]:0}
   if(comp!=1&&comp!=3){skipped++;continue}
   let px=await inflate(bytes);const pm=/\/Predictor\s+(\d+)/.exec(dict);if(pm&&+pm[1]>=10)px=unpred(px,comp,8,w);else if(pm&&+pm[1]>1){skipped++;continue}
   if(px.length<w*h*comp){skipped++;continue}
   let alpha=null;const sm=/\/SMask\s+(\d+)\s+0\s+R/.exec(dict);if(sm){try{const s=await streamOf(bin,buf,+sm[1]);if(s&&/FlateDecode/.test(s.dict)&&+(/\/Width\s+(\d+)/.exec(s.dict)||[])[1]==w&&+(/\/Height\s+(\d+)/.exec(s.dict)||[])[1]==h){let a=await inflate(s.bytes);const sp=/\/Predictor\s+(\d+)/.exec(s.dict);if(sp&&+sp[1]>=10)a=unpred(a,1,8,w);if(a.length>=w*h)alpha=a}}catch(e){}}
   cv.width=w;cv.height=h;const cx=cv.getContext('2d'),id=cx.createImageData(w,h),d=id.data;
   for(let p=0,q=0;p<w*h;p++){if(comp==3){d[q++]=px[p*3];d[q++]=px[p*3+1];d[q++]=px[p*3+2]}else{d[q]=d[q+1]=d[q+2]=px[p];q+=3}d[q++]=alpha?alpha[p]:255}
   cx.putImageData(id,0,0);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));out.push({n:on,blob,ext:'png',w,h,size:blob.size,alpha:!!alpha})
  }catch(e){skipped++}
  if(prog&&out.length%5==0)prog(out.length)}
 return{out:out.filter(x=>!masks.has(x.n)),skipped}}
const crc32=u=>{let c,t=crc32.t||(crc32.t=Array.from({length:256},(_,n)=>{c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0}));let r=~0;for(let i=0;i<u.length;i++)r=t[(r^u[i])&255]^(r>>>8);return ~r>>>0};
async function makeZip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;
 for(const f of files){const d=new Uint8Array(await f.blob.arrayBuffer()),n=enc.encode(f.name),c=crc32(d);
  const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);parts.push(h.buffer,n,d);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x21,true);ch.setUint32(16,c,true);ch.setUint32(20,d.length,true);ch.setUint32(24,d.length,true);ch.setUint16(28,n.length,true);ch.setUint32(42,off,true);cd.push(ch.buffer,n);off+=30+n.length+d.length}
 let cs=0;cd.forEach(x=>cs+=x.byteLength);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 return new Blob([...parts,...cd,e.buffer],{type:'application/zip'})}
const dlBlob=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},2000)};
let PX=[],PN='pdf';
function pTools(){A.innerHTML=`<div class=pg><h2 class=rv>${t('tools')}</h2><div class="gl cd2 rv" style="margin-top:1rem"><h3>${t('toolPdf')}</h3><p class=mu style="margin:.4rem 0 1rem">${t('toolPdfD')}</p><label class=drop id=dz><input id=pf type=file accept="application/pdf" hidden><b>${t('pickPdf')}</b><small>${t('dropPdf')}</small></label><div id=pst class=mu style="margin-top:.8rem"></div><div id=pres></div></div></div>`;
 const dz=$('#dz'),inp=$('#pf');['dragover','dragenter'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.add('on')}));['dragleave','drop'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.remove('on')}));
 dz.addEventListener('drop',e=>{if(e.dataTransfer.files[0])run(e.dataTransfer.files[0])});inp.onchange=()=>inp.files[0]&&run(inp.files[0])}
async function run(f){$('#pres').innerHTML='';$('#pst').innerHTML=`<div class=ld style="display:inline-block;vertical-align:middle"></div> ${t('extracting')}`;PN=f.name.replace(/\.pdf$/i,'')||'pdf';
 try{const r=await pdfImages(f,n=>$('#pst').lastChild&&($('#pst').lastChild.textContent=' '+t('extracting')+' '+n));PX=r.out.map((x,i)=>({...x,url:URL.createObjectURL(x.blob),sel:false}));$('#pst').textContent=PX.length?`${PX.length} ${t('foundImgs')}${r.skipped?` · ${r.skipped} ${t('skippedImgs')}`:''}`:t('noImgs');drawP()}catch(e){$('#pst').textContent=e.message=='encrypted'?t('encrypted'):t('err')}}
function drawP(){const hide=($('#hsm')||{}).checked!==false,min=150;const vis=PX.map((x,i)=>({x,i})).filter(o=>!hide||(o.x.w>=min&&o.x.h>=min)),ns=PX.filter(x=>x.sel).length;
 $('#pres').innerHTML=PX.length?`<div class=ptool><label><input type=checkbox id=hsm ${hide?'checked':''}>${t('hideSmall')}</label><button id=sa>${t('selAll')}</button><button id=sn>${t('selNone')}</button><button class=f id=dz2 ${ns?'':'disabled'}>${t('dlSel')} (${ns})</button></div><div class=pgrid>${vis.map(({x,i})=>`<div class="pi ${x.sel?'sel':''}" data-i="${i}"><input type=checkbox ${x.sel?'checked':''} tabindex=-1><button data-d="${i}">⬇</button><img src="${x.url}" alt=""><span>${x.w}×${x.h} · ${x.ext.toUpperCase()} · ${x.size>1048576?(x.size/1048576).toFixed(1)+' MB':Math.round(x.size/1024)+' KB'}</span></div>`).join('')}</div>`:'';
 if(!PX.length)return;$('#hsm').onchange=drawP;$('#sa').onclick=()=>{vis.forEach(o=>o.x.sel=true);drawP()};$('#sn').onclick=()=>{PX.forEach(x=>x.sel=false);drawP()};
 $('#pres').querySelector('.pgrid').onclick=e=>{const d=e.target.closest('[data-d]');if(d){const x=PX[+d.dataset.d];return dlBlob(x.blob,`${PN}-${String(+d.dataset.d+1).padStart(3,'0')}.${x.ext}`)}const c=e.target.closest('.pi');if(c){const x=PX[+c.dataset.i];x.sel=!x.sel;drawP()}};
 $('#dz2').onclick=async()=>{const sel=PX.map((x,i)=>({x,i})).filter(o=>o.x.sel);$('#dz2').disabled=true;const z=await makeZip(sel.map(o=>({name:`${PN}-${String(o.i+1).padStart(3,'0')}.${o.x.ext}`,blob:o.x.blob})));dlBlob(z,PN+'-images.zip');drawP()}}
bootPage(pTools,'tools');

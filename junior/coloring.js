(()=>{
"use strict";
const $=id=>document.getElementById(id),SIZE=800,KEY="capito-junior-coloring-v1-";
const pages=[{"id":"pizza","name":"Моя пицца"},{"id":"chef","name":"Котёнок-повар"},{"id":"oven","name":"Дровяная печь"},{"id":"slice","name":"Весёлый кусочек"},{"id":"panda","name":"Панда-пиццайоло"},{"id":"delivery","name":"Пицца едет в гости"},{"id":"rabbit","name":"Зайчик готовит"},{"id":"table","name":"Пицца для друзей"},{"id":"catparty","name":"Праздник в пиццерии"}];
const colors=[["Красный","#ed6956"],["Оранжевый","#eda04e"],["Жёлтый","#ffd76b"],["Зелёный","#81ad71"],["Тёмно-зелёный","#345f48"],["Голубой","#85bedc"],["Фиолетовый","#ad95d0"],["Розовый","#efa2bd"],["Коричневый","#b78a60"],["Кремовый","#f5dfb0"],["Белый","#ffffff"]];
const canvas=$("coloring-canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
let current="pizza",selected=colors[0],ready=false,mask=null,base=null,history=[],loadToken=0,saveTimer=null,opened=false,pointer=null,cursor={x:400,y:400},dirty=false;
const status=text=>$("coloring-status").textContent=text;
const pageInfo=()=>pages.find(p=>p.id===current);
function updateButtons(){["coloring-download","coloring-print","coloring-clear"].forEach(id=>$(id).disabled=!ready);$("coloring-undo").disabled=!ready||!history.length;}
function pushUndo(){history.push(ctx.getImageData(0,0,SIZE,SIZE));if(history.length>8)history.shift();}
function persist(){
 clearTimeout(saveTimer);if(!ready||!dirty)return;
 try{localStorage.setItem(KEY+current,canvas.toDataURL("image/png"));dirty=false;}
 catch{status("Рисунок готов! Его можно скачать кнопкой ниже.");}
}
function queueSave(){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(persist,350);}
function imageAt(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});}
async function loadPage(id){
 persist();const token=++loadToken;current=id;ready=false;history=[];dirty=false;updateButtons();$("coloring-loading").hidden=false;$("coloring-loading").textContent="Готовим раскраску…";
 $("coloring-page-name").textContent=pageInfo().name;
 Array.from($("coloring-pages").children).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.page===id)));
 try{
  const original=await imageAt("/junior/art/coloring/"+id+".png");if(token!==loadToken)return;
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(original,0,0,SIZE,SIZE);
  base=ctx.getImageData(0,0,SIZE,SIZE);mask=new Uint8Array(SIZE*SIZE);
  for(let p=0;p<mask.length;p++){const i=p*4;mask[p]=Math.min(base.data[i],base.data[i+1],base.data[i+2])<185?1:0;}
  let saved=null;try{saved=localStorage.getItem(KEY+id);}catch{}
  if(saved&&saved.startsWith("data:image/png;base64,")&&saved.length<3000000){
   try{const image=await imageAt(saved);if(token!==loadToken)return;ctx.drawImage(image,0,0,SIZE,SIZE);}catch{}
  }
  if(token!==loadToken)return;
  ready=true;updateButtons();$("coloring-loading").hidden=true;status(saved?"Твоя раскраска снова здесь. Продолжим?":"Выбери цвет и нажми внутри фигуры.");
 }catch{
  if(token!==loadToken)return;ready=false;updateButtons();$("coloring-loading").textContent="Рисунок не загрузился. Нажми на его карточку ещё раз.";status("Не удалось открыть раскраску. Проверь интернет.");
 }
}
function floodPixels(data,width,height,x,y,rgb,boundaries){
 const start=y*width+x,offset=start*4;if(boundaries[start])return 0;
 const target=[data[offset],data[offset+1],data[offset+2]],tolerance=18;
 if(target.every((c,i)=>Math.abs(c-rgb[i])<=tolerance))return 0;
 const match=p=>!boundaries[p]&&Math.abs(data[p*4]-target[0])<=tolerance&&Math.abs(data[p*4+1]-target[1])<=tolerance&&Math.abs(data[p*4+2]-target[2])<=tolerance;
 const queue=new Int32Array(width*height);let head=0,tail=0;
 const mark=p=>{const i=p*4;data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];data[i+3]=255;queue[tail++]=p;};
 mark(start);
 while(head<tail){
  const p=queue[head++],px=p%width;
  if(px>0&&match(p-1))mark(p-1);
  if(px<width-1&&match(p+1))mark(p+1);
  if(p>=width&&match(p-width))mark(p-width);
  if(p<width*(height-1)&&match(p+width))mark(p+width);
 }
 return tail;
}
function paint(x,y){
 if(!ready)return;
 x=Math.max(0,Math.min(SIZE-1,Math.floor(x)));y=Math.max(0,Math.min(SIZE-1,Math.floor(y)));
 const p=y*SIZE+x;if(mask[p]){status("Нажми внутри фигуры, чуть дальше от чёрной линии.");return;}
 const frame=ctx.getImageData(0,0,SIZE,SIZE),before=new ImageData(new Uint8ClampedArray(frame.data),SIZE,SIZE);
 const rgb=selected[1].slice(1).match(/../g).map(c=>parseInt(c,16));
 const count=floodPixels(frame.data,SIZE,SIZE,x,y,rgb,mask);
 if(!count)return;
 history.push(before);if(history.length>8)history.shift();ctx.putImageData(frame,0,0);updateButtons();queueSave();status("Красиво получается! Можно выбрать ещё один цвет.");
}

const packs=[
 {name:"Моя первая пиццерия",ids:["pizza","chef","oven"]},
 {name:"Пицца отправляется в гости",ids:["slice","panda","delivery"]},
 {name:"Праздник маленьких поваров",ids:["rabbit","table","catparty"]}
];
function weekInfo(now=Date.now()){
 const day=86400000,week=7*day,moscow=now+3*3600000,epoch=Date.UTC(2026,10,23);
 const number=Math.floor((moscow-epoch)/week),index=((number%packs.length)+packs.length)%packs.length;
 const start=epoch+number*week;
 return {number,index,start,end:start+6*day,next:start+week};
}
let activeWeek=null,archiveMode=false;
const dateLabel=value=>new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",timeZone:"UTC"}).format(new Date(value));
function savedPages(){return pages.filter(p=>{try{return !!localStorage.getItem(KEY+p.id);}catch{return false;}});}
function renderPages(){
 const info=weekInfo(),pack=packs[info.index],available=archiveMode?savedPages():pack.ids.map(id=>pages.find(p=>p.id===id));
 $("coloring-week-title").textContent="Раскраски недели · "+pack.name;
 $("coloring-week-dates").textContent=dateLabel(info.start)+" — "+dateLabel(info.end)+". Новый набор — "+dateLabel(info.next)+" (по Москве).";
 $("coloring-archive").setAttribute("aria-pressed",String(archiveMode));
 $("coloring-archive").textContent=archiveMode?"К раскраскам недели":"Мои рисунки";
 $("coloring-pages").setAttribute("aria-label",archiveMode?"Сохранённые рисунки":"Раскраски недели");
 $("coloring-pages").replaceChildren();
 available.forEach(p=>{
  const b=document.createElement("button");b.type="button";b.dataset.page=p.id;b.setAttribute("aria-pressed",String(p.id===current));
  const image=document.createElement("img");image.src="/junior/art/coloring/"+p.id+".png";image.alt="";image.loading="lazy";
  const label=document.createElement("span");label.textContent=p.name;b.append(image,label);b.onclick=()=>loadPage(p.id);$("coloring-pages").append(b);
 });
 if(!available.length){const empty=document.createElement("p");empty.className="coloring-archive-empty";empty.textContent="Здесь появятся твои раскрашенные картинки. Выбери рисунок недели и добавь цвет!";$("coloring-pages").append(empty);}
 return available;
}
function refreshWeek(){
 const info=weekInfo(),changed=activeWeek!==info.number;
 if(changed){persist();archiveMode=false;activeWeek=info.number;const available=renderPages();loadPage(available[0].id);}
 else{renderPages();loadPage(current);}
}
$("coloring-archive").onclick=()=>{persist();archiveMode=!archiveMode;const available=renderPages();if(available.length&&!available.some(p=>p.id===current))loadPage(available[0].id);};
colors.forEach(([name,hex],index)=>{
 const b=document.createElement("button");b.type="button";b.className="coloring-swatch";b.style.setProperty("--swatch",hex);b.setAttribute("aria-label",name);b.setAttribute("aria-pressed",String(index===0));b.title=name;
 const dot=document.createElement("span");dot.setAttribute("aria-hidden","true");b.append(dot);
 b.onclick=()=>{selected=[name,hex];Array.from($("coloring-palette").children).forEach(other=>other.setAttribute("aria-pressed",String(other===b)));$("coloring-current-color").textContent="Выбран цвет: "+name.toLowerCase();};
 $("coloring-palette").append(b);
});
canvas.addEventListener("pointerdown",e=>{if(!ready||e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);$("coloring-cursor").hidden=true;});
canvas.addEventListener("pointerup",e=>{
 if(!pointer||pointer.id!==e.pointerId)return;const start=pointer;pointer=null;
 if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>15)return;
 const r=canvas.getBoundingClientRect();paint((e.clientX-r.left)*SIZE/r.width,(e.clientY-r.top)*SIZE/r.height);
});
canvas.addEventListener("pointercancel",()=>pointer=null);
function showCursor(){const marker=$("coloring-cursor");marker.hidden=false;marker.style.left=cursor.x/SIZE*100+"%";marker.style.top=cursor.y/SIZE*100+"%";}
canvas.addEventListener("keydown",e=>{
 const moves={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};
 if(moves[e.key]){e.preventDefault();cursor.x=Math.max(0,Math.min(SIZE-1,cursor.x+moves[e.key][0]));cursor.y=Math.max(0,Math.min(SIZE-1,cursor.y+moves[e.key][1]));showCursor();}
 if(e.key==="Enter"||e.key===" "){e.preventDefault();showCursor();paint(cursor.x,cursor.y);}
});
canvas.addEventListener("blur",()=>$("coloring-cursor").hidden=true);
$("coloring-undo").onclick=()=>{if(!ready||!history.length)return;ctx.putImageData(history.pop(),0,0);updateButtons();queueSave();status("Последний цвет отменён. Попробуем другой?");};
$("coloring-clear").onclick=()=>{if(!ready)return;pushUndo();ctx.putImageData(base,0,0);updateButtons();queueSave();status("Снова чистый лист! Если передумал, нажми «Отменить».");};
$("coloring-download").onclick=()=>{
 if(!ready)return;persist();
 try{
  const output=document.createElement("canvas");output.width=1000;output.height=1130;const paint=output.getContext("2d");
  paint.fillStyle="#ffffff";paint.fillRect(0,0,1000,1130);paint.fillStyle="#234433";paint.font="bold 34px Georgia,serif";paint.textAlign="center";paint.fillText("CAPITO · маленький художник",500,60);
  paint.drawImage(canvas,40,90,920,920);paint.font="25px sans-serif";paint.fillText(pageInfo().name,500,1060);paint.font="15px sans-serif";paint.fillStyle="#78866d";paint.fillText("FATTO CON AMORE",500,1100);
  const a=document.createElement("a");a.download="capito-coloring-"+current+".png";a.href=output.toDataURL("image/png");document.body.append(a);a.click();a.remove();status("Картинка готова к сохранению. Покажи её своим близким!");
 }catch{status("Не получилось скачать рисунок. Попробуй ещё раз.");}
};
$("coloring-print").onclick=()=>{if(ready){persist();window.print();}};
window.addEventListener("capito-coloring-open",()=>{opened=true;refreshWeek();});
window.addEventListener("capito-coloring-close",()=>{opened=false;persist();pointer=null;});
setInterval(()=>{if(opened&&!document.hidden&&activeWeek!==weekInfo().number)refreshWeek();},60000);
window.addEventListener("pagehide",persist);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&opened)persist();else if(opened&&activeWeek!==weekInfo().number)refreshWeek();});
})();

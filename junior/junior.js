(()=>{"use strict";
const $=id=>document.getElementById(id);
const foods=[["tomato","Томат","POMODORO"],["cheese","Моцарелла","MOZZARELLA"],["basil","Базилик","BASILICO"],["mushroom","Грибы","FUNGHI"],["oregano","Орегано","ORIGANO"],["pepperoni","Пепперони","SALAME"],["cream-sauce","Соус сливочный","SALSA BIANCA"],["tomato-sauce","Соус томатный","SALSA DI POMODORO"],["pickles","Огурцы маринованные","CETRIOLINI"],["mortadella","Мортаделла","MORTADELLA"],["dor-blue","Дорблю","DOR BLUE"],["pastrami","Пастрами","PASTRAMI"]];

const API="https://betbkhvyejtjqfyuxmql.supabase.co/rest/v1/rpc/";
const KEY="sb_publishable_AY3okNvvxefclorginvwZQ_fzRXjrYQ";
let age="4-7",session=null,round=0,picks=[],answers=[],startTime=0,roundTime=0,tick=null,busy=false,finished=false,pending=false,audio=null,sound=false;
const foodImage=id=>"/junior/art/photo/"+foods[id][0]+".png";
const artMarkup=(name,alt="")=>"<picture class='food-photo'><source type='image/png' srcset='/junior/art/photo/"+name+".png'><img src='/junior/art/photo/"+name+".png' alt='"+alt+"' decoding='async'></picture>";
async function rpc(name,body){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(API+"capito_junior_preview_"+name,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify(body),signal:controller.signal});if(!r.ok)throw Error("Сервис временно недоступен");return await r.json();}finally{clearTimeout(timeout)}}
function screen(id){document.body.classList.toggle("is-playing",id==="kitchen");document.body.dataset.screen=id;["welcome","kitchen","result","board"].forEach(x=>$(x).hidden=x!==id);window.scrollTo(0,0)}
function note(kind="tap"){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const tones=kind==="bake"?[392,494,587]:kind==="win"?[523,659,784,1047]:[480];tones.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.1;o.type="sine";o.connect(g);g.connect(audio.destination);o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.17);o.start(t);o.stop(t+.18)})}catch{}}
function stats(){try{const s=JSON.parse(localStorage.getItem("capito-junior-preview-badges-"+age)||"{}");return s&&typeof s==="object"?s:{}}catch{return {}}}
function saveStats(result){const s=stats();s.first=true;s.perfect=s.perfect||result.perfect>0;s.master=s.master||result.perfect===session.recipes.length;try{localStorage.setItem("capito-junior-preview-badges-"+age,JSON.stringify(s))}catch{}return s}
function badges(target,s){target.replaceChildren();[["first","hat","Первый заказ"],["perfect","star","Идеальная пицца"],["master","cup","Мастер кухни"]].forEach(([key,icon,label])=>{const el=document.createElement("div");el.className="badge"+(s[key]?"":" locked");const image=document.createElement("img");image.src="/junior/art/"+icon+".svg";image.alt="";const name=document.createElement("span");name.textContent=label;const state=document.createElement("small");state.textContent=s[key]?"Награда получена":"Ещё впереди";el.append(image,name,state);target.append(el)})}
document.querySelectorAll("[data-age]").forEach(b=>b.onclick=()=>{age=b.dataset.age;document.querySelectorAll("[data-age]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
$("sound").onclick=()=>{sound=!sound;$("sound").querySelector("span").textContent=sound?"Звук вкл.":"Звук выкл.";$("sound").setAttribute("aria-pressed",String(sound));$("sound").setAttribute("aria-label",sound?"Выключить звук":"Включить звук");$("sound").querySelector("path").setAttribute("d",sound?"M10 5L5 9H2V15H5L10 19ZM14 8Q19 12 14 16M17 4Q26 12 17 20":"M10 5L5 9H2V15H5L10 19ZM15 8L21 16M21 8L15 16");note()};
foods.forEach(([icon,label,it],i)=>{const b=document.createElement("button");b.innerHTML="<b aria-hidden='true'>"+artMarkup(icon)+"</b><span class='food-name'>"+label+"</span><span class='food-it' aria-hidden='true'>"+it+"</span>";b.setAttribute("aria-label","Добавить: "+label);b.onclick=()=>{if(!session||finished||busy||picks.length>=session.recipes[round].length)return;if(age==="8-12"&&Date.now()-roundTime<5000)return;picks.push(i);renderPizza();b.classList.remove("chosen");void b.offsetWidth;b.classList.add("chosen");note()};$("ingredients").append(b)});
function spreadPieces(id){
 if(id===2)return [{x:50,y:50,width:26,angle:-12}];
 if(id===4)return [{x:50,y:50,width:88,angle:0},{x:50,y:50,width:85,angle:137}];
 const count=({0:7,1:8,3:8,5:7,8:7,9:6,10:8,11:7})[id]||7;
 const width=({0:19,1:18,3:19,5:20,8:18,9:22,10:17,11:21})[id]||19;
 return Array.from({length:count},(_,j)=>{
  const angle=(j*137.508+id*43)*Math.PI/180;
  const radius=26*Math.sqrt((j+.5)/count);
  return {x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius,width,angle:(j*67+id*31)%360};
 });
}
function renderPizza(){
 const root=$("toppings"),sauce=$("sauce-layer");root.replaceChildren();sauce.replaceChildren();sauce.hidden=true;
 sauce.classList.toggle("fresh",picks.length>0&&[6,7].includes(picks[picks.length-1]));
 picks.forEach((id,i)=>{
  if(id===6||id===7){sauce.innerHTML=artMarkup(foods[id][0],foods[id][1]);sauce.dataset.kind=foods[id][0];sauce.hidden=false;return;}
  const layer=document.createElement("div");
  layer.className="topping-layer"+(id===2?" basil-layer":id===4?" oregano-layer":"")+(i===picks.length-1?" fresh":"");
  layer.dataset.ingredient=foods[id][0];layer.setAttribute("role","img");
  layer.setAttribute("aria-label",foods[id][1]+(id===2?" — в центре":" — по всей пицце"));
  layer.style.zIndex=id===2?"100":id===4?"90":String(10+i);
  spreadPieces(id).forEach((pos,j)=>{
   const piece=document.createElement("span");piece.className="topping-piece";
   piece.style.left=pos.x+"%";piece.style.top=pos.y+"%";piece.style.width=pos.width+"%";
   piece.style.setProperty("--piece-angle",pos.angle+"deg");
   piece.style.setProperty("--piece-delay",(j*.025)+"s");
   piece.innerHTML=artMarkup(foods[id][0]);layer.append(piece);
  });
  root.append(layer);
 });
 const count=session.recipes[round].length;
 $("bake").disabled=busy||picks.length!==count;$("undo").disabled=busy||!picks.length;
 $("placement-status").textContent=picks.length===count?"Всё на месте. Можно в печь!":picks.length?"Добавлено "+picks.length+" из "+count+" · что дальше?":"Начни с соуса по заказу";
 $("station-hint").textContent=picks.length+" / "+count+" ингредиентов";
 Array.from($("recipe").children).forEach((el,i)=>el.classList.toggle("filled",i<picks.length));
}
function order(){picks=[];busy=false;roundTime=Date.now();$("kitchen").classList.remove("baking");$("bake-message").textContent="";$("round").textContent="Пицца "+(round+1)+" / "+session.recipes.length;$("ticket-number").textContent="ЗАКАЗ "+String(round+1).padStart(2,"0");$("order-title").textContent=age==="4-7"?"Заказ для шефа":"Запомни заказ";$("round-dots").replaceChildren();session.recipes.forEach((_,i)=>{const dot=document.createElement("i");dot.className=i<round?"done":i===round?"current":"";$("round-dots").append(dot)});$("recipe").replaceChildren();$("recipe").dataset.count=String(session.recipes[round].length);session.recipes[round].forEach((id,i)=>{const el=document.createElement("div");el.className="slot";el.innerHTML=artMarkup(foods[id][0])+"<small>"+(i+1)+"</small>";el.setAttribute("aria-label",(i+1)+". "+foods[id][1]);$("recipe").append(el)});renderPizza();update();}
function update(){if(!session||finished)return;const remaining=Math.max(0,session.seconds-Math.floor((Date.now()-startTime)/1000));$("clock").textContent=remaining+" с";$("timer-ring").style.setProperty("--timer-offset",String(132*(1-remaining/session.seconds)));$("clock").parentElement.classList.toggle("urgent",remaining<=15);const memorizing=age==="8-12"&&Date.now()-roundTime<5000,hidden=age==="8-12"&&!memorizing;Array.from($("ingredients").children).forEach(b=>b.disabled=busy||memorizing);$("recipe").style.visibility=hidden?"hidden":"visible";$("recipe").setAttribute("aria-hidden",String(hidden));$("memory-cover").hidden=!hidden;$("hint").textContent=age==="4-7"?"Сначала соус, затем начинка — слева направо.":memorizing?"Запоминай! Ещё "+Math.max(1,Math.ceil((5000-Date.now()+roundTime)/1000))+" с":"А теперь приготовь по памяти.";if(!remaining)finish();}
$("start").onclick=async()=>{if(pending)return;pending=true;$("start").disabled=true;$("start-status").textContent="Шеф уже готовит твой первый заказ…";try{session=await rpc("start_v3",{p_age:age});round=0;answers=[];finished=false;busy=false;startTime=Date.now();screen("kitchen");order();clearInterval(tick);tick=setInterval(update,200);note()}catch{$("start-status").textContent="Не удалось открыть кухню. Проверь интернет и попробуй ещё раз."}finally{pending=false;$("start").disabled=false}};
$("undo").onclick=()=>{if(!busy&&!finished){picks.pop();renderPizza();note()}};
$("bake").onclick=()=>{if(!session||busy||finished||picks.length!==session.recipes[round].length)return;busy=true;answers[round]=picks.slice();renderPizza();const activeSession=session.id,correct=picks.every((id,i)=>id===session.recipes[round][i]);$("bake-message").textContent=correct?"Идеальная пицца!":"С пылу, с жару!";$("placement-status").textContent=correct?"Точно по заказу. Гость будет счастлив!":"Пицца готова. Следующий заказ получится ещё лучше.";$("kitchen").classList.add("baking");Array.from($("ingredients").children).forEach(b=>b.disabled=true);note("bake");setTimeout(()=>{if(finished||session.id!==activeSession)return;round++;if(round===session.recipes.length)finish();else order()},1300)};
async function finish(){if(finished)return;finished=true;busy=true;clearInterval(tick);$("kitchen").classList.remove("baking");screen("result");$("result-score").textContent="Считаем очки…";$("result-detail").textContent="Записываем результат в клуб маленьких шефов";$("earned").replaceChildren();$("save-retry").hidden=true;await submit();}
async function submit(){$("save-retry").disabled=true;try{const result=await rpc("finish_v3",{p_id:session.id,p_answers:answers});$("result-score").textContent=result.score+" очков";$("result-detail").textContent=result.alias+" · идеальных пицц: "+result.perfect+" из "+session.recipes.length+". Результат сохранён.";badges($("earned"),saveStats(result));$("save-retry").hidden=true;note("win")}catch{$("result-score").textContent="Пиццы готовы!";$("result-detail").textContent="Результат пока не сохранён. Проверь интернет и нажми «Повторить сохранение».";$("save-retry").hidden=false}finally{$("save-retry").disabled=false}}
$("save-retry").onclick=submit;
$("exit").onclick=()=>{finished=true;clearInterval(tick);$("kitchen").classList.remove("baking");screen("welcome");$("start-status").textContent="Можно начать снова. Эта попытка не попала в рейтинг."};
$("again").onclick=()=>{screen("welcome");$("start-status").textContent=""};
async function ranking(){screen("board");$("board-title").textContent="Маленькие шефы\n"+age.replace("-","–")+" лет";$("board-status").textContent="Заглядываем в книгу рекордов…";$("board-content").replaceChildren();try{const rows=await rpc("leaderboard_v3",{p_age:age});$("board-status").textContent=rows.length?"Рейтинг недели. Новый турнир — в понедельник по московскому времени.":"Здесь скоро появятся первые шефы. Открой кухню и задай планку!";rows.forEach((r,i)=>{const row=document.createElement("div");row.className="rank-row";const number=document.createElement("span"),name=document.createElement("span"),score=document.createElement("strong");number.className="rank-number";number.textContent=String(i+1).padStart(2,"0");name.textContent=r.alias;score.textContent=r.score+" очков";row.append(number,name,score);$("board-content").append(row)})}catch{$("board-status").textContent="Не удалось загрузить рейтинг. Вернись на кухню и попробуй ещё раз."}}
$("show-rank").onclick=ranking;$("result-rank").onclick=ranking;
$("show-badges").onclick=()=>{screen("board");$("board-title").textContent="Твои маленькие победы";$("board-status").textContent="Группа "+age.replace("-","–")+" лет. Награды сохраняются на этом устройстве после подтверждения результата сервером.";badges($("board-content"),stats())};
$("home").onclick=()=>screen("welcome");
document.addEventListener("visibilitychange",()=>{if(!document.hidden)update()});
})();
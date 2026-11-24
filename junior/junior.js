(()=>{"use strict";
const $=id=>document.getElementById(id);
if(location.hostname==="game-capito-pizza-game.vercel.app"){document.querySelector("footer small").textContent="КЛУБ МАЛЕНЬКИХ ШЕФОВ";const privacy=document.querySelector("#result .privacy");privacy.textContent=privacy.textContent.replace("Тестовый детский турнир.","Детский клуб CAPITO.");}
const foods=[["tomato","Томат","POMODORO"],["cheese","Моцарелла","MOZZARELLA"],["basil","Базилик","BASILICO"],["mushroom","Грибы","FUNGHI"],["oregano","Орегано","ORIGANO"],["pepperoni","Пепперони","SALAME"],["cream-sauce","Соус сливочный","SALSA BIANCA"],["tomato-sauce","Соус томатный","SALSA DI POMODORO"],["pickles","Огурцы маринованные","CETRIOLINI"],["mortadella","Мортаделла","MORTADELLA"],["dor-blue","Дорблю","DOR BLUE"],["pastrami","Пастрами","PASTRAMI"]];

const API="https://betbkhvyejtjqfyuxmql.supabase.co/rest/v1/rpc/";
const KEY="sb_publishable_AY3okNvvxefclorginvwZQ_fzRXjrYQ";
let age="4-7",session=null,round=0,picks=[],answers=[],startTime=0,roundTime=0,tick=null,busy=false,finished=false,pending=false,stage="assembly",pauseStarted=0,wallStart=0,cuts=0,pointerStart=null,audio=null,sound=false,mode="riddle",revealed=false,ovenFrame=0,ovenReadyAt=0,ovenStars=0,ovenPlayed=0,servedGuests=[],lastGolden=false,guestVoice=null,guestVoiceToken=0,guestVoiceActive=false,guestVoiceStarted=0,guestVoicePausedTimer=false,guestVoiceButton=null,guestVoiceStatus=null,guestVoiceTimeout=null;
const foodImage=id=>"/junior/art/photo/"+foods[id][0]+".png";
const artMarkup=(name,alt="")=>"<picture class='food-photo'><source type='image/png' srcset='/junior/art/photo/"+name+".png'><img src='/junior/art/photo/"+name+".png' alt='"+alt+"' decoding='async'></picture>";
async function rpc(name,body){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(API+"capito_junior_preview_"+name,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify(body),signal:controller.signal});if(!r.ok)throw Error("Сервис временно недоступен");return await r.json();}finally{clearTimeout(timeout)}}
function screen(id){stopGuestVoice();if(id!=="serving"){stopOvenGame();}if(id!=="result"){stopStory();}document.body.classList.toggle("is-playing",["kitchen","serving"].includes(id));document.body.dataset.screen=id;["welcome","kitchen","serving","result","board","coloring"].forEach(x=>$(x).hidden=x!==id);window.scrollTo(0,0);const heading=$(id).querySelector("h1,h2");if(heading){heading.setAttribute("tabindex","-1");heading.focus({preventScroll:true});}}
function note(kind="tap"){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const tones=kind==="bake"?[392,494,587]:kind==="win"?[523,659,784,1047]:[480];tones.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.1;o.type="sine";o.connect(g);g.connect(audio.destination);o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.17);o.start(t);o.stop(t+.18)})}catch{}}
function stats(){try{const s=JSON.parse(localStorage.getItem("capito-junior-preview-badges-"+age)||"{}");return s&&typeof s==="object"?s:{}}catch{return {}}}
function saveStats(result){const s=stats();s.first=true;s.perfect=s.perfect||result.perfect>0;s.master=s.master||result.perfect===session.recipes.length;try{localStorage.setItem("capito-junior-preview-badges-"+age,JSON.stringify(s))}catch{}return s}
function badges(target,s){target.replaceChildren();[["first","hat","Первый заказ"],["perfect","star","Идеальная пицца"],["master","cup","Мастер кухни"]].forEach(([key,icon,label])=>{const el=document.createElement("div");el.className="badge"+(s[key]?"":" locked");const image=document.createElement("img");image.src="/junior/art/"+icon+".svg";image.alt="";const name=document.createElement("span");name.textContent=label;const state=document.createElement("small");state.textContent=s[key]?"Награда получена":"Ещё впереди";el.append(image,name,state);target.append(el)})}
document.querySelectorAll("[data-age]").forEach(b=>b.onclick=()=>{age=b.dataset.age;document.querySelectorAll("[data-age]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
$("sound").onclick=()=>{sound=!sound;$("sound").querySelector("span").textContent=sound?"Звук вкл.":"Звук выкл.";$("sound").setAttribute("aria-pressed",String(sound));$("sound").setAttribute("aria-label",sound?"Выключить звук":"Включить звук");$("sound").querySelector("path").setAttribute("d",sound?"M10 5L5 9H2V15H5L10 19ZM14 8Q19 12 14 16M17 4Q26 12 17 20":"M10 5L5 9H2V15H5L10 19ZM15 8L21 16M21 8L15 16");note()};
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
foods.forEach(([icon,label,it],i)=>{const b=document.createElement("button");b.innerHTML="<b aria-hidden='true'>"+artMarkup(icon)+"</b><span class='food-name'>"+label+"</span><span class='food-it' aria-hidden='true'>"+it+"</span>";b.setAttribute("aria-label","Добавить: "+label);b.onclick=()=>{if(!session||finished||busy||picks.length>=6||picks.includes(i))return;picks.push(i);renderPizza();update();b.classList.remove("chosen");void b.offsetWidth;b.classList.add("chosen");note()};$("ingredients").append(b)});
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
 const count=6;
 $("bake").disabled=busy||picks.length<1;$("undo").disabled=busy||!picks.length;
 $("placement-status").textContent=picks.length===count?"Шесть ингредиентов. Можно в печь!":picks.length?"Можно в печь или добавить ещё начинку":"Выбери от 1 до 6 ингредиентов";
 $("station-hint").textContent=picks.length+" / "+count+" ингредиентов";
 Array.from($("recipe").children).forEach((el,i)=>el.classList.toggle("filled",picks.includes(session.recipes[round][i])));
}
function order(){
 stage="assembly";picks=[];lastGolden=false;busy=false;revealed=false;roundTime=Date.now();$("kitchen").classList.remove("baking");$("bake-message").textContent="";
 $("round").textContent="Пицца "+(round+1)+" / "+session.recipes.length;$("ticket-number").textContent=mode==="free"?"ТВОЙ РЕЦЕПТ":"ЗАГАДКА "+String(round+1).padStart(2,"0");
 renderOrderGuest();$("order-title").textContent=mode==="free"?"Пицца твоей мечты":session.riddles[round].title;
 $("hint").textContent=mode==="free"?"Выбирай любимую начинку. От 1 до 6 ингредиентов — и можно в печь!":session.riddles[round].clue;
 $("recipe-size").textContent=mode==="free"?"Без рейтинга · без спешки":"В рецепте: "+session.recipes[round].length;
 $("reveal-recipe").hidden=mode==="free";$("reveal-recipe").setAttribute("aria-expanded","false");$("reveal-recipe").textContent="Показать подсказку";
 $("round-dots").replaceChildren();session.recipes.forEach((_,i)=>{const dot=document.createElement("i");dot.className=i<round?"done":i===round?"current":"";$("round-dots").append(dot)});
 $("recipe").replaceChildren();$("recipe").dataset.count=String(session.recipes[round].length);
 if(mode!=="free")session.recipes[round].forEach((id,i)=>{const el=document.createElement("div");el.className="slot";el.innerHTML=artMarkup(foods[id][0]);el.setAttribute("aria-label",foods[id][1]);$("recipe").append(el)});
 revealed=mode!=="free"&&age==="4-7";$("recipe").hidden=!revealed;$("reveal-recipe").setAttribute("aria-expanded",String(revealed));$("reveal-recipe").textContent=revealed?"Скрыть подсказку":"Показать подсказку";$("memory-cover").hidden=true;renderPizza();update();
}
$("reveal-recipe").onclick=()=>{revealed=!revealed;$("recipe").hidden=!revealed;$("reveal-recipe").setAttribute("aria-expanded",String(revealed));$("reveal-recipe").textContent=revealed?"Скрыть подсказку":"Показать подсказку";};
function update(){
 if(!session||finished)return;
 if(mode!=="free"&&Date.now()-wallStart>295000){finish();return;}if(stage!=="assembly")return;
 const remaining=mode==="free"?session.seconds:Math.max(0,session.seconds-Math.floor(((guestVoiceActive&&guestVoicePausedTimer?guestVoiceStarted:Date.now())-startTime)/1000));
 $("clock").textContent=mode==="free"?"∞":remaining+" с";$("clock").parentElement.classList.toggle("urgent",mode!=="free"&&remaining<=15);
 $("timer-ring").style.setProperty("--timer-offset",String(132*(1-remaining/session.seconds)));
 Array.from($("ingredients").children).forEach((b,i)=>b.disabled=busy||picks.includes(i)||picks.length>=6);
 if(mode!=="free"&&!remaining)finish();
}
$("start").onclick=async()=>{if(pending)return;pending=true;$("start").disabled=true;$("start-status").textContent="Шеф уже готовит твой первый заказ…";try{session=mode==="free"?{id:"free-"+Date.now(),recipes:[[],[],[]],seconds:90}:await rpc("start_v5",{p_age:age});round=0;answers=[];ovenStars=0;ovenPlayed=0;servedGuests=[];lastGolden=false;finished=false;busy=false;startTime=Date.now();wallStart=startTime;screen("kitchen");order();clearInterval(tick);tick=setInterval(update,200);note()}catch{$("start-status").textContent="Не удалось открыть кухню. Проверь интернет и попробуй ещё раз."}finally{pending=false;$("start").disabled=false}};
$("undo").onclick=()=>{if(!busy&&!finished){picks.pop();renderPizza();update();note()}};
function showRecipeReview(){
 if(mode==="free"){$("serving-hint").textContent="Твой авторский рецепт готов. Разрежь на шесть кусочков!";return;}
 const expected=session.recipes[round],correct=picks.length===expected.length&&expected.every(id=>picks.includes(id));
 $("serving-title").textContent=correct?"Рецепт угадан!":"Сравним с рецептом";
 $("serving-hint").textContent=(correct?"Молодец! ":"В рецепте «"+session.riddles[round].title+"»: ")+(correct?"Теперь разрежь пиццу на 6 кусочков.":expected.map(id=>foods[id][1]).join(", ")+". Попробуй снова в следующем заказе!");
}
function pizzaCopy(cooked=false){
 const copy=$("pizza").cloneNode(true);copy.removeAttribute("id");
 copy.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
 copy.querySelectorAll(".fresh").forEach(el=>el.classList.remove("fresh"));
 copy.querySelectorAll("img").forEach(img=>img.draggable=false);copy.classList.add("served-pizza");if(cooked)copy.classList.add("cooked");
 if(cooked)copy.querySelectorAll('[data-ingredient="cheese"] picture').forEach(p=>{p.querySelector("source").srcset="/junior/art/photo/cheese-baked.png";p.querySelector("img").src="/junior/art/photo/cheese-baked.png";});
 return copy;
}
function drawCuts(){
 const svg=$("cut-lines");svg.replaceChildren();
 for(let i=0;i<3;i++){
  const angle=i*Math.PI/3,dx=Math.cos(angle)*46,dy=Math.sin(angle)*46;
  const line=document.createElementNS("http://www.w3.org/2000/svg","line");
  line.setAttribute("x1",50-dx);line.setAttribute("y1",50-dy);line.setAttribute("x2",50+dx);line.setAttribute("y2",50+dy);
  line.setAttribute("class",i<cuts?"cut-done":i===cuts?"cut-guide":"cut-future");svg.append(line);
 }
}
function showSlices(){
 const host=$("slice-pizza");host.replaceChildren();
 for(let i=0;i<6;i++){
  const wedge=document.createElement("div");wedge.className="pizza-wedge";
  const points=["50% 50%"];for(let d=i*60;d<=i*60+60;d+=3)points.push((50+50*Math.cos(d*Math.PI/180))+"% "+(50+50*Math.sin(d*Math.PI/180))+"%");
  wedge.style.clipPath="polygon("+points.join(",")+")";
  const a=(i*60+30)*Math.PI/180;wedge.style.transform="translate("+Math.cos(a)*5+"px,"+Math.sin(a)*5+"px)";
  wedge.append(pizzaCopy(true));host.append(wedge);
 }
}
function cut(){
 if(stage!=="cutting"||cuts>=3)return;cuts++;note();drawCuts();$("cut-count").textContent=cuts+" / 3 разрезов";
 $("cut-button").disabled=cuts===3;$("cut-button").textContent=cuts===3?"Готово — 6 кусочков!":"Сделать разрез";
 $("serve-button").disabled=cuts<3;
 $("serving-hint").textContent=cuts===3?"Шесть горячих кусочков. Можно подавать!":"Проведи по пунктиру через центр или нажми «Сделать разрез».";
 if(cuts===3){showSlices();note("win");}
}
$("cut-button").onclick=cut;
$("slice-board").addEventListener("pointerdown",e=>{if(stage!=="cutting"||cuts>=3)return;e.preventDefault();const r=$("slice-board").getBoundingClientRect();pointerStart={x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height,id:e.pointerId};$("slice-board").setPointerCapture(e.pointerId);});
$("slice-board").addEventListener("pointerup",e=>{
 if(!pointerStart||e.pointerId!==pointerStart.id)return;const s=pointerStart;pointerStart=null;
 const r=$("slice-board").getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,dx=x-s.x,dy=y-s.y,length=Math.hypot(dx,dy);
 if(length<s.w*.45)return;
 const distance=Math.abs(dx*(s.h/2-s.y)-dy*(s.w/2-s.x))/length;
 let angle=((Math.atan2(dy,dx)*180/Math.PI)%180+180)%180,diff=Math.abs(angle-cuts*60);diff=Math.min(diff,180-diff);
 if(distance<s.w*.15&&diff<24)cut();else $("serving-hint").textContent="Проведи по пунктиру через центр пиццы. Или нажми «Сделать разрез».";
});
$("slice-board").addEventListener("pointercancel",()=>pointerStart=null);

const guests=[
 {key:"basilio",name:"Базилио",description:"Котёнок — любитель сыра",thanks:"Мур-р-р! Как вкусно! Ты угадал мой любимый рецепт.",creative:"Мур-р-р! Вот это фантазия! Спасибо за твою особенную пиццу."},
 {key:"luka",name:"Лука",description:"Юный путешественник",thanks:"Браво, шеф! Такая пицца — настоящее путешествие в Италию.",creative:"Какое вкусное приключение! Эту авторскую пиццу я запомню."},
 {key:"iskorka",name:"Искорка",description:"Добрый дракончик",thanks:"Огненно вкусно! Вот это мастерство маленького пиццайоло!",creative:"Ух ты! Даже дракон не придумал бы такую необычную пиццу!"}
];
function guestForRecipe(recipe,index){
 if(mode==="free")return guests[index%guests.length];
 const preferred=recipe.includes(5)||recipe.includes(11)?guests[2]:recipe.includes(9)||recipe.includes(8)?guests[1]:recipe.includes(1)?guests[0]:guests[index%guests.length];
 const visited=new Set(servedGuests.map(g=>g.key));
 return !visited.has(preferred.key)?preferred:guests.find(g=>!visited.has(g.key))||preferred;
}
function renderOrderGuest(){
 const g=guestForRecipe(session.recipes[round],round),image=$("order-guest-image");
 image.src="/junior/art/guests/"+g.key+".png";image.alt=g.description;$("order-guest-name").textContent=g.name;
 $("order-voice-status").textContent="";
}

function selectFriendlyVoice(voices){
 const russian=voices.filter(v=>/^ru(?:[-_]|$)/i.test(v.lang));
 const score=v=>(/milena|милена|irina|ирина|svetlana|светлана|natal|натал|alena|ал[её]на|tatyana|татьяна|katerina|катерина|katya|катя|dariya|дарья|female/i.test(v.name)?30:0)+(/enhanced|premium|natural|neural|улучш/i.test(v.name)?20:0)+(v.localService?3:0)+(v.default?2:0);
 return russian.slice().sort((a,b)=>score(b)-score(a))[0]||null;
}
function friendlyVoice(utterance,kind="order"){
 utterance.lang="ru-RU";
 // A gentle, youthful storyteller: a modest pitch lift and clear, unhurried delivery.
 utterance.pitch=1.2;utterance.rate=kind==="story"?.88:age==="4-7"?.86:.92;utterance.volume=1;
 const voice=selectFriendlyVoice(window.speechSynthesis.getVoices());if(voice)utterance.voice=voice;
 return utterance;
}

function stopGuestVoice(message=""){
 if(!guestVoiceActive)return;
 guestVoiceToken++;guestVoiceActive=false;clearTimeout(guestVoiceTimeout);
 if(guestVoicePausedTimer&&session&&!finished)startTime+=Date.now()-guestVoiceStarted;
 guestVoicePausedTimer=false;
 if("speechSynthesis" in window)window.speechSynthesis.cancel();
 if(guestVoiceButton){guestVoiceButton.textContent=guestVoiceButton.id==="listen-order"?"Послушать заказ":guestVoiceButton.id==="preview-voice"?"Послушать голос":"Послушать гостя";guestVoiceButton.setAttribute("aria-pressed","false");}
 if(guestVoiceStatus)guestVoiceStatus.textContent=message;
}
function playGuestVoice(text,button,status){
 if(!canNarrate){status.textContent="На этом устройстве голос недоступен. Можно прочитать текст.";return;}
 if(guestVoiceActive&&guestVoiceButton===button){stopGuestVoice("Озвучка остановлена");return;}
 stopGuestVoice();stopStory();
 guestVoiceToken++;const token=guestVoiceToken;
 guestVoiceActive=true;guestVoiceButton=button;guestVoiceStatus=status;guestVoiceStarted=Date.now();guestVoicePausedTimer=!!session&&!finished&&document.body.dataset.screen==="kitchen"&&stage==="assembly";
 button.textContent="Остановить";button.setAttribute("aria-pressed","true");status.textContent=guestVoicePausedTimer?"Слушаем заказ · таймер на паузе":button.id==="preview-voice"?"Слушаем голос":"Слушаем гостя";
 guestVoice=friendlyVoice(new SpeechSynthesisUtterance(text),"order");
 guestVoice.onend=()=>{if(token===guestVoiceToken)stopGuestVoice("Можно послушать ещё раз");};
 guestVoice.onerror=()=>{if(token===guestVoiceToken)stopGuestVoice("Не получилось включить голос. Текст остаётся на экране.");};
 guestVoiceTimeout=setTimeout(()=>{if(token===guestVoiceToken)stopGuestVoice("Нажми, чтобы послушать ещё раз");},35000);
 try{window.speechSynthesis.speak(guestVoice);}catch{stopGuestVoice("Не получилось включить голос. Текст остаётся на экране.");}
}
$("preview-voice").onclick=()=>playGuestVoice("Привет, маленький шеф! Давай приготовим вкусную пиццу. Выбирай начинку, разгадывай загадки и угощай наших гостей. У тебя всё получится!",$("preview-voice"),$("preview-voice-status"));
$("listen-order").onclick=()=>{
 if(!session||finished||stage!=="assembly")return;
 const g=guestForRecipe(session.recipes[round],round);
 const text="Привет! Я "+g.name+". "+(mode==="free"?"Придумай для меня свою пиццу. Выбирай от одного до шести ингредиентов.":"Мой заказ — "+session.riddles[round].title+". "+session.riddles[round].clue);
 playGuestVoice(text,$("listen-order"),$("order-voice-status"));
};
$("listen-guest").onclick=()=>{if(stage==="delivery")playGuestVoice($("guest-reaction").textContent,$("listen-guest"),$("guest-voice-status"));};
$("serve-button").onclick=()=>{
 if(stage!=="cutting"||cuts<3||finished)return;
 stopGuestVoice();stage="delivery";
 const g=guestForRecipe(session.recipes[round],round),expected=session.recipes[round];
 const correct=mode==="free"||picks.length===expected.length&&expected.every(id=>picks.includes(id));
 servedGuests.push({key:g.key,name:g.name,correct});
 $("slice-stage").hidden=true;$("slice-actions").hidden=true;$("bake-award").hidden=true;$("guest-delivery").hidden=false;
 $("serving-title").textContent="Заказ готов, "+g.name+"!";$("serving-hint").textContent="Гость уже пробует твой заказ";
 $("delivery-guest-image").src="/junior/art/guests/"+g.key+".png";$("delivery-guest-image").alt=g.description;
 $("delivery-guest-name").textContent=g.name;
 $("guest-reaction").textContent=(mode==="free"?g.creative:correct?g.thanks:"Спасибо за старание, шеф! Получилась необычная пицца. В следующий раз попробуем разгадать мой рецепт вместе.")+(lastGolden?" А корочка — просто золотая!":"");
 $("guest-voice-status").textContent="";$("next-guest").textContent=round+1===session.recipes.length?"Посмотреть результат":"Следующий гость";note("win");
};
$("next-guest").onclick=()=>{
 if(stage!=="delivery"||finished)return;
 stopGuestVoice();startTime+=Date.now()-pauseStarted;round++;
 if(round===session.recipes.length)finish();else{screen("kitchen");order();}
};
function renderGuestResult(){
 const root=$("guest-result");root.replaceChildren();root.hidden=!servedGuests.length;if(!servedGuests.length)return;
 const title=document.createElement("strong");title.textContent="Спасибо от твоих гостей";root.append(title);
 const row=document.createElement("div");row.className="guest-result-row";
 servedGuests.forEach(g=>{const item=document.createElement("div"),img=document.createElement("img"),name=document.createElement("span");img.src="/junior/art/guests/"+g.key+".png";img.alt="";name.textContent=g.name;item.append(img,name);row.append(item);});
 root.append(row);
}

$("bake").onclick=()=>{
 if(!session||busy||finished||picks.length<1||picks.length>6)return;
 busy=true;stage="baking";pauseStarted=Date.now();answers[round]=picks.slice();renderPizza();
 const activeSession=session.id,activeRound=round;cuts=0;
 $("serving-title").textContent="В нашей дровяной печи";$("serving-hint").textContent="Огонь румянит бортики и плавит сыр…";
 stopOvenGame();$("guest-delivery").hidden=true;$("oven-challenge").hidden=true;$("bake-award").hidden=true;$("take-pizza").disabled=true;$("take-pizza").textContent="Пицца выпекается…";$("bake-theatre").hidden=false;$("slice-stage").hidden=true;$("slice-actions").hidden=true;
 $("oven-pizza").replaceChildren(pizzaCopy());screen("serving");note("bake");
 setTimeout(()=>{
  if(finished||session.id!==activeSession||round!==activeRound||stage!=="baking")return;
  stage="oven-game";ovenReadyAt=Date.now();$("oven-challenge").hidden=false;$("oven-challenge").classList.toggle("wide-zone",age==="4-7");
  $("serving-title").textContent="Поймай золотую корочку";$("serving-hint").textContent="Один точный момент — и ты мастер дровяной печи!";
  $("take-pizza").disabled=false;$("take-pizza").textContent="Достать пиццу";animateOven();
 },2800);
};

function stopOvenGame(){if(ovenFrame){cancelAnimationFrame(ovenFrame);ovenFrame=0;}}
function ovenProgress(elapsed,period,reduced){
 const phase=((elapsed%period)+period)%period/period;
 const position=phase<.5?phase*200:200-phase*200;
 return reduced?Math.round(position/10)*10:position;
}
function ovenPosition(){
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 return ovenProgress(Date.now()-ovenReadyAt,reduced?6000:age==="4-7"?4400:3400,reduced);
}
function animateOven(){
 if(stage!=="oven-game"||finished){stopOvenGame();return;}
 $("doneness-pointer").style.left=ovenPosition()+"%";ovenFrame=requestAnimationFrame(animateOven);
}
$("take-pizza").onclick=()=>{
 if(stage!=="oven-game"||finished||busy===false)return;
 const position=ovenPosition(),margin=age==="4-7"?20:13,golden=Math.abs(position-50)<=margin;
 stopOvenGame();lastGolden=golden;ovenPlayed++;if(golden)ovenStars++;
 stage="cutting";$("oven-challenge").hidden=true;$("bake-theatre").hidden=true;$("slice-stage").hidden=false;$("slice-actions").hidden=false;
 $("slice-pizza").replaceChildren(pizzaCopy(true));$("serving-title").textContent="С пылу, с жару!";showRecipeReview();
 $("bake-award").hidden=false;$("bake-award").classList.toggle("golden",golden);
 $("bake-award").textContent=golden?"✦ Золотая корочка! Отличный момент, шеф!":"Твоя пицца готова! За золотой корочкой — в следующем заказе.";
 $("cut-count").textContent="0 / 3 разрезов";$("cut-button").disabled=false;$("cut-button").textContent="Сделать разрез";$("serve-button").disabled=true;drawCuts();note(golden?"win":"bake");
};

async function finish(){if(finished)return;finished=true;busy=true;clearInterval(tick);$("kitchen").classList.remove("baking");screen("result");renderGuestResult();$("oven-result").hidden=ovenPlayed===0;$("oven-result").textContent="✦ Золотых корочек: "+ovenStars+" из "+ovenPlayed+" · маленький мастер печи";$("result-score").textContent="Считаем очки…";$("result-detail").textContent="Записываем результат в клуб маленьких шефов";$("earned").replaceChildren();$("save-retry").hidden=true;if(mode==="free"){$("result-score").textContent="Твоя пиццерия!";$("result-detail").textContent="Ты приготовил "+answers.filter(Boolean).length+" авторские пиццы. Свободная кухня — без рейтинга.";$("result-rank").hidden=true;note("win");}else{$("result-rank").hidden=false;await submit();}}
async function submit(){$("save-retry").disabled=true;try{const result=await rpc("finish_v5",{p_id:session.id,p_answers:answers});$("result-score").textContent=result.score+" очков";$("result-detail").textContent=result.alias+" · идеальных пицц: "+result.perfect+" из "+session.recipes.length+". Результат сохранён.";badges($("earned"),saveStats(result));$("save-retry").hidden=true;note("win")}catch{$("result-score").textContent="Пиццы готовы!";$("result-detail").textContent="Результат пока не сохранён. Проверь интернет и нажми «Повторить сохранение».";$("save-retry").hidden=false}finally{$("save-retry").disabled=false}}
$("save-retry").onclick=submit;
$("exit").onclick=()=>{finished=true;clearInterval(tick);$("kitchen").classList.remove("baking");screen("welcome");$("start-status").textContent="Можно начать снова. Эта попытка не попала в рейтинг."};
$("serving-exit").onclick=()=>$("exit").onclick();
$("again").onclick=()=>{screen("welcome");$("start-status").textContent=""};
async function ranking(){screen("board");$("board-title").textContent="Маленькие шефы\n"+age.replace("-","–")+" лет";$("board-status").textContent="Заглядываем в книгу рекордов…";$("board-content").replaceChildren();try{const rows=await rpc("leaderboard_v5",{p_age:age});$("board-status").textContent=rows.length?"Рейтинг недели. Новый турнир — в понедельник по московскому времени.":"Здесь скоро появятся первые шефы. Открой кухню и задай планку!";rows.forEach((r,i)=>{const row=document.createElement("div");row.className="rank-row";const number=document.createElement("span"),name=document.createElement("span"),score=document.createElement("strong");number.className="rank-number";number.textContent=String(i+1).padStart(2,"0");name.textContent=r.alias;score.textContent=r.score+" очков";row.append(number,name,score);$("board-content").append(row)})}catch{$("board-status").textContent="Не удалось загрузить рейтинг. Вернись на кухню и попробуй ещё раз."}}
$("show-rank").onclick=ranking;$("result-rank").onclick=ranking;
$("show-badges").onclick=()=>{screen("board");$("board-title").textContent="Твои маленькие победы";$("board-status").textContent="Группа "+age.replace("-","–")+" лет. Награды сохраняются на этом устройстве после подтверждения результата сервером.";badges($("board-content"),stats())};
$("home").onclick=()=>screen("welcome");
$("open-coloring").onclick=()=>{screen("coloring");window.dispatchEvent(new Event("capito-coloring-open"));};
$("coloring-home").onclick=()=>{window.dispatchEvent(new Event("capito-coloring-close"));screen("welcome");};
const storyParagraphs=["Сначала была лепёшка. Очень давно люди в разных странах пекли лепёшки. Но пицца, похожая на ту, что мы любим сегодня, прославилась в итальянском городе Неаполе. На тесто добавляли томаты, сыр и зелень, а потом отправляли его в горячую дровяную печь.","Три цвета «Маргариты». Красный томат, белая моцарелла и зелёный базилик напоминают флаг Италии. Есть легенда, что в 1889 году такую пиццу подали королеве Маргарите и назвали в её честь. Но пиццу с томатами и моцареллой в Неаполе готовили и раньше!","Мастерство, которое берегут. Мастеров пиццы называют пиццайоло. Они учат друг друга растягивать тесто руками, добавлять начинку и печь пиццу. В 2017 году ЮНЕСКО включила искусство неаполитанских пиццайоло в список нематериального культурного наследия человечества. Теперь и ты попробовал себя в роли маленького пиццайоло!"];
let narration=null,storyPart=0,storyPlaying=false,storyToken=0;
const listen=$("listen-story"),canNarrate="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
function stopStory(){storyToken++;if(canNarrate)window.speechSynthesis.cancel();storyPlaying=false;storyPart=0;if(listen){listen.textContent="Послушать историю";listen.setAttribute("aria-pressed","false");}}
function narratePart(token){
 if(token!==storyToken)return;
 if(storyPart>=storyParagraphs.length){storyPlaying=false;storyPart=0;listen.textContent="Послушать ещё раз";listen.setAttribute("aria-pressed","false");$("story-audio-status").textContent="А теперь ответь на вопрос под историей!";return;}
 narration=friendlyVoice(new SpeechSynthesisUtterance(storyParagraphs[storyPart]),"story");
 narration.onend=()=>{if(token===storyToken){storyPart++;narratePart(token);}};
 narration.onerror=()=>{if(token!==storyToken)return;stopStory();$("story-audio-status").textContent="Не удалось включить голос. Историю можно прочитать ниже.";};
 window.speechSynthesis.speak(narration);
}
listen.disabled=!canNarrate;
if(!canNarrate)$("story-audio-status").textContent="На этом устройстве озвучка недоступна. Историю можно прочитать ниже.";
listen.setAttribute("aria-pressed","false");
listen.onclick=()=>{stopGuestVoice();
 if(!canNarrate)return;
 if(storyPlaying){stopStory();$("story-audio-status").textContent="Озвучка остановлена";return;}
 storyPlaying=true;storyPart=0;listen.textContent="Остановить историю";listen.setAttribute("aria-pressed","true");$("story-audio-status").textContent="Слушаем историю пиццы";storyToken++;narratePart(storyToken);
};
window.addEventListener("pagehide",()=>{stopGuestVoice();stopStory();});
document.querySelectorAll("[data-city]").forEach(b=>b.onclick=()=>{$("story-answer").textContent=b.dataset.city==="naples"?"Верно! Неаполь — город пиццы. Браво, маленький шеф!":"Попробуй ещё раз. Подсказка: название начинается на «Н».";});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)update()});
})();
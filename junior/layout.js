(()=>{"use strict";
const room=document.getElementById("coloring"),wrap=room.querySelector(".coloring-canvas-wrap"),paper=room.querySelector(".coloring-paper"),column=room.querySelector(".coloring-paper-column");
let frame=0;
function fit(){
 frame=0;if(document.body.dataset.screen!=="coloring")return;
 const viewport=window.visualViewport?window.visualViewport.height:window.innerHeight;
 const top=wrap.getBoundingClientRect().top;
 const below=Math.max(0,column.getBoundingClientRect().bottom-wrap.getBoundingClientRect().bottom);
 const width=column.clientWidth-parseFloat(getComputedStyle(paper).paddingLeft)-parseFloat(getComputedStyle(paper).paddingRight)-2;
 const size=Math.floor(Math.max(96,Math.min(width,viewport-top-below-14)));
 const current=parseFloat(room.style.getPropertyValue("--coloring-size"))||0;
 if(Math.abs(current-size)>1){room.style.setProperty("--coloring-size",size+"px");requestAnimationFrame(()=>{if(document.body.dataset.screen==="coloring"){const bottom=column.getBoundingClientRect().bottom;if(bottom>viewport-8){const next=Math.max(96,size-(bottom-viewport+12));room.style.setProperty("--coloring-size",Math.floor(next)+"px");}}});}
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);}
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:["data-screen"]});
new MutationObserver(schedule).observe(document.getElementById("coloring-status"),{childList:true,subtree:true,characterData:true});
const observer=new ResizeObserver(schedule);observer.observe(document.querySelector(".site-header"));observer.observe(room.querySelector(".coloring-tools"));
window.addEventListener("resize",schedule);window.visualViewport?.addEventListener("resize",schedule);
window.addEventListener("load",schedule);document.fonts?.ready.then(schedule);
})();

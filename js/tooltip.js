/* ================================================================
   TOOLTIP — Affichage au survol
   ================================================================ */

function showTooltip(ev,k,dom){
  var tt=document.getElementById("tooltip");
  var r=ranks(dom),sR=r.s[k]||1,zR=r.z[k]||1,nn=keysFiltered.length;
  var syn=synthPhrase(sR,zR);
  var h="<h4>"+D[k].f+" "+D[k].n+"</h4>";
  h+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+nn+'</span></div>';
  h+='<div class="trow"><span>Rang résultat</span><span class="tv">'+zR+'/'+nn+'</span></div>';
  var dp=totalPIB(k);if(dp)h+='<div class="trow"><span>Effort total</span><span class="tv">'+dp.toFixed(1)+'% PIB</span></div>';
  var sv=satV(k);if(sv!=null)h+='<div class="trow"><span>Satisfaction</span><span class="tv">'+sv.toFixed(1)+'/10</span></div>';
  h+='<div class="tsyn '+syn.cls+'">'+syn.txt+'</div>';
  tt.innerHTML=h;tt.style.display="block";moveTT(ev);
}
function moveTT(ev){
  var t=document.getElementById("tooltip");
  var x=ev.clientX+14,y=ev.clientY-10;
  if(x+280>window.innerWidth)x=ev.clientX-290;
  if(y+150>window.innerHeight)y=ev.clientY-150;
  t.style.left=x+"px";t.style.top=y+"px";
}
function hideTT(){document.getElementById("tooltip").style.display="none"}

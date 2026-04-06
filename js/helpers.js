/* ================================================================
   HELPERS — Fonctions utilitaires et calculs
   ================================================================ */

function getDep(k,di){return D[k]&&D[k].d&&D[k].d[di]?D[k].d[di][0]:0}
function getZ(k,di){return D[k]&&D[k].d&&D[k].d[di]?D[k].d[di][1]:0}
function getPIB(k,di){return D[k]&&D[k].d&&D[k].d[di]?D[k].d[di][2]:0}
function avgZ(k){var s=0,w=0;for(var di=0;di<ND;di++){var v=getZ(k,di);if(!isNaN(v)){s+=v*weights[di];w+=weights[di]}}return w?s/w:0}
function totalPIB(k){var s=0;for(var di=0;di<ND;di++){var v=getPIB(k,di);if(!isNaN(v))s+=v}return s}
function satV(k){return SAT&&SAT[k]?SAT[k][PI]:null}
function fv(v){return v!=null&&!isNaN(v)?(Math.abs(v)>=100?Math.round(v).toLocaleString('fr-FR'):v.toFixed(1)):'—'}

function ranks(dom,keyList){
  var kk=keyList||keysFiltered;
  var r={s:{},z:{}};
  if(dom===-3){var byZ=kk.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});byZ.forEach(function(k,i){r.s[k]=i+1});
    var bySat=kk.slice().sort(function(a,b){return(satV(b)||0)-(satV(a)||0)});bySat.forEach(function(k,i){r.z[k]=i+1});return r}
  if(dom===-2){var byP=kk.slice().sort(function(a,b){return totalPIB(b)-totalPIB(a)});byP.forEach(function(k,i){r.s[k]=i+1});
    var byS=kk.slice().sort(function(a,b){return(satV(b)||0)-(satV(a)||0)});byS.forEach(function(k,i){r.z[k]=i+1});return r}
  if(dom===-1){var byP2=kk.slice().sort(function(a,b){return totalPIB(b)-totalPIB(a)});byP2.forEach(function(k,i){r.s[k]=i+1});
    var byZ2=kk.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});byZ2.forEach(function(k,i){r.z[k]=i+1});return r}
  var a=kk.slice().sort(function(x,y){return getPIB(y,dom)-getPIB(x,dom)});
  var b=kk.slice().sort(function(x,y){return getZ(y,dom)-getZ(x,dom)});
  a.forEach(function(k,i){r.s[k]=i+1});b.forEach(function(k,i){r.z[k]=i+1});return r}

function spearman(r,keyList){var kk=keyList||keysFiltered;var n=kk.length;if(n<3)return null;
  var sum=0;kk.forEach(function(k){var d=(r.s[k]||0)-(r.z[k]||0);sum+=d*d});
  return +(1-6*sum/(n*(n*n-1))).toFixed(2)}

function corrLabel(rho,ctx){
  if(rho===null)return{cls:"none",txt:"Non calculable"};
  var a=Math.abs(rho);
  var sign=rho>=0?"positiv":"négativ";
  var prefix=ctx?ctx+' ':''
  var base;
  if(a>=.8) base="très fortement corrélés "+sign+"ement";
  else if(a>=.6) base="fortement corrélés "+sign+"ement";
  else if(a>=.4) base="modérément corrélés "+sign+"ement";
  else if(a>=.2) base="faiblement corrélés "+sign+"ement";
  else return{cls:"none",txt:prefix?prefix+"très faiblement corrélés":"Corrélation très faible / négligeable"};
  var cls;
  if(a>=.4) cls=rho>0?"hi":"lo";
  else cls=rho<0?"lo":"mid";
  var txt=prefix?prefix+base:base.charAt(0).toUpperCase()+base.slice(1);
  return{cls:cls,txt:txt}}

function synthPhrase(sR,zR){
  var d=sR-zR;
  if(d>=4)return{txt:"Dépense peu, s'en sort très bien",cls:"green"};
  if(d>=1)return{txt:"Meilleur résultat que l'effort consenti",cls:"green"};
  if(d<=-4)return{txt:"Dépense beaucoup, résultat décevant",cls:"red"};
  if(d<=-1)return{txt:"Résultat en-deçà de l'effort",cls:"red"};
  return{txt:"Résultat cohérent avec l'effort",cls:"mid"}}

function efficiency(k){
  var pib=totalPIB(k), z=avgZ(k);
  if(!pib || isNaN(z)||pib<=0) return null;
  return z/pib;
}

function formatEff(v){
  return v!=null ? (v*100).toFixed(1)+'% par point de bien-être' : '—';
}

/* ================================================================
   INSIGHTS — Enseignements clés (après la heatmap)
   ================================================================ */

function initInsights(){
  populateInsightChips();

  /* Observer for fade-in */
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:0.15});
  var el=document.getElementById('insightsSection');
  if(el) obs.observe(el);
}

function populateInsightChips(){
  if(!keysFiltered.length) return;

  var nn=keysFiltered.length;
  var rc=ranks(-1); /* composite ranks */

  /* ── Compute composite gap data (same logic as heatmapGap) ── */
  var gapData=keysFiltered.map(function(k){
    var csR=rc.s[k]||nn, czR=rc.z[k]||nn;
    return{k:k, compositeGap:csR-czR};
  });

  /* Sort by composite gap descending (best → worst) */
  gapData.sort(function(a,b){return b.compositeGap-a.compositeGap});

  /* Sort by z-score descending for z-score rank */
  var zSorted=keysFiltered.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});

  function zRank(k){return zSorted.indexOf(k)+1}
  function gapRank(k){
    for(var i=0;i<gapData.length;i++){if(gapData[i].k===k)return i+1}
    return nn;
  }
  function fmtGap(v){return v>0?'+'+v:v<0?''+v:'0'}

  /* ── 🇳🇱 Pays-Bas ── */
  var nlGapVal=gapData.find(function(d){return d.k==='NL'});
  var elNlGap=document.getElementById('insNlGap');
  var elNlZ=document.getElementById('insNlZrank');
  if(elNlGap && nlGapVal) elNlGap.textContent=fmtGap(nlGapVal.compositeGap)+' (1er)';
  if(elNlZ) elNlZ.textContent=zRank('NL')+'e / '+nn;

  /* ── 🇫🇷 France ── */
  var frGapRank=gapRank('FR');
  var elFrGR=document.getElementById('insFrGapRank');
  var elFrZ=document.getElementById('insFrZrank');
  if(elFrGR) elFrGR.textContent=frGapRank+'e / '+nn;
  if(elFrZ) elFrZ.textContent=zRank('FR')+'e / '+nn;

  /* ── 🇬🇷 Grèce ── */
  var grGapVal=gapData.find(function(d){return d.k==='GR'});
  var elGrGap=document.getElementById('insGrGap');
  var elGrZ=document.getElementById('insGrZrank');
  if(elGrGap && grGapVal) elGrGap.textContent=fmtGap(grGapVal.compositeGap)+' ('+gapRank('GR')+'e)';
  if(elGrZ) elGrZ.textContent=zRank('GR')+'e / '+nn;
}

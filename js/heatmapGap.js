/* ================================================================
   HEATMAP GAP — Écart rang effort vs rang bien-être
   Section autonome après "Chaque pays a son profil"
   Two views: "gap" (rank gap) and "zscore" (z-score values)
   ================================================================ */

var activeHgView='gap';

function initHeatmapGap(){
  renderHeatmapGap();

  /* Toggle buttons */
  document.querySelectorAll('#hgViewToggle .hg-vbtn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-hg-view');
      if(view===activeHgView) return;
      activeHgView=view;
      document.querySelectorAll('#hgViewToggle .hg-vbtn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      renderHeatmapGap();
      updateHgChrome();
    });
  });

  /* Observer for fade-in */
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:0.12});
  var el=document.getElementById('heatmapGap');
  if(el) obs.observe(el);
}

/* ── Update note text and legend based on active view ── */
function updateHgChrome(){
  var note=document.getElementById('hgNote');
  var legend=document.getElementById('hgLegend');
  if(activeHgView==='gap'){
    if(note) note.innerHTML='La colonne <strong>Σ&nbsp;écart</strong> additionne les 9&nbsp;écarts domaine par domaine, tandis que le <strong>Composite</strong> compare les rangs globaux agrégés. Si ces deux valeurs divergent pour un pays, c\'est que le tout n\'est pas la somme des parties&nbsp;: des surperformances et sous-performances par domaine peuvent se compenser dans l\'agrégat (voir le paradoxe de Simpson pour les plus curieux).';
    if(legend) legend.innerHTML='<span class="hg-leg-label neg">Sous-performe</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">Surperforme</span>';
  } else {
    if(note) note.innerHTML='Chaque cellule affiche le <strong>z-score</strong> de bien-être du pays pour ce domaine. Un z-score <strong class="hg-pos">positif</strong> indique une performance supérieure à la moyenne EU-14, un z-score <strong class="hg-neg">négatif</strong> indique l\'inverse. La colonne <strong>Composite</strong> est la moyenne pondérée des 9&nbsp;z-scores.';
    if(legend) legend.innerHTML='<span class="hg-leg-label neg">− mauvais</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">+ bon</span>';
  }
}

function renderHeatmapGap(){
  if(activeHgView==='zscore') return renderHeatmapZscore();

  var svg=d3.select('#heatmapGapChart');
  svg.selectAll('*').remove();

  /* ── Debug logs ── */
  console.log('[HeatmapGap] renderHeatmapGap() called, activeHgView='+activeHgView);
  console.log('[HeatmapGap] keysFiltered.length='+keysFiltered.length);
  console.log('[HeatmapGap] ND='+ND);

  var nn=keysFiltered.length;
  /* 9 domaines + colonne Σ + colonne Composite = 11 colonnes logiques */
  var EXTRA_COLS=2;  /* Σ écart + Composite */
  var W=960, ml=130, mr=0, mt=28, mb=24;
  var cw=(W-ml)/(ND+EXTRA_COLS);  /* toutes les colonnes même largeur */
  var totalSumX=ND*cw;             /* début col Σ */
  var compositeX=(ND+1)*cw;        /* début col Composite */
  var CORR_GAP=14;
  var CORR_ROW_H=28;
  var ch=Math.min(42,(580-mt-mb-CORR_GAP-CORR_ROW_H)/nn);
  var H=mt+nn*ch+CORR_GAP+CORR_ROW_H+mb;
  svg.attr('viewBox','0 0 '+W+' '+H);

  /* Rangs composites (effort global vs bien-être global) */
  var rc=ranks(-1);

  /* ── Calculer l'écart total par pays (somme des écarts sur 9 domaines) ── */
  var gapData=keysFiltered.map(function(k){
    var totalGap=0;
    for(var di=0;di<ND;di++){
      var rd=ranks(di);
      var sR=rd.s[k]||nn, zR=rd.z[k]||nn;
      totalGap+=(sR-zR);
    }
    var csR=rc.s[k]||nn, czR=rc.z[k]||nn;
    return{k:k,totalGap:totalGap,compositeGap:csR-czR};
  });

  /* Tri : par écart composite décroissant (surperformant → sous-performant) */
  gapData.sort(function(a,b){return b.compositeGap-a.compositeGap});
  var sorted=gapData.map(function(d){return d.k});

  /* ── Trouver l'écart max pour l'échelle de couleur ── */
  var maxGap=0;
  sorted.forEach(function(k){
    for(var di=0;di<ND;di++){
      var rd=ranks(di);
      var gap=Math.abs((rd.s[k]||nn)-(rd.z[k]||nn));
      if(gap>maxGap) maxGap=gap;
    }
  });
  if(maxGap===0) maxGap=1;

  /* ── Couleur selon l'écart ── */
  function gapColor(gap){
    if(gap===0) return'rgba(255,255,255,.10)';
    var t=Math.max(-1,Math.min(1,gap/maxGap));
    /* Neutral mid-point = visible dark blue-grey (50,55,80) */
    var midR=50, midG=55, midB=80;
    if(t>0){
      var s=t;
      return'rgb('+Math.round(midR+(52-midR)*s)+','+Math.round(midG+(211-midG)*s)+','+Math.round(midB+(153-midB)*s)+')';
    }else{
      var s2=-t;
      return'rgb('+Math.round(midR+(248-midR)*s2)+','+Math.round(midG+(113-midG)*s2)+','+Math.round(midB+(113-midB)*s2)+')';
    }
  }

  /* ── En-têtes colonnes en HTML (évite le clipping SVG) ── */
  var wrap=document.getElementById('heatmapGapChart').parentNode;
  var oldHdr=wrap.querySelector('.hg-col-headers');
  if(oldHdr) oldHdr.remove();

  /* Toutes les colonnes ont la même largeur en % */
  var totalCols=ND+EXTRA_COLS;
  var colPct=(100/(totalCols)).toFixed(3);
  var totalW=W-ml;

  var hdrRow=document.createElement('div');
  hdrRow.className='hg-col-headers hg-el';
  hdrRow.style.cssText='display:flex;margin-left:'+((ml/W)*100).toFixed(2)+'%;width:'+((totalW/W)*100).toFixed(2)+'%;margin-bottom:2px;';

  var shortDoms=['Santé','Revenus','Travail','Logement','Savoirs','Civisme','Social','Sécurité','Environ.'];
  var fullDoms=DOM_LABELS.slice();
  for(var di=0;di<ND;di++){
    var span=document.createElement('span');
    span.className='hg-col-label';
    span.textContent=shortDoms[di];
    span.title=fullDoms[di];
    span.style.width=colPct+'%';
    span.style.flex='none';
    hdrRow.appendChild(span);
  }
  /* Colonne Σ écart */
  var spanT=document.createElement('span');
  spanT.className='hg-col-label';
  spanT.textContent='Σ écart';
  spanT.title='Somme des écarts';
  spanT.style.fontWeight='600';
  spanT.style.width=colPct+'%';
  spanT.style.flex='none';
  hdrRow.appendChild(spanT);
  /* Colonne Composite */
  var spanC=document.createElement('span');
  spanC.className='hg-col-label';
  spanC.innerHTML='Composite <span class="composite-info-icon composite-info-icon--inline" title="L\'indicateur composite somme uniformément les 9 domaines. Il est hautement corrélé positivement à la satisfaction à l\'égard de la vie (ρ = 0,93 Spearman ; r = 0,88 Pearson).">ⓘ</span>';
  spanC.title='';
  spanC.style.fontWeight='600';
  spanC.style.width=colPct+'%';
  spanC.style.flex='none';
  hdrRow.appendChild(spanC);

  wrap.insertBefore(hdrRow,document.getElementById('heatmapGapChart'));

  var g=svg.append('g').attr('transform','translate('+ml+','+mt+')');

  /* ── Lignes pays ── */
  sorted.forEach(function(k,ri){
    var rowGapObj=gapData.find(function(d){return d.k===k});
    var rowGap=rowGapObj?rowGapObj.totalGap:0;

    /* Rang du pays */
    g.append('text').attr('x',-ml+4).attr('y',ri*ch+ch/2+3.5)
      .attr('fill','var(--muted)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
      .text((ri+1)+'e');

    /* Nom du pays à gauche */
    g.append('text').attr('x',-6).attr('y',ri*ch+ch/2+3.5)
      .attr('text-anchor','end')
      .attr('fill',isHero(k)?'var(--text)':'var(--sub)')
      .attr('font-size','9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('font-weight',isHero(k)?'600':'400')
      .text(D[k].f+' '+D[k].n);

    /* Cellules par domaine */
    for(var di2=0;di2<ND;di2++){
      (function(di){
        var rd=ranks(di);
        var sR=rd.s[k]||nn, zR=rd.z[k]||nn;
        var gap=sR-zR;

        g.append('rect').attr('class','hg-cell')
          .attr('x',di*cw+1).attr('y',ri*ch+1)
          .attr('width',cw-2).attr('height',ch-2)
          .attr('rx',3).attr('fill',gapColor(gap)).attr('opacity',.85)
          .style('cursor','pointer')
          .on('mouseover',function(ev){
            var synth=synthPhrase(sR,zR);
            var h='<h4>'+D[k].f+' '+D[k].n+' — '+DOM_LABELS[di]+'</h4>';
            h+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+nn+'</span></div>';
            h+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+zR+'/'+nn+'</span></div>';
            h+='<hr class="tsep">';
            h+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+(gap>0?'var(--green)':gap<0?'var(--red)':'var(--sub)')+'">'+(gap>0?'+':'')+gap+'</span></div>';
            h+='<div class="tsyn '+synth.cls+'">'+synth.txt+'</div>';
            document.getElementById('tooltip').innerHTML=h;
            document.getElementById('tooltip').style.display='block';
            moveTT(ev);
          })
          .on('mousemove',moveTT).on('mouseout',hideTT)
          .on('click',function(){showPopup(k)});

        g.append('text')
          .attr('x',di*cw+5).attr('y',ri*ch+10)
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .text(sR);

        g.append('text')
          .attr('x',di*cw+cw-5).attr('y',ri*ch+10)
          .attr('text-anchor','end')
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .text(zR);

        var gapTxt=gap===0?'0':(gap>0?'+'+gap:''+gap);
        g.append('text')
          .attr('x',di*cw+cw/2).attr('y',ri*ch+ch/2+5)
          .attr('text-anchor','middle')
          .attr('font-size','11px').attr('font-weight','700')
          .attr('fill',Math.abs(gap)>=2?'rgba(0,0,0,.75)':'rgba(255,255,255,.55)')
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .text(gapTxt);
      })(di2);
    }

    /* ── Colonne Σ écart ── */
    var totalCol=rowGap>0?'var(--green)':rowGap<0?'var(--red)':'var(--sub)';
    var totalTxt=(rowGap>0?'+':'')+rowGap;

    g.append('text')
      .attr('x',totalSumX+cw/2).attr('y',ri*ch+ch/2+4)
      .attr('text-anchor','middle')
      .attr('font-size','11px').attr('font-weight','700')
      .attr('fill',totalCol)
      .attr('font-family','DM Sans,sans-serif')
      .text(totalTxt);

    /* ── Colonne Composite ── */
    (function(k,ri){
      var csR=rc.s[k]||nn, czR=rc.z[k]||nn;
      var cGap=csR-czR;

      g.append('rect').attr('class','hg-cell')
        .attr('x',compositeX+1).attr('y',ri*ch+1)
        .attr('width',cw-2).attr('height',ch-2)
        .attr('rx',3).attr('fill',gapColor(cGap)).attr('opacity',.85)
        .style('cursor','pointer')
        .on('mouseover',function(ev){
          var synth=synthPhrase(csR,czR);
          var h='<h4>'+D[k].f+' '+D[k].n+' — Composite</h4>';
          h+='<div class="trow"><span>Rang effort (% PIB)</span><span class="tv">'+csR+'/'+nn+'</span></div>';
          h+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+czR+'/'+nn+'</span></div>';
          h+='<hr class="tsep">';
          h+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+(cGap>0?'var(--green)':cGap<0?'var(--red)':'var(--sub)')+'">'+(cGap>0?'+':'')+cGap+'</span></div>';
          h+='<div class="tsyn '+synth.cls+'">'+synth.txt+'</div>';
          document.getElementById('tooltip').innerHTML=h;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        })
        .on('mousemove',moveTT).on('mouseout',hideTT)
        .on('click',function(){showPopup(k)});

      g.append('text')
        .attr('x',compositeX+5).attr('y',ri*ch+10)
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none')
        .text(csR);

      g.append('text')
        .attr('x',compositeX+cw-5).attr('y',ri*ch+10)
        .attr('text-anchor','end')
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none')
        .text(czR);

      var cGapTxt=cGap===0?'0':(cGap>0?'+'+cGap:''+cGap);
      g.append('text')
        .attr('x',compositeX+cw/2).attr('y',ri*ch+ch/2+5)
        .attr('text-anchor','middle')
        .attr('font-size','11px').attr('font-weight','700')
        .attr('fill',Math.abs(cGap)>=2?'rgba(0,0,0,.75)':'rgba(255,255,255,.55)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none')
        .text(cGapTxt);
    })(k,ri);
  });

  /* ── Séparateurs verticaux ── */
  g.append('line')
    .attr('x1',totalSumX).attr('x2',totalSumX)
    .attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.12)').attr('stroke-width',1);
  g.append('line')
    .attr('x1',compositeX).attr('x2',compositeX)
    .attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-width',1).attr('stroke-dasharray','3,3');

  /* ── CORRELATION ROW (ρ Spearman per domain — gap view) ── */
  var corrY=nn*ch+CORR_GAP;
  g.append('line').attr('x1',-ml).attr('x2',W-ml).attr('y1',corrY-4).attr('y2',corrY-4)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','2,2');
  g.append('text').attr('x',-6).attr('y',corrY+CORR_ROW_H/2+3.5)
    .attr('text-anchor','end').attr('font-size','8px').attr('fill','var(--gold)')
    .attr('font-weight','600').attr('font-family','DM Sans,sans-serif').text('ρ Spearman');

  for(var cdi=0;cdi<ND;cdi++){
    (function(di){
      var rd2=ranks(di);
      var rho=spearman(rd2);
      var cl=corrLabel(rho);
      g.append('text').attr('x',di*cw+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
        .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
        .attr('fill',corrClsColor(cl.cls)).attr('font-family','DM Sans,sans-serif')
        .text(rho!==null?rho.toFixed(2):'—');
    })(cdi);
  }
  /* Composite ρ */
  var rcCorr=ranks(-1);
  var rhoComp=spearman(rcCorr);
  var clComp=corrLabel(rhoComp);
  g.append('text').attr('x',compositeX+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
    .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
    .attr('fill',corrClsColor(clComp.cls)).attr('font-family','DM Sans,sans-serif')
    .text(rhoComp!==null?rhoComp.toFixed(2):'—');

  /* ── Petite légende de lecture des cellules ── */
  var legX=0, legY=-16;
  g.append('text').attr('x',legX).attr('y',legY)
    .attr('fill','rgba(255,255,255,.3)').attr('font-size','7px')
    .attr('font-family','DM Sans,sans-serif')
    .text('Cellule :  ↖ rang effort · écart au centre · rang bien-être ↗');
}

/* ══════════════════════════════════════════════════
   HEATMAP Z-SCORE VIEW
   ══════════════════════════════════════════════════ */
function renderHeatmapZscore(){
  var svg=d3.select('#heatmapGapChart');
  svg.selectAll('*').remove();

  var nn=keysFiltered.length;
  var EXTRA_COLS=1;  /* only Composite column */
  var GAP_PX=10;     /* visual gap before Composite column */
  var W=960, ml=130, mr=0, mt=28, mb=24;
  var cw=(W-ml-GAP_PX)/(ND+EXTRA_COLS);
  var compositeX=ND*cw+GAP_PX;
  var CORR_GAP=14;
  var CORR_ROW_H=28;
  var ch=Math.min(42,(580-mt-mb-CORR_GAP-CORR_ROW_H)/nn);
  var H=mt+nn*ch+CORR_GAP+CORR_ROW_H+mb;
  svg.attr('viewBox','0 0 '+W+' '+H);

  /* Sort by composite z-score descending */
  var sorted=keysFiltered.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});

  /* Find max abs z for color scale */
  var allZ=[];
  sorted.forEach(function(k){
    for(var di=0;di<ND;di++){var z=getZ(k,di);if(!isNaN(z))allZ.push(z);}
    allZ.push(avgZ(k));
  });
  var zMax=Math.max(Math.abs(d3.min(allZ)||0),Math.abs(d3.max(allZ)||0),0.1);

  function zColor(z){
    if(isNaN(z)||z==null)return'rgba(255,255,255,.06)';
    /* t: 0 (worst) → 0.5 (neutral) → 1 (best) */
    var t=Math.max(0,Math.min(1,(z/zMax+1)/2));
    /* Neutral mid-point = visible dark blue-grey (55,60,90) instead of near-black */
    var midR=55, midG=60, midB=90;
    if(t<0.5){
      var s=t*2; /* 0→1 from red to mid */
      return'rgb('+Math.round(200+(midR-200)*s)+','+Math.round(80+(midG-80)*s)+','+Math.round(80+(midB-80)*s)+')';
    }else{
      var s2=(t-0.5)*2; /* 0→1 from mid to green */
      return'rgb('+Math.round(midR+(52-midR)*s2)+','+Math.round(midG+(200-midG)*s2)+','+Math.round(midB+(140-midB)*s2)+')';
    }
  }

  /* ── Column headers ── */
  var wrap=document.getElementById('heatmapGapChart').parentNode;
  var oldHdr=wrap.querySelector('.hg-col-headers');
  if(oldHdr) oldHdr.remove();

  var totalCols=ND+EXTRA_COLS;
  var colPct=(100/totalCols).toFixed(3);
  var totalW=W-ml;

  var hdrRow=document.createElement('div');
  hdrRow.className='hg-col-headers hg-el';
  hdrRow.style.cssText='display:flex;margin-left:'+((ml/W)*100).toFixed(2)+'%;width:'+((totalW/W)*100).toFixed(2)+'%;margin-bottom:2px;';

  var shortDoms=['Santé','Revenus','Travail','Logement','Savoirs','Civisme','Social','Sécurité','Environ.'];
  for(var di=0;di<ND;di++){
    var span=document.createElement('span');
    span.className='hg-col-label';
    span.textContent=shortDoms[di];
    span.title=DOM_LABELS[di];
    span.style.width=colPct+'%';
    span.style.flex='none';
    hdrRow.appendChild(span);
  }
  var spanC=document.createElement('span');
  spanC.className='hg-col-label';
  spanC.innerHTML='Composite <span class="composite-info-icon composite-info-icon--inline" title="L\'indicateur composite somme uniformément les 9 domaines. Il est hautement corrélé positivement à la satisfaction à l\'égard de la vie (ρ = 0,93 Spearman ; r = 0,88 Pearson).">ⓘ</span>';
  spanC.title='';
  spanC.style.fontWeight='600';
  spanC.style.width=colPct+'%';
  spanC.style.flex='none';
  spanC.style.marginLeft=((GAP_PX/totalW)*100).toFixed(2)+'%';
  hdrRow.appendChild(spanC);

  wrap.insertBefore(hdrRow,document.getElementById('heatmapGapChart'));

  var g=svg.append('g').attr('transform','translate('+ml+','+mt+')');

  sorted.forEach(function(k,ri){
    /* Rank label */
    g.append('text').attr('x',-ml+4).attr('y',ri*ch+ch/2+3.5)
      .attr('fill','var(--muted)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
      .text((ri+1)+'e');

    /* Country name */
    g.append('text').attr('x',-6).attr('y',ri*ch+ch/2+3.5)
      .attr('text-anchor','end')
      .attr('fill',isHero(k)?'var(--text)':'var(--sub)')
      .attr('font-size','9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('font-weight',isHero(k)?'600':'400')
      .text(D[k].f+' '+D[k].n);

    /* Domain cells */
    for(var di2=0;di2<ND;di2++){
      (function(di){
        var z=getZ(k,di);
        var rd=ranks(di);
        var sR=rd.s[k]||nn, zR=rd.z[k]||nn;

        g.append('rect').attr('class','hg-cell')
          .attr('x',di*cw+1).attr('y',ri*ch+1)
          .attr('width',cw-2).attr('height',ch-2)
          .attr('rx',3).attr('fill',zColor(z)).attr('opacity',.9)
          .style('cursor','pointer')
          .on('mouseover',function(ev){
            var h='<h4>'+D[k].f+' '+D[k].n+' — '+DOM_LABELS[di]+'</h4>';
            h+='<div class="trow"><span>Z-score</span><span class="tv">'+(isNaN(z)?'—':z>0?'+'+z.toFixed(2):z.toFixed(2))+'</span></div>';
            h+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+nn+'</span></div>';
            h+='<div class="trow"><span>Rang résultat</span><span class="tv">'+zR+'/'+nn+'</span></div>';
            document.getElementById('tooltip').innerHTML=h;
            document.getElementById('tooltip').style.display='block';
            moveTT(ev);
          }).on('mousemove',moveTT).on('mouseout',hideTT)
          .on('click',function(){showPopup(k)});

        /* Rank labels: effort top-left, well-being top-right */
        g.append('text')
          .attr('x',di*cw+5).attr('y',ri*ch+10)
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .text(sR);

        g.append('text')
          .attr('x',di*cw+cw-5).attr('y',ri*ch+10)
          .attr('text-anchor','end')
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .text(zR);

        /* Z-score text — always white for readability on dark bg */
        if(ch>=15){
          g.append('text').attr('x',di*cw+cw/2).attr('y',ri*ch+ch/2+4)
            .attr('text-anchor','middle').attr('pointer-events','none')
            .attr('fill',Math.abs(z||0)>0.6?'rgba(255,255,255,.95)':'rgba(255,255,255,.6)')
            .attr('font-size','9px').attr('font-weight','600')
            .attr('font-family','DM Sans,sans-serif')
            .text(isNaN(z)||z==null?'':z>0?'+'+z.toFixed(1):z.toFixed(1));
        }
      })(di2);
    }

    /* ── Composite column ── */
    (function(k,ri){
      var cz=avgZ(k);

      g.append('rect').attr('class','hg-cell')
        .attr('x',compositeX+1).attr('y',ri*ch+1)
        .attr('width',cw-2).attr('height',ch-2)
        .attr('rx',3).attr('fill',zColor(cz)).attr('opacity',.9)
        .style('cursor','pointer')
        .on('mouseover',function(ev){
          var h='<h4>'+D[k].f+' '+D[k].n+' — Composite</h4>';
          h+='<div class="trow"><span>Z-score composite</span><span class="tv">'+(cz>0?'+':'')+cz.toFixed(2)+'</span></div>';
          var rc=ranks(-1);
          h+='<div class="trow"><span>Rang effort</span><span class="tv">'+(rc.s[k]||nn)+'/'+nn+'</span></div>';
          h+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+(rc.z[k]||nn)+'/'+nn+'</span></div>';
          document.getElementById('tooltip').innerHTML=h;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        }).on('mousemove',moveTT).on('mouseout',hideTT)
        .on('click',function(){showPopup(k)});

      /* Rank labels: effort top-left, well-being top-right */
      var rcComp=ranks(-1);
      var csR=rcComp.s[k]||nn, czR=rcComp.z[k]||nn;

      g.append('text')
        .attr('x',compositeX+5).attr('y',ri*ch+10)
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none')
        .text(csR);

      g.append('text')
        .attr('x',compositeX+cw-5).attr('y',ri*ch+10)
        .attr('text-anchor','end')
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none')
        .text(czR);

      g.append('text').attr('x',compositeX+cw/2).attr('y',ri*ch+ch/2+4)
        .attr('text-anchor','middle').attr('pointer-events','none')
        .attr('fill',Math.abs(cz)>0.4?'rgba(255,255,255,.95)':'rgba(255,255,255,.6)')
        .attr('font-size','9px').attr('font-weight','700')
        .attr('font-family','DM Sans,sans-serif')
        .text(cz>0?'+'+cz.toFixed(1):cz.toFixed(1));
    })(k,ri);
  });

  /* ── Separator before composite ── */
  g.append('line')
    .attr('x1',compositeX).attr('x2',compositeX)
    .attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.12)').attr('stroke-width',1);

  /* ── CORRELATION ROW (r Pearson per domain — zscore view) ── */
  var corrY=nn*ch+CORR_GAP;
  g.append('line').attr('x1',-ml).attr('x2',W-ml).attr('y1',corrY-4).attr('y2',corrY-4)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','2,2');
  g.append('text').attr('x',-6).attr('y',corrY+CORR_ROW_H/2+3.5)
    .attr('text-anchor','end').attr('font-size','8px').attr('fill','var(--blue)')
    .attr('font-weight','600').attr('font-family','DM Sans,sans-serif').text('r Pearson');

  for(var cdi=0;cdi<ND;cdi++){
    (function(di){
      var pts=keysFiltered.map(function(k){
        return{x:getPIB(k,di),y:getZ(k,di)};
      }).filter(function(d){return d.x>0&&!isNaN(d.y)});
      var pR=pearsonR(pts);
      var pLbl=pearsonLabel(pR);
      g.append('text').attr('x',di*cw+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
        .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
        .attr('fill',corrClsColor(pLbl.cls)).attr('font-family','DM Sans,sans-serif')
        .text(pR!==null?pR.toFixed(2):'—');
    })(cdi);
  }
  /* Composite r */
  var ptsComp=keysFiltered.map(function(k){return{x:totalPIB(k),y:avgZ(k)};}).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pRComp=pearsonR(ptsComp);
  var pLblComp=pearsonLabel(pRComp);
  g.append('text').attr('x',compositeX+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
    .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
    .attr('fill',corrClsColor(pLblComp.cls)).attr('font-family','DM Sans,sans-serif')
    .text(pRComp!==null?pRComp.toFixed(2):'—');

  /* ── Reading legend ── */
  g.append('text').attr('x',0).attr('y',-16)
    .attr('fill','rgba(255,255,255,.3)').attr('font-size','7px')
    .attr('font-family','DM Sans,sans-serif')
    .text('Cellule :  ↖ rang effort · z-score au centre · rang bien-être ↗');
}

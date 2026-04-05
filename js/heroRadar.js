/* ================================================================
   HERO RADAR — Spider chart 1 pays + panneau composite + mini slope
   + Vue générale (heatmap intégrée) + Popup domaine enrichie
   ================================================================ */

var heroRadarSvg, heroRadarG;
var HRADAR_W=580, HRADAR_H=450, HRADAR_CX=290, HRADAR_CY=210, HRADAR_R=150;
var activeHeroView='profil';
var activeHeroHgView='gap';
var heroHeatmapRendered=false;

/* Country color palette (kept for popup compat) */
var COUNTRY_COLORS={
  'AT':'#f59e0b','BE':'#8b5cf6','DE':'#60a5fa','EE':'#34d399',
  'ES':'#f87171','FI':'#06b6d4','FR':'#e8a838','GR':'#fb923c',
  'IT':'#a78bfa','LT':'#14b8a6','LV':'#f472b6','NL':'#22d3ee',
  'PT':'#fbbf24','SK':'#818cf8','SI':'#4ade80','CY':'#e879f9'
};
function countryColor(k){return COUNTRY_COLORS[k]||'#9ca3bf'}

function initHeroRadar(){
  var container=document.getElementById('heroRadarChart');
  if(!container||!keysFiltered.length) return;

  /* ── Populate dropdown ── */
  var sel=document.getElementById('heroRadarSel');
  if(!sel) return;
  var sorted=keysFiltered.slice().sort(function(a,b){return D[a].n.localeCompare(D[b].n)});
  sorted.forEach(function(k){
    var opt=document.createElement('option');
    opt.value=k; opt.textContent=D[k].f+' '+D[k].n;
    if(k==='FR') opt.selected=true;
    sel.appendChild(opt);
  });

  /* ── Init SVG ── */
  heroRadarSvg=d3.select('#heroRadarChart')
    .append('svg')
    .attr('viewBox','0 0 '+HRADAR_W+' '+HRADAR_H)
    .attr('preserveAspectRatio','xMidYMid meet')
    .style('width','100%')
    .style('max-width',HRADAR_W+'px');

  heroRadarG=heroRadarSvg.append('g')
    .attr('transform','translate('+HRADAR_CX+','+HRADAR_CY+')');

  drawHeroRadarGrid();
  updateHeroRadar();

  sel.addEventListener('change', function(){
    updateHeroRadar();
    if(activeHeroView==='overview') renderHeroHeatmap();
  });

  /* ── Init Hero Tabs ── */
  initHeroTabs();

  /* ── Init Hero Heatmap Toggle ── */
  initHeroHgToggle();
}

/* ══════════════════════════════════════════════════
   HERO TABS — Profil pays / Vue générale
   ══════════════════════════════════════════════════ */
function initHeroTabs(){
  document.querySelectorAll('.hero-tab').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-hero-view');
      if(view===activeHeroView) return;
      activeHeroView=view;
      document.querySelectorAll('.hero-tab').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      document.querySelectorAll('.hero-view-panel').forEach(function(p){p.classList.remove('active')});
      document.querySelector('.hero-view-'+view).classList.add('active');
      /* 1) Hide/show sidebar depending on view */
      var sidebar=document.querySelector('.hero-sidebar');
      if(sidebar){
        sidebar.style.display=(view==='overview')?'none':'';
      }
      if(view==='overview') renderHeroHeatmap();
    });
  });
}

function initHeroHgToggle(){
  document.querySelectorAll('#heroHgViewToggle .hg-vbtn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-hero-hg-view');
      if(view===activeHeroHgView) return;
      activeHeroHgView=view;
      document.querySelectorAll('#heroHgViewToggle .hg-vbtn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      renderHeroHeatmap();
      updateHeroHgLegend();
    });
  });
}

function updateHeroHgLegend(){
  var legend=document.getElementById('heroHgLegend');
  if(!legend) return;
  if(activeHeroHgView==='gap'){
    legend.innerHTML='<span class="hg-leg-label neg">Sous-performe</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">Surperforme</span>';
  } else {
    legend.innerHTML='<span class="hg-leg-label neg">− mauvais</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">+ bon</span>';
  }
}

/* ── Master update — called on init and on country change ── */
function updateHeroRadar(){
  var sel=document.getElementById('heroRadarSel');
  if(!sel) return;
  var k=sel.value;
  drawHeroRadarData(k);
  updateHeroCompositePanel(k);
  drawHeroSlopeChart(k);
}

/* ══════════════════════════════════════════════════
   GRID — concentric rings, axes, clickable labels
   ══════════════════════════════════════════════════ */
function drawHeroRadarGrid(){
  var nn=keysFiltered.length;
  var gridG=heroRadarG.append('g').attr('class','hradar-grid');

  /* Concentric polygons */
  [0.25,0.5,0.75,1].forEach(function(rf){
    var pts=[];
    for(var i=0;i<ND;i++){
      var a=(i/ND)*Math.PI*2-Math.PI/2;
      pts.push(Math.cos(a)*HRADAR_R*rf+','+Math.sin(a)*HRADAR_R*rf);
    }
    gridG.append('polygon')
      .attr('points',pts.join(' '))
      .attr('fill','none')
      .attr('stroke','rgba(255,255,255,'+(rf===1?.1:.04)+')')
      .attr('stroke-width',1);
  });

  /* Median ring (dashed) */
  var medPts=[];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    medPts.push(Math.cos(a)*HRADAR_R*0.5+','+Math.sin(a)*HRADAR_R*0.5);
  }
  gridG.append('polygon')
    .attr('points',medPts.join(' '))
    .attr('fill','none')
    .attr('stroke','rgba(255,255,255,.08)')
    .attr('stroke-width',1)
    .attr('stroke-dasharray','3,3');

  /* Axes + clickable labels (with emojis) */
  var shortLbls=['🏥 Santé','💰 Revenus &\npatrimoine','💼 Travail &\nemploi','🏠 Logement','🎓 Savoirs &\ncompétences','🗳️ Engagement\ncivique','🤝 Liens\nsociaux','🛡️ Sécurité','🌿 Qualité\nenvironnem.'];

  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var x2=Math.cos(a)*HRADAR_R, y2=Math.sin(a)*HRADAR_R;

    gridG.append('line')
      .attr('x1',0).attr('y1',0).attr('x2',x2).attr('y2',y2)
      .attr('stroke','rgba(255,255,255,.06)').attr('stroke-width',1);

    (function(domIdx){
      var xl=Math.cos(a)*(HRADAR_R+48), yl=Math.sin(a)*(HRADAR_R+48);
      var anch=Math.cos(a)>0.25?'start':Math.cos(a)<-0.25?'end':'middle';
      var lines=shortLbls[domIdx].split('\n');

      var labelG=gridG.append('g')
        .style('cursor','pointer')
        .on('click',function(){openHeroDomainPopup(domIdx)});

      labelG.append('circle')
        .attr('cx',xl).attr('cy',yl).attr('r',36)
        .attr('fill','transparent');

      var txt=labelG.append('text')
        .attr('x',xl).attr('y',yl)
        .attr('text-anchor',anch)
        .attr('font-size','12.5')
        .attr('fill','rgba(210,216,235,.92)')
        .attr('font-family','DM Sans,sans-serif')
        .attr('font-weight','500')
        .attr('class','hradar-label');

      lines.forEach(function(line,li){
        txt.append('tspan')
          .attr('x',xl)
          .attr('dy',li===0?'0.3em':'1.18em')
          .text(line);
      });

      labelG.on('mouseover',function(){
        d3.select(this).select('text').attr('fill','var(--gold)').attr('font-weight','600');
      }).on('mouseout',function(){
        d3.select(this).select('text').attr('fill','rgba(210,216,235,.92)').attr('font-weight','500');
      });
    })(i);
  }

  /* Rank hints on concentric rings */
  gridG.append('text').attr('x',6).attr('y',-HRADAR_R-6)
    .attr('text-anchor','middle').attr('font-size','9.5')
    .attr('fill','rgba(210,216,235,.55)').attr('font-weight','500')
    .attr('font-family','DM Sans,sans-serif')
    .text('1er');
  gridG.append('text').attr('x',6).attr('y',-HRADAR_R*0.75+4)
    .attr('text-anchor','middle').attr('font-size','8')
    .attr('fill','rgba(156,163,191,.3)').attr('font-family','DM Sans,sans-serif')
    .text(Math.round(nn*0.25)+'e');
  gridG.append('text').attr('x',6).attr('y',-HRADAR_R*0.5+4)
    .attr('text-anchor','middle').attr('font-size','8')
    .attr('fill','rgba(156,163,191,.3)').attr('font-family','DM Sans,sans-serif')
    .text(Math.round(nn*0.5)+'e');
  gridG.append('text').attr('x',6).attr('y',-HRADAR_R*0.25+4)
    .attr('text-anchor','middle').attr('font-size','8')
    .attr('fill','rgba(156,163,191,.3)').attr('font-family','DM Sans,sans-serif')
    .text(Math.round(nn*0.75)+'e');
  gridG.append('text').attr('x',6).attr('y',8)
    .attr('text-anchor','middle').attr('font-size','9')
    .attr('fill','rgba(156,163,191,.35)').attr('font-family','DM Sans,sans-serif')
    .text(nn+'e');
}

/* ══════════════════════════════════════════════════
   DATA — Draw ONE country: effort (dashed) + bien-être (solid)
   ══════════════════════════════════════════════════ */
function drawHeroRadarData(k){
  heroRadarG.selectAll('.hradar-data').remove();
  var dataG=heroRadarG.append('g').attr('class','hradar-data');
  var nn=keysFiltered.length;

  if(!k||!D[k]) return;

  function rankToR(rank){
    return HRADAR_R * Math.max(0.06, 1-(rank-1)/(nn-1));
  }
  function angleFor(i){return (i/ND)*Math.PI*2-Math.PI/2;}
  function rankOrd(r){return r===1?'1er':r+'e'}

  function drawPoly(getRank, color, fillAlpha, dashed, strokeW, dotR, delay, showRankLabels){
    var pts=[];
    for(var i=0;i<ND;i++){
      var a=angleFor(i);
      var rd=ranks(i);
      var rank=getRank(rd,k);
      var r=rankToR(rank);
      pts.push({x:Math.cos(a)*r, y:Math.sin(a)*r, rank:rank, di:i, angle:a});
    }

    var polyStr=pts.map(function(p){return p.x+','+p.y}).join(' ');
    var fillCol=color;
    if(color.indexOf('#')===0){
      var rr=parseInt(color.slice(1,3),16), gg=parseInt(color.slice(3,5),16), bb=parseInt(color.slice(5,7),16);
      fillCol='rgba('+rr+','+gg+','+bb+','+fillAlpha+')';
    }

    dataG.append('polygon')
      .attr('points',polyStr)
      .attr('fill',fillCol)
      .attr('stroke',color)
      .attr('stroke-width',strokeW)
      .attr('stroke-linejoin','round')
      .attr('stroke-dasharray',dashed?'6,3':'none')
      .attr('opacity',0)
      .transition().duration(550).delay(delay)
      .attr('opacity',1);

    pts.forEach(function(p){
      dataG.append('circle')
        .attr('cx',p.x).attr('cy',p.y).attr('r',12)
        .attr('fill','transparent').attr('stroke','none')
        .style('cursor','default')
        .on('mouseover',function(ev){
          var rd2=ranks(p.di);
          var sR=rd2.s[k]||nn, zR=rd2.z[k]||nn;
          var diff=sR-zR;
          var diffTxt=diff>0?'<span style="color:var(--green)">+'+diff+'</span>':diff<0?'<span style="color:var(--red)">'+diff+'</span>':'0';
          var hh='<h4>'+D[k].f+' '+D[k].n+' — '+DOM_LABELS[p.di]+'</h4>';
          hh+='<div class="trow"><span>Rang effort</span><span class="tv">'+rankOrd(sR)+' / '+nn+'</span></div>';
          hh+='<div class="trow"><span>Rang résultat</span><span class="tv">'+rankOrd(zR)+' / '+nn+'</span></div>';
          hh+='<hr class="tsep">';
          hh+='<div class="trow"><span>Écart</span><span class="tv">'+diffTxt+'</span></div>';
          document.getElementById('tooltip').innerHTML=hh;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        })
        .on('mousemove',moveTT)
        .on('mouseout',hideTT);

      dataG.append('circle')
        .attr('cx',p.x).attr('cy',p.y).attr('r',dotR)
        .attr('fill',color).attr('pointer-events','none')
        .attr('opacity',0)
        .transition().duration(400).delay(delay+120)
        .attr('opacity',1);

      if(showRankLabels){
        var nudge=14;
        var lx=p.x+Math.cos(p.angle)*nudge;
        var ly=p.y+Math.sin(p.angle)*nudge;
        dataG.append('text')
          .attr('x',lx).attr('y',ly)
          .attr('text-anchor','middle')
          .attr('dominant-baseline','central')
          .attr('font-size','9.5')
          .attr('font-weight','700')
          .attr('fill',color)
          .attr('font-family','DM Sans,sans-serif')
          .attr('pointer-events','none')
          .attr('class','hradar-rank-badge')
          .text(rankOrd(p.rank))
          .attr('opacity',0)
          .transition().duration(400).delay(delay+200)
          .attr('opacity',1);
      }
    });
  }

  drawPoly(function(rd,kk){return rd.s[kk]||nn}, '#fb923c', 0.06, true, 1.8, 3.5, 0, true);
  drawPoly(function(rd,kk){return rd.z[kk]||nn}, '#34d399', 0.10, false, 2, 3.5, 80, true);

  var tagY=HRADAR_R+60;
  dataG.append('text')
    .attr('x',0).attr('y',tagY)
    .attr('text-anchor','middle')
    .attr('font-size','12').attr('font-weight','600')
    .attr('fill','var(--text)').attr('font-family','DM Sans,sans-serif')
    .text(D[k].f+' '+D[k].n)
    .attr('opacity',0).transition().duration(400).attr('opacity',1);
}

/* ══════════════════════════════════════════════════
   LEFT PANEL — Composite stats
   ══════════════════════════════════════════════════ */
function updateHeroCompositePanel(k){
  var panel=document.getElementById('heroRadarLeftPanel');
  if(!panel) return;
  if(!k||!D[k]){panel.innerHTML='';return;}

  var nn=keysFiltered.length;
  var rc=ranks(-1);
  var effortRank=rc.s[k]||nn;
  var wellbeingRank=rc.z[k]||nn;
  var zScore=avgZ(k);
  var pibComposite=totalPIB(k);

  var zCol=zScore>0.3?'green':zScore<-0.3?'red':'blue';
  var gap=effortRank-wellbeingRank;
  var gapTxt=gap>0?'+'+gap:gap<0?''+gap:'0';
  var gapCol=gap>0?'color:var(--green)':gap<0?'color:var(--red)':'color:var(--sub)';

  var h='';
  h+='<div class="hero-comp-card">';
  h+='<div class="hero-comp-label">Effort Composite</div>';
  h+='<div class="hero-comp-rank gold">'+effortRank+'<span class="hero-comp-suf">e</span><span class="hero-comp-total"> / '+nn+'</span></div>';
  h+='<div class="hero-comp-metric"><span class="hero-comp-metric-val purple">'+pibComposite.toFixed(1)+'<span style="font-size:.7rem">%</span></span></div>';
  h+='<div class="hero-comp-metric-unit">du PIB</div>';
  h+='<div class="hero-comp-sub">Classement & dépenses sur 9 domaines COFOG</div>';
  h+='</div>';

  h+='<div class="hero-comp-card">';
  h+='<div class="hero-comp-label">Bien-Être Composite</div>';
  h+='<div class="hero-comp-rank green">'+wellbeingRank+'<span class="hero-comp-suf">e</span><span class="hero-comp-total"> / '+nn+'</span></div>';
  h+='<div class="hero-comp-metric"><span class="hero-comp-metric-val '+zCol+'">'+(zScore>0?'+':'')+zScore.toFixed(2)+'</span></div>';
  h+='<div class="hero-comp-metric-unit">z-score</div>';
  h+='<div class="hero-comp-sub">Classement & écart à la moyenne EU-'+nn+'</div>';
  h+='</div>';

  h+='<div class="hero-comp-gap" style="'+gapCol+'">';
  h+='Écart de rang : <strong>'+gapTxt+' place'+(Math.abs(gap)>1?'s':'')+'</strong>';
  h+='</div>';

  panel.innerHTML=h;
}

/* ══════════════════════════════════════════════════
   MINI SLOPE CHART — Rang effort composite vs rang bien-être composite
   ══════════════════════════════════════════════════ */
function drawHeroSlopeChart(selectedKey){
  var svg=d3.select('#heroSlopeChart');
  svg.selectAll('*').remove();

  var W=230, H=380, ML=85, MR=85, MT=18, MB=12;
  var nn=keysFiltered.length;
  var slpW=W-ML-MR, slpH=H-MT-MB;
  var g=svg.append('g').attr('transform','translate('+ML+','+MT+')');
  var yScale=d3.scaleLinear().domain([1,nn]).range([6,slpH-6]);

  var rc=ranks(-1);

  for(var i=1;i<=nn;i++){
    g.append('line').attr('x1',0).attr('x2',slpW)
      .attr('y1',yScale(i)).attr('y2',yScale(i))
      .attr('stroke','rgba(255,255,255,.025)');
  }

  g.append('text').attr('x',0).attr('y',-8).attr('text-anchor','middle')
    .attr('font-size','7.5').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text('Effort');
  g.append('text').attr('x',slpW).attr('y',-8).attr('text-anchor','middle')
    .attr('font-size','7.5').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text('Bien-être');

  var sorted=keysFiltered.slice().sort(function(a,b){
    var aS=(a===selectedKey)?1:0, bS=(b===selectedKey)?1:0;
    return aS-bS;
  });

  sorted.forEach(function(k){
    var sR=rc.s[k]||1, zR=rc.z[k]||1;
    var df=sR-zR;
    var y1=yScale(sR), y2=yScale(zR);
    var isSelected=(k===selectedKey);
    var col=isSelected?(df>0?'var(--green)':df<0?'var(--red)':'var(--dim)'):'var(--sub)';
    var op=isSelected?1:0.7;
    var sw=isSelected?2.8:1;
    var dotR=isSelected?4:2.2;

    var grp=g.append('g').style('opacity',op).style('cursor','pointer');

    grp.append('path')
      .attr('d','M0,'+y1+' C'+slpW*.35+','+y1+' '+slpW*.65+','+y2+' '+slpW+','+y2)
      .attr('fill','none').attr('stroke',col).attr('stroke-width',sw).attr('stroke-linecap','round');
    grp.append('circle').attr('cx',0).attr('cy',y1).attr('r',dotR).attr('fill',col);
    grp.append('circle').attr('cx',slpW).attr('cy',y2).attr('r',dotR).attr('fill',col);

    if(isSelected){
      grp.append('text').attr('x',-6).attr('y',y1+3.5).attr('text-anchor','end')
        .attr('font-size','9.5').attr('fill','var(--text)').attr('font-weight','600')
        .attr('font-family','DM Sans,sans-serif')
        .text(sR+'. '+D[k].f+' '+D[k].n);
      grp.append('text').attr('x',slpW+6).attr('y',y2+3.5)
        .attr('font-size','9.5').attr('fill','var(--text)').attr('font-weight','600')
        .attr('font-family','DM Sans,sans-serif')
        .text(zR+'. '+D[k].f+' '+D[k].n);
    } else {
      grp.append('text').attr('x',-5).attr('y',y1+3).attr('text-anchor','end')
        .attr('font-size','7.5').attr('fill','var(--sub)').attr('font-weight','400')
        .attr('font-family','DM Sans,sans-serif')
        .text(sR+'. '+D[k].f);
      grp.append('text').attr('x',slpW+5).attr('y',y2+3)
        .attr('font-size','7.5').attr('fill','var(--sub)').attr('font-weight','400')
        .attr('font-family','DM Sans,sans-serif')
        .text(zR+'. '+D[k].f);
    }

    (function(kk, sRank, zRank, isS, baseOp){
      var hoverDf=sRank-zRank;
      var hoverCol=hoverDf>0?'var(--green)':hoverDf<0?'var(--red)':'var(--dim)';
      grp.on('mouseover',function(ev){
        grp.transition().duration(150).style('opacity',1);
        if(!isS){
          grp.select('path').attr('stroke',hoverCol).attr('stroke-width',2);
          grp.selectAll('circle').attr('fill',hoverCol).attr('r',3);
        }
        var diffTxt=hoverDf>0?'+'+hoverDf:hoverDf<0?''+hoverDf:'0';
        var diffCol=hoverDf>0?'var(--green)':hoverDf<0?'var(--red)':'var(--sub)';
        var hh='<h4>'+D[kk].f+' '+D[kk].n+'</h4>';
        hh+='<div class="trow"><span>Rang effort composite</span><span class="tv">'+sRank+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Rang bien-être composite</span><span class="tv">'+zRank+'/'+nn+'</span></div>';
        hh+='<hr class="tsep">';
        hh+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
        document.getElementById('tooltip').innerHTML=hh;
        document.getElementById('tooltip').style.display='block';
        moveTT(ev);
      }).on('mousemove',moveTT).on('mouseout',function(){
        if(!isS){
          grp.transition().duration(150).style('opacity',baseOp);
          grp.select('path').attr('stroke','var(--sub)').attr('stroke-width',1);
          grp.selectAll('circle').attr('fill','var(--sub)').attr('r',2.2);
        }
        hideTT();
      }).on('click',function(){
        var sel=document.getElementById('heroRadarSel');
        if(sel){sel.value=kk;updateHeroRadar();if(activeHeroView==='overview')renderHeroHeatmap();}
      });
    })(k, sR, zR, isSelected, op);
  });
}


/* ══════════════════════════════════════════════════
   HERO HEATMAP — Vue générale intégrée (gap + zscore)
   Avec ligne de corrélation (ρ pour gap, r pour zscore) en bas
   ══════════════════════════════════════════════════ */
function renderHeroHeatmap(){
  if(activeHeroHgView==='zscore') return renderHeroHeatmapZscore();

  var svg=d3.select('#heroHeatmapChart');
  svg.selectAll('*').remove();
  /* Remove old HTML headers */
  var wrap=document.getElementById('heroHeatmapChart').parentNode;
  var oldHdr=wrap.querySelector('.hg-col-headers');
  if(oldHdr) oldHdr.remove();

  var selectedK=document.getElementById('heroRadarSel').value;
  var nn=keysFiltered.length;
  var EXTRA_COLS=2;
  var W=960, ml=130, mt=28, mb=24;
  var cw=(W-ml)/(ND+EXTRA_COLS);
  var totalSumX=ND*cw;
  var compositeX=(ND+1)*cw;
  var CORR_GAP=14;
  var CORR_ROW_H=28;
  var ch=Math.min(36,(480-mt-mb)/nn);
  var H=mt+nn*ch+CORR_GAP+CORR_ROW_H+mb;
  svg.attr('viewBox','0 0 '+W+' '+H);

  var rc=ranks(-1);

  var gapData=keysFiltered.map(function(k){
    var totalGap=0;
    for(var di=0;di<ND;di++){
      var rd=ranks(di);
      totalGap+=(rd.s[k]||nn)-(rd.z[k]||nn);
    }
    var csR=rc.s[k]||nn, czR=rc.z[k]||nn;
    return{k:k,totalGap:totalGap,compositeGap:csR-czR};
  });
  gapData.sort(function(a,b){return b.compositeGap-a.compositeGap});
  var sorted=gapData.map(function(d){return d.k});

  var maxGap=0;
  sorted.forEach(function(k){
    for(var di=0;di<ND;di++){
      var gap=Math.abs((ranks(di).s[k]||nn)-(ranks(di).z[k]||nn));
      if(gap>maxGap) maxGap=gap;
    }
  });
  if(maxGap===0) maxGap=1;

  function gapColor(gap){
    if(gap===0) return'rgba(255,255,255,.10)';
    var t=Math.max(-1,Math.min(1,gap/maxGap));
    var midR=50, midG=55, midB=80;
    if(t>0){var s=t;return'rgb('+Math.round(midR+(52-midR)*s)+','+Math.round(midG+(211-midG)*s)+','+Math.round(midB+(153-midB)*s)+')';}
    else{var s2=-t;return'rgb('+Math.round(midR+(248-midR)*s2)+','+Math.round(midG+(113-midG)*s2)+','+Math.round(midB+(113-midB)*s2)+')';}
  }

  /* Column headers */
  var totalCols=ND+EXTRA_COLS;
  var colPct=(100/totalCols).toFixed(3);
  var totalW=W-ml;
  var hdrRow=document.createElement('div');
  hdrRow.className='hg-col-headers';
  hdrRow.style.cssText='display:flex;margin-left:'+((ml/W)*100).toFixed(2)+'%;width:'+((totalW/W)*100).toFixed(2)+'%;margin-bottom:2px;';
  var shortDoms=['Santé','Revenus','Travail','Logement','Savoirs','Civisme','Social','Sécurité','Environ.'];
  for(var di=0;di<ND;di++){
    (function(domIdx){
      var span=document.createElement('span');
      span.className='hg-col-label hg-col-label-clickable';span.textContent=shortDoms[domIdx];span.title=DOM_LABELS[domIdx];
      span.style.width=colPct+'%';span.style.flex='none';span.style.cursor='pointer';
      span.addEventListener('click',function(){openHeroDomainPopup(domIdx, undefined, 'general')});
      hdrRow.appendChild(span);
    })(di);
  }
  var spanT=document.createElement('span');
  spanT.className='hg-col-label';spanT.textContent='Σ écart';spanT.style.fontWeight='600';
  spanT.style.width=colPct+'%';spanT.style.flex='none';hdrRow.appendChild(spanT);
  var spanC=document.createElement('span');
  spanC.className='hg-col-label';spanC.innerHTML='Composite <span class="composite-info-icon composite-info-icon--inline" title="L\'indicateur composite somme uniformément les 9 domaines. Il est hautement corrélé positivement à la satisfaction à l\'égard de la vie (ρ = 0,93 Spearman ; r = 0,88 Pearson).">ⓘ</span>';spanC.style.fontWeight='600';
  spanC.style.width=colPct+'%';spanC.style.flex='none';hdrRow.appendChild(spanC);
  wrap.insertBefore(hdrRow,document.getElementById('heroHeatmapChart'));

  var g=svg.append('g').attr('transform','translate('+ml+','+mt+')');

  sorted.forEach(function(k,ri){
    var rowGapObj=gapData.find(function(d){return d.k===k});
    var rowGap=rowGapObj?rowGapObj.totalGap:0;
    var isHL=(k===selectedK);

    /* Highlight row bg */
    if(isHL){
      g.append('rect').attr('x',-ml).attr('y',ri*ch).attr('width',W).attr('height',ch)
        .attr('fill','rgba(232,168,56,.08)').attr('rx',0);
    }

    g.append('text').attr('x',-ml+4).attr('y',ri*ch+ch/2+3.5)
      .attr('fill','var(--muted)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
      .text((ri+1)+'e');
    g.append('text').attr('x',-6).attr('y',ri*ch+ch/2+3.5)
      .attr('text-anchor','end')
      .attr('fill',isHL?'var(--gold)':'var(--sub)')
      .attr('font-size','9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('font-weight',isHL?'700':'400')
      .text(D[k].f+' '+D[k].n);

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
          }).on('mousemove',moveTT).on('mouseout',hideTT)
          .on('click',function(){openHeroDomainPopup(di, k)});

        g.append('text').attr('x',di*cw+5).attr('y',ri*ch+10)
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(sR);
        g.append('text').attr('x',di*cw+cw-5).attr('y',ri*ch+10)
          .attr('text-anchor','end').attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(zR);
        var gapTxt=gap===0?'0':(gap>0?'+'+gap:''+gap);
        g.append('text').attr('x',di*cw+cw/2).attr('y',ri*ch+ch/2+5)
          .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
          .attr('fill',Math.abs(gap)>=2?'rgba(0,0,0,.75)':'rgba(255,255,255,.55)')
          .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(gapTxt);
      })(di2);
    }

    /* Σ écart */
    var totalCol=rowGap>0?'var(--green)':rowGap<0?'var(--red)':'var(--sub)';
    g.append('text').attr('x',totalSumX+cw/2).attr('y',ri*ch+ch/2+4)
      .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
      .attr('fill',totalCol).attr('font-family','DM Sans,sans-serif')
      .text((rowGap>0?'+':'')+rowGap);

    /* Composite */
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
          h+='<div class="trow"><span>Rang effort</span><span class="tv">'+csR+'/'+nn+'</span></div>';
          h+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+czR+'/'+nn+'</span></div>';
          h+='<hr class="tsep">';
          h+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+(cGap>0?'var(--green)':cGap<0?'var(--red)':'var(--sub)')+'">'+(cGap>0?'+':'')+cGap+'</span></div>';
          h+='<div class="tsyn '+synth.cls+'">'+synth.txt+'</div>';
          document.getElementById('tooltip').innerHTML=h;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        }).on('mousemove',moveTT).on('mouseout',hideTT);

      g.append('text').attr('x',compositeX+5).attr('y',ri*ch+10)
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(csR);
      g.append('text').attr('x',compositeX+cw-5).attr('y',ri*ch+10)
        .attr('text-anchor','end').attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(czR);
      var cGapTxt=cGap===0?'0':(cGap>0?'+'+cGap:''+cGap);
      g.append('text').attr('x',compositeX+cw/2).attr('y',ri*ch+ch/2+5)
        .attr('text-anchor','middle').attr('font-size','10px').attr('font-weight','700')
        .attr('fill',Math.abs(cGap)>=2?'rgba(0,0,0,.75)':'rgba(255,255,255,.55)')
        .attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(cGapTxt);
    })(k,ri);
  });

  /* Separators */
  g.append('line').attr('x1',totalSumX).attr('x2',totalSumX).attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.12)').attr('stroke-width',1);
  g.append('line').attr('x1',compositeX).attr('x2',compositeX).attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-width',1).attr('stroke-dasharray','3,3');

  /* ── CORRELATION ROW (ρ Spearman per domain) ── */
  var corrY=nn*ch+CORR_GAP;
  /* Separator line */
  g.append('line').attr('x1',-ml).attr('x2',W-ml).attr('y1',corrY-4).attr('y2',corrY-4)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','2,2');
  /* ρ Spearman label with info tooltip */
  var spLabelG=g.append('g').style('cursor','help');
  spLabelG.append('text').attr('x',-6).attr('y',corrY+CORR_ROW_H/2+3.5)
    .attr('text-anchor','end').attr('font-size','8px').attr('fill','var(--gold)')
    .attr('font-weight','600').attr('font-family','DM Sans,sans-serif').text('ρ Spearman');
  spLabelG.append('circle').attr('cx',-ml+14).attr('cy',corrY+CORR_ROW_H/2-1)
    .attr('r',6).attr('fill','rgba(232,168,56,.15)').attr('stroke','var(--gold)').attr('stroke-width',.6);
  spLabelG.append('text').attr('x',-ml+14).attr('y',corrY+CORR_ROW_H/2+2.5)
    .attr('text-anchor','middle').attr('font-size','7px').attr('fill','var(--gold)')
    .attr('font-weight','700').attr('font-family','DM Sans,sans-serif').text('i');
  spLabelG.on('mouseover',function(ev){
    var hh='<h4>ρ Spearman — corrélation de rang</h4>';
    hh+='<p style="margin:.3rem 0;font-size:.75rem;color:var(--sub);line-height:1.6">Compare les <strong style="color:var(--text)">classements</strong> (rangs) entre effort et bien-être.</p>';
    hh+='<hr class="tsep">';
    hh+='<div class="trow"><span style="color:var(--red);font-weight:600">−1</span><span class="tv">Forte corrélation négative</span></div>';
    hh+='<div class="trow"><span style="color:var(--muted);font-weight:600">&nbsp;0</span><span class="tv">Aucune corrélation</span></div>';
    hh+='<div class="trow"><span style="color:var(--green);font-weight:600">+1</span><span class="tv">Forte corrélation positive</span></div>';
    document.getElementById('tooltip').innerHTML=hh;
    document.getElementById('tooltip').style.display='block';
    moveTT(ev);
  }).on('mousemove',moveTT).on('mouseout',hideTT);

  for(var di=0;di<ND;di++){
    (function(di){
      var rd=ranks(di);
      var rho=spearman(rd);
      var cl=corrLabel(rho);
      var col=corrClsColor(cl.cls);
      g.append('text').attr('x',di*cw+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
        .attr('text-anchor','middle').attr('font-size','9px').attr('font-weight','700')
        .attr('fill',col).attr('font-family','DM Sans,sans-serif')
        .text(rho!==null?rho.toFixed(2):'—');
    })(di);
  }
  /* Composite ρ */
  var rcCorr=ranks(-1);
  var rhoComp=spearman(rcCorr);
  var clComp=corrLabel(rhoComp);
  g.append('text').attr('x',compositeX+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
    .attr('text-anchor','middle').attr('font-size','9px').attr('font-weight','700')
    .attr('fill',corrClsColor(clComp.cls)).attr('font-family','DM Sans,sans-serif')
    .text(rhoComp!==null?rhoComp.toFixed(2):'—');

  /* Legend */
  g.append('text').attr('x',0).attr('y',-16)
    .attr('fill','rgba(255,255,255,.3)').attr('font-size','7px')
    .attr('font-family','DM Sans,sans-serif')
    .text('Cellule :  ↖ rang effort · écart au centre · rang bien-être ↗');
}

/* ── Hero Heatmap Z-Score view ── */
function renderHeroHeatmapZscore(){
  var svg=d3.select('#heroHeatmapChart');
  svg.selectAll('*').remove();
  var wrap=document.getElementById('heroHeatmapChart').parentNode;
  var oldHdr=wrap.querySelector('.hg-col-headers');
  if(oldHdr) oldHdr.remove();

  var selectedK=document.getElementById('heroRadarSel').value;
  var nn=keysFiltered.length;
  var EXTRA_COLS=1;
  var GAP_PX=10;
  var W=960, ml=130, mt=28, mb=24;
  var cw=(W-ml-GAP_PX)/(ND+EXTRA_COLS);
  var compositeX=ND*cw+GAP_PX;
  var CORR_GAP=14;
  var CORR_ROW_H=28;
  var ch=Math.min(36,(480-mt-mb)/nn);
  var H=mt+nn*ch+CORR_GAP+CORR_ROW_H+mb;
  svg.attr('viewBox','0 0 '+W+' '+H);

  var sorted=keysFiltered.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});

  var allZ=[];
  sorted.forEach(function(k){
    for(var di=0;di<ND;di++){var z=getZ(k,di);if(!isNaN(z))allZ.push(z);}
    allZ.push(avgZ(k));
  });
  var zMax=Math.max(Math.abs(d3.min(allZ)||0),Math.abs(d3.max(allZ)||0),0.1);

  function zColor(z){
    if(isNaN(z)||z==null)return'rgba(255,255,255,.06)';
    var t=Math.max(0,Math.min(1,(z/zMax+1)/2));
    var midR=55, midG=60, midB=90;
    if(t<0.5){var s=t*2;return'rgb('+Math.round(200+(midR-200)*s)+','+Math.round(80+(midG-80)*s)+','+Math.round(80+(midB-80)*s)+')';}
    else{var s2=(t-0.5)*2;return'rgb('+Math.round(midR+(52-midR)*s2)+','+Math.round(midG+(200-midG)*s2)+','+Math.round(midB+(140-midB)*s2)+')';}
  }

  /* Column headers */
  var totalCols=ND+EXTRA_COLS;
  var colPct=(100/totalCols).toFixed(3);
  var totalW=W-ml;
  var hdrRow=document.createElement('div');
  hdrRow.className='hg-col-headers';
  hdrRow.style.cssText='display:flex;margin-left:'+((ml/W)*100).toFixed(2)+'%;width:'+((totalW/W)*100).toFixed(2)+'%;margin-bottom:2px;';
  var shortDoms=['Santé','Revenus','Travail','Logement','Savoirs','Civisme','Social','Sécurité','Environ.'];
  for(var di=0;di<ND;di++){
    (function(domIdx){
      var span=document.createElement('span');
      span.className='hg-col-label hg-col-label-clickable';span.textContent=shortDoms[domIdx];span.title=DOM_LABELS[domIdx];
      span.style.width=colPct+'%';span.style.flex='none';span.style.cursor='pointer';
      span.addEventListener('click',function(){openHeroDomainPopup(domIdx, undefined, 'general')});
      hdrRow.appendChild(span);
    })(di);
  }
  var spanC=document.createElement('span');
  spanC.className='hg-col-label';spanC.innerHTML='Composite <span class="composite-info-icon composite-info-icon--inline" title="L\'indicateur composite somme uniformément les 9 domaines. Il est hautement corrélé positivement à la satisfaction à l\'égard de la vie (ρ = 0,93 Spearman ; r = 0,88 Pearson).">ⓘ</span>';spanC.style.fontWeight='600';
  spanC.style.width=colPct+'%';spanC.style.flex='none';
  spanC.style.marginLeft=((GAP_PX/totalW)*100).toFixed(2)+'%';
  hdrRow.appendChild(spanC);
  wrap.insertBefore(hdrRow,document.getElementById('heroHeatmapChart'));

  var g=svg.append('g').attr('transform','translate('+ml+','+mt+')');

  sorted.forEach(function(k,ri){
    var isHL=(k===selectedK);
    if(isHL){
      g.append('rect').attr('x',-ml).attr('y',ri*ch).attr('width',W).attr('height',ch)
        .attr('fill','rgba(232,168,56,.08)').attr('rx',0);
    }

    g.append('text').attr('x',-ml+4).attr('y',ri*ch+ch/2+3.5)
      .attr('fill','var(--muted)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
      .text((ri+1)+'e');
    g.append('text').attr('x',-6).attr('y',ri*ch+ch/2+3.5)
      .attr('text-anchor','end')
      .attr('fill',isHL?'var(--gold)':'var(--sub)')
      .attr('font-size','9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('font-weight',isHL?'700':'400')
      .text(D[k].f+' '+D[k].n);

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
          .on('click',function(){openHeroDomainPopup(di, k)});

        g.append('text').attr('x',di*cw+5).attr('y',ri*ch+10)
          .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(sR);
        g.append('text').attr('x',di*cw+cw-5).attr('y',ri*ch+10)
          .attr('text-anchor','end').attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(zR);

        if(ch>=15){
          g.append('text').attr('x',di*cw+cw/2).attr('y',ri*ch+ch/2+4)
            .attr('text-anchor','middle').attr('pointer-events','none')
            .attr('fill',Math.abs(z||0)>0.6?'rgba(255,255,255,.95)':'rgba(255,255,255,.6)')
            .attr('font-size','8px').attr('font-weight','600')
            .attr('font-family','DM Sans,sans-serif')
            .text(isNaN(z)||z==null?'':z>0?'+'+z.toFixed(1):z.toFixed(1));
        }
      })(di2);
    }

    /* Composite column */
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
          document.getElementById('tooltip').innerHTML=h;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        }).on('mousemove',moveTT).on('mouseout',hideTT);

      var rcC=ranks(-1);
      g.append('text').attr('x',compositeX+5).attr('y',ri*ch+10)
        .attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(rcC.s[k]||nn);
      g.append('text').attr('x',compositeX+cw-5).attr('y',ri*ch+10)
        .attr('text-anchor','end').attr('font-size','7px').attr('fill','rgba(255,255,255,.35)').attr('font-family','DM Sans,sans-serif').attr('pointer-events','none').text(rcC.z[k]||nn);
      g.append('text').attr('x',compositeX+cw/2).attr('y',ri*ch+ch/2+4)
        .attr('text-anchor','middle').attr('pointer-events','none')
        .attr('fill',Math.abs(cz)>0.4?'rgba(255,255,255,.95)':'rgba(255,255,255,.6)')
        .attr('font-size','8px').attr('font-weight','700').attr('font-family','DM Sans,sans-serif')
        .text(cz>0?'+'+cz.toFixed(1):cz.toFixed(1));
    })(k,ri);
  });

  g.append('line').attr('x1',compositeX).attr('x2',compositeX).attr('y1',0).attr('y2',nn*ch)
    .attr('stroke','rgba(255,255,255,.12)').attr('stroke-width',1);

  /* ── CORRELATION ROW (r Pearson per domain for z-score view) ── */
  var corrY=nn*ch+CORR_GAP;
  g.append('line').attr('x1',-ml).attr('x2',W-ml).attr('y1',corrY-4).attr('y2',corrY-4)
    .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','2,2');
  /* r Pearson label with info tooltip */
  var prLabelG=g.append('g').style('cursor','help');
  prLabelG.append('text').attr('x',-6).attr('y',corrY+CORR_ROW_H/2+3.5)
    .attr('text-anchor','end').attr('font-size','8px').attr('fill','var(--blue)')
    .attr('font-weight','600').attr('font-family','DM Sans,sans-serif').text('r Pearson');
  prLabelG.append('circle').attr('cx',-ml+14).attr('cy',corrY+CORR_ROW_H/2-1)
    .attr('r',6).attr('fill','rgba(96,165,250,.15)').attr('stroke','var(--blue)').attr('stroke-width',.6);
  prLabelG.append('text').attr('x',-ml+14).attr('y',corrY+CORR_ROW_H/2+2.5)
    .attr('text-anchor','middle').attr('font-size','7px').attr('fill','var(--blue)')
    .attr('font-weight','700').attr('font-family','DM Sans,sans-serif').text('i');
  prLabelG.on('mouseover',function(ev){
    var hh='<h4>r Pearson — corrélation linéaire</h4>';
    hh+='<p style="margin:.3rem 0;font-size:.75rem;color:var(--sub);line-height:1.6">Mesure la relation linéaire entre les <strong style="color:var(--text)">valeurs brutes</strong> (% PIB vs z-score).</p>';
    hh+='<hr class="tsep">';
    hh+='<div class="trow"><span style="color:var(--red);font-weight:600">−1</span><span class="tv">Forte corrélation négative</span></div>';
    hh+='<div class="trow"><span style="color:var(--muted);font-weight:600">&nbsp;0</span><span class="tv">Aucune corrélation</span></div>';
    hh+='<div class="trow"><span style="color:var(--green);font-weight:600">+1</span><span class="tv">Forte corrélation positive</span></div>';
    document.getElementById('tooltip').innerHTML=hh;
    document.getElementById('tooltip').style.display='block';
    moveTT(ev);
  }).on('mousemove',moveTT).on('mouseout',hideTT);

  for(var di=0;di<ND;di++){
    (function(di){
      var pts=keysFiltered.map(function(k){
        return{x:getPIB(k,di),y:getZ(k,di)};
      }).filter(function(d){return d.x>0&&!isNaN(d.y)});
      var pR=pearsonR(pts);
      var pLbl=pearsonLabel(pR);
      g.append('text').attr('x',di*cw+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
        .attr('text-anchor','middle').attr('font-size','9px').attr('font-weight','700')
        .attr('fill',corrClsColor(pLbl.cls)).attr('font-family','DM Sans,sans-serif')
        .text(pR!==null?pR.toFixed(2):'—');
    })(di);
  }
  /* Composite r */
  var ptsComp=keysFiltered.map(function(k){return{x:totalPIB(k),y:avgZ(k)};}).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pRComp=pearsonR(ptsComp);
  var pLblComp=pearsonLabel(pRComp);
  g.append('text').attr('x',compositeX+cw/2).attr('y',corrY+CORR_ROW_H/2+4)
    .attr('text-anchor','middle').attr('font-size','9px').attr('font-weight','700')
    .attr('fill',corrClsColor(pLblComp.cls)).attr('font-family','DM Sans,sans-serif')
    .text(pRComp!==null?pRComp.toFixed(2):'—');

  g.append('text').attr('x',0).attr('y',-16)
    .attr('fill','rgba(255,255,255,.3)').attr('font-size','7px')
    .attr('font-family','DM Sans,sans-serif')
    .text('Cellule :  ↖ rang effort · z-score au centre · rang bien-être ↗');
}


/* ══════════════════════════════════════════════════
   POPUP DOMAINE — Détail effort + bien-être avec 2 onglets
   ══════════════════════════════════════════════════ */
function openHeroDomainPopup(domIdx, preSelectCountry, defaultTab){
  var existing=document.getElementById('heroDomainOverlay');
  if(existing) existing.remove();

  var overlay=document.createElement('div');
  overlay.id='heroDomainOverlay';
  overlay.className='hero-domain-overlay';

  var popup=document.createElement('div');
  popup.className='hero-domain-popup';

  var dn=DOMS[domIdx];
  var nn=keysFiltered.length;

  /* Only default to "Vue générale" when explicitly requested (heatmap column headers) */
  var defaultToGeneral=(defaultTab==='general');

  var heroSel=document.getElementById('heroRadarSel');
  var defaultK=preSelectCountry||(heroSel&&heroSel.value?heroSel.value:'FR');

  var h='<button class="matching-popup-close" id="heroDomainPopupClose">&times;</button>';
  h+='<h4 class="matching-popup-title">'+DOM_ICONS[domIdx]+' '+DOM_LABELS[domIdx]+'</h4>';

  /* Tabs */
  h+='<div class="hero-domain-tabs">';
  h+='<button class="hero-domain-tab'+(defaultToGeneral?'':' active')+'" data-dtab="country" id="heroDomTabCountry">🏳️ '+D[defaultK].n+'</button>';
  h+='<button class="hero-domain-tab'+(defaultToGeneral?' active':'')+'" data-dtab="general">📊 Vue générale</button>';
  h+='</div>';

  /* Country selector (only visible in country tab) */
  var sorted=keysFiltered.slice().sort(function(a,b){return D[a].n.localeCompare(D[b].n)});
  h+='<div id="heroDomainCountrySelWrap" style="margin:.3rem 0 .6rem;display:'+(defaultToGeneral?'none':'flex')+';align-items:center;gap:.6rem;">';
  h+='<label style="font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Pays</label>';
  h+='<select id="heroDomainCountrySelect" class="spider-country-select left" style="max-width:250px">';
  sorted.forEach(function(k){
    var sel=(k===defaultK)?' selected':'';
    h+='<option value="'+k+'"'+sel+'>'+D[k].f+' '+D[k].n+'</option>';
  });
  h+='</select>';
  h+='</div>';

  h+='<div id="heroDomainContent" style="display:'+(defaultToGeneral?'none':'block')+'"></div>';
  h+='<div id="heroDomainGeneralContent" style="display:'+(defaultToGeneral?'block':'none')+'"></div>';

  popup.innerHTML=h;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  requestAnimationFrame(function(){overlay.classList.add('open')});

  buildHeroDomainContent(domIdx,defaultK);
  buildHeroDomainGeneralContent(domIdx);

  /* If defaulting to general tab, draw the slope chart immediately */
  if(defaultToGeneral){
    setTimeout(function(){drawHeroDomainSlope(domIdx)},50);
  }

  /* Country selector change */
  document.getElementById('heroDomainCountrySelect').addEventListener('change',function(){
    var newK=this.value;
    buildHeroDomainContent(domIdx,newK);
    var tab=document.getElementById('heroDomTabCountry');
    if(tab) tab.textContent='🏳️ '+D[newK].n;
  });

  /* Tab switching */
  popup.querySelectorAll('.hero-domain-tab').forEach(function(btn){
    btn.addEventListener('click',function(){
      var tab=btn.getAttribute('data-dtab');
      popup.querySelectorAll('.hero-domain-tab').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      document.getElementById('heroDomainContent').style.display=(tab==='country')?'block':'none';
      document.getElementById('heroDomainGeneralContent').style.display=(tab==='general')?'block':'none';
      document.getElementById('heroDomainCountrySelWrap').style.display=(tab==='country')?'flex':'none';
      if(tab==='general') drawHeroDomainSlope(domIdx);
    });
  });

  overlay.addEventListener('click',function(e){if(e.target===overlay) closeHeroDomainPopup()});
  document.getElementById('heroDomainPopupClose').addEventListener('click',closeHeroDomainPopup);
  overlay._escHandler=function(e){if(e.key==='Escape') closeHeroDomainPopup()};
  document.addEventListener('keydown',overlay._escHandler);
}

function closeHeroDomainPopup(){
  var overlay=document.getElementById('heroDomainOverlay');
  if(!overlay) return;
  if(overlay._escHandler) document.removeEventListener('keydown',overlay._escHandler);
  overlay.classList.remove('open');
  setTimeout(function(){overlay.remove()},300);
}

/* ── Build GENERAL tab content for a domain popup ── */
var activeHeroDomGenView='spearman';

function buildHeroDomainGeneralContent(domIdx){
  var container=document.getElementById('heroDomainGeneralContent');
  if(!container) return;
  activeHeroDomGenView='spearman';

  var nn=keysFiltered.length;
  var rd=ranks(domIdx);
  var rho=spearman(rd);
  var cl=corrLabel(rho);

  /* Pearson */
  var pts=keysFiltered.map(function(k){
    return{x:getPIB(k,domIdx),y:getZ(k,domIdx)};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);

  var avgPib=computeEU16DomPibAvg(domIdx);

  var h='';

  /* Toggle buttons: Rangs (Spearman) / Valeurs (Pearson) — styled like the slope story toggles */
  h+='<div class="hero-dom-gen-toggle" id="heroDomGenToggle">';

  h+='<button class="hero-dom-gen-vbtn active" data-heroDomGen-view="spearman">';
  h+='<span class="slope-vbtn-badge" style="color:'+corrClsColor(cl.cls)+'">ρ='+(rho!==null?rho.toFixed(2):'—')+'</span>';
  h+='<span class="slope-vbtn-info">';
  h+='<span class="slope-vbtn-label">Rangs (Spearman)</span>';
  h+='<span class="slope-vbtn-desc" style="color:'+corrClsColor(cl.cls)+'">'+cl.txt+'</span>';
  h+='</span>';
  h+='</button>';

  h+='<button class="hero-dom-gen-vbtn" data-heroDomGen-view="pearson">';
  h+='<span class="slope-vbtn-badge" style="color:'+corrClsColor(pLbl.cls)+'">r='+(pR!==null?pR.toFixed(2):'—')+'</span>';
  h+='<span class="slope-vbtn-info">';
  h+='<span class="slope-vbtn-label">Valeurs (Pearson)</span>';
  h+='<span class="slope-vbtn-desc" style="color:'+corrClsColor(pLbl.cls)+'">'+pLbl.txt+'</span>';
  h+='</span>';
  h+='</button>';

  h+='</div>';

  /* Avg PIB chip */
  h+='<div style="text-align:center;margin:.4rem 0 .2rem">';
  h+='<span style="font-size:.7rem;color:var(--muted)">Dépenses moy. : </span>';
  h+='<span style="font-size:.78rem;font-weight:600;color:var(--text)">'+(avgPib!=null?avgPib.toFixed(2):'—')+'% du PIB</span>';
  h+='</div>';

  /* Dual panels: slope (spearman) + scatter (pearson) */
  h+='<div class="hero-dom-gen-dual-wrap">';

  /* Slope panel (Spearman) — active by default */
  h+='<div class="hero-dom-gen-panel hero-dom-gen-panel-spearman active">';
  h+='<svg id="heroDomainSlopeChart" viewBox="0 0 700 420" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:700px"></svg>';
  h+='</div>';

  /* Scatter panel (Pearson) */
  h+='<div class="hero-dom-gen-panel hero-dom-gen-panel-pearson">';
  h+='<svg id="heroDomainScatterChart" viewBox="0 0 700 420" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:700px"></svg>';
  h+='</div>';

  h+='</div>';

  /* Legend */
  h+='<div class="slope-legend" style="margin-top:.3rem;text-align:center">';
  h+='<span><span class="dot" style="background:var(--green)"></span> Surperformant</span>';
  h+='<span><span class="dot" style="background:var(--red)"></span> Sous-performant</span>';
  h+='<span><span class="dot" style="background:var(--dim)"></span> Neutre</span>';
  h+='</div>';

  container.innerHTML=h;

  /* Wire up toggle buttons */
  container.querySelectorAll('.hero-dom-gen-vbtn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-heroDomGen-view');
      if(view===activeHeroDomGenView) return;
      activeHeroDomGenView=view;
      container.querySelectorAll('.hero-dom-gen-vbtn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      container.querySelectorAll('.hero-dom-gen-panel').forEach(function(p){p.classList.remove('active')});
      container.querySelector('.hero-dom-gen-panel-'+view).classList.add('active');
      if(view==='pearson') drawHeroDomainScatter(domIdx);
    });
  });
}

/* ── Draw slope chart for a specific domain inside popup ── */
function drawHeroDomainSlope(domIdx){
  var svg=d3.select('#heroDomainSlopeChart');
  if(svg.empty()) return;
  svg.selectAll('*').remove();

  var W=700, H=420, ML=140, MR=140, MT=16, MB=10;
  var nn=keysFiltered.length;
  var slpW=W-ML-MR, slpH=H-MT-MB;
  var g=svg.append('g').attr('transform','translate('+ML+','+MT+')');
  var yScale=d3.scaleLinear().domain([1,nn]).range([6,slpH-6]);

  var rd=ranks(domIdx);
  var selectedK=document.getElementById('heroRadarSel').value;

  /* Grid */
  for(var i=1;i<=nn;i++){
    g.append('line').attr('x1',0).attr('x2',slpW)
      .attr('y1',yScale(i)).attr('y2',yScale(i))
      .attr('stroke','rgba(255,255,255,.025)');
  }

  g.append('text').attr('x',0).attr('y',-6).attr('text-anchor','middle')
    .attr('font-size','8').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text('Rang effort (% PIB)');
  g.append('text').attr('x',slpW).attr('y',-6).attr('text-anchor','middle')
    .attr('font-size','8').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text('Rang bien-être');

  var sorted=keysFiltered.slice().sort(function(a,b){
    return (a===selectedK?1:0)-(b===selectedK?1:0);
  });

  sorted.forEach(function(k){
    var sR=rd.s[k]||1, zR=rd.z[k]||1;
    var df=sR-zR;
    var y1=yScale(sR), y2=yScale(zR);
    var isSelected=(k===selectedK);
    var col=df>0?'var(--green)':df<0?'var(--red)':'var(--dim)';
    var hero=isSelected;
    var baseW=hero?2.8:1.2;
    var sw=Math.max(baseW,Math.min(hero?5:3.5,Math.abs(df)/(hero?2:3)+baseW));
    var op=hero?1:0.4;

    var grp=g.append('g').style('opacity',op).style('cursor','pointer');

    grp.append('path')
      .attr('d','M0,'+y1+' C'+slpW*.35+','+y1+' '+slpW*.65+','+y2+' '+slpW+','+y2)
      .attr('fill','none').attr('stroke',col).attr('stroke-width',sw).attr('stroke-linecap','round');
    grp.append('circle').attr('cx',0).attr('cy',y1).attr('r',hero?5:3).attr('fill',col);
    grp.append('circle').attr('cx',slpW).attr('cy',y2).attr('r',hero?5:3).attr('fill',col);

    grp.append('text').attr('x',-7).attr('y',y1+4).attr('text-anchor','end')
      .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
      .text(sR+'. '+D[k].f+(hero?' '+D[k].n:''));
    grp.append('text').attr('x',slpW+7).attr('y',y2+4)
      .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
      .text(sR===zR?'':zR+'. '+D[k].f+(hero?' '+D[k].n:''));

    (function(kk,sRank,zRank,isS,baseOp2){
      var hDf=sRank-zRank;
      var hCol=hDf>0?'var(--green)':hDf<0?'var(--red)':'var(--dim)';
      grp.on('mouseover',function(ev){
        grp.transition().duration(150).style('opacity',1);
        if(!isS){grp.select('path').attr('stroke',hCol).attr('stroke-width',2);grp.selectAll('circle').attr('fill',hCol).attr('r',3.5);}
        var diffTxt=hDf>0?'+'+hDf:hDf<0?''+hDf:'0';
        var diffCol=hDf>0?'var(--green)':hDf<0?'var(--red)':'var(--sub)';
        var hh='<h4>'+D[kk].f+' '+D[kk].n+' — '+DOM_LABELS[domIdx]+'</h4>';
        hh+='<div class="trow"><span>Rang effort</span><span class="tv">'+sRank+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+zRank+'/'+nn+'</span></div>';
        hh+='<hr class="tsep">';
        hh+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
        document.getElementById('tooltip').innerHTML=hh;
        document.getElementById('tooltip').style.display='block';
        moveTT(ev);
      }).on('mousemove',moveTT).on('mouseout',function(){
        if(!isS){grp.transition().duration(150).style('opacity',baseOp2);grp.select('path').attr('stroke',col).attr('stroke-width',1.2);grp.selectAll('circle').attr('fill',col).attr('r',3);}
        hideTT();
      });
    })(k,sR,zR,isSelected,op);
  });
}

/* ── Draw scatter chart (Pearson) for a specific domain inside popup ── */
function drawHeroDomainScatter(domIdx){
  var svg=d3.select('#heroDomainScatterChart');
  if(svg.empty()) return;
  svg.selectAll('*').remove();

  var W=700, H=420, ML=70, MR=30, MT=28, MB=50;
  var sW=W-ML-MR, sH=H-MT-MB;
  var g=svg.append('g').attr('transform','translate('+ML+','+MT+')');

  var pts=keysFiltered.map(function(k){
    var xv=getPIB(k,domIdx);
    var yv=getZ(k,domIdx);
    return{k:k,x:xv,y:yv};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});

  if(pts.length<3) return;

  var xE=[d3.min(pts,function(d){return d.x}),d3.max(pts,function(d){return d.x})];
  var yE=[d3.min(pts,function(d){return d.y}),d3.max(pts,function(d){return d.y})];
  var xP=(xE[1]-xE[0])*0.12||0.5, yP=(yE[1]-yE[0])*0.18||0.3;

  var xS=d3.scaleLinear().domain([xE[0]-xP,xE[1]+xP]).range([0,sW]);
  var yS=d3.scaleLinear().domain([yE[0]-yP,yE[1]+yP]).range([sH,0]);

  /* Axes */
  g.append('g').attr('class','ss-axis').attr('transform','translate(0,'+sH+')')
    .call(d3.axisBottom(xS).ticks(7).tickFormat(function(d){return d.toFixed(1)+'%'}));
  g.append('g').attr('class','ss-axis')
    .call(d3.axisLeft(yS).ticks(6).tickFormat(function(d){return d>0?'+'+d.toFixed(1):d.toFixed(1)}));

  /* Axis labels */
  g.append('text').attr('x',sW/2).attr('y',sH+42)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Dépense publique (% du PIB)');
  g.append('text').attr('transform','rotate(-90)').attr('x',-sH/2).attr('y',-50)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Z-score bien-être');

  /* Zero line */
  var y0=yS(0);
  if(y0>0&&y0<sH){
    g.append('line').attr('x1',0).attr('x2',sW).attr('y1',y0).attr('y2',y0)
      .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','3,3');
  }

  /* Trend line (OLS) */
  var n=pts.length,sx=0,sy=0,sxy=0,sxx=0;
  pts.forEach(function(d){sx+=d.x;sy+=d.y;sxy+=d.x*d.y;sxx+=d.x*d.x});
  var tslp=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  var tint=(sy-tslp*sx)/n;
  var x0=xE[0]-xP, x1=xE[1]+xP;
  g.append('line')
    .attr('x1',xS(x0)).attr('x2',xS(x1))
    .attr('y1',yS(tslp*x0+tint)).attr('y2',yS(tslp*x1+tint))
    .attr('stroke','rgba(255,255,255,.22)').attr('stroke-dasharray','5,4').attr('stroke-width',1.5);

  /* Pearson r badge */
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  var rStr='r = '+(pR!==null?pR.toFixed(2):'—');
  var badgeG=g.append('g').attr('transform','translate('+(sW-8)+',4)');
  badgeG.append('text').attr('text-anchor','end').attr('y',0)
    .attr('fill',corrClsColor(pLbl.cls))
    .attr('font-size','14px').attr('font-family','Fraunces,Georgia,serif').attr('font-weight','800')
    .text(rStr);
  badgeG.append('text').attr('text-anchor','end').attr('y',16)
    .attr('fill','var(--sub)').attr('font-size','9px').attr('font-family','DM Sans,sans-serif')
    .text(pLbl.txt);

  /* Dots */
  var selectedK=document.getElementById('heroRadarSel').value;
  var rdDom=ranks(domIdx);
  pts.forEach(function(pd){
    (function(pd){
      var sR=rdDom.s[pd.k]||1, zR=rdDom.z[pd.k]||1;
      var col=sR>zR?'var(--green)':sR<zR?'var(--red)':'var(--dim)';
      var hero=(pd.k===selectedK);
      var dg=g.append('g').style('cursor','pointer');
      dg.append('circle')
        .attr('cx',xS(pd.x)).attr('cy',yS(pd.y)).attr('r',hero?7:5)
        .attr('fill',col).attr('opacity',hero?1:.65)
        .attr('stroke',hero?'rgba(255,255,255,.35)':'none').attr('stroke-width','1.5');

      var lx=xS(pd.x)+10, ly=yS(pd.y)+4;
      var anchor='start';
      if(xS(pd.x)>sW*0.82){lx=xS(pd.x)-10;anchor='end';}
      dg.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor',anchor)
        .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
        .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
        .text(D[pd.k].f+(hero?' '+D[pd.k].n:''));

      dg.on('mouseover',function(ev){
        var diff=sR-zR;
        var diffTxt=diff>0?'+'+diff:diff<0?''+diff:'0';
        var diffCol=diff>0?'var(--green)':diff<0?'var(--red)':'var(--sub)';
        var hh='<h4>'+D[pd.k].f+' '+D[pd.k].n+' — '+DOM_LABELS[domIdx]+'</h4>';
        hh+='<div class="trow"><span>% PIB</span><span class="tv">'+pd.x.toFixed(2)+'%</span></div>';
        hh+='<div class="trow"><span>Z-score</span><span class="tv">'+(pd.y>0?'+':'')+pd.y.toFixed(2)+'</span></div>';
        hh+='<hr class="tsep">';
        hh+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+keysFiltered.length+'</span></div>';
        hh+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+zR+'/'+keysFiltered.length+'</span></div>';
        hh+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
        document.getElementById('tooltip').innerHTML=hh;
        document.getElementById('tooltip').style.display='block';
        moveTT(ev);
      }).on('mousemove',moveTT).on('mouseout',hideTT);
    })(pd);
  });
}

/* ── Build popup content for a specific country & domain (unchanged logic) ── */
function buildHeroDomainContent(domIdx,k){
  var container=document.getElementById('heroDomainContent');
  if(!container) return;

  var dn=DOMS[domIdx];
  var nn=keysFiltered.length;
  var rd=ranks(domIdx);
  var sR=rd.s[k]||nn, zR=rd.z[k]||nn;
  var syn=synthPhrase(sR,zR);

  var h='<div style="display:flex;gap:1rem;margin-bottom:.8rem;flex-wrap:wrap">';
  h+='<div class="macro-chip"><span class="macro-val" style="color:var(--gold)">'+sR+'<span style="font-size:.6rem;color:var(--muted)">e</span></span><span class="macro-lbl">Rang effort</span></div>';
  h+='<div class="macro-chip"><span class="macro-val" style="color:var(--green)">'+zR+'<span style="font-size:.6rem;color:var(--muted)">e</span></span><span class="macro-lbl">Rang bien-être</span></div>';
  var catPib=getPIB(k,domIdx);
  var avgPib=computeEU16DomPibAvg(domIdx);
  h+='<div class="macro-chip"><span class="macro-val">'+catPib.toFixed(2)+'%</span><span class="macro-lbl">% PIB</span><span class="macro-avg">moy. '+(avgPib!=null?avgPib.toFixed(2):'—')+'%</span></div>';
  var catZ=getZ(k,domIdx);
  var zCol=catZ>0.3?'var(--green)':catZ<-0.3?'var(--red)':'var(--sub)';
  h+='<div class="macro-chip"><span class="macro-val" style="color:'+zCol+'">'+(catZ>0?'+':'')+catZ.toFixed(2)+'</span><span class="macro-lbl">Z-score</span></div>';
  h+='</div>';

  var gap=sR-zR;
  var gapTxt=gap>0?'+'+gap:gap<0?''+gap:'0';
  h+='<div style="font-size:.78rem;padding:.4rem .7rem;border-radius:8px;margin-bottom:.8rem" class="psyn '+syn.cls+'">'+syn.txt+' (écart : '+gapTxt+' place'+(Math.abs(gap)>1?'s':'')+')</div>';

  h+='<div class="hero-domain-columns">';

  /* LEFT — COFOG (effort) */
  h+='<div class="hero-domain-col">';
  h+='<div class="hero-domain-col-title effort">Dépenses publiques (COFOG)</div>';
  if(DCAT&&DCAT[k]&&DCAT[k][dn]&&DCAT[k][dn].length){
    DCAT[k][dn].forEach(function(cat){
      var pVal=cat.p[PI], vVal=cat.v[PI];
      var avgP=computeEU16CofogAvg(dn, cat.n, 'p');
      var range=computeEU16CofogRange(dn, cat.n, 'p');
      var span=range.max-range.min;
      var barPct=span>0?Math.max(2,Math.min(98,((pVal-range.min)/span)*100)):50;
      var avgBarPct=span>0&&avgP!=null?Math.max(2,Math.min(98,((avgP-range.min)/span)*100)):50;

      var deltaHtml='';
      if(pVal!=null&&avgP!=null&&avgP>0){
        var delta=((pVal-avgP)/avgP)*100;
        var dCol=delta>5?'var(--green)':delta<-5?'var(--red)':'var(--sub)';
        var arrow=delta>5?'▲':delta<-5?'▼':'●';
        deltaHtml='<span class="cat-delta" style="color:'+dCol+'">'+arrow+' '+Math.abs(delta).toFixed(0)+'%</span>';
      }

      h+='<div class="cat-measure">';
      h+='<div class="cat-m-header"><span class="cat-m-name">'+cat.n+'</span>'+deltaHtml+'</div>';
      h+='<div class="cat-m-vals">';
      h+='<span class="cat-m-country" style="color:var(--text)">'+pVal.toFixed(2)+'% PIB</span>';
      h+='<span class="cat-m-avg">moy. '+(avgP!=null?avgP.toFixed(2):'—')+'%</span>';
      h+='</div>';
      h+='<div class="cat-bar-wrap"><div class="cat-bar-track">';
      h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
      h+='<div class="cat-bar-fill" style="left:0;width:'+barPct+'%;background:var(--gold);border-radius:3px"></div>';
      h+='</div></div>';
      h+='</div>';
    });
  } else {
    h+='<div style="font-size:.75rem;color:var(--muted);padding:.5rem 0">Aucune donnée COFOG</div>';
  }
  h+='</div>';

  /* RIGHT — OCDE (bien-être) */
  h+='<div class="hero-domain-col">';
  h+='<div class="hero-domain-col-title wellbeing">Indicateurs bien-être (OCDE)</div>';
  if(MDATA&&MDATA[k]&&MDATA[k][dn]&&MDATA[k][dn].length){
    MDATA[k][dn].forEach(function(me){
      var v=me.v[PI], zs=me.z[PI];
      var avg=computeEU16Avg(dn,me.m);
      var hasZ=zs!=null&&!isNaN(zs);
      var zC=hasZ?(zs>0.3?'pos':zs<-0.3?'neg':'neu'):'neu';

      var barPct=hasZ?Math.min(100,Math.max(0,(zs+3)/6*100)):50;
      var avgZv=computeEU16AvgZ(dn,me.m);
      var avgBarPct=(avgZv!=null&&!isNaN(avgZv))?Math.min(100,Math.max(0,(avgZv+3)/6*100)):50;

      var positive=(me.s==='positif');
      var deltaHtml='';
      if(v!=null&&avg!=null&&!isNaN(v)&&!isNaN(avg)&&avg!==0){
        var delta=((v-avg)/Math.abs(avg))*100;
        var better=(positive&&delta>0)||(!positive&&delta<0);
        var worse=(positive&&delta<0)||(!positive&&delta>0);
        var dCol=better?'var(--green)':worse?'var(--red)':'var(--sub)';
        var arrow=better?'▲':worse?'▼':'●';
        deltaHtml='<span class="cat-delta" style="color:'+dCol+'">'+arrow+' '+Math.abs(delta).toFixed(0)+'%</span>';
      }

      h+='<div class="cat-measure">';
      h+='<div class="cat-m-header"><span class="cat-m-name">'+me.m+'</span>'+deltaHtml+'</div>';
      h+='<div class="cat-m-vals">';
      h+='<span class="cat-m-country '+zC+'">'+fv(v)+'</span>';
      h+='<span class="cat-m-unit">'+me.u+'</span>';
      h+='<span class="cat-m-avg">moy. '+fv(avg)+'</span>';
      h+='</div>';
      h+='<div class="cat-bar-wrap"><div class="cat-bar-track">';
      h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
      var barCol=zC==='pos'?'var(--green)':zC==='neg'?'var(--red)':'var(--sub)';
      if(barPct>=50){
        h+='<div class="cat-bar-fill" style="left:50%;width:'+(barPct-50)+'%;background:'+barCol+'"></div>';
      } else {
        h+='<div class="cat-bar-fill" style="left:'+barPct+'%;width:'+(50-barPct)+'%;background:'+barCol+'"></div>';
      }
      h+='<div class="cat-bar-center"></div>';
      h+='</div></div>';
      h+='</div>';
    });
  } else {
    h+='<div style="font-size:.75rem;color:var(--muted);padding:.5rem 0">Aucun indicateur</div>';
  }
  h+='</div>';

  h+='</div>';

  container.innerHTML=h;
}


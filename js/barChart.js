/* ================================================================
   BAR CHART — Section 1 : snap-driven bar chart (4 phases)
   Phase 0: Budget €/hab (initial, own scale)
   Phase 1: Insight LU vs GR
   Phase 2: Nested bars — PIB/hab as background, dépense/hab inside (same scale)
   Phase 3: Morph to % PIB, re-sort
   ================================================================ */

var barG,barML=170,barMR=120,barMT=40,barMB=10,barW=820-170-120,barH=560-40-10;
var barData0=[],barData2=[];
var barPos0={},barPos2={};
var barMaxW0,barMaxW2,barBandH,barLastPhase=-1;
var barPibScale,barMaxPib;
var barLegendG;

function barColor(k){
  if(k==='FR') return 'var(--gold)';
  if(k==='IE') return 'var(--green)';
  if(k==='LU') return 'var(--blue)';
  if(k==='GR') return 'var(--red)';
  return 'rgba(255,255,255,.15)';
}

/* Phase-aware color: controls which countries are highlighted per phase */
function barColorForPhase(k, phase){
  if(phase===0){
    return 'rgba(255,255,255,.25)';
  }
  if(phase===1){
    if(k==='LU') return 'var(--blue)';
    if(k==='GR') return 'var(--red)';
    return 'rgba(255,255,255,.15)';
  }
  if(phase===2){
    if(k==='LU') return 'var(--blue)';
    if(k==='GR') return 'var(--red)';
    return 'rgba(255,255,255,.20)';
  }
  if(phase===3){
    if(k==='FR') return 'var(--gold)';
    if(k==='IE') return 'var(--green)';
    if(k==='LU') return 'var(--blue)';
    if(k==='GR') return 'var(--red)';
    return 'rgba(255,255,255,.15)';
  }
  return 'rgba(255,255,255,.15)';
}

function barGhostColor(k){
  if(k==='FR') return 'rgba(232,168,56,.10)';
  if(k==='IE') return 'rgba(52,211,153,.08)';
  if(k==='LU') return 'rgba(96,165,250,.08)';
  if(k==='GR') return 'rgba(248,113,113,.08)';
  return 'rgba(255,255,255,.06)';
}

function initBarChart(){
  var svg=d3.select("#barChart");
  barG=svg.append("g").attr("transform","translate("+barML+","+barMT+")");

  var raw=keys.map(function(k){
    return{k:k,f:D[k].f,n:D[k].n,
      bud:CTX[k].budget[PI],
      pib_hab:CTX[k].pib[PI],
      pib_pct:CTX[k].dep_pib[PI]}
  });

  barData0=raw.slice().sort(function(a,b){return b.bud-a.bud});
  barData2=raw.slice().sort(function(a,b){return b.pib_pct-a.pib_pct});

  barMaxW0=d3.max(barData0,function(d){return d.bud});
  barMaxW2=d3.max(barData2,function(d){return d.pib_pct});

  barMaxPib=d3.max(raw,function(d){return d.pib_hab});
  barPibScale=function(v){return v/barMaxPib*barW};

  var yBand=d3.scaleBand().domain(d3.range(16)).range([0,barH]).padding(.22);
  barBandH=yBand.bandwidth();

  barData0.forEach(function(d,i){
    barPos0[d.k]={y:yBand(i),
      w:d.bud/barMaxW0*barW,                           // phase 0–1: own scale
      wSame:d.bud/barMaxPib*barW,                       // phase 2: same scale as PIB
      val:Math.round(d.bud).toLocaleString('fr-FR')+" \u20ac/hab",
      pibW:barPibScale(d.pib_hab),
      pibVal:Math.round(d.pib_hab).toLocaleString('fr-FR')+" \u20ac/hab",
      pctVal:(d.bud/d.pib_hab*100).toFixed(0)+" %"}
  });
  barData2.forEach(function(d,i){
    barPos2[d.k]={y:yBand(i),w:d.pib_pct/barMaxW2*barW,
      val:d.pib_pct.toFixed(1)+" % PIB"}
  });

  barData0.forEach(function(d){
    var g=barG.append("g").attr("class","bar-g").datum(d.k);
    g.append("rect").attr("class","bar-ghost").attr("rx",3).attr("ry",3)
      .attr("height",barBandH).attr("x",0).attr("width",0)
      .attr("fill",barGhostColor(d.k))
      .attr("stroke","rgba(255,255,255,.10)").attr("stroke-width",.5)
      .attr("opacity",0);
    g.append("rect").attr("class","bar-rect").attr("rx",3).attr("ry",3)
      .attr("height",barBandH).attr("x",0);
    g.append("text").attr("class","bar-label").attr("text-anchor","end")
      .attr("font-size","10.5px").attr("font-family","DM Sans,sans-serif")
      .attr("fill",isHero(d.k)?"#fff":"var(--sub)")
      .attr("font-weight",isHero(d.k)?"600":"400")
      .text(d.f+" "+d.n);
    g.append("text").attr("class","bar-value").attr("font-size","9.5px")
      .attr("font-family","DM Sans,sans-serif").attr("fill","var(--sub)");
    /* Secondary value label (shown in phase 2 for the PIB value) */
    g.append("text").attr("class","bar-value2").attr("font-size","8px")
      .attr("font-family","DM Sans,sans-serif").attr("fill","var(--muted)")
      .attr("opacity",0);
    /* Percentage badge inside the ghost bar (phase 2) */
    g.append("text").attr("class","bar-pct").attr("font-size","7.5px")
      .attr("font-family","DM Sans,sans-serif").attr("fill","rgba(255,255,255,.45)")
      .attr("text-anchor","end").attr("opacity",0);
  });

  /* ── Legend (hidden initially, shown in phase 2) ── */
  barLegendG=barG.append("g").attr("class","bar-legend").attr("opacity",0)
    .attr("transform","translate(0,-6)");
  /* PIB swatch — outlined, transparent fill to contrast with dépense */
  barLegendG.append("rect").attr("width",18).attr("height",8).attr("rx",2)
    .attr("fill","rgba(255,255,255,.06)").attr("stroke","rgba(96,165,250,.5)").attr("stroke-width",1).attr("stroke-dasharray","3,2");
  barLegendG.append("text").attr("x",22).attr("y",8)
    .text("PIB / habitant")
    .attr("fill","var(--blue)").attr("font-size","9px").attr("font-family","DM Sans,sans-serif");
  /* Dépense swatch — solid, brighter fill to distinguish clearly */
  barLegendG.append("rect").attr("x",155).attr("width",18).attr("height",8).attr("rx",2)
    .attr("fill","rgba(255,255,255,.45)");
  barLegendG.append("text").attr("x",177).attr("y",8)
    .text("Dépense publique / habitant")
    .attr("fill","var(--text)").attr("font-size","9px").attr("font-family","DM Sans,sans-serif");

  renderBarPhase(0, false);

  var phases=document.querySelectorAll('.bar-phase');
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting && entry.intersectionRatio>=0.5){
        var phase=parseInt(entry.target.getAttribute('data-bar-phase'));
        if(phase!==barLastPhase){
          barLastPhase=phase;
          renderBarPhase(phase, true);
        }
      }
    });
  },{threshold:0.5});

  phases.forEach(function(p){observer.observe(p)});
}

function renderBarPhase(phase, animate){
  var dur=animate?800:0;
  var ease=d3.easeCubicInOut;
  var nar=document.getElementById('barNarration');
  var narH=nar.querySelector('h2'),narP=nar.querySelector('p'),tag=nar.querySelector('.step-tag');

  if(animate){
    nar.style.transition='opacity .25s ease';
    nar.style.opacity='0';
    setTimeout(function(){
      updateBarNarration(phase, tag, narH, narP);
      nar.style.opacity='1';
    }, 250);
  } else {
    updateBarNarration(phase, tag, narH, narP);
  }

  /* ── Show / hide legend ── */
  if(barLegendG){
    barLegendG.transition().duration(dur/2).attr("opacity", phase===2 ? 1 : 0);
  }

  if(phase===0 || phase===1){
    barG.selectAll(".bar-g").each(function(k){
      var g=d3.select(this), p0=barPos0[k];
      g.select(".bar-ghost").transition().duration(dur/2).ease(ease).attr("opacity",0);
      g.select(".bar-rect").transition().duration(dur).ease(ease)
        .attr("y",p0.y).attr("width",p0.w).attr("fill",barColorForPhase(k, phase));
      g.select(".bar-label").transition().duration(dur).ease(ease)
        .attr("x",-8).attr("y",p0.y+barBandH/2+4);
      g.select(".bar-value").transition().duration(dur).ease(ease)
        .attr("x",p0.w+6).attr("y",p0.y+barBandH/2+4).text(p0.val);
      g.select(".bar-value2").transition().duration(dur/2).attr("opacity",0);
      g.select(".bar-pct").transition().duration(dur/2).attr("opacity",0);
    });
  }
  else if(phase===2){
    /* ── Nested bars on the SAME scale (max = max PIB/hab) ──
       Ghost bar = PIB/hab (large, background)
       Opaque bar = Dépense/hab (shorter, foreground)
       Both scaled to barMaxPib so the ratio is visually obvious */
    barG.selectAll(".bar-g").each(function(k){
      var g=d3.select(this), p0=barPos0[k];
      /* Ghost = PIB/hab (wide background bar) */
      g.select(".bar-ghost").transition().duration(dur).ease(ease)
        .attr("y",p0.y).attr("width",p0.pibW).attr("opacity",1);
      /* Opaque = Dépense/hab on SAME scale */
      g.select(".bar-rect").transition().duration(dur).ease(ease)
        .attr("y",p0.y).attr("width",p0.wSame).attr("fill",barColorForPhase(k, phase));
      /* Country label */
      g.select(".bar-label").transition().duration(dur).ease(ease)
        .attr("x",-8).attr("y",p0.y+barBandH/2+4);
      /* Primary value: PIB €/hab after the ghost bar end (right edge) */
      g.select(".bar-value").transition().duration(dur).ease(ease)
        .attr("x",p0.pibW+6).attr("y",p0.y+barBandH/2+4)
        .text(p0.pibVal).attr("font-size","9px");
      /* Secondary value: dépense €/hab just after the opaque bar (only if enough gap) */
      var gap=p0.pibW - p0.wSame;
      if(gap > 75){
        /* Enough room: show dépense label between the two bars */
        g.select(".bar-value2").transition().duration(dur).ease(ease)
          .attr("x",p0.wSame+4).attr("y",p0.y+barBandH/2+4)
          .text(p0.val).attr("opacity",1).attr("font-size","8px");
      } else {
        /* Not enough room: hide secondary, the % badge tells the story */
        g.select(".bar-value2").transition().duration(dur/2).attr("opacity",0);
      }
      /* Percentage badge inside the opaque bar */
      g.select(".bar-pct").transition().duration(dur).ease(ease)
        .attr("x",p0.wSame-4).attr("y",p0.y+barBandH/2+3)
        .text(p0.pctVal).attr("opacity", p0.wSame > 30 ? 1 : 0);
    });
  }
  else if(phase===3){
    barG.selectAll(".bar-g").each(function(k){
      var g=d3.select(this), p2=barPos2[k];
      g.select(".bar-ghost").transition().duration(dur/2).ease(ease).attr("opacity",0);
      g.select(".bar-rect").transition().duration(dur).ease(ease)
        .attr("y",p2.y).attr("width",p2.w).attr("fill",barColorForPhase(k, phase));
      g.select(".bar-label").transition().duration(dur).ease(ease)
        .attr("x",-8).attr("y",p2.y+barBandH/2+4);
      g.select(".bar-value").transition().duration(dur).ease(ease)
        .attr("x",p2.w+6).attr("y",p2.y+barBandH/2+4).text(p2.val)
        .attr("font-size","9.5px");
      g.select(".bar-value2").transition().duration(dur/2).attr("opacity",0);
      g.select(".bar-pct").transition().duration(dur/2).attr("opacity",0);
    });
  }
}

function updateBarNarration(phase, tag, narH, narP){
  if(phase===0){
    tag.textContent="Tous les euros publics sont \u00e9gaux.";
    narH.textContent="Les d\u00e9penses publiques par habitant.";
    narP.innerHTML="Budget public total par habitant, moyenne 2004\u20132023.";
  } else if(phase===1){
    tag.textContent="Tous les euros publics sont \u00e9gaux.";
    narH.textContent="Les d\u00e9penses publiques par habitant.";
    narP.innerHTML="Par habitant, le montant en \u20ac des d\u00e9penses publiques par habitant au <span class='hl-blue'>Luxembourg</span> est <strong>4,35 fois sup\u00e9rieur</strong> \u00e0 celui de <span class='hl-red'>la Gr\u00e8ce</span>.";
  } else if(phase===2){
    tag.textContent="\u2026 mais certains le sont plus que d\u2019autres.";
    narH.textContent="L\u2019effort relatif au PIB en d\u00e9penses publiques.";
    narP.innerHTML="Proportionnellement au PIB par habitant, <span class='hl-red'>la Gr\u00e8ce</span> consacre une part plus importante \u00e0 ses d\u00e9penses publiques que <span class='hl-blue'>le Luxembourg</span>\u00a0: <strong>41\u00a0%</strong> contre <strong>31\u00a0%</strong>. On dira par abus de langage qu\u2019elle fournit un <em>effort</em> plus \u00e9lev\u00e9.";
  } else if(phase===3){
    tag.textContent="\u2026 mais certains le sont plus que d\u2019autres.";
    narH.textContent="Le classement par effort relatif au PIB en d\u00e9penses publiques.";
    narP.innerHTML="Selon notre d\u00e9finition, <span class='hl-gold'>la France</span> fournit le plus grand effort, <span class='hl-green'>l\u2019Irlande</span> fournit le moins d\u2019effort.";
  }
}

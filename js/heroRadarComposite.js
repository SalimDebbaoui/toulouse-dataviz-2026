/* ================================================================
   HERO RADAR — Panneau composite (stats gauche) + Mini slope chart
   ================================================================ */

/* ── LEFT PANEL — Composite stats ── */
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

/* ── MINI SLOPE CHART — Rang effort composite vs rang bien-être composite ── */
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

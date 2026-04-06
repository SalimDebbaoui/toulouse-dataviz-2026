/* ================================================================
   HERO HEATMAP — Vue générale intégrée (gap + zscore)
   Avec ligne de corrélation (ρ pour gap, r pour zscore) en bas
   ================================================================ */

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
      span.addEventListener('click',function(){openHeroDomainPopup(domIdx)});
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
    if(t<0.5){var s=t*2;return'rgb('+Math.round(200+(midR-200)*s)+','+Math.round(midG+(midG-80)*s)+','+Math.round(80+(midB-80)*s)+')';}
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
      span.addEventListener('click',function(){openHeroDomainPopup(domIdx)});
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

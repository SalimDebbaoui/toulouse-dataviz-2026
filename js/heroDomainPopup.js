/* ================================================================
   HERO DOMAIN POPUP — Popup détail domaine (effort + bien-être)
   avec slope chart, scatter chart et contenu détaillé
   ================================================================ */

function openHeroDomainPopup(domIdx, preSelectCountry){
  var existing=document.getElementById('heroDomainOverlay');
  if(existing) existing.remove();

  var overlay=document.createElement('div');
  overlay.id='heroDomainOverlay';
  overlay.className='hero-domain-overlay';

  var popup=document.createElement('div');
  popup.className='hero-domain-popup';

  var dn=DOMS[domIdx];
  var nn=keysFiltered.length;

  var heroSel=document.getElementById('heroRadarSel');
  var defaultK=preSelectCountry||(heroSel&&heroSel.value?heroSel.value:'FR');

  /* Sync the Profil pays selector when opening with a specific country */
  if(preSelectCountry&&heroSel&&heroSel.value!==preSelectCountry){
    heroSel.value=preSelectCountry;
    updateHeroRadar();
    if(activeHeroView==='overview') renderHeroHeatmap();
  }

  var h='<button class="matching-popup-close" id="heroDomainPopupClose">&times;</button>';
  h+='<h4 class="matching-popup-title">'+DOM_ICONS[domIdx]+' '+DOM_LABELS[domIdx]+'</h4>';

  /* Country selectors (main + compare) */
  var sorted=keysFiltered.slice().sort(function(a,b){return D[a].n.localeCompare(D[b].n)});
  h+='<div id="heroDomainCountrySelWrap" class="hero-domain-sel-row">';
  h+='<div class="hero-domain-sel-group"><label>Pays</label>';
  h+='<select id="heroDomainCountrySelect" class="spider-country-select left" style="max-width:250px">';
  sorted.forEach(function(k){
    var sel=(k===defaultK)?' selected':'';
    h+='<option value="'+k+'"'+sel+'>'+D[k].f+' '+D[k].n+'</option>';
  });
  h+='</select></div>';
  h+='<span class="hero-domain-sel-vs">vs</span>';
  h+='<div class="hero-domain-sel-group"><label>Comparer avec</label>';
  h+='<select id="heroDomainCompareSelect" class="spider-country-select right" style="max-width:250px">';
  h+='<option value="">— Aucun —</option>';
  sorted.forEach(function(k){
    h+='<option value="'+k+'">'+D[k].f+' '+D[k].n+'</option>';
  });
  h+='</select></div>';
  h+='</div>';

  h+='<div id="heroDomainContent"></div>';

  popup.innerHTML=h;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  requestAnimationFrame(function(){overlay.classList.add('open')});

  buildHeroDomainContent(domIdx,defaultK,null);

  function refreshHeroDomain(){
    var mainK=document.getElementById('heroDomainCountrySelect').value;
    var cmpK=document.getElementById('heroDomainCompareSelect').value||null;
    buildHeroDomainContent(domIdx,mainK,cmpK);
  }

  /* Country selector change — also sync with Profil pays selector */
  document.getElementById('heroDomainCountrySelect').addEventListener('change',function(){
    var mainK=document.getElementById('heroDomainCountrySelect').value;
    /* Sync the Profil pays country selector */
    var heroSel2=document.getElementById('heroRadarSel');
    if(heroSel2){
      heroSel2.value=mainK;
      updateHeroRadar();
      if(activeHeroView==='overview') renderHeroHeatmap();
    }
    refreshHeroDomain();
  });
  document.getElementById('heroDomainCompareSelect').addEventListener('change',refreshHeroDomain);

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

/* ── Draw slope chart for a specific domain inside popup (legacy — kept for compat) ── */
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

/* ── Build popup content for a specific country & domain, with optional compare ── */
function buildHeroDomainContent(domIdx,k,cmpK){
  var container=document.getElementById('heroDomainContent');
  if(!container) return;

  var dn=DOMS[domIdx];
  var nn=keysFiltered.length;
  var rd=ranks(domIdx);
  var sR=rd.s[k]||nn, zR=rd.z[k]||nn;
  var syn=synthPhrase(sR,zR);
  var hasCmp=cmpK&&cmpK!==k;

  /* ── Macro chips ── */
  var h='<div style="display:flex;gap:1rem;margin-bottom:.8rem;flex-wrap:wrap">';

  /* Rang effort */
  h+='<div class="macro-chip"><span class="macro-val" style="color:var(--gold)">'+sR+'<span style="font-size:.6rem;color:var(--muted)">e</span></span>';
  if(hasCmp){var cSR=rd.s[cmpK]||nn; h+='<span class="macro-cmp">'+D[cmpK].f+' '+cSR+'<span style="font-size:.55rem">e</span></span>';}
  h+='<span class="macro-lbl">Rang effort</span></div>';

  /* Rang bien-être */
  h+='<div class="macro-chip"><span class="macro-val" style="color:var(--green)">'+zR+'<span style="font-size:.6rem;color:var(--muted)">e</span></span>';
  if(hasCmp){var cZR=rd.z[cmpK]||nn; h+='<span class="macro-cmp">'+D[cmpK].f+' '+cZR+'<span style="font-size:.55rem">e</span></span>';}
  h+='<span class="macro-lbl">Rang bien-être</span></div>';

  /* % PIB */
  var catPib=getPIB(k,domIdx);
  var avgPib=computeEU16DomPibAvg(domIdx);
  h+='<div class="macro-chip"><span class="macro-val">'+catPib.toFixed(2)+'%</span>';
  if(hasCmp){var cPib=getPIB(cmpK,domIdx); h+='<span class="macro-cmp">'+D[cmpK].f+' '+cPib.toFixed(2)+'%</span>';}
  h+='<span class="macro-lbl">% PIB</span><span class="macro-avg">moy. '+(avgPib!=null?avgPib.toFixed(2):'—')+'%</span></div>';

  /* Z-score */
  var catZ=getZ(k,domIdx);
  var zCol=catZ>0.3?'var(--green)':catZ<-0.3?'var(--red)':'var(--sub)';
  h+='<div class="macro-chip"><span class="macro-val" style="color:'+zCol+'">'+(catZ>0?'+':'')+catZ.toFixed(2)+'</span>';
  if(hasCmp){var cZ=getZ(cmpK,domIdx);var cZCol=cZ>0.3?'var(--green)':cZ<-0.3?'var(--red)':'var(--sub)';h+='<span class="macro-cmp" style="color:'+cZCol+'">'+(cZ>0?'+':'')+cZ.toFixed(2)+'</span>';}
  h+='<span class="macro-lbl">Z-score</span></div>';
  h+='</div>';

  /* ── Synthèse phrase ── */
  var gap=sR-zR;
  var gapTxt=gap>0?'+'+gap:gap<0?''+gap:'0';
  h+='<div style="font-size:.78rem;padding:.4rem .7rem;border-radius:8px;margin-bottom:.8rem" class="psyn '+syn.cls+'">'+syn.txt+' (écart : '+gapTxt+' place'+(Math.abs(gap)>1?'s':'')+')</div>';

  if(hasCmp){
    var cGap=(rd.s[cmpK]||nn)-(rd.z[cmpK]||nn);
    var cSyn=synthPhrase(rd.s[cmpK]||nn,rd.z[cmpK]||nn);
    var cGapTxt=cGap>0?'+'+cGap:cGap<0?''+cGap:'0';
    h+='<div style="font-size:.72rem;padding:.3rem .7rem;border-radius:8px;margin-bottom:.8rem;opacity:.85" class="psyn '+cSyn.cls+'">'+D[cmpK].f+' '+D[cmpK].n+' : '+cSyn.txt+' (écart : '+cGapTxt+' place'+(Math.abs(cGap)>1?'s':'')+')</div>';
  }

  h+='<div class="hero-domain-columns">';

  /* ═══════ LEFT — COFOG (effort) ═══════ */
  h+='<div class="hero-domain-col">';
  h+='<div class="hero-domain-col-title effort">Dépenses publiques (COFOG)</div>';
  if(DCAT&&DCAT[k]&&DCAT[k][dn]&&DCAT[k][dn].length){
    DCAT[k][dn].forEach(function(cat){
      var pVal=cat.p[PI];
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

      /* Compare value */
      var cmpHtml='';
      if(hasCmp){
        var cPv=null;
        if(DCAT[cmpK]&&DCAT[cmpK][dn]){
          var cCat=DCAT[cmpK][dn].find(function(c){return c.n===cat.n});
          if(cCat) cPv=cCat.p[PI];
        }
        if(cPv!=null){
          cmpHtml='<span class="cat-m-cmp">'+D[cmpK].f+' '+cPv.toFixed(2)+'%</span>';
        }
      }

      h+='<div class="cat-measure">';
      h+='<div class="cat-m-header"><span class="cat-m-name">'+cat.n+'</span>'+deltaHtml+'</div>';
      h+='<div class="cat-m-vals">';
      h+='<span class="cat-m-country" style="color:var(--text)">'+pVal.toFixed(2)+'% PIB</span>';
      h+=cmpHtml;
      h+='<span class="cat-m-avg">moy. '+(avgP!=null?avgP.toFixed(2):'—')+'%</span>';
      h+='</div>';
      h+='<div class="cat-bar-wrap"><div class="cat-bar-track">';
      h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
      /* Compare marker on bar */
      if(hasCmp&&DCAT[cmpK]&&DCAT[cmpK][dn]){
        var cCat2=DCAT[cmpK][dn].find(function(c){return c.n===cat.n});
        if(cCat2){
          var cPv2=cCat2.p[PI];
          var cBarPct=span>0?Math.max(2,Math.min(98,((cPv2-range.min)/span)*100)):50;
          h+='<div class="cat-bar-cmp-mark" style="left:'+cBarPct+'%"></div>';
        }
      }
      h+='<div class="cat-bar-fill" style="left:0;width:'+barPct+'%;background:var(--gold);border-radius:3px"></div>';
      h+='</div></div>';
      h+='</div>';
    });
  } else {
    h+='<div style="font-size:.75rem;color:var(--muted);padding:.5rem 0">Aucune donnée COFOG</div>';
  }
  h+='</div>';

  /* ═══════ RIGHT — OCDE (bien-être) ═══════ */
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

      /* Compare value */
      var cmpHtml='';
      var cBarPct=null;
      if(hasCmp&&MDATA[cmpK]&&MDATA[cmpK][dn]){
        var cMe=MDATA[cmpK][dn].find(function(x){return x.m===me.m});
        if(cMe){
          var cV=cMe.v[PI], cZs=cMe.z[PI];
          var cHasZ=cZs!=null&&!isNaN(cZs);
          var cZC=cHasZ?(cZs>0.3?'pos':cZs<-0.3?'neg':'neu'):'neu';
          cmpHtml='<span class="cat-m-cmp '+cZC+'">'+D[cmpK].f+' '+fv(cV)+'</span>';
          if(cHasZ) cBarPct=Math.min(100,Math.max(0,(cZs+3)/6*100));
        }
      }

      h+='<div class="cat-measure">';
      h+='<div class="cat-m-header"><span class="cat-m-name">'+me.m+'</span>'+deltaHtml+'</div>';
      h+='<div class="cat-m-vals">';
      h+='<span class="cat-m-country '+zC+'">'+fv(v)+'</span>';
      h+='<span class="cat-m-unit">'+me.u+'</span>';
      h+=cmpHtml;
      h+='<span class="cat-m-avg">moy. '+fv(avg)+'</span>';
      h+='</div>';
      h+='<div class="cat-bar-wrap"><div class="cat-bar-track">';
      h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
      /* Compare marker on bar */
      if(cBarPct!=null){
        h+='<div class="cat-bar-cmp-mark" style="left:'+cBarPct+'%"></div>';
      }
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

  /* Compare legend */
  if(hasCmp){
    h+='<div class="hero-domain-cmp-legend">';
    h+='<span class="cmp-leg-item"><span class="cmp-leg-bar main"></span>'+D[k].f+' '+D[k].n+'</span>';
    h+='<span class="cmp-leg-item"><span class="cmp-leg-bar compare"></span>'+D[cmpK].f+' '+D[cmpK].n+'</span>';
    h+='<span class="cmp-leg-item"><span class="cmp-leg-mark avg"></span>Moyenne EU-'+nn+'</span>';
    h+='</div>';
  }

  container.innerHTML=h;
}

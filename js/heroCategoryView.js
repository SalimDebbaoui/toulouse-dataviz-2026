/* ================================================================
   HERO CATEGORY VIEW — Vue par catégorie (onglet principal)
   Reprend la logique de "Vue générale d'un domaine" (slope/scatter)
   mais directement en page, pas dans un popup.
   ================================================================ */

var activeCategoryDomIdx=0;
var activeHeroCatGenView='spearman';

/* ── Helper: switch to Profil pays view with a given country ── */
function switchToHeroProfil(countryKey){
  /* Set the country in the profil selector */
  var sel=document.getElementById('heroRadarSel');
  if(sel) sel.value=countryKey;

  /* Activate the "Profil pays" tab */
  activeHeroView='profil';
  document.querySelectorAll('.hero-tab').forEach(function(b){b.classList.remove('active')});
  var profilTab=document.querySelector('.hero-tab[data-hero-view="profil"]');
  if(profilTab) profilTab.classList.add('active');

  document.querySelectorAll('.hero-view-panel').forEach(function(p){p.classList.remove('active')});
  document.querySelector('.hero-view-profil').classList.add('active');

  /* Show/hide sidebars */
  var sidebarProfil=document.getElementById('heroSidebarProfil');
  var sidebarCategory=document.getElementById('heroSidebarCategory');
  if(sidebarProfil) sidebarProfil.style.display='';
  if(sidebarCategory) sidebarCategory.style.display='none';

  /* Update the radar */
  updateHeroRadar();
}

/* ── Helper: open category popup for a given country (used from category view clicks) ── */
function openCategoryPopupForCountry(countryKey){
  var domIdx=activeCategoryDomIdx;
  /* For composite (-1), fall back to profil view since popup is domain-specific */
  if(domIdx<0){
    switchToHeroProfil(countryKey);
    return;
  }
  openHeroDomainPopup(domIdx, countryKey);
}

/* ── Init category navigation (sidebar buttons for 9 domaines + composite) ── */
function initHeroCategorySelector(){
  var nav=document.getElementById('heroCategoryNav');
  if(!nav) return;

  var h='';
  for(var di=0;di<ND;di++){
    var activeClass=(di===0)?' active':'';
    h+='<button class="hero-cat-nav-btn'+activeClass+'" data-cat-idx="'+di+'">';
    h+=DOM_ICONS[di]+' '+DOM_LABELS[di];
    h+='</button>';
  }
  /* Indicateur Composite as last entry */
  h+='<button class="hero-cat-nav-btn" data-cat-idx="-1">';
  h+='📊 Indicateur Composite';
  h+='<span class="composite-info-icon composite-info-icon--inline" title="L\'indicateur composite somme uniformément les 9 domaines. Il est hautement corrélé positivement à la satisfaction à l\'égard de la vie (ρ = 0,93 Spearman ; r = 0,88 Pearson).">ⓘ</span>';
  h+='</button>';

  nav.innerHTML=h;

  nav.querySelectorAll('.hero-cat-nav-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      nav.querySelectorAll('.hero-cat-nav-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      activeCategoryDomIdx=parseInt(btn.getAttribute('data-cat-idx'));
      renderHeroCategoryView();
    });
  });
}

/* ── Render the full category view ── */
function renderHeroCategoryView(){
  var container=document.querySelector('.hero-category-wrap');
  if(!container) return;

  var domIdx=activeCategoryDomIdx;
  var nn=keysFiltered.length;
  var rd=ranks(domIdx);
  var rho=spearman(rd);
  var cl=corrLabel(rho,'Effort et rang bien-être');

  /* Pearson */
  var pts=keysFiltered.map(function(k){
    return{x:(domIdx===-1?totalPIB(k):getPIB(k,domIdx)),y:(domIdx===-1?avgZ(k):getZ(k,domIdx))};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR,'Effort et score bien-être');

  var avgPib=(domIdx===-1)?null:computeEU16DomPibAvg(domIdx);

  activeHeroCatGenView='spearman';

  var h='';

  /* Toggle buttons: Rangs (Spearman) / Valeurs (Pearson) */
  h+='<div class="hero-dom-gen-toggle" id="heroCatGenToggle">';

  h+='<button class="hero-dom-gen-vbtn active" data-heroCatGen-view="spearman">';
  h+='<span class="slope-vbtn-badge" style="color:'+corrClsColor(cl.cls)+'">ρ='+(rho!==null?rho.toFixed(2):'—')+'</span>';
  h+='<span class="slope-vbtn-info">';
  h+='<span class="slope-vbtn-label">Rangs (Spearman)</span>';
  h+='<span class="slope-vbtn-desc" style="color:'+corrClsColor(cl.cls)+'">'+cl.txt+'</span>';
  h+='</span>';
  h+='</button>';

  h+='<button class="hero-dom-gen-vbtn" data-heroCatGen-view="pearson">';
  h+='<span class="slope-vbtn-badge" style="color:'+corrClsColor(pLbl.cls)+'">r='+(pR!==null?pR.toFixed(2):'—')+'</span>';
  h+='<span class="slope-vbtn-info">';
  h+='<span class="slope-vbtn-label">Valeurs (Pearson)</span>';
  h+='<span class="slope-vbtn-desc" style="color:'+corrClsColor(pLbl.cls)+'">'+pLbl.txt+'</span>';
  h+='</span>';
  h+='</button>';

  h+='</div>';

  /* Avg PIB chip (only for individual domains) */
  if(domIdx>=0 && avgPib!=null){
    h+='<div style="text-align:center;margin:.4rem 0 .2rem">';
    h+='<span style="font-size:.7rem;color:var(--muted)">Dépenses moy. : </span>';
    h+='<span style="font-size:.78rem;font-weight:600;color:var(--text)">'+avgPib.toFixed(2)+'% du PIB</span>';
    h+='</div>';
  }

  /* Dual panels: slope (spearman) + scatter (pearson) */
  h+='<div class="hero-dom-gen-dual-wrap">';

  h+='<div class="hero-dom-gen-panel hero-dom-gen-panel-cat-spearman active">';
  h+='<svg id="heroCatSlopeChart" viewBox="0 0 780 440" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:780px"></svg>';
  h+='</div>';

  h+='<div class="hero-dom-gen-panel hero-dom-gen-panel-cat-pearson">';
  h+='<svg id="heroCatScatterChart" viewBox="0 0 780 440" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:780px"></svg>';
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
      var view=btn.getAttribute('data-heroCatGen-view');
      if(view===activeHeroCatGenView) return;
      activeHeroCatGenView=view;
      container.querySelectorAll('.hero-dom-gen-vbtn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      container.querySelectorAll('.hero-dom-gen-panel').forEach(function(p){p.classList.remove('active')});
      if(view==='spearman') container.querySelector('.hero-dom-gen-panel-cat-spearman').classList.add('active');
      else container.querySelector('.hero-dom-gen-panel-cat-pearson').classList.add('active');
      if(view==='pearson') drawHeroCatScatter(domIdx);
    });
  });

  /* Draw slope chart */
  setTimeout(function(){drawHeroCatSlope(domIdx)},30);
}

/* ── Slope chart for category view ── */
function drawHeroCatSlope(domIdx){
  var svg=d3.select('#heroCatSlopeChart');
  if(svg.empty()) return;
  svg.selectAll('*').remove();

  var W=780, H=440, ML=140, MR=140, MT=16, MB=10;
  var nn=keysFiltered.length;
  var slpW=W-ML-MR, slpH=H-MT-MB;
  var g=svg.append('g').attr('transform','translate('+ML+','+MT+')');
  var yScale=d3.scaleLinear().domain([1,nn]).range([6,slpH-6]);

  var rd=ranks(domIdx);
  var domLabel=(domIdx===-1)?'Indicateur Composite':DOM_LABELS[domIdx];
  var leftLabel=(domIdx===-1)?'Rang effort (% PIB composite)':'Rang effort (% PIB)';
  var rightLabel=(domIdx===-1)?'Rang bien-être composite':'Rang bien-être';

  /* Selected country from Profil pays */
  var heroSel=document.getElementById('heroRadarSel');
  var selectedK=heroSel?heroSel.value:'';

  /* Grid */
  for(var i=1;i<=nn;i++){
    g.append('line').attr('x1',0).attr('x2',slpW)
      .attr('y1',yScale(i)).attr('y2',yScale(i))
      .attr('stroke','rgba(255,255,255,.025)');
  }

  g.append('text').attr('x',0).attr('y',-6).attr('text-anchor','middle')
    .attr('font-size','8').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text(leftLabel);
  g.append('text').attr('x',slpW).attr('y',-6).attr('text-anchor','middle')
    .attr('font-size','8').attr('fill','var(--muted)').attr('font-family','DM Sans,sans-serif')
    .text(rightLabel);

  /* Draw non-selected countries first, then selected on top */
  var sorted=keysFiltered.slice().sort(function(a,b){
    return (a===selectedK?1:0)-(b===selectedK?1:0);
  });

  sorted.forEach(function(k){
    var sR=rd.s[k]||1, zR=rd.z[k]||1;
    var df=sR-zR;
    var y1=yScale(sR), y2=yScale(zR);
    var isSelected=(k===selectedK);
    var col=df>0?'var(--green)':df<0?'var(--red)':'var(--dim)';
    var baseW=isSelected?2:1.4;
    var sw=Math.max(baseW,Math.min(4,Math.abs(df)/3+baseW));
    var op=isSelected?0.9:0.5;

    var grp=g.append('g').style('opacity',op).style('cursor','pointer');

    grp.append('path')
      .attr('d','M0,'+y1+' C'+slpW*.35+','+y1+' '+slpW*.65+','+y2+' '+slpW+','+y2)
      .attr('fill','none').attr('stroke',col).attr('stroke-width',sw).attr('stroke-linecap','round');
    grp.append('circle').attr('cx',0).attr('cy',y1).attr('r',isSelected?4.5:4).attr('fill',col);
    grp.append('circle').attr('cx',slpW).attr('cy',y2).attr('r',isSelected?4.5:4).attr('fill',col);

    grp.append('text').attr('x',-7).attr('y',y1+4).attr('text-anchor','end')
      .attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',isSelected?'var(--text)':'var(--sub)').attr('font-weight',isSelected?'500':'400')
      .text(sR+'. '+D[k].f+' '+D[k].n);
    grp.append('text').attr('x',slpW+7).attr('y',y2+4)
      .attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',isSelected?'var(--text)':'var(--sub)').attr('font-weight',isSelected?'500':'400')
      .text(zR+'. '+D[k].f+' '+D[k].n);

    (function(kk,sRank,zRank,isS,baseOp2){
      var hDf=sRank-zRank;
      var hCol=hDf>0?'var(--green)':hDf<0?'var(--red)':'var(--dim)';
      grp.on('mouseover',function(ev){
        grp.transition().duration(150).style('opacity',1);
        if(!isS){grp.select('path').attr('stroke',hCol).attr('stroke-width',sw+1);grp.selectAll('circle').attr('fill',hCol).attr('r',5);}
        var diffTxt=hDf>0?'+'+hDf:hDf<0?''+hDf:'0';
        var diffCol=hDf>0?'var(--green)':hDf<0?'var(--red)':'var(--sub)';
        var pibVal=(domIdx===-1)?totalPIB(kk):getPIB(kk,domIdx);
        var zVal=(domIdx===-1)?avgZ(kk):getZ(kk,domIdx);
        var hh='<h4>'+D[kk].f+' '+D[kk].n+' — '+domLabel+'</h4>';
        hh+='<div class="trow"><span>% PIB</span><span class="tv">'+pibVal.toFixed(2)+'%</span></div>';
        hh+='<div class="trow"><span>Z-score</span><span class="tv">'+(zVal>0?'+':'')+zVal.toFixed(2)+'</span></div>';
        hh+='<hr class="tsep">';
        hh+='<div class="trow"><span>Rang effort</span><span class="tv">'+sRank+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+zRank+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
        document.getElementById('tooltip').innerHTML=hh;
        document.getElementById('tooltip').style.display='block';
        moveTT(ev);
      }).on('mousemove',moveTT).on('mouseout',function(){
        if(!isS){grp.transition().duration(150).style('opacity',baseOp2);grp.select('path').attr('stroke',col).attr('stroke-width',sw);grp.selectAll('circle').attr('fill',col).attr('r',4);}
        hideTT();
      }).on('click',function(){
        hideTT();
        openCategoryPopupForCountry(kk);
      });
    })(k,sR,zR,isSelected,op);
  });
}

/* ── Scatter chart (Pearson) for category view ── */
function drawHeroCatScatter(domIdx){
  var svg=d3.select('#heroCatScatterChart');
  if(svg.empty()) return;
  svg.selectAll('*').remove();

  var W=780, H=440, ML=70, MR=30, MT=28, MB=50;
  var sW=W-ML-MR, sH=H-MT-MB;
  var g=svg.append('g').attr('transform','translate('+ML+','+MT+')');

  var domLabel=(domIdx===-1)?'Indicateur Composite':DOM_LABELS[domIdx];

  var pts=keysFiltered.map(function(k){
    var xv=(domIdx===-1)?totalPIB(k):getPIB(k,domIdx);
    var yv=(domIdx===-1)?avgZ(k):getZ(k,domIdx);
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
  var pLbl=pearsonLabel(pR,'Effort et score bien-être');
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
  var rdDom=ranks(domIdx);
  var nn=keysFiltered.length;
  var heroSel2=document.getElementById('heroRadarSel');
  var selectedK2=heroSel2?heroSel2.value:'';

  pts.forEach(function(pd){
    (function(pd){
      var sR=rdDom.s[pd.k]||1, zR=rdDom.z[pd.k]||1;
      var col=sR>zR?'var(--green)':sR<zR?'var(--red)':'var(--dim)';
      var hero=(pd.k===selectedK2);
      var dg=g.append('g').style('cursor','pointer');
      dg.append('circle')
        .attr('cx',xS(pd.x)).attr('cy',yS(pd.y)).attr('r',hero?6.5:6)
        .attr('fill',col).attr('opacity',hero?.9:.7)
        .attr('stroke',hero?'rgba(255,255,255,.3)':'none').attr('stroke-width','1.2');

      var lx=xS(pd.x)+10, ly=yS(pd.y)+4;
      var anchor='start';
      if(xS(pd.x)>sW*0.82){lx=xS(pd.x)-10;anchor='end';}
      dg.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor',anchor)
        .attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
        .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'500':'400')
        .text(D[pd.k].f+' '+D[pd.k].n);

      dg.on('mouseover',function(ev){
        dg.select('circle').attr('r',8).attr('opacity',1);
        var diff=sR-zR;
        var diffTxt=diff>0?'+'+diff:diff<0?''+diff:'0';
        var diffCol=diff>0?'var(--green)':diff<0?'var(--red)':'var(--sub)';
        var hh='<h4>'+D[pd.k].f+' '+D[pd.k].n+' — '+domLabel+'</h4>';
        hh+='<div class="trow"><span>% PIB</span><span class="tv">'+pd.x.toFixed(2)+'%</span></div>';
        hh+='<div class="trow"><span>Z-score</span><span class="tv">'+(pd.y>0?'+':'')+pd.y.toFixed(2)+'</span></div>';
        hh+='<hr class="tsep">';
        hh+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Rang bien-être</span><span class="tv">'+zR+'/'+nn+'</span></div>';
        hh+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
        document.getElementById('tooltip').innerHTML=hh;
        document.getElementById('tooltip').style.display='block';
        moveTT(ev);
      }).on('mousemove',moveTT).on('mouseout',function(){
        dg.select('circle').attr('r',hero?6.5:6).attr('opacity',hero?.9:.7);
        hideTT();
      }).on('click',function(){
        hideTT();
        openCategoryPopupForCountry(pd.k);
      });
    })(pd);
  });
}

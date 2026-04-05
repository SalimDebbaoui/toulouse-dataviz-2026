/* ================================================================
   SLOPE COMPOSITE EFFORT vs BIEN-ÊTRE
   Slope chart (Spearman) + Scatter plot (Pearson)
   Compares total PIB composite rank ↔ Indicateur Composite rank
   ================================================================ */

var sceSlpG, sceSlpY, sceSlpW, sceSlpH, SCE_SLP_ML=155, SCE_SLP_MR=155, SCE_SLP_MT=10, SCE_SLP_MB=10;
var sceSctG;
var SCE_SCT_ML=70, SCE_SCT_MR=30, SCE_SCT_MT=28, SCE_SCT_MB=50;
var SCE_SCT_W=920-70-30, SCE_SCT_H=540-28-50;
var activeSCEView='spearman';

function initSlopeCompositeEffort(){
  /* ── Init slope chart SVG ── */
  var svg=d3.select('#sceSlopeChart');
  var nk=keysFiltered.length;
  sceSlpW=920-SCE_SLP_ML-SCE_SLP_MR;
  sceSlpH=540-SCE_SLP_MT-SCE_SLP_MB;
  sceSlpG=svg.append('g').attr('transform','translate('+SCE_SLP_ML+','+SCE_SLP_MT+')');
  sceSlpY=d3.scaleLinear().domain([1,nk]).range([8,sceSlpH-8]);

  /* Grid lines */
  for(var i=1;i<=nk;i++){
    sceSlpG.append('line').attr('x1',0).attr('x2',sceSlpW)
      .attr('y1',sceSlpY(i)).attr('y2',sceSlpY(i))
      .attr('stroke','rgba(255,255,255,.025)');
  }

  /* Slope lines for each country — dom=-1 = composite */
  var r=ranks(-1);
  keysFiltered.forEach(function(k){
    var sR=r.s[k]||1, zR=r.z[k]||1;
    var df=sR-zR;
    var y1=sceSlpY(sR), y2=sceSlpY(zR);
    var col=df>0?'var(--green)':df<0?'var(--red)':'var(--dim)';
    var hero=(k==='FR'||k==='NL'||k==='GR'||k==='FI');
    var baseW=hero?2.5:1.2;
    var sw=Math.max(baseW,Math.min(hero?5:3.5,Math.abs(df)/(hero?2:3)+baseW));
    var op=hero?1:0.45;

    var g=sceSlpG.append('g').attr('class','sce-slp-g').style('cursor','pointer').style('opacity',op);
    g.datum(k);

    g.append('path').attr('class','slope')
      .attr('d','M0,'+y1+' C'+sceSlpW*.35+','+y1+' '+sceSlpW*.65+','+y2+' '+sceSlpW+','+y2)
      .attr('fill','none').attr('stroke',col).attr('stroke-width',sw).attr('stroke-linecap','round');
    g.append('circle').attr('cx',0).attr('cy',y1).attr('r',hero?4.5:3).attr('fill',col);
    g.append('circle').attr('cx',sceSlpW).attr('cy',y2).attr('r',hero?4.5:3).attr('fill',col);
    g.append('text').attr('x',-7).attr('y',y1+4).attr('text-anchor','end')
      .attr('font-size',hero?'11px':'9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
      .text(sR+'. '+D[k].f+' '+D[k].n);
    g.append('text').attr('x',sceSlpW+7).attr('y',y2+4)
      .attr('font-size',hero?'11px':'9.5px').attr('font-family','DM Sans,sans-serif')
      .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
      .text(sR===zR?'':zR+'. '+D[k].f+' '+D[k].n);

    g.on('mouseover',function(ev){
      sceSlopeHighlight(k,true);
      showSCETooltip(ev,k);
    }).on('mousemove',moveTT).on('mouseout',function(){
      sceSlopeHighlight(k,false);hideTT();
    }).on('click',function(){showPopup(k)});
  });

  /* ── Init scatter chart SVG ── */
  sceSctG=d3.select('#sceScatterChart').append('g')
    .attr('transform','translate('+SCE_SCT_ML+','+SCE_SCT_MT+')');
  renderSCEScatter();

  /* ── Init toggle ── */
  initSCEToggle();

  /* ── Update badge values ── */
  updateSCEToggleBadges();

  /* ── Observer for fade-in ── */
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:0.12});
  var el=document.getElementById('slopeCompositeEffort');
  if(el) obs.observe(el);
}

/* ── Highlight on hover ── */
function sceSlopeHighlight(k,on){
  sceSlpG.selectAll('.sce-slp-g').each(function(k2){
    d3.select(this).transition().duration(200).style('opacity',on?(k2===k?1:0.08):null);
  });
}

/* ── Tooltip specific to composite effort vs well-being ── */
function showSCETooltip(ev,k){
  var tt=document.getElementById('tooltip');
  var r=ranks(-1);
  var sR=r.s[k]||1, zR=r.z[k]||1, nn=keysFiltered.length;
  var syn=synthPhrase(sR,zR);
  var h='<h4>'+D[k].f+' '+D[k].n+'</h4>';
  h+='<div class="trow"><span>Rang effort composite</span><span class="tv">'+sR+'/'+nn+'</span></div>';
  h+='<div class="trow"><span>Rang bien-être composite</span><span class="tv">'+zR+'/'+nn+'</span></div>';
  h+='<hr class="tsep">';
  var diff=sR-zR;
  var diffTxt=diff>0?'+'+diff:diff<0?''+diff:'0';
  var diffCol=diff>0?'var(--green)':diff<0?'var(--red)':'var(--sub)';
  h+='<div class="trow"><span>Écart</span><span class="tv" style="color:'+diffCol+'">'+diffTxt+'</span></div>';
  var pibC=totalPIB(k);
  h+='<div class="trow"><span>% PIB composite</span><span class="tv">'+pibC.toFixed(1)+'%</span></div>';
  var zComp=avgZ(k);
  h+='<div class="trow"><span>Z-score composite</span><span class="tv">'+(zComp>0?'+':'')+zComp.toFixed(2)+'</span></div>';
  h+='<div class="tsyn '+syn.cls+'">'+syn.txt+'</div>';
  tt.innerHTML=h;tt.style.display='block';moveTT(ev);
}

/* ── Toggle between Spearman / Pearson ── */
function initSCEToggle(){
  var btns=document.querySelectorAll('.sce-vbtn');
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-sce-view');
      if(view===activeSCEView) return;
      activeSCEView=view;
      btns.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      document.querySelectorAll('.sce-panel').forEach(function(p){p.classList.remove('active')});
      document.querySelector('.sce-panel-'+view).classList.add('active');
    });
  });
}

function updateSCEToggleBadges(){
  var badgeRho=document.getElementById('sceToggleBadgeRho');
  var badgeR=document.getElementById('sceToggleBadgeR');
  var descRho=document.getElementById('sceToggleDescRho');
  var descR=document.getElementById('sceToggleDescR');
  if(!badgeRho||!badgeR) return;

  /* Spearman */
  var r=ranks(-1);
  var rho=spearman(r);
  var cl=corrLabel(rho);
  badgeRho.textContent=(rho!==null?'ρ='+rho.toFixed(2):'—');
  badgeRho.style.color=corrClsColor(cl.cls);
  if(descRho){descRho.textContent=cl.txt;descRho.style.color=corrClsColor(cl.cls);}

  /* Pearson: totalPIB vs avgZ */
  var pts=keysFiltered.map(function(k){
    return{x:totalPIB(k),y:avgZ(k)};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  badgeR.textContent=(pR!==null?'r='+pR.toFixed(2):'—');
  badgeR.style.color=corrClsColor(pLbl.cls);
  if(descR){descR.textContent=pLbl.txt;descR.style.color=corrClsColor(pLbl.cls);}
}

/* ══════════════════════════════════════
   SCATTER — Composite PIB vs Composite Z-score
   ══════════════════════════════════════ */
function renderSCEScatter(){
  sceSctG.selectAll('*').remove();

  var pts=keysFiltered.map(function(k){
    var xv=totalPIB(k);
    var yv=avgZ(k);
    return{k:k,x:xv,y:yv};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});

  if(pts.length<3) return;

  var xE=[d3.min(pts,function(d){return d.x}),d3.max(pts,function(d){return d.x})];
  var yE=[d3.min(pts,function(d){return d.y}),d3.max(pts,function(d){return d.y})];
  var xP=(xE[1]-xE[0])*0.15||0.3, yP=(yE[1]-yE[0])*0.15||0.3;

  var xS=d3.scaleLinear().domain([xE[0]-xP,xE[1]+xP]).range([0,SCE_SCT_W]);
  var yS=d3.scaleLinear().domain([yE[0]-yP,yE[1]+yP]).range([SCE_SCT_H,0]);

  /* Axes */
  sceSctG.append('g').attr('class','ss-axis').attr('transform','translate(0,'+SCE_SCT_H+')')
    .call(d3.axisBottom(xS).ticks(7).tickFormat(function(d){return d.toFixed(1)+'%'}));
  sceSctG.append('g').attr('class','ss-axis')
    .call(d3.axisLeft(yS).ticks(6).tickFormat(function(d){return d>0?'+'+d.toFixed(1):d.toFixed(1)}));

  /* Axis labels */
  sceSctG.append('text').attr('x',SCE_SCT_W/2).attr('y',SCE_SCT_H+42)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Dépenses publiques composites (% du PIB)');
  sceSctG.append('text').attr('transform','rotate(-90)').attr('x',-SCE_SCT_H/2).attr('y',-50)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Z-score bien-être composite');

  /* Zero line (horizontal) */
  var y0=yS(0);
  if(y0>0&&y0<SCE_SCT_H){
    sceSctG.append('line').attr('x1',0).attr('x2',SCE_SCT_W).attr('y1',y0).attr('y2',y0)
      .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','3,3');
    sceSctG.append('text').attr('x',SCE_SCT_W+6).attr('y',y0+3)
      .attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('moy.');
  }

  /* Trend line (OLS) */
  var n=pts.length,sx=0,sy=0,sxy=0,sxx=0;
  pts.forEach(function(d){sx+=d.x;sy+=d.y;sxy+=d.x*d.y;sxx+=d.x*d.x});
  var tslp=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  var tint=(sy-tslp*sx)/n;
  var lx0=xE[0]-xP, lx1=xE[1]+xP;
  sceSctG.append('line')
    .attr('x1',xS(lx0)).attr('x2',xS(lx1))
    .attr('y1',yS(tslp*lx0+tint)).attr('y2',yS(tslp*lx1+tint))
    .attr('stroke','rgba(255,255,255,.22)').attr('stroke-dasharray','5,4').attr('stroke-width',1.5);

  /* Pearson r badge */
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  var rStr='r = '+(pR!==null?pR.toFixed(2):'—');

  var badgeG=sceSctG.append('g').attr('transform','translate('+(SCE_SCT_W-8)+',4)');
  badgeG.append('text').attr('text-anchor','end').attr('y',0)
    .attr('fill',corrClsColor(pLbl.cls))
    .attr('font-size','14px').attr('font-family','Fraunces,Georgia,serif').attr('font-weight','800')
    .text(rStr);
  badgeG.append('text').attr('text-anchor','end').attr('y',16)
    .attr('fill','var(--sub)').attr('font-size','9px').attr('font-family','DM Sans,sans-serif')
    .text(pLbl.txt);

  /* Dots */
  var rc=ranks(-1);
  pts.forEach(function(pd){
    (function(pd){
      var sR=rc.s[pd.k]||1, zR=rc.z[pd.k]||1;
      var col=sR>zR?'var(--green)':sR<zR?'var(--red)':'var(--dim)';
      var hero=(pd.k==='FR'||pd.k==='NL'||pd.k==='GR'||pd.k==='FI');
      var g=sceSctG.append('g').style('cursor','pointer');
      g.append('circle')
        .attr('cx',xS(pd.x)).attr('cy',yS(pd.y)).attr('r',hero?7:5)
        .attr('fill',col).attr('opacity',hero?1:.65)
        .attr('stroke',hero?'rgba(255,255,255,.35)':'none').attr('stroke-width','1.5');

      var lx=xS(pd.x)+10, ly=yS(pd.y)+4;
      var anchor='start';
      if(xS(pd.x)>SCE_SCT_W*0.82){lx=xS(pd.x)-10;anchor='end';}
      g.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor',anchor)
        .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
        .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
        .text(D[pd.k].f+(hero?' '+D[pd.k].n:''));

      g.on('mouseover',function(ev){showSCETooltip(ev,pd.k)})
       .on('mousemove',moveTT).on('mouseout',hideTT)
       .on('click',function(){showPopup(pd.k)});
    })(pd);
  });
}

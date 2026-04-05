/* ================================================================
   DASHBOARD — Section 5 : Exploration interactive
   Même layout que les slope charts précédents :
     - sidebar gauche (catégories)
     - centre : slope (Spearman) / scatter (Pearson) toggle
     - panneau droit (pondération + infos)
   ================================================================ */

var csvg,cG,cW,cH,cML=155,cMR=155,cMT=10,cMB=10;
var cYScale;
var activeDashView='spearman';
var dashSctG;
var DASH_SCT_ML=70, DASH_SCT_MR=30, DASH_SCT_MT=28, DASH_SCT_MB=50;
var DASH_SCT_W=920-70-30, DASH_SCT_H=580-28-50;

function initDashboard(){
  csvg=d3.select("#chart");
  cW=920-cML-cMR;cH=580-cMT-cMB;
  cG=csvg.append("g").attr("transform","translate("+cML+","+cMT+")");
  var nk=keysFiltered.length;
  cYScale=d3.scaleLinear().domain([1,nk]).range([8,cH-8]);

  for(var i=1;i<=nk;i++){cG.append("line").attr("x1",0).attr("x2",cW).attr("y1",cYScale(i)).attr("y2",cYScale(i)).attr("stroke","rgba(255,255,255,.025)")}

  keysFiltered.forEach(function(k){
    var g=cG.append("g").style("cursor","pointer");
    g.append("path").attr("class","slope").attr("fill","none").attr("stroke-linecap","round");
    g.append("circle").attr("class","cl").attr("r",4);
    g.append("circle").attr("class","cr").attr("r",4);
    g.append("text").attr("class","ll").attr("text-anchor","end").attr("font-size","10px").attr("font-family","DM Sans,sans-serif");
    g.append("text").attr("class","lr").attr("font-size","10px").attr("font-family","DM Sans,sans-serif");
    g.datum(k);cGs[k]=g;
    g.on("mouseover",function(ev){highlightCountry(k,true);showTooltip(ev,k,curDom)})
     .on("mousemove",moveTT)
     .on("mouseout",function(){highlightCountry(k,false);hideTT()})
     .on("click",function(){showPopup(k)});
  });

  document.querySelectorAll(".nav-item").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll(".nav-item").forEach(function(x){x.classList.remove("active")});b.classList.add("active");
    curDom=parseInt(b.getAttribute("data-dom"));focusKey=null;
    document.getElementById("weightSection").className="weight-section"+(curDom===-1||curDom===-3?" show":"");
    updateDashboard()})});

  var wsEl=document.getElementById("weightSliders");
  DOMS.forEach(function(d,i){
    var row=document.createElement("div");row.className="weight-row";
    row.innerHTML='<label title="'+DOM_LABELS[i]+'">'+DOM_LABELS[i]+'</label><input type="range" min="0" max="3" step="0.1" value="1" data-di="'+i+'"><span class="wval">1.0</span>';
    wsEl.appendChild(row);
    row.querySelector("input").addEventListener("input",function(){weights[i]=parseFloat(this.value);row.querySelector(".wval").textContent=weights[i].toFixed(1);updateDashboard()})});
  document.getElementById("resetWeights").addEventListener("click",function(){
    weights=[1,1,1,1,1,1,1,1,1];
    document.querySelectorAll("#weightSliders input").forEach(function(inp){inp.value=1;inp.parentElement.querySelector(".wval").textContent="1.0"});updateDashboard()});
  document.getElementById("weightSection").className="weight-section show";

  /* ── Init scatter chart SVG ── */
  dashSctG=d3.select('#scatterChart').append('g')
    .attr('transform','translate('+DASH_SCT_ML+','+DASH_SCT_MT+')');

  /* ── Init view toggle (Spearman / Pearson) ── */
  initDashViewToggle();

  updateDashboard();
}

/* ── Dashboard view toggle ── */
function initDashViewToggle(){
  var btns=document.querySelectorAll('.dash-vbtn');
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-dash-view');
      if(view===activeDashView) return;
      activeDashView=view;
      btns.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      document.querySelectorAll('.dash-panel').forEach(function(p){p.classList.remove('active')});
      document.querySelector('.dash-panel-'+view).classList.add('active');
      if(view==='pearson') renderDashScatter();
    });
  });
}

function updateDashToggleBadges(){
  var badgeRho=document.getElementById('dashToggleBadgeRho');
  var badgeR=document.getElementById('dashToggleBadgeR');
  var descRho=document.getElementById('dashToggleDescRho');
  var descR=document.getElementById('dashToggleDescR');
  if(!badgeRho||!badgeR) return;

  /* Spearman */
  var r=ranks(curDom);
  var rho=spearman(r);
  var cl=corrLabel(rho);
  badgeRho.textContent=(rho!==null?'ρ='+rho.toFixed(2):'—');
  badgeRho.style.color=corrClsColor(cl.cls);
  if(descRho){descRho.textContent=cl.txt;descRho.style.color=corrClsColor(cl.cls);}

  /* Pearson */
  var pts=keysFiltered.map(function(k){
    var xv;
    if(curDom===-3) xv=avgZ(k);
    else if(curDom>=0) xv=getPIB(k,curDom);
    else xv=totalPIB(k);
    var yv;
    if(curDom===-3) yv=satV(k)||0;
    else if(curDom===-2) yv=satV(k)||0;
    else if(curDom===-1) yv=avgZ(k);
    else yv=getZ(k,curDom);
    return{x:xv,y:yv};
  }).filter(function(d){return !isNaN(d.x)&&!isNaN(d.y)&&(curDom===-3||d.x>0)});
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  badgeR.textContent=(pR!==null?'r='+pR.toFixed(2):'—');
  badgeR.style.color=corrClsColor(pLbl.cls);
  if(descR){descR.textContent=pLbl.txt;descR.style.color=corrClsColor(pLbl.cls);}
}

function updateDashboard(){
  var r=ranks(curDom),rho=spearman(r),nn=keysFiltered.length;
  var dn=curDom>=0?DOM_LABELS[curDom]:curDom===-3?"Ind. Compos. VS Satisfaction":curDom===-2?"Satisfaction déclarée":"Indicateur Composite";
  document.getElementById("rpTitle").textContent=dn;
  document.getElementById("dashTitle").textContent=dn;

  var hdr=document.getElementById("chartHeaders");
  if(curDom===-3)hdr.innerHTML='<span>Rang bien-être objectif</span><span>Rang satisfaction déclarée</span>';
  else if(curDom===-2)hdr.innerHTML='<span>Rang effort (% PIB)</span><span>Rang satisfaction</span>';
  else if(curDom===-1)hdr.innerHTML='<span>Rang effort (% PIB)</span><span>Rang bien-être composite</span>';
  else hdr.innerHTML='<span>Rang effort (% du PIB)</span><span>Rang bien-être</span>';

  keysFiltered.forEach(function(k){
    var g=cGs[k];
    var sR=r.s[k]||1,zR=r.z[k]||1,y1=cYScale(sR),y2=cYScale(zR),df=sR-zR;
    var col=df>0?"var(--green)":df<0?"var(--red)":"var(--dim)";
    var hero=(k==='FR'||k==='NL'||k==='GR'||k==='FI');
    var baseW=hero?2.5:1.2;
    var sw=Math.max(baseW,Math.min(hero?5:3.5,Math.abs(df)/(hero?2:3)+baseW));
    var op=hero?1:0.45;
    g.select(".slope").transition().duration(500).attr("d","M0,"+y1+" C"+cW*.35+","+y1+" "+cW*.65+","+y2+" "+cW+","+y2).attr("stroke",col).attr("stroke-width",sw);
    g.select(".cl").transition().duration(500).attr("cx",0).attr("cy",y1).attr("fill",col).attr("r",hero?4.5:3);
    g.select(".cr").transition().duration(500).attr("cx",cW).attr("cy",y2).attr("fill",col).attr("r",hero?4.5:3);
    g.select(".ll").transition().duration(500).attr("x",-7).attr("y",y1+4)
      .text(sR+". "+D[k].f+" "+D[k].n)
      .attr("fill",hero?"var(--text)":"var(--sub)").attr("font-weight",hero?"600":"400")
      .attr("font-size",hero?"11px":"9.5px");
    g.select(".lr").transition().duration(500).attr("x",cW+7).attr("y",y2+4)
      .text(sR===zR?"":zR+". "+D[k].f+" "+D[k].n)
      .attr("fill",hero?"var(--text)":"var(--sub)").attr("font-weight",hero?"600":"400")
      .attr("font-size",hero?"11px":"9.5px");
    g.transition().duration(500).style("opacity",op);
  });

  /* Update toggle badge values */
  updateDashToggleBadges();

  /* Update right panel */
  updateRightPanel(r,rho);

  /* Update scatter if in Pearson view */
  if(activeDashView==='pearson') renderDashScatter();
}

function highlightCountry(k,on){
  keysFiltered.forEach(function(k2){
    var g=cGs[k2];if(!g)return;
    if(on){
      g.transition().duration(200).style("opacity",k2===k?1:0.08);
      if(k2===k){
        g.select(".ll").attr("font-weight","700").attr("font-size","11.5px");
        g.select(".lr").attr("font-weight","700").attr("font-size","11.5px");
      }
    }else{
      g.transition().duration(200).style("opacity",null);
      g.select(".ll").attr("font-weight",null).attr("font-size",null);
      g.select(".lr").attr("font-weight",null).attr("font-size",null);
    }
  });
}

/* ══════════════════════════════════════
   SCATTER — Dashboard Pearson panel
   ══════════════════════════════════════ */
function renderDashScatter(){
  dashSctG.selectAll('*').remove();

  var pts=keysFiltered.map(function(k){
    var xv;
    if(curDom===-3) xv=avgZ(k);
    else if(curDom>=0) xv=getPIB(k,curDom);
    else xv=totalPIB(k);
    var yv;
    if(curDom===-3) yv=satV(k)||0;
    else if(curDom===-2) yv=satV(k)||0;
    else if(curDom===-1) yv=avgZ(k);
    else yv=getZ(k,curDom);
    return{k:k,x:xv,y:yv};
  }).filter(function(d){return !isNaN(d.x)&&!isNaN(d.y)&&(curDom===-3||d.x>0)});

  if(pts.length<3) return;

  var xE=[d3.min(pts,function(d){return d.x}),d3.max(pts,function(d){return d.x})];
  var yE=[d3.min(pts,function(d){return d.y}),d3.max(pts,function(d){return d.y})];
  var xP=(xE[1]-xE[0])*0.15||0.3, yP=(yE[1]-yE[0])*0.15||0.3;

  var xS=d3.scaleLinear().domain([xE[0]-xP,xE[1]+xP]).range([0,DASH_SCT_W]);
  var yS=d3.scaleLinear().domain([yE[0]-yP,yE[1]+yP]).range([DASH_SCT_H,0]);

  /* Axes */
  dashSctG.append('g').attr('class','ss-axis').attr('transform','translate(0,'+DASH_SCT_H+')')
    .call(d3.axisBottom(xS).ticks(7).tickFormat(function(d){
      if(curDom===-3) return d>0?'+'+d.toFixed(1):d.toFixed(1);
      return (curDom>=0?d.toFixed(1):d.toFixed(0))+'%';
    }));
  dashSctG.append('g').attr('class','ss-axis')
    .call(d3.axisLeft(yS).ticks(6).tickFormat(function(d){
      if(curDom===-2||curDom===-3) return d.toFixed(1);
      return d>0?'+'+d.toFixed(1):d.toFixed(1);
    }));

  /* Axis labels */
  var xLabel=curDom===-3?'Z-score bien-être composite':'Dépenses publiques (% du PIB)';
  var yLabel=curDom===-2?'Satisfaction (/ 10)':curDom===-3?'Satisfaction déclarée (/10)':'Z-score bien-être';
  dashSctG.append('text').attr('x',DASH_SCT_W/2).attr('y',DASH_SCT_H+42)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text(xLabel);
  dashSctG.append('text').attr('transform','rotate(-90)').attr('x',-DASH_SCT_H/2).attr('y',-50)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text(yLabel);

  /* Zero line */
  if(curDom!==-2 && curDom!==-3){
    var y0=yS(0);
    if(y0>0&&y0<DASH_SCT_H){
      dashSctG.append('line').attr('x1',0).attr('x2',DASH_SCT_W).attr('y1',y0).attr('y2',y0)
        .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','3,3');
      dashSctG.append('text').attr('x',DASH_SCT_W+6).attr('y',y0+3)
        .attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('moy.');
    }
  }

  /* Trend line (OLS) */
  var n=pts.length,sx=0,sy=0,sxy=0,sxx=0;
  pts.forEach(function(d){sx+=d.x;sy+=d.y;sxy+=d.x*d.y;sxx+=d.x*d.x});
  var tslp=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  var tint=(sy-tslp*sx)/n;
  var lx0=xE[0]-xP, lx1=xE[1]+xP;
  dashSctG.append('line')
    .attr('x1',xS(lx0)).attr('x2',xS(lx1))
    .attr('y1',yS(tslp*lx0+tint)).attr('y2',yS(tslp*lx1+tint))
    .attr('stroke','rgba(255,255,255,.22)').attr('stroke-dasharray','5,4').attr('stroke-width',1.5);

  /* Pearson r badge */
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  var rStr='r = '+(pR!==null?pR.toFixed(2):'—');

  var badgeG=dashSctG.append('g').attr('transform','translate('+(DASH_SCT_W-8)+',4)');
  badgeG.append('text').attr('text-anchor','end').attr('y',0)
    .attr('fill',corrClsColor(pLbl.cls))
    .attr('font-size','14px').attr('font-family','Fraunces,Georgia,serif').attr('font-weight','800')
    .text(rStr);
  badgeG.append('text').attr('text-anchor','end').attr('y',16)
    .attr('fill','var(--sub)').attr('font-size','9px').attr('font-family','DM Sans,sans-serif')
    .text(pLbl.txt);

  /* Dots */
  var rc=ranks(curDom<0?curDom:curDom);
  pts.forEach(function(pd){
    (function(pd){
      var sR=rc.s[pd.k]||1, zR=rc.z[pd.k]||1;
      var col=sR>zR?'var(--green)':sR<zR?'var(--red)':'var(--dim)';
      var hero=(pd.k==='FR'||pd.k==='NL'||pd.k==='GR'||pd.k==='FI');
      var g=dashSctG.append('g').style('cursor','pointer');
      g.append('circle')
        .attr('cx',xS(pd.x)).attr('cy',yS(pd.y)).attr('r',hero?7:5)
        .attr('fill',col).attr('opacity',hero?1:.65)
        .attr('stroke',hero?'rgba(255,255,255,.35)':'none').attr('stroke-width','1.5');

      var lx=xS(pd.x)+10, ly=yS(pd.y)+4;
      var anchor='start';
      if(xS(pd.x)>DASH_SCT_W*0.82){lx=xS(pd.x)-10;anchor='end';}
      g.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor',anchor)
        .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
        .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
        .text(D[pd.k].f+(hero?' '+D[pd.k].n:''));

      g.on('mouseover',function(ev){showTooltip(ev,pd.k,curDom)})
       .on('mousemove',moveTT).on('mouseout',hideTT)
       .on('click',function(){showPopup(pd.k)});
    })(pd);
  });
}

/* ── RIGHT PANEL ── */
function updateRightPanel(r,rho){
  var nn=keysFiltered.length,cl=corrLabel(rho);

  var corrPct=rho!==null?Math.round(Math.abs(rho)*100):0;
  var corrCol=cl.cls==='hi'?'var(--green)':cl.cls==='lo'?'var(--red)':cl.cls==='mid'?'var(--gold)':'var(--dim)';
  document.getElementById("rpCorr").innerHTML=
    '<div class="rp-corr"><span class="cv '+cl.cls+'">'+(rho!==null?rho.toFixed(2):'—')+'</span><span class="ct">ρ de Spearman<br>'+cl.txt+'</span></div>'
    +'<div class="rp-corr-bar"><div class="fill" style="width:'+corrPct+'%;background:'+corrCol+'"></div></div>';

  document.getElementById('rpEff').innerHTML='';

  var best=null,worst=null,bD=0,wD=0;
  keysFiltered.forEach(function(k){var d=(r.s[k]||0)-(r.z[k]||0);if(d>bD){bD=d;best=k}if(d<wD){wD=d;worst=k}});
  var h="";
  if(best){h+='<div class="rp-card green"><h4>'+D[best].f+" "+D[best].n+'</h4><p>Effort '+r.s[best]+'/'+nn+' → Résultat '+r.z[best]+'/'+nn+'. Gagne '+bD+' place'+(bD>1?'s':'')+'</p></div>'}
  if(worst){h+='<div class="rp-card red"><h4>'+D[worst].f+" "+D[worst].n+'</h4><p>Effort '+r.s[worst]+'/'+nn+' → Résultat '+r.z[worst]+'/'+nn+'. Perd '+Math.abs(wD)+' place'+(Math.abs(wD)>1?'s':'')+'</p></div>'}
  if(D["FR"]&&r.s["FR"]){var fs=r.s["FR"],fz=r.z["FR"],fd=fs-fz;
    var ftxt=fd>0?"Gagne "+fd+" place"+(fd>1?"s":""):fd<0?"Perd "+Math.abs(fd)+" place"+(Math.abs(fd)>1?"s":""):"Même rang";
    h+='<div class="rp-card purple"><h4>'+D["FR"].f+' France</h4><p>Effort '+fs+'/'+nn+' → Résultat '+fz+'/'+nn+'. '+ftxt+'</p></div>'}
  document.getElementById("rpCards").innerHTML=h;

  var me=document.getElementById("rpMeasures");
  if(curDom>=0){
    var dnn=DOMS[curDom],avg={};
    if(MDATA){keysFiltered.forEach(function(k){if(MDATA[k]&&MDATA[k][dnn])MDATA[k][dnn].forEach(function(m){
      if(!avg[m.m])avg[m.m]={s:0,c:0};var v=m.v[PI];if(v!=null&&!isNaN(v)){avg[m.m].s+=v;avg[m.m].c++}})})}
    var mh='<div class="rp-section-title">Indicateurs mesurés</div>';
    Object.keys(avg).forEach(function(n){var a=avg[n],v=a.c?a.s/a.c:0;
      mh+='<div class="rp-measure"><span class="mn">'+n+'</span><span class="mv">'+fv(v)+'</span></div>'});
    mh+='<div class="rp-muted">moy. UE-'+keysFiltered.length+'</div>';

    if(DCAT){var dcAvg={};keysFiltered.forEach(function(k){if(DCAT[k]&&DCAT[k][dnn])DCAT[k][dnn].forEach(function(c){
      if(!dcAvg[c.n])dcAvg[c.n]={s:0,ct:0};var v=c.p[PI];if(v!=null&&!isNaN(v)){dcAvg[c.n].s+=v;dcAvg[c.n].ct++}})});
      if(Object.keys(dcAvg).length){
        mh+='<button class="rp-toggle" onclick="this.nextElementSibling.classList.toggle(\'open\')">▸ Détail des dépenses</button>';
        mh+='<div class="rp-detail">';
        Object.keys(dcAvg).forEach(function(n){var a=dcAvg[n],v=a.ct?a.s/a.ct:0;
          mh+='<div class="rp-measure"><span class="mn">'+n+'</span><span class="mv">'+v.toFixed(2)+'% PIB</span></div>'});
        mh+='<div class="rp-muted">moy. UE-'+keysFiltered.length+'</div></div>'}}
    me.innerHTML=mh;
  }else{me.innerHTML=""}
}

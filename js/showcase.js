/* ================================================================
   SHOWCASE — Spider Chart Profil Pays (effort vs résultat)
   ================================================================ */

var spiderSvg, spiderG;
var SPIDER_W=540, SPIDER_H=500, SPIDER_CX=270, SPIDER_CY=230, SPIDER_R=170;

function initShowcase(){
  /* ── Observer pour animations d'apparition ── */
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:0.12});

  var bridge=document.getElementById('showcaseBridge');
  if(bridge) obs.observe(bridge);

  /* ── Populate dropdown (un seul, plus de comparaison) ── */
  var selL=document.getElementById('spiderSelLeft');
  if(!selL) return;

  var sorted=keysFiltered.slice().sort(function(a,b){
    return D[a].n.localeCompare(D[b].n);
  });

  sorted.forEach(function(k){
    var opt=document.createElement('option');
    opt.value=k; opt.textContent=D[k].f+' '+D[k].n;
    if(k==='FR') opt.selected=true;
    selL.appendChild(opt);
  });

  /* ── Init D3 SVG ── */
  spiderSvg=d3.select('#spiderChart');
  spiderG=spiderSvg.append('g').attr('transform','translate('+SPIDER_CX+','+SPIDER_CY+')');

  drawSpiderGrid();
  updateSpiderChart();

  /* ── Event listener ── */
  selL.addEventListener('change', updateSpiderChart);
}

/* ── Static grid: concentric rings, axes, labels ── */
function drawSpiderGrid(){
  var nn=keysFiltered.length;
  var gridG=spiderG.append('g').attr('class','spider-grid');

  /* Concentric polygons */
  [0.25,0.5,0.75,1].forEach(function(rf){
    var pts=[];
    for(var i=0;i<ND;i++){
      var a=(i/ND)*Math.PI*2-Math.PI/2;
      pts.push(Math.cos(a)*SPIDER_R*rf+','+Math.sin(a)*SPIDER_R*rf);
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
    medPts.push(Math.cos(a)*SPIDER_R*0.5+','+Math.sin(a)*SPIDER_R*0.5);
  }
  gridG.append('polygon')
    .attr('points',medPts.join(' '))
    .attr('fill','none')
    .attr('stroke','rgba(255,255,255,.08)')
    .attr('stroke-width',1)
    .attr('stroke-dasharray','3,3');

  /* Axes + labels */
  var shortLbls=['Santé','Revenus &\npatrimoine','Travail &\nemploi','Logement','Savoirs &\ncompétences','Engagement\ncivique','Liens\nsociaux','Sécurité','Qualité\nenvironnem.'];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var x2=Math.cos(a)*SPIDER_R, y2=Math.sin(a)*SPIDER_R;
    gridG.append('line')
      .attr('x1',0).attr('y1',0).attr('x2',x2).attr('y2',y2)
      .attr('stroke','rgba(255,255,255,.06)').attr('stroke-width',1);

    var xl=Math.cos(a)*(SPIDER_R+38), yl=Math.sin(a)*(SPIDER_R+38);
    var anch=Math.cos(a)>0.25?'start':Math.cos(a)<-0.25?'end':'middle';
    var lines=shortLbls[i].split('\n');
    var txt=gridG.append('text')
      .attr('x',xl).attr('y',yl)
      .attr('text-anchor',anch)
      .attr('font-size','11.5')
      .attr('fill','rgba(156,163,191,.7)')
      .attr('font-family','DM Sans,sans-serif');
    lines.forEach(function(line,li){
      txt.append('tspan')
        .attr('x',xl)
        .attr('dy',li===0?'0.3em':'1.15em')
        .text(line);
    });
  }

  /* Rank hints */
  gridG.append('text').attr('x',4).attr('y',-SPIDER_R-8)
    .attr('text-anchor','middle').attr('font-size','9')
    .attr('fill','rgba(156,163,191,.45)').attr('font-family','DM Sans,sans-serif')
    .text('1er (meilleur)');
  gridG.append('text').attr('x',4).attr('y',6)
    .attr('text-anchor','middle').attr('font-size','8.5')
    .attr('fill','rgba(156,163,191,.3)').attr('font-family','DM Sans,sans-serif')
    .text(nn+'e');
}

/* ── Update spider chart data layer + composite panel ── */
function updateSpiderChart(){
  var k1=document.getElementById('spiderSelLeft').value;
  var nn=keysFiltered.length;

  /* Remove old data layers */
  spiderG.selectAll('.spider-data').remove();
  var dataG=spiderG.append('g').attr('class','spider-data');

  function rankToR(rank){
    return SPIDER_R * Math.max(0.06, 1-(rank-1)/(nn-1));
  }
  function angleFor(i){
    return (i/ND)*Math.PI*2-Math.PI/2;
  }

  /* ── Draw a polygon + dots for one series ── */
  function drawPoly(key, getRank, color, fillAlpha, dashed, strokeW, dotR, delay){
    var pts=[];
    for(var i=0;i<ND;i++){
      var a=angleFor(i);
      var rd=ranks(i);
      var rank=getRank(rd,key);
      var r=rankToR(rank);
      pts.push({x:Math.cos(a)*r, y:Math.sin(a)*r, rank:rank, di:i});
    }

    /* Polygon */
    var polyStr=pts.map(function(p){return p.x+','+p.y}).join(' ');
    var fillCol=color.indexOf('#')===0
      ? 'rgba('+parseInt(color.slice(1,3),16)+','+parseInt(color.slice(3,5),16)+','+parseInt(color.slice(5,7),16)+','+fillAlpha+')'
      : color;

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

    /* Dots + invisible hit areas */
    pts.forEach(function(p,i){
      /* Invisible hit zone */
      dataG.append('circle')
        .attr('cx',p.x).attr('cy',p.y).attr('r',12)
        .attr('fill','transparent').attr('stroke','none')
        .style('cursor','default')
        .on('mouseover',function(ev){
          var rd2=ranks(p.di);
          var sR=rd2.s[key]||nn, zR=rd2.z[key]||nn;
          var diff=sR-zR;
          var diffTxt=diff>0?'<span style="color:var(--green)">+'+diff+'</span>':diff<0?'<span style="color:var(--red)">'+diff+'</span>':'0';
          var h='<h4>'+D[key].f+' '+D[key].n+' — '+DOM_LABELS[p.di]+'</h4>';
          h+='<div class="trow"><span>Rang effort</span><span class="tv">'+sR+'/'+nn+'</span></div>';
          h+='<div class="trow"><span>Rang résultat</span><span class="tv">'+zR+'/'+nn+'</span></div>';
          h+='<hr class="tsep">';
          h+='<div class="trow"><span>Écart</span><span class="tv">'+diffTxt+'</span></div>';
          document.getElementById('tooltip').innerHTML=h;
          document.getElementById('tooltip').style.display='block';
          moveTT(ev);
        })
        .on('mousemove',moveTT)
        .on('mouseout',hideTT);

      /* Visible dot */
      dataG.append('circle')
        .attr('cx',p.x).attr('cy',p.y).attr('r',dotR)
        .attr('fill',color).attr('pointer-events','none')
        .attr('opacity',0)
        .transition().duration(400).delay(delay+120)
        .attr('opacity',1);
    });
  }

  /* ── Country: effort (orange dashed) + result (green solid) ── */
  if(k1 && D[k1]){
    drawPoly(k1, function(rd,k){return rd.s[k]||nn}, '#fb923c', 0.06, true, 1.8, 3.5, 0);
    drawPoly(k1, function(rd,k){return rd.z[k]||nn}, '#34d399', 0.10, false, 2, 3.5, 80);
  }

  /* ── Country name tag below chart ── */
  var tagY=SPIDER_R+68;
  if(k1 && D[k1]){
    dataG.append('text')
      .attr('x', 0).attr('y', tagY)
      .attr('text-anchor','middle')
      .attr('font-size','12').attr('font-weight','600')
      .attr('fill','var(--text)').attr('font-family','DM Sans,sans-serif')
      .text(D[k1].f+' '+D[k1].n)
      .attr('opacity',0).transition().duration(400).attr('opacity',1);
  }

  /* ── Update composite panel ── */
  updateCompositePanel(k1);
}

/* ── Composite panel (right side of the spider chart) ── */
function updateCompositePanel(k){
  var panel=document.getElementById('spiderCompositePanel');
  if(!panel) return;
  if(!k || !D[k]){panel.innerHTML='';return;}

  var nn=keysFiltered.length;
  var rc=ranks(-1); /* composite ranks */
  var effortRank=rc.s[k]||nn;
  var wellbeingRank=rc.z[k]||nn;
  var zScore=avgZ(k);
  var pibComposite=totalPIB(k);

  var zCol=zScore>0.3?'green':zScore<-0.3?'red':'blue';
  var gap=effortRank-wellbeingRank;
  var gapTxt=gap>0?'+'+gap:gap<0?''+gap:'0';
  var gapCol=gap>0?'color:var(--green)':gap<0?'color:var(--red)':'color:var(--sub)';

  var h='';

  /* Card 1: Effort Composite (classement + % PIB) */
  h+='<div class="spider-comp-card dual">';
  h+='<div class="comp-label">Effort Composite</div>';
  h+='<div class="comp-dual-row">';
  h+='<div class="comp-dual-main">';
  h+='<div class="comp-value gold">'+effortRank+'<span class="comp-rank-suf">e</span><span class="comp-rank-total"> / '+nn+'</span></div>';
  h+='</div>';
  h+='<div class="comp-dual-secondary">';
  h+='<span class="comp-secondary-value purple">'+pibComposite.toFixed(1)+'<span style="font-size:.7rem">%</span></span>';
  h+='<span class="comp-secondary-label">du PIB</span>';
  h+='</div>';
  h+='</div>';
  h+='<div class="comp-sub">Classement & dépenses sur 9 domaines COFOG</div>';
  h+='</div>';

  /* Card 2: Bien-Être Composite (classement + z-score) */
  h+='<div class="spider-comp-card dual">';
  h+='<div class="comp-label">Bien-Être Composite</div>';
  h+='<div class="comp-dual-row">';
  h+='<div class="comp-dual-main">';
  h+='<div class="comp-value green">'+wellbeingRank+'<span class="comp-rank-suf">e</span><span class="comp-rank-total"> / '+nn+'</span></div>';
  h+='</div>';
  h+='<div class="comp-dual-secondary">';
  h+='<span class="comp-secondary-value '+zCol+'">'+(zScore>0?'+':'')+zScore.toFixed(2)+'</span>';
  h+='<span class="comp-secondary-label">z-score</span>';
  h+='</div>';
  h+='</div>';
  h+='<div class="comp-sub">Classement & écart à la moyenne EU-'+nn+'</div>';
  h+='</div>';

  /* Écart de rang résumé */
  h+='<div class="spider-comp-gap" style="'+gapCol+'">';
  h+='Écart de rang : <strong>'+gapTxt+' place'+(Math.abs(gap)>1?'s':'')+'</strong>';
  h+='</div>';

  panel.innerHTML=h;
}

/* ── Mini spider chart for popup (kept for backward compat) ── */
function buildShowcaseDualRadar(k1,k2){
  var W=280,H=280,cx=W/2,cy=125,maxR=88;
  var nn=keysFiltered.length;
  var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">';

  function rankToR(rank){return maxR*Math.max(0.06,1-(rank-1)/(nn-1))}

  [0.25,0.5,0.75,1].forEach(function(rf){
    var pts=[];
    for(var i=0;i<ND;i++){var a=(i/ND)*Math.PI*2-Math.PI/2;pts.push((cx+Math.cos(a)*maxR*rf)+','+(cy+Math.sin(a)*maxR*rf))}
    svg+='<polygon points="'+pts.join(' ')+'" fill="none" stroke="rgba(255,255,255,'+(rf===1?.08:.04)+')" stroke-width="1"/>';
  });

  var shortLbls=['Santé','Rev.','Trav.','Log.','Sav.','Civ.','Soc.','Séc.','Env.'];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var x2=cx+Math.cos(a)*maxR, y2=cy+Math.sin(a)*maxR;
    svg+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    var xl=cx+Math.cos(a)*(maxR+14),yl=cy+Math.sin(a)*(maxR+14);
    var anch=Math.cos(a)>0.25?'start':Math.cos(a)<-0.25?'end':'middle';
    svg+='<text x="'+xl+'" y="'+(yl+3)+'" text-anchor="'+anch+'" font-size="8" fill="rgba(156,163,191,.6)" font-family="DM Sans,sans-serif">'+shortLbls[i]+'</text>';
  }

  var pts1=[];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i);var zR=rd.z[k1]||nn;
    pts1.push((cx+Math.cos(a)*rankToR(zR))+','+(cy+Math.sin(a)*rankToR(zR)));
  }
  svg+='<polygon points="'+pts1.join(' ')+'" fill="rgba(232,168,56,.1)" stroke="var(--gold)" stroke-width="1.6" stroke-linejoin="round"/>';

  var pts2=[];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i);var zR=rd.z[k2]||nn;
    pts2.push((cx+Math.cos(a)*rankToR(zR))+','+(cy+Math.sin(a)*rankToR(zR)));
  }
  svg+='<polygon points="'+pts2.join(' ')+'" fill="rgba(96,165,250,.1)" stroke="var(--blue)" stroke-width="1.6" stroke-linejoin="round" stroke-dasharray="5,3"/>';

  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i);
    var r1=rankToR(rd.z[k1]||nn), r2=rankToR(rd.z[k2]||nn);
    svg+='<circle cx="'+(cx+Math.cos(a)*r1)+'" cy="'+(cy+Math.sin(a)*r1)+'" r="2.5" fill="var(--gold)"/>';
    svg+='<circle cx="'+(cx+Math.cos(a)*r2)+'" cy="'+(cy+Math.sin(a)*r2)+'" r="2.5" fill="var(--blue)"/>';
  }

  var ly=H-30;
  svg+='<line x1="'+(cx-65)+'" y1="'+ly+'" x2="'+(cx-53)+'" y2="'+ly+'" stroke="var(--gold)" stroke-width="1.6"/>';
  svg+='<circle cx="'+(cx-59)+'" cy="'+ly+'" r="2" fill="var(--gold)"/>';
  svg+='<text x="'+(cx-48)+'" y="'+(ly+3)+'" font-size="8" fill="rgba(156,163,191,.8)" font-family="DM Sans,sans-serif">'+D[k1].f+' '+D[k1].n+'</text>';
  var ly2=ly+13;
  svg+='<line x1="'+(cx-65)+'" y1="'+ly2+'" x2="'+(cx-53)+'" y2="'+ly2+'" stroke="var(--blue)" stroke-width="1.6" stroke-dasharray="5,3"/>';
  svg+='<circle cx="'+(cx-59)+'" cy="'+ly2+'" r="2" fill="var(--blue)"/>';
  svg+='<text x="'+(cx-48)+'" y="'+(ly2+3)+'" font-size="8" fill="rgba(156,163,191,.8)" font-family="DM Sans,sans-serif">'+D[k2].f+' '+D[k2].n+'</text>';

  svg+='</svg>';
  return svg;
}

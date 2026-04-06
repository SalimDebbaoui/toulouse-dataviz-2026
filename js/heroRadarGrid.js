/* ================================================================
   HERO RADAR — Grille SVG (anneaux concentriques + axes + labels)
   ================================================================ */

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

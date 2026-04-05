/* ================================================================
   SLOPE STORY — Section 3 : snap-driven slope chart (4 phases)
   Phase 0 = intro text (chart hidden)
   Phase 1 = Santé   (dom 0)  — hero: FR, ES
   Phase 2 = Savoirs  (dom 4)  — hero: EE, SK, IT, GR, FI
   Phase 3 = Sécurité (dom 7)  — hero: SK, DE

   TOGGLE LAYOUT:
     Tab 1 = slope chart (ranks)  → ρ de Spearman
     Tab 2 = scatter plot (values) → r de Pearson
   ================================================================ */

var slopeG,slopeY,slopeW,slopeH,slopeML=155,slopeMR=155,slopeMT=10,slopeMB=10;
var slopeStoryPhase=-1;
var STORY_DOMS=[null,0,4,7];
var STORY_LABELS=["Introduction","Santé","Savoirs & compétences","Sécurité"];
var STORY_HERO_KEYS=[
  [],
  ['FR','ES'],
  ['EE','SK','IT','GR','FI'],
  ['SK','DE']
];
var STORY_NARRATIONS=[
  {h:"Comparons maintenant les efforts avec le bien-être pour chaque domaine",
   p:"",
   showRho:false},
  {h:"Pour le domaine Santé, les efforts sont-ils corrélés au bien-être\u00a0?",
   p:"En Santé, La <strong>France</strong>, fait le plus d'effort en dépenses publiques pour se classer 7ème en bien être. L'Espagne se classe 9ème en effort et 2ème en bien être. Malgré ces cas extrêmes, il existe une corrélation positive modérée à élevée entre effort et bien être en Santé.",
   showRho:true, rhoComment:"Faible corrélation positive"},
  {h:"Et pour Savoirs &amp; compétences\u00a0?",
   p:"Une <strong>corrélation positive forte</strong> existe entre dépenses publiques et bien-être. La <strong>Finlande</strong>, 2e en effort, est <span class='hl-g'>1ère en bien-être</span>. La<strong> République Slovaque</strong> gagne également une place. L'<strong>Italie</strong>, l'<strong>Estonie</strong>, la Grèce garde le même rang.",
   showRho:true, rhoComment:"Corrélation positive de modérée à forte"},
  {h:"Et la Sécurité\u00a0?",
   p:"Il y a une faible corrélation négative. Peut être que les pays investissant le plus en Sécurité sont justement ceux qui rencontrent des problèmes de sécurité ?",
   showRho:true, rhoComment:"Corrélation modérée négative"}
];
var slopeRanks=[];

/* ── Active slope view: 'spearman' or 'pearson' ── */
var activeSlopeView='spearman';

/* ── Slope Scatter state ── */
var ssG;
var SS_ML=70,SS_MR=30,SS_MT=28,SS_MB=50,SS_W=920-70-30,SS_H=540-28-50;

/* Helper: is this key a "hero" for the current slope phase? */
function isSlopeHero(k,phase){
  var heroes=STORY_HERO_KEYS[phase]||[];
  return heroes.indexOf(k)>=0;
}

/* ── Pearson r computation ── */
function pearsonR(pts){
  var n=pts.length;
  if(n<3) return null;
  var sx=0,sy=0;
  pts.forEach(function(d){sx+=d.x;sy+=d.y});
  var mx=sx/n, my=sy/n, num=0, dx2=0, dy2=0;
  pts.forEach(function(d){
    num+=(d.x-mx)*(d.y-my);
    dx2+=(d.x-mx)*(d.x-mx);
    dy2+=(d.y-my)*(d.y-my);
  });
  return(dx2*dy2>0)?num/Math.sqrt(dx2*dy2):0;
}

/* ── Pearson label helper ── */
function pearsonLabel(r){
  if(r===null)return{cls:'none',txt:'Non calculable'};
  var a=Math.abs(r);
  var sign=r>=0?'positiv':'négativ';
  if(a>=.8)return{cls:r>0?'hi':'lo',txt:'Très fortement corrélé '+sign+'ement'};
  if(a>=.6)return{cls:r>0?'hi':'lo',txt:'Fortement corrélé '+sign+'ement'};
  if(a>=.4)return{cls:r>0?'hi':'lo',txt:'Modérément corrélé '+sign+'ement'};
  if(a>=.2)return{cls:r<0?'lo':'mid',txt:'Faiblement corrélé '+sign+'ement'};
  return{cls:'none',txt:'Corrélation très faible / négligeable'};
}

/* ── Color helper for correlation class ── */
function corrClsColor(cls){
  if(cls==='hi')return'var(--green)';
  if(cls==='lo')return'var(--red)';
  if(cls==='mid')return'var(--gold)';
  return'var(--muted)';
}

function initSlopeStory(){
  var svg=d3.select("#slopeChart");
  var nk=keysFiltered.length;
  slopeW=920-slopeML-slopeMR;slopeH=540-slopeMT-slopeMB;
  slopeG=svg.append("g").attr("transform","translate("+slopeML+","+slopeMT+")");
  slopeY=d3.scaleLinear().domain([1,nk]).range([8,slopeH-8]);

  for(var i=1;i<=nk;i++){
    slopeG.append("line").attr("x1",0).attr("x2",slopeW).attr("y1",slopeY(i)).attr("y2",slopeY(i)).attr("stroke","rgba(255,255,255,.025)");
  }

  STORY_DOMS.forEach(function(dom){
    var useDom=(dom===null)?0:dom;
    var r=ranks(useDom),map={};
    keysFiltered.forEach(function(k){
      var sR=r.s[k]||1,zR=r.z[k]||1;
      map[k]={sR:sR,zR:zR,y1:slopeY(sR),y2:slopeY(zR)};
    });
    slopeRanks.push(map);
  });

  keysFiltered.forEach(function(k){
    var g=slopeG.append("g").attr("class","scg").style("cursor","pointer");
    g.append("path").attr("class","slope").attr("fill","none").attr("stroke-linecap","round");
    g.append("circle").attr("class","cl").attr("r",4);
    g.append("circle").attr("class","cr").attr("r",4);
    g.append("text").attr("class","ll").attr("text-anchor","end").attr("font-size","10px").attr("font-family","DM Sans,sans-serif");
    g.append("text").attr("class","lr").attr("font-size","10px").attr("font-family","DM Sans,sans-serif");
    g.datum(k);
    g.on("mouseover",function(ev){
      var ph=Math.max(1,slopeStoryPhase);
      slopeHighlight(k,true);
      showTooltip(ev,k,STORY_DOMS[ph]);
    }).on("mousemove",moveTT).on("mouseout",function(){slopeHighlight(k,false);hideTT()})
    .on("click",function(){
      var ph=Math.max(1,slopeStoryPhase);
      var dom=STORY_DOMS[ph];
      if(dom===null)return;
      curDom=dom;
      document.querySelectorAll('.nav-item').forEach(function(b){
        b.classList.remove('active');
        if(parseInt(b.getAttribute('data-dom'))===dom) b.classList.add('active');
      });
      document.getElementById('weightSection').className='weight-section'+(dom===-1||dom===-3?' show':'');
      updateDashboard();
      showPopup(k);
    });
  });

  /* ── Init slope scatter ── */
  initSlopeScatter();

  /* ── Init toggle buttons ── */
  initSlopeToggle();

  // Render initial state (phase 0 = intro, chart hidden)
  renderSlopePhase(0, false);

  // Set up IntersectionObserver on slope-phase snap sections
  var phases=document.querySelectorAll('.slope-phase');
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting && entry.intersectionRatio>=0.5){
        var phase=parseInt(entry.target.getAttribute('data-slope-phase'));
        if(phase!==slopeStoryPhase){
          slopeStoryPhase=phase;
          renderSlopePhase(phase, true);
        }
      }
    });
  },{threshold:0.5});

  phases.forEach(function(p){observer.observe(p)});
}

/* ══════════════════════════════════════════════════
   SLOPE VIEW TOGGLE — switch between Spearman / Pearson
   ══════════════════════════════════════════════════ */
function initSlopeToggle(){
  var btns=document.querySelectorAll('.slope-vbtn');
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-slope-view');
      if(view===activeSlopeView) return;
      activeSlopeView=view;
      btns.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      // Switch panels
      document.querySelectorAll('.slope-panel').forEach(function(p){p.classList.remove('active')});
      document.querySelector('.slope-panel-'+view).classList.add('active');
    });
  });
}

function updateSlopeToggleBadges(dom){
  var badgeRho=document.getElementById('slopeToggleBadgeRho');
  var badgeR=document.getElementById('slopeToggleBadgeR');
  var descRho=document.getElementById('slopeToggleDescRho');
  var descR=document.getElementById('slopeToggleDescR');
  if(!badgeRho||!badgeR) return;
  if(dom===null){
    badgeRho.textContent='';
    badgeR.textContent='';
    badgeRho.style.color='';
    badgeR.style.color='';
    if(descRho) { descRho.textContent=''; descRho.style.color=''; }
    if(descR) { descR.textContent=''; descR.style.color=''; }
    return;
  }
  // Spearman
  var r=ranks(dom);
  var rho=spearman(r);
  var cl=corrLabel(rho);
  badgeRho.textContent=(rho!==null?'ρ='+rho.toFixed(2):'—');
  badgeRho.style.color=corrClsColor(cl.cls);
  if(descRho){
    descRho.textContent=cl.txt;
    descRho.style.color=corrClsColor(cl.cls);
  }
  // Pearson
  var pts=keysFiltered.map(function(k){
    return{x:getPIB(k,dom),y:getZ(k,dom)};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  badgeR.textContent=(pR!==null?'r='+pR.toFixed(2):'—');
  badgeR.style.color=corrClsColor(pLbl.cls);
  if(descR){
    descR.textContent=pLbl.txt;
    descR.style.color=corrClsColor(pLbl.cls);
  }
}

/* ══════════════════════════════════════════════════
   SLOPE SCATTER — full-width scatter plot (Pearson r)
   ══════════════════════════════════════════════════ */
function initSlopeScatter(){
  var svg=d3.select('#slopeScatter');
  ssG=svg.append('g').attr('transform','translate('+SS_ML+','+SS_MT+')');
}

function renderSlopeScatter(dom, phase){
  ssG.selectAll('*').remove();
  if(dom===null) return;

  var pts=keysFiltered.map(function(k){
    var xv=getPIB(k,dom);
    var yv=getZ(k,dom);
    return{k:k,x:xv,y:yv};
  }).filter(function(d){return d.x>0&&!isNaN(d.y)});

  if(pts.length<3) return;

  var xE=[d3.min(pts,function(d){return d.x}),d3.max(pts,function(d){return d.x})];
  var yE=[d3.min(pts,function(d){return d.y}),d3.max(pts,function(d){return d.y})];
  var xP=(xE[1]-xE[0])*0.12||0.5, yP=(yE[1]-yE[0])*0.18||0.3;

  var xS=d3.scaleLinear().domain([xE[0]-xP,xE[1]+xP]).range([0,SS_W]);
  var yS=d3.scaleLinear().domain([yE[0]-yP,yE[1]+yP]).range([SS_H,0]);

  /* Axes */
  ssG.append('g').attr('class','ss-axis').attr('transform','translate(0,'+SS_H+')')
    .call(d3.axisBottom(xS).ticks(7).tickFormat(function(d){return d.toFixed(1)+'%'}));
  ssG.append('g').attr('class','ss-axis')
    .call(d3.axisLeft(yS).ticks(6).tickFormat(function(d){return d>0?'+'+d.toFixed(1):d.toFixed(1)}));

  /* Axis labels */
  ssG.append('text').attr('x',SS_W/2).attr('y',SS_H+42)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Dépense publique (% du PIB)');
  ssG.append('text').attr('transform','rotate(-90)').attr('x',-SS_H/2).attr('y',-50)
    .attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','10px').attr('font-family','DM Sans,sans-serif')
    .text('Z-score bien-être');

  /* Zero line */
  var y0=yS(0);
  if(y0>0&&y0<SS_H){
    ssG.append('line').attr('x1',0).attr('x2',SS_W).attr('y1',y0).attr('y2',y0)
      .attr('stroke','rgba(255,255,255,.08)').attr('stroke-dasharray','3,3');
    ssG.append('text').attr('x',SS_W+6).attr('y',y0+3)
      .attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('moy.');
  }

  /* Trend line (OLS) */
  var n=pts.length,sx=0,sy=0,sxy=0,sxx=0;
  pts.forEach(function(d){sx+=d.x;sy+=d.y;sxy+=d.x*d.y;sxx+=d.x*d.x});
  var tslp=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  var tint=(sy-tslp*sx)/n;
  var x0=xE[0]-xP, x1=xE[1]+xP;
  ssG.append('line')
    .attr('x1',xS(x0)).attr('x2',xS(x1))
    .attr('y1',yS(tslp*x0+tint)).attr('y2',yS(tslp*x1+tint))
    .attr('stroke','rgba(255,255,255,.22)').attr('stroke-dasharray','5,4').attr('stroke-width',1.5);

  /* Pearson r badge (top-right) */
  var pR=pearsonR(pts);
  var pLbl=pearsonLabel(pR);
  var rStr='r = '+(pR!==null?pR.toFixed(2):'—');

  var badgeG=ssG.append('g').attr('transform','translate('+(SS_W-8)+',4)');
  badgeG.append('text').attr('text-anchor','end').attr('y',0)
    .attr('fill',corrClsColor(pLbl.cls))
    .attr('font-size','14px').attr('font-family','Fraunces,Georgia,serif').attr('font-weight','800')
    .text(rStr);
  badgeG.append('text').attr('text-anchor','end').attr('y',16)
    .attr('fill','var(--sub)').attr('font-size','9px').attr('font-family','DM Sans,sans-serif')
    .text(pLbl.txt);

  /* Dots */
  var ranks_dom=ranks(dom);
  pts.forEach(function(pd){
    (function(pd){
      var sR=ranks_dom.s[pd.k]||1, zR=ranks_dom.z[pd.k]||1;
      var col=sR>zR?'var(--green)':sR<zR?'var(--red)':'var(--dim)';
      var hero=isSlopeHero(pd.k,phase);
      var g=ssG.append('g').style('cursor','pointer');
      g.append('circle')
        .attr('cx',xS(pd.x)).attr('cy',yS(pd.y)).attr('r',hero?7:5)
        .attr('fill',col).attr('opacity',hero?1:.65)
        .attr('stroke',hero?'rgba(255,255,255,.35)':'none').attr('stroke-width','1.5');

      var lx=xS(pd.x)+10, ly=yS(pd.y)+4;
      var anchor='start';
      if(xS(pd.x)>SS_W*0.82){lx=xS(pd.x)-10;anchor='end';}
      g.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor',anchor)
        .attr('font-size',hero?'11px':'9px').attr('font-family','DM Sans,sans-serif')
        .attr('fill',hero?'var(--text)':'var(--sub)').attr('font-weight',hero?'600':'400')
        .text(D[pd.k].f+(hero?' '+D[pd.k].n:''));

      g.on('mouseover',function(ev){
        slopeHighlight(pd.k,true);
        showTooltip(ev,pd.k,dom);
      }).on('mousemove',moveTT).on('mouseout',function(){slopeHighlight(pd.k,false);hideTT()})
      .on('click',function(){showPopup(pd.k)});
    })(pd);
  });
}

function slopeHighlight(k,on){
  slopeG.selectAll(".scg").each(function(k2){
    d3.select(this).transition().duration(200).style("opacity",on?(k2===k?1:0.08):null);
  });
}

function renderSlopePhase(phase, animate){
  var dur=animate?700:0;
  var ease=d3.easeCubicInOut;
  var cur=slopeRanks[phase];
  var isIntro=(STORY_DOMS[phase]===null);

  var headersEl=document.getElementById('slopeHeaders');
  var legendEl=document.querySelector('.slope-legend');
  var hintEl=document.getElementById('slopeClickHint');
  var rhoEl=document.getElementById('slopeRho');
  var dualWrap=document.querySelector('.slope-dual-wrap');
  var toggleEl=document.getElementById('slopeViewToggle');

  if(isIntro){
    if(dualWrap)dualWrap.style.display='none';
    if(toggleEl)toggleEl.style.display='none';
    if(legendEl)legendEl.style.display='none';
    if(hintEl)hintEl.style.display='none';
  } else {
    if(dualWrap)dualWrap.style.display='';
    if(toggleEl)toggleEl.style.display='';
    if(legendEl)legendEl.style.display='';
    if(hintEl)hintEl.style.display='block';
  }

  /* ── Update toggle badge values ── */
  updateSlopeToggleBadges(STORY_DOMS[phase]);

  /* ── Update narration ── */
  var narH=document.querySelector('#slopeNarration h2');
  var narP=document.querySelector('#slopeNarration p');
  var narWrap=document.getElementById('slopeNarration');

  function applyNarration(){
    narH.innerHTML=STORY_NARRATIONS[phase].h;
    narP.innerHTML=STORY_NARRATIONS[phase].p;

    /* ── Rho badge removed: info already shown in slope toggle badges ── */
    if(rhoEl){ rhoEl.innerHTML=''; }

    if(!isIntro){
      var hdrR="Rang bien-être : "+STORY_LABELS[phase];
      headersEl.innerHTML='<span>Rang effort (% du PIB)</span><span>'+hdrR+'</span>';
    }
    narWrap.style.opacity='1';
  }

  if(animate){
    narWrap.style.transition='opacity .2s ease';
    narWrap.style.opacity='0';
    setTimeout(applyNarration, 200);
  } else {
    applyNarration();
  }

  /* ── Render scatter (Pearson panel) ── */
  renderSlopeScatter(STORY_DOMS[phase], phase);

  if(isIntro) return;

  /* ── Animate slopes to new positions ── */
  slopeG.selectAll(".scg").each(function(k){
    var g=d3.select(this);
    var c=cur[k];
    var y1=c.y1, y2=c.y2;
    var df=c.sR-c.zR;
    var col=df>0?"var(--green)":df<0?"var(--red)":"var(--dim)";
    var hero=isSlopeHero(k,phase);
    var baseW=hero?2.5:1.2;
    var sw=Math.max(baseW,Math.min(hero?5:3.5,Math.abs(df)/(hero?2:3)+baseW));
    var op=hero?1:0.45;

    g.select(".slope").transition().duration(dur).ease(ease)
      .attr("d","M0,"+y1+" C"+slopeW*.35+","+y1+" "+slopeW*.65+","+y2+" "+slopeW+","+y2)
      .attr("stroke",col).attr("stroke-width",sw);
    g.select(".cl").transition().duration(dur).ease(ease)
      .attr("cx",0).attr("cy",y1).attr("fill",col).attr("r",hero?4.5:3);
    g.select(".cr").transition().duration(dur).ease(ease)
      .attr("cx",slopeW).attr("cy",y2).attr("fill",col).attr("r",hero?4.5:3);
    g.select(".ll").transition().duration(dur).ease(ease)
      .attr("x",-7).attr("y",y1+4)
      .text(c.sR+". "+D[k].f+" "+D[k].n)
      .attr("fill",hero?"var(--text)":"var(--sub)")
      .attr("font-weight",hero?"600":"400")
      .attr("font-size",hero?"11px":"9.5px");
    g.select(".lr").transition().duration(dur).ease(ease)
      .attr("x",slopeW+7).attr("y",y2+4)
      .text(c.sR===c.zR?"":c.zR+". "+D[k].f+" "+D[k].n)
      .attr("fill",hero?"var(--text)":"var(--sub)")
      .attr("font-weight",hero?"600":"400")
      .attr("font-size",hero?"11px":"9.5px");
    g.transition().duration(dur).style("opacity",op);
  });
}

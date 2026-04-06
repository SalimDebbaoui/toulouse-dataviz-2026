/* ================================================================
   HERO RADAR — Orchestrateur principal
   Coordonne les sous-modules :
     - heroRadarGrid.js       → Grille SVG + dessin des données radar
     - heroRadarComposite.js  → Panneau composite gauche + mini slope
     - heroHeatmap.js         → Vue générale heatmap (gap + zscore)
     - heroDomainPopup.js     → Popup domaine enrichie
   ================================================================ */

var heroRadarSvg, heroRadarG;
var HRADAR_W=580, HRADAR_H=450, HRADAR_CX=290, HRADAR_CY=210, HRADAR_R=150;
var activeHeroView='profil';
var activeHeroHgView='gap';
var heroHeatmapRendered=false;

/* Country color palette (kept for popup compat) */
var COUNTRY_COLORS={
  'AT':'#f59e0b','BE':'#8b5cf6','DE':'#60a5fa','EE':'#34d399',
  'ES':'#f87171','FI':'#06b6d4','FR':'#e8a838','GR':'#fb923c',
  'IT':'#a78bfa','LT':'#14b8a6','LV':'#f472b6','NL':'#22d3ee',
  'PT':'#fbbf24','SK':'#818cf8','SI':'#4ade80','CY':'#e879f9'
};
function countryColor(k){return COUNTRY_COLORS[k]||'#9ca3bf'}

function initHeroRadar(){
  var container=document.getElementById('heroRadarChart');
  if(!container||!keysFiltered.length) return;

  /* ── Populate dropdown ── */
  var sel=document.getElementById('heroRadarSel');
  if(!sel) return;
  var sorted=keysFiltered.slice().sort(function(a,b){return D[a].n.localeCompare(D[b].n)});
  sorted.forEach(function(k){
    var opt=document.createElement('option');
    opt.value=k; opt.textContent=D[k].f+' '+D[k].n;
    if(k==='FR') opt.selected=true;
    sel.appendChild(opt);
  });

  /* ── Init SVG ── */
  heroRadarSvg=d3.select('#heroRadarChart')
    .append('svg')
    .attr('viewBox','0 0 '+HRADAR_W+' '+HRADAR_H)
    .attr('preserveAspectRatio','xMidYMid meet')
    .style('width','100%')
    .style('max-width',HRADAR_W+'px');

  heroRadarG=heroRadarSvg.append('g')
    .attr('transform','translate('+HRADAR_CX+','+HRADAR_CY+')');

  drawHeroRadarGrid();   // heroRadarGrid.js
  updateHeroRadar();

  sel.addEventListener('change', function(){
    updateHeroRadar();
    if(activeHeroView==='overview') renderHeroHeatmap();
  });

  initHeroCategorySelector();  // heroCategoryView.js
  initHeroTabs();
  initHeroHgToggle();
}

/* ══════════════════════════════════════════════════
   HERO TABS — Profil pays / Vue par catégorie / Vue générale
   ══════════════════════════════════════════════════ */
function initHeroTabs(){
  document.querySelectorAll('.hero-tab').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-hero-view');
      if(view===activeHeroView) return;
      activeHeroView=view;
      document.querySelectorAll('.hero-tab').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      document.querySelectorAll('.hero-view-panel').forEach(function(p){p.classList.remove('active')});
      document.querySelector('.hero-view-'+view).classList.add('active');
      var sidebarProfil=document.getElementById('heroSidebarProfil');
      var sidebarCategory=document.getElementById('heroSidebarCategory');
      if(sidebarProfil) sidebarProfil.style.display=(view==='profil')?'':'none';
      if(sidebarCategory) sidebarCategory.style.display=(view==='category')?'':'none';
      /* Update hint text based on active view */
      var hint=document.getElementById('heroRadarHint');
      if(hint){
        if(view==='profil') hint.textContent='Cliquez sur un domaine pour explorer les dépenses et indicateurs associés.';
        else if(view==='category') hint.textContent='Cliquez sur un pays pour explorer les dépenses et indicateurs associés.';
        else if(view==='overview') hint.textContent='Cliquez sur une cellule pour explorer les dépenses et indicateurs associés.';
      }
      if(view==='overview') renderHeroHeatmap();       // heroHeatmap.js
      if(view==='category') renderHeroCategoryView();  // heroCategoryView.js
    });
  });
}

function initHeroHgToggle(){
  document.querySelectorAll('#heroHgViewToggle .hg-vbtn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var view=btn.getAttribute('data-hero-hg-view');
      if(view===activeHeroHgView) return;
      activeHeroHgView=view;
      document.querySelectorAll('#heroHgViewToggle .hg-vbtn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      renderHeroHeatmap();      // heroHeatmap.js
      updateHeroHgLegend();
    });
  });
}

function updateHeroHgLegend(){
  var legend=document.getElementById('heroHgLegend');
  if(!legend) return;
  if(activeHeroHgView==='gap'){
    legend.innerHTML='<span class="hg-leg-label neg">Sous-performe</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">Surperforme</span>';
  } else {
    legend.innerHTML='<span class="hg-leg-label neg">− mauvais</span><div class="hg-leg-bar"></div><span class="hg-leg-label pos">+ bon</span>';
  }
}

/* ── Master update — called on init and on country change ── */
function updateHeroRadar(){
  var sel=document.getElementById('heroRadarSel');
  if(!sel) return;
  var k=sel.value;
  drawHeroRadarData(k);           // heroRadarGrid.js
  updateHeroCompositePanel(k);    // heroRadarComposite.js
  drawHeroSlopeChart(k);          // heroRadarComposite.js
}
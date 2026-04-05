/* ================================================================
   MAIN — Chargement des données, observers, init
   ================================================================ */

/* ═══ DATA LOADING ═══ */
fetch('data.json').then(function(r){return r.json()}).then(function(d){
  D=d.D||{};MDATA=d.MDATA||{};SYNTH=d.SYNTH||{};SAT=d.SAT||{};CTX=d.CTX||{};DCAT=d.DCAT||{};
  document.getElementById('loading').classList.add('hide');
  init();
}).catch(function(e){
  fetch('src/data/data.json').then(function(r){return r.json()}).then(function(d){
    D=d.D||{};MDATA=d.MDATA||{};SYNTH=d.SYNTH||{};SAT=d.SAT||{};CTX=d.CTX||{};DCAT=d.DCAT||{};
    document.getElementById('loading').classList.add('hide');
    init();
  }).catch(function(e2){
    document.getElementById('loading').innerHTML='<div style="text-align:center;color:var(--red)"><p>Erreur : '+e2.message+'</p><p style="color:var(--muted);font-size:.8rem;margin-top:.5rem">Vérifiez que data.json est accessible.</p></div>';
  });
});

/* ══════════════════════════════════════════════════
   GUIDED ANALYSIS TOGGLE
   ══════════════════════════════════════════════════ */
function initGuidedToggle(){
  var btn=document.getElementById('guidedExpandBtn');
  var analysis=document.getElementById('guidedAnalysis');
  if(!btn||!analysis) return;
  btn.addEventListener('click',function(){
    var expanding=!analysis.classList.contains('expanded');
    analysis.classList.toggle('expanded');
    btn.classList.toggle('expanded');
    btn.querySelector('.guided-expand-label').textContent=
      expanding?'Réduire l\'analyse':'Cliquez pour développer';
    if(expanding){
      setTimeout(function(){
        analysis.scrollIntoView({behavior:'smooth',block:'start'});
      },100);
    }
  });
}

/* ══════════════════════════════════════════════════
   OBSERVERS & GLOBAL SCROLL
   ══════════════════════════════════════════════════ */
function initObservers(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:.25});

  ['transSection','transDomains','transWellbeing','transCorrelation','showcase','transCompositeCorr','slopeCompositeEffort','insightsCompositeCorr','transHeatmap','heatmapGap','insightsSection','transSubjectif','slopeCompositeSat','conclusionGenerale'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)obs.observe(el);
  });

  /* Dashboard observer — init on first visibility */
  var dashObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !window._dashboardInited){
        window._dashboardInited=true;
        initDashboard();
      }
    });
  },{threshold:0.05});
  var dashEl=document.getElementById('dashboard');
  if(dashEl) dashObs.observe(dashEl);

  /* Track all snap sections for nav + progress bar */
  var allSnaps=document.querySelectorAll('.snap-section');
  var sections=['heroNew','guidedInvite','sectionBar','transDomains','transWellbeing','transCorrelation','sectionSlope','showcase','transCompositeCorr','slopeCompositeEffort','insightsCompositeCorr','transHeatmap','heatmapGap','insightsSection','transSubjectif','slopeCompositeSat','conclusionGenerale','dashboard'];
  var navLinks=document.querySelectorAll('#sectionNav a');

  window.addEventListener('scroll',function(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var p=h>0?(window.scrollY/h)*100:0;
    document.getElementById('progressBar').style.width=p+'%';

    var nav=document.getElementById('sectionNav');
    nav.classList.toggle('show',window.scrollY>window.innerHeight*0.5);

    var current=0;
    sections.forEach(function(id,i){
      var el=document.getElementById(id);
      if(el&&el.getBoundingClientRect().top<window.innerHeight*0.5)current=i;
    });
    navLinks.forEach(function(a,i){a.classList.toggle('active',i===current)});
  },{passive:true});
}

/* ══════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════ */
function init(){
  keys=Object.keys(D);
  keysFiltered=keys.filter(function(k){return EXCLUDED_AFTER_BAR.indexOf(k)<0});
  initHeroRadarAnim();
  initHeroRadar();
  initGuidedToggle();
  initHero();
  initBarChart();
  initDomainCards();
  initMatchingGrid();
  initSlopeStory();
  initShowcase();
  initHeatmapGap();
  initInsights();
  initSlopeComposite();
  initSlopeCompositeEffort();
  initObservers();
}

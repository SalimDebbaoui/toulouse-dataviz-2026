/* ================================================================
   HERO — Animation d'entrée (ancien hero, maintenant #analysisHero)
   ================================================================ */

function initHero(){
  var section=document.getElementById('analysisHero');
  if(!section) return;
  var h1=section.querySelector('h1');
  var scope=section.querySelector('.scope');
  var intro=section.querySelector('.intro');
  var cue=section.querySelector('.scroll-cue');
  if(!h1||!scope||!intro) return;
  setTimeout(function(){
    h1.style.transition='opacity .8s var(--ease), transform .8s var(--ease)';
    h1.style.opacity='1';h1.style.transform='none';
  },200);
  setTimeout(function(){
    scope.style.transition='opacity .6s var(--ease), transform .6s var(--ease)';
    scope.style.opacity='1';scope.style.transform='none';
  },600);
  setTimeout(function(){
    intro.style.transition='opacity .6s var(--ease), transform .6s var(--ease)';
    intro.style.opacity='1';intro.style.transform='none';
  },900);
  if(cue){
    setTimeout(function(){
      cue.style.transition='opacity .6s var(--ease)';
      cue.style.opacity='1';
    },1400);
  }
}

/* ── Hero Radar section entrance animation ── */
function initHeroRadarAnim(){
  var section=document.getElementById('heroNew');
  if(!section) return;
  var h1=section.querySelector('.hero-radar-h1');
  var scope=section.querySelector('.scope');
  var sub=section.querySelector('.hero-radar-sub');
  var cue=section.querySelector('.scroll-cue');
  if(h1){
    setTimeout(function(){
      h1.style.transition='opacity .8s var(--ease), transform .8s var(--ease)';
      h1.style.opacity='1';h1.style.transform='none';
    },200);
  }
  if(scope){
    setTimeout(function(){
      scope.style.transition='opacity .6s var(--ease), transform .6s var(--ease)';
      scope.style.opacity='1';scope.style.transform='none';
    },600);
  }
  if(sub){
    setTimeout(function(){
      sub.style.transition='opacity .6s var(--ease), transform .6s var(--ease)';
      sub.style.opacity='1';sub.style.transform='none';
    },900);
  }
  if(cue){
    setTimeout(function(){
      cue.style.transition='opacity .6s var(--ease)';
      cue.style.opacity='1';
    },1400);
  }
}

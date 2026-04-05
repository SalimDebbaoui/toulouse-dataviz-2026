/* ================================================================
   DOMAIN CARDS — Section 2a (effort par domaine) & 2b (matching)
   Populates #domainCards, #matchingGrid, #matchingDetailPanel
   ================================================================ */

var DOM_ICONS=["🏥","💰","💼","🏠","🎓","🗳️","🤝","🛡️","🌿"];

/* ══════════════════════════════════════
   SECTION 2a — Effort par domaine (COFOG)
   Cards are purely informational (no click interaction).
   ══════════════════════════════════════ */
function initDomainCards(){
  var container=document.getElementById('domainCards');
  if(!container||!keys.length) return;

  var html='';
  for(var di=0;di<ND;di++){
    // Compute EU-16 average % PIB for this domain
    var sum=0,cnt=0;
    keysFiltered.forEach(function(k){
      var v=getPIB(k,di);
      if(v>0){sum+=v;cnt++}
    });
    var avg=cnt>0?(sum/cnt):0;

    html+='<div class="dom-card">';
    html+='<span class="dom-card-icon">'+DOM_ICONS[di]+'</span>';
    html+='<div class="dom-card-body">';
    html+='<div class="dom-card-name">'+DOM_LABELS[di]+'</div>';
    html+='<div class="dom-card-avg">Moy. EU-'+keysFiltered.length+' : '+avg.toFixed(1)+' % PIB</div>';
    html+='</div>';
    html+='</div>';
  }
  container.innerHTML=html;
}


/* ══════════════════════════════════════
   SECTION 2b — Matching effort ↔ bien-être
   ══════════════════════════════════════ */
function initMatchingGrid(){
  var container=document.getElementById('matchingGrid');
  if(!container||!keys.length) return;

  var html='';
  for(var di=0;di<ND;di++){
    // Count OCDE indicators for this domain
    var refK=keys[0];
    var dn=DOMS[di];
    var nMeasures=(MDATA&&MDATA[refK]&&MDATA[refK][dn])?MDATA[refK][dn].length:0;
    var nCofog=(DCAT&&DCAT[refK]&&DCAT[refK][dn])?DCAT[refK][dn].length:0;

    html+='<div class="match-card" data-match-idx="'+di+'">';
    html+='<span class="match-card-icon">'+DOM_ICONS[di]+'</span>';
    html+='<div class="match-card-body">';
    html+='<div class="match-card-name">'+DOM_LABELS[di]+'</div>';
    html+='<div class="match-card-sub">'+nCofog+' COFOG → '+nMeasures+' indicateurs OCDE</div>';
    html+='</div>';
    html+='</div>';
  }
  container.innerHTML=html;

  // Click handlers — open a popup modal instead of expanding inline
  container.querySelectorAll('.match-card').forEach(function(card){
    card.addEventListener('click',function(){
      var idx=parseInt(this.getAttribute('data-match-idx'));
      openMatchingPopup(idx);
    });
  });
}

/* ── Matching popup (modal overlay) ── */
function openMatchingPopup(domIdx){
  // Remove any existing matching popup
  var existing=document.getElementById('matchingPopupOverlay');
  if(existing) existing.remove();

  var overlay=document.createElement('div');
  overlay.id='matchingPopupOverlay';
  overlay.className='matching-popup-overlay';

  var modal=document.createElement('div');
  modal.className='matching-popup';

  // Build content
  var dn=DOMS[domIdx];
  var refK='FR';

  var h='<button class="matching-popup-close" id="matchingPopupClose">&times;</button>';
  h+='<h4 class="matching-popup-title">'+DOM_ICONS[domIdx]+' '+DOM_LABELS[domIdx]+'</h4>';

  h+='<div class="md-columns">';

  // LEFT — COFOG (effort)
  h+='<div class="md-col md-col-effort">';
  h+='<div class="md-section-title effort-title">Dépenses mesurées (COFOG)</div>';
  if(DCAT&&DCAT[refK]&&DCAT[refK][dn]){
    DCAT[refK][dn].forEach(function(cat){
      h+='<div class="md-row"><span class="md-name">'+cat.n+'</span></div>';
    });
  } else {
    h+='<div class="md-row"><span class="md-name" style="color:var(--muted)">Aucune donnée</span></div>';
  }
  h+='</div>';

  // CENTER — arrow
  h+='<div class="md-col-arrow">→</div>';

  // RIGHT — OCDE (bien-être)
  h+='<div class="md-col md-col-result">';
  h+='<div class="md-section-title result-title">Indicateurs bien-être (OCDE)</div>';
  if(MDATA&&MDATA[refK]&&MDATA[refK][dn]){
    MDATA[refK][dn].forEach(function(me){
      h+='<div class="md-row"><span class="md-name">'+me.m+'</span></div>';
    });
  } else {
    h+='<div class="md-row"><span class="md-name" style="color:var(--muted)">Aucun indicateur</span></div>';
  }
  h+='</div>';

  h+='</div>';

  modal.innerHTML=h;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Trigger open animation on next frame
  requestAnimationFrame(function(){
    overlay.classList.add('open');
  });

  // Close on overlay click
  overlay.addEventListener('click',function(e){
    if(e.target===overlay) closeMatchingPopup();
  });
  // Close on button click
  document.getElementById('matchingPopupClose').addEventListener('click',closeMatchingPopup);
  // Close on Escape
  overlay._escHandler=function(e){if(e.key==='Escape')closeMatchingPopup()};
  document.addEventListener('keydown',overlay._escHandler);
}

function closeMatchingPopup(){
  var overlay=document.getElementById('matchingPopupOverlay');
  if(!overlay) return;
  if(overlay._escHandler) document.removeEventListener('keydown',overlay._escHandler);
  overlay.classList.remove('open');
  setTimeout(function(){overlay.remove()},300);
}

/* renderMatchingDetail — removed, replaced by openMatchingPopup modal */

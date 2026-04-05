/* ================================================================
   POPUP — Fiche pays, comparaison côte à côte, détail inline
   ================================================================ */

/* ── Helper: calcul moyenne EU16 pour un indicateur donné ── */
function computeEU16Avg(domName, measureName){
  if(!MDATA) return null;
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    if(MDATA[k]&&MDATA[k][domName]){
      var found=MDATA[k][domName].find(function(m){return m.m===measureName});
      if(found){var v=found.v[PI]; if(v!=null&&!isNaN(v)){sum+=v;cnt++}}
    }
  });
  return cnt>0?sum/cnt:null;
}

function computeEU16AvgZ(domName, measureName){
  if(!MDATA) return null;
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    if(MDATA[k]&&MDATA[k][domName]){
      var found=MDATA[k][domName].find(function(m){return m.m===measureName});
      if(found){var v=found.z[PI]; if(v!=null&&!isNaN(v)){sum+=v;cnt++}}
    }
  });
  return cnt>0?sum/cnt:null;
}

/* ── Helper: moyenne EU16 pour une dépense COFOG (% PIB ou €/hab) ── */
function computeEU16CofogAvg(domName, cofogName, field){
  if(!DCAT) return null;
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    if(DCAT[k]&&DCAT[k][domName]){
      var found=DCAT[k][domName].find(function(c){return c.n===cofogName});
      if(found){
        var arr=(field==='p')?found.p:found.v;
        var v=arr?arr[PI]:null;
        if(v!=null&&!isNaN(v)){sum+=v;cnt++}
      }
    }
  });
  return cnt>0?sum/cnt:null;
}

/* ── Helper: moyenne EU16 des indicateurs macro CTX ── */
function computeEU16CtxAvg(field){
  if(!CTX) return null;
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    if(CTX[k]&&CTX[k][field]){
      var v=CTX[k][field][PI];
      if(v!=null&&!isNaN(v)&&v>0){sum+=v;cnt++}
    }
  });
  return cnt>0?sum/cnt:null;
}

function computeEU16SatAvg(){
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    var v=satV(k);
    if(v!=null&&!isNaN(v)){sum+=v;cnt++}
  });
  return cnt>0?sum/cnt:null;
}

/* ── Helper: moyenne EU16 du % PIB et z-score par domaine ── */
function computeEU16DomPibAvg(domIdx){
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    var v=getPIB(k,domIdx);
    if(v!=null&&!isNaN(v)&&v>0){sum+=v;cnt++}
  });
  return cnt>0?sum/cnt:null;
}

function computeEU16DomZAvg(domIdx){
  var sum=0, cnt=0;
  keysFiltered.forEach(function(k){
    var v=getZ(k,domIdx);
    if(v!=null&&!isNaN(v)){sum+=v;cnt++}
  });
  return cnt>0?sum/cnt:null;
}

/* ── Helper: min/max COFOG pour calculer les barres relatives ── */
function computeEU16CofogRange(domName, cofogName, field){
  if(!DCAT) return {min:0,max:1};
  var vals=[];
  keysFiltered.forEach(function(k){
    if(DCAT[k]&&DCAT[k][domName]){
      var found=DCAT[k][domName].find(function(c){return c.n===cofogName});
      if(found){
        var arr=(field==='p')?found.p:found.v;
        var v=arr?arr[PI]:null;
        if(v!=null&&!isNaN(v)) vals.push(v);
      }
    }
  });
  if(!vals.length) return {min:0,max:1};
  return {min:Math.min.apply(null,vals), max:Math.max.apply(null,vals)};
}

/* ── POPUP ── */
function showPopup(k, compareKey){
  var po=document.getElementById("popupOverlay"), pp=document.getElementById("popup");

  // Ajuster largeur selon mode comparaison
  pp.classList.toggle("compare", !!compareKey);

  var h='<button class="popup-close" onclick="closePopup()">&times;</button>';

  // ── Sélecteurs de pays (gauche + droite) ──
  var r0=ranks(curDom), nn0=keysFiltered.length;
  var sortedKeys=keysFiltered.slice().sort(function(a,b){
    return (r0.z[a]||nn0) - (r0.z[b]||nn0);
  });
  function ecartLabel(k2){
    var zR=r0.z[k2]||nn0;
    return D[k2].f+' '+D[k2].n+' ('+zR+'e)';
  }

  h+='<div class="popup-selectors">';

  h+='<div class="popup-sel-group">';
  h+='<select id="popupSelLeft" class="popup-country-select left" onchange="var r=document.getElementById(\'popupSelRight\');var ck=r?r.value:\'\';if(ck){showPopup(this.value,ck)}else{showPopup(this.value)}">';
  sortedKeys.forEach(function(k2){
    var sel=(k2===k)?' selected':'';
    h+='<option value="'+k2+'"'+sel+'>'+ecartLabel(k2)+'</option>';
  });
  h+='</select></div>';

  h+='<span class="popup-sel-vs">vs</span>';

  h+='<div class="popup-sel-group">';
  h+='<select id="popupSelRight" class="popup-country-select right" onchange="var lk=document.getElementById(\'popupSelLeft\').value;if(this.value){showPopup(lk,this.value)}else{showPopup(lk)}">';
  h+='<option value="">— Aucun —</option>';
  sortedKeys.forEach(function(k2){
    if(k2!==k){
      var sel=(k2===compareKey)?' selected':'';
      h+='<option value="'+k2+'"'+sel+'>'+ecartLabel(k2)+'</option>';
    }
  });
  h+='</select></div>';

  h+='</div>';

  // ── Grille de fiches ──
  h+='<div class="popup-grid'+(compareKey?' dual':'')+'">';
  h+='<div class="popup-card">'+buildPopupCard(k)+'</div>';
  if(compareKey){
    h+='<div class="popup-divider"></div>';
    h+='<div class="popup-card">'+buildPopupCard(compareKey)+'</div>';
  }
  h+='</div>';

  // ── Bouton détail complet (expand en place) ──
  var detailArgs="'"+k+"'"+(compareKey?(",'"+compareKey+"'"):"");
  h+='<button class="pdetail" id="pdetailBtn" onclick="togglePopupDetail('+detailArgs+')">Détail complet ✓</button>';
  h+='<div id="popupDetailExpanded" class="popup-detail-expanded"></div>';

  pp.innerHTML=h;
  po.classList.add("open");
  pp.scrollTop=0;
}

function closePopup(){
  document.getElementById('popupOverlay').classList.remove('open');
}

document.getElementById("popupOverlay").addEventListener("click",function(e){if(e.target===this)closePopup()});

/* ── Fiche résumé d'un pays ── */
function buildPopupCard(k){
  var r=ranks(curDom), sR=r.s[k]||1, zR=r.z[k]||1, nn=keysFiltered.length;
  var syn=synthPhrase(sR,zR);

  var h='<h3>'+D[k].f+' '+D[k].n+'</h3>';

  // ── Si on est sur une catégorie spécifique (curDom >= 0) ──
  if(curDom>=0){
    var dn=DOMS[curDom];
    h+='<div class="popup-cat-badge">'+DOM_LABELS[curDom]+'</div>';
    h+='<div class="prow"><span class="pl">Rang effort</span><span class="pv">'+sR+'/'+nn+'</span></div>';
    h+='<div class="prow"><span class="pl">Rang résultat</span><span class="pv">'+zR+'/'+nn+'</span></div>';
    var df=sR-zR;
    var dTxt=df>0?'<span style="color:var(--green)">+'+df+' place'+(df>1?'s':'')+'</span>'
            :df<0?'<span style="color:var(--red)">'+df+' place'+(Math.abs(df)>1?'s':'')+'</span>'
            :'Même rang';
    h+='<div class="prow"><span class="pl">Différence</span><span class="pv">'+dTxt+'</span></div>';

    // Effort % PIB pour cette catégorie + moyenne EU16
    var catPib=getPIB(k,curDom);
    var avgPib=computeEU16DomPibAvg(curDom);
    if(catPib) h+='<div class="prow"><span class="pl">Effort (% PIB)</span><span class="pv">'+catPib.toFixed(2)+'% <span class="pv-avg">(moy. '+(avgPib!=null?avgPib.toFixed(2):'—')+'%)</span></span></div>';

    // Z-score (pas de moyenne, par définition ~0)
    var catZ=getZ(k,curDom);
    var zCol=catZ>0.3?'var(--green)':catZ<-0.3?'var(--red)':'var(--sub)';
    h+='<div class="prow"><span class="pl">Z-score bien-être</span><span class="pv" style="color:'+zCol+'">'+(catZ>0?'+':'')+catZ.toFixed(2)+'</span></div>';

    h+='<p class="psyn '+syn.cls+'">'+syn.txt+'</p>';

    // ── Détail des sous-indicateurs avec comparaison EU16 ──
    h+=buildCategoryDetail(k, curDom);

  } else {
    // ── Vue composite / synthèse (curDom < 0) ──
    h+='<div class="prow"><span class="pl">Rang effort</span><span class="pv">'+sR+'/'+nn+'</span></div>';
    h+='<div class="prow"><span class="pl">Rang résultat</span><span class="pv">'+zR+'/'+nn+'</span></div>';
    var df=sR-zR;
    var dTxt=df>0?'<span style="color:var(--green)">+'+df+' place'+(df>1?'s':'')+'</span>'
            :df<0?'<span style="color:var(--red)">'+df+' place'+(Math.abs(df)>1?'s':'')+'</span>'
            :'Même rang';
    h+='<div class="prow"><span class="pl">Différence</span><span class="pv">'+dTxt+'</span></div>';

    // ── Indicateurs macro enrichis ──
    h+='<div class="popup-macro">';
    if(CTX&&CTX[k]){
      var c=CTX[k];
      var avgDepPib=computeEU16CtxAvg('dep_pib');
      var avgBudget=computeEU16CtxAvg('budget');
      var avgDette=computeEU16CtxAvg('dette');
      if(c.dep_pib&&c.dep_pib[PI]) h+='<div class="macro-chip"><span class="macro-val">'+c.dep_pib[PI].toFixed(1)+'%</span><span class="macro-lbl">Dép. pub. / PIB</span><span class="macro-avg">moy. '+(avgDepPib!=null?avgDepPib.toFixed(1):'—')+'%</span></div>';
      if(c.budget&&c.budget[PI]) h+='<div class="macro-chip"><span class="macro-val">'+Math.round(c.budget[PI]).toLocaleString("fr-FR")+'</span><span class="macro-lbl">€/hab dép. pub.</span><span class="macro-avg">moy. '+(avgBudget!=null?Math.round(avgBudget).toLocaleString("fr-FR"):'—')+'</span></div>';
      if(c.dette&&c.dette[PI]) h+='<div class="macro-chip"><span class="macro-val">'+Math.round(c.dette[PI])+'%</span><span class="macro-lbl">Dette / PIB</span><span class="macro-avg">moy. '+(avgDette!=null?Math.round(avgDette):'—')+'%</span></div>';
    }
    var sv=satV(k);
    var avgSat=computeEU16SatAvg();
    if(sv!=null) h+='<div class="macro-chip"><span class="macro-val" style="color:var(--blue)">'+sv.toFixed(1)+'</span><span class="macro-lbl">Satisf. /10</span><span class="macro-avg">moy. '+(avgSat!=null?avgSat.toFixed(1):'—')+'</span></div>';
    h+='</div>';

    h+='<p class="psyn '+syn.cls+'">'+syn.txt+'</p>';
    h+=buildRadar(k);

    // Points forts / faibles
    var domRanks=[];
    for(var di=0;di<ND;di++){var rd=ranks(di);domRanks.push({name:DOM_LABELS[di],rank:rd.z[k]||99})}
    domRanks.sort(function(a,b){return a.rank-b.rank});
    var top3=domRanks.slice(0,3), bot3=domRanks.slice(-3).reverse();

    h+='<div class="pstrong"><div><h4 class="g">Points forts</h4><ul>';
    top3.forEach(function(d){h+='<li>'+d.name+' ('+d.rank+'e)</li>'});
    h+='</ul></div><div><h4 class="r">Points faibles</h4><ul>';
    bot3.forEach(function(d){h+='<li>'+d.name+' ('+d.rank+'e)</li>'});
    h+='</ul></div></div>';
  }

  return h;
}

/* ── Détail catégorie : sous-indicateurs + barres vs EU16 ── */
function buildCategoryDetail(k, domIdx){
  var dn=DOMS[domIdx];
  if(!MDATA||!MDATA[k]||!MDATA[k][dn]||!MDATA[k][dn].length) return '';

  var measures=MDATA[k][dn];
  var h='<div class="cat-detail">';
  h+='<div class="cat-detail-title">Indicateurs détaillés vs moyenne EU-'+keysFiltered.length+'</div>';

  measures.forEach(function(me){
    var v=me.v[PI], zs=me.z[PI];
    var avg=computeEU16Avg(dn, me.m);
    var avgZ=computeEU16AvgZ(dn, me.m);

    if(v==null&&(zs==null||isNaN(zs))) return; // skip if no data

    // Determine comparison direction (is higher = better?)
    var positive=(me.s==='positif');

    // Calculate bar widths based on z-scores for visual comparison
    var hasZ=zs!=null&&!isNaN(zs);
    var hasAvgZ=avgZ!=null&&!isNaN(avgZ);

    // Color based on z-score
    var zC=hasZ?(zs>0.3?"pos":zs<-0.3?"neg":"neu"):"neu";

    // Delta vs avg
    var delta=null, deltaHtml='';
    if(v!=null&&avg!=null&&!isNaN(v)&&!isNaN(avg)&&avg!==0){
      delta=((v-avg)/Math.abs(avg))*100;
      var better=(positive&&delta>0)||(!positive&&delta<0);
      var worse=(positive&&delta<0)||(!positive&&delta>0);
      var dCol=better?'var(--green)':worse?'var(--red)':'var(--sub)';
      var arrow=better?'▲':worse?'▼':'●';
      deltaHtml='<span class="cat-delta" style="color:'+dCol+'">'+arrow+' '+Math.abs(delta).toFixed(0)+'%</span>';
    }

    // Bar visualization: use z-score normalized (range roughly -3 to +3)
    var barPct=hasZ?Math.min(100,Math.max(0,(zs+3)/6*100)):50;
    var avgBarPct=hasAvgZ?Math.min(100,Math.max(0,(avgZ+3)/6*100)):50;

    h+='<div class="cat-measure">';
    h+='<div class="cat-m-header">';
    h+='<span class="cat-m-name">'+me.m+'</span>';
    h+=deltaHtml;
    h+='</div>';
    h+='<div class="cat-m-vals">';
    h+='<span class="cat-m-country '+ zC +'">'+fv(v)+'</span>';
    h+='<span class="cat-m-unit">'+me.u+'</span>';
    h+='<span class="cat-m-avg">moy. '+fv(avg)+'</span>';
    h+='</div>';
    // Bar comparison
    h+='<div class="cat-bar-wrap">';
    h+='<div class="cat-bar-track">';
    // Avg marker
    h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
    // Country bar
    var barCol=zC==='pos'?'var(--green)':zC==='neg'?'var(--red)':'var(--sub)';
    if(barPct>=50){
      h+='<div class="cat-bar-fill cat-bar-right" style="left:50%;width:'+(barPct-50)+'%;background:'+barCol+'"></div>';
    }else{
      h+='<div class="cat-bar-fill cat-bar-left" style="left:'+barPct+'%;width:'+(50-barPct)+'%;background:'+barCol+'"></div>';
    }
    // Center line (z=0)
    h+='<div class="cat-bar-center"></div>';
    h+='</div>';
    h+='</div>';
    h+='</div>';
  });

  // Dépenses COFOG si disponibles — avec barres vs EU16
  if(DCAT&&DCAT[k]&&DCAT[k][dn]&&DCAT[k][dn].length){
    h+='<div class="cat-detail-title" style="margin-top:.8rem">Dépenses publiques (COFOG) vs moyenne EU-'+keysFiltered.length+'</div>';
    DCAT[k][dn].forEach(function(cat){
      var pVal=cat.p[PI], vVal=cat.v[PI];
      var avgP=computeEU16CofogAvg(dn, cat.n, 'p');
      var avgV=computeEU16CofogAvg(dn, cat.n, 'v');
      var range=computeEU16CofogRange(dn, cat.n, 'p');

      // Delta vs avg
      var deltaHtml='';
      if(pVal!=null&&avgP!=null&&avgP>0){
        var delta=((pVal-avgP)/avgP)*100;
        var dCol=delta>5?'var(--green)':delta<-5?'var(--red)':'var(--sub)';
        var arrow=delta>5?'▲':delta<-5?'▼':'●';
        deltaHtml='<span class="cat-delta" style="color:'+dCol+'">'+arrow+' '+Math.abs(delta).toFixed(0)+'%</span>';
      }

      // Bar: position du pays et de la moyenne dans le range [min, max]
      var span=range.max-range.min;
      var barPct=span>0?((pVal-range.min)/span)*100:50;
      var avgBarPct=span>0&&avgP!=null?((avgP-range.min)/span)*100:50;
      barPct=Math.max(2,Math.min(98,barPct));
      avgBarPct=Math.max(2,Math.min(98,avgBarPct));

      var barCol=(pVal>avgP*1.05)?'var(--blue)':(pVal<avgP*0.95)?'var(--muted)':'var(--sub)';

      h+='<div class="cat-measure">';
      h+='<div class="cat-m-header">';
      h+='<span class="cat-m-name">'+cat.n+'</span>';
      h+=deltaHtml;
      h+='</div>';
      h+='<div class="cat-m-vals">';
      h+='<span class="cat-m-country" style="color:var(--text)">'+pVal.toFixed(2)+'% PIB</span>';
      h+='<span class="cat-m-unit">'+Math.round(vVal).toLocaleString("fr-FR")+' €/hab</span>';
      h+='<span class="cat-m-avg">moy. '+(avgP!=null?avgP.toFixed(2):'—')+'%</span>';
      h+='</div>';
      // Bar
      h+='<div class="cat-bar-wrap">';
      h+='<div class="cat-bar-track">';
      // Avg marker (gold)
      h+='<div class="cat-bar-avg-mark" style="left:'+avgBarPct+'%"><div class="cat-bar-avg-line"></div></div>';
      // Country bar (from 0 to barPct)
      h+='<div class="cat-bar-fill" style="left:0;width:'+barPct+'%;background:'+barCol+';border-radius:3px"></div>';
      h+='</div>';
      h+='</div>';
      h+='</div>';
    });
  }

  h+='</div>';
  return h;
}

/* ── Toggle détail complet (expand/collapse dans le popup) ── */
function togglePopupDetail(k, k2){
  var container=document.getElementById('popupDetailExpanded');
  var btn=document.getElementById('pdetailBtn');
  if(!container||!btn)return;

  if(container.classList.contains('open')){
    container.classList.remove('open');
    container.innerHTML='';
    btn.innerHTML='Détail complet ✓';
    return;
  }

  if(k2){
    container.innerHTML=buildCompare(k,k2);
  }else{
    container.innerHTML=buildDetail(k);
  }
  container.classList.add('open');
  btn.innerHTML='Réduire le détail ↑';

  setTimeout(function(){
    container.scrollIntoView({behavior:'smooth',block:'nearest'});
  },50);
}

/* ── Détail complet d'un pays ── */
function buildDetail(k){
  var h="";
  if(CTX&&CTX[k]){var c=CTX[k];h+='<div class="ctx-line">';
    if(c.dep_pib&&c.dep_pib[PI])h+='<span>Dép. pub. : '+c.dep_pib[PI].toFixed(1)+'% du PIB</span>';
    if(c.budget&&c.budget[PI])h+='<span>Dép. pub. : '+Math.round(c.budget[PI]).toLocaleString("fr-FR")+' €/hab</span>';
    if(c.dette&&c.dette[PI])h+='<span>Dette : '+Math.round(c.dette[PI])+'% du PIB</span>';h+='</div>'}
  var sv=satV(k);if(sv!=null)h+='<div style="font-size:.8rem;color:var(--blue);margin-bottom:.4rem">Satisfaction : '+sv.toFixed(1)+'/10</div>';
  for(var di=0;di<ND;di++){var dn=DOMS[di];h+='<div class="section"><h3>'+DOM_LABELS[di]+'</h3>';
    var rd=ranks(di);h+='<div style="font-size:.73rem;color:var(--sub);margin-bottom:.3rem">Effort : '+rd.s[k]+'/'+keysFiltered.length+' → Résultat : '+rd.z[k]+'/'+keysFiltered.length+'</div>';
    if(MDATA&&MDATA[k]&&MDATA[k][dn]&&MDATA[k][dn].length){MDATA[k][dn].forEach(function(me){var v=me.v[PI],zs=me.z[PI];
      var hZ=zs!=null&&!isNaN(zs);var zC=hZ?(zs>0.3?"pos":zs<-0.3?"neg":"neu"):"neu";
      var avg=computeEU16Avg(dn, me.m);
      var avgTxt=avg!=null?' <span class="mz-avg">(moy. '+fv(avg)+')</span>':'';
      h+='<div class="mrow"><span class="mname">'+me.m+'</span><span class="mval">'+fv(v)+avgTxt+'</span><span class="munit">'+me.u+'</span><span class="mz '+zC+'">'+(hZ?"z="+zs.toFixed(2):"")+'</span></div>'})}
    if(DCAT&&DCAT[k]&&DCAT[k][dn]&&DCAT[k][dn].length){
      h+='<div class="cofog-title">Dépenses COFOG</div>';
      DCAT[k][dn].forEach(function(cat){h+='<div class="mrow"><span class="mname">'+cat.n+'</span><span class="mval">'+cat.p[PI].toFixed(2)+'% PIB</span><span class="munit">'+Math.round(cat.v[PI]).toLocaleString("fr-FR")+' €/hab</span></div>'})}
    h+='</div>'}return h}

/* ── Comparaison détaillée de deux pays ── */
function buildCompare(k1,k2){
  var n1=D[k1].f+' '+D[k1].n,n2=D[k2].f+' '+D[k2].n;
  var h='<div style="font-size:.9rem;font-weight:600;margin-bottom:.5rem">'+n1+' <span style="color:var(--sub)">vs</span> '+n2+'</div>';
  var sv1=satV(k1),sv2=satV(k2),dp1=totalPIB(k1),dp2=totalPIB(k2);
  var b1=CTX[k1]?CTX[k1].budget[PI]:0,b2=CTX[k2]?CTX[k2].budget[PI]:0;
  function cmp(a,b){return a>b+0.01?" class='better'":a<b-0.01?" class='worse'":""}
  h+='<table><tr><th></th><th>'+n1+'</th><th>'+n2+'</th></tr>';
  h+='<tr><td>Satisfaction</td><td'+(sv1>sv2?" class='better'":"")+'>'+(sv1!=null?sv1.toFixed(1)+'/10':'—')+'</td><td'+(sv2>sv1?" class='better'":"")+'>'+(sv2!=null?sv2.toFixed(1)+'/10':'—')+'</td></tr>';
  h+='<tr><td>Effort (% PIB)</td><td>'+dp1.toFixed(1)+'%</td><td>'+dp2.toFixed(1)+'%</td></tr>';
  h+='<tr><td>Budget/hab</td><td>'+Math.round(b1).toLocaleString('fr-FR')+' €</td><td>'+Math.round(b2).toLocaleString('fr-FR')+' €</td></tr></table>';
  for(var di=0;di<ND;di++){var dn=DOMS[di],rd=ranks(di);
    var z1=getZ(k1,di),z2=getZ(k2,di);
    h+='<div class="section"><h3>'+DOM_LABELS[di]+'</h3>';
    h+='<table><tr><th></th><th>'+D[k1].f+'</th><th>'+D[k2].f+'</th></tr>';
    h+='<tr><td>% PIB</td><td>'+getPIB(k1,di).toFixed(2)+'%</td><td>'+getPIB(k2,di).toFixed(2)+'%</td></tr>';
    h+='<tr><td>Z-score</td><td'+cmp(z1,z2)+'>'+z1.toFixed(2)+'</td><td'+cmp(z2,z1)+'>'+z2.toFixed(2)+'</td></tr>';
    h+='<tr><td>Rang effort</td><td>'+rd.s[k1]+'/'+keysFiltered.length+'</td><td>'+rd.s[k2]+'/'+keysFiltered.length+'</td></tr>';
    h+='<tr><td>Rang résultat</td><td>'+rd.z[k1]+'/'+keysFiltered.length+'</td><td>'+rd.z[k2]+'/'+keysFiltered.length+'</td></tr></table>';
    if(MDATA&&MDATA[k1]&&MDATA[k1][dn]&&MDATA[k1][dn].length){
      h+='<table><tr><th style="color:var(--green)">Indicateur</th><th>'+D[k1].f+'</th><th>'+D[k2].f+'</th><th style="color:var(--muted);font-size:.6rem">moy. EU</th></tr>';
      MDATA[k1][dn].forEach(function(me){var v1=me.v[PI],v2=null;
        if(MDATA[k2]&&MDATA[k2][dn]){var m2=MDATA[k2][dn].find(function(x){return x.m===me.m});if(m2)v2=m2.v[PI]}
        var avg=computeEU16Avg(dn, me.m);
        h+='<tr><td style="font-size:.7rem;color:var(--sub)">'+me.m+'</td><td>'+fv(v1)+'</td><td>'+fv(v2)+'</td><td style="color:var(--muted);font-size:.68rem">'+fv(avg)+'</td></tr>'});
      h+='</table>'}
    h+='</div>'}return h}

/* ── RADAR CHART — Effort vs Résultat (agrandi) ── */
function buildRadar(k){
  var W=300, H=340, cx=W/2, cy=145, maxR=100;
  var nn=keysFiltered.length;
  var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">';

  function rankToR(rank){ return maxR * Math.max(0.06, 1 - (rank-1)/(nn-1)); }

  /* Grilles concentriques */
  [0.25,0.5,0.75,1].forEach(function(rf){
    var pts=[];
    for(var i=0;i<ND;i++){var a=(i/ND)*Math.PI*2-Math.PI/2;pts.push((cx+Math.cos(a)*maxR*rf)+','+(cy+Math.sin(a)*maxR*rf));}
    svg+='<polygon points="'+pts.join(' ')+'" fill="none" stroke="rgba(255,255,255,'+(rf===1?.08:.04)+')" stroke-width="1"/>';
  });

  /* Ligne médiane pointillée */
  var medR=rankToR(Math.round(nn/2));
  var medPts=[];
  for(var i=0;i<ND;i++){var a=(i/ND)*Math.PI*2-Math.PI/2;medPts.push((cx+Math.cos(a)*medR)+','+(cy+Math.sin(a)*medR));}
  svg+='<polygon points="'+medPts.join(' ')+'" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1" stroke-dasharray="3,3"/>';

  /* Axes + labels */
  var shortLbls=['Santé','Rev.','Trav.','Log.','Sav.','Civ.','Soc.','Séc.','Env.'];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var x2=cx+Math.cos(a)*maxR, y2=cy+Math.sin(a)*maxR;
    svg+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(255,255,255,.08)" stroke-width="1"/>';
    var xl=cx+Math.cos(a)*(maxR+18), yl=cy+Math.sin(a)*(maxR+18);
    var anch=Math.cos(a)>0.25?'start':Math.cos(a)<-0.25?'end':'middle';
    svg+='<text x="'+xl+'" y="'+(yl+3)+'" text-anchor="'+anch+'" font-size="9" fill="rgba(156,163,191,.7)" font-family="DM Sans,sans-serif">'+shortLbls[i]+'</text>';
  }

  /* Polygone EFFORT (orange, pointillé) */
  var sPts=[];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i); var sRank=rd.s[k]||nn;
    var ri=rankToR(sRank);
    sPts.push((cx+Math.cos(a)*ri)+','+(cy+Math.sin(a)*ri));
  }
  svg+='<polygon points="'+sPts.join(' ')+'" fill="rgba(251,146,60,.1)" stroke="#fb923c" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5,3"/>';

  /* Polygone RÉSULTAT (vert, plein) */
  var zPts=[];
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i); var zRank=rd.z[k]||nn;
    var ri=rankToR(zRank);
    zPts.push((cx+Math.cos(a)*ri)+','+(cy+Math.sin(a)*ri));
  }
  svg+='<polygon points="'+zPts.join(' ')+'" fill="rgba(52,211,153,.12)" stroke="var(--green)" stroke-width="1.8" stroke-linejoin="round"/>';

  /* Points effort (orange) */
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i); var sRank=rd.s[k]||nn;
    var ri=rankToR(sRank);
    var px=cx+Math.cos(a)*ri, py=cy+Math.sin(a)*ri;
    svg+='<circle cx="'+px+'" cy="'+py+'" r="8" fill="transparent" stroke="none" style="cursor:default"><title>'+DOM_LABELS[i]+' — Effort : '+sRank+'/'+nn+'</title></circle>';
    svg+='<circle cx="'+px+'" cy="'+py+'" r="3" fill="#fb923c" pointer-events="none"/>';
  }
  /* Points résultat (vert) */
  for(var i=0;i<ND;i++){
    var a=(i/ND)*Math.PI*2-Math.PI/2;
    var rd=ranks(i); var zRank=rd.z[k]||nn;
    var ri=rankToR(zRank);
    var px=cx+Math.cos(a)*ri, py=cy+Math.sin(a)*ri;
    svg+='<circle cx="'+px+'" cy="'+py+'" r="8" fill="transparent" stroke="none" style="cursor:default"><title>'+DOM_LABELS[i]+' — Résultat : '+zRank+'/'+nn+'</title></circle>';
    svg+='<circle cx="'+px+'" cy="'+py+'" r="3" fill="var(--green)" pointer-events="none"/>';
  }

  /* Légende */
  var ly=H-36;
  svg+='<line x1="'+(cx-70)+'" y1="'+ly+'" x2="'+(cx-56)+'" y2="'+ly+'" stroke="#fb923c" stroke-width="1.8" stroke-dasharray="5,3"/>';
  svg+='<circle cx="'+(cx-63)+'" cy="'+ly+'" r="2.5" fill="#fb923c"/>';
  svg+='<text x="'+(cx-50)+'" y="'+(ly+3.5)+'" font-size="9" fill="rgba(156,163,191,.85)" font-family="DM Sans,sans-serif">Rang effort (dépense)</text>';
  var ly2=ly+16;
  svg+='<line x1="'+(cx-70)+'" y1="'+ly2+'" x2="'+(cx-56)+'" y2="'+ly2+'" stroke="var(--green)" stroke-width="1.8"/>';
  svg+='<circle cx="'+(cx-63)+'" cy="'+ly2+'" r="2.5" fill="var(--green)"/>';
  svg+='<text x="'+(cx-50)+'" y="'+(ly2+3.5)+'" font-size="9" fill="rgba(156,163,191,.85)" font-family="DM Sans,sans-serif">Rang résultat (bien-être)</text>';

  svg+='<text x="'+cx+'" y="'+(H-4)+'" text-anchor="middle" font-size="7.5" fill="rgba(156,163,191,.45)" font-family="DM Sans,sans-serif">Plus c\'est grand, meilleur est le rang (1er)</text>';

  svg+='</svg>';
  return'<div class="radar-wrap">'+svg+'</div>';
}

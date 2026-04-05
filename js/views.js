/* ══════════════════════════════════════════════════
   HEATMAP
   ══════════════════════════════════════════════════ */
function renderHeatmap(){
  var svg=d3.select('#heatmapChart');
  svg.selectAll('*').remove();

  var W=900, H=700;
  var ml=142, mr=8, mt=54, mb=24;
  var cw=(W-ml-mr)/ND, ch=(H-mt-mb)/keysFiltered.length;

  var sorted=keysFiltered.slice().sort(function(a,b){return avgZ(b)-avgZ(a)});

  var allZ=[];
  sorted.forEach(function(k){for(var di=0;di<ND;di++){var z=getZ(k,di);if(!isNaN(z))allZ.push(z);}});
  var zMax=Math.max(Math.abs(d3.min(allZ)||0),Math.abs(d3.max(allZ)||0),0.1);

  function hmColor(z){
    if(isNaN(z)||z==null)return'var(--dim)';
    var t=Math.max(0,Math.min(1,(z/zMax+1)/2));
    if(t<0.5){
      var s=t*2;
      return'rgb('+Math.round(248+(22-248)*s)+','+Math.round(113+(25-113)*s)+','+Math.round(113+(41-113)*s)+')';
    }else{
      var s2=(t-0.5)*2;
      return'rgb('+Math.round(22+(52-22)*s2)+','+Math.round(25+(211-25)*s2)+','+Math.round(41+(153-41)*s2)+')';
    }
  }

  var g=svg.append('g').attr('transform','translate('+ml+','+mt+')');

  var shortDoms=['Santé','Revenus','Travail','Logement','Savoirs','Civisme','Social','Sécurité','Environ.'];
  for(var di=0;di<ND;di++){
    (function(di){
      var gH=g.append('g').attr('transform','translate('+(di*cw+cw/2)+','+-6+')');
      gH.append('text').attr('transform','rotate(-35)').attr('text-anchor','end')
        .attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif')
        .text(shortDoms[di]).append('title').text(DOM_LABELS[di]);
    })(di);
  }

  sorted.forEach(function(k,ri){
    (function(k,ri){
      g.append('text').attr('x',-6).attr('y',ri*ch+ch/2+3.5).attr('text-anchor','end')
        .attr('fill',isHero(k)?'var(--text)':'var(--sub)')
        .attr('font-size','9.5px').attr('font-family','DM Sans,sans-serif')
        .attr('font-weight',isHero(k)?'600':'400')
        .text(D[k].f+' '+D[k].n);

      g.append('text').attr('x',-ml+4).attr('y',ri*ch+ch/2+3.5)
        .attr('fill','var(--muted)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
        .text((ri+1)+'e');

      for(var di2=0;di2<ND;di2++){
        (function(di){
          var z=getZ(k,di);
          g.append('rect').attr('class','hm-cell')
            .attr('x',di*cw+1).attr('y',ri*ch+1).attr('width',cw-2).attr('height',ch-2)
            .attr('rx',2).attr('fill',hmColor(z)).attr('opacity',.9)
            .on('mouseover',function(ev){
              var rd=ranks(di);
              var h='<h4>'+D[k].f+' '+D[k].n+' — '+DOM_LABELS[di]+'</h4>';
              h+='<div class="trow"><span>Z-score</span><span class="tv">'+(isNaN(z)?'—':z>0?'+'+z.toFixed(2):z.toFixed(2))+'</span></div>';
              h+='<div class="trow"><span>Rang effort</span><span class="tv">'+(rd.s[k]||'—')+'/'+keysFiltered.length+'</span></div>';
              h+='<div class="trow"><span>Rang résultat</span><span class="tv">'+(rd.z[k]||'—')+'/'+keysFiltered.length+'</span></div>';
              document.getElementById('tooltip').innerHTML=h;
              document.getElementById('tooltip').style.display='block';
              moveTT(ev);
            }).on('mousemove',moveTT).on('mouseout',hideTT).on('click',function(){showPopup(k)});

          if(ch>=15){
            g.append('text').attr('x',di*cw+cw/2).attr('y',ri*ch+ch/2+3.5)
              .attr('text-anchor','middle').attr('pointer-events','none')
              .attr('fill',Math.abs(z||0)>0.4?'rgba(0,0,0,.7)':'rgba(255,255,255,.3)')
              .attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
              .text(isNaN(z)||z==null?'':z.toFixed(1));
          }
        })(di2);
      }

      var cz=avgZ(k);
      var barW2=Math.max(0,Math.min(30,Math.abs(cz)*15));
      g.append('rect')
        .attr('x',ND*cw+3).attr('y',ri*ch+ch/4).attr('width',barW2).attr('height',ch/2)
        .attr('rx',2).attr('fill',cz>=0?'var(--green)':'var(--red)').attr('opacity',.7);
      g.append('text').attr('x',ND*cw+barW2+6).attr('y',ri*ch+ch/2+3.5)
        .attr('fill','var(--sub)').attr('font-size','7.5px').attr('font-family','DM Sans,sans-serif')
        .text(cz>0?'+'+cz.toFixed(1):cz.toFixed(1));
    })(k,ri);
  });

  var defs=svg.append('defs');
  var grad=defs.append('linearGradient').attr('id','hmGrad').attr('x1','0%').attr('x2','100%');
  grad.append('stop').attr('offset','0%').attr('stop-color','#f87171');
  grad.append('stop').attr('offset','50%').attr('stop-color','#161929');
  grad.append('stop').attr('offset','100%').attr('stop-color','#34d399');

  var lgW=140, lgX=ml+(W-ml-mr)/2-lgW/2;
  svg.append('rect').attr('x',lgX).attr('y',H-18).attr('width',lgW).attr('height',7).attr('rx',3).attr('fill','url(#hmGrad)');
  svg.append('text').attr('x',lgX-4).attr('y',H-12).attr('text-anchor','end').attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('− mauvais');
  svg.append('text').attr('x',lgX+lgW+4).attr('y',H-12).attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('+ bon');
  svg.append('text').attr('x',lgX+lgW/2).attr('y',H-12).attr('text-anchor','middle').attr('fill','var(--muted)').attr('font-size','8px').attr('font-family','DM Sans,sans-serif').text('z-score');
}


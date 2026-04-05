/* ================================================================
   CONFIG — Constantes globales & configuration
   ================================================================ */
var D={},MDATA={},SYNTH={},SAT={},CTX={},DCAT={};
var DOMS=["Sante","Revenu","Travail","Logement","Savoirs","Engagement civique","Liens sociaux","Securite","Environnement"];
var DOM_LABELS=["Santé","Revenu & patrimoine","Travail & emploi","Logement","Savoirs & compétences","Engagement civique","Liens sociaux","Sécurité","Qualité environnementale"];
var ND=9,NP=1,PI=0;
var keys=[],keysFiltered=[],curDom=-1,focusKey=null,weights=[1,1,1,1,1,1,1,1,1];
var cGs={};

/* Countries excluded after the bar-chart section (inflated GDP) */
var EXCLUDED_AFTER_BAR=['IE','LU'];

/* Key countries to highlight in storytelling */
var HERO_KEYS=['FR','IE','LU','GR','NL'];
function isHero(k){return HERO_KEYS.indexOf(k)>=0}

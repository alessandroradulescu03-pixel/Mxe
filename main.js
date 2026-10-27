(function(){
  document.documentElement.classList.add('js');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu mobile
  var nav=document.querySelector('.nav'),burger=document.querySelector('.burger');
  if(burger)burger.addEventListener('click',function(){
    var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o);
  });

  // pagina attiva
  var page=document.body.getAttribute('data-page');
  document.querySelectorAll('.nav ul a').forEach(function(a){
    if(a.getAttribute('data-p')===page)a.classList.add('on');
  });

  // orari settimana tipo
  var names=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  var full=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  var chip={4:'9:30–17',5:'9–15',6:'9–16'};
  var lng={4:'9:30 – 17:00',5:'9:00 – 15:00',6:'9:00 – 16:00'};
  var d=new Date().getDay();
  function closed(n){return n===1||n===2}

  // scheda "oggi" in home
  var wk=document.getElementById('tdWeek');
  if(wk){
    var html='';
    [1,2,3,4,5,6,0].forEach(function(n){
      html+='<li class="'+(closed(n)?'c':'')+(n===d?' now':'')+'">'+names[n]+'<b>'+(closed(n)?'chiuso':(chip[n]||'IG'))+'</b></li>';
    });
    wk.innerHTML=html;
    document.getElementById('tdLab').textContent='Oggi · '+full[d];
    var st=document.getElementById('tdState'),tx=document.getElementById('tdText');
    if(closed(d)){st.textContent='Chiusi';st.className='state x closed';tx.textContent='Si riapre mercoledì. Orari su Instagram la sera prima.';}
    else{st.textContent='Aperti';st.className='state x open';tx.textContent=lng[d]?('Di solito '+lng[d]+'. Conferma su Instagram la sera prima.'):'Orari del giorno su Instagram la sera prima.';}
  }

  // giorno di oggi nella pagina orari
  var t=document.querySelector('.day[data-d="'+d+'"]');if(t)t.classList.add('now');

  // reveal allo scroll (contenuti visibili anche senza)
  if('IntersectionObserver' in window&&!reduce){
    var els=[].slice.call(document.querySelectorAll('.rv'));
    els.forEach(function(el){if(el.getBoundingClientRect().top>innerHeight*.9)el.classList.add('pre')});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}
    })},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }

  // copia codice Google Maps
  var cp=document.getElementById('copy');
  if(cp)cp.addEventListener('click',function(){
    var txt='GQ3R+HC Covo, Provincia di Bergamo';
    function ok(){cp.textContent='Copiato ✓';setTimeout(function(){cp.textContent='Copia'},1800)}
    function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('pc'));var s=getSelection();s.removeAllRanges();s.addRange(r)}
    try{navigator.clipboard.writeText(txt).then(ok,sel)}catch(e){sel()}
  });
})();

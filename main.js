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
    var txt='MXE.45, SP102, 24050 Covo (BG)';
    var lbl=cp.querySelector('span')||cp;var o0=lbl.textContent;function ok(){lbl.textContent='Copiato ✓';setTimeout(function(){lbl.textContent=o0},1800)}
    function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('pc'));var s=getSelection();s.removeAllRanges();s.addRange(r)}
    try{navigator.clipboard.writeText(txt).then(ok,sel)}catch(e){sel()}
  });
})();

// mappa "Dove siamo"
(function(){
  var btns=[].slice.call(document.querySelectorAll('.cbtn'));
  if(!btns.length)return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rider=document.querySelector('.rider'),ro=document.querySelector('.readout'),raf;
  document.querySelectorAll('.route').forEach(function(p){p.style.setProperty('--len',Math.ceil(p.getTotalLength()))});
  function ride(path){
    cancelAnimationFrame(raf);
    var L=path.getTotalLength(),t0=null,dur=1100;
    if(reduce){var e=path.getPointAtLength(L);rider.setAttribute('cx',e.x);rider.setAttribute('cy',e.y);rider.style.opacity=0;return}
    rider.style.opacity=1;
    function step(ts){
      if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/dur);k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      var p=path.getPointAtLength(L*k);rider.setAttribute('cx',p.x);rider.setAttribute('cy',p.y);
      if(k<1)raf=requestAnimationFrame(step);else rider.style.opacity=0;
    }
    raf=requestAnimationFrame(step);
  }
  function pick(c){
    btns.forEach(function(b){b.classList.toggle('on',b.dataset.c===c)});
    document.querySelectorAll('.city').forEach(function(g){g.classList.toggle('on',g.dataset.c===c)});
    document.querySelectorAll('.route').forEach(function(p){
      p.classList.remove('on');
      if(p.dataset.c===c){void p.getBoundingClientRect();p.classList.add('on');ride(p)}
    });
    var b=btns.filter(function(x){return x.dataset.c===c})[0];
    document.getElementById('roFrom').textContent=b.querySelector('.cn').textContent;
    document.getElementById('roTime').textContent=b.dataset.t;
    document.getElementById('roText').textContent=b.dataset.d;
    ro.classList.remove('flash');void ro.offsetWidth;ro.classList.add('flash');
  }
  btns.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.c)})});
  document.querySelectorAll('.city').forEach(function(g){g.addEventListener('click',function(){pick(g.dataset.c)})});
  pick(btns[0].dataset.c);
})();

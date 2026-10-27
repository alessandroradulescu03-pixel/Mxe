(function(){
  var root=document.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu mobile
  var nav=document.querySelector('.nav'), burger=document.querySelector('.burger');
  if(burger){burger.addEventListener('click',function(){
    var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o);
  });}

  // pagina attiva
  var page=document.body.getAttribute('data-page');
  document.querySelectorAll('.nav ul a').forEach(function(a){
    if(a.getAttribute('data-p')===page)a.setAttribute('aria-current','page');
  });

  // reveal allo scroll (gli elementi sono già visibili a riposo)
  if('IntersectionObserver' in window && !reduce){
    var els=[].slice.call(document.querySelectorAll('.rv'));
    var vh=innerHeight;
    els.forEach(function(el){ if(el.getBoundingClientRect().top>vh*0.9) el.classList.add('pre'); });
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target);}
    });},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }

  // oggi negli orari
  var d=new Date().getDay(); // 0 = domenica
  var t=document.querySelector('.day[data-d="'+d+'"]'); if(t)t.classList.add('today');

  // stato di oggi nella home
  var st=document.getElementById('oggi');
  if(st){
    var chiuso=(d===1||d===2);
    st.className='pill'+(chiuso?' off':'');
    st.innerHTML='<span class="dot"></span>'+(chiuso?'Oggi chiuso':'Oggi: guarda il post su IG');
  }

  // tabella che segue il mouse
  var plate=document.querySelector('.plate');
  if(plate&&!reduce){
    window.addEventListener('pointermove',function(e){
      var x=(e.clientX/innerWidth-.5), y=(e.clientY/innerHeight-.5);
      plate.style.transform='rotate(-5deg) perspective(700px) rotateY('+(x*18)+'deg) rotateX('+(-y*14)+'deg)';
    });
  }

  // copia plus code
  var cp=document.getElementById('copy');
  if(cp){cp.addEventListener('click',function(){
    var txt='GQ3R+HC Covo, Provincia di Bergamo';
    function ok(){cp.textContent='Copiato ✓';setTimeout(function(){cp.textContent='Copia codice'},1800)}
    function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('pc'));var s=getSelection();s.removeAllRanges();s.addRange(r)}
    try{navigator.clipboard.writeText(txt).then(ok,sel)}catch(e){sel()}
  });}

})();

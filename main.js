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

// mappa "Dove siamo" — mappa reale (OpenStreetMap/CARTO) e percorso reale (OSRM)
(function(){
  var btns=[].slice.call(document.querySelectorAll('.cbtn'));
  var el=document.getElementById('map');
  if(!btns.length||!el)return;
  var ro=document.querySelector('.readout');
  var dest=[+el.dataset.lat,+el.dataset.lon];
  var map=null,line=null,startDot=null,cache={},cur=null;

  if(window.L){
    map=L.map(el,{scrollWheelZoom:false,zoomControl:true,attributionControl:true}).setView(dest,10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
      maxZoom:18,subdomains:'abcd',
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    map.attributionControl.setPrefix(false);
    var pin=L.divIcon({className:'mxpin',html:'<span class="r"></span><span class="r r2"></span><b>45</b><i></i>',iconSize:[60,80],iconAnchor:[30,74]});
    L.marker(dest,{icon:pin,zIndexOffset:1000,title:'MXE.45'}).addTo(map);
    btns.forEach(function(b){
      var ll=b.dataset.ll.split(',').map(Number);
      L.circleMarker(ll,{radius:6,color:'#9aa3b5',weight:3,fillColor:'#141920',fillOpacity:1})
        .addTo(map).bindTooltip(b.querySelector('.cn').textContent,{permanent:true,direction:'top',className:'ctip',offset:[0,-8]})
        .on('click',function(){pick(b.dataset.c)});
    });
  }else{
    el.innerHTML='<p class="nomap">Mappa non disponibile qui. Usa i bottoni del navigatore qui sotto.</p>';
  }

  function draw(coords){
    if(line)map.removeLayer(line);
    line=L.polyline(coords,{color:'#1f4fe0',weight:6,opacity:1,lineCap:'round',className:'mxroute'}).addTo(map);
    map.fitBounds(line.getBounds(),{padding:[60,60],animate:false});
    var p=line.getElement&&line.getElement();
    if(p&&p.getTotalLength){
      var L0=p.getTotalLength();p.style.transition='none';p.style.strokeDasharray=L0;p.style.strokeDashoffset=L0;p.getBoundingClientRect();
      p.style.transition='stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';p.style.strokeDashoffset=0;
      setTimeout(function(){p.style.transition='none';p.style.strokeDasharray='';p.style.strokeDashoffset=''},1300);
    }
  }
  function setTime(t,txt){document.getElementById('roTime').textContent=t;if(txt)document.getElementById('roText').textContent=txt}

  function pick(c){
    cur=c;
    var b=btns.filter(function(x){return x.dataset.c===c})[0];
    btns.forEach(function(x){x.classList.toggle('on',x===b)});
    document.getElementById('roFrom').textContent=b.querySelector('.cn').textContent;
    setTime(b.dataset.t,b.dataset.d);
    ro.classList.remove('flash');void ro.offsetWidth;ro.classList.add('flash');
    if(!map)return;
    var from=b.dataset.ll.split(',').map(Number);
    if(startDot)map.removeLayer(startDot);
    startDot=L.circleMarker(from,{radius:8,color:'#fff',weight:3,fillColor:'#1f4fe0',fillOpacity:1}).addTo(map);
    function show(r){
      if(cur!==c)return;
      draw(r.coords);
      setTime("~"+r.min+"'",r.km+' km in auto, percorso più veloce.');
    }
    if(cache[c])return show(cache[c]);
    var url='https://router.project-osrm.org/route/v1/driving/'+from[1]+','+from[0]+';'+dest[1]+','+dest[0]+'?overview=full&geometries=geojson';
    fetch(url).then(function(r){return r.json()}).then(function(d){
      var rt=d.routes[0];
      cache[c]={coords:rt.geometry.coordinates.map(function(p){return[p[1],p[0]]}),min:Math.round(rt.duration/60/5)*5||Math.round(rt.duration/60),km:Math.round(rt.distance/1000)};
      show(cache[c]);
    }).catch(function(){ if(cur===c) draw([from,dest]); });
  }
  btns.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.c)})});
  pick(btns[0].dataset.c);
})();

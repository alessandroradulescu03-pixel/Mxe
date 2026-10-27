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
  var chip={0:'9–17',2:'9–17',3:'9–17',4:'9–17',5:'9–17',6:'9–17'};
  var lng={0:'9:00 – 17:00',2:'9:00 – 17:00',3:'9:00 – 17:00',4:'9:00 – 17:00',5:'9:00 – 17:00',6:'9:00 – 17:00'};
  // ora di Covo (Europe/Rome), indipendente dal fuso di chi visita
  function romeNow(){
    try{
      var p={};new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false})
        .formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
      return {d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday),m:(+p.hour%24)*60+(+p.minute)};
    }catch(e){var n=new Date();return {d:n.getDay(),m:n.getHours()*60+n.getMinutes()}}
  }
  var OPEN=9*60,CLOSE=17*60;
  function closed(n){return n===1}
  var d=romeNow().d;

  // scheda "oggi" in home: aperto/chiuso in base al giorno E all'ora
  var wk=document.getElementById('tdWeek');
  function nextOpen(day){ // primo giorno di apertura dopo "day"
    for(var i=1;i<=7;i++){var n=(day+i)%7;if(!closed(n))return {n:n,i:i}}
  }
  function status(){
    var now=romeNow(),st=document.getElementById('tdState'),tx=document.getElementById('tdText');
    document.getElementById('tdLab').textContent='Oggi · '+full[now.d];
    var html='';
    [1,2,3,4,5,6,0].forEach(function(n){
      html+='<li class="'+(closed(n)?'c':'')+(n===now.d?' now':'')+'">'+names[n]+'<b>'+(closed(n)?'chiuso':chip[n])+'</b></li>';
    });
    wk.innerHTML=html;
    function set(word,cls,text){st.textContent=word;st.className='state x '+cls;tx.textContent=text}
    if(!closed(now.d)&&now.m>=OPEN&&now.m<CLOSE){
      var left=CLOSE-now.m;
      if(left<=60)set('Aperti','soon','Chiude tra '+left+' min, alle 17:00.');
      else set('Aperti','open','Fino alle 17:00. Pioggia o gare? Guarda Instagram.');
    }else if(!closed(now.d)&&now.m<OPEN){
      set('Chiusi','closed','Apre oggi alle 9:00.');
    }else{
      var nx=nextOpen(now.d);
      set('Chiusi','closed','Riapre '+(nx.i===1?'domani, '+full[nx.n]:full[nx.n])+', alle 9:00.');
    }
  }
  if(wk){status();setInterval(status,30000);}

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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,className:'mxtiles',
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
  // minuti -> "circa 9 ore 30 min" / "circa 1 giorno 3 ore"
  function parts(min){
    min=Math.max(1,Math.round(min));
    if(min<60){return [[min>=20?Math.round(min/5)*5:min,'min']]}
    if(min<24*60){
      var h=Math.floor(min/60),m=Math.round((min%60)/5)*5;
      if(m===60){h++;m=0}
      var out=[[h,h===1?'ora':'ore']];if(m)out.push([m,'min']);return out;
    }
    var d=Math.floor(min/1440),hh=Math.round((min%1440)/60);
    if(hh===24){d++;hh=0}
    var o=[[d,d===1?'giorno':'giorni']];if(hh)o.push([hh,hh===1?'ora':'ore']);return o;
  }
  function setTime(t,txt){
    var el=document.getElementById('roTime');
    if(typeof t==='number'){
      el.innerHTML='<span class="circa">circa</span>'+parts(t).map(function(p){return '<span class="seg"><b>'+p[0]+'</b><u>'+p[1]+'</u></span>'}).join('');
      el.classList.toggle('long',t>=60);
    }else{el.textContent=t;el.classList.remove('long')}
    if(txt)document.getElementById('roText').textContent=txt;
  }

  function flash(){ro.classList.remove('flash');void ro.offsetWidth;ro.classList.add('flash')}
  // calcola e disegna il percorso da "from" [lat,lon] alla pista
  function routeFrom(key,label,from,fallbackT,fallbackD){
    cur=key;
    document.getElementById('roFrom').textContent=label;
    setTime(fallbackT?+fallbackT:'…',fallbackD||'Calcolo il percorso…');
    flash();
    if(!map)return;
    if(startDot)map.removeLayer(startDot);
    startDot=L.circleMarker(from,{radius:8,color:'#fff',weight:3,fillColor:'#1f4fe0',fillOpacity:1}).addTo(map);
    function show(r){
      if(cur!==key)return;
      draw(r.coords);
      setTime(r.min,r.km.toLocaleString('it-IT')+' km in auto, percorso più veloce.');
    }
    if(cache[key])return show(cache[key]);
    var url='https://router.project-osrm.org/route/v1/driving/'+from[1]+','+from[0]+';'+dest[1]+','+dest[0]+'?overview=full&geometries=geojson';
    fetch(url).then(function(r){return r.json()}).then(function(d){
      var rt=d.routes[0],m=Math.round(rt.duration/60);
      cache[key]={coords:rt.geometry.coordinates.map(function(p){return[p[1],p[0]]}),min:rt.duration/60,km:Math.max(1,Math.round(rt.distance/1000))};
      show(cache[key]);
    }).catch(function(){
      if(cur!==key)return;
      draw([from,dest]);
      setTime(fallbackT?+fallbackT:'—',fallbackT?fallbackD:'Non riesco a calcolare il percorso adesso. Usa i bottoni del navigatore qui sotto.');
    });
  }
  function pick(c){
    var b=btns.filter(function(x){return x.dataset.c===c})[0];
    btns.forEach(function(x){x.classList.toggle('on',x===b)});
    routeFrom(c,b.querySelector('.cn').textContent,b.dataset.ll.split(',').map(Number),b.dataset.t,b.dataset.d);
  }
  // casella "da dove parti"
  var form=document.getElementById('fromForm'),inp=document.getElementById('fromInput'),msg=document.getElementById('fromMsg'),geo=document.getElementById('geoBtn');
  function custom(label,ll){
    btns.forEach(function(x){x.classList.remove('on')});
    msg.textContent='';
    routeFrom('q:'+ll.join(','),label,ll);
  }
  if(form)form.addEventListener('submit',function(e){
    e.preventDefault();
    var q=inp.value.trim();if(!q)return;
    msg.textContent='Cerco “'+q+'”…';
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&accept-language=it&q='+encodeURIComponent(q))
      .then(function(r){return r.json()}).then(function(res){
        if(!res.length){msg.textContent='Non trovo “'+q+'”. Prova con paese e provincia, es. “Chiari BS”.';return}
        var label=res[0].display_name.split(',')[0];
        custom(label,[+res[0].lat,+res[0].lon]);
      }).catch(function(){msg.textContent='Ricerca non disponibile adesso. Usa i bottoni del navigatore qui sotto.'});
  });
  if(geo){
    if(!navigator.geolocation)geo.hidden=true;
    geo.addEventListener('click',function(){
      msg.textContent='Cerco la tua posizione…';
      navigator.geolocation.getCurrentPosition(function(p){
        custom('La tua posizione',[p.coords.latitude,p.coords.longitude]);
      },function(err){
        var t={
          1:'Hai bloccato la posizione per questo sito. Riattivala dalle impostazioni del browser, oppure scrivi il tuo paese qui sopra.',
          2:'Il dispositivo non riesce a trovare la posizione. Controlla che la localizzazione sia attiva, oppure scrivi il tuo paese qui sopra.',
          3:'Ci sta mettendo troppo a trovare la posizione. Riprova, oppure scrivi il tuo paese qui sopra.'
        };
        msg.textContent=t[err&&err.code]||'Posizione non disponibile. Scrivi il tuo paese qui sopra.';
      },{enableHighAccuracy:false,timeout:20000,maximumAge:300000});
    });
  }
  btns.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.c)})});
  pick(btns[0].dataset.c);
})();

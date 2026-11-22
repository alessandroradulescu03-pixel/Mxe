/* Area riservata MXE.45: i proprietari decidono se la pista è aperta o chiusa, con motivo, orari e avvisi.
   Pensata per essere semplicissima: testo grande, pulsanti grandi.
   ⚠️ Per ora usa il progetto Supabase di Mery Drift (stessa tabella amministratori, stessa password).
   Quando MXE avrà il suo progetto cambia solo SB_URL e SB_KEY qui e in main.js. */
(function(){
  var SB_URL='https://dcjqhleaevdjijjdqovs.supabase.co';
  var SB_KEY='sb_publishable_1Fhv9LdqgTjoqqBKdKYGIg_AONI8Flr'; // chiave pubblica: può stare nel sito
  // sessione salvata con un nome diverso da quella di Mery Drift: i due admin non si disturbano
  var sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storageKey:'mxe45-admin'}});

  var toastT;
  function toast(msg,ko){var t=document.getElementById('axToast');t.textContent=msg;t.className='ax-toast'+(ko?' ko':'');t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true;},3500);}

  // ---------- accesso ----------
  function vista(v){$('axLogin').hidden=v!=='login';$('axApp').hidden=v!=='app';$('axOut').hidden=v!=='app';}
  async function entra(session){
    if(!session){vista('login');return;}
    var r=await sb.rpc('sono_admin');
    if(r.error||!r.data){
      await sb.auth.signOut();vista('login');
      var e=$('loginErr');e.textContent='Questo account non può entrare qui. Chiedi a chi ha fatto il sito.';e.hidden=false;return;
    }
    vista('app');carica();
  }

  // ⚠️ orario normale: deve restare uguale a quello in main.js
  var NORMALE={apre:'09:00',chiude:'17:00',chiusoIl:[1]}; // 1 = lunedì
  var MOTIVI=['🌧  Pioggia','🏁  Gara','🔧  Lavori in pista','🚧  Pista non agibile','🔒  Evento privato'];
  var MESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  var GIORNI=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];

  var $=function(id){return document.getElementById(id);};
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
  function btn(cls,txt,fn){var b=el('button',cls,txt);b.type='button';if(fn)b.addEventListener('click',fn);return b;}
  function pad(n){return (n<10?'0':'')+n;}
  function parts(s){var p=s.split('-');return {y:+p[0],m:+p[1]-1,d:+p[2]};}
  function dow(s){var p=parts(s);return new Date(p.y,p.m,p.d).getDay();}
  function piu(s,n){var p=parts(s),d=new Date(p.y,p.m,p.d+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function oggi(){
    try{var o={};new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'})
      .formatToParts(new Date()).forEach(function(x){o[x.type]=x.value;});return o.year+'-'+o.month+'-'+o.day;}
    catch(e){var n=new Date();return n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());}
  }
  function nome(s){
    var p=parts(s),t=oggi();
    var base=GIORNI[dow(s)]+' '+p.d+' '+MESI[p.m];
    return s===t?'Oggi · '+base:s===piu(t,1)?'Domani · '+base:base;
  }
  function ora(t){return t?String(t).slice(0,5).replace(/^0/,''):'';}

  var righe={},giorni=7,aperto=null,calM=null; // righe salvate, giorni nella lista, giorno in modifica, mese del calendario
  var MESI_C=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

  // com'è davvero un giorno: orario normale + eventuale modifica salvata
  function stato(s){
    var r=righe[s],normaleChiuso=NORMALE.chiusoIl.indexOf(dow(s))>-1;
    var x={data:s,riga:r||null,avviso:r&&r.avviso||'',motivo:'',apre:NORMALE.apre,chiude:NORMALE.chiude};
    if(!r){x.aperto=!normaleChiuso;x.speciale=false;}
    else if(r.aperto){
      x.aperto=true;
      if(r.apre)x.apre=ora(r.apre);
      if(r.chiude)x.chiude=ora(r.chiude);
      x.speciale=normaleChiuso||!!r.apre||!!r.chiude;
    }else{
      x.aperto=false;x.motivo=r.motivo||'';
      x.speciale=!normaleChiuso||!!r.motivo;
    }
    return x;
  }

  async function carica(){
    var t=oggi();
    var r=await sb.from('stato_pista').select('data,aperto,apre,chiude,motivo,avviso').gte('data',t).order('data');
    if(r.error){$('psMsg').textContent='Non riesco a caricare lo stato della pista. Controlla internet e premi "Aggiorna".';$('psDays').textContent='';return;}
    righe={};(r.data||[]).forEach(function(x){righe[x.data]=x;});
    $('psMsg').textContent='';
    disegna();
  }

  function date(){
    var t=oggi(),l=[];
    for(var i=0;i<giorni;i++)l.push(piu(t,i));
    // anche i giorni lontani con una modifica salvata
    Object.keys(righe).forEach(function(s){if(s>=t&&l.indexOf(s)<0)l.push(s);});
    return l.sort();
  }

  function disegna(){
    var box=$('psDays');box.textContent='';
    var l=date();
    l.forEach(function(s){box.appendChild(riga(s));});
    // giorno scelto dal calendario che non è nella lista: lo mostro sotto il calendario
    var cd=$('psCalDay');cd.textContent='';
    if(aperto&&l.indexOf(aperto)<0)cd.appendChild(riga(aperto));
    calendario();
  }

  // ---------- calendario del mese ----------
  function calendario(){
    var t=oggi(),pt=parts(t);
    if(!calM)calM={y:pt.y,m:pt.m};
    var min=pt.y*12+pt.m,cur=calM.y*12+calM.m,max=min+12;
    var box=$('psCal');box.textContent='';
    var head=el('div','pc-head');
    var prev=btn('pc-nav','‹',function(){calM=cur-1<min?calM:{y:Math.floor((cur-1)/12),m:(cur-1)%12};calendario();});
    prev.setAttribute('aria-label','Mese prima');prev.disabled=cur<=min;
    var next=btn('pc-nav','›',function(){calM={y:Math.floor((cur+1)/12),m:(cur+1)%12};calendario();});
    next.setAttribute('aria-label','Mese dopo');next.disabled=cur>=max;
    head.appendChild(prev);head.appendChild(el('p','pc-title x',MESI_C[calM.m]+' '+calM.y));head.appendChild(next);
    box.appendChild(head);
    var g=el('div','pc-grid');g.setAttribute('role','grid');
    ['L','M','M','G','V','S','D'].forEach(function(d){g.appendChild(el('span','pc-wd',d));});
    var first=new Date(calM.y,calM.m,1),vuoti=(first.getDay()+6)%7,n=new Date(calM.y,calM.m+1,0).getDate();
    for(var i=0;i<vuoti;i++)g.appendChild(el('span','pc-empty'));
    for(var d=1;d<=n;d++){
      var s=calM.y+'-'+pad(calM.m+1)+'-'+pad(d);
      var c=el('button','pc-d');c.type='button';
      c.appendChild(el('b',null,d));
      if(s<t){c.className+=' pc-past';c.disabled=true;}
      else{
        var x=stato(s),lab;
        c.className+=x.aperto?(x.speciale||x.avviso?' pc-spec':' pc-ok'):' pc-shut';
        lab=!x.aperto?'chiuso':x.speciale?ora(x.apre).replace(':00','')+'–'+ora(x.chiude).replace(':00',''):x.avviso?'avviso':'';
        if(lab)c.appendChild(el('small',null,lab));
        c.setAttribute('aria-label',nome(s)+': '+(x.aperto?'aperti '+ora(x.apre)+'–'+ora(x.chiude):'chiusi'+(x.motivo?', '+x.motivo:''))+(x.avviso?', avviso: '+x.avviso:''));
        if(s===t)c.className+=' pc-today';
        if(s===aperto)c.className+=' pc-sel';
        (function(s){c.addEventListener('click',function(){
          aperto=s;disegna();
          var r=document.querySelector('.ps-day.editing');if(r)r.scrollIntoView({behavior:'smooth',block:'start'});
        });})(s);
      }
      g.appendChild(c);
    }
    box.appendChild(g);
  }

  function riga(s){
    var x=stato(s);
    var li=el('li','ps-day '+(x.aperto?(x.speciale?'ps-spec':'ps-open'):'ps-shut')+(aperto===s?' editing':''));
    var testa=el('div','ps-head');
    var info=el('div','ps-info');
    info.appendChild(el('p','ps-name',nome(s)));
    var st;
    if(!x.aperto)st='❌  Chiusi'+(x.motivo?' · '+x.motivo:'');
    else st=(x.speciale?'🕘  Aperti ':'✅  Aperti ')+ora(x.apre)+'–'+ora(x.chiude)+(x.speciale?' (orario speciale)':'');
    info.appendChild(el('p','ps-state',st));
    if(x.avviso)info.appendChild(el('p','ps-note','📢 '+x.avviso));
    testa.appendChild(info);
    testa.appendChild(btn(aperto===s?'ax-btn':'ax-big',aperto===s?'Lascia stare':'Cambia',function(){aperto=aperto===s?null:s;disegna();}));
    li.appendChild(testa);
    if(aperto===s)li.appendChild(pannello(x));
    return li;
  }

  function pannello(x){
    var p=el('div','ps-edit');
    var azioni=el('div','ax-row');
    var sotto=el('div','ps-sub');
    function mostra(n){sotto.textContent='';sotto.appendChild(n);}

    if(x.aperto){
      azioni.appendChild(btn('ax-btn ps-no','❌  Chiudi questo giorno',function(){mostra(motivi(x));}));
      azioni.appendChild(btn('ax-btn','🕘  Cambia orario',function(){mostra(orario(x,false));}));
    }else{
      azioni.appendChild(btn('ax-btn ps-yes','✅  Apri questo giorno',function(){mostra(orario(x,true));}));
      if(x.speciale)azioni.appendChild(btn('ax-btn','✏️  Cambia il motivo',function(){mostra(motivi(x));}));
    }
    azioni.appendChild(btn('ax-btn','📢  '+(x.avviso?'Cambia l\'avviso':'Scrivi un avviso'),function(){mostra(avviso(x));}));
    p.appendChild(azioni);
    p.appendChild(sotto);
    if(x.riga)p.appendChild(btn('ax-link','↩  Togli tutte le modifiche e torna all\'orario normale',function(){normale(x);}));
    return p;
  }

  function motivi(x){
    var w=el('div','ax-chiudi');
    w.appendChild(el('p','ax-chiudi-q','Perché è chiuso? La gente vedrà il motivo sul sito.'));
    MOTIVI.forEach(function(t){
      w.appendChild(btn('ax-btn',t,function(){chiudi(x,t.replace(/^\S+\s+/,''));}));
    });
    w.appendChild(btn('ax-btn','✏️  Scrivo io il motivo',function(){
      var m=prompt('Scrivi il motivo della chiusura (es. "Fondo troppo bagnato"):',x.motivo||'');
      if(m&&m.trim())chiudi(x,m.trim().slice(0,80));
    }));
    return w;
  }

  function orario(x,apri){
    var f=el('form','ps-form');f.noValidate=true;
    var box=el('div','ax-fields');
    function campo(lab,val){
      var w=el('div','ax-field'),id='ps-'+lab.length+'-'+x.data;
      var l=el('label',null,lab);l.htmlFor=id;
      var i=el('input');i.id=id;i.type='time';i.step=900;i.value=val.length===4?'0'+val:val;
      w.appendChild(l);w.appendChild(i);box.appendChild(w);return i;
    }
    var a=campo('Apre alle',x.apre||NORMALE.apre),c=campo('Chiude alle',x.chiude||NORMALE.chiude);
    f.appendChild(box);
    var err=el('p','ax-err');err.hidden=true;f.appendChild(err);
    var sv=el('button','ax-big',apri?'Apri con questo orario':'Salva l\'orario');sv.type='submit';f.appendChild(sv);
    f.addEventListener('submit',function(ev){
      ev.preventDefault();err.hidden=true;
      if(!a.value||!c.value){err.textContent='Scrivi sia l\'ora di apertura sia quella di chiusura.';err.hidden=false;return;}
      if(a.value>=c.value){err.textContent='L\'ora di chiusura deve venire dopo quella di apertura.';err.hidden=false;return;}
      var normali=a.value===NORMALE.apre&&c.value===NORMALE.chiude&&NORMALE.chiusoIl.indexOf(dow(x.data))<0;
      salva(x,{aperto:true,apre:normali?null:a.value,chiude:normali?null:c.value,motivo:null},
        apri?'Fatto: '+nome(x.data).toLowerCase()+' aperti ✓':'Orario salvato ✓');
    });
    return f;
  }

  function avviso(x){
    var f=el('form','ps-form');f.noValidate=true;
    var w=el('div','ax-field'),id='ps-av-'+x.data;
    var l=el('label',null,'Avviso (si vede sul sito sotto "aperti" o "chiusi")');l.htmlFor=id;
    var i=el('input');i.id=id;i.type='text';i.maxLength=160;i.value=x.avviso;i.placeholder='Es. Fondo pesante, gomme da fango consigliate';
    w.appendChild(l);w.appendChild(i);f.appendChild(w);
    var row=el('div','ax-row');
    var sv=el('button','ax-big','Salva l\'avviso');sv.type='submit';row.appendChild(sv);
    if(x.avviso)row.appendChild(btn('ax-link danger','Togli l\'avviso',function(){salvaAvviso(x,null);}));
    f.appendChild(row);
    f.addEventListener('submit',function(ev){ev.preventDefault();var v=i.value.trim();salvaAvviso(x,v||null);});
    setTimeout(function(){i.focus();},50);
    return f;
  }

  // ---------- salvataggi ----------
  function chiudi(x,motivo){
    salva(x,{aperto:false,apre:null,chiude:null,motivo:motivo},'Fatto: sul sito ora c\'è «Chiusi · '+motivo+'»');
  }
  function salvaAvviso(x,testo){
    var base=x.riga?{aperto:x.riga.aperto,apre:x.riga.apre,chiude:x.riga.chiude,motivo:x.riga.motivo}
                   :{aperto:x.aperto,apre:null,chiude:null,motivo:null};
    base.avviso=testo;
    // niente da salvare se resta solo l'orario normale senza avviso
    if(!testo&&!x.speciale){normale(x,'Avviso tolto');return;}
    salva(x,base,testo?'Avviso salvato: si vede sul sito ✓':'Avviso tolto');
  }
  async function salva(x,campi,ok){
    if(!('avviso' in campi))campi.avviso=x.avviso||null;
    campi.data=x.data;
    // se alla fine è tutto come il solito, non serve tenere la riga
    var normaleChiuso=NORMALE.chiusoIl.indexOf(dow(x.data))>-1;
    if(campi.aperto===!normaleChiuso&&!campi.apre&&!campi.chiude&&!campi.motivo&&!campi.avviso){normale(x,ok);return;}
    var r=await sb.from('stato_pista').upsert(campi,{onConflict:'data'});
    if(r.error){toast('Non sono riuscito a salvare. Riprova.',true);return;}
    righe[x.data]=campi;aperto=null;disegna();toast(ok);
  }
  async function normale(x,ok){
    if(!x.riga){aperto=null;disegna();if(ok)toast(ok);return;}
    if(!ok&&!confirm('Tornare all\'orario normale per '+nome(x.data).toLowerCase()+'?\n\nSi tolgono anche motivo e avviso.'))return;
    var r=await sb.from('stato_pista').delete().eq('data',x.data);
    if(r.error){toast('Non sono riuscito a salvare. Riprova.',true);return;}
    delete righe[x.data];aperto=null;disegna();toast(ok||'Fatto: orario normale ✓');
  }

  // ---------- pulsanti ----------
  $('lg-show').addEventListener('change',function(){$('lg-pass').type=this.checked?'text':'password';});
  $('loginForm').addEventListener('submit',async function(ev){
    ev.preventDefault();
    var e=$('loginErr'),b=$('loginBtn');e.hidden=true;
    var email=$('lg-email').value.trim(),pass=$('lg-pass').value;
    if(!email||!pass){e.textContent='Scrivi sia l\'email sia la password.';e.hidden=false;return;}
    b.disabled=true;b.textContent='Attendi…';
    var r=await sb.auth.signInWithPassword({email:email,password:pass});
    b.disabled=false;b.textContent='Entra';
    if(r.error){e.textContent='Email o password sbagliate. Controlla e riprova.';e.hidden=false;return;}
    $('lg-pass').value='';entra(r.data.session);
  });
  $('axOut').addEventListener('click',async function(){
    if(!confirm('Vuoi uscire?'))return;
    await sb.auth.signOut();location.href='../';
  });
  $('btnAggiorna').addEventListener('click',function(){carica().then(function(){toast('Aggiornato ✓');});});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&!$('axApp').hidden)carica();});

  sb.auth.getSession().then(function(r){entra(r.data.session);});
})();

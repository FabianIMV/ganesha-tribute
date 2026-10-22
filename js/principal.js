/* ═══════════════════════════════════════════
   Tributo a Sri Ganesha · interacción
   ═══════════════════════════════════════════ */
(function(){
  'use strict';
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(pointer: fine)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(sel){ return document.querySelector(sel); }
  function $$(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function leer(clave, porDefecto){
    try{ var v = localStorage.getItem(clave); return v === null ? porDefecto : JSON.parse(v); }
    catch(e){ return porDefecto; }
  }
  function guardar(clave, valor){
    try{ localStorage.setItem(clave, JSON.stringify(valor)); }catch(e){}
  }
  function svg(tag, attrs){
    var el = document.createElementNS(SVGNS, tag);
    for(var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ════════ reproductor ════════ */
  var reproductor = $('#reproductor');
  var botonMusica = $('#botonMusica');
  var volumen = $('#volumen');

  function actualizarReproductor(){
    var on = Musica.estaSonando();
    reproductor.classList.toggle('sonando', on);
    botonMusica.setAttribute('aria-pressed', String(on));
    botonMusica.setAttribute('aria-label', on ? 'Pausar música' : 'Activar música');
  }
  function encenderMusica(){ Musica.reproducir(); actualizarReproductor(); }

  if(!Musica.disponible){ reproductor.hidden = true; }
  var volGuardado = leer('volumen', 70);
  volumen.value = volGuardado;
  Musica.volumen(volGuardado / 100);
  volumen.addEventListener('input', function(){
    Musica.volumen(volumen.value / 100);
    guardar('volumen', +volumen.value);
  });
  botonMusica.addEventListener('click', function(){
    if(Musica.estaSonando()) Musica.pausar(); else Musica.reproducir();
    actualizarReproductor();
  });

  /* ════════ velo de entrada ════════ */
  var velo = $('#velo');
  function iniciarDibujo(){ document.body.classList.add('iniciado'); }
  function abrirVelo(conMusica){
    if(conMusica){ encenderMusica(); Musica.campana(); }
    velo.classList.add('abriendo');
    document.body.classList.remove('velo-abierto');
    setTimeout(iniciarDibujo, reducido ? 0 : 500);
    setTimeout(function(){ velo.hidden = true; }, reducido ? 0 : 1700);
  }
  if(velo && !velo.hidden){
    document.body.classList.add('velo-abierto');
    $('#entrarMusica').addEventListener('click', function(){ abrirVelo(true); });
    $('#entrarSilencio').addEventListener('click', function(){ abrirVelo(false); });
    velo.addEventListener('keydown', function(e){ if(e.key === 'Escape') abrirVelo(false); });
    $('#entrarMusica').focus();
  } else {
    iniciarDibujo();
  }

  /* ════════ cielo: estrellas, estrellas fugaces y chispas ════════ */
  var lienzo = $('#cielo');
  var ctx = lienzo.getContext('2d');
  var estrellas = [], fugaces = [], chispas = [];
  var dpr = 1, ancho = 0, alto = 0;
  function redimensionar(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = innerWidth; alto = innerHeight;
    lienzo.width = ancho * dpr; lienzo.height = alto * dpr;
    lienzo.style.width = ancho + 'px'; lienzo.style.height = alto + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    estrellas = [];
    var n = Math.floor(ancho * alto / 8000);
    for(var i = 0; i < n; i++){
      estrellas.push({
        x: Math.random() * ancho, y: Math.random() * alto,
        r: Math.random() * 1.3 + .3, p: Math.random() * Math.PI * 2, s: .4 + Math.random() * 1.4,
        c: Math.random() < .15 ? '255,180,120' : '255,226,170'
      });
    }
    if(reducido) dibujarCielo(0);
  }
  redimensionar();
  addEventListener('resize', redimensionar);

  function dibujarCielo(t){
    ctx.clearRect(0, 0, ancho, alto);
    for(var i = 0; i < estrellas.length; i++){
      var e = estrellas[i];
      var a = reducido ? .6 : .25 + .55 * Math.abs(Math.sin(t / 1000 * e.s + e.p));
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + e.c + ',' + a.toFixed(2) + ')';
      ctx.fill();
    }
    if(reducido) return;

    if(Math.random() < 0.0025 && fugaces.length < 2){
      fugaces.push({ x: Math.random() * ancho * .8 + ancho * .2, y: Math.random() * alto * .4, v: 7 + Math.random() * 5, vida: 1 });
    }
    for(i = fugaces.length - 1; i >= 0; i--){
      var f = fugaces[i];
      f.x -= f.v; f.y += f.v * .45; f.vida -= .014;
      var g = ctx.createLinearGradient(f.x, f.y, f.x + 90, f.y - 40);
      g.addColorStop(0, 'rgba(255,240,200,' + f.vida + ')');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + 90, f.y - 40); ctx.stroke();
      if(f.vida <= 0) fugaces.splice(i, 1);
    }

    for(i = chispas.length - 1; i >= 0; i--){
      var c = chispas[i];
      c.x += c.vx; c.y += c.vy; c.vy += .02; c.vida -= .02;
      if(c.vida <= 0){ chispas.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * c.vida, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c.color + ',' + c.vida.toFixed(2) + ')';
      ctx.fill();
    }
    requestAnimationFrame(dibujarCielo);
  }
  requestAnimationFrame(dibujarCielo);

  function lanzarChispas(x, y, cantidad, fuerza){
    if(reducido) return;
    for(var i = 0; i < cantidad; i++){
      var ang = Math.random() * Math.PI * 2, vel = Math.random() * fuerza;
      chispas.push({
        x: x, y: y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - fuerza * .3,
        r: 1 + Math.random() * 2.2, vida: 1,
        color: ['255,215,0', '255,179,71', '255,153,51', '255,94,120'][Math.floor(Math.random() * 4)]
      });
    }
  }
  if(punteroFino && !reducido){
    var ultimaChispa = 0;
    addEventListener('pointermove', function(e){
      var ahora = performance.now();
      if(ahora - ultimaChispa < 45) return;
      ultimaChispa = ahora;
      chispas.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * .6, vy: Math.random() * .4, r: 1.2 + Math.random() * 1.4, vida: 1, color: '255,215,0' });
    }, { passive: true });
  }

  /* ════════ mandala ════════ */
  (function(){
    var cont = $('#mandala');
    var m = svg('svg', { viewBox: '0 0 400 400' });
    function anillo(clase){ var g = svg('g', { 'class': 'anillo ' + clase }); m.appendChild(g); return g; }
    function petalos(g, n, r1, r2, ancho, color, opacidad){
      for(var i = 0; i < n; i++){
        var a = 360 / n * i;
        var p = svg('path', {
          d: 'M200,' + (200 - r1) + ' C' + (200 - ancho) + ',' + (200 - (r1 + r2) / 2) + ' ' + (200 - ancho * .4) + ',' + (200 - r2) + ' 200,' + (200 - r2) +
             ' C' + (200 + ancho * .4) + ',' + (200 - r2) + ' ' + (200 + ancho) + ',' + (200 - (r1 + r2) / 2) + ' 200,' + (200 - r1) + ' Z',
          transform: 'rotate(' + a + ' 200 200)',
          fill: 'none', stroke: color, 'stroke-width': .8, 'stroke-opacity': opacidad
        });
        g.appendChild(p);
      }
    }
    function puntos(g, n, r, tam, color, opacidad){
      for(var i = 0; i < n; i++){
        var a = Math.PI * 2 / n * i;
        g.appendChild(svg('circle', { cx: 200 + Math.cos(a) * r, cy: 200 + Math.sin(a) * r, r: tam, fill: color, 'fill-opacity': opacidad }));
      }
    }
    function circulo(g, r, color, opacidad, guion){
      var c = svg('circle', { cx: 200, cy: 200, r: r, fill: 'none', stroke: color, 'stroke-width': .7, 'stroke-opacity': opacidad });
      if(guion) c.setAttribute('stroke-dasharray', guion);
      g.appendChild(c);
    }
    var a1 = anillo('giro-1');
    petalos(a1, 24, 150, 192, 13, '#ffd700', .32);
    puntos(a1, 48, 196, 1.3, '#ffb347', .5);
    circulo(a1, 150, '#ffd700', .25);
    var a2 = anillo('giro-2');
    petalos(a2, 16, 108, 148, 18, '#ff9933', .3);
    circulo(a2, 104, '#ffb347', .3, '2 5');
    puntos(a2, 32, 100, 1.1, '#ffd700', .45);
    var a3 = anillo('giro-3');
    petalos(a3, 12, 70, 104, 16, '#ff5e78', .22);
    circulo(a3, 66, '#ffd700', .2);
    var halo = svg('circle', { cx: 200, cy: 200, r: 120, fill: 'url(#haloGrad)' });
    var defs = svg('defs', {});
    var rg = svg('radialGradient', { id: 'haloGrad' });
    rg.appendChild(svg('stop', { offset: '0%', 'stop-color': '#ff9933', 'stop-opacity': '.22' }));
    rg.appendChild(svg('stop', { offset: '100%', 'stop-color': '#ff9933', 'stop-opacity': '0' }));
    defs.appendChild(rg);
    m.insertBefore(halo, m.firstChild);
    m.insertBefore(defs, m.firstChild);
    cont.appendChild(m);
  })();

  /* ════════ pétalos de caléndula ════════ */
  var COLORES_PETALO = ['#ff9933', '#ffb347', '#ffd700', '#ff7a45', '#ff5e78'];
  function soltarPetalo(){
    if(document.hidden) return;
    var cont = document.createElement('span');
    cont.className = 'petalo';
    var tam = 9 + Math.random() * 10;
    var s = svg('svg', { width: tam, height: tam * 1.5, viewBox: '0 0 10 15' });
    s.appendChild(svg('path', { d: 'M5,0 C9,3 9,10 5,15 C1,10 1,3 5,0 Z', fill: COLORES_PETALO[Math.floor(Math.random() * COLORES_PETALO.length)], 'fill-opacity': .85 }));
    s.appendChild(svg('path', { d: 'M5,2 L5,13', stroke: 'rgba(120,40,0,.35)', 'stroke-width': .6 }));
    s.style.animationDuration = (2 + Math.random() * 2.5) + 's';
    cont.appendChild(s);
    var dur = 9 + Math.random() * 9;
    cont.style.left = Math.random() * 100 + 'vw';
    cont.style.animationDuration = dur + 's';
    document.body.appendChild(cont);
    setTimeout(function(){ cont.remove(); }, dur * 1000 + 200);
  }
  if(!reducido){ setInterval(soltarPetalo, 1600); }

  /* ════════ aparecer al desplazarse ════════ */
  var io = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  $$('.revelar').forEach(function(el){ io.observe(el); });

  /* ════════ navegación ════════ */
  var nav = $('#nav');
  var hero = $('#inicio');
  new IntersectionObserver(function(e){
    nav.classList.toggle('visible', !e[0].isIntersecting);
  }, { threshold: .25 }).observe(hero);
  var enlaces = {};
  $$('.nav-enlaces a').forEach(function(a){ enlaces[a.getAttribute('href').slice(1)] = a; });
  var obsSecciones = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      if(!e.isIntersecting) return;
      for(var id in enlaces) enlaces[id].classList.toggle('activo', id === e.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(enlaces).forEach(function(id){ var s = document.getElementById(id); if(s) obsSecciones.observe(s); });

  /* ════════ campana del templo ════════ */
  var campana = $('#campana');
  campana.addEventListener('click', function(){
    Musica.campana();
    campana.classList.remove('suena');
    void campana.offsetWidth;
    campana.classList.add('suena');
    var r = campana.getBoundingClientRect();
    lanzarChispas(r.left + r.width / 2, r.top + r.height * .7, 18, 3);
  });

  /* ════════ simbolismo: figura que se ilumina ════════ */
  var figura = $('#figuraSimbolos');
  var etiqueta = $('#etiquetaSimbolo');
  var copia = $('#ganeshaSvg').cloneNode(true);
  copia.removeAttribute('id');
  figura.appendChild(copia);
  var tarjetas = $$('.tarjeta[data-parte]');
  function activar(tarjeta){
    var parte = tarjeta.getAttribute('data-parte');
    figura.setAttribute('data-activa', parte);
    $$('#figuraSimbolos [data-parte]').forEach(function(g){
      g.classList.toggle('activa', g.getAttribute('data-parte') === parte);
    });
    tarjetas.forEach(function(t){ t.classList.toggle('activa', t === tarjeta); });
    etiqueta.textContent = tarjeta.querySelector('h3').textContent;
  }
  tarjetas.forEach(function(t){
    t.addEventListener('mouseenter', function(){ activar(t); });
    t.addEventListener('focus', function(){ activar(t); });
    t.addEventListener('click', function(){ activar(t); });
  });
  var obsTarjetas = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){ if(e.isIntersecting) activar(e.target); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  tarjetas.forEach(function(t){ obsTarjetas.observe(t); });

  /* ════════ japa mala ════════ */
  var TOTAL = 108;
  var mala = $('#mala');
  var cuentas = [];
  (function(){
    var cx = 200, cy = 195, r = 165, hueco = 7;   // grados libres a cada lado del meru
    mala.appendChild(svg('circle', { 'class': 'hilo', cx: cx, cy: cy, r: r }));
    for(var i = 0; i < TOTAL; i++){
      // de abajo hacia la derecha, en sentido antihorario visual
      var grados = 90 - hueco - (360 - 2 * hueco) * i / (TOTAL - 1);
      var a = grados * Math.PI / 180;
      var c = svg('circle', { 'class': 'cuenta', cx: (cx + Math.cos(a) * r).toFixed(2), cy: (cy + Math.sin(a) * r).toFixed(2), r: 4.3 });
      mala.appendChild(c);
      cuentas.push(c);
    }
    mala.appendChild(svg('path', { 'class': 'hilo', d: 'M200,360 L200,372' }));
    mala.appendChild(svg('circle', { 'class': 'meru', cx: 200, cy: 380, r: 8 }));
    mala.appendChild(svg('path', { 'class': 'borla', d: 'M200,388 L200,398 M200,398 C196,410 192,420 190,432 M200,398 C200,412 200,422 200,434 M200,398 C204,410 208,420 210,432 M200,398 C198,410 195,420 195,433 M200,398 C202,410 205,420 205,433' }));
  })();

  var estadoMala = leer('mala', { cuenta: 0, vueltas: 0 });
  var malaBoton = $('#malaBoton');
  var malaCuenta = $('#malaCuenta');
  var malaEstado = $('#malaEstado');
  function pintarMala(){
    cuentas.forEach(function(c, i){
      c.classList.toggle('hecha', i < estadoMala.cuenta - 1);
      c.classList.toggle('actual', i === estadoMala.cuenta - 1);
    });
    malaCuenta.textContent = estadoMala.cuenta;
    if(estadoMala.vueltas > 0 && estadoMala.cuenta === 0){
      malaEstado.textContent = estadoMala.vueltas === 1
        ? 'Has completado 1 mala. 🙏'
        : 'Has completado ' + estadoMala.vueltas + ' malas. 🙏';
    }
  }
  function avanzarMala(){
    estadoMala.cuenta++;
    var final = estadoMala.cuenta >= TOTAL;
    Musica.cuenta(final);
    malaBoton.classList.remove('pulso'); void malaBoton.offsetWidth; malaBoton.classList.add('pulso');
    if(final){
      pintarMala();
      estadoMala.vueltas++;
      estadoMala.cuenta = 0;
      malaEstado.textContent = '✨ Mala completa: 108 repeticiones. Que tu camino quede libre de obstáculos. 🙏';
      var r = mala.getBoundingClientRect();
      lanzarChispas(r.left + r.width / 2, r.top + r.height * .45, 70, 6);
      for(var i = 0; i < 14; i++) setTimeout(soltarPetalo, i * 90);
      setTimeout(pintarMala, 1800);
    } else {
      malaEstado.textContent = estadoMala.cuenta === 1 ? 'Primera cuenta. Respira y recita.' : '';
      pintarMala();
    }
    guardar('mala', estadoMala);
  }
  malaBoton.addEventListener('click', avanzarMala);
  $('#malaReiniciar').addEventListener('click', function(){
    estadoMala.cuenta = 0;
    guardar('mala', estadoMala);
    malaEstado.textContent = 'Cuentas reiniciadas.';
    pintarMala();
  });
  var japa = $('#japa');
  addEventListener('keydown', function(e){
    if(e.code !== 'Space' && e.key !== ' ') return;
    var activo = document.activeElement;
    if(activo && /^(INPUT|TEXTAREA|BUTTON|A|SELECT)$/.test(activo.tagName)) return;
    var r = japa.getBoundingClientRect();
    var visible = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if(visible > innerHeight * .5){ e.preventDefault(); avanzarMala(); }
  });
  pintarMala();

  /* ════════ nombres que giran ════════ */
  $$('.nombre').forEach(function(n){
    n.addEventListener('click', function(){ n.classList.toggle('girada'); });
  });

  /* ════════ reflexión del día ════════ */
  var REFLEXIONES = [
    'Todo comienzo merece una pausa, una intención y un saludo.',
    'El obstáculo también es maestro: muestra el camino que aún no veías.',
    'Escucha con orejas amplias; habla con palabras pequeñas.',
    'Lo que se suelta con amor deja espacio para lo que llega.',
    'La sabiduría no siempre corre: a veces rodea con calma lo que más ama.',
    'Domina tus deseos como Ganesha a su ratón: con firmeza y con ternura.',
    'Un colmillo roto puede escribir una epopeya.',
    'Recibe lo dulce y lo amargo: ambos alimentan.',
    'Antes de empezar, inclínate. Al terminar, agradece.',
    'Una mente amplia hace pequeño cualquier problema.',
    'Cada paso consciente es una ofrenda.',
    'No temas: quien camina delante de los comienzos camina contigo.',
    'La humildad es el modak más dulce.',
    'Mira con ojos pequeños: el detalle guarda la verdad.'
  ];
  var hoy = new Date();
  var dia = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000) + hoy.getFullYear();
  $('#reflexion').textContent = REFLEXIONES[dia % REFLEXIONES.length];

  /* ════════ ofrendas ════════ */
  var altar = $('#altar');
  var ofrendaCuenta = $('#ofrendaCuenta');
  var ofrendas = leer('ofrendas', null);
  if(!ofrendas){
    // migra el contador de la versión anterior del sitio
    var diyasViejas = 0;
    try{ diyasViejas = parseInt(localStorage.getItem('diyas') || '0', 10) || 0; }catch(e){}
    ofrendas = { diya: diyasViejas, flor: 0, modak: 0 };
  }
  var MAX_ALTAR = 27;

  function crearObjeto(tipo){
    var el = document.createElement('span');
    el.className = 'objeto';
    if(tipo === 'diya'){
      el.className += ' diya';
      var llama = document.createElement('span');
      llama.className = 'llama';
      el.appendChild(llama);
    } else if(tipo === 'flor'){
      var f = svg('svg', { width: 34, height: 34, viewBox: '-20 -20 40 40', 'aria-hidden': 'true' });
      for(var i = 0; i < 14; i++){
        f.appendChild(svg('ellipse', { cx: 0, cy: -10, rx: 4.2, ry: 8.5, fill: i % 2 ? '#ff9933' : '#ffb347', transform: 'rotate(' + (i * 360 / 14) + ')' }));
      }
      for(i = 0; i < 9; i++){
        f.appendChild(svg('ellipse', { cx: 0, cy: -5.5, rx: 3.2, ry: 5.5, fill: '#ffd700', transform: 'rotate(' + (i * 40 + 20) + ')' }));
      }
      f.appendChild(svg('circle', { r: 3, fill: '#c25a00' }));
      el.appendChild(f);
    } else {
      var m = svg('svg', { width: 30, height: 34, viewBox: '0 0 30 34', 'aria-hidden': 'true' });
      m.appendChild(svg('path', { d: 'M15,1 C17,8 27,16 27,25 C27,31 21,33 15,33 C9,33 3,31 3,25 C3,16 13,8 15,1 Z', fill: '#fff1d6', stroke: '#e0b26a', 'stroke-width': 1 }));
      m.appendChild(svg('path', { d: 'M15,3 L15,32 M15,4 C12,12 8,20 8,31 M15,4 C18,12 22,20 22,31', fill: 'none', stroke: '#e0b26a', 'stroke-width': .9 }));
      el.appendChild(m);
    }
    return el;
  }
  function ponerEnAltar(tipo){
    altar.appendChild(crearObjeto(tipo));
    while(altar.children.length > MAX_ALTAR) altar.removeChild(altar.firstChild);
  }
  function plural(n, uno, varios){ return n + ' ' + (n === 1 ? uno : varios); }
  function pintarCuentaOfrendas(){
    var partes = [];
    if(ofrendas.diya) partes.push(plural(ofrendas.diya, 'diya', 'diyas'));
    if(ofrendas.flor) partes.push(plural(ofrendas.flor, 'ofrenda de flores', 'ofrendas de flores'));
    if(ofrendas.modak) partes.push(plural(ofrendas.modak, 'modak', 'modaks'));
    ofrendaCuenta.textContent = partes.length ? 'En tus visitas has ofrecido ' + partes.join(' · ') + '. 🙏' : '';
  }
  // altar inicial: una muestra intercalada de lo ya ofrecido
  (function(){
    var restantes = { diya: Math.min(ofrendas.diya, 9), flor: Math.min(ofrendas.flor, 9), modak: Math.min(ofrendas.modak, 9) };
    var orden = ['diya', 'flor', 'modak'], hay = true;
    while(hay){
      hay = false;
      orden.forEach(function(t){ if(restantes[t] > 0){ ponerEnAltar(t); restantes[t]--; hay = true; } });
    }
  })();
  pintarCuentaOfrendas();
  $$('[data-ofrenda]').forEach(function(b){
    b.addEventListener('click', function(){
      var tipo = b.getAttribute('data-ofrenda');
      ofrendas[tipo] = (ofrendas[tipo] || 0) + 1;
      guardar('ofrendas', ofrendas);
      ponerEnAltar(tipo);
      pintarCuentaOfrendas();
      Musica.ofrenda();
      var r = altar.getBoundingClientRect();
      lanzarChispas(r.left + r.width / 2, r.bottom - 10, 24, 3.5);
    });
  });

  /* ════════ entregar un obstáculo ════════ */
  var form = $('#formIntencion');
  var texto = $('#intencionTexto');
  var vuelo = $('#intencionVuelo');
  var respuesta = $('#intencionRespuesta');
  var RESPUESTAS = [
    'Entregado. Que se abran los caminos. 🙏',
    'Ganesha lo recibe. Respira: ya no tienes que cargarlo.',
    'Que este obstáculo se convierta en un comienzo.',
    'Om Gam Ganapataye Namah. Que tu camino quede libre.'
  ];
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var valor = texto.value.trim();
    if(!valor){ texto.focus(); return; }
    var cajaForm = vuelo.getBoundingClientRect();
    var cajaTexto = texto.getBoundingClientRect();
    var letras = Array.from(valor).slice(0, 160);
    var porLinea = Math.max(10, Math.floor(cajaTexto.width / 11));
    letras.forEach(function(ch, i){
      if(ch === ' ') return;
      var span = document.createElement('span');
      span.className = 'letra';
      span.textContent = ch;
      var col = i % porLinea, fila = Math.floor(i / porLinea);
      span.style.left = (cajaTexto.left - cajaForm.left + 16 + col * 11) + 'px';
      span.style.top = (cajaTexto.top - cajaForm.top + 12 + fila * 26) + 'px';
      span.style.setProperty('--dx', ((Math.random() - .5) * 160) + 'px');
      span.style.setProperty('--rot', ((Math.random() - .5) * 120) + 'deg');
      span.style.animationDelay = (reducido ? 0 : i * 18) + 'ms';
      vuelo.appendChild(span);
      setTimeout(function(){ span.remove(); }, 2700 + i * 18);
    });
    texto.value = '';
    Musica.ofrenda();
    respuesta.textContent = '';
    setTimeout(function(){
      respuesta.textContent = RESPUESTAS[Math.floor(Math.random() * RESPUESTAS.length)];
      lanzarChispas(cajaTexto.left + cajaTexto.width / 2, cajaTexto.top - 120, 30, 3);
    }, reducido ? 0 : 1400);
  });
})();

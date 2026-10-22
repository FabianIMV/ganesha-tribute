/* ═══════════════════════════════════════════
   Música generativa con Web Audio
   · Tanpura: zumbido Pa–Sa–Sa–Sa con el brillo "jawari"
   · Bansuri: frases en raga Bhupali (Sa Re Ga Pa Dha)
   · Campanas de templo ocasionales
   Todo se sintetiza en vivo: no hay archivos de audio.
   ═══════════════════════════════════════════ */
window.Musica = (function(){
  'use strict';

  var SA = 138.59;                         // Sa en Do# (C#3)
  var BHUPALI = [1, 9/8, 5/4, 3/2, 5/3];   // Sa Re Ga Pa Dha (afinación justa)
  var PULSO = 0.62;                         // segundos por tiempo, lento como un alaap

  // Frases tradicionales de Bhupali: [grado, octava, tiempos]
  var FRASES = [
    [[2,0,1],[1,0,1],[0,0,2],[4,-1,1.5],[0,0,1],[1,0,1],[2,0,3.5]],          // pakad: Ga Re Sa Dha, Sa Re Ga
    [[2,0,1],[3,0,1],[4,0,1],[0,1,2.5],[4,0,1],[3,0,1],[2,0,3.5]],
    [[3,0,1.5],[2,0,1],[1,0,1],[2,0,2],[3,0,1],[2,0,1],[1,0,1],[0,0,4]],
    [[0,1,2],[4,0,1],[3,0,1],[2,0,2],[4,0,1],[3,0,1],[2,0,1],[1,0,1],[0,0,4]],
    [[2,0,1],[3,0,1],[4,0,1],[0,1,1.5],[1,1,1],[0,1,2],[4,0,1],[3,0,3.5]],
    [[0,0,3],[2,0,2.5],[3,0,4.5]],
    [[4,-1,1],[0,0,1],[1,0,1],[2,0,1],[3,0,2],[2,0,1],[1,0,1],[0,0,4]],
    [[3,0,2],[4,0,1],[0,1,3],[4,0,1],[3,0,1],[2,0,1],[3,0,3.5]]
  ];

  var ctx = null, salida, compresor, musicaGain, efectosGain, reverb;
  var sonando = false, temporizador = null;
  var proxTanpura = 0, pasoTanpura = 0, proxFrase = 0, proxCampana = 0;
  var volumen = 0.7, ruido = null;
  var REFUERZO = 2;                         // nivel general de salida

  function iniciar(){
    if(ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return false;
    ctx = new AC();

    compresor = ctx.createDynamicsCompressor();
    compresor.threshold.value = -18; compresor.ratio.value = 3;
    salida = ctx.createGain(); salida.gain.value = volumen * REFUERZO;
    compresor.connect(salida); salida.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = impulso(5, 2.4);
    var humedo = ctx.createGain(); humedo.gain.value = 0.6;
    reverb.connect(humedo); humedo.connect(compresor);

    musicaGain = crearBusMusica();

    efectosGain = ctx.createGain(); efectosGain.gain.value = 0.9;
    efectosGain.connect(compresor); efectosGain.connect(reverb);

    ruido = bufferRuido(2);
    return true;
  }

  // Cada sesión de música usa su propio bus: al pausar se desconecta el anterior
  // y todo lo que quedaba programado en él se silencia sin dejar notas colgando.
  function crearBusMusica(){
    var g = ctx.createGain(); g.gain.value = 0;
    g.connect(compresor); g.connect(reverb);
    return g;
  }

  function impulso(seg, caida){
    var largo = Math.floor(ctx.sampleRate * seg);
    var buf = ctx.createBuffer(2, largo, ctx.sampleRate);
    for(var c = 0; c < 2; c++){
      var d = buf.getChannelData(c);
      for(var i = 0; i < largo; i++){
        d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/largo, caida);
      }
    }
    return buf;
  }

  function bufferRuido(seg){
    var largo = Math.floor(ctx.sampleRate * seg);
    var buf = ctx.createBuffer(1, largo, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for(var i = 0; i < largo; i++) d[i] = Math.random()*2 - 1;
    return buf;
  }

  function nota(grado, octava){
    return SA * 2 * BHUPALI[grado] * Math.pow(2, octava);
  }

  /* ---------- tanpura ---------- */
  function pulsarCuerda(frec, t, vol){
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 5.5);

    // el "jawari": un filtro resonante que barre los armónicos
    var jawari = ctx.createBiquadFilter();
    jawari.type = 'bandpass'; jawari.Q.value = 6;
    jawari.frequency.setValueAtTime(frec * 3, t);
    jawari.frequency.exponentialRampToValueAtTime(frec * 14, t + 3.5);

    var cuerpo = ctx.createBiquadFilter();
    cuerpo.type = 'lowpass'; cuerpo.frequency.value = 2400;

    var mezclaJ = ctx.createGain(); mezclaJ.gain.value = 0.9;
    var mezclaC = ctx.createGain(); mezclaC.gain.value = 0.35;

    [0, 3.2, -2.6].forEach(function(cents){
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = frec;
      o.detune.value = cents;
      o.connect(jawari); o.connect(cuerpo);
      o.start(t); o.stop(t + 5.6);
    });
    jawari.connect(mezclaJ); cuerpo.connect(mezclaC);
    mezclaJ.connect(g); mezclaC.connect(g);
    g.connect(musicaGain);
  }

  function programarTanpura(hasta){
    var cuerdas = [SA * 3/4, SA, SA, SA / 2];   // Pa grave, Sa, Sa, Sa grave
    var vols = [0.08, 0.07, 0.07, 0.095];
    while(proxTanpura < hasta){
      var i = pasoTanpura % 4;
      pulsarCuerda(cuerdas[i], proxTanpura, vols[i]);
      proxTanpura += (i === 3 ? 1.9 : 1.15) + Math.random()*0.08;
      pasoTanpura++;
    }
  }

  /* ---------- bansuri ---------- */
  function tocarFrase(frase, t0){
    var dur = 0;
    frase.forEach(function(n){ dur += n[2] * PULSO; });
    var fin = t0 + dur;

    var o1 = ctx.createOscillator(); o1.type = 'sine';
    var o2 = ctx.createOscillator(); o2.type = 'triangle';
    var mezcla2 = ctx.createGain(); mezcla2.gain.value = 0.18;
    var tono = ctx.createBiquadFilter(); tono.type = 'lowpass'; tono.frequency.value = 3200;

    // vibrato
    var lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
    var prof = ctx.createGain(); prof.gain.value = 0;
    lfo.connect(prof); prof.connect(o1.detune); prof.connect(o2.detune);

    // soplo: ruido filtrado que acompaña a la nota
    var soplo = ctx.createBufferSource(); soplo.buffer = ruido; soplo.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    var gSoplo = ctx.createGain(); gSoplo.gain.value = 0.022;
    soplo.connect(bp); bp.connect(gSoplo);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    o1.connect(tono); o2.connect(mezcla2); mezcla2.connect(tono);
    tono.connect(env); gSoplo.connect(env);
    env.connect(musicaGain);

    var t = t0;
    frase.forEach(function(n, k){
      var f = nota(n[0], n[1]);
      var d = n[2] * PULSO * (0.94 + Math.random()*0.12);
      var deslizar = k > 0 && Math.random() < 0.35;     // meend: glissando suave
      if(k === 0){
        o1.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f, t);
        bp.frequency.setValueAtTime(f * 2, t);
      } else {
        var tc = deslizar ? 0.09 : 0.018;
        o1.frequency.setTargetAtTime(f, t, tc); o2.frequency.setTargetAtTime(f, t, tc);
        bp.frequency.setTargetAtTime(f * 2, t, tc);
      }
      // articulación: un pequeño respiro entre notas
      var vol = 0.075 + Math.random()*0.02;
      env.gain.setTargetAtTime(k === 0 ? vol : vol * 0.82, t, 0.012);
      env.gain.setTargetAtTime(vol, t + 0.06, k === 0 ? 0.08 : 0.04);
      // vibrato solo en las notas largas
      prof.gain.setTargetAtTime(0, t, 0.05);
      if(n[2] >= 1.5) prof.gain.setTargetAtTime(14, t + 0.35, 0.3);
      t += d;
    });
    fin = t;
    env.gain.setTargetAtTime(0, fin - 0.25, 0.25);

    [o1, o2, lfo, soplo].forEach(function(n){ n.start(t0); n.stop(fin + 2); });
    return fin;
  }

  function programarFrases(hasta){
    while(proxFrase < hasta){
      var frase = FRASES[Math.floor(Math.random() * FRASES.length)];
      var fin = tocarFrase(frase, proxFrase);
      proxFrase = fin + 2.5 + Math.random() * 5;
    }
  }

  /* ---------- campanas ---------- */
  var PARCIALES = [[1, 1], [2.0, .5], [2.76, .38], [3.9, .22], [5.4, .14], [6.8, .08]];
  function campana(t, base, vol, destino, duracion){
    duracion = duracion || 7;
    PARCIALES.forEach(function(p, k){
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * p[0] * (1 + (Math.random() - .5) * 0.003);
      var g = ctx.createGain();
      var dur = duracion / (1 + k * 0.7);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * p[1], t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(destino);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  function programarCampanas(hasta){
    while(proxCampana < hasta){
      campana(proxCampana, SA * 4 * (Math.random() < .5 ? 1 : 3/2), 0.035, musicaGain);
      proxCampana += 14 + Math.random() * 18;
    }
  }

  /* ---------- planificador ---------- */
  function planificar(){
    var hasta = ctx.currentTime + 1.6;
    programarTanpura(hasta);
    programarFrases(hasta);
    programarCampanas(hasta);
  }

  function reproducir(){
    if(!iniciar()) return false;
    if(ctx.state === 'suspended') ctx.resume();
    if(sonando) return true;
    sonando = true;
    var ahora = ctx.currentTime + 0.1;
    proxTanpura = Math.max(proxTanpura, ahora);
    proxFrase = Math.max(proxFrase, ahora + 4.5);
    proxCampana = Math.max(proxCampana, ahora + 0.2);
    musicaGain.gain.setValueAtTime(0, ahora);
    musicaGain.gain.linearRampToValueAtTime(1, ahora + 3);
    planificar();
    temporizador = setInterval(planificar, 250);
    return true;
  }

  function pausar(){
    if(!ctx || !sonando) return;
    sonando = false;
    clearInterval(temporizador);
    var ahora = ctx.currentTime;
    var viejo = musicaGain;
    viejo.gain.cancelScheduledValues(ahora);
    viejo.gain.setValueAtTime(viejo.gain.value, ahora);
    viejo.gain.linearRampToValueAtTime(0, ahora + 1.5);
    setTimeout(function(){ viejo.disconnect(); }, 1700);
    musicaGain = crearBusMusica();
    proxTanpura = proxFrase = proxCampana = 0;
  }

  /* ---------- efectos ---------- */
  function tocarCampanaTemplo(){
    if(!iniciar()) return;
    if(ctx.state === 'suspended') ctx.resume();
    var t = ctx.currentTime + 0.01;
    // golpe metálico
    var golpe = ctx.createBufferSource(); golpe.buffer = ruido;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    var gg = ctx.createGain();
    gg.gain.setValueAtTime(0.12, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    golpe.connect(hp); hp.connect(gg); gg.connect(efectosGain);
    golpe.start(t); golpe.stop(t + 0.1);
    campana(t, 622, 0.16, efectosGain, 9);
    campana(t + 0.42, 618, 0.08, efectosGain, 7);   // el badajo rebota
  }

  function tocarCuenta(final){
    if(!ctx || !sonando) return;
    var t = ctx.currentTime + 0.005;
    if(final){ campana(t, SA * 4, 0.12, efectosGain, 9); return; }
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(efectosGain);
    o.start(t); o.stop(t + 0.1);
  }

  function tocarOfrenda(){
    if(!ctx || !sonando) return;
    var t = ctx.currentTime + 0.005;
    var g = BHUPALI[Math.floor(Math.random() * BHUPALI.length)];
    campana(t, SA * 8 * g, 0.05, efectosGain, 4);
  }

  function fijarVolumen(v){
    volumen = v;
    if(ctx) salida.gain.setTargetAtTime(v * REFUERZO, ctx.currentTime, 0.05);
  }

  return {
    reproducir: reproducir,
    pausar: pausar,
    estaSonando: function(){ return sonando; },
    campana: tocarCampanaTemplo,
    cuenta: tocarCuenta,
    ofrenda: tocarOfrenda,
    volumen: fijarVolumen,
    disponible: !!(window.AudioContext || window.webkitAudioContext)
  };
})();

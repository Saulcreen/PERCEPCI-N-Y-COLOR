(function(){

  var WORLD_HEX = '#2cd5da';

  // ---------- utilidades ----------
  function mulberry32(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var SPH_HI, SPH_MID, SPH_LO;
  var TMP_M, TMP_Q, TMP_E, TMP_P, TMP_S;

  // Se crea al primer uso (no al cargar el archivo), así da igual si three.js se carga antes o después.
  function initShared(){
    if(SPH_HI) return;
    SPH_HI  = new THREE.SphereGeometry(1, 20, 14);   // "bultos" grandes de la nube
    SPH_MID = new THREE.SphereGeometry(1, 12, 8);    // bultos medianos
    SPH_LO  = new THREE.SphereGeometry(1, 6, 4);     // relleno de la base, más plano
    TMP_M = new THREE.Matrix4();
    TMP_Q = new THREE.Quaternion();
    TMP_E = new THREE.Euler();
    TMP_P = new THREE.Vector3();
    TMP_S = new THREE.Vector3();
  }

  // Agrega una copia de "geo" con posición, escala y rotación (Euler) a la lista.
  function put(list, geo, x, y, z, sx, sy, sz, rx, ry, rz){
    TMP_E.set(rx || 0, ry || 0, rz || 0);
    TMP_Q.setFromEuler(TMP_E);
    TMP_M.compose(TMP_P.set(x, y, z), TMP_Q, TMP_S.set(sx, sy, sz));
    list.push(geo.clone().applyMatrix4(TMP_M));
  }

  // Une todas las piezas en una sola geometría (1 nube = 1 draw call).
  function merge(list){
    var flat = list.map(function(g){ return g.index ? g.toNonIndexed() : g; });
    var total = 0;
    flat.forEach(function(g){ total += g.attributes.position.count; });
    var pos = new Float32Array(total * 3);
    var nor = new Float32Array(total * 3);
    var o = 0;
    flat.forEach(function(g){
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      o += g.attributes.position.count;
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    list.forEach(function(g){ g.dispose(); });
    flat.forEach(function(g){ g.dispose(); });
    return out;
  }

  // Punto al azar sobre una elipsoide (centro cx,cy,cz y radios rx,ry,rz) + dirección unitaria.
  function onEllipsoid(rnd, cx, cy, cz, rx, ry, rz, k){
    var th = Math.acos(1 - 2 * rnd()), ph = rnd() * Math.PI * 2;
    var dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph);
    return { dx: dx, dy: dy, dz: dz, x: cx + dx * rx * k, y: cy + dy * ry * k, z: cz + dz * rz * k };
  }

  // ---------- una nube (racimo de "bultos" esféricos, plana por debajo) ----------
  // Esparce bultos dentro de una elipsoide (más densos hacia el centro que hacia el borde,
  // gracias a onEllipsoid con radio variable) y aplana el conjunto en Y para que parezca
  // que "flota" en vez de ser una bola. Unas pocas esferas achatadas en la base redondean
  // el contorno inferior, como el vientre plano de un cúmulo real.
  function buildCloud(seed, o){
    var rnd = mulberry32(seed), l = [];
    for(var i = 0; i < o.puffs; i++){
      var k = 0.5 + rnd() * 0.55;                                  // más bultos hacia el centro
      var p = onEllipsoid(rnd, 0, 0, 0, o.rx, o.ry, o.rz, k);
      var r = o.puffMin + rnd() * (o.puffMax - o.puffMin);
      put(l, SPH_MID, p.x, p.y * 0.55, p.z, r, r * 0.8, r);
    }
    for(var j = 0; j < o.baseCount; j++){
      var bx = (rnd() * 2 - 1) * o.rx * 0.7;
      var bz = (rnd() * 2 - 1) * o.rz * 0.7;
      var br = o.puffMax * (0.8 + rnd() * 0.3);
      put(l, SPH_LO, bx, -o.ry * 0.35, bz, br, br * 0.5, br);        // base plana
    }
    return merge(l);
  }

  var VARIANTS = [
    // 0 — cúmulo compacto y redondeado
    function(){ return buildCloud(11, { rx: 1.3, ry: 0.65, rz: 0.9, puffs: 26, puffMin: 0.28, puffMax: 0.5, baseCount: 5 }); },
    // 1 — nube alargada y baja
    function(){ return buildCloud(23, { rx: 2.1, ry: 0.45, rz: 0.7, puffs: 30, puffMin: 0.22, puffMax: 0.4, baseCount: 6 }); },
    // 2 — nube ancha y esponjosa
    function(){ return buildCloud(37, { rx: 1.7, ry: 0.85, rz: 1.1, puffs: 34, puffMin: 0.3, puffMax: 0.55, baseCount: 7 }); },
    // 3 — jirón pequeño y suelto
    function(){ return buildCloud(51, { rx: 0.9, ry: 0.5, rz: 0.6, puffs: 16, puffMin: 0.2, puffMax: 0.38, baseCount: 3 }); }
  ];

  // ---------- Créditos: escena poscréditos sobre el mundo (HTML/CSS, no usa three.js) ----------
  var CREDITS = {
    thanks: 'Gracias',
    membersTitle: 'Integrantes:',
    members: [
      'Ángel Steven Bardales Saravia',
      'Víctor Miguel Gozar García',
      'Jaisa Karin Quispe Escalante',
      'Carlos Saul Quinteros Coronado',
      'Jefferson Joey Rodriguez León'
    ],
    artTitle: 'Arte utilizado',
    art: null,                 // null = junta solas las imágenes del proyecto (variables window.* de imagen.js); o un arreglo de URLs
    finalMessage: 'Este proyecto fue hecho de este modo para que el público disfrute de algo más visual y entretenido... gracias',
    thanksFadeMs: 1600,        // "Gracias" aparece en el centro
    thanksHoldMs: 4500,        // ...y se queda quieto este tiempo antes de empezar a subir
    speedVh: 9,                // velocidad de subida (% del alto de pantalla por segundo)
    rampMs: 1800               // arranque suave de la subida
  };

  // Imágenes que salieron en el proyecto, en orden de aparición (las que no existan se saltan).
  var ART_KEYS = [
    'targetPaperUrl', 'notebookCoverImageUrl', 'notebookPageImageUrl', 'lastPageImageUrl',
    'screenImage', 'tabletApproachScreenImage', 'tabletReturnScreenImage', 'diffScreenImage', 'hudTabletScreenImage',
    'cellScreenImage', 'cellScreenImage2', 'cellPinterestImage1', 'cellPinterestImage2', 'spaceImageUrl'
  ];

  function collectArt(){
    var urls = [];
    function add(u){ if(typeof u === 'string' && u && urls.indexOf(u) < 0) urls.push(u); }
    (window.paperImages || []).forEach(function(cfg){ add(cfg && cfg.url); });
    ART_KEYS.forEach(function(k){ add(window[k]); });
    return urls;
  }

  function injectCreditsStyle(){
    if(document.getElementById('grieg-credits-style')) return;
    var shadow = 'text-shadow:0 3px 26px rgba(0,50,60,.7),0 1px 3px rgba(0,50,60,.8);';
    var st = document.createElement('style');
    st.id = 'grieg-credits-style';
    st.textContent = [
      '#grieg-credits{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:60;color:#fff;text-align:center;font-family:"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif;}',
      '#grieg-credits .gc-shade{position:absolute;inset:0;background:rgba(2,38,48,.6);opacity:0;transition:opacity 2.2s ease;}',
      '#grieg-credits.gc-on .gc-shade{opacity:.3;}',
      '#grieg-credits.gc-scroll .gc-shade{opacity:1;}',
      '#grieg-credits .gc-track{position:absolute;left:0;right:0;top:0;will-change:transform;}',
      '#grieg-credits .gc-screen{height:100vh;display:flex;align-items:center;justify-content:center;padding:0 8vw;box-sizing:border-box;}',
      '#grieg-credits .gc-thanks{margin:0;font-size:clamp(64px,17vw,260px);font-weight:800;line-height:1;letter-spacing:.01em;' + shadow + 'opacity:0;transform:scale(1.08);transition:opacity 1.6s ease,transform 2.6s ease;}',
      '#grieg-credits.gc-on .gc-thanks{opacity:1;transform:none;}',
      '#grieg-credits .gc-block{padding:22vh 6vw;box-sizing:border-box;}',
      '#grieg-credits h2{margin:0 0 5vh;font-size:clamp(28px,4.6vw,64px);font-weight:700;letter-spacing:.02em;' + shadow + '}',
      '#grieg-credits ul{list-style:none;margin:0;padding:0;}',
      '#grieg-credits li{margin:0 0 2.2vh;font-size:clamp(20px,3vw,40px);font-weight:500;line-height:1.35;' + shadow + '}',
      '#grieg-credits .gc-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:2.4vw;}',
      '#grieg-credits .gc-frame{width:min(26vw,320px);aspect-ratio:4/3;background:rgba(255,255,255,.12);border-radius:10px;overflow:hidden;box-shadow:0 8px 28px rgba(0,30,40,.45);}',
      '#grieg-credits .gc-frame img{width:100%;height:100%;object-fit:contain;display:block;}',
      '#grieg-credits .gc-final p{margin:0;max-width:80vw;font-size:clamp(28px,5vw,68px);font-weight:700;line-height:1.25;' + shadow + '}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function mk(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    return e;
  }

  // Muestra "Gracias" grande en el centro; luego todo sube como en unos créditos:
  // Integrantes -> arte usado (imágenes del proyecto) -> mensaje final grande, que se detiene al centro.
  function startCredits(opts){
    opts = opts || {};
    var C = {};
    Object.keys(CREDITS).forEach(function(k){ C[k] = opts[k] !== undefined ? opts[k] : CREDITS[k]; });

    injectCreditsStyle();
    var old = document.getElementById('grieg-credits');
    if(old && old.parentNode) old.parentNode.removeChild(old);

    var root = mk('div'); root.id = 'grieg-credits';
    root.appendChild(mk('div', 'gc-shade'));
    var track = mk('div', 'gc-track');
    root.appendChild(track);

    var s1 = mk('section', 'gc-screen');
    s1.appendChild(mk('h1', 'gc-thanks', C.thanks));
    track.appendChild(s1);

    var s2 = mk('section', 'gc-block');
    s2.appendChild(mk('h2', null, C.membersTitle));
    var ul = mk('ul');
    C.members.forEach(function(name){ ul.appendChild(mk('li', null, name)); });
    s2.appendChild(ul);
    track.appendChild(s2);

    var art = C.art || collectArt();
    if(art.length){
      var s3 = mk('section', 'gc-block');
      s3.appendChild(mk('h2', null, C.artTitle));
      var grid = mk('div', 'gc-grid');
      art.forEach(function(url){
        var fr = mk('div', 'gc-frame');
        var img = document.createElement('img');
        img.referrerPolicy = 'no-referrer';
        img.alt = '';
        img.onerror = function(){ if(fr.parentNode) fr.parentNode.removeChild(fr); };   // imagen rota: se salta
        img.src = url;
        fr.appendChild(img);
        grid.appendChild(fr);
      });
      s3.appendChild(grid);
      track.appendChild(s3);
    }

    var s4 = mk('section', 'gc-screen gc-final');
    s4.appendChild(mk('p', null, C.finalMessage));
    track.appendChild(s4);

    document.body.appendChild(root);
    void root.offsetWidth;                                   // fija el estado inicial para que las transiciones arranquen
    requestAnimationFrame(function(){ root.classList.add('gc-on'); });

    var scroll = 0, t0 = null, last = 0, scrolling = false, stopped = false;
    var scrollAt = C.thanksFadeMs + C.thanksHoldMs;

    function frame(ts){
      if(stopped || !root.parentNode) return;
      if(t0 === null) t0 = ts;
      var el = ts - t0;
      if(el >= scrollAt){
        if(!scrolling){ scrolling = true; last = ts; root.classList.add('gc-scroll'); }
        var dt = Math.min(0.1, (ts - last) / 1000);
        last = ts;
        var ramp = Math.min(1, (el - scrollAt) / C.rampMs);
        scroll += window.innerHeight * (C.speedVh / 100) * ramp * dt;
        // El mensaje final se detiene justo en el centro de la pantalla (se recalcula por si cargan imágenes).
        var stopAt = s4.offsetTop + s4.offsetHeight / 2 - window.innerHeight / 2;
        var done = scroll >= stopAt;
        if(done) scroll = stopAt;
        track.style.transform = 'translate3d(0,' + (-scroll).toFixed(1) + 'px,0)';
        if(done) return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      root: root,
      stop: function(){ stopped = true; if(root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  window.startGriegCredits = startCredits;

  // ---------- el mundo ----------
  window.createGrieg = function(renderer, opts){
    initShared();
    opts = opts || {};
    var size  = opts.size  || 1024;
    var count = opts.count || 40;
    var hex   = opts.color || WORLD_HEX;

    var bg = new THREE.Color(hex);                       // fondo y niebla: el mismo color exacto

    // Textura donde se dibuja el mundo (sRGB, con MSAA si hay WebGL2).
    var rt;
    var isGL2 = renderer.capabilities && renderer.capabilities.isWebGL2;
    if(isGL2 && THREE.WebGLMultisampleRenderTarget){
      rt = new THREE.WebGLMultisampleRenderTarget(size, size, { format: THREE.RGBAFormat });
      rt.samples = 4;
    } else {
      rt = new THREE.WebGLRenderTarget(size, size, {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat
      });
    }
    rt.texture.encoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 9, 46);            // r128 mezcla la niebla ya codificada en sRGB: color tal cual

    var camera = new THREE.PerspectiveCamera(62, 1, 0.1, 80);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1f9ea3, 1.25));
    var key = new THREE.DirectionalLight(0xfff2dc, 2.2);
    key.position.set(5, 8, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x9ffcff, 1.3);
    rim.position.set(-6, -2, -8);
    scene.add(rim);

    var mats = [0xffffff, 0xf7fbfd, 0xeaf2f4].map(function(c){
      return new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 });
    });
    var geos = VARIANTS.map(function(build){ return build(); });

    // Volumen por el que se vuela: la cámara avanza y las nubes que quedan atrás se reciclan al frente.
    var SPAN_X = 15, SPAN_Y = 10, AHEAD = 46, BEHIND = 4, CLEAR = 2.8, SPEED = 1.4;
    var rnd = mulberry32(2026);
    var camZ = 0;
    var clouds = [];

    function place(c, z){
      var x, y;
      do {
        x = (rnd() * 2 - 1) * SPAN_X;
        y = (rnd() * 2 - 1) * SPAN_Y;
      } while(x * x + y * y < CLEAR * CLEAR);            // deja libre el pasillo central
      c.x = x; c.y = y; c.z = z;
    }

    for(var i = 0; i < count; i++){
      var mesh = new THREE.Mesh(geos[i % geos.length], mats[Math.floor(rnd() * mats.length)]);
      var sc = 1.4 + rnd() * 2.2;
      mesh.scale.setScalar(sc);
      var c = {
        mesh: mesh,
        yaw0: rnd() * Math.PI * 2,
        spin: (0.02 + rnd() * 0.05) * (rnd() < 0.5 ? -1 : 1),   // giro casi imperceptible: son nubes, no cabezas
        tiltX: (rnd() - 0.5) * 0.15,
        tiltZ: (rnd() - 0.5) * 0.12,
        phase: rnd() * Math.PI * 2,
        bobAmp: 0.2 + rnd() * 0.4,
        bobFreq: 0.15 + rnd() * 0.2,
        x: 0, y: 0, z: 0
      };
      place(c, camZ - 3 - rnd() * (AHEAD - 3));
      scene.add(mesh);
      clouds.push(c);
    }

    // Animación de entrada (enter): zoom que se abre + velocidad que baja de golpe.
    var FOV = 62, ENTER_FOV_FROM = 28, ENTER_SPEED_BOOST = 5, ENTER_SECONDS = 1.8;
    var enterT = -1;                                   // < 0: sin animación

    function easeOutCubic(q){ return 1 - Math.pow(1 - q, 3); }
    function enterQ(){ return enterT < 0 ? 1 : Math.min(1, enterT / ENTER_SECONDS); }

    function configure(aspect, fov){
      if(camera.aspect !== aspect || camera.fov !== fov){
        camera.aspect = aspect;
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }

    // Avanza el mundo (nubes + cámara) sin dibujar nada.
    function step(dt, t){
      dt = Math.min(dt, 0.1);
      if(enterT >= 0) enterT += dt;
      var q = enterQ();
      camZ -= SPEED * (1 + ENTER_SPEED_BOOST * (1 - q) * (1 - q)) * dt;

      clouds.forEach(function(c){
        if(c.z > camZ + BEHIND) place(c, camZ - AHEAD - rnd() * 6);
        c.mesh.position.set(c.x, c.y + Math.sin(t * c.bobFreq + c.phase) * c.bobAmp, c.z);
        c.mesh.rotation.set(
          c.tiltX + Math.sin(t * 0.6 + c.phase) * 0.06,
          c.yaw0 + t * c.spin,
          c.tiltZ + Math.cos(t * 0.5 + c.phase * 1.3) * 0.05
        );
      });

      var sx = Math.sin(t * 0.21) * 0.6, sy = Math.cos(t * 0.17) * 0.4;
      camera.position.set(sx, sy, camZ);
      camera.lookAt(sx * 0.3, sy * 0.3, camZ - 10);
      camera.rotation.z += Math.sin(t * 0.12) * 0.08;
    }

    // Modo póster: avanza y dibuja el mundo en la textura (cuadrada).
    function update(dt, t){
      step(dt, t);
      configure(1, FOV);
      var prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
    }

    // Modo entorno: avanza y dibuja el mundo directamente en pantalla.
    function present(dt, t, aspect){
      step(dt, t);
      var q = enterQ();
      configure(aspect || 1, ENTER_FOV_FROM + (FOV - ENTER_FOV_FROM) * easeOutCubic(q));
      if(q >= 1) enterT = -1;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }

    function enter(){ enterT = 0; }

    function dispose(){
      rt.dispose();
      geos.forEach(function(g){ g.dispose(); });
      mats.forEach(function(m){ m.dispose(); });
    }

    return { texture: rt.texture, scene: scene, camera: camera, update: update, present: present, enter: enter, startCredits: startCredits, dispose: dispose };
  };

})();
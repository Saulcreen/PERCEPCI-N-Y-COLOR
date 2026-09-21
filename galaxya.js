(function(){

  function hash3(ix, iy, iz, seed){
    var h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177) ^ Math.imul(seed, 362437);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }

  function smooth(t){ return t * t * (3 - 2 * t); }

  function noise3(x, y, z, seed){
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    var fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
    var a = hash3(ix, iy, iz, seed),         b = hash3(ix + 1, iy, iz, seed);
    var c = hash3(ix, iy + 1, iz, seed),     d = hash3(ix + 1, iy + 1, iz, seed);
    var e = hash3(ix, iy, iz + 1, seed),     f = hash3(ix + 1, iy, iz + 1, seed);
    var g = hash3(ix, iy + 1, iz + 1, seed), h = hash3(ix + 1, iy + 1, iz + 1, seed);
    var x1 = a + (b - a) * fx, x2 = c + (d - c) * fx, x3 = e + (f - e) * fx, x4 = g + (h - g) * fx;
    var y1 = x1 + (x2 - x1) * fy, y2 = x3 + (x4 - x3) * fy;
    return y1 + (y2 - y1) * fz;
  }

  function fbm(x, y, z, oct, seed){
    var v = 0, amp = 0.5, fr = 1, norm = 0;
    for(var i = 0; i < oct; i++){
      v += noise3(x * fr, y * fr, z * fr, seed + i * 17) * amp;
      norm += amp;
      amp *= 0.5;
      fr *= 2.03;
    }
    return v / norm;
  }

  function clamp01(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function ramp(stops, v){
    v = clamp01(v);
    for(var i = 1; i < stops.length; i++){
      if(v <= stops[i][0]){
        var a = stops[i - 1], b = stops[i];
        var k = (v - a[0]) / Math.max(1e-6, b[0] - a[0]);
        return [
          a[1][0] + (b[1][0] - a[1][0]) * k,
          a[1][1] + (b[1][1] - a[1][1]) * k,
          a[1][2] + (b[1][2] - a[1][2]) * k
        ];
      }
    }
    return stops[stops.length - 1][1];
  }

  function makeCanvas(w, h){
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function texFromCanvas(c){
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  var PALETTES = {
    jupiter: [[0, [110, 72, 46]], [0.35, [196, 154, 106]], [0.6, [236, 216, 182]], [1, [160, 100, 64]]],
    azure:   [[0, [18, 40, 96]], [0.5, [64, 122, 196]], [1, [170, 214, 244]]],
    violet:  [[0, [48, 24, 90]], [0.5, [128, 84, 176]], [1, [226, 190, 240]]],
    mars:    [[0, [70, 30, 20]], [0.45, [150, 66, 38]], [0.75, [196, 112, 66]], [1, [230, 170, 120]]],
    amber:   [[0, [80, 52, 26]], [0.5, [176, 118, 58]], [1, [232, 190, 120]]],
    ice:     [[0, [70, 110, 170]], [0.5, [170, 208, 236]], [1, [246, 252, 255]]],
    moon:    [[0, [50, 50, 54]], [0.5, [120, 120, 124]], [1, [190, 188, 184]]]
  };

  var EARTH_STOPS = [
    [0.00, [8, 24, 70]], [0.42, [16, 62, 132]], [0.50, [44, 124, 176]],
    [0.52, [204, 192, 140]], [0.57, [72, 132, 62]], [0.70, [44, 94, 44]],
    [0.82, [112, 96, 80]], [1.00, [242, 242, 242]]
  ];

  function planetTexture(type, w, h, seed, paletteName){
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var pal = PALETTES[paletteName] || PALETTES.jupiter;

    for(var j = 0; j < h; j++){
      var lat = (j / (h - 1) - 0.5) * Math.PI;
      var cy = Math.sin(lat), cl = Math.cos(lat);
      for(var i = 0; i < w; i++){
        var lon = (i / w) * Math.PI * 2;
        var px = cl * Math.cos(lon), pz = cl * Math.sin(lon), py = cy;
        var col;

        if(type === 'earth'){
          var n = fbm(px * 1.8 + 3, py * 1.8, pz * 1.8, 6, seed);
          n = clamp01((n - 0.28) / 0.5);
          col = ramp(EARTH_STOPS, n);
          var cap = smooth(clamp01((Math.abs(py) + (fbm(px * 4, py * 4, pz * 4, 3, seed + 9) - 0.5) * 0.25 - 0.76) / 0.16));
          col = [col[0] + (244 - col[0]) * cap, col[1] + (248 - col[1]) * cap, col[2] + (255 - col[2]) * cap];
        } else if(type === 'gas'){
          var warp = fbm(px * 1.4, py * 3.5, pz * 1.4, 4, seed);
          var band = Math.sin(py * 11 + warp * 5.5) * 0.5 + 0.5;
          var det = fbm(px * 6, py * 14, pz * 6, 4, seed + 5);
          col = ramp(pal, band * 0.75 + det * 0.35);
        } else if(type === 'lava'){
          var rock = fbm(px * 3, py * 3, pz * 3, 5, seed);
          var ridge = 1 - Math.abs(fbm(px * 4 + 5, py * 4, pz * 4, 4, seed + 3) * 2 - 1);
          var glow = Math.pow(ridge, 7);
          var base = 22 + rock * 40;
          col = [base + glow * 255, base * 0.7 + glow * 120, base * 0.6 + glow * 24];
        } else {
          var r1 = fbm(px * 3, py * 3, pz * 3, 6, seed);
          var r2 = 1 - Math.abs(fbm(px * 5, py * 5, pz * 5, 4, seed + 11) * 2 - 1);
          var v = r1 * 0.65 + r2 * 0.35;
          col = ramp(pal, v * 1.15 - 0.1);
        }

        var o = (j * w + i) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return texFromCanvas(c);
  }

  function cloudTexture(w, h, seed){
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for(var j = 0; j < h; j++){
      var lat = (j / (h - 1) - 0.5) * Math.PI;
      var cy = Math.sin(lat), cl = Math.cos(lat);
      for(var i = 0; i < w; i++){
        var lon = (i / w) * Math.PI * 2;
        var n = fbm(cl * Math.cos(lon) * 2.4, cy * 3.2, cl * Math.sin(lon) * 2.4, 5, seed);
        var a = smooth(clamp01((n - 0.5) / 0.25));
        var o = (j * w + i) * 4;
        d[o] = 255; d[o + 1] = 255; d[o + 2] = 255; d[o + 3] = a * 235;
      }
    }
    ctx.putImageData(img, 0, 0);
    return texFromCanvas(c);
  }

  function ringTexture(seed, tint){
    var w = 512, h = 8;
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for(var i = 0; i < w; i++){
      var t = i / (w - 1);
      var n = noise3(t * 46, 0.5, 0.5, seed) * 0.6 + noise3(t * 130, 1.5, 0.5, seed + 3) * 0.4;
      var a = clamp01((n - 0.25) * 1.7);
      a *= smooth(clamp01(t / 0.08)) * smooth(clamp01((1 - t) / 0.12));
      if(t > 0.58 && t < 0.64) a *= 0.08;
      var shade = 0.72 + n * 0.5;
      for(var j = 0; j < h; j++){
        var o = (j * w + i) * 4;
        d[o] = tint[0] * shade; d[o + 1] = tint[1] * shade; d[o + 2] = tint[2] * shade; d[o + 3] = a * 235;
      }
    }
    ctx.putImageData(img, 0, 0);
    return texFromCanvas(c);
  }

  function glowTexture(size, stops){
    var c = makeCanvas(size, size);
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function(s){ g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return texFromCanvas(c);
  }

  function nebulaTexture(size, seed, palette){
    var c = makeCanvas(size, size);
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(size, size);
    var d = img.data;
    for(var j = 0; j < size; j++){
      for(var i = 0; i < size; i++){
        var x = i / size, y = j / size;
        var dx = x - 0.5, dy = y - 0.5;
        var fall = clamp01(1 - Math.sqrt(dx * dx + dy * dy) * 2);
        fall = smooth(fall);
        var n = fbm(x * 3.2, y * 3.2, 0.5, 6, seed);
        var m = fbm(x * 2.1 + 9, y * 2.1, 3.3, 4, seed + 31);
        var v = clamp01((n - 0.32) * 2.2) * fall;
        var col = ramp(palette, m);
        var o = (j * size + i) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = v * v * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return texFromCanvas(c);
  }

  var ATMOSPHERE_VERT =
    'varying vec3 vN;' +
    'void main(){' +
    '  vN = normalize(normalMatrix * normal);' +
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);' +
    '}';
  var ATMOSPHERE_FRAG =
    'uniform vec3 color;' +
    'varying vec3 vN;' +
    'void main(){' +
    '  float i = pow(max(0.0, 0.66 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.0);' +
    '  gl_FragColor = vec4(color * i, i);' +
    '}';

  function atmosphere(radius, colorHex, scale){
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius * (scale || 1.12), 40, 30),
      new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(colorHex) } },
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
  }

  function ringMesh(inner, outer, seed, tint){
    var geo = new THREE.RingGeometry(inner, outer, 160, 1);
    var pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for(var i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: ringTexture(seed, tint),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  function buildPlanet(cfg){
    var big = cfg.radius >= 8;
    var tw = big ? 512 : 256, th = big ? 256 : 128;
    var group = new THREE.Group();
    group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    var tilted = new THREE.Group();
    tilted.rotation.z = cfg.tilt || 0;
    group.add(tilted);

    var mat = new THREE.MeshStandardMaterial({
      map: planetTexture(cfg.type, tw, th, cfg.seed, cfg.palette),
      roughness: cfg.type === 'gas' ? 0.85 : 0.9,
      metalness: 0
    });
    if(cfg.type === 'lava'){
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = mat.map;
      mat.emissiveIntensity = 0.9;
    }
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 64, 48), mat);
    tilted.add(mesh);

    var clouds = null;
    if(cfg.clouds){
      clouds = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.radius * 1.02, 48, 36),
        new THREE.MeshStandardMaterial({ map: cloudTexture(tw, th, cfg.seed + 101), transparent: true, depthWrite: false, roughness: 1 })
      );
      tilted.add(clouds);
    }

    if(cfg.atmosphere) tilted.add(atmosphere(cfg.radius, cfg.atmosphere, cfg.atmosphereScale));

    if(cfg.ring){
      var ring = ringMesh(cfg.radius * cfg.ring.inner, cfg.radius * cfg.ring.outer, cfg.seed + 7, cfg.ring.tint);
      ring.rotation.x = Math.PI / 2 + (cfg.ring.tilt || 0.3);
      group.add(ring);
    }

    var moons = [];
    (cfg.moons || []).forEach(function(m, k){
      var pivot = new THREE.Group();
      pivot.rotation.x = m.incl || 0;
      pivot.rotation.y = Math.random() * Math.PI * 2;
      var moon = new THREE.Mesh(
        new THREE.SphereGeometry(m.radius, 32, 24),
        new THREE.MeshStandardMaterial({ map: planetTexture('rocky', 128, 64, cfg.seed + 50 + k, 'moon'), roughness: 1 })
      );
      moon.position.x = m.dist;
      pivot.add(moon);
      group.add(pivot);
      moons.push({ pivot: pivot, speed: m.speed });
    });

    return { group: group, mesh: mesh, clouds: clouds, moons: moons, spin: cfg.spin || 0.05 };
  }

  var PLANETS = [
    { type: 'gas',   palette: 'jupiter', radius: 16, pos: [-42, 14, -110], seed: 11, tilt: 0.35, spin: 0.05, atmosphere: 0xd9a86a, atmosphereScale: 1.06,
      ring: { inner: 1.35, outer: 2.5, tilt: 0.42, tint: [222, 200, 160] },
      moons: [{ radius: 1.6, dist: 26, speed: 0.12, incl: 0.2 }, { radius: 1.0, dist: 33, speed: 0.08, incl: -0.3 }] },
    { type: 'earth', radius: 7, pos: [26, -4, -62], seed: 23, tilt: 0.41, spin: 0.08, clouds: true, atmosphere: 0x5aa0ff,
      moons: [{ radius: 1.7, dist: 13, speed: 0.18, incl: 0.09 }] },
    { type: 'rocky', palette: 'mars', radius: 4.5, pos: [14, 30, -160], seed: 37, tilt: 0.2, spin: 0.06, atmosphere: 0xe08a5a, atmosphereScale: 1.08 },
    { type: 'gas',   palette: 'azure', radius: 13, pos: [-64, -26, 96], seed: 41, tilt: -0.2, spin: 0.045, atmosphere: 0x6fb2ff,
      ring: { inner: 1.3, outer: 1.9, tilt: -0.25, tint: [180, 210, 240] } },
    { type: 'gas',   palette: 'violet', radius: 18, pos: [22, 12, 150], seed: 53, tilt: 0.15, spin: 0.04, atmosphere: 0xb58cff,
      moons: [{ radius: 2.2, dist: 30, speed: 0.1, incl: 0.4 }] },
    { type: 'rocky', palette: 'ice', radius: 10, pos: [96, -12, -34], seed: 61, tilt: 0.3, spin: 0.05, atmosphere: 0xbfe6ff },
    { type: 'lava',  radius: 4, pos: [70, 24, 44], seed: 71, tilt: 0.1, spin: 0.09, atmosphere: 0xff6a2a, atmosphereScale: 1.14 },
    { type: 'rocky', palette: 'amber', radius: 6, pos: [-92, -6, 22], seed: 83, tilt: -0.3, spin: 0.07, atmosphere: 0xe0b060 },
    { type: 'rocky', palette: 'moon', radius: 2.6, pos: [-52, 16, -28], seed: 97, tilt: 0.1, spin: 0.1 }
  ];

  var SPARK_STOPS = [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.85)'], [0.6, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']];

  function starField(count, minR, maxR, size, bright){
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    var tints = [[1, 1, 1], [0.75, 0.85, 1], [1, 0.9, 0.7], [1, 0.75, 0.6], [0.7, 0.75, 1]];
    for(var i = 0; i < count; i++){
      var u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      var s = Math.sqrt(1 - u * u), r = minR + Math.random() * (maxR - minR);
      pos[i * 3] = s * Math.cos(a) * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = s * Math.sin(a) * r;
      var t = tints[(Math.random() * tints.length) | 0];
      var b = bright * (0.4 + Math.random() * 0.6);
      col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: size, sizeAttenuation: false, vertexColors: true, map: glowTexture(32, SPARK_STOPS),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    return pts;
  }

  function spiralGalaxy(count, radius){
    var arms = 4;
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    var core = [1, 0.86, 0.6], edge = [0.45, 0.6, 1];
    for(var i = 0; i < count; i++){
      var t = Math.pow(Math.random(), 0.7);
      var r = t * radius;
      var arm = (i % arms) * (Math.PI * 2 / arms);
      var spread = (Math.random() - 0.5) * (0.5 + t * 0.9) * (Math.random() + 0.3);
      var ang = arm + t * 5.2 + spread;
      var thick = (Math.random() - 0.5) * radius * 0.06 * (1 - t * 0.7);
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = thick;
      pos[i * 3 + 2] = Math.sin(ang) * r;
      var k = Math.min(1, t * 1.4);
      var b = 0.35 + Math.random() * 0.65;
      col[i * 3] = (core[0] + (edge[0] - core[0]) * k) * b;
      col[i * 3 + 1] = (core[1] + (edge[1] - core[1]) * k) * b;
      col[i * 3 + 2] = (core[2] + (edge[2] - core[2]) * k) * b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.7, sizeAttenuation: false, vertexColors: true, map: glowTexture(32, SPARK_STOPS),
      transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    return pts;
  }

  function dustField(count, minR, maxR){
    var pos = new Float32Array(count * 3);
    for(var i = 0; i < count; i++){
      var u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      var s = Math.sqrt(1 - u * u), r = minR + Math.random() * (maxR - minR);
      pos[i * 3] = s * Math.cos(a) * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = s * Math.sin(a) * r;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.6, sizeAttenuation: false, color: 0xbfd0ff, map: glowTexture(32, SPARK_STOPS),
      transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    return pts;
  }

  window.createGalaxy = function(opts){
    opts = opts || {};
    var group = new THREE.Group();
    var planets = [];
    var animated = [];

    var sunDir = new THREE.Vector3(0.55, 0.25, -0.8).normalize();

    var sun = new THREE.DirectionalLight(0xfff0d8, 3.2);
    sun.position.copy(sunDir).multiplyScalar(100);
    group.add(sun);

    var fill = new THREE.HemisphereLight(0x3a4a7a, 0x150c22, 0.7);
    group.add(fill);

    group.add(starField(7000, 1800, 2600, 1.5, 0.9));
    group.add(starField(350, 1700, 2500, 3.2, 1));
    group.add(dustField(500, 14, 90));

    var galaxyTilt = new THREE.Group();
    galaxyTilt.position.set(-380, 260, -1300);
    galaxyTilt.rotation.set(1.05, 0, 0.35);
    var galaxy = spiralGalaxy(32000, 520);
    galaxyTilt.add(galaxy);
    var galaxyCore = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(256, [[0, 'rgba(255,240,210,1)'], [0.2, 'rgba(255,214,150,0.6)'], [0.6, 'rgba(255,170,90,0.12)'], [1, 'rgba(255,150,80,0)']]),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    galaxyCore.scale.set(300, 300, 1);
    galaxyTilt.add(galaxyCore);
    group.add(galaxyTilt);

    var sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(256, [[0, 'rgba(255,255,245,1)'], [0.12, 'rgba(255,236,190,0.95)'], [0.35, 'rgba(255,180,90,0.35)'], [1, 'rgba(255,140,60,0)']]),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    sunSprite.position.copy(sunDir).multiplyScalar(1900);
    sunSprite.scale.set(620, 620, 1);
    group.add(sunSprite);

    var nebulaSpecs = [
      { dir: [-0.7, 0.2, -0.65], seed: 5,  scale: 1100, opacity: 0.6, pal: [[0, [120, 40, 180]], [0.5, [220, 70, 150]], [1, [255, 160, 120]]] },
      { dir: [0.8, -0.15, -0.5], seed: 15, scale: 1000, opacity: 0.55, pal: [[0, [30, 80, 200]], [0.5, [60, 170, 220]], [1, [170, 240, 255]]] },
      { dir: [0.1, 0.35, 0.93],  seed: 25, scale: 1200, opacity: 0.5, pal: [[0, [200, 60, 60]], [0.5, [255, 130, 70]], [1, [255, 210, 130]]] },
      { dir: [-0.85, -0.2, 0.45], seed: 35, scale: 1000, opacity: 0.5, pal: [[0, [40, 160, 140]], [0.5, [80, 200, 170]], [1, [190, 255, 220]]] },
      { dir: [0.5, 0.6, 0.6],    seed: 45, scale: 900,  opacity: 0.45, pal: [[0, [90, 60, 200]], [0.5, [160, 110, 240]], [1, [230, 200, 255]]] }
    ];
    var nebulae = nebulaSpecs.map(function(n){
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: nebulaTexture(256, n.seed, n.pal),
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: n.opacity
      }));
      sp.position.set(n.dir[0], n.dir[1], n.dir[2]).normalize().multiplyScalar(1500);
      sp.scale.set(n.scale, n.scale, 1);
      group.add(sp);
      return sp;
    });

    PLANETS.forEach(function(cfg){
      var p = buildPlanet(cfg);
      group.add(p.group);
      planets.push(p);
    });

    function update(dt, t){
      planets.forEach(function(p){
        p.mesh.rotation.y += p.spin * dt;
        if(p.clouds) p.clouds.rotation.y += p.spin * 1.35 * dt;
        p.moons.forEach(function(m){ m.pivot.rotation.y += m.speed * dt; });
      });
      galaxy.rotation.y += 0.012 * dt;
      nebulae.forEach(function(n, i){ n.material.rotation += (i % 2 ? 1 : -1) * 0.004 * dt; });
      var pulse = 1 + Math.sin(t * 0.6) * 0.03;
      sunSprite.scale.set(620 * pulse, 620 * pulse, 1);
    }

    return { group: group, planets: planets, update: update, sunDirection: sunDir };
  };

  // ---------- Texto 3D que se convierte en cenizas ----------

  function measureFontPx(text, weight, family, px){
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    ctx.font = weight + ' ' + px + 'px ' + family;
    return ctx.measureText(text).width;
  }

  function clamp01b(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }


  // Crea un texto 3D: mientras está "de pie" es una textura sólida y nítida
  // (letras completas, sin puntos) repetida en varias capas desplazadas en
  // diagonal para dar volumen de bloque 3D. Al cabo de un rato se apaga esa
  // textura y en su lugar se muestra una nube de partículas que se dispersa
  // como ceniza. Devuelve { object (Object3D para añadir a la escena),
  // update(dt), done }.
  window.createAshText = function(text, opts){
    opts = opts || {};
    var lines = opts.lines || (text ? String(text).split('\n') : []);
    if(opts.uppercase !== false) lines = lines.map(function(l){ return l.toUpperCase(); });

    var family = opts.fontFamily || 'Anton, "Arial Narrow", sans-serif';
    var weight = opts.fontWeight || '400';
    var canvasW = opts.canvasWidth || 1400;
    var worldWidth = opts.width || 18;
    var depthLayers = Math.max(1, opts.depthLayers != null ? opts.depthLayers : 6);
    var depth = worldWidth * (opts.depthRatio != null ? opts.depthRatio : 0.10);
    var shadeAmount = opts.shadeAmount != null ? opts.shadeAmount : 0.55;
    var extrudeX = opts.extrudeX != null ? opts.extrudeX : worldWidth * 0.012;
    var extrudeY = opts.extrudeY != null ? opts.extrudeY : -worldWidth * 0.010;

    var inkColor   = new THREE.Color(opts.inkColor   || 0xf7f3e8);
    var emberColor = new THREE.Color(opts.emberColor || 0xff8a3d);
    var ashColor   = new THREE.Color(opts.ashColor   || 0x4a3f36);
    var tmpColor   = new THREE.Color();

    var basePx = 100;
    var widest = 1;
    lines.forEach(function(l){ widest = Math.max(widest, measureFontPx(l, weight, family, basePx)); });
    var fontPx = Math.max(18, Math.round(basePx * (canvasW - 110) / widest));
    var lineH = Math.round(fontPx * 1.02);
    var canvasH = Math.round(lineH * lines.length + fontPx * 0.6);

    var c = document.createElement('canvas');
    c.width = canvasW; c.height = canvasH;
    var ctx = c.getContext('2d');
    ctx.font = weight + ' ' + fontPx + 'px ' + family;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    var startY = canvasH / 2 - (lines.length - 1) * lineH / 2;
    lines.forEach(function(l, li){
      ctx.fillText(l, canvasW / 2, startY + li * lineH);
    });

    var worldHeight = worldWidth * (canvasH / canvasW);

    // ---- Grupo "sólido": la textura del canvas repetida en varias capas ----
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;

    var planeGeo = new THREE.PlaneGeometry(worldWidth, worldHeight);
    var solidGroup = new THREE.Group();
    var layerMats = [];
    var layerStep = depthLayers > 1 ? depth / (depthLayers - 1) : 0;

    for(var Lk = depthLayers - 1; Lk >= 0; Lk--){
      var shade = 1 - (Lk / Math.max(1, depthLayers - 1)) * shadeAmount;
      var lm = new THREE.MeshBasicMaterial({
        map: tex, color: tmpColor.copy(inkColor).multiplyScalar(shade).getHex(),
        transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(planeGeo, lm);
      mesh.position.set(Lk * extrudeX, Lk * extrudeY, -Lk * layerStep);
      mesh.renderOrder = depthLayers - Lk;
      solidGroup.add(mesh);
      layerMats.push(lm);
    }

    // ---- Nube de ceniza: se genera de la misma máscara del canvas ----
    var stride = opts.stride || 4;
    var px2world = worldWidth / canvasW;
    var img = ctx.getImageData(0, 0, canvasW, canvasH).data;

    var positions = [], nxList = [];
    for(var y = 0; y < canvasH; y += stride){
      for(var x = 0; x < canvasW; x += stride){
        var idx = (y * canvasW + x) * 4;
        if(img[idx + 3] < 120) continue;
        var jx = (Math.random() - 0.5) * stride * px2world * 0.9;
        var jy = (Math.random() - 0.5) * stride * px2world * 0.9;
        var wx = (x / canvasW - 0.5) * worldWidth + jx;
        var wy = -(y / canvasH - 0.5) * worldHeight + jy;
        var wz = (Math.random() - 0.5) * depth * 0.3;
        positions.push(wx, wy, wz);
        nxList.push(x / canvasW);
      }
    }

    var count = positions.length / 3;
    var posArr = new Float32Array(positions);
    var baseArr = posArr.slice();
    var colArr = new Float32Array(count * 3);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    var ashMat = new THREE.PointsMaterial({
      size: opts.particleSize || 0.09,
      sizeAttenuation: true,
      vertexColors: true,
      map: glowTexture(32, SPARK_STOPS),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      opacity: 0
    });
    var ashPoints = new THREE.Points(geo, ashMat);
    ashPoints.frustumCulled = false;
    ashPoints.visible = false;

    var drift = new Float32Array(count * 3);
    var burnStart = new Float32Array(count);
    for(var i = 0; i < count; i++){
      var ang = Math.random() * Math.PI * 2;
      var rad = 0.7 + Math.random() * 2.2;
      drift[i * 3]     = Math.cos(ang) * rad;
      drift[i * 3 + 1] = 0.6 + Math.random() * 1.9;
      drift[i * 3 + 2] = Math.sin(ang) * rad * 0.6 + (Math.random() - 0.5) * 1.4;
      burnStart[i] = clamp01b(nxList[i] * 0.7 + Math.random() * 0.35 - 0.05);
      colArr[i * 3] = inkColor.r; colArr[i * 3 + 1] = inkColor.g; colArr[i * 3 + 2] = inkColor.b;
    }

    var object = new THREE.Group();
    object.add(solidGroup);
    object.add(ashPoints);

    var inSeconds   = opts.inSeconds   != null ? opts.inSeconds   : 1.2;
    var holdSeconds = opts.holdSeconds != null ? opts.holdSeconds : 3;
    var burnSeconds = opts.burnSeconds != null ? opts.burnSeconds : 4.5;

    var state = { phase: 'in', t: 0 };

    function setSolidOpacity(v){
      for(var k = 0; k < layerMats.length; k++) layerMats[k].opacity = v;
    }

    function update(dt){
      if(state.phase === 'done') return;
      state.t += dt;

      if(state.phase === 'in'){
        var p = clamp01b(state.t / inSeconds);
        setSolidOpacity(p);
        if(p >= 1){ state.phase = 'hold'; state.t = 0; }
        return;
      }

      if(state.phase === 'hold'){
        setSolidOpacity(0.97 + Math.sin(state.t * 2.4) * 0.03);
        if(state.t >= holdSeconds){
          state.phase = 'burn'; state.t = 0;
          solidGroup.visible = false;
          ashPoints.visible = true;
          ashMat.opacity = 1;
        }
        return;
      }

      if(state.phase === 'burn'){
        var q = clamp01b(state.t / burnSeconds);
        var posA = geo.attributes.position.array;
        var colA = geo.attributes.color.array;
        for(var i2 = 0; i2 < count; i2++){
          var local = clamp01b((q - burnStart[i2]) / Math.max(0.001, 1 - burnStart[i2]));
          var ee = local * local;
          var bi = i2 * 3;
          posA[bi]     = baseArr[bi]     + drift[bi]     * ee * 2.4;
          posA[bi + 1] = baseArr[bi + 1] + drift[bi + 1] * ee * 2.4;
          posA[bi + 2] = baseArr[bi + 2] + drift[bi + 2] * ee * 2.4;

          if(local <= 0){
            colA[bi] = inkColor.r; colA[bi + 1] = inkColor.g; colA[bi + 2] = inkColor.b;
          } else if(local < 0.35){
            tmpColor.copy(inkColor).lerp(emberColor, local / 0.35);
            colA[bi] = tmpColor.r; colA[bi + 1] = tmpColor.g; colA[bi + 2] = tmpColor.b;
          } else {
            tmpColor.copy(emberColor).lerp(ashColor, clamp01b((local - 0.35) / 0.65));
            colA[bi] = tmpColor.r; colA[bi + 1] = tmpColor.g; colA[bi + 2] = tmpColor.b;
          }
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        ashMat.opacity = 1 - q;
        if(q >= 1){ state.phase = 'done'; }
        return;
      }
    }

    return {
      object: object,
      update: update,
      get done(){ return state.phase === 'done'; }
    };
  };

  // Igual que createAshText pero con una imagen: el plano con la foto se
  // muestra sólido un rato y luego se apaga y en su lugar aparece una nube
  // de partículas (con los colores muestreados de la propia imagen) que se
  // dispersa como ceniza. img debe ser un HTMLImageElement ya cargado.
  // Devuelve { object, update(dt), done }.
  window.createAshImage = function(img, opts){
    opts = opts || {};

    var iw = img.naturalWidth || img.width || 1;
    var ih = img.naturalHeight || img.height || 1;
    var worldWidth = opts.width || 14;
    var worldHeight = opts.height || worldWidth * (ih / iw);
    var fit = opts.fit || 'stretch';
    var imgAspect = iw / ih;
    var planeAspect = worldWidth / worldHeight;

    var emberColor = new THREE.Color(opts.emberColor || 0xff8a3d);
    var ashColor   = new THREE.Color(opts.ashColor   || 0x4a3f36);
    var tmpColor   = new THREE.Color();

    // ---- plano sólido con la textura de la imagen ----
    var tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;

    // Si fit es 'cover', recortamos (en vez de estirar) para que la
    // imagen llene el plano completo manteniendo su proporción original.
    var cropWFrac = 1, cropHFrac = 1, cropX0Frac = 0, cropY0Frac = 0;
    if(fit === 'cover'){
      if(imgAspect > planeAspect){
        cropWFrac = planeAspect / imgAspect;
        cropX0Frac = (1 - cropWFrac) / 2;
        tex.repeat.set(cropWFrac, 1);
        tex.offset.set(cropX0Frac, 0);
      } else {
        cropHFrac = imgAspect / planeAspect;
        cropY0Frac = (1 - cropHFrac) / 2;
        tex.repeat.set(1, cropHFrac);
        tex.offset.set(0, cropY0Frac);
      }
    }

    var solidMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide
    });
    var solidMesh = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth, worldHeight), solidMat);
    solidMesh.renderOrder = 999;

    // ---- muestreo de píxeles para la nube de partículas ----
    // Usamos exactamente el mismo recorte que se ve en el plano sólido,
    // para que las partículas nazcan justo donde estaba la imagen visible.
    var srcX = cropX0Frac * iw, srcY = cropY0Frac * ih;
    var srcW = iw * cropWFrac, srcH = ih * cropHFrac;
    var sampleW = Math.max(2, Math.min(Math.round(srcW), opts.sampleWidth || 320));
    var sampleH = Math.max(2, Math.round(sampleW / planeAspect));
    var sc = document.createElement('canvas');
    sc.width = sampleW; sc.height = sampleH;
    var sctx = sc.getContext('2d');

    var data = null;
    try {
      sctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, sampleW, sampleH);
      data = sctx.getImageData(0, 0, sampleW, sampleH).data;
    } catch(err){
      console.warn('galaxya.js: no se pudo leer los píxeles de la imagen (CORS); se mostrará solo el plano sólido, sin partículas.', err);
    }

    var positions = [], srcColorList = [];
    var px2worldX = worldWidth / sampleW, px2worldY = worldHeight / sampleH;
    if(data){
      for(var y = 0; y < sampleH; y++){
        for(var x = 0; x < sampleW; x++){
          var idx = (y * sampleW + x) * 4;
          if(data[idx + 3] < 40) continue;
          var jx = (Math.random() - 0.5) * px2worldX * 0.9;
          var jy = (Math.random() - 0.5) * px2worldY * 0.9;
          var wx = (x / sampleW - 0.5) * worldWidth + jx;
          var wy = -(y / sampleH - 0.5) * worldHeight + jy;
          var wz = (Math.random() - 0.5) * worldWidth * 0.02;
          positions.push(wx, wy, wz);
          srcColorList.push(data[idx] / 255, data[idx + 1] / 255, data[idx + 2] / 255);
        }
      }
    }

    var count = positions.length / 3;
    var posArr = new Float32Array(positions);
    var baseArr = posArr.slice();
    var srcColor = new Float32Array(srcColorList);
    var colArr = new Float32Array(count * 3);
    colArr.set(srcColor);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    var ashMat = new THREE.PointsMaterial({
      size: opts.particleSize || 0.07,
      sizeAttenuation: true,
      vertexColors: true,
      map: glowTexture(32, SPARK_STOPS),
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      opacity: 0
    });
    var ashPoints = new THREE.Points(geo, ashMat);
    ashPoints.frustumCulled = false;
    ashPoints.visible = false;
    ashPoints.renderOrder = 999;

    var drift = new Float32Array(count * 3);
    var burnStart = new Float32Array(count);
    for(var i = 0; i < count; i++){
      var ang = Math.random() * Math.PI * 2;
      var rad = 0.7 + Math.random() * 2.2;
      drift[i * 3]     = Math.cos(ang) * rad;
      drift[i * 3 + 1] = 0.6 + Math.random() * 1.9;
      drift[i * 3 + 2] = Math.sin(ang) * rad * 0.6 + (Math.random() - 0.5) * 1.4;
      burnStart[i] = clamp01b(Math.random() * 0.8);
    }

    var object = new THREE.Group();
    object.add(solidMesh);
    object.add(ashPoints);

    var inSeconds   = opts.inSeconds   != null ? opts.inSeconds   : 1.2;
    var holdSeconds = opts.holdSeconds != null ? opts.holdSeconds : 3;
    var burnSeconds = opts.burnSeconds != null ? opts.burnSeconds : 4.5;
    // Multiplica cuánto se dispersan las partículas (útil si el plano es muy grande).
    var driftScale  = opts.driftScale  != null ? opts.driftScale  : 1;

    var state = { phase: 'in', t: 0 };

    function update(dt){
      if(state.phase === 'done') return;
      state.t += dt;

      if(state.phase === 'in'){
        var p = clamp01b(state.t / inSeconds);
        solidMat.opacity = p;
        if(p >= 1){ state.phase = 'hold'; state.t = 0; }
        return;
      }

      if(state.phase === 'hold'){
        solidMat.opacity = 0.97 + Math.sin(state.t * 2.4) * 0.03;
        if(state.t >= holdSeconds){
          state.phase = 'burn'; state.t = 0;
          solidMesh.visible = false;
          if(count > 0){
            ashPoints.visible = true;
            ashMat.opacity = 1;
          } else {
            state.phase = 'done';
          }
        }
        return;
      }

      if(state.phase === 'burn'){
        var q = clamp01b(state.t / burnSeconds);
        var posA = geo.attributes.position.array;
        var colA = geo.attributes.color.array;
        for(var k = 0; k < count; k++){
          var local = clamp01b((q - burnStart[k]) / Math.max(0.001, 1 - burnStart[k]));
          var ee = local * local;
          var bi = k * 3;
          posA[bi]     = baseArr[bi]     + drift[bi]     * ee * 2.4 * driftScale;
          posA[bi + 1] = baseArr[bi + 1] + drift[bi + 1] * ee * 2.4 * driftScale;
          posA[bi + 2] = baseArr[bi + 2] + drift[bi + 2] * ee * 2.4 * driftScale;

          if(local <= 0){
            colA[bi] = srcColor[bi]; colA[bi + 1] = srcColor[bi + 1]; colA[bi + 2] = srcColor[bi + 2];
          } else if(local < 0.35){
            tmpColor.setRGB(srcColor[bi], srcColor[bi + 1], srcColor[bi + 2]).lerp(emberColor, local / 0.35);
            colA[bi] = tmpColor.r; colA[bi + 1] = tmpColor.g; colA[bi + 2] = tmpColor.b;
          } else {
            tmpColor.copy(emberColor).lerp(ashColor, clamp01b((local - 0.35) / 0.65));
            colA[bi] = tmpColor.r; colA[bi + 1] = tmpColor.g; colA[bi + 2] = tmpColor.b;
          }
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        ashMat.opacity = 1 - q;
        if(q >= 1){ state.phase = 'done'; }
        return;
      }
    }

    return {
      object: object,
      update: update,
      get done(){ return state.phase === 'done'; }
    };
  };

})();
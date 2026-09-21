(function(){

  var DIM = { W:0.76, H:1.56, D:0.09, R:0.13, BEZEL:0.03, BEVEL:0.008 };
  DIM.SW = DIM.W - DIM.BEZEL * 2;
  DIM.SH = DIM.H - DIM.BEZEL * 2;
  var SCREEN_ASPECT = DIM.SW / DIM.SH;

  function roundedRectShape(w, h, r){
    r = Math.max(0.0001, Math.min(r, w / 2, h / 2));
    var x = -w / 2, y = -h / 2;
    var s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r,     r, -Math.PI / 2, 0,             false);
    s.lineTo(x + w, y + h - r);
    s.absarc(x + w - r, y + h - r, r, 0,            Math.PI / 2,   false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r,     y + h - r, r, Math.PI / 2,  Math.PI,       false);
    s.lineTo(x, y + r);
    s.absarc(x + r,     y + r,     r, Math.PI,      Math.PI * 1.5, false);
    return s;
  }

  function roundedPlane(w, h, r){
    var geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 16);
    var pos = geo.attributes.position;
    var uv = geo.attributes.uv;
    for(var i = 0; i < pos.count; i++){
      uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }

  function rr(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawLockScreen(ctx, w, h, unlocked){
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0,    '#1f3550');
    g.addColorStop(0.55, '#b5533c');
    g.addColorStop(1,    '#e8a33d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(w * 0.85, h * 0.62, w * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.arc(w * 0.10, h * 0.85, w * 0.60, 0, Math.PI * 2); ctx.fill();

    var now = new Date();
    var mm = now.getMinutes();
    var timeStr = now.getHours() + ':' + (mm < 10 ? '0' + mm : mm);
    var dateStr = '';
    try{
      dateStr = now.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
    } catch(e){ dateStr = ''; }
    if(dateStr) dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    var sans = 'Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';

    ctx.font = '600 32px ' + sans;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, w * 0.09, 62);

    for(var b = 0; b < 4; b++){
      var bh = 10 + b * 6;
      rr(ctx, w - 214 + b * 12, 74 - bh, 8, bh, 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    rr(ctx, w - 130, 48, 56, 28, 8);
    ctx.stroke();
    rr(ctx, w - 125, 53, 38, 18, 4);
    ctx.fill();
    rr(ctx, w - 71, 56, 5, 12, 2);
    ctx.fill();

    var lx = w / 2, ly = 102;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    rr(ctx, lx - 19, ly, 38, 28, 6);
    ctx.fill();
    ctx.beginPath();
    if(unlocked){
      ctx.moveTo(lx - 11, ly - 6);
      ctx.lineTo(lx - 11, ly - 14);
      ctx.arc(lx, ly - 14, 11, Math.PI, Math.PI * 2, false);
      ctx.lineTo(lx + 11, ly);
    } else {
      ctx.moveTo(lx - 11, ly);
      ctx.lineTo(lx - 11, ly - 10);
      ctx.arc(lx, ly - 10, 11, Math.PI, Math.PI * 2, false);
      ctx.lineTo(lx + 11, ly);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.textAlign = 'center';
    ctx.font = '500 36px ' + sans;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(dateStr, w / 2, h * 0.155);
    ctx.font = '300 220px ' + sans;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, w / 2, h * 0.245);

    var by = h - 190;
    [w * 0.14, w * 0.86].forEach(function(bx, i){
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.beginPath(); ctx.arc(bx, by, 42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      if(i === 0){
        rr(ctx, bx - 9, by - 20, 18, 26, 5); ctx.fill();
        ctx.fillRect(bx - 5, by + 8, 10, 12);
      } else {
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        rr(ctx, bx - 20, by - 13, 40, 28, 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx, by + 1, 8, 0, Math.PI * 2); ctx.stroke();
      }
    });

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    rr(ctx, w * 0.32, h - 40, w * 0.36, 10, 5);
    ctx.fill();
  }

  function makeGlareTexture(){
    var c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0.00, 'rgba(255,255,255,0.00)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.00)');
    g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function fitCover(tex, aspect){
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    var img = tex.image;
    if(!img) return;
    var iw = img.videoWidth || img.naturalWidth || img.width;
    var ih = img.videoHeight || img.naturalHeight || img.height;
    if(!iw || !ih) return;
    var ia = iw / ih;
    if(ia > aspect){
      tex.repeat.x = aspect / ia;
      tex.offset.x = (1 - tex.repeat.x) / 2;
    } else {
      tex.repeat.y = ia / aspect;
      tex.offset.y = (1 - tex.repeat.y) / 2;
    }
  }

  function imageSize(tex){
    var img = tex.image;
    if(!img) return null;
    var iw = img.videoWidth || img.naturalWidth || img.width;
    var ih = img.videoHeight || img.naturalHeight || img.height;
    return (iw && ih) ? [iw, ih] : null;
  }

  function fitContainUV(tex, aspect){
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    var size = imageSize(tex);
    if(!size) return;
    var ia = size[0] / size[1];
    if(ia > aspect){
      tex.repeat.y = ia / aspect;
      tex.offset.y = (1 - tex.repeat.y) / 2;
    } else {
      tex.repeat.x = aspect / ia;
      tex.offset.x = (1 - tex.repeat.x) / 2;
    }
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  }

  function blockColor(ctx, x, y, n){
    var d = ctx.getImageData(x, y, n, n).data;
    var r = 0, g = 0, b = 0, w = 0;
    for(var i = 0; i < d.length; i += 4){
      var a = d[i + 3];
      r += d[i] * a; g += d[i + 1] * a; b += d[i + 2] * a; w += a;
    }
    if(!w) return 'rgb(255,255,255)';
    return 'rgb(' + Math.round(r / w) + ',' + Math.round(g / w) + ',' + Math.round(b / w) + ')';
  }

  function buildContainCanvas(img){
    try{
      if(!img || (img.tagName && img.tagName !== 'IMG')) return null;
      var iw = img.videoWidth || img.naturalWidth || img.width;
      var ih = img.videoHeight || img.naturalHeight || img.height;
      if(!iw || !ih) return null;

      var cw, ch, dx = 0, dy = 0;
      if(iw / ih > SCREEN_ASPECT){
        cw = iw; ch = Math.round(iw / SCREEN_ASPECT); dy = Math.round((ch - ih) / 2);
      } else {
        ch = ih; cw = Math.round(ih * SCREEN_ASPECT); dx = Math.round((cw - iw) / 2);
      }
      var k = Math.min(1, 4096 / Math.max(cw, ch));
      cw = Math.round(cw * k); ch = Math.round(ch * k);
      dx = Math.round(dx * k); dy = Math.round(dy * k);
      var dw = Math.round(iw * k), dh = Math.round(ih * k);

      var c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dw, dh);

      var n = Math.max(2, Math.min(8, dw >> 1, dh >> 1));
      var tl = blockColor(ctx, dx, dy, n);
      var tr = blockColor(ctx, dx + dw - n, dy, n);
      var bl = blockColor(ctx, dx, dy + dh - n, n);
      var br = blockColor(ctx, dx + dw - n, dy + dh - n, n);

      ctx.globalCompositeOperation = 'destination-over';
      var g1, g2;
      if(dy > 0){
        g1 = ctx.createLinearGradient(0, 0, cw, 0); g1.addColorStop(0, tl); g1.addColorStop(1, tr);
        g2 = ctx.createLinearGradient(0, 0, cw, 0); g2.addColorStop(0, bl); g2.addColorStop(1, br);
        ctx.fillStyle = g1; ctx.fillRect(0, 0, cw, Math.round(ch / 2));
        ctx.fillStyle = g2; ctx.fillRect(0, Math.round(ch / 2), cw, ch);
      } else {
        g1 = ctx.createLinearGradient(0, 0, 0, ch); g1.addColorStop(0, tl); g1.addColorStop(1, bl);
        g2 = ctx.createLinearGradient(0, 0, 0, ch); g2.addColorStop(0, tr); g2.addColorStop(1, br);
        ctx.fillStyle = g1; ctx.fillRect(0, 0, Math.round(cw / 2), ch);
        ctx.fillStyle = g2; ctx.fillRect(Math.round(cw / 2), 0, cw, ch);
      }
      ctx.globalCompositeOperation = 'source-over';
      return c;
    } catch(err){
      console.warn('cell.js: no se pudo armar la imagen completa en la pantalla; se usa el respaldo:', err);
      return null;
    }
  }

  function buildStretchCanvas(img){
    try{
      if(!img || (img.tagName && img.tagName !== 'IMG')) return null;
      var iw = img.videoWidth || img.naturalWidth || img.width;
      var ih = img.videoHeight || img.naturalHeight || img.height;
      if(!iw || !ih) return null;
      var cw = iw, ch = Math.round(iw / SCREEN_ASPECT);
      var k = Math.min(1, 4096 / Math.max(cw, ch));
      cw = Math.round(cw * k); ch = Math.round(ch * k);
      var c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, cw, ch);
      return c;
    } catch(err){
      return null;
    }
  }

  function buildContainTexture(src){
    var c = buildContainCanvas(src.image);
    if(!c) return null;
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function buildCameraModule(bumpMat, ringMat){
    var g = new THREE.Group();
    var S = 0.34, BUMP = 0.016;

    var plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRectShape(S - 0.008, S - 0.008, 0.07), {
        depth: BUMP - 0.004,
        bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.004, bevelSegments: 2,
        curveSegments: 12
      }),
      bumpMat
    );
    plate.position.z = 0.002;
    plate.castShadow = true;
    g.add(plate);

    var glassMat  = new THREE.MeshStandardMaterial({ color:0x0b0e14, roughness:0.1, metalness:0.3 });
    var irisMat   = new THREE.MeshStandardMaterial({ color:0x1a2a4a, roughness:0.15, metalness:0.2 });
    var glintMat  = new THREE.MeshBasicMaterial({ color:0x6f86b8, transparent:true, opacity:0.55 });
    var ringGeo   = new THREE.CylinderGeometry(0.062, 0.062, 0.012, 24);
    var glassGeo  = new THREE.CircleGeometry(0.048, 24);
    var irisGeo   = new THREE.CircleGeometry(0.022, 20);
    var glintGeo  = new THREE.CircleGeometry(0.007, 12);

    [[-0.075, 0.075], [-0.075, -0.075], [0.075, 0]].forEach(function(p){
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(p[0], p[1], BUMP + 0.006);
      ring.castShadow = true;
      g.add(ring);

      var glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(p[0], p[1], BUMP + 0.0125);
      g.add(glass);

      var iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(p[0], p[1], BUMP + 0.0128);
      g.add(iris);

      var glint = new THREE.Mesh(glintGeo, glintMat);
      glint.position.set(p[0] - 0.02, p[1] + 0.022, BUMP + 0.0131);
      g.add(glint);
    });

    var flash = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshBasicMaterial({ color:0xf4e7b8 })
    );
    flash.position.set(0.075, 0.115, BUMP + 0.0005);
    g.add(flash);

    var lidar = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshBasicMaterial({ color:0x0a0a0c })
    );
    lidar.position.set(0.075, -0.115, BUMP + 0.0005);
    g.add(lidar);

    return g;
  }

  window.createCellPhone = function(opts){
    opts = opts || {};
    var scale = opts.scale || 1;
    var frameColor = (opts.color !== undefined) ? opts.color : 0x4a4d52;
    var anisotropy = opts.anisotropy || 8;

    var W = DIM.W, H = DIM.H, D = DIM.D, R = DIM.R, BS = DIM.BEVEL;
    var GLASS_INSET = BS + 0.006;
    var glassW = W - GLASS_INSET * 2;
    var glassH = H - GLASS_INSET * 2;
    var glassR = R - GLASS_INSET;

    var phone = new THREE.Group();
    phone.name = 'cellPhone';

    var frameMat = new THREE.MeshStandardMaterial({ color:frameColor, metalness:0.75, roughness:0.38 });
    var backColor = new THREE.Color(frameColor).multiplyScalar(0.7);
    var backMat = new THREE.MeshStandardMaterial({ color:backColor, metalness:0.15, roughness:0.28 });
    var bumpMat = new THREE.MeshStandardMaterial({ color:backColor, metalness:0.15, roughness:0.2 });
    var buttonMat = new THREE.MeshStandardMaterial({
      color:new THREE.Color(frameColor).multiplyScalar(1.15), metalness:0.75, roughness:0.32
    });
    var blackGlassMat = new THREE.MeshStandardMaterial({ color:0x050506, roughness:0.15, metalness:0.2 });

    var bodyGeo = new THREE.ExtrudeGeometry(roundedRectShape(W - BS * 2, H - BS * 2, R - BS), {
      depth: D - BS * 2,
      bevelEnabled: true, bevelThickness: BS, bevelSize: BS, bevelSegments: 4,
      curveSegments: 24
    });
    bodyGeo.translate(0, 0, -(D - BS * 2) / 2);
    var body = new THREE.Mesh(bodyGeo, frameMat);
    body.castShadow = true;
    body.receiveShadow = true;
    phone.add(body);

    var zFront = D / 2;
    var zBack  = -D / 2;

    var frontGlass = new THREE.Mesh(roundedPlane(glassW, glassH, glassR), blackGlassMat);
    frontGlass.position.z = zFront + 0.0006;
    frontGlass.receiveShadow = true;
    phone.add(frontGlass);

    var lockCanvas = document.createElement('canvas');
    lockCanvas.width = 540;
    lockCanvas.height = Math.round(540 / SCREEN_ASPECT);
    var lockTex = new THREE.CanvasTexture(lockCanvas);
    lockTex.encoding = THREE.sRGBEncoding;
    lockTex.anisotropy = anisotropy;

    var screenMat = new THREE.MeshBasicMaterial({ map: lockTex });
    var screen = new THREE.Mesh(roundedPlane(DIM.SW, DIM.SH, DIM.R - DIM.BEZEL + 0.004), screenMat);
    screen.position.z = zFront + 0.0012;
    screen.name = 'cellScreen';
    phone.add(screen);

    var lockOverlayMat = new THREE.MeshBasicMaterial({ map: lockTex, transparent:true, opacity:0, depthWrite:false });
    var lockOverlay = new THREE.Mesh(roundedPlane(DIM.SW, DIM.SH, DIM.R - DIM.BEZEL + 0.004), lockOverlayMat);
    lockOverlay.position.z = zFront + 0.0015;
    lockOverlay.renderOrder = 1;
    lockOverlay.visible = false;
    phone.add(lockOverlay);

    var glare = new THREE.Mesh(
      roundedPlane(DIM.SW, DIM.SH, DIM.R - DIM.BEZEL + 0.004),
      new THREE.MeshBasicMaterial({ map: makeGlareTexture(), transparent:true, depthWrite:false })
    );
    glare.position.z = zFront + 0.0018;
    glare.renderOrder = 2;
    phone.add(glare);

    if(opts.island !== false){
      var islandW = 0.20, islandH = 0.058;
      var island = new THREE.Mesh(
        new THREE.ShapeGeometry(roundedRectShape(islandW, islandH, islandH / 2), 12),
        new THREE.MeshBasicMaterial({ color:0x000000 })
      );
      island.position.set(0, DIM.SH / 2 - 0.055, zFront + 0.0024);
      phone.add(island);

      var selfie = new THREE.Mesh(
        new THREE.CircleGeometry(0.011, 16),
        new THREE.MeshBasicMaterial({ color:0x141a2a })
      );
      selfie.position.set(0.055, DIM.SH / 2 - 0.055, zFront + 0.0030);
      phone.add(selfie);
    }

    var backGlass = new THREE.Mesh(roundedPlane(glassW, glassH, glassR), backMat);
    backGlass.rotation.y = Math.PI;
    backGlass.position.z = zBack - 0.0006;
    backGlass.receiveShadow = true;
    phone.add(backGlass);

    var cam = buildCameraModule(bumpMat, frameMat);
    cam.rotation.y = Math.PI;
    cam.position.set(W / 2 - 0.045 - 0.17, H / 2 - 0.045 - 0.17, zBack - 0.0006);
    phone.add(cam);

    function addButton(side, y, len){
      var btn = new THREE.Mesh(new THREE.BoxGeometry(0.012, len, 0.03), buttonMat);
      btn.position.set(side * (W / 2 + 0.0015), y, 0);
      btn.castShadow = true;
      phone.add(btn);
    }
    addButton(-1, H / 2 - 0.28, 0.05);
    addButton(-1, H / 2 - 0.42, 0.10);
    addButton(-1, H / 2 - 0.58, 0.10);
    addButton( 1, H / 2 - 0.50, 0.16);

    var darkMat = new THREE.MeshBasicMaterial({ color:0x0a0a0a });
    var port = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.022), darkMat);
    port.rotation.x = Math.PI / 2;
    port.position.set(0, -H / 2 - 0.0005, 0);
    phone.add(port);

    var holeGeo = new THREE.CircleGeometry(0.0055, 10);
    for(var side = -1; side <= 1; side += 2){
      for(var i = 0; i < 5; i++){
        var hole = new THREE.Mesh(holeGeo, darkMat);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(side * (0.14 + i * 0.028), -H / 2 - 0.0005, 0);
        phone.add(hole);
      }
    }

    var loadToken = 0;
    var seqToken = 0;
    var imageState = 'none';
    var fitMode = opts.screenFit || window.cellScreenFit || 'contain';
    var srcTex = null;
    var srcOwned = false;
    var fitTex = null;

    function releaseOwned(){
      if(fitTex){ fitTex.dispose(); fitTex = null; }
      if(srcTex && srcOwned) srcTex.dispose();
      srcTex = null;
      srcOwned = false;
    }

    function applyFit(){
      if(!srcTex) return;
      if(fitTex){ fitTex.dispose(); fitTex = null; }
      var tex = srcTex;
      tex.repeat.set(1, 1);
      tex.offset.set(0, 0);
      if(fitMode === 'contain'){
        fitTex = buildContainTexture(srcTex);
        if(fitTex) tex = fitTex;
        else fitContainUV(srcTex, SCREEN_ASPECT);
      } else if(fitMode === 'cover'){
        fitCover(srcTex, SCREEN_ASPECT);
      }
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = anisotropy;
      tex.minFilter = tex.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      screenMat.map = tex;
      screenMat.needsUpdate = true;
      imageState = 'ready';
    }

    function showTexture(tex, owned){
      releaseOwned();
      srcTex = tex;
      srcOwned = owned;
      applyFit();
    }

    function drawLock(unlocked){
      drawLockScreen(lockCanvas.getContext('2d'), lockCanvas.width, lockCanvas.height, unlocked);
      lockTex.needsUpdate = true;
    }

    phone.showLockScreen = function(){
      loadToken++;
      seqToken++;
      imageState = 'none';
      lockOverlay.visible = false;
      lockOverlayMat.opacity = 0;
      lockTex.offset.set(0, 0);
      drawLock(false);
      releaseOwned();
      screenMat.map = lockTex;
      screenMat.needsUpdate = true;
    };

    phone.setScreenImage = function(src, onLoad){
      if(!src){ phone.showLockScreen(); return; }
      var token = ++loadToken;

      if(typeof src === 'string'){
        imageState = 'loading';
        new THREE.TextureLoader().load(
          src,
          function(tex){
            if(token !== loadToken){ tex.dispose(); return; }
            showTexture(tex, true);
            if(onLoad) onLoad(screenMat.map);
          },
          undefined,
          function(err){
            console.error('cell.js: no se pudo cargar la imagen de pantalla:', src, err);
            if(token === loadToken) imageState = 'failed';
          }
        );
      } else if(src.isTexture){
        showTexture(src, false);
        if(onLoad) onLoad(screenMat.map);
      } else if(typeof HTMLVideoElement !== 'undefined' && src instanceof HTMLVideoElement){
        showTexture(new THREE.VideoTexture(src), true);
        if(onLoad) onLoad(screenMat.map);
      } else if(typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement){
        showTexture(new THREE.CanvasTexture(src), true);
        if(onLoad) onLoad(screenMat.map);
      } else {
        console.warn('cell.js: tipo de imagen de pantalla no soportado', src);
      }
    };

    function runTween(token, ms, step, done){
      var t0 = null;
      function frame(now){
        if(token !== seqToken) return;
        if(t0 === null) t0 = now;
        var p = ms > 0 ? Math.min((now - t0) / ms, 1) : 1;
        step(p);
        if(p < 1) requestAnimationFrame(frame);
        else if(done) done();
      }
      requestAnimationFrame(frame);
    }

    phone.setScreenFit = function(mode){
      fitMode = mode || 'contain';
      applyFit();
    };

    phone.setScreenOn = function(on){
      seqToken++;
      lockOverlay.visible = false;
      lockOverlayMat.opacity = 0;
      lockTex.offset.set(0, 0);
      screenMat.color.setHex(on === false ? 0x000000 : 0xffffff);
    };

    var imageCache = {};

    function loadImageCached(url, cb){
      var it = imageCache[url];
      if(it){
        if(it.state === 'ready'){ cb(it.tex); return; }
        if(it.state === 'failed'){ cb(null); return; }
        it.waiters.push(cb);
        return;
      }
      it = imageCache[url] = { tex:null, state:'loading', waiters:[cb] };
      function flush(tex){
        var w = it.waiters; it.waiters = [];
        w.forEach(function(f){ f(tex); });
      }
      new THREE.TextureLoader().load(
        url,
        function(tex){ it.tex = tex; it.state = 'ready'; flush(tex); },
        undefined,
        function(err){
          console.error('cell.js: no se pudo cargar la imagen:', url, err);
          it.state = 'failed';
          flush(null);
        }
      );
    }

    phone.preloadImage = function(url, cb){
      if(!url){ if(cb) cb(null); return; }
      loadImageCached(url, function(tex){ if(cb) cb(tex); });
    };

    function currentScreenCanvas(){
      if(fitTex && fitTex.image && fitTex.image.getContext) return fitTex.image;
      if(screenMat.map === homeTex && homeCanvas) return homeCanvas;
      if(screenMat.map === appOpenTex && appOpenCanvas) return appOpenCanvas;
      if(srcTex && srcTex.image){
        var c = fitMode === 'stretch' ? buildStretchCanvas(srcTex.image) : buildContainCanvas(srcTex.image);
        if(c) return c;
      }
      if(screenMat.map === lockTex) return lockCanvas;
      return null;
    }

    var slideCanvas = null, slideTex = null;

    function ensureSlideCanvas(){
      if(!slideCanvas){
        slideCanvas = document.createElement('canvas');
        slideCanvas.width = 720;
        slideCanvas.height = Math.round(720 / SCREEN_ASPECT);
        slideTex = new THREE.CanvasTexture(slideCanvas);
        slideTex.encoding = THREE.sRGBEncoding;
        slideTex.anisotropy = anisotropy;
      }
    }

    function runSlideTransition(canvasA, canvasB, opt, done){
      opt = opt || {};
      var ms = (typeof opt.ms === 'number') ? opt.ms : 600;
      var axis = opt.axis || 'x';
      var dir = (opt.direction === 'right' || opt.direction === 'down') ? -1 : 1;
      ensureSlideCanvas();
      var W = slideCanvas.width, H = slideCanvas.height;
      var span = (axis === 'x') ? W : H;
      var gap = Math.round(span * 0.05);
      var sctx = slideCanvas.getContext('2d');
      var token = seqToken;

      function draw(e){
        var dist = (span + gap) * e * dir;
        sctx.fillStyle = '#000000';
        sctx.fillRect(0, 0, W, H);
        if(axis === 'x'){
          sctx.drawImage(canvasA, -dist, 0, W, H);
          sctx.drawImage(canvasB, (span + gap) * dir - dist, 0, W, H);
        } else {
          sctx.drawImage(canvasA, 0, -dist, W, H);
          sctx.drawImage(canvasB, 0, (span + gap) * dir - dist, W, H);
        }
        slideTex.needsUpdate = true;
      }

      draw(0);
      screenMat.map = slideTex;
      screenMat.needsUpdate = true;
      runTween(token, ms, function(p){
        draw(1 - Math.pow(1 - p, 4));
      }, done);
    }

    phone.slideToImage = function(src, opt, cb){
      opt = opt || {};
      var dir = opt.direction || 'left';
      var token = ++seqToken;
      lockOverlay.visible = false;
      lockOverlayMat.opacity = 0;

      function go(next){
        if(token !== seqToken) return;
        if(!next){
          console.warn('cell.js: no hay imagen para deslizar; se queda la actual');
          if(cb) cb();
          return;
        }
        var canvasA = currentScreenCanvas();
        var canvasB = opt.fit === 'stretch' ? buildStretchCanvas(next.image) : buildContainCanvas(next.image);
        if(!canvasA || !canvasB){
          if(opt.fit) fitMode = opt.fit;
          showTexture(next, false);
          if(cb) cb();
          return;
        }
        runSlideTransition(canvasA, canvasB, { ms: opt.ms, axis: opt.axis || 'x', direction: dir }, function(){
          if(opt.fit) fitMode = opt.fit;
          showTexture(next, false);
          if(cb) cb();
        });
      }

      if(typeof src === 'string') loadImageCached(src, go);
      else if(src && src.isTexture) go(src);
      else go(null);
    };

    var scrollCanvas = null, scrollTex = null;

    function scrollProfile(p){
      var r = 0.15, v = 1 / (1 - r);
      if(p < r) return v * p * p / (2 * r);
      if(p > 1 - r){ var q = 1 - p; return 1 - v * q * q / (2 * r); }
      return v * (p - r / 2);
    }

    phone.scrollDownImage = function(url, opt, cb){
      opt = opt || {};
      var token = ++seqToken;
      lockOverlay.visible = false;
      lockOverlayMat.opacity = 0;

      loadImageCached(url, function(next){
        if(token !== seqToken) return;
        if(!next || !next.image){
          console.warn('cell.js: no hay imagen para desplazar; se queda la actual');
          if(cb) cb();
          return;
        }
        var img = next.image;
        var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        if(!iw || !ih){ if(cb) cb(); return; }

        var W = 1080, Hs = Math.round(W / SCREEN_ASPECT);
        var h2 = Math.round(W * ih / iw);
        var k = Math.min(1, 8192 / h2);
        var pre = document.createElement('canvas');
        pre.width = Math.round(W * k); pre.height = Math.round(h2 * k);
        var pctx = pre.getContext('2d');
        pctx.imageSmoothingEnabled = true;
        pctx.imageSmoothingQuality = 'high';
        pctx.drawImage(img, 0, 0, pre.width, pre.height);

        var canvasA = currentScreenCanvas();

        if(!scrollCanvas){
          scrollCanvas = document.createElement('canvas');
          scrollCanvas.width = W;
          scrollCanvas.height = Hs;
          scrollTex = new THREE.CanvasTexture(scrollCanvas);
          scrollTex.encoding = THREE.sRGBEncoding;
          scrollTex.anisotropy = anisotropy;
        }
        var sctx = scrollCanvas.getContext('2d');
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'medium';

        function draw(off){
          sctx.fillStyle = '#000000';
          sctx.fillRect(0, 0, W, Hs);
          if(canvasA) sctx.drawImage(canvasA, 0, -off, W, Hs);
          sctx.drawImage(pre, 0, Hs - off, W, h2);
          scrollTex.needsUpdate = true;
        }

        var ms = (typeof opt.ms === 'number') ? opt.ms : Math.max(2000, Math.round((h2 / Hs) * (opt.msPerScreen || 1000)));
        draw(0);
        screenMat.map = scrollTex;
        screenMat.needsUpdate = true;
        runTween(token, ms, function(p){
          draw(h2 * scrollProfile(p));
        }, function(){
          if(cb) cb();
        });
      });
    };

    var homeCanvas = null, homeTex = null, homeReady = false, homeAppsUsed = null;

    function loadHomeIcons(apps, cb){
      var pending = 0, imgs = {};
      apps.forEach(function(app, i){
        if(app.icon){
          pending++;
          loadImageCached(app.icon, function(tex){
            imgs[i] = (tex && tex.image) ? tex.image : null;
            if(--pending === 0) cb(imgs);
          });
        }
      });
      if(pending === 0) cb(imgs);
    }

    function drawHomeCanvas(apps, imgs){
      if(!homeCanvas){
        homeCanvas = document.createElement('canvas');
        homeCanvas.width = 720;
        homeCanvas.height = Math.round(720 / SCREEN_ASPECT);
        homeTex = new THREE.CanvasTexture(homeCanvas);
        homeTex.encoding = THREE.sRGBEncoding;
        homeTex.anisotropy = anisotropy;
      }
      var w = homeCanvas.width, h = homeCanvas.height;
      var ctx = homeCanvas.getContext('2d');
      var sans = 'Helvetica, Arial, sans-serif';

      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#2c313d');
      bg.addColorStop(1, '#12141a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      var now = new Date();
      var mm = now.getMinutes();
      var timeStr = now.getHours() + ':' + (mm < 10 ? '0' + mm : mm);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 30px ' + sans;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, w * 0.08, 56);

      var cols = 4;
      var rows = Math.max(1, Math.ceil(apps.length / cols));
      var marginX = w * 0.09, marginTop = h * 0.14, marginBottom = h * 0.18;
      var cellW = (w - marginX * 2) / cols;
      var cellH = (h - marginTop - marginBottom) / rows;
      var iconS = Math.min(cellW, cellH) * 0.74;
      var iconH = iconS / 2;
      var iconRad = iconS * 0.30;

      apps.forEach(function(app, i){
        var col = i % cols, row = Math.floor(i / cols);
        var cx = marginX + cellW * (col + 0.5);
        var cy = marginTop + cellH * (row + 0.40);

        ctx.save();
        rr(ctx, cx - iconH, cy - iconH, iconS, iconS, iconRad);
        ctx.clip();
        var img = imgs && imgs[i];
        if(img){
          var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
          var k = Math.max(iconS / iw, iconS / ih);
          var dw = iw * k, dh = ih * k;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - iconH, cy - iconH, iconS, iconS);
          ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
        } else {
          ctx.fillStyle = app.color || '#5a5f6a';
          ctx.fillRect(cx - iconH, cy - iconH, iconS, iconS);
          var gg = ctx.createLinearGradient(cx - iconH, cy - iconH, cx + iconH, cy + iconH);
          gg.addColorStop(0, 'rgba(255,255,255,0.18)');
          gg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gg;
          ctx.fillRect(cx - iconH, cy - iconH, iconS, iconS);
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = '600 ' + Math.round(iconS * 0.44) + 'px ' + sans;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((app.name || '?').charAt(0).toUpperCase(), cx, cy + 2);
        }
        ctx.restore();

        rr(ctx, cx - iconH, cy - iconH, iconS, iconS, iconRad);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();

        if(app.name){
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = '500 ' + Math.round(iconS * 0.20) + 'px ' + sans;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(app.name, cx, cy + iconH + Math.round(iconS * 0.26));
        }
      });

      homeTex.needsUpdate = true;
      homeReady = true;
    }

    phone.preloadHomeScreen = function(cb){
      var apps = opts.homeApps || window.cellHomeApps || [];
      homeAppsUsed = apps;
      loadHomeIcons(apps, function(imgs){
        drawHomeCanvas(apps, imgs);
        if(cb) cb();
      });
    };

    phone.showHomeScreen = function(opt, cb){
      opt = opt || {};
      var token = ++seqToken;

      function apply(){
        if(token !== seqToken) return;
        var canvasA = currentScreenCanvas();
        lockOverlay.visible = false;
        lockOverlayMat.opacity = 0;
        if(canvasA){
          runSlideTransition(canvasA, homeCanvas, {
            ms: (typeof opt.ms === 'number') ? opt.ms : 550,
            axis: opt.axis || 'y',
            direction: opt.direction || 'up'
          }, function(){
            showTexture(homeTex, false);
            if(cb) cb();
          });
        } else {
          showTexture(homeTex, false);
          if(cb) cb();
        }
      }

      if(!homeReady) phone.preloadHomeScreen(apply);
      else apply();
    };

    var appOpenCanvas = null, appOpenTex = null;

    function drawAppOpenCanvas(img){
      if(!appOpenCanvas){
        appOpenCanvas = document.createElement('canvas');
        appOpenCanvas.width = 720;
        appOpenCanvas.height = Math.round(720 / SCREEN_ASPECT);
        appOpenTex = new THREE.CanvasTexture(appOpenCanvas);
        appOpenTex.encoding = THREE.sRGBEncoding;
        appOpenTex.anisotropy = anisotropy;
      }
      var w = appOpenCanvas.width, h = appOpenCanvas.height;
      var ctx = appOpenCanvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      var cx = w / 2, cy = h / 2;
      var r = Math.min(w, h) * 0.30;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if(img){
        var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        var k = Math.max((r * 2) / iw, (r * 2) / ih);
        var dw = iw * k, dh = ih * k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = '#5a5f6a';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();

      appOpenTex.needsUpdate = true;
    }

    phone.showAppOpen = function(iconUrl, opt, cb){
      opt = opt || {};
      var token = ++seqToken;

      function apply(img){
        if(token !== seqToken) return;
        drawAppOpenCanvas(img);
        var canvasA = currentScreenCanvas();
        lockOverlay.visible = false;
        lockOverlayMat.opacity = 0;
        if(canvasA){
          runSlideTransition(canvasA, appOpenCanvas, {
            ms: (typeof opt.ms === 'number') ? opt.ms : 500,
            axis: opt.axis || 'y',
            direction: opt.direction || 'up'
          }, function(){
            showTexture(appOpenTex, false);
            if(cb) cb();
          });
        } else {
          showTexture(appOpenTex, false);
          if(cb) cb();
        }
      }

      if(iconUrl) loadImageCached(iconUrl, function(tex){ apply(tex && tex.image ? tex.image : null); });
      else apply(null);
    };

    phone.turnScreenOff = function(ms, cb){
      var token = ++seqToken;
      var from = screenMat.color.r;
      var fromOverlay = lockOverlay.visible ? lockOverlayMat.opacity : 0;
      runTween(token, ms, function(p){
        var k = 1 - p;
        screenMat.color.setRGB(from * k, from * k, from * k);
        lockOverlayMat.opacity = fromOverlay * k;
      }, function(){
        lockOverlay.visible = false;
        lockOverlayMat.opacity = 0;
        lockTex.offset.set(0, 0);
        screenMat.color.setHex(0x000000);
        if(cb) cb();
      });
    };

    phone.wakeAndUnlock = function(opt, cb){
      opt = opt || {};
      function pick(v, d){ return (typeof v === 'number') ? v : d; }
      var blackMs  = pick(opt.blackMs, 1000);
      var fadeInMs = pick(opt.fadeInMs, 300);
      var lockMs   = pick(opt.lockMs, 500);
      var openMs   = pick(opt.openMs, 300);
      var slideMs  = pick(opt.slideMs, 450);
      var IMAGE_WAIT_MS = 3000;

      var token = ++seqToken;
      function alive(){ return token === seqToken; }
      function after(ms, fn){ setTimeout(function(){ if(alive()) fn(); }, ms); }
      function finish(){ if(cb) cb(); }
      function tween(ms, step, done){ runTween(token, ms, step, done); }

      screenMat.color.setHex(0x000000);
      lockOverlay.visible = false;
      lockOverlayMat.opacity = 0;
      lockTex.offset.set(0, 0);

      after(blackMs, function(){
        drawLock(false);
        lockOverlay.visible = true;
        tween(fadeInMs, function(p){ lockOverlayMat.opacity = p; }, function(){
          if(imageState === 'none'){ finish(); return; }

          after(lockMs, function(){
            drawLock(true);

            after(openMs, function(){
              var waited = 0;
              (function unlock(){
                if(!alive()) return;
                if(imageState === 'loading' && waited < IMAGE_WAIT_MS){
                  waited += 100;
                  setTimeout(unlock, 100);
                  return;
                }
                if(imageState !== 'ready'){
                  console.warn('cell.js: la imagen de pantalla no está lista; se queda en la pantalla de bloqueo');
                  finish();
                  return;
                }
                screenMat.color.setHex(0xffffff);
                tween(slideMs, function(p){
                  var e = p * p;
                  lockOverlayMat.opacity = 1 - e;
                  lockTex.offset.y = -0.3 * e;
                }, function(){
                  lockOverlay.visible = false;
                  lockOverlayMat.opacity = 0;
                  lockTex.offset.set(0, 0);
                  finish();
                });
              })();
            });
          });
        });
      });
    };

    phone.layFlat = function(x, y, z, rotY){
      phone.rotation.order = 'YXZ';
      phone.rotation.set(-Math.PI / 2, rotY || 0, 0);
      phone.position.set(x, y + (D / 2 + 0.004) * scale, z);
    };

    phone.screen = screen;
    phone.dims = {
      width: W, height: H, depth: D,
      screenWidth: DIM.SW, screenHeight: DIM.SH, screenAspect: SCREEN_ASPECT
    };

    phone.scale.setScalar(scale);

    phone.showLockScreen();
    var initial = (opts.screenImage === false) ? null : (opts.screenImage || window.cellScreenImage);
    if(initial) phone.setScreenImage(initial);
    if(opts.screenOn === false) screenMat.color.setHex(0x000000);

    return phone;
  };

})();
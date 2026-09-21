(function(){

  var holder = document.getElementById('canvas-holder');
  var W = window.innerWidth, H = window.innerHeight;

  var gltfLoader = new THREE.GLTFLoader();
  var dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/');
  dracoLoader.preload();
  gltfLoader.setDRACOLoader(dracoLoader);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcdb99b);

  var camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
  camera.position.set(0.16, 1.96, 8.96);

  var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  holder.appendChild(renderer.domElement);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0.16, 1.67, -0.06);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minAzimuthAngle = -1.35;
  controls.maxAzimuthAngle = 1.35;
  controls.minPolarAngle = 0.35;
  controls.update();

  var hemi = new THREE.HemisphereLight(0xcfe0f2, 0x8a6a48, 1.3);
  scene.add(hemi);

  var key = new THREE.DirectionalLight(0xffe6c2, 2.2);
  key.position.set(4.5, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 26;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 4;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xcfe0ff, 1.0);
  rim.position.set(-5, 4, -5);
  scene.add(rim);

  var fill = new THREE.PointLight(0xe8a33d, 0.5, 10, 2);
  fill.position.set(-1.5, 1.8, 2.2);
  scene.add(fill);

  var lampGlow = new THREE.PointLight(0xffd9a0, 5, 10, 2);
  lampGlow.position.set(-1.7, 2.6, -2.2);
  scene.add(lampGlow);

  function canvasTexture(draw, w, h, repeatX, repeatY){
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    draw(ctx, w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    if(repeatX || repeatY){
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX||1, repeatY||1);
    }
    return tex;
  }

  var deskTex = canvasTexture(function(ctx,w,h){
    ctx.fillStyle = '#5a3b26';
    ctx.fillRect(0,0,w,h);
    for(var i=0;i<70;i++){
      var y = Math.random()*h;
      ctx.strokeStyle = 'rgba(30,16,8,' + (0.05+Math.random()*0.12) + ')';
      ctx.lineWidth = 1 + Math.random()*2;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y*0.1)*6);
      for(var x=0;x<w;x+=40){
        ctx.lineTo(x, y + Math.sin((x+y)*0.02)*10);
      }
      ctx.stroke();
    }
  }, 512, 512, 3, 2);

  var deskMat = new THREE.MeshStandardMaterial({
    map: deskTex, roughness:0.55, metalness:0.05
  });

  var FLOOR_Y = -7.5, CEIL_Y = 17.5, WALL_Z = -4.5, ROOM_X = 12, ROOM_FRONT = 14;
  var ROOM_H = CEIL_Y - FLOOR_Y;
  var ROOM_MID_Y = (FLOOR_Y + CEIL_Y) / 2;
  var ROOM_D = ROOM_FRONT - WALL_Z;
  var ROOM_MID_Z = (ROOM_FRONT + WALL_Z) / 2;

  var wallTex = new THREE.TextureLoader().load(window.wallTextureUrl);
  wallTex.encoding = THREE.sRGBEncoding;
  wallTex.wrapS = THREE.ClampToEdgeWrapping;
  wallTex.wrapT = THREE.ClampToEdgeWrapping;
  var wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness:0.95, metalness:0 });

  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_X*2, ROOM_H), wallMat);
  backWall.position.set(0, ROOM_MID_Y, WALL_Z);
  backWall.receiveShadow = true;
  scene.add(backWall);

  var leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
  leftWall.rotation.y = Math.PI/2;
  leftWall.position.set(-ROOM_X, ROOM_MID_Y, ROOM_MID_Z);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  var rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
  rightWall.rotation.y = -Math.PI/2;
  rightWall.position.set(ROOM_X, ROOM_MID_Y, ROOM_MID_Z);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  var ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_X*2, ROOM_D),
    new THREE.MeshStandardMaterial({ color:0xf1e8d8, roughness:1 })
  );
  ceiling.rotation.x = Math.PI/2;
  ceiling.position.set(0, CEIL_Y, ROOM_MID_Z);
  scene.add(ceiling);

  var baseboardMat = new THREE.MeshStandardMaterial({ color:0xf3ecdf, roughness:0.6 });
  var bbBack = new THREE.Mesh(new THREE.BoxGeometry(ROOM_X*2, 0.6, 0.15), baseboardMat);
  bbBack.position.set(0, FLOOR_Y + 0.3, WALL_Z + 0.075);
  scene.add(bbBack);
  var bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, ROOM_D), baseboardMat);
  bbLeft.position.set(-ROOM_X + 0.075, FLOOR_Y + 0.3, ROOM_MID_Z);
  scene.add(bbLeft);
  var bbRight = bbLeft.clone();
  bbRight.position.x = ROOM_X - 0.075;
  scene.add(bbRight);

  var floorTex = canvasTexture(function(ctx,w,h){
    var rows = 8, ph = h / rows;
    for(var r=0;r<rows;r++){
      var x = -Math.random()*w*0.5;
      while(x < w){
        var pw = w*0.45 + Math.random()*w*0.3;
        var l = 62 + Math.random()*8;
        ctx.fillStyle = 'hsl(30,' + (34 + Math.random()*8) + '%,' + l + '%)';
        ctx.fillRect(x, r*ph, pw, ph);
        ctx.strokeStyle = 'rgba(70,45,25,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, r*ph, pw, ph);
        for(var g=0;g<5;g++){
          ctx.strokeStyle = 'rgba(90,60,35,' + (0.05 + Math.random()*0.08) + ')';
          ctx.lineWidth = 1;
          var gy = r*ph + Math.random()*ph;
          ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + pw, gy + (Math.random()-0.5)*4); ctx.stroke();
        }
        x += pw;
      }
    }
  }, 512, 512, 4, 3);
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_X*2, ROOM_D),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness:0.7, metalness:0 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0, FLOOR_Y, ROOM_MID_Z);
  floor.receiveShadow = true;
  scene.add(floor);

  var rugTex = canvasTexture(function(ctx,w,h){
    ctx.fillStyle = '#8b4a38';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#efe2c8'; ctx.lineWidth = 10;
    ctx.strokeRect(22,22,w-44,h-44);
    ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 4;
    ctx.strokeRect(44,44,w-88,h-88);
    ctx.fillStyle = 'rgba(239,226,200,0.35)';
    for(var x=90; x<w-70; x+=56){
      for(var y=90; y<h-70; y+=56){
        ctx.beginPath();
        ctx.moveTo(x, y-14); ctx.lineTo(x+14, y); ctx.lineTo(x, y+14); ctx.lineTo(x-14, y);
        ctx.closePath(); ctx.fill();
      }
    }
  }, 512, 360);
  var rug = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness:1 })
  );
  rug.rotation.x = -Math.PI/2;
  rug.position.set(0.5, FLOOR_Y + 0.01, 0.6);
  rug.receiveShadow = true;
  scene.add(rug);

  var tapeMat = new THREE.MeshStandardMaterial({
    color:0xe9dfc6, roughness:0.7, transparent:true, opacity:0.75
  });

  var textureLoader = new THREE.TextureLoader();

  var TARGET_PAPER_URL = window.targetPaperUrl || '';
  var specialPaper = null;
  var wallPapers = [];

  function addWallPaper(x, y, wRot, pw, ph, url, fitMode){
    var paper = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness:0.92 }));
    paper.position.set(x, y, WALL_Z + 0.03);
    paper.rotation.z = wRot;
    paper.castShadow = true;
    paper.receiveShadow = true;
    scene.add(paper);

    textureLoader.load(url, function(tex){
      tex.encoding = THREE.sRGBEncoding;
      if(fitMode === 'contain'){
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      }
      paper.material = new THREE.MeshStandardMaterial({ map: tex, roughness:0.5 });
      paper.material.needsUpdate = true;
    });

    var tape = new THREE.Mesh(new THREE.PlaneGeometry(pw*0.32, ph*0.08), tapeMat);
    tape.position.set(x, y + ph/2 - ph*0.02, WALL_Z + 0.032);
    tape.rotation.z = wRot + (Math.random()-0.5)*0.3;
    scene.add(tape);

    wallPapers.push({ mesh: paper, tape: tape, x: x, y: y, rot: wRot, pw: pw, ph: ph });

    if(url === TARGET_PAPER_URL){
      specialPaper = paper;
    }
  }

  var paperConfigs = window.paperImages || [];

  paperConfigs.forEach(function(cfg){
    addWallPaper(cfg.x, cfg.y, cfg.rot, cfg.w, cfg.h, cfg.url, cfg.fit);
  });

  var deskTop = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 7.2), deskMat);
  deskTop.position.set(0.5, -0.15, 0);
  deskTop.castShadow = true; deskTop.receiveShadow = true;
  scene.add(deskTop);

  var deskFrameMat = new THREE.MeshStandardMaterial({ color:0x3f2817, roughness:0.7 });
  var apron = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.7, 6.4), deskFrameMat);
  apron.position.set(0.5, -0.65, 0);
  apron.castShadow = true; apron.receiveShadow = true;
  scene.add(apron);

  [[-4.5, -3.0], [-4.5, 3.0], [5.5, -3.0], [5.5, 3.0]].forEach(function(p){
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.2, 0.45), deskFrameMat);
    leg.position.set(p[0], -3.9, p[1]);
    leg.castShadow = true; leg.receiveShadow = true;
    scene.add(leg);
  });

  var lamp = new THREE.Group();
  var lampMetal = new THREE.MeshStandardMaterial({ color:0x2b2b2b, metalness:0.6, roughness:0.4 });
  var lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 24), lampMetal);
  lampBase.position.y = 0.05;
  lampBase.castShadow = true; lampBase.receiveShadow = true;
  lamp.add(lampBase);

  var arm1 = new THREE.Group();
  arm1.position.y = 0.1;
  arm1.rotation.z = -0.25;
  var arm1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8), lampMetal);
  arm1Mesh.position.y = 1.05;
  arm1Mesh.castShadow = true;
  arm1.add(arm1Mesh);

  var joint = new THREE.Group();
  joint.position.y = 2.1;
  var jointBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), lampMetal);
  joint.add(jointBall);
  var arm2 = new THREE.Group();
  arm2.rotation.z = -0.85;
  var arm2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), lampMetal);
  arm2Mesh.position.y = 0.85;
  arm2Mesh.castShadow = true;
  arm2.add(arm2Mesh);

  var head = new THREE.Group();
  head.position.y = 1.7;
  var shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.48, 0.65, 24, 1, true),
    new THREE.MeshStandardMaterial({ color:0x2f5b4c, roughness:0.5, metalness:0.2, side:THREE.DoubleSide })
  );
  shade.rotation.z = 0.9;
  shade.position.y = -0.1;
  shade.castShadow = true;
  head.add(shade);
  var bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshBasicMaterial({ color:0xfff0c4 })
  );
  bulb.position.set(0.02, -0.2, 0);
  head.add(bulb);

  arm2.add(head);
  joint.add(arm2);
  arm1.add(joint);
  lamp.add(arm1);

  lamp.position.set(-3.6, 0, -2.4);
  scene.add(lamp);

  var penCup = new THREE.Group();
  var cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.22, 0.6, 20),
    new THREE.MeshStandardMaterial({ color:0xb5533c, roughness:0.6 })
  );
  cup.position.y = 0.3;
  cup.castShadow = true; cup.receiveShadow = true;
  penCup.add(cup);
  [[0xe8a33d, -0.08, 0.05, 0.25], [0x35506b, 0.06, -0.04, -0.2], [0x2f5b4c, 0.02, 0.09, 0.1], [0xd8869a, -0.05, -0.08, -0.32]].forEach(function(p){
    var pn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.95, 6),
      new THREE.MeshStandardMaterial({ color:p[0], roughness:0.6 })
    );
    pn.position.set(p[1], 0.75, p[2]);
    pn.rotation.z = p[3];
    pn.castShadow = true;
    penCup.add(pn);
  });
  penCup.position.set(-2.5, 0, -2.85);
  scene.add(penCup);

  var bookStack = new THREE.Group();
  [[0x35506b, 0, 0.0], [0xb5533c, 0.05, 0.08], [0xe8a33d, -0.04, -0.06]].forEach(function(b, i){
    var bk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.22, 1.05),
      new THREE.MeshStandardMaterial({ color:b[0], roughness:0.8 })
    );
    bk.position.set(b[1], 0.11 + i*0.22, 0);
    bk.rotation.y = b[2];
    bk.castShadow = true; bk.receiveShadow = true;
    bookStack.add(bk);
  });
  bookStack.position.set(4.9, 0, -2.5);
  bookStack.rotation.y = 0.15;
  scene.add(bookStack);

  var notebook = new THREE.Group();
  var NB_W = 1.55, NB_D = 2.05, NB_H = 0.09;

  var backCoverMat = new THREE.MeshStandardMaterial({ color:0x2f5b4c, roughness:0.85 });
  var backCover = new THREE.Mesh(new THREE.BoxGeometry(NB_W, NB_H*0.35, NB_D), backCoverMat);
  backCover.position.y = NB_H*0.175;
  backCover.castShadow = true; backCover.receiveShadow = true;
  notebook.add(backCover);

  var pagesMat = new THREE.MeshStandardMaterial({ color:0xf4ecd8, roughness:0.95 });
  var pages = new THREE.Mesh(new THREE.BoxGeometry(NB_W*0.985, NB_H*0.42, NB_D*0.99), pagesMat);
  pages.position.y = NB_H*0.35 + NB_H*0.21;
  pages.castShadow = true; pages.receiveShadow = true;
  notebook.add(pages);

  var topPageTex = canvasTexture(function(ctx,w,h){
    ctx.fillStyle = '#fbf6ea';
    ctx.fillRect(0,0,w,h);
  }, 512, 700);

  var topPageMat = new THREE.MeshStandardMaterial({ map: topPageTex, roughness:0.9 });
  var topPage = new THREE.Mesh(new THREE.BoxGeometry(NB_W*0.98, 0.006, NB_D*0.98), topPageMat);
  topPage.position.y = pages.position.y + NB_H*0.21 + 0.004;
  topPage.receiveShadow = true;
  notebook.add(topPage);

  var PAGE_COUNT = 7;
  var PAGE_THICKNESS = 0.0018;
  var PAGE_W = NB_W * 0.98;
  var PAGE_D = NB_D * 0.98;
  var pageStackBaseY = topPage.position.y + 0.006;

  var lastPageTex = new THREE.TextureLoader().load(window.lastPageImageUrl);
  lastPageTex.encoding = THREE.sRGBEncoding;
  lastPageTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  var lastPageMat = new THREE.MeshStandardMaterial({ map: lastPageTex, roughness:0.9 });

  var coverMat = new THREE.MeshStandardMaterial({ map: topPageTex, roughness:0.9 });

  var secondPageMat = new THREE.MeshStandardMaterial({ map: topPageTex, roughness:0.9 });

  var notebookPages = [];
  var currentPageIndex = 0;
  var pageFlipAnimating = false;

  for(var pIdx=0; pIdx<PAGE_COUNT; pIdx++){
    var pivot = new THREE.Group();
    var unflippedY = pageStackBaseY + (PAGE_COUNT - 1 - pIdx) * PAGE_THICKNESS;
    var flippedY   = pageStackBaseY + pIdx * PAGE_THICKNESS;
    pivot.position.set(-NB_W/2, unflippedY, 0);
    pivot.rotation.z = 0;
    pivot.userData.unflippedY = unflippedY;
    pivot.userData.flippedY = flippedY;
    pivot.userData.flipped = false;

    var leafMat = (pIdx === PAGE_COUNT - 1) ? lastPageMat
                : (pIdx === 0 ? [topPageMat, topPageMat, coverMat, topPageMat, topPageMat, topPageMat]
                : (pIdx === 1 ? [topPageMat, topPageMat, secondPageMat, topPageMat, topPageMat, topPageMat] : topPageMat));
    var leaf = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_W, 0.004, PAGE_D),
      leafMat
    );
    leaf.position.x = PAGE_W / 2;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    pivot.add(leaf);

    notebook.add(pivot);
    notebookPages.push(pivot);
  }

  function animateNotebookPage(pivot, fromRot, toRot, fromY, toY, onDone, duration){
    pageFlipAnimating = true;
    var start = null;
    var dur = duration || 480;
    function step(ts){
      if(start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
      pivot.rotation.z = fromRot + (toRot - fromRot) * e;
      pivot.position.y = fromY + (toY - fromY) * e + Math.sin(t * Math.PI) * 0.028;
      if(t < 1){
        requestAnimationFrame(step);
      } else {
        pivot.rotation.z = toRot;
        pivot.position.y = toY;
        pageFlipAnimating = false;
        if(onDone) onDone();
      }
    }
    requestAnimationFrame(step);
  }

  function flipNotebookPage(direction, duration, after){
    if(pageFlipAnimating) return;
    if(direction > 0){
      if(currentPageIndex >= PAGE_COUNT) return;
      var pivotFwd = notebookPages[currentPageIndex];
      animateNotebookPage(pivotFwd, 0, Math.PI, pivotFwd.userData.unflippedY, pivotFwd.userData.flippedY, function(){
        pivotFwd.userData.flipped = true;
        currentPageIndex++;
        if(after) after();
      }, duration);
    } else {
      if(currentPageIndex <= 0) return;
      var pivotBack = notebookPages[currentPageIndex - 1];
      animateNotebookPage(pivotBack, Math.PI, 0, pivotBack.userData.flippedY, pivotBack.userData.unflippedY, function(){
        pivotBack.userData.flipped = false;
        currentPageIndex--;
        if(after) after();
      }, duration);
    }
  }

  function autoFlipPages(targetIndex, delay, onDone){
    if(currentPageIndex >= targetIndex){
      if(onDone) onDone();
      return;
    }
    if(pageFlipAnimating){
      setTimeout(function(){ autoFlipPages(targetIndex, delay, onDone); }, 50);
      return;
    }
    flipNotebookPage(1);
    setTimeout(function(){ autoFlipPages(targetIndex, delay, onDone); }, delay);
  }

  function autoCloseNotebook(flipMs, onDone){
    if(!notebookOpenDone || pageFlipAnimating){
      setTimeout(function(){ autoCloseNotebook(flipMs, onDone); }, 50);
      return;
    }
    if(currentPageIndex <= 0){
      if(onDone) onDone();
      return;
    }
    flipNotebookPage(-1, flipMs, function(){
      autoCloseNotebook(flipMs, onDone);
    });
  }

  var spiralMat = new THREE.MeshStandardMaterial({ color:0xb9bcbf, metalness:0.85, roughness:0.3 });
  var coilCount = 22;
  var totalNBHeight = NB_H*0.35 + NB_H*0.42 + 0.02;
  for(var i=0;i<coilCount;i++){
    var t = (i/(coilCount-1)) - 0.5;
    var coil = new THREE.Mesh(
      new THREE.TorusGeometry(totalNBHeight*0.62, 0.014, 8, 16, Math.PI*1.5),
      spiralMat
    );
    coil.rotation.y = Math.PI/2;
    coil.rotation.z = Math.PI*0.22;
    coil.position.set(-NB_W/2 - 0.01, totalNBHeight*0.5, t * NB_D * 0.94);
    coil.castShadow = true;
    notebook.add(coil);
  }

  notebook.position.set(-1.35, 0.0, 0.42);
  notebook.rotation.y = 0.12;
  scene.add(notebook);

  var pencil = new THREE.Group();
  var PEN_LEN = 1.5;

  var woodMat = new THREE.MeshStandardMaterial({ color:0xd9a441, roughness:0.55 });
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, PEN_LEN*0.82, 6), woodMat);
  body.rotation.z = Math.PI/2;
  body.position.x = -PEN_LEN*0.09;
  body.castShadow = true;
  pencil.add(body);

  var tipWoodMat = new THREE.MeshStandardMaterial({ color:0xf0d9ad, roughness:0.6 });
  var tipWood = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.006, PEN_LEN*0.11, 6), tipWoodMat);
  tipWood.rotation.z = -Math.PI/2;
  tipWood.position.x = PEN_LEN*0.365;
  tipWood.castShadow = true;
  pencil.add(tipWood);

  var graphiteMat = new THREE.MeshStandardMaterial({ color:0x2b2b2b, roughness:0.4 });
  var tipGraphite = new THREE.Mesh(new THREE.ConeGeometry(0.006, PEN_LEN*0.045, 6), graphiteMat);
  tipGraphite.rotation.z = -Math.PI/2;
  tipGraphite.position.x = PEN_LEN*0.445;
  tipGraphite.castShadow = true;
  pencil.add(tipGraphite);

  var eraserMat = new THREE.MeshStandardMaterial({ color:0xd8869a, roughness:0.7 });
  var eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, PEN_LEN*0.055, 10), eraserMat);
  eraser.rotation.z = Math.PI/2;
  eraser.position.x = -PEN_LEN*0.53;
  eraser.castShadow = true;
  pencil.add(eraser);

  var ferruleMat = new THREE.MeshStandardMaterial({ color:0xc7c9cc, metalness:0.8, roughness:0.3 });
  var ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, PEN_LEN*0.06, 10), ferruleMat);
  ferrule.rotation.z = Math.PI/2;
  ferrule.position.x = -PEN_LEN*0.47;
  ferrule.castShadow = true;
  pencil.add(ferrule);

  pencil.rotation.y = notebook.rotation.y + Math.PI/2;
  pencil.position.set(notebook.position.x + NB_W/2 + 0.28, 0.03, notebook.position.z + 0.14);
  scene.add(pencil);

  var tablet = new THREE.Group();
  var TB_W = 4.1, TB_D = 5.3;

  tablet.position.set(2.55, 0.06, 0.08);
  tablet.rotation.y = -0.14;
  scene.add(tablet);

  var tabletIntro = null;
  var tabletModel = null;
  var screenTexture = null;
  var screenGroup = null;
  var currentScreenPanel = null;

  var screenWidthFactor = 1.00;
  var screenHeightFactor = 1.09;
  var screenOffsetX = 0.04;
  var screenOffsetY = 0.03;
  var screenOffsetZ = 0.07;

  var assetsReady = false;
  var keyReady = false;
  var revealStarted = false;
  var techScreenShown = false;
  var paperApproachDone = false;
  var tabletApproachTriggered = false;
  var tabletApproachDone = false;
  var diffStageTriggered = false;
  var notebookApproachDone = false;
  var returnToTabletTriggered = false;
  var tabletReturnDone = false;
  var finalNotebookTriggered = false;
  var notebookOpenDone = false;
  var notebookClosed = false;
  var FINAL_COVER_HOLD_MS = 1500;
  var FINAL_FLOR_WAIT_MS = 3000;
  var FINAL_IMAGE_TIMEOUT_MS = 8000;
  var finalState = { atHome:false, launched:false };
  var finalPageShown = false;
  var phoneStageTriggered = false;
  var phoneApproachDone = false;
  var phoneScreenDone = false;
  var phoneHoldTriggered = false;
  var phoneHoldDone = false;
  var phoneGalleryDone = false;
  var phoneHomeDone = false;
  var phonePinterestDone = false;
  var phonePinterestImg1Done = false;
  var phoneScrollTriggered = false;
  var phoneScrollDone = false;
  var phoneCrashTriggered = false;

  var finalImages = [
    { name:'portada',       url:function(){ return window.notebookCoverImageUrl; }, mat:coverMat,      gate:true,  tex:null, requested:false, settled:false, applied:false },
    { name:'segunda hoja',  url:function(){ return window.notebookPageImageUrl; },  mat:secondPageMat, gate:false, tex:null, requested:false, settled:false, applied:false }
  ];

  function markAssetsReady(){
    if(assetsReady) return;
    assetsReady = true;
    tryReveal();
  }

  function tryReveal(){
    if(revealStarted || !assetsReady || !keyReady) return;
    revealStarted = true;
    var loader = document.getElementById('loading');
    loader.classList.add('open');
    setTimeout(function(){
      loader.style.opacity = '0';
      setTimeout(function(){ loader.style.display = 'none'; }, 650);
    }, 1000);
  }

  window.addEventListener('keydown', function(e){
    var isSpace = e.code === 'Space' || e.keyCode === 32;
    var isRight = e.code === 'ArrowRight' || e.keyCode === 39;

    if(!revealStarted){
      if(isSpace || isRight){
        e.preventDefault();
        keyReady = true;
        tryReveal();
      }
      return;
    }

    if(!techScreenShown){
      if(isSpace || isRight){
        e.preventDefault();
        techScreenShown = true;
        document.getElementById('techScreen').classList.add('show');
        setTimeout(function(){
          document.getElementById('techScreen').classList.remove('show');
          startPaperApproach();
        }, 3500);
      }
      return;
    }

    if(!tabletApproachTriggered){
      if(!paperApproachDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        tabletApproachTriggered = true;
        startTabletApproach(window.tabletApproachScreenImage, function(){
          preloadFinalImages();
        });
      }
      return;
    }

    if(!diffStageTriggered){
      if(!tabletApproachDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        diffStageTriggered = true;
        showFinalDiffScreen();
      }
      return;
    }

    if(!returnToTabletTriggered){
      if(!notebookApproachDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        returnToTabletTriggered = true;
        startTabletApproach(window.tabletReturnScreenImage, function(){
          tabletReturnDone = true;
          preloadFinalImages();
          autoCloseNotebook(60, function(){
            notebookClosed = true;
            applyFinalImages();
            tryLaunchFinalNotebook();
          });
        });
      }
      return;
    }

    if(!finalNotebookTriggered){
      if(!tabletReturnDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        finalNotebookTriggered = true;
        startFinalNotebookCinematic();
      }
      return;
    }

    if(!phoneStageTriggered){
      if(!finalPageShown) return;
      if(isSpace || isRight){
        e.preventDefault();
        phoneStageTriggered = true;
        startPhoneCinematic();
      }
      return;
    }

    if(!phoneHoldTriggered){
      if(!phoneScreenDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        phoneHoldTriggered = true;
        startPhoneHoldCinematic();
      }
      return;
    }

    if(!phoneScrollTriggered){
      if(!phonePinterestImg1Done) return;
      if(isSpace || isRight){
        e.preventDefault();
        phoneScrollTriggered = true;
        startPhonePinterestScroll();
      }
      return;
    }

    if(!phoneCrashTriggered){
      if(!phoneScrollDone) return;
      if(isSpace || isRight){
        e.preventDefault();
        phoneCrashTriggered = true;
        startPhoneCrashCinematic();
      }
      return;
    }

    if(!artExpelTriggered){
      if(!spaceArtReady) return;
      if(isSpace || isRight){
        e.preventDefault();
        artExpelTriggered = true;
        expelSpaceObjects(spawnSpaceObjects2, SPACE_ART_SWAP_DELAY_MS);
      }
      return;
    }

    if(!artExpel2Triggered){
      if(!spaceArtReady2) return;
      if(isSpace || isRight){
        e.preventDefault();
        artExpel2Triggered = true;
        expelSpaceObjects(startWakeSequence, 0);
      }
      return;
    }
  });

  var camAnim = null;

  function animateCameraTo(targetPos, targetLookAt, duration, onDone, ease){
    controls.enabled = false;
    camAnim = {
      t: 0,
      duration: duration,
      fromPos: camera.position.clone(),
      toPos: targetPos,
      fromTarget: controls.target.clone(),
      toTarget: targetLookAt,
      onDone: onDone,
      ease: ease
    };
  }

  function startPaperApproach(){
    if(!specialPaper) return;

    var p = specialPaper.position;
    var toTarget = new THREE.Vector3(p.x, p.y, p.z);
    var toPos = new THREE.Vector3(p.x, p.y, p.z + 1.8);

    animateCameraTo(toPos, toTarget, 2.4, function(){
      paperApproachDone = true;
    });
  }

  function changeScreenImage(url){
    new THREE.TextureLoader().load(url, function(tex){
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
      screenTexture = tex;
      buildScreenImage();
    });
  }

  function startTabletApproach(screenImageUrl, onArrive){
    var toPos = new THREE.Vector3(1.812, 1.840, 2.588);
    var toTarget = new THREE.Vector3(2.177, 0.910, 0.180);

    animateCameraTo(toPos, toTarget, 2.2, function(){
      tabletApproachDone = true;
      if(onArrive) onArrive();
    });

    changeScreenImage(screenImageUrl || window.tabletApproachScreenImage);
  }

  function showFinalDiffScreen(){
    document.getElementById('techScreenImg').src = window.diffScreenImage;
    document.getElementById('techScreen').classList.add('show');

    var homePos = new THREE.Vector3(0.16, 1.96, 8.96);
    var homeTarget = new THREE.Vector3(0.16, 1.67, -0.06);
    animateCameraTo(homePos, homeTarget, 2.2, null);

    setTimeout(function(){
      document.getElementById('techScreen').classList.remove('show');
      startNotebookApproach();
    }, 3500);
  }

  function startNotebookApproach(){
    var toPos = new THREE.Vector3(-1.367, 2.483, 1.438);
    var toTarget = new THREE.Vector3(-1.381, 2.144, 1.315);

    controls.minDistance = 0.05;
    controls.maxDistance = 100;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;

    animateCameraTo(toPos, toTarget, 2.2, function(){
      notebookApproachDone = true;
      autoFlipPages(6, 600, function(){ notebookOpenDone = true; });
    });
  }

  function applyFinalImages(){
    if(!notebookClosed) return;
    finalImages.forEach(function(it){
      if(it.applied || !it.tex) return;
      it.applied = true;
      it.mat.map = it.tex;
      it.mat.needsUpdate = true;
    });
  }

  function finalImagesReady(){
    return finalImages.every(function(it){ return !it.gate || it.settled; });
  }

  function tryLaunchFinalNotebook(){
    if(finalState.launched || !finalState.atHome || !finalImagesReady() || !notebookClosed) return;
    finalState.launched = true;
    console.info('[cinemática final] la cámara vuelve al cuaderno');

    applyFinalImages();

    animateCameraTo(
      new THREE.Vector3(-1.367, 2.483, 1.438),
      new THREE.Vector3(-1.381, 2.144, 1.315),
      2.2,
      function(){
        setTimeout(passFinalPage, FINAL_COVER_HOLD_MS);
      }
    );
  }

  var finalPageWaited = 0;
  function passFinalPage(){
    if(pageFlipAnimating){
      setTimeout(passFinalPage, 100);
      return;
    }
    if(!finalImages[1].settled && finalPageWaited < FINAL_FLOR_WAIT_MS){
      finalPageWaited += 100;
      setTimeout(passFinalPage, 100);
      return;
    }
    flipNotebookPage(1, undefined, function(){
      finalPageShown = true;
      console.info('[cinemática final] la hoja de la flor está a la vista; espacio o → para que salga el celular');
    });
  }

  function preloadFinalImages(){
    finalImages.forEach(function(it){
      if(it.requested) return;
      it.requested = true;

      function settle(){
        if(it.settled) return;
        it.settled = true;
        tryLaunchFinalNotebook();
      }

      var url = it.url();
      if(!url){
        console.warn('Falta la URL de la imagen "' + it.name + '" en imagen.js; se mantiene la hoja actual');
        settle();
        return;
      }

      setTimeout(function(){
        if(!it.settled){
          console.warn('La imagen "' + it.name + '" tarda demasiado; la cinemática sigue sin esperarla');
          settle();
        }
      }, FINAL_IMAGE_TIMEOUT_MS);

      try{
        textureLoader.load(
          url,
          function(tex){
            try{
              tex.encoding = THREE.sRGBEncoding;
              tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
              try{
                if(renderer.initTexture) renderer.initTexture(tex);
              } catch(e){ console.warn('initTexture falló (no es grave):', e); }
              it.tex = tex;
              console.info('[cinemática final] imagen lista: ' + it.name);
            } catch(err){
              console.error('Error al preparar la imagen "' + it.name + '":', err);
            } finally {
              it.settled = true;
              applyFinalImages();
              tryLaunchFinalNotebook();
            }
          },
          undefined,
          function(err){
            console.error('No se pudo cargar la imagen "' + it.name + '":', err);
            settle();
          }
        );
      } catch(err){
        console.error('Error al pedir la imagen "' + it.name + '":', err);
        settle();
      }
    });
  }

  function startFinalNotebookCinematic(){
    console.info('[cinemática final] la cámara vuelve al inicio');

    animateCameraTo(
      new THREE.Vector3(0.16, 1.96, 8.96),
      new THREE.Vector3(0.16, 1.67, -0.06),
      2.2,
      function(){
        finalState.atHome = true;
        tryLaunchFinalNotebook();
      }
    );

    preloadFinalImages();
  }

  setTimeout(markAssetsReady, 9000);

  function onTabletLoaded(gltf){
    var model = gltf.scene;

    model.traverse(function(node){
      if(node.isMesh){
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    var box = new THREE.Box3().setFromObject(model);
    var size = new THREE.Vector3();
    box.getSize(size);
    var scale = Math.min(TB_W / size.x, TB_D / size.z);
    model.scale.setScalar(scale);

    box.setFromObject(model);
    var center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    tablet.add(model);
    tabletModel = model;
    buildScreenImage();

    tablet.position.y = 0.4;
    tabletIntro = { t: 0 };
  }

  function onTabletError(err){
    console.error('No se pudo cargar el modelo de la tableta gráfica:', err);
  }

  gltfLoader.load('tablet.draco.glb', onTabletLoaded, undefined, onTabletError);

  new THREE.TextureLoader().load(
    window.screenImage,
    function(tex){
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
      tex.offset.x = 1;
      screenTexture = tex;
      buildScreenImage();
    },
    undefined,
    function(err){
      console.error('No se pudo cargar la imagen de la pantalla:', err);
    }
  );

  function findScreenMesh(model){
    var result = null;
    model.traverse(function(node){
      if(!node.isMesh) return;
      var name = (node.name || '').toLowerCase();
      if(/screen|display|pantalla|lcd|glass|cristal/i.test(name)){
        result = node;
      }
    });
    return result;
  }

  function buildScreenImage(){
    if(!tabletModel || !screenTexture) return;

    if(screenGroup){
      tablet.remove(screenGroup);
      screenGroup = null;
    }

    var prevRotY = tablet.rotation.y;
    var prevPos  = tablet.position.clone();
    tablet.rotation.y = 0;
    tablet.position.set(0, 0, 0);
    tablet.updateMatrixWorld(true);

    var screenMesh = findScreenMesh(tabletModel);
    if(!screenMesh){
      tablet.rotation.y = prevRotY;
      tablet.position.copy(prevPos);
      markAssetsReady();
      return;
    }

    screenMesh.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(screenMesh);
    var size = new THREE.Vector3();
    box.getSize(size);

    var worldPos = new THREE.Vector3();
    screenMesh.getWorldPosition(worldPos);
    var worldQuat = new THREE.Quaternion();
    screenMesh.getWorldQuaternion(worldQuat);
    var normal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuat).normalize();

    var panelW = size.x * screenWidthFactor;
    var panelH = size.y * screenHeightFactor;

    screenGroup = new THREE.Group();
    var panel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, panelH),
      new THREE.MeshBasicMaterial({
        map: screenTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false
      })
    );

    panel.quaternion.copy(worldQuat);
    var posOffset = new THREE.Vector3(screenOffsetX, screenOffsetY, screenOffsetZ);
    panel.position.copy(worldPos).add(normal.clone().multiplyScalar(0.002 + screenOffsetZ)).add(posOffset);
    panel.renderOrder = 11;
    screenGroup.add(panel);
    currentScreenPanel = panel;

    tablet.add(screenGroup);

    tablet.rotation.y = prevRotY;
    tablet.position.copy(prevPos);
    tablet.updateMatrixWorld(true);

    markAssetsReady();
  }

  var mug = new THREE.Group();
  var mugMat = new THREE.MeshStandardMaterial({
    color:0xf8f5f0, roughness:0.3, metalness:0.03, side: THREE.DoubleSide
  });

  var CUP_H      = 0.26;
  var CUP_IN_R   = 0.129;
  var CUP_FLOOR  = 0.022;

  var cupProfile = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.112, 0.000),
    new THREE.Vector2(0.121, 0.010),
    new THREE.Vector2(0.126, 0.055),
    new THREE.Vector2(0.135, 0.150),
    new THREE.Vector2(0.143, CUP_H - 0.02),
    new THREE.Vector2(0.145, CUP_H - 0.004),
    new THREE.Vector2(0.1415, CUP_H),
    new THREE.Vector2(0.1355, CUP_H - 0.004),
    new THREE.Vector2(CUP_IN_R, CUP_H - 0.02),
    new THREE.Vector2(0.120, 0.150),
    new THREE.Vector2(0.109, 0.045),
    new THREE.Vector2(0.100, CUP_FLOOR),
    new THREE.Vector2(0.000, CUP_FLOOR)
  ];

  var cup = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 48), mugMat);
  cup.castShadow = true;
  cup.receiveShadow = true;
  mug.add(cup);

  var COFFEE_TOP = CUP_H - 0.045;
  var coffeeMat = new THREE.MeshStandardMaterial({
    color:0x3b1f12, roughness:0.18, metalness:0.05
  });
  var coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1235, 0.104, COFFEE_TOP - CUP_FLOOR, 48),
    coffeeMat
  );
  coffee.position.y = (COFFEE_TOP + CUP_FLOOR) / 2;
  mug.add(coffee);

  var cremaMat = new THREE.MeshStandardMaterial({ color:0x9c6b3f, roughness:0.55 });
  var crema = new THREE.Mesh(
    new THREE.TorusGeometry(0.1165, 0.008, 8, 48),
    cremaMat
  );
  crema.rotation.x = Math.PI / 2;
  crema.position.y = COFFEE_TOP - 0.002;
  mug.add(crema);

  var handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.072, 0.016, 10, 40, Math.PI * 1.25),
    mugMat
  );
  handle.position.set(0.145, CUP_H * 0.52, 0);
  handle.rotation.set(0, 0, -Math.PI * 0.625);
  handle.castShadow = true;
  mug.add(handle);

  var SAUCER_TOP = 0.024;
  cup.position.y = SAUCER_TOP;
  coffee.position.y += SAUCER_TOP;
  crema.position.y += SAUCER_TOP;
  handle.position.y += SAUCER_TOP;

  var saucerMat = new THREE.MeshStandardMaterial({ color:0xefe7d6, roughness:0.6, metalness:0.03, side: THREE.DoubleSide });
  var saucerProfile = [
    new THREE.Vector2(0.000, 0.000),
    new THREE.Vector2(0.150, 0.000),
    new THREE.Vector2(0.215, 0.006),
    new THREE.Vector2(0.235, 0.020),
    new THREE.Vector2(0.238, SAUCER_TOP),
    new THREE.Vector2(0.225, SAUCER_TOP),
    new THREE.Vector2(0.185, 0.013),
    new THREE.Vector2(0.000, 0.013)
  ];
  var saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerProfile, 48), saucerMat);
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  mug.add(saucer);

  mug.scale.setScalar(2.4);
  mug.position.set(-3.2, 0, 2.15);
  scene.add(mug);

  function addSoftShadowBlob(x, z, rx, rz, opacity){
    var tex = canvasTexture(function(ctx,w,h){
      var g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
      g.addColorStop(0, 'rgba(0,0,0,' + opacity + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);
    }, 128, 128);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true, depthWrite:false });
    var blob = new THREE.Mesh(new THREE.PlaneGeometry(rx, rz), mat);
    blob.rotation.x = -Math.PI/2;
    blob.position.set(x, 0.002, z);
    scene.add(blob);
    return blob;
  }
  addSoftShadowBlob(notebook.position.x, notebook.position.z, 2.4, 2.9, 0.35);
  addSoftShadowBlob(tablet.position.x, tablet.position.z, 4.9, 5.8, 0.35);
  addSoftShadowBlob(mug.position.x, mug.position.z, 1.7, 1.7, 0.32);

  var PHONE_SCALE = 1.1;
  var PHONE_REST_X = -0.55, PHONE_REST_Z = 2.45, PHONE_REST_ROT = 0.2;
  var PHONE_DROP = 1.2;
  var PHONE_SPIN = 0.9;
  var PHONE_INTRO_SECONDS = 0.25;
  var PHONE_SCREEN_TIMING = { blackMs:1000, fadeInMs:300, lockMs:500, openMs:300, slideMs:450 };
  var PHONE_CAM_POS    = new THREE.Vector3(-0.58, 2.90, 3.60);
  var PHONE_CAM_TARGET = new THREE.Vector3(-0.55, 0.05, 2.40);

  var phone = null, phoneBlob = null, phoneIntro = null, phoneRestY = 0;
  var phoneHold = null, phoneHeld = null;
  var swayQ = new THREE.Quaternion(), swayE = new THREE.Euler();

  if(typeof window.createCellPhone === 'function'){
    phone = window.createCellPhone({ scale: PHONE_SCALE, screenOn: false, screenImage: false });
    phone.setScreenImage(window.cellScreenImage, function(tex){
      try{ if(renderer.initTexture) renderer.initTexture(tex); } catch(e){ console.warn('initTexture del celular falló (no es grave):', e); }
    });
    phone.preloadImage(window.cellScreenImage2);
    phone.preloadHomeScreen();
    phone.preloadImage(window.cellPinterestImage1);
    phone.preloadImage(window.cellPinterestImage2);
    phone.layFlat(PHONE_REST_X, 0, PHONE_REST_Z, PHONE_REST_ROT);
    phoneRestY = phone.position.y;
    phone.visible = false;
    scene.add(phone);

    phoneBlob = addSoftShadowBlob(PHONE_REST_X, PHONE_REST_Z, 1.2, 2.0, 0.35);
    phoneBlob.rotation.z = PHONE_REST_ROT;
    phoneBlob.visible = false;
  } else {
    console.warn('cell.js no está cargado: agrega <script src="cell.js"></script> antes de script.js');
  }

  function startPhoneCinematic(){
    if(!phone){
      console.warn('No hay celular para mostrar (falta cell.js)');
      return;
    }
    console.info('[cinemática del celular] la cámara va al celular');

    animateCameraTo(PHONE_CAM_POS.clone(), PHONE_CAM_TARGET.clone(), 2.2, function(){
      phone.position.y = phoneRestY + PHONE_DROP;
      phone.rotation.y = PHONE_REST_ROT + PHONE_SPIN;
      phoneBlob.material.opacity = 0;
      phone.visible = true;
      phoneBlob.visible = true;
      phoneIntro = { t: 0 };
    });
  }

  var PHONE_HOLD_SECONDS = 1.6;
  var PHONE_HOLD_LIFT = 0.35;
  var PHONE_HOLD_CAM_POS    = new THREE.Vector3(-0.55, 2.00, 5.30);
  var PHONE_HOLD_CAM_TARGET = new THREE.Vector3(-0.55, 1.80, 2.00);
  var PHONE_HELD_DIST = 2.80;
  var PHONE_HELD_UP = 0.08;
  var PHONE_HELD_SIDE = -0.02;
  var PHONE_HELD_TILT = 0.01;
  var PHONE_HELD_ROLL = 0.00;
  var PHONE_HELD_SWAY = 1;
  var PHONE_GALLERY_DELAY_MS = 500;
  var PHONE_GALLERY_MS = 600;
  var PHONE_HOME_DELAY_MS = 2600;
  var PHONE_HOME_MS = 550;
  var PHONE_APP_OPEN_DELAY_MS = 1200;
  var PHONE_APP_OPEN_MS = 500;
  var PHONE_PINTEREST_IMG1_DELAY_MS = 1000;
  var PHONE_PINTEREST_IMG1_MS = 500;
  var PHONE_PINTEREST_SCROLL_MS_PER_SCREEN = 1000;

  function startPhoneHoldCinematic(){
    if(!phone){
      console.warn('No hay celular para alzar (falta cell.js)');
      return;
    }
    console.info('[cinemática del celular 2] se alza');
    controls.enabled = false;
    liftPhone();
  }

  function startPhoneGallerySwipe(){
    if(!phone || !window.cellScreenImage2){
      console.warn('Falta window.cellScreenImage2 en imagen.js; el celular se queda con la imagen actual');
      return;
    }
    console.info('[cinemática del celular 2] la foto se desliza (galería)');
    phone.slideToImage(window.cellScreenImage2, { ms: PHONE_GALLERY_MS, direction: 'left', fit: 'stretch' }, function(){
      phoneGalleryDone = true;
      setTimeout(startPhoneHomeScreen, PHONE_HOME_DELAY_MS);
    });
  }

  function startPhoneHomeScreen(){
    if(!phone){
      console.warn('No hay celular para mostrar la pantalla principal (falta cell.js)');
      return;
    }
    console.info('[cinemática del celular 2] sale a la pantalla principal');
    phone.showHomeScreen({ ms: PHONE_HOME_MS, axis: 'y', direction: 'up' }, function(){
      phoneHomeDone = true;
      setTimeout(startPhoneOpenPinterest, PHONE_APP_OPEN_DELAY_MS);
    });
  }

  function startPhoneOpenPinterest(){
    if(!phone){
      console.warn('No hay celular para abrir Pinterest (falta cell.js)');
      return;
    }
    console.info('[cinemática del celular 2] entra a Pinterest');
    phone.showAppOpen(window.cellPinterestIconUrl, { ms: PHONE_APP_OPEN_MS, axis: 'y', direction: 'up' }, function(){
      phonePinterestDone = true;
      setTimeout(startPhonePinterestImage1, PHONE_PINTEREST_IMG1_DELAY_MS);
    });
  }

  function startPhonePinterestImage1(){
    if(!phone || !window.cellPinterestImage1){
      console.warn('Falta window.cellPinterestImage1 en imagen.js');
      return;
    }
    phone.slideToImage(window.cellPinterestImage1, { ms: PHONE_PINTEREST_IMG1_MS, axis: 'y', direction: 'up', fit: 'stretch' }, function(){
      phonePinterestImg1Done = true;
    });
  }

  function startPhonePinterestScroll(){
    if(!phone || !window.cellPinterestImage2){
      console.warn('Falta window.cellPinterestImage2 en imagen.js');
      return;
    }
    phone.scrollDownImage(window.cellPinterestImage2, { msPerScreen: PHONE_PINTEREST_SCROLL_MS_PER_SCREEN }, function(){
      phoneScrollDone = true;
    });
  }

  var PHONE_FALL_SECONDS = 0.55;
  var PHONE_BOUNCE_SECONDS = 0.4;
  var CRASH_BLINK_DELAY_MS = 550;
  var CRASH_NOTEBOOK_DELAY_MS = 1300;
  var CRASH_CAMERA_DELAY_MS = 1000;
  var CRASH_CAMERA_SECONDS = 4.5;
  var CRASH_MUG_DELAY_MS = 2600;
  var CRASH_PAPERS_DELAY_MS = 3200;
  var GALAXY_CALM_AT_MS = 9000;
  var GALAXY_CALM_SECONDS = 1.5;
  var GALAXY_FACE_WALL_HOLD_MS = 1500;
  var GALAXY_FLASH_IN_MS = 900;
  var GALAXY_FLASH_OUT_MS = 2200;
  var GALAXY_CENTER = new THREE.Vector3(0.16, 1.67, -0.06);
  var SPACE_IMAGE_DELAY_MS = 2000;
  var SPACE_IMAGE_DISTANCE = 26;
  var SPACE_IMAGE_SAMPLE_W = 360;   // resolución (en partículas) del ancho de la imagen al hacerse ceniza
  var GALAXY_PAPER_DRIFT_MIN = 0.35;
  var GALAXY_PAPER_DRIFT_MAX = 0.95;
  var GALAXY_PAPER_SPIN = 0.5;
  var PAPER_STAGGER_SECONDS = 2.5;
  var PAPER_PEEL_SECONDS = 0.9;
  var PAPER_MAX_SPEED = 15;
  var PAPER_BOUNDS = { xMax: 9, yMin: -4, yMax: 10, zMin: WALL_Z + 0.5, zMax: 10.5 };
  var CRASH_HOME_POS = new THREE.Vector3(0.16, 2.6, 13.0);
  var CRASH_HOME_TARGET = new THREE.Vector3(0.16, 1.67, -0.06);
  var NOTEBOOK_CHAOS_INTERVAL = 0.075;
  var NOTEBOOK_CHAOS_FLIP_SECONDS = 0.17;
  var MUG_SLIDE_ACCEL = 2.6;
  var MUG_GRAVITY = 26;
  var DESK_FRONT_Z = 3.6;
  var SHAKE_POS = 0.18;
  var SHAKE_ROLL = 0.011;
  var SHAKE_MIN = 0.08;
  var SHAKE_RAMP_SECONDS = 8;
  var GAZE_YAW_MIN = 0.12;
  var GAZE_YAW_MAX = 0.7;
  var GAZE_PITCH = 0.18;
  var SWAY_X = 0.06;
  var SWAY_Y = 0.03;

  var phoneFall = null;
  var tabletBlink = null;
  var notebookChaos = null;
  var mugFall = null;
  var camShake = null;
  var papersChaos = null;
  var galaxyWorld = null;
  var flashOverlay = null;
  var spaceImage = null;
  var shakeOffset = null;
  var fallQ = new THREE.Quaternion();
  var TUMBLE_AXIS = new THREE.Vector3(1, 0.3, 0.2).normalize();
  var WOBBLE_AXIS = new THREE.Vector3(0, 0, 1);

  function startPhoneCrashCinematic(){
    if(!phone) return;

    var heldPos = phone.position.clone();
    var heldQuat = phone.quaternion.clone();
    phone.layFlat(PHONE_REST_X, 0, PHONE_REST_Z, PHONE_REST_ROT);
    var restPos = phone.position.clone();
    var restQuat = phone.quaternion.clone();
    phone.position.copy(heldPos);
    phone.quaternion.copy(heldQuat);
    if(heldQuat.dot(restQuat) < 0) restQuat.set(-restQuat.x, -restQuat.y, -restQuat.z, -restQuat.w);

    controls.maxDistance = 60;
    phoneHeld = null;
    phoneBlob.visible = true;
    phoneBlob.material.opacity = 0;
    phoneFall = { t: 0, fromPos: heldPos, fromQuat: heldQuat, restPos: restPos, restQuat: restQuat };

    animateCameraTo(PHONE_HOLD_CAM_POS.clone(), new THREE.Vector3(-0.55, 0.5, 2.3), 0.6, null);

    setTimeout(function(){
      tabletBlink = { on: true, next: 0 };
    }, CRASH_BLINK_DELAY_MS);

    setTimeout(startNotebookChaos, CRASH_NOTEBOOK_DELAY_MS);

    setTimeout(function(){
      camShake = { t0: clock.getElapsedTime(), next: 0, dir: 1, yawFrom: 0, yawTo: 0, pitchFrom: 0, pitchTo: 0, tStart: 0, dur: 0.2 };
      animateCameraTo(CRASH_HOME_POS.clone(), CRASH_HOME_TARGET.clone(), CRASH_CAMERA_SECONDS, function(){
        controls.enabled = false;
      }, function(q){ return 0.5 - Math.cos(Math.PI * q) / 2; });
    }, CRASH_CAMERA_DELAY_MS);

    setTimeout(startPapersChaos, CRASH_PAPERS_DELAY_MS);

    setTimeout(function(){
      if(camShake) camShake.calmStart = clock.getElapsedTime();
    }, CRASH_CAMERA_DELAY_MS + GALAXY_CALM_AT_MS);

    setTimeout(startGalaxyTransition,
      CRASH_CAMERA_DELAY_MS + GALAXY_CALM_AT_MS + GALAXY_CALM_SECONDS * 1000 + GALAXY_FACE_WALL_HOLD_MS);

    setTimeout(function(){
      mugFall = { vx: 0, vy: 0, vz: 0.15, wx: 0, wz: 0, falling: false, t: 0 };
    }, CRASH_MUG_DELAY_MS);
  }

  function startNotebookChaos(){
    var stack = [];
    for(var i = currentPageIndex; i < PAGE_COUNT; i++) stack.push(notebookPages[i]);
    notebookChaos = { stack: stack, flying: [], acc: 0 };
  }

  function reindexChaosStack(stack){
    for(var k = 0; k < stack.length; k++){
      stack[k].position.y = pageStackBaseY + (stack.length - 1 - k) * PAGE_THICKNESS;
    }
  }

  function updateNotebookChaos(dt){
    var c = notebookChaos;
    c.acc += dt;
    while(c.acc >= NOTEBOOK_CHAOS_INTERVAL && c.stack.length > 1){
      c.acc -= NOTEBOOK_CHAOS_INTERVAL;
      var pv = c.stack.shift();
      reindexChaosStack(c.stack);
      c.flying.push({ pivot: pv, t: 0, y0: pv.position.y, y1: pageStackBaseY + currentPageIndex * PAGE_THICKNESS + 0.002 });
    }
    if(c.acc > NOTEBOOK_CHAOS_INTERVAL) c.acc = NOTEBOOK_CHAOS_INTERVAL;

    for(var i = c.flying.length - 1; i >= 0; i--){
      var f = c.flying[i];
      f.t += dt / NOTEBOOK_CHAOS_FLIP_SECONDS;
      var q = Math.min(f.t, 1);
      var e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
      f.pivot.rotation.z = Math.PI * e;
      f.pivot.position.y = f.y0 + (f.y1 - f.y0) * e + Math.sin(q * Math.PI) * 0.06;
      if(q >= 1){
        c.flying.splice(i, 1);
        f.pivot.rotation.z = 0;
        c.stack.push(f.pivot);
        reindexChaosStack(c.stack);
      }
    }
  }

  function startPapersChaos(){
    tapeMat.side = THREE.DoubleSide;
    tapeMat.needsUpdate = true;
    papersChaos = {
      t0: clock.getElapsedTime(),
      items: wallPapers.map(function(w){
        return {
          w: w,
          delay: Math.random() * PAPER_STAGGER_SECONDS,
          state: 'wall',
          peelT: 0,
          v: new THREE.Vector3(),
          spin: new THREE.Vector3(),
          ph: [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28],
          tapeV: null
        };
      })
    };
  }

  function updatePapersChaos(dt, t){
    var c = papersChaos;
    var el0 = t - c.t0;
    var agg = 1 + Math.min(1, el0 / 8) * 0.8;
    var B = PAPER_BOUNDS;

    c.items.forEach(function(it){
      var mesh = it.w.mesh;

      if(it.state === 'wall'){
        if(el0 < it.delay){
          var tremble = Math.max(0, 1 - (it.delay - el0) / 0.6);
          mesh.position.z = WALL_Z + 0.03 + Math.sin(t * 60 + it.ph[0]) * 0.012 * tremble;
          return;
        }
        it.state = 'peel';
        mesh.material.side = THREE.DoubleSide;
        mesh.material.needsUpdate = true;
        mesh.rotation.order = 'ZXY';
        it.tapeV = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, 0.3 + Math.random() * 0.4);
      }

      if(it.tapeV){
        var tp = it.w.tape;
        if(tp.position.y > FLOOR_Y + 0.05){
          it.tapeV.y -= 20 * dt;
          tp.position.addScaledVector(it.tapeV, dt);
          tp.rotation.x += 4 * dt;
          tp.rotation.z += 3 * dt;
        }
      }

      if(it.state === 'peel'){
        it.peelT += dt;
        var p = Math.min(1, it.peelT / PAPER_PEEL_SECONDS);
        var th = 1.2 * p * p + Math.sin(t * 30 + it.ph[1]) * 0.04 * p;
        var topY = it.w.y + it.w.ph / 2;
        mesh.rotation.x = -th;
        mesh.rotation.z = it.w.rot;
        mesh.position.set(it.w.x, topY - (it.w.ph / 2) * Math.cos(th), WALL_Z + 0.03 + (it.w.ph / 2) * Math.sin(th));
        if(p >= 1){
          it.state = 'fly';
          mesh.rotation.setFromQuaternion(mesh.quaternion.clone(), 'XYZ');
          it.v.set((Math.random() - 0.5) * 12, 3 + Math.random() * 7, 6 + Math.random() * 8);
          it.spin.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        }
        return;
      }

      var pos = mesh.position;

      if(c.galaxy){
        if(!it.drift){
          it.drift = pos.clone().sub(GALAXY_CENTER);
          if(it.drift.lengthSq() < 0.01) it.drift.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
          it.drift.normalize().multiplyScalar(GALAXY_PAPER_DRIFT_MIN + Math.random() * (GALAXY_PAPER_DRIFT_MAX - GALAXY_PAPER_DRIFT_MIN));
          it.slowSpin = new THREE.Vector3((Math.random() - 0.5) * GALAXY_PAPER_SPIN, (Math.random() - 0.5) * GALAXY_PAPER_SPIN, (Math.random() - 0.5) * GALAXY_PAPER_SPIN);
        }
        var gl = 1 - Math.exp(-1.2 * dt);
        it.v.lerp(it.drift, gl);
        it.spin.lerp(it.slowSpin, gl);
        pos.addScaledVector(it.v, dt);
        mesh.rotation.x += it.spin.x * dt;
        mesh.rotation.y += it.spin.y * dt;
        mesh.rotation.z += it.spin.z * dt;
        return;
      }

      var ax = Math.sin(t * 1.9 + it.ph[0]) * 14 * agg + (0 - pos.x) * 0.5;
      var ay = Math.sin(t * 2.3 + it.ph[1]) * 14 * agg + (3 - pos.y) * 0.5;
      var az = Math.sin(t * 1.5 + it.ph[2]) * 14 * agg + (3 - pos.z) * 0.5;
      it.v.x += ax * dt; it.v.y += ay * dt; it.v.z += az * dt;
      var sp = it.v.length();
      if(sp > PAPER_MAX_SPEED * agg) it.v.multiplyScalar(PAPER_MAX_SPEED * agg / sp);
      pos.addScaledVector(it.v, dt);

      if(pos.x > B.xMax){ pos.x = B.xMax; it.v.x = -Math.abs(it.v.x); }
      if(pos.x < -B.xMax){ pos.x = -B.xMax; it.v.x = Math.abs(it.v.x); }
      if(pos.y > B.yMax){ pos.y = B.yMax; it.v.y = -Math.abs(it.v.y); }
      if(pos.y < B.yMin){ pos.y = B.yMin; it.v.y = Math.abs(it.v.y); }
      if(pos.z > B.zMax){ pos.z = B.zMax; it.v.z = -Math.abs(it.v.z); }
      if(pos.z < B.zMin){ pos.z = B.zMin; it.v.z = Math.abs(it.v.z); }

      mesh.rotation.x += it.spin.x * dt;
      mesh.rotation.y += it.spin.y * dt;
      mesh.rotation.z += it.spin.z * dt;
    });
  }

  function startGalaxyTransition(){
    if(typeof window.createGalaxy !== 'function'){
      console.warn('galaxya.js no está cargado: agrega <script src="galaxya.js"></script> antes de script.js');
      return;
    }
    if(!flashOverlay){
      flashOverlay = document.createElement('div');
      flashOverlay.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:70;';
      document.body.appendChild(flashOverlay);
    }
    flashOverlay.style.transition = 'opacity ' + GALAXY_FLASH_IN_MS + 'ms ease-in';
    flashOverlay.style.opacity = '1';
    setTimeout(function(){
      enterGalaxyWorld();
      setTimeout(function(){
        flashOverlay.style.transition = 'opacity ' + GALAXY_FLASH_OUT_MS + 'ms ease-out';
        flashOverlay.style.opacity = '0';
      }, 50);
    }, GALAXY_FLASH_IN_MS + 50);
  }

  function enterGalaxyWorld(){
    notebookChaos = null;
    tabletBlink = null;
    mugFall = null;
    phoneFall = null;
    camShake = null;

    var keep = {};
    wallPapers.forEach(function(w){ keep[w.mesh.uuid] = true; });
    galaxyHidden = [];
    scene.children.slice().forEach(function(ch){
      if(ch.isLight || keep[ch.uuid]) return;
      if(ch.visible) galaxyHidden.push(ch);
      ch.visible = false;
    });
    [hemi, key, rim, fill, lampGlow].forEach(function(l){ l.visible = false; });

    roomBackground = scene.background;
    roomCameraFar = camera.far;
    scene.background = new THREE.Color(0x000005);
    camera.far = 6000;
    camera.updateProjectionMatrix();

    galaxyWorld = window.createGalaxy();
    scene.add(galaxyWorld.group);

    wallPapers.forEach(function(w){
      var m = w.mesh.material;
      if(m && m.isMeshStandardMaterial){
        m.emissive = new THREE.Color(0xffffff);
        m.emissiveMap = m.map || null;
        m.emissiveIntensity = 0.35;
        m.needsUpdate = true;
      }
    });
    if(papersChaos) papersChaos.galaxy = { t0: clock.getElapsedTime() };

    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 400;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enabled = true;

    setTimeout(spawnSpaceImage, SPACE_IMAGE_DELAY_MS);
  }

  // Si la imagen del espacio no se puede mostrar, la cinemática sigue igual
  // y pasa directo a los objetos de arte.
  function skipSpaceImage(){
    setTimeout(spawnSpaceObjects, 600);
  }

  function spawnSpaceImage(){
    if(typeof window.createAshImage !== 'function'){
      console.warn('galaxya.js no expone createAshImage (¿está actualizado?)');
      skipSpaceImage();
      return;
    }
    if(!window.spaceImageUrl){
      console.warn('Falta window.spaceImageUrl en imagen.js');
      skipSpaceImage();
      return;
    }

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){
      var camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);

      var anchor = new THREE.Object3D();
      anchor.position.copy(camera.position).addScaledVector(camDir, SPACE_IMAGE_DISTANCE);
      anchor.quaternion.copy(camera.quaternion);

      // Tamaño exacto de lo que ve la cámara a esa distancia (+2% de margen)
      // para que la imagen llene toda la pantalla. 'cover' recorta en vez de estirar.
      var fillH = 2 * SPACE_IMAGE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.02;
      var fillW = fillH * camera.aspect;

      var ash = window.createAshImage(img, {
        width: fillW,
        height: fillH,
        fit: 'cover',
        sampleWidth: SPACE_IMAGE_SAMPLE_W,
        particleSize: fillW / SPACE_IMAGE_SAMPLE_W * 1.7,
        driftScale: fillW / 14
      });
      anchor.add(ash.object);
      scene.add(anchor);

      spaceImage = { ash: ash, anchor: anchor };
    };
    img.onerror = function(){
      console.warn('No se pudo cargar la imagen del espacio: ' + window.spaceImageUrl);
      skipSpaceImage();
    };
    img.src = window.spaceImageUrl;
  }

  // ---------- Objetos de arte pegados a la cámara (mundo del espacio) ----------
  // Van en una escena aparte, sin luces y con MeshBasicMaterial: no les afecta
  // ninguna luz ni sombra, y siempre se dibujan por delante del espacio.
  var SPACE_ART_DISTANCE = 3.3;
  var SPACE_ART_POP_SECONDS = 0.35;
  var SPACE_ART_STAGGER_SECONDS = 0.12;
  var SPACE_ART_READY_MS = 900;        // desde que aparecen hasta que Espacio / → pueda expulsarlos
  var SPACE_ART_SWAP_DELAY_MS = 900;   // desde la expulsión hasta que aparece el grupo siguiente
  var SPACE_DEBRIS_SECONDS = 2.4;      // cuánto tardan en perderse en el espacio
  var hudScene = null;
  var spaceArt = null;
  var spaceArtReady = false;
  var spaceArtReady2 = false;
  var artExpelTriggered = false;
  var artExpel2Triggered = false;
  var spaceItemCount = 0;
  var spaceDebris = [];
  var debrisQ = new THREE.Quaternion();
  var followDir = new THREE.Vector3();

  // El renderer usa salida sRGB: los colores hex se pasan a lineal para que se vean como se escriben.
  function hudColor(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  function hudPart(geo, hex, outline){
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: hudColor(hex),
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    }));
    if(outline !== false){
      mesh.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 35),
        new THREE.LineBasicMaterial({ color: hudColor(0x1b120a), transparent: true, opacity: 0.6 })
      ));
    }
    return mesh;
  }

  function disposeHud(obj){
    obj.traverse(function(o){
      if(o.geometry) o.geometry.dispose();
      if(o.material){
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){
          if(m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  // ----- Grupo 1: lienzo + taburete, acuarelas, pincel -----

  // Taburete de madera: asiento redondo, 3 patas inclinadas y un aro. Asiento a y = 0.525.
  function buildStool(){
    var g = new THREE.Group();
    var seat = hudPart(new THREE.CylinderGeometry(0.27, 0.25, 0.05, 28), 0xc48a55);
    seat.position.y = 0.5;
    g.add(seat);
    for(var i = 0; i < 3; i++){
      var pivot = new THREE.Group();
      pivot.rotation.y = i * Math.PI * 2 / 3 + 0.5;
      var leg = hudPart(new THREE.CylinderGeometry(0.022, 0.03, 0.5, 10), 0x8a5a33);
      leg.position.set(0.17, 0.25, 0);
      leg.rotation.z = 0.13;
      pivot.add(leg);
      g.add(pivot);
    }
    var ring = hudPart(new THREE.TorusGeometry(0.18, 0.012, 6, 28), 0x6e4526, false);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    g.add(ring);
    return g;
  }

  // Lienzo en blanco con bastidor. El origen está en el borde inferior.
  function buildCanvasBoard(){
    var g = new THREE.Group();
    var frame = hudPart(new THREE.BoxGeometry(0.62, 0.8, 0.05), 0xd9c7a0);
    frame.position.y = 0.4;
    g.add(frame);
    var face = hudPart(new THREE.PlaneGeometry(0.56, 0.74), 0xf6f1e6);
    face.position.set(0, 0.4, 0.0265);
    g.add(face);
    return g;
  }

  // Caja de acuarelas: 8 pastillas de color, zona de mezcla con una gota de pintura y tapa abierta.
  // Las pastillas y la tapa se marcan como "debris": al expulsarla salen disparadas por separado.
  function buildWatercolors(){
    var g = new THREE.Group();
    g.add(hudPart(new THREE.BoxGeometry(0.95, 0.05, 0.62), 0xe4e1da));

    var colors = [0xd9382f, 0xf28b30, 0xf4c92e, 0x54b155, 0x1fa9a1, 0x2f6fd6, 0x7b4bc4, 0xe8659b];
    colors.forEach(function(c, i){
      var pan = hudPart(new THREE.BoxGeometry(0.17, 0.03, 0.15), c);
      pan.position.set(-0.3 + (i % 4) * 0.2, 0.04, -0.16 + Math.floor(i / 4) * 0.2);
      pan.userData.debris = true;
      g.add(pan);
    });

    var mix = hudPart(new THREE.BoxGeometry(0.85, 0.012, 0.16), 0xf7f5f0);
    mix.position.set(0, 0.031, 0.21);
    g.add(mix);
    var puddle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 14, 8),
      new THREE.MeshBasicMaterial({ color: hudColor(0x2f6fd6) })
    );
    puddle.scale.set(1, 0.25, 0.7);
    puddle.position.set(0.18, 0.04, 0.21);
    g.add(puddle);

    var hinge = new THREE.Group();
    hinge.position.set(0, 0.025, -0.31);
    hinge.rotation.x = -1.95;
    hinge.userData.debris = true;
    var lid = hudPart(new THREE.BoxGeometry(0.95, 0.03, 0.62), 0xcfccc5);
    lid.position.z = 0.31;
    hinge.add(lid);
    g.add(hinge);
    return g;
  }

  // Pincel a lo largo del eje Y: mango azul, casquillo metálico, cerdas y punta con pintura.
  function buildBrush(){
    var g = new THREE.Group();
    var handle = hudPart(new THREE.CylinderGeometry(0.022, 0.011, 0.56, 12), 0x2d63b8);
    handle.position.y = 0.28;
    var ferrule = hudPart(new THREE.CylinderGeometry(0.019, 0.024, 0.14, 12), 0xcfd3d9);
    ferrule.position.y = 0.63;
    var bristles = hudPart(new THREE.ConeGeometry(0.02, 0.17, 12), 0xd9a45f);
    bristles.position.y = 0.785;
    var tip = hudPart(new THREE.ConeGeometry(0.016, 0.07, 12), 0xd9382f, false);
    tip.position.y = 0.835;
    g.add(handle, ferrule, bristles, tip);
    return g;
  }

  // ----- Grupo 2: cubos de colores + tableta gráfica -----

  function paintTabletScreen(ctx, w, h){
    ctx.fillStyle = '#1f2026';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f3139';
    ctx.fillRect(0, 0, w, 30);
    ['#ff5f57', '#febc2e', '#28c840'].forEach(function(c, i){
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(18 + i * 20, 15, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#2a2c33';
    ctx.fillRect(0, 30, 52, h - 30);
    var palette = ['#d9382f', '#f28b30', '#f4c92e', '#54b155', '#2f6fd6', '#7b4bc4', '#e8659b', '#1fa9a1'];
    palette.slice(0, 6).forEach(function(c, i){
      ctx.fillStyle = c;
      ctx.fillRect(12, 48 + i * 44, 28, 28);
    });
    ctx.fillStyle = '#f6f1e6';
    ctx.fillRect(70, 48, w - 220, h - 66);
    ctx.lineCap = 'round';
    [
      ['#d9382f', 100, 320, 180, 120, 300, 300, 26],
      ['#f28b30', 150, 330, 250, 150, 380, 310, 22],
      ['#f4c92e', 260, 110, 330, 230, 440, 120, 20],
      ['#54b155', 110, 150, 200, 250, 290, 120, 18],
      ['#2f6fd6', 320, 330, 400, 210, 470, 320, 24],
      ['#7b4bc4',  90,  90, 240,  60, 420, 100, 16]
    ].forEach(function(s){
      ctx.strokeStyle = s[0]; ctx.lineWidth = s[7];
      ctx.beginPath(); ctx.moveTo(s[1], s[2]); ctx.quadraticCurveTo(s[3], s[4], s[5], s[6]); ctx.stroke();
    });
    for(var i = 0; i < 16; i++){
      ctx.globalAlpha = i < 8 ? 1 : 0.55;
      ctx.fillStyle = palette[i % 8];
      ctx.fillRect(506 + (i % 4) * 32, 52 + Math.floor(i / 4) * 32, 26, 26);
    }
    ctx.globalAlpha = 1;
  }

  // Tableta gráfica con pantalla: cuerpo oscuro, 4 botones laterales y la pantalla encendida
  // (sin luces: se ve siempre con su color). Muestra hudTabletScreenImage o, si no existe,
  // screenImage (la misma del escritorio); si ninguna carga, queda una pantalla de dibujo pintada.
  function buildGraphicTablet(){
    var g = new THREE.Group();
    g.add(hudPart(new THREE.BoxGeometry(1.56, 0.96, 0.06), 0x393c44));
    for(var i = 0; i < 4; i++){
      var btn = hudPart(new THREE.BoxGeometry(0.07, 0.07, 0.02), 0x6b707c);
      btn.position.set(-0.69, -0.24 + i * 0.16, 0.04);
      g.add(btn);
    }

    var W = 640, H = 384;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    paintTabletScreen(ctx, W, H);
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;

    var screenGeo = new THREE.PlaneGeometry(1.3, 0.78);
    var screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(0.05, 0, 0.0315);
    screen.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(screenGeo),
      new THREE.LineBasicMaterial({ color: hudColor(0x1b120a), transparent: true, opacity: 0.6 })
    ));
    g.add(screen);

    var url = window.hudTabletScreenImage || window.screenImage;
    if(url){
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function(){
        var sc = Math.max(W / im.naturalWidth, H / im.naturalHeight);
        var dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
        ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
        tex.needsUpdate = true;
      };
      im.src = url;
    }
    return g;
  }

  function easeOutBack(x){
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function ensureSpaceHud(){
    if(spaceArt) return;
    hudScene = new THREE.Scene();
    var root = new THREE.Group();
    var layout = new THREE.Group();
    layout.position.z = -SPACE_ART_DISTANCE;
    root.add(layout);
    hudScene.add(root);
    spaceArt = { root: root, layout: layout, items: [], t0: 0, expelled: false };
  }

  function addSpaceItem(obj, x, y, z, delay, tick){
    var holder = new THREE.Group();
    holder.position.set(x, y, z);
    holder.scale.setScalar(0.0001);
    holder.add(obj);
    spaceArt.layout.add(holder);
    spaceArt.items.push({ holder: holder, obj: obj, delay: delay, tick: tick, baseY: y, phase: spaceItemCount++ * 1.7 });
  }

  // Grupo 1
  function spawnSpaceObjects(){
    if(spaceArt) return;
    ensureSpaceHud();

    // Lienzo apoyado sobre su taburete
    var stool = buildStool();
    var board = buildCanvasBoard();
    board.position.set(0, 0.525, -0.02);
    board.rotation.x = -0.16;
    board.userData.debris = true;
    stool.add(board);
    stool.position.y = -0.66;
    var stoolWrap = new THREE.Group();
    stoolWrap.add(stool);
    addSpaceItem(stoolWrap, -1.0, -0.3, 0, 0, function(it, t){
      it.obj.rotation.y = -0.3 + Math.sin(t * 0.7) * 0.3;
    });

    // Acuarelas inclinadas hacia la cámara
    var palette = buildWatercolors();
    palette.rotation.x = 0.95;
    var paletteWrap = new THREE.Group();
    paletteWrap.add(palette);
    addSpaceItem(paletteWrap, 0.95, -0.62, 0.2, SPACE_ART_STAGGER_SECONDS, function(it, t){
      it.obj.rotation.y = 0.25 + Math.sin(t * 0.8 + 1) * 0.25;
    });

    // Pincel en diagonal, con la punta hacia las acuarelas
    var brush = buildBrush();
    brush.position.y = -0.435;
    var brushWrap = new THREE.Group();
    brushWrap.add(brush);
    addSpaceItem(brushWrap, 1.4, 0.2, 0.35, SPACE_ART_STAGGER_SECONDS * 2, function(it, t){
      it.obj.rotation.z = 2.36 + Math.sin(t * 1.3 + 2) * 0.07;
    });

    spaceArt.t0 = clock.getElapsedTime();
    setTimeout(function(){ spaceArtReady = true; }, SPACE_ART_READY_MS);
  }

  // Espacio / → : el grupo que esté en pantalla sale expulsado. Cada pieza (taburete, lienzo,
  // pastillas, tapa, caja, pincel, cubos, tableta...) se despega de la cámara, sale disparada
  // hacia afuera y hacia el fondo, girando, y se va encogiendo hasta perderse.
  // afterFn se ejecuta afterDelayMs después (grupo 1 -> aparece el grupo 2; grupo 2 -> el despertar).
  function expelSpaceObjects(afterFn, afterDelayMs){
    if(!spaceArt || spaceArt.expelled) return;
    spaceArt.expelled = true;
    hudScene.updateMatrixWorld(true);

    var pieces = [];
    spaceArt.layout.traverse(function(o){ if(o.userData.debris) pieces.push(o); });
    spaceArt.items.forEach(function(it){ pieces.push(it.holder); });

    var invQ = camera.quaternion.clone().invert();
    var wp = new THREE.Vector3();
    pieces.forEach(function(o){
      o.getWorldPosition(wp);
      var local = wp.clone().sub(camera.position).applyQuaternion(invQ);
      var dir = new THREE.Vector3(local.x, local.y, 0);
      if(dir.lengthSq() < 0.01) dir.set(Math.random() - 0.5, Math.random() - 0.5, 0);
      dir.normalize()
        .add(new THREE.Vector3(0, 0, -1.3))
        .add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.7))
        .normalize()
        .applyQuaternion(camera.quaternion);

      hudScene.attach(o);
      spaceDebris.push({
        obj: o,
        vel: dir.multiplyScalar(6 + Math.random() * 8),
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        omega: 4 + Math.random() * 6,
        drag: 0.9,
        age: 0,
        life: SPACE_DEBRIS_SECONDS * (0.8 + Math.random() * 0.4),
        s0: o.scale.x
      });
    });
    spaceArt.items = [];

    if(afterFn) setTimeout(afterFn, afterDelayMs || 0);
  }

  // Grupo 2
  function spawnSpaceObjects2(){
    if(!spaceArt) return;
    spaceArt.t0 = clock.getElapsedTime();
    spaceArt.expelled = false;
    setTimeout(function(){ spaceArtReady2 = true; }, SPACE_ART_READY_MS);

    // Tableta gráfica con su pantalla
    var tablet = buildGraphicTablet();
    var tabletWrap = new THREE.Group();
    tabletWrap.add(tablet);
    addSpaceItem(tabletWrap, 0.55, -0.3, 0.05, 0, function(it, t){
      it.obj.rotation.y = Math.sin(t * 0.7) * 0.2;
      it.obj.rotation.x = -0.12 + Math.sin(t * 0.5 + 1) * 0.03;
    });

    // Cubos grandes, con los colores de la paleta
    [
      { size: 0.62, color: 0xd9382f, x: -1.35, y:  0.45, z:  0.10 },
      { size: 0.44, color: 0xf28b30, x: -0.70, y:  0.72, z: -0.20 },
      { size: 0.72, color: 0x2f6fd6, x: -1.20, y: -0.35, z:  0.25 },
      { size: 0.50, color: 0xf4c92e, x: -0.62, y: -0.66, z:  0.20 },
      { size: 0.52, color: 0x54b155, x:  1.55, y:  0.50, z:  0.00 },
      { size: 0.40, color: 0x7b4bc4, x:  1.00, y:  0.82, z: -0.20 }
    ].forEach(function(c, k){
      var wrap = new THREE.Group();
      wrap.add(hudPart(new THREE.BoxGeometry(c.size, c.size, c.size), c.color));
      var sp = 0.35 + (k % 3) * 0.15;
      addSpaceItem(wrap, c.x, c.y, c.z, SPACE_ART_STAGGER_SECONDS * 0.6 * (k + 1), function(it, t){
        it.obj.rotation.x = t * sp + k;
        it.obj.rotation.y = t * sp * 1.3 + k * 2;
      });
    });
  }

  function updateSpaceDebris(dt){
    for(var i = spaceDebris.length - 1; i >= 0; i--){
      var d = spaceDebris[i];
      d.age += dt;
      d.vel.multiplyScalar(Math.exp(-d.drag * dt));
      d.obj.position.addScaledVector(d.vel, dt);
      debrisQ.setFromAxisAngle(d.axis, d.omega * dt);
      d.obj.quaternion.premultiply(debrisQ);
      var life = d.age / d.life;
      d.obj.scale.setScalar(life < 0.55 ? d.s0 : d.s0 * Math.max(0.0001, 1 - (life - 0.55) / 0.45));
      if(life >= 1){
        hudScene.remove(d.obj);
        disposeHud(d.obj);
        spaceDebris.splice(i, 1);
      }
    }
  }

  // Todo lo que va pegado a la cámara: la imagen del espacio (para que llene la
  // pantalla aunque la cámara gire sola) y los objetos de arte.
  function updateSpaceFollowers(t, dt){
    if(spaceImage){
      camera.getWorldDirection(followDir);
      spaceImage.anchor.position.copy(camera.position).addScaledVector(followDir, SPACE_IMAGE_DISTANCE);
      spaceImage.anchor.quaternion.copy(camera.quaternion);
    }
    if(spaceArt){
      spaceArt.root.position.copy(camera.position);
      spaceArt.root.quaternion.copy(camera.quaternion);
      // En pantallas angostas (celular vertical) se encoge todo para que quepa
      spaceArt.layout.scale.setScalar(Math.min(1, camera.aspect / 1.6));
      spaceArt.items.forEach(function(it){
        var q = Math.min(1, Math.max(0, (t - spaceArt.t0 - it.delay) / SPACE_ART_POP_SECONDS));
        it.holder.scale.setScalar(Math.max(0.0001, easeOutBack(q)));
        it.holder.position.y = it.baseY + Math.sin(t * 1.1 + it.phase) * 0.03;
        it.tick(it, t);
      });
      if(spaceDebris.length) updateSpaceDebris(dt);
    }
  }

  // ---------- El despertar: vista borrosa -> ojos que se cierran -> techo ----------
  // Tras expulsar el grupo 2 la imagen se va poniendo borrosa (suave al principio y cada vez más),
  // se cierran los párpados (negro) y, mientras está todo oscuro, se vuelve a la habitación.
  // Al abrir los ojos la cámara está acostada en el piso mirando el techo.
  var WAKE_BLUR_DELAY_MS   = 1200;   // desde la expulsión hasta que empieza a verse borroso
  var WAKE_BLUR_RAMP_MS    = 5000;   // de nítido a muy borroso
  var WAKE_BLUR_MAX_PX     = 16;
  var WAKE_EYES_CLOSE_MS   = 1700;
  var WAKE_DARK_HOLD_MS    = 900;    // negro total (aquí se cambia de escenario)
  var WAKE_EYES_OPEN_MS    = 2400;
  var WAKE_OPEN_BLUR_PX    = 10;     // al abrir los ojos aún se ve algo borroso y enfoca rápido (0 = nítido desde el inicio)
  var WAKE_FOCUS_MS        = 1800;
  var CEILING_CAM_POS      = new THREE.Vector3(0.16, FLOOR_Y + 0.4, 8.5);   // en el piso, frente al escritorio
  var CEILING_LOOK_DIR     = new THREE.Vector3(0, 1, -0.18).normalize();    // casi vertical, un poco hacia el escritorio
  var CEILING_LIGHT_INTENSITY = 200; // luz cálida para que el techo se vea (sin ella queda casi negro)
  var wake = null;
  var eyeTop = null, eyeBottom = null;
  var galaxyHidden = [];             // lo que enterGalaxyWorld ocultó, para poder volver a la habitación
  var roomBackground = null;
  var roomCameraFar = 100;

  // ---------- El póster del techo: una ventana a un mundo (grieg.js) ----------
  // Al abrir los ojos ya se ve el póster cuadrado en el techo. En vez de una imagen, muestra un
  // mundo turquesa con nubes flotando, dibujado en vivo por grieg.js.
  var CEILING_POSTER_SIZE   = 7;       // lado del póster cuadrado (unidades de la escena)
  var CEILING_POSTER_BORDER = 0.25;    // margen blanco alrededor
  var GRIEG_TEX_SIZE        = 1024;    // resolución del mundo dentro del póster (baja a 512 si va lento)
  var GRIEG_COLOR           = '#2cd5da';

  // Después de despertar: se queda un rato mirando el techo y luego se lanza rápido hacia el póster;
  // al llegar, el turquesa cubre la pantalla y aparece el entorno de grieg.js a pantalla completa.
  var POSTER_HOLD_MS      = 3000;      // tiempo mirando el techo antes de lanzarse
  var POSTER_DIVE_SECONDS = 1.6;       // vuelo hacia el póster (acelera hasta llegar)
  var POSTER_END_DIST     = 2.5;       // a esta distancia del póster, el póster llena toda la pantalla
  var POSTER_FADE_IN_MS   = 400;       // el turquesa tapa la pantalla justo al llegar
  var POSTER_FADE_OUT_MS  = 700;       // ...y se retira dejando ver el mundo
  var GRIEG_CREDITS_DELAY_MS = 3000;   // tiempo volando entre las nubes antes de que aparezca "Gracias"

  var ceilingPoster = null;
  var griegWorld = null;
  var griegInside = false;             // true = se dibuja el mundo de grieg.js en vez de la habitación
  var worldOverlay = null;

  function buildCeilingPoster(){
    if(ceilingPoster) return;

    // Punto del techo hacia donde mira la cámara acostada: ahí va centrado el póster.
    var tHit = (CEIL_Y - CEILING_CAM_POS.y) / CEILING_LOOK_DIR.y;
    var cx = CEILING_CAM_POS.x + CEILING_LOOK_DIR.x * tHit;
    var cz = CEILING_CAM_POS.z + CEILING_LOOK_DIR.z * tHit;

    var group = new THREE.Group();
    group.position.set(cx, CEIL_Y - 0.02, cz);
    group.rotation.x = Math.PI / 2;      // cara hacia abajo, con la parte de arriba del mundo hacia el frente del cuarto

    var s = CEILING_POSTER_SIZE, b = CEILING_POSTER_BORDER;
    var border = new THREE.Mesh(
      new THREE.PlaneGeometry(s + b * 2, s + b * 2),
      new THREE.MeshStandardMaterial({ color: 0xf6f0e4, roughness: 0.9 })
    );
    group.add(border);

    // Mientras no exista el mundo, el póster es turquesa liso; en cuanto grieg.js crea el mundo se le pone como textura.
    var artMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(GRIEG_COLOR).convertSRGBToLinear() });
    if(typeof window.createGrieg === 'function'){
      try{
        griegWorld = window.createGrieg(renderer, { size: GRIEG_TEX_SIZE, color: GRIEG_COLOR });
        artMat.map = griegWorld.texture;
        artMat.color.setRGB(1, 1, 1);
        artMat.needsUpdate = true;
        console.info('grieg.js: mundo listo');
      } catch(err){
        griegWorld = null;
        console.error('grieg.js falló al crear el mundo:', err);
      }
    } else {
      console.warn('grieg.js no está cargado (revisa el <script src="grieg.js"> en index.html).');
    }
    var art = new THREE.Mesh(new THREE.PlaneGeometry(s, s), artMat);
    art.position.z = 0.015;
    group.add(art);

    scene.add(group);
    ceilingPoster = group;
  }

  function fadeWorldOverlay(opacity, ms){
    if(!worldOverlay){
      worldOverlay = document.createElement('div');
      worldOverlay.style.cssText = 'position:fixed;inset:0;background:' + GRIEG_COLOR + ';opacity:0;pointer-events:none;z-index:70;';
      document.body.appendChild(worldOverlay);
      void worldOverlay.offsetWidth;   // fija opacity:0 para que la transición arranque desde ahí
    }
    worldOverlay.style.transition = 'opacity ' + ms + 'ms ' + (opacity ? 'ease-in' : 'ease-out');
    worldOverlay.style.opacity = String(opacity);
  }

  function startPosterDive(){
    setTimeout(diveToPoster, POSTER_HOLD_MS);
  }

  function diveToPoster(){
    if(!ceilingPoster) return;
    var center = ceilingPoster.position.clone();
    // Se avanza en línea recta por la misma dirección en que ya se mira: el póster crece hasta llenar la pantalla.
    var toPos = center.clone().addScaledVector(CEILING_LOOK_DIR, -POSTER_END_DIST);
    animateCameraTo(toPos, center, POSTER_DIVE_SECONDS, function(){
      controls.enabled = false;
      enterGriegWorld();
    }, function(q){ return q * q; });
    setTimeout(function(){ fadeWorldOverlay(1, POSTER_FADE_IN_MS); }, POSTER_DIVE_SECONDS * 1000 - POSTER_FADE_IN_MS);
  }

  function enterGriegWorld(){
    if(griegWorld){
      griegWorld.enter();
      griegInside = true;
      setTimeout(function(){ griegWorld.startCredits(); }, GRIEG_CREDITS_DELAY_MS);
    } else {
      console.warn('No hay mundo de grieg.js para mostrar (¿grieg.js no cargó?): revisa la consola.');
    }
    fadeWorldOverlay(0, POSTER_FADE_OUT_MS);
  }

  function makeEyelids(){
    if(eyeTop) return;
    function lid(top){
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:0;width:100%;height:62%;z-index:80;pointer-events:none;will-change:transform;' +
        (top
          ? 'top:0;background:linear-gradient(to bottom,#000 0%,#000 82%,rgba(0,0,0,0) 100%);transform:translateY(-105%);'
          : 'bottom:0;background:linear-gradient(to top,#000 0%,#000 82%,rgba(0,0,0,0) 100%);transform:translateY(105%);');
      document.body.appendChild(el);
      return el;
    }
    eyeTop = lid(true);
    eyeBottom = lid(false);
  }

  function moveEyelids(closed, ms, easing){
    [eyeTop, eyeBottom].forEach(function(el, i){
      el.style.transition = 'transform ' + ms + 'ms ' + easing;
      el.style.transform = closed ? 'translateY(0)' : 'translateY(' + (i === 0 ? '-105%' : '105%') + ')';
    });
  }

  function setBlur(px){
    renderer.domElement.style.filter = px > 0.05 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
  }

  function startWakeSequence(){
    if(wake) return;
    makeEyelids();
    wake = { phase: 'wait', t: 0 };
  }

  // Se llama con la galaxia ya tapada por el negro: quita el espacio, devuelve la habitación
  // y deja la cámara acostada en el piso mirando el techo.
  function enterCeilingView(){
    if(galaxyWorld){
      scene.remove(galaxyWorld.group);
      disposeHud(galaxyWorld.group);
      galaxyWorld = null;
    }

    galaxyHidden.forEach(function(o){ o.visible = true; });
    [hemi, key, rim, fill, lampGlow].forEach(function(l){ l.visible = true; });
    // Los papeles se fueron flotando al espacio: no vuelven a la pared.
    papersChaos = null;
    wallPapers.forEach(function(w){ w.mesh.visible = false; });

    scene.background = roomBackground || new THREE.Color(0xcdb99b);
    camera.far = roomCameraFar;
    camera.updateProjectionMatrix();

    // El techo solo recibe luz desde abajo: se reutiliza la luz de relleno como foco cálido.
    fill.color.set(0xffe6c2);
    fill.intensity = CEILING_LIGHT_INTENSITY;
    fill.distance = 0;
    fill.decay = 2;
    fill.position.set(CEILING_CAM_POS.x, FLOOR_Y + 13, CEILING_CAM_POS.z - 2);
    buildCeilingPoster();

    camAnim = null;
    controls.autoRotate = false;
    controls.enabled = false;
    camera.position.copy(CEILING_CAM_POS);
    controls.target.copy(CEILING_CAM_POS).addScaledVector(CEILING_LOOK_DIR, 3);
    controls.update();
    camera.lookAt(controls.target);
  }

  function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }

  function updateWake(dt){
    if(!wake || wake.phase === 'done') return;
    wake.t += Math.min(dt, 0.1) * 1000;   // un tirón de cuadros no acorta el negro

    if(wake.phase === 'wait'){
      if(wake.t >= WAKE_BLUR_DELAY_MS){ wake.phase = 'blur'; wake.t = 0; }
    } else if(wake.phase === 'blur'){
      var p = Math.min(1, wake.t / WAKE_BLUR_RAMP_MS);
      setBlur(WAKE_BLUR_MAX_PX * Math.pow(p, 1.8));   // empieza muy suave y acelera
      if(p >= 1){
        wake.phase = 'close'; wake.t = 0;
        moveEyelids(true, WAKE_EYES_CLOSE_MS, 'cubic-bezier(0.55,0,0.45,1)');
      }
    } else if(wake.phase === 'close'){
      if(wake.t >= WAKE_EYES_CLOSE_MS){ wake.phase = 'dark'; wake.t = 0; enterCeilingView(); }
    } else if(wake.phase === 'dark'){
      if(wake.t >= WAKE_DARK_HOLD_MS){
        wake.phase = 'open'; wake.t = 0;
        moveEyelids(false, WAKE_EYES_OPEN_MS, 'cubic-bezier(0.3,0,0.2,1)');
      }
    } else if(wake.phase === 'open'){
      var f = Math.min(1, wake.t / WAKE_FOCUS_MS);
      setBlur(WAKE_OPEN_BLUR_PX * (1 - easeOutCubic(f)));
      if(wake.t >= Math.max(WAKE_EYES_OPEN_MS, WAKE_FOCUS_MS)){ setBlur(0); wake.phase = 'done'; startPosterDive(); }
    }
  }

  function updateTabletBlink(t){
    var panel = currentScreenPanel;
    if(!panel || t < tabletBlink.next) return;
    tabletBlink.on = !tabletBlink.on;
    tabletBlink.next = t + (tabletBlink.on ? 0.05 + Math.random() * 0.25 : 0.03 + Math.random() * 0.12);
    panel.visible = tabletBlink.on;
    var g = 0.55 + Math.random() * 0.45;
    panel.material.color.setRGB(g, g, g);
  }

  function updateMugFall(dt){
    var m = mugFall;
    if(m.done) return;
    m.t += dt;
    if(!m.falling){
      m.vz += MUG_SLIDE_ACCEL * dt;
      mug.position.z += m.vz * dt;
      mug.rotation.z = Math.sin(m.t * 38) * 0.05 * Math.min(1, m.t * 3);
      mug.rotation.x = Math.max(0, mug.position.z - (DESK_FRONT_Z - 0.6)) * 0.9;
      if(mug.position.z > DESK_FRONT_Z){
        m.falling = true;
        m.vy = 0;
        m.wx = 5;
        m.wz = 3;
        m.vx = -0.4;
      }
    } else {
      m.vy -= MUG_GRAVITY * dt;
      mug.position.x += m.vx * dt;
      mug.position.y += m.vy * dt;
      mug.position.z += m.vz * dt;
      mug.rotation.x += m.wx * dt;
      mug.rotation.z += m.wz * dt;
      if(mug.position.y <= FLOOR_Y + 0.4){
        mug.position.y = FLOOR_Y + 0.4;
        m.done = true;
      }
    }
  }

  function updatePhoneFall(dt){
    var pf = phoneFall;
    pf.t += dt;
    if(pf.t < PHONE_FALL_SECONDS){
      var fp = pf.t / PHONE_FALL_SECONDS;
      var fy = fp * fp;
      var fq = fp * fp * (3 - 2 * fp);
      phone.position.x = pf.fromPos.x + (pf.restPos.x - pf.fromPos.x) * fq;
      phone.position.z = pf.fromPos.z + (pf.restPos.z - pf.fromPos.z) * fq;
      phone.position.y = pf.fromPos.y + (pf.restPos.y - pf.fromPos.y) * fy;
      phone.quaternion.copy(pf.fromQuat).slerp(pf.restQuat, fq);
      fallQ.setFromAxisAngle(TUMBLE_AXIS, Math.sin(fp * Math.PI) * 0.7);
      phone.quaternion.premultiply(fallQ);
      phoneBlob.material.opacity = fy;
    } else {
      var bp = (pf.t - PHONE_FALL_SECONDS) / PHONE_BOUNCE_SECONDS;
      if(bp >= 1){
        phone.position.copy(pf.restPos);
        phone.quaternion.copy(pf.restQuat);
        phoneBlob.material.opacity = 1;
        phoneFall = null;
        return;
      }
      phone.position.copy(pf.restPos);
      phone.position.y += Math.sin(bp * Math.PI) * 0.12 * (1 - bp);
      fallQ.setFromAxisAngle(WOBBLE_AXIS, Math.sin(bp * Math.PI * 3) * 0.06 * (1 - bp));
      phone.quaternion.copy(pf.restQuat).multiply(fallQ);
    }
  }

  function applyCameraShake(t){
    var calm = 1;
    if(camShake.calmStart != null){
      calm = 1 - Math.min(1, (t - camShake.calmStart) / GALAXY_CALM_SECONDS);
      if(calm <= 0){
        camShake = null;
        return;
      }
    }
    var a = Math.min(1, (t - camShake.t0) / SHAKE_RAMP_SECONDS);
    var k = SHAKE_MIN + (1 - SHAKE_MIN) * a * a;
    var n1 = Math.sin(t * 37) + Math.sin(t * 53 + 1.0) + Math.sin(t * 71 + 2.0);
    var n2 = Math.sin(t * 41 + 0.5) + Math.sin(t * 59 + 1.7) + Math.sin(t * 83 + 0.3);
    var n3 = Math.sin(t * 47 + 2.2) + Math.sin(t * 67 + 0.9) + Math.sin(t * 89 + 1.4);
    shakeOffset = new THREE.Vector3(n1, n2, n3).multiplyScalar(SHAKE_POS * k / 3);
    var sway = 1 - a * 0.7;
    shakeOffset.x += Math.sin(t * 1.7) * SWAY_X * sway;
    shakeOffset.y += Math.sin(t * 1.1 + 1.0) * SWAY_Y * sway;
    shakeOffset.multiplyScalar(calm);
    camera.position.add(shakeOffset);

    var cs = camShake;
    if(t >= cs.next){
      var maxYaw = GAZE_YAW_MIN + (GAZE_YAW_MAX - GAZE_YAW_MIN) * a;
      var curYaw = cs.yawTo, curPitch = cs.pitchTo;
      cs.yawFrom = curYaw;
      cs.pitchFrom = curPitch;
      cs.dir = -cs.dir;
      cs.yawTo = cs.dir * maxYaw * (0.5 + 0.5 * Math.random());
      cs.pitchTo = (Math.random() - 0.5) * 2 * GAZE_PITCH * (0.3 + 0.7 * a);
      cs.tStart = t;
      cs.dur = 0.15 + Math.random() * 0.15;
      cs.next = t + cs.dur + Math.max(0.2, 1.0 - 0.6 * a + Math.random() * 0.5);
    }
    var gq = Math.min(1, (t - cs.tStart) / cs.dur);
    var ge = 1 - Math.pow(1 - gq, 3);
    var yaw = cs.yawFrom + (cs.yawTo - cs.yawFrom) * ge;
    var pitch = cs.pitchFrom + (cs.pitchTo - cs.pitchFrom) * ge;
    camera.rotateY(yaw * calm);
    camera.rotateX(pitch * calm);
    camera.rotateZ(Math.sin(t * 61 + 0.8) * SHAKE_ROLL * k * calm);
  }

  function computeHeldPose(){
    var cam = new THREE.PerspectiveCamera();
    cam.position.copy(PHONE_HOLD_CAM_POS);
    cam.lookAt(PHONE_HOLD_CAM_TARGET);
    cam.updateMatrixWorld(true);
    var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    var up      = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    var right   = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    var toPos = cam.position.clone()
      .addScaledVector(forward, PHONE_HELD_DIST)
      .addScaledVector(up, PHONE_HELD_UP)
      .addScaledVector(right, PHONE_HELD_SIDE);

    var faceCam = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(right, up, forward.clone().negate())
    );
    var tilt = new THREE.Quaternion().setFromAxisAngle(right, -PHONE_HELD_TILT);
    var roll = new THREE.Quaternion().setFromAxisAngle(forward, PHONE_HELD_ROLL);
    var toQuat = roll.multiply(tilt).multiply(faceCam);

    return { toPos: toPos, toQuat: toQuat, up: up, right: right, forward: forward };
  }

  function liftPhone(){
    var pose = computeHeldPose();

    var fromQuat = phone.quaternion.clone();
    if(fromQuat.dot(pose.toQuat) < 0) fromQuat.set(-fromQuat.x, -fromQuat.y, -fromQuat.z, -fromQuat.w);

    phoneHold = {
      t: 0,
      fromPos: phone.position.clone(), fromQuat: fromQuat,
      toPos: pose.toPos, toQuat: pose.toQuat, up: pose.up, right: pose.right
    };
    animateCameraTo(PHONE_HOLD_CAM_POS.clone(), PHONE_HOLD_CAM_TARGET.clone(), PHONE_HOLD_SECONDS, null);
  }

  var clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    var t = clock.getElapsedTime();

    if(shakeOffset){
      camera.position.sub(shakeOffset);
      shakeOffset = null;
    }

    lampGlow.intensity = 4.8 + Math.sin(t*1.6)*0.25;

    if(tabletIntro){
      tabletIntro.t += dt / 0.9;
      var q = Math.min(tabletIntro.t, 1);
      var e = 1 - Math.pow(1 - q, 3);
      tablet.position.y = 0.4 * (1 - e);
      if(q >= 1){ tablet.position.y = 0; tabletIntro = null; }
    }

    if(phoneIntro){
      phoneIntro.t += dt / PHONE_INTRO_SECONDS;
      var pq = Math.min(phoneIntro.t, 1);
      var pfall = pq * pq;
      var psettle = 1 - Math.pow(1 - pq, 3);
      phone.position.y = phoneRestY + PHONE_DROP * (1 - pfall);
      phone.rotation.y = PHONE_REST_ROT + PHONE_SPIN * (1 - psettle);
      phoneBlob.material.opacity = pfall;
      if(pq >= 1){
        phone.position.y = phoneRestY;
        phone.rotation.y = PHONE_REST_ROT;
        phoneBlob.material.opacity = 1;
        phoneIntro = null;
        phoneApproachDone = true;
        phone.wakeAndUnlock(PHONE_SCREEN_TIMING, function(){ phoneScreenDone = true; });
      }
    }

    if(phoneHold){
      phoneHold.t += dt / PHONE_HOLD_SECONDS;
      var hq = Math.min(phoneHold.t, 1);
      var he = hq < 0.5 ? 4 * hq * hq * hq : 1 - Math.pow(-2 * hq + 2, 3) / 2;
      phone.position.lerpVectors(phoneHold.fromPos, phoneHold.toPos, he);
      phone.position.y += Math.sin(he * Math.PI) * PHONE_HOLD_LIFT;
      phone.quaternion.copy(phoneHold.fromQuat).slerp(phoneHold.toQuat, he);
      phoneBlob.material.opacity = Math.max(0, 1 - he * 2.5);
      if(hq >= 1){
        phone.position.copy(phoneHold.toPos);
        phone.quaternion.copy(phoneHold.toQuat);
        phoneBlob.visible = false;
        phoneHeld = { pos: phoneHold.toPos, quat: phoneHold.toQuat, up: phoneHold.up, right: phoneHold.right, t0: t };
        phoneHold = null;
        phoneHoldDone = true;
        setTimeout(startPhoneGallerySwipe, PHONE_GALLERY_DELAY_MS);
      }
    }

    if(phoneFall) updatePhoneFall(dt);
    if(tabletBlink) updateTabletBlink(t);
    if(notebookChaos) updateNotebookChaos(dt);
    if(mugFall) updateMugFall(dt);
    if(papersChaos) updatePapersChaos(dt, t);
    if(galaxyWorld) galaxyWorld.update(dt, t);

    if(spaceImage){
      spaceImage.ash.update(dt);
      if(spaceImage.ash.done){
        scene.remove(spaceImage.anchor);
        spaceImage = null;
        spawnSpaceObjects();
      }
    }

    if(phoneHeld && PHONE_HELD_SWAY > 0){
      var sa = PHONE_HELD_SWAY * Math.min(1, (t - phoneHeld.t0) / 1.2);
      phone.position.copy(phoneHeld.pos)
        .addScaledVector(phoneHeld.up,    Math.sin(t * 1.1) * 0.010 * sa)
        .addScaledVector(phoneHeld.right, Math.sin(t * 0.8 + 1.3) * 0.008 * sa);
      swayQ.setFromEuler(swayE.set(
        Math.sin(t * 0.9) * 0.010 * sa,
        Math.sin(t * 0.7 + 0.6) * 0.012 * sa,
        Math.sin(t * 0.6) * 0.008 * sa
      ));
      phone.quaternion.copy(phoneHeld.quat).multiply(swayQ);
    }

    if(camAnim){
      camAnim.t += dt / camAnim.duration;
      var cq = Math.min(camAnim.t, 1);
      var ce = camAnim.ease ? camAnim.ease(cq) : 1 - Math.pow(1 - cq, 3);
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, ce);
      controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, ce);
      if(cq >= 1){
        var onDone = camAnim.onDone;
        camAnim = null;
        controls.enabled = true;
        if(onDone) onDone();
      }
    }

    controls.update();

    if(camShake) applyCameraShake(t);

    updateSpaceFollowers(t, dt);
    updateWake(dt);

    if(griegInside){
      griegWorld.present(dt, t, camera.aspect);   // entorno de grieg.js a pantalla completa
    } else {
      if(griegWorld && ceilingPoster) griegWorld.update(dt, t);
      renderer.render(scene, camera);
    }

    if(spaceArt && !griegInside){
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(hudScene, camera);
      renderer.autoClear = true;
    }
  }

  window.addEventListener('resize', function(){
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  function isFullscreen(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen(){
    var el = document.documentElement;
    if(!isFullscreen()){
      if(el.requestFullscreen) el.requestFullscreen();
      else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari (macOS)
    } else {
      if(document.exitFullscreen) document.exitFullscreen();
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen(); // Safari (macOS)
    }
  }

  window.addEventListener('keydown', function(e){
    if(e.code === 'KeyF') toggleFullscreen();
  });

  animate();
})();
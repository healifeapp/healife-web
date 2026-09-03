/* Yöntem bölümünün arkasındaki 3B nokta alanı.
   Kasıtlı olarak sade: tek bir malzeme, tek geometri, yavaş dalga. Amaç
   dikkat çekmek değil, koyu bölüme derinlik vermek.

   Three.js sayfa açılışında YÜKLENMEZ — bölüm görüş alanına yaklaşınca
   dinamik import ile gelir. Hareket azaltma açıksa hiç yüklenmez. */

const CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const COLS = 110;
const ROWS = 56;
const SPACING = 0.62;

export function initField(canvas) {
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Küçük ekranlarda hem yer yok hem de bedeli boşuna
  if (window.matchMedia("(max-width: 720px)").matches) return;

  let started = false;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true;
          io.disconnect();
          start(canvas).catch(() => {
            /* CDN erişilemezse sayfa aynen çalışmaya devam etsin */
          });
        }
      });
    },
    { rootMargin: "400px 0px" }
  );
  io.observe(canvas);
}

async function start(canvas) {
  const THREE = await import(/* @vite-ignore */ CDN);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  camera.position.set(0, -21, 11);
  camera.lookAt(0, 2, 0);

  // Düzlemdeki noktalar — z ekseni animasyonla oynayacak
  const count = COLS * ROWS;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = [];

  const lime = new THREE.Color(0xbbe448);
  let i = 0;
  for (let ry = 0; ry < ROWS; ry++) {
    for (let cx = 0; cx < COLS; cx++) {
      const x = (cx - COLS / 2) * SPACING;
      const y = (ry - ROWS / 2) * SPACING;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      base.push(x, y);

      // Merkezden uzaklaştıkça sön — kenarlarda kutu hissi kalmasın
      const d = Math.min(1, Math.hypot(x / (COLS * SPACING * 0.5), y / (ROWS * SPACING * 0.5)));
      const k = Math.pow(1 - d, 1.7);
      colors[i * 3] = lime.r * k;
      colors[i * 3 + 1] = lime.g * k;
      colors[i * 3 + 2] = lime.b * k;
      i++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.075,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.rotation.x = -0.32;
  scene.add(points);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Görüş alanı dışındayken çizme
  let visible = true;
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) requestAnimationFrame(frame);
    },
    { rootMargin: "120px 0px" }
  ).observe(canvas);

  const pos = geometry.attributes.position;
  let t = 0;
  let last = performance.now();

  function frame(now) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt * 0.42;

    for (let n = 0; n < count; n++) {
      const x = base[n * 2];
      const y = base[n * 2 + 1];
      // İki farklı frekans üst üste — düzenli değil ama kaotik de değil
      pos.array[n * 3 + 2] =
        Math.sin(x * 0.22 + t) * 0.85 +
        Math.cos(y * 0.17 - t * 0.75) * 0.7 +
        Math.sin((x + y) * 0.09 + t * 0.4) * 0.5;
    }
    pos.needsUpdate = true;

    points.rotation.z = Math.sin(t * 0.08) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

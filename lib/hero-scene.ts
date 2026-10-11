import * as THREE from "three";

// Simplex noise 3D (Ashima Arts / Stefan Gustavson, MIT)
const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${noise}
float displace(vec3 p){
  float n = snoise(p * 1.1 + uTime * 0.25);
  n += 0.5 * snoise(p * 2.3 - uTime * 0.18);
  return n * uIntensity;
}
void main(){
  vec3 p = position;
  float d = displace(normalize(p));
  vec3 displaced = p + normal * d;
  // normale recalculée par différences finies
  vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 0.001));
  vec3 b = normalize(cross(normal, t));
  float e = 0.01;
  vec3 pt = p + t * e; vec3 pb = p + b * e;
  pt += normalize(pt) * displace(normalize(pt));
  pb += normalize(pb) * displace(normalize(pb));
  vec3 n = normalize(cross(pt - displaced, pb - displaced));
  if (dot(n, normal) < 0.0) n = -n;
  vNormal = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vView = normalize(-mv.xyz);
  vNoise = d;
  gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
vec3 palette(float t){
  // violet -> cyan -> lime : film irisé
  vec3 a = vec3(0.5); vec3 b = vec3(0.5);
  vec3 c = vec3(1.0); vec3 d = vec3(0.72, 0.42, 0.18);
  return a + b * cos(6.28318 * (c * t + d));
}
void main(){
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
  vec3 light = normalize(vec3(uMouse * 1.6, 1.4));
  float diff = max(dot(vNormal, light), 0.0);
  float spec = pow(max(dot(reflect(-light, vNormal), vView), 0.0), 48.0);
  vec3 iri = palette(fres * 0.9 + vNoise * 0.6 + uTime * 0.03);
  vec3 base = vec3(0.025, 0.025, 0.04);
  vec3 col = base + iri * (fres * 1.25 + diff * 0.18);
  col += spec * 0.9;
  gl_FragColor = vec4(col, 1.0);
}`;

// Monte la scène dans le canvas et renvoie une fonction de nettoyage
export function initHeroScene(canvas: HTMLCanvasElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Mobiles et tablettes : GPU modeste et écran dense, on allège tout le rendu
  const light = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !light, alpha: true, powerPreference: "low-power" });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, light ? 1.25 : 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 0.32 },
    uMouse: { value: new THREE.Vector2() },
  };
  // Le vertex shader évalue le bruit 6 fois par sommet : le maillage est le poste le plus coûteux.
  // detail 64 ≈ 85k triangles sur desktop, 28 ≈ 17k sur mobile où la sphère est petite à l'écran.
  const blobGeo = new THREE.IcosahedronGeometry(1.35, light ? 28 : 64);
  const blobMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
  const blob = new THREE.Mesh(blobGeo, blobMat);
  scene.add(blob);

  // poussière d'étoiles autour de la sphère
  const count = light ? 400 : 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 3.5;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.55 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const mouse = new THREE.Vector2();
  const target = new THREE.Vector2();
  const onPointer = (e: PointerEvent) => {
    target.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };
  window.addEventListener("pointermove", onPointer);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // sur mobile la sphère se place au-dessus du titre, sur desktop à droite
    const wide = w > 900;
    if (wide) {
      // desktop : à droite du titre, rognée par le bord de l'écran
      blob.position.set(1.55, 0, 0);
      camera.position.z = 6;
    } else {
      // mobile et tablette portrait : au-dessus du titre, décalée à droite et rognée par le bord
      camera.position.z = 9.5;
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const halfW = halfH * camera.aspect;
      blob.position.set(halfW * 0.6, halfH * 0.2, 0);
    }
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  let visible = true;
  const visibilityObserver = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  visibilityObserver.observe(canvas);

  const start = performance.now();
  // L'animation est lente : 30 images/s suffisent sur mobile et divisent le travail du GPU par deux
  const minDelta = light ? 1000 / 30 : 0;
  let last = 0;
  let raf = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!visible || now - last < minDelta) return;
    last = now;
    const t = (now - start) / 1000;
    mouse.lerp(target, 0.05);
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);
    uniforms.uTime.value = t;
    uniforms.uMouse.value.copy(mouse);
    uniforms.uIntensity.value = 0.28 + mouse.length() * 0.12 + scroll * 0.35;
    blob.rotation.y = t * 0.08 + mouse.x * 0.4;
    blob.rotation.x = mouse.y * 0.3;
    blob.scale.setScalar(1 - scroll * 0.25);
    dust.rotation.y = t * 0.02;
    dust.rotation.x = mouse.y * 0.1;
    renderer.render(scene, camera);
  }
  if (reduce) {
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointer);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    blobGeo.dispose();
    blobMat.dispose();
    dustGeo.dispose();
    dustMat.dispose();
    renderer.dispose();
  };
}

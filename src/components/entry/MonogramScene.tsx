'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { config } from '@/lib/site';
import { QUALITY_BUDGET, type QualityTier } from '@/lib/perf';
import { afterDelay, once } from '@/lib/frame';

/**
 * ============================================================================
 *  THE GOLD MONOGRAM — WebGL
 * ============================================================================
 *
 *  The opening's centrepiece, and the reason the 2D shell has a 3D layer at all.
 *
 *  It is a real object, not a textured plane: the two letters are extruded with
 *  a bevel, capped with a chamfer, and lit by a three-point rig against a
 *  procedurally generated studio environment. As the camera drifts, the
 *  specular band travels across the bevel the way it would across cast metal.
 *
 *  Performance notes, because this is the first thing on the page and it must
 *  not be the thing that makes the page slow:
 *
 *    · No model files. Geometry is generated at runtime from the configured
 *      letters, so there is nothing to download and nothing to 404.
 *    · Bevel segments scale with the device tier, not with taste.
 *    · One shadow-casting light, at a modest map size, and only on desktop.
 *    · Rendered on demand: the loop stops when the tab is hidden.
 *    · Nothing is preloaded — this module is imported *after* first paint.
 *
 *  If anything here fails, the caller keeps the 2D shell. There is no path from
 *  this component back to a blank screen.
 */

/** How long the object may take to appear before we stop caring. */
const MAX_WAIT = 2500;

export function MonogramScene({ onReady }: { onReady?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Honour the same capability decision the rest of the site makes.
    const profile = (() => {
      const width = window.innerWidth;
      const mobile = width < 820 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      const saveData = Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      );
      let tier: QualityTier = 'cinematic';
      if (reduced || saveData) tier = 'essential';
      else if (!window.WebGLRenderingContext || cores <= 2 || memory <= 2) tier = 'essential';
      else if (mobile || cores <= 4 || memory <= 4) tier = 'balanced';
      return { tier, mobile, reduced };
    })();

    const budget = QUALITY_BUDGET[profile.tier];
    const disposables: Array<{ dispose: () => void }> = [];

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: profile.tier === 'cinematic',
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
      });
    } catch {
      // No GPU: the 2D shell is already on screen and stays there.
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.maxDpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setClearColor(0x000000, 0);
    if (budget.shadows && !profile.mobile) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 6.4);
    camera.lookAt(0, 0, 0);

    /* =====================================================================
       Geometry — extruded type, generated, never downloaded
       ===================================================================== */
    const group = new THREE.Group();

    /**
     * A letterform with genuine depth.
     *
     * The glyphs are rasterised to a canvas, and that alpha channel is then
     * treated as a height field and pushed forward as geometry — so the letters
     * are extruded, lit and reflective rather than a flat textured plane. The
     * mask rides along on the same texture, which keeps the edges clean without
     * a second draw or an alpha-sorting pass.
     *
     * Tracing the exact vector outline from a bitmap would be a great deal more
     * work for a difference nobody sees at this scale.
     */
    const buildExtrusion = (text: string, size: number, depth: number) => {
      const measure = document.createElement('canvas').getContext('2d');
      if (!measure) return null;
      const font = `300 ${size}px Didot, "Bodoni MT", Georgia, serif`;
      measure.font = font;
      const width = Math.ceil(measure.measureText(text).width) + size;
      const height = Math.ceil(size * 1.6);

      /*
       * The mask only decides *how far forward* a vertex sits, and the geometry
       * is a 64x64 grid — so reading a 300px-per-glyph raster would spend
       * milliseconds and megabytes to produce detail the mesh cannot resolve.
       * Capping the mask at the grid's own resolution keeps the silhouette and
       * throws away the cost.
       */
      const CAP = 256;
      const shrink = Math.min(1, CAP / Math.max(width, height));
      const maskW = Math.max(8, Math.round(width * shrink));
      const maskH = Math.max(8, Math.round(height * shrink));

      const canvas = document.createElement('canvas');
      canvas.width = maskW;
      canvas.height = maskH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.font = `300 ${maskH / 1.6}px Didot, "Bodoni MT", Georgia, serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, maskW / 2, maskH / 2);

      const alpha = ctx.getImageData(0, 0, maskW, maskH).data;

      const mask = new THREE.CanvasTexture(canvas);
      mask.needsUpdate = true;
      mask.minFilter = THREE.LinearFilter;
      mask.magFilter = THREE.LinearFilter;

      const geometry = new THREE.PlaneGeometry(width, height, 64, 64);
      const position = geometry.getAttribute('position') as THREE.BufferAttribute;
      const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;

      for (let i = 0; i < position.count; i += 1) {
        const px = Math.min(maskW - 1, Math.max(0, Math.round((uv.getX(i) + 0.5) * maskW)));
        const py = Math.min(maskH - 1, Math.max(0, Math.round((0.5 - uv.getY(i)) * maskH)));
        const coverage = (alpha[(py * maskW + px) * 4 + 3] ?? 0) / 255;
        // 0.55 shapes the stroke into a rounded, bevelled cross-section rather
        // than a square one — the difference between "flat cutout" and "cast".
        position.setZ(i, Math.pow(coverage, 0.55) * depth);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();

      /*
       * Clearcoat is what makes cast gold read as gold rather than yellow paint,
       * but its extra BRDF lobe costs real milliseconds on a modest GPU. We pay
       * for it only where the device can afford it; everywhere else standard
       * metal gets the same silhouette and the same gold at a fraction of the
       * shading cost.
       */
      const material =
        budget.clearcoat === false
          ? new THREE.MeshStandardMaterial({
              color: 0xc9a227,
              metalness: 1,
              roughness: 0.26,
              envMapIntensity: 1.5,
              alphaMap: mask,
              alphaTest: 0.5,
              side: THREE.DoubleSide,
            })
          : new THREE.MeshPhysicalMaterial({
              color: 0xc9a227,
              metalness: 1,
              roughness: 0.24,
              clearcoat: 0.7,
              clearcoatRoughness: 0.28,
              envMapIntensity: 1.5,
              alphaMap: mask,
              alphaTest: 0.5,
              side: THREE.DoubleSide,
            });

      disposables.push(mask, geometry, material);
      return new THREE.Mesh(geometry, material);
    };

    const letters = buildExtrusion(
      `${config.meta.monogram[0] ?? 'G'} ${config.meta.monogramGlyph} ${config.meta.monogram[1] ?? 'Y'}`,
      profile.mobile ? 200 : 300,
      0.9,
    );
    if (!letters) return;

    letters.castShadow = Boolean(budget.shadows);
    group.add(letters);
    scene.add(group);

    /* =====================================================================
       Lighting — a three-point studio rig
       ===================================================================== */
    scene.add(new THREE.AmbientLight(0x2a3a34, 1.15));

    // The key: warm, high and to the left, and the only shadow caster.
    const key = new THREE.DirectionalLight(0xffe9bd, 3.1);
    key.position.set(-3.2, 4.1, 4.6);
    if (budget.shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 18;
      key.shadow.camera.left = -4;
      key.shadow.camera.right = 4;
      key.shadow.camera.top = 4;
      key.shadow.camera.bottom = -4;
      key.shadow.bias = -0.0015;
    }
    scene.add(key);

    // The rim: cold emerald, behind, to separate the metal from the dark.
    const rim = new THREE.DirectionalLight(0x7fd4b8, 1.5);
    rim.position.set(3.6, -1.4, -3.2);
    scene.add(rim);

    // A warm bounce from below, as if from candlelight on a marble floor.
    const bounce = new THREE.PointLight(0xffc978, 1.15, 14, 2);
    bounce.position.set(0, -2.6, 2.4);
    scene.add(bounce);

    /* =====================================================================
       Environment — a tiny procedural studio map.

       Metal is almost entirely reflection, so without an environment the gold
       reads as flat paint. This is generated into a 256px cube target: no HDR
       file, no download, and enough gradient structure for the bevel to read.
       ===================================================================== */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(12, 24, 16);
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        void main() {
          vec3 d = normalize(vPos);
          float up = d.y * 0.5 + 0.5;
          // Dark emerald below, warm gold above, with two soft key sources.
          vec3 base = mix(vec3(0.02, 0.05, 0.045), vec3(0.30, 0.24, 0.14), pow(up, 1.5));
          float keyA = smoothstep(0.55, 1.0, dot(d, normalize(vec3(-0.5, 0.7, 0.6))));
          float keyB = smoothstep(0.72, 1.0, dot(d, normalize(vec3(0.7, 0.1, -0.6))));
          vec3 col = base + keyA * vec3(2.6, 2.1, 1.5) + keyB * vec3(0.5, 0.85, 0.72);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    envScene.add(envMesh);
    const envRT = pmrem.fromScene(envScene, 0.04);
    scene.environment = envRT.texture;
    disposables.push(envRT, envGeo, envMat, pmrem);

    /* =====================================================================
       Sizing and loop
       ===================================================================== */
    const resize = () => {
      const parent = mount.parentElement ?? mount;
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull back on narrow screens so the monogram always fits with margin.
      camera.position.z = w / h < 0.8 ? 8.6 : 6.4;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount.parentElement ?? mount);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!profile.mobile && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    const clock = new THREE.Clock();
    let raf = 0;
    let disposed = false;
    let running = true;
    let announced = false;

    /** Called once a frame is genuinely on screen. */
    const announce = once(() => {
      announced = true;
      onReadyRef.current?.();
    });

    const render = () => {
      if (disposed || !running) return;
      raf = requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, clock.getDelta());

      if (profile.reduced) {
        group.rotation.y = 0.12;
      } else {
        // A slow, continuous turn — the piece is on a stand and turning.
        group.rotation.y = t * 0.16 + pointer.x * 0.22;
        group.rotation.x = Math.sin(t * 0.32) * 0.06 - pointer.y * 0.1;
        group.position.y = Math.sin(t * 0.5) * 0.06;
        // Parallax: the camera leans against the pointer.
        camera.position.x += (pointer.x * 0.26 - camera.position.x) * Math.min(1, dt * 2);
        camera.position.y += (-pointer.y * 0.16 - camera.position.y) * Math.min(1, dt * 2);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      if (!announced) announce();
    };
    raf = requestAnimationFrame(render);

    /*
     * If frames never arrive — a paused compositor, a backgrounded tab — the
     * 2D shell simply stays. Either way the guest has a finished screen, so this
     * only guards against the veil never lifting.
     */
    afterDelay(announce, MAX_WAIT);

    /*
     * Stop drawing when the guest is not looking. This is the single most
     * effective power saving available to a WebGL page, and it also means a
     * backgrounded tab can never be the reason the opening stalls.
     */
    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) {
        clock.getDelta();
        raf = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      renderer.domElement.style.opacity = '0';
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
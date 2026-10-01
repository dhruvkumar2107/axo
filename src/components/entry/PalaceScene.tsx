'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import {
  createDoorTextures,
  createMoteTexture,
  createPetalTexture,
  createShaftTexture,
  createStoneTexture,
} from './textures';
import { QUALITY_BUDGET, startFpsWatchdog, type QualityTier } from '@/lib/perf';

/**
 * ============================================================================
 *  THE PALACE — WebGL
 * ============================================================================
 *
 *  A pair of carved timber doors at night, in fog, lit from within.
 *
 *  Scene composition, front to back:
 *      dust and petals in the air  →  the stone surround and threshold
 *      the two door leaves       →  brass hardware, catching the key light
 *      the interior              →  warm emissive field and three light shafts
 *
 *  The camera drifts forward very slowly while the doors are closed, so the
 *  scene is never static even before the guest touches anything. On ENTER the
 *  leaves swing inward over ~5.5s while the interior light ramps up and the
 *  camera continues its push, which reads as walking in rather than watching.
 *
 *  Everything is procedural and disposed on teardown. The renderer is capped at
 *  1.75× DPR and the whole scene is skipped entirely on devices that opt out.
 */

export interface PalaceSceneProps {
  /** The entry sequence moved from 'doors' to 'entering'. */
  opening: boolean;
  /** Fired once the doors have finished swinging. */
  onOpened: () => void;
  /** Called if the scene detects it cannot hold frame rate. */
  onDemote: () => void;
  /** Called once the first frame is genuinely on screen. */
  onReady?: () => void;
  tier: QualityTier;
  /** Disables the pointer parallax on touch devices. */
  interactive: boolean;
}

/** Duration of the door swing, in seconds. */
const OPEN_SECONDS = 5.5;
/** How far the camera travels during the whole sequence. */
const CAMERA_PUSH = 3.6;

/** Long, calm ease — the doors have mass. */
const easeOpen = (t: number) => 1 - Math.pow(1 - t, 3.2);

export function PalaceScene({
  opening,
  onOpened,
  onDemote,
  onReady,
  tier,
  interactive,
}: PalaceSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef(opening);
  const onOpenedRef = useRef(onOpened);
  /** Late-bound so the effect never needs these in its dependency list. */
  const onDemoteRef = useRef(onDemote);
  const onReadyRef = useRef(onReady);

  // Keep the latest props available to the render loop without reading them
  // during render.
  useEffect(() => {
    openingRef.current = opening;
    onOpenedRef.current = onOpened;
    onDemoteRef.current = onDemote;
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const budget = QUALITY_BUDGET[tier];
    const disposables: Array<{ dispose: () => void }> = [];

    /* =====================================================================
       Renderer
       ===================================================================== */
    const scene = new THREE.Scene();
    // Warm, dense fog: the far end of the courtyard disappears.
    scene.fog = new THREE.FogExp2(0x060d0b, 0.088);
    scene.background = new THREE.Color(0x050908);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 60);
    camera.position.set(0, 1.62, 8.4);
    camera.lookAt(0, 1.72, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: tier === 'cinematic',
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      });
    } catch {
      onDemoteRef.current();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.maxDpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Filmic tone mapping is what stops the warm interior from clipping to
    // white the moment the doors open.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if (budget.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    mount.appendChild(renderer.domElement);

    const contextLost = (event: Event) => {
      event.preventDefault();
      onDemoteRef.current();
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);

    /* =====================================================================
       Textures
       ===================================================================== */
    const doorTex = createDoorTextures();
    const stoneTex = createStoneTexture();
    const moteTex = createMoteTexture();
    const shaftTex = createShaftTexture();
    const petalTex = createPetalTexture();
    disposables.push(doorTex, stoneTex, moteTex, shaftTex, petalTex);

    /* =====================================================================
       Materials
       ===================================================================== */
    const wood = new THREE.MeshStandardMaterial({
      map: doorTex.map,
      bumpMap: doorTex.bump,
      bumpScale: 0.035,
      roughnessMap: doorTex.roughness,
      roughness: 0.78,
      metalness: 0.06,
      color: 0xffffff,
    });

    const brass = new THREE.MeshStandardMaterial({
      color: 0x8a6a2c,
      roughness: 0.32,
      metalness: 0.92,
    });

    const brassDark = new THREE.MeshStandardMaterial({
      color: 0x5d4720,
      roughness: 0.55,
      metalness: 0.8,
    });

    const stone = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: 0x6a6154,
      roughness: 0.94,
      metalness: 0.02,
    });

    /* =====================================================================
       Lighting
       A cool moon from above-left for the exterior, a warm interior that
       starts almost dark and takes over as the doors open.
       ===================================================================== */
    const moon = new THREE.DirectionalLight(0x9fb8d8, 0.42);
    moon.position.set(-5, 7, 4);
    scene.add(moon);

    const ambient = new THREE.AmbientLight(0x1c2b26, 0.5);
    scene.add(ambient);

    /** The warm light inside the hall. Its intensity is the story of the open. */
    const interior = new THREE.PointLight(0xffcf82, 0.4, 26, 1.6);
    interior.position.set(0, 2.1, -3.4);
    scene.add(interior);

    const interiorFill = new THREE.PointLight(0xffb765, 0.22, 18, 1.8);
    interiorFill.position.set(0, 1.2, -1.2);
    scene.add(interiorFill);

    /** Rim light picking out the outer edge of each leaf. */
    let rimLeft: THREE.PointLight | null = null;
    let rimRight: THREE.PointLight | null = null;
    if (budget.rimLight) {
      rimLeft = new THREE.PointLight(0xffd9a0, 0.9, 9, 2);
      rimLeft.position.set(-3.1, 1.8, 1.4);
      scene.add(rimLeft);
      rimRight = new THREE.PointLight(0xffd9a0, 0.9, 9, 2);
      rimRight.position.set(3.1, 1.8, 1.4);
      scene.add(rimRight);
    }

    /* =====================================================================
       Architecture — the stone surround
       ===================================================================== */
    const surround = new THREE.Group();
    scene.add(surround);

    const PIER_W = 0.72;
    const DOOR_W = 3.3;
    const DOOR_H = 4.1;
    const HALF = DOOR_W / 2;

    // Flanking piers
    for (const side of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(PIER_W, DOOR_H + 1.1, 1.5), stone);
      pier.position.set(side * (HALF + PIER_W / 2), (DOOR_H + 1.1) / 2 - 0.5, -0.35);
      if (budget.shadows) {
        pier.castShadow = true;
        pier.receiveShadow = true;
      }
      surround.add(pier);

      // Carved capital band on each pier
      const capital = new THREE.Mesh(new THREE.BoxGeometry(PIER_W + 0.16, 0.2, 1.66), stone);
      capital.position.set(side * (HALF + PIER_W / 2), DOOR_H + 0.42, -0.35);
      surround.add(capital);
    }

    // Lintel and the carved frieze above it
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + PIER_W * 2 + 0.3, 0.62, 1.6), stone);
    lintel.position.set(0, DOOR_H + 0.85, -0.35);
    surround.add(lintel);

    const frieze = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_W + PIER_W * 2 + 0.6, 0.34, 1.4),
      stone,
    );
    frieze.position.set(0, DOOR_H + 1.32, -0.5);
    surround.add(frieze);

    // Threshold slab, catching the light from within
    const threshold = new THREE.Mesh(
      new THREE.PlaneGeometry(DOOR_W + PIER_W * 2, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a4438, roughness: 0.8, metalness: 0.05 }),
    );
    threshold.rotation.x = -Math.PI / 2;
    threshold.position.set(0, -0.02, 1.6);
    threshold.receiveShadow = budget.shadows;
    surround.add(threshold);

    // Two worn steps down to the courtyard
    for (let i = 0; i < 2; i += 1) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(DOOR_W + PIER_W * 2 + 0.6 - i * 0.3, 0.16, 1.1),
        stone,
      );
      step.position.set(0, -0.12 - i * 0.16, 2.1 + i * 0.95);
      surround.add(step);
    }

    /* =====================================================================
       The doors
       ===================================================================== */
    const LEAF_W = HALF;
    const LEAF_H = DOOR_H;
    const LEAF_T = 0.19;

    /** Builds one leaf. The hinge is the group's own origin. */
    function buildLeaf(side: -1 | 1) {
      const hinge = new THREE.Group();
      // Hinge sits on the outer jamb; the leaf extends inward from it.
      hinge.position.x = side * HALF;

      const slab = new THREE.Mesh(new THREE.BoxGeometry(LEAF_W, LEAF_H, LEAF_T), wood);
      // Move the slab so its inner edge meets the centre line at x = 0.
      slab.position.x = (-side * LEAF_W) / 2;
      slab.position.y = LEAF_H / 2;
      if (budget.shadows) {
        slab.castShadow = true;
        slab.receiveShadow = true;
      }
      hinge.add(slab);

      // Vertical stile on the meeting edge — where the two leaves almost touch.
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, LEAF_H, LEAF_T + 0.05),
        brassDark,
      );
      stile.position.set(-side * 0.04, LEAF_H / 2, 0);
      hinge.add(stile);

      // Brass banding across the leaf
      for (const y of [LEAF_H * 0.34, LEAF_H * 0.68]) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(LEAF_W - 0.06, 0.05, LEAF_T + 0.02),
          brassDark,
        );
        band.position.set((-side * LEAF_W) / 2, y, 0);
        hinge.add(band);
      }

      // Handle: a heavy ring on a backplate, at hand height.
      const handleX = -side * (LEAF_W - 0.42);
      const backplate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 24), brass);
      backplate.rotation.x = Math.PI / 2;
      backplate.position.set(handleX, LEAF_H * 0.44, LEAF_T / 2 + 0.02);
      hinge.add(backplate);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 12, 32), brass);
      ring.position.set(handleX, LEAF_H * 0.44 - 0.26, LEAF_T / 2 + 0.06);
      ring.rotation.x = Math.PI / 2;
      hinge.add(ring);

      const dropBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 10), brass);
      dropBar.position.set(handleX, LEAF_H * 0.44 - 0.15, LEAF_T / 2 + 0.06);
      hinge.add(dropBar);

      // Hinge straps
      for (const y of [LEAF_H * 0.16, LEAF_H * 0.84]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.03), brassDark);
        strap.position.set(-side * 0.25, y, LEAF_T / 2 + 0.015);
        hinge.add(strap);
      }

      return hinge;
    }

    const leftLeaf = buildLeaf(-1);
    const rightLeaf = buildLeaf(1);
    scene.add(leftLeaf, rightLeaf);

    /* =====================================================================
       Interior — the warm field behind the doors and its light shafts
       ===================================================================== */
    const glowTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const g = ctx.createRadialGradient(128, 150, 10, 128, 150, 128);
        g.addColorStop(0, 'rgba(255,236,190,1)');
        g.addColorStop(0.4, 'rgba(240,196,116,0.7)');
        g.addColorStop(1, 'rgba(180,138,62,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();
    disposables.push(glowTexture);

    const interiorField = new THREE.Mesh(
      new THREE.PlaneGeometry(DOOR_W * 1.4, DOOR_H * 1.2),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    interiorField.position.set(0, DOOR_H * 0.42, -3.2);
    scene.add(interiorField);

    // Light shafts, angled as if from high windows behind the guest.
    const shafts: THREE.Mesh[] = [];
    if (budget.godRays) {
      for (const [x, rot, scale] of [
        [-0.9, 0.22, 1],
        [0.15, 0.1, 1.25],
        [1.1, -0.05, 0.9],
      ] as const) {
        const shaft = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 7),
          new THREE.MeshBasicMaterial({
            map: shaftTex,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        shaft.position.set(x, 2.6, -1.6);
        shaft.rotation.z = rot;
        shaft.scale.set(scale, 1, 1);
        scene.add(shaft);
        shafts.push(shaft);
      }
    }

    /* =====================================================================
       Diyas — oil lamps on the threshold, the only light at ground level
       ===================================================================== */
    const diyaMaterial = new THREE.MeshBasicMaterial({ color: 0xffd08a });
    const flamePositions: Array<[number, number]> = [
      [-2.35, 1.15],
      [-1.5, 1.55],
      [1.5, 1.55],
      [2.35, 1.15],
    ];
    for (const [x, z] of flamePositions) {
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.05, 12), brassDark);
      bowl.position.set(x, 0.03, z);
      scene.add(bowl);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), diyaMaterial);
      flame.position.set(x, 0.1, z);
      flame.scale.y = 1.8;
      scene.add(flame);
    }

    // Only two real point lights — the rest of the glow is emissive geometry,
    // which costs a fraction of a light and reads identically at this scale.
    const diyaLightL = new THREE.PointLight(0xffb055, 0.5, 5, 2);
    diyaLightL.position.set(-1.5, 0.22, 1.55);
    scene.add(diyaLightL);
    const diyaLightR = new THREE.PointLight(0xffb055, 0.5, 5, 2);
    diyaLightR.position.set(1.5, 0.22, 1.55);
    scene.add(diyaLightR);

    /* =====================================================================
       Dust and petals
       ===================================================================== */
    interface Drift {
      points: THREE.Points;
      velocity: Float32Array;
      phase: Float32Array;
    }

    function makeDrift(
      count: number,
      texture: THREE.Texture,
      bounds: { x: number; y: number; z: number },
      size: number,
      fall: number,
      spread: number,
    ): Drift | null {
      if (count <= 0) return null;
      const positions = new Float32Array(count * 3);
      const velocity = new Float32Array(count);
      const phase = new Float32Array(count);

      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * bounds.x;
        positions[i * 3 + 1] = Math.random() * bounds.y;
        positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
        velocity[i] = fall * (0.45 + Math.random() * 0.9);
        phase[i] = Math.random() * Math.PI * 2;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size,
        map: texture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);

      // Lateral sway amplitude, stored for the update loop.
      (points.userData as { spread: number }).spread = spread;
      return { points, velocity, phase };
    }

    const dust = makeDrift(budget.particles, moteTex, { x: 9, y: 5, z: 6 }, 0.035, 0.012, 0.16);
    const petals = makeDrift(budget.petals, petalTex, { x: 7, y: 5.5, z: 3.4 }, 0.085, 0.075, 0.5);
    if (petals) {
      (petals.points.material as THREE.PointsMaterial).opacity = 0;
    }

    /* =====================================================================
       Sizing
       ===================================================================== */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull the camera back on tall/narrow screens so the doors always fit.
      camera.fov = camera.aspect < 0.75 ? 56 : camera.aspect < 1.2 ? 49 : 44;
      camera.updateProjectionMatrix();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    /* =====================================================================
       Pointer parallax — barely there, and never on touch
       ===================================================================== */
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    if (interactive && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    /* =====================================================================
       The loop
       ===================================================================== */
    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf = 0;
    let openStart = -1;
    let openProgress = 0;
    let completed = false;
    let disposed = false;
    let announcedReady = false;

    /** Targets the lights chase, so nothing ever snaps. */
    let interiorTarget = 0.4;
    let interiorFillTarget = 0.22;

    const render = () => {
      if (disposed) return;
      raf = requestAnimationFrame(render);

      // `getDelta()` advances the internal clock, so elapsed must be accumulated
      // by hand — calling `getElapsedTime()` first would swallow the delta.
      const dt = Math.min(0.05, clock.getDelta());
      elapsed += dt;
      const t = elapsed;

      /* --- The open ----------------------------------------------------- */
      if (openingRef.current && openStart < 0) openStart = t;

      if (openStart >= 0) {
        openProgress = Math.min(1, (t - openStart) / OPEN_SECONDS);
        const eased = easeOpen(openProgress);

        leftLeaf.rotation.y = eased * 1.58;
        rightLeaf.rotation.y = -eased * 1.58;

        // The interior takes over as the doors part.
        interiorTarget = 0.4 + eased * 9.5;
        interiorFillTarget = 0.22 + eased * 2.6;
        interiorField.material.opacity = 0.5 + eased * 0.45;
        for (const shaft of shafts) {
          (shaft.material as THREE.MeshBasicMaterial).opacity = 0.16 + eased * 0.4;
        }
        if (petals) {
          (petals.points.material as THREE.PointsMaterial).opacity = eased * 0.85;
        }
        // The rim light fades as the leaves turn away from it.
        if (rimLeft && rimRight) {
          rimLeft.intensity = 0.9 * (1 - eased);
          rimRight.intensity = 0.9 * (1 - eased);
        }
        renderer.toneMappingExposure = 1.05 + eased * 0.22;

        if (openProgress >= 1 && !completed) {
          completed = true;
          onOpenedRef.current();
        }
      }

      /* --- Camera ------------------------------------------------------- */
      // A slow, endless creep while waiting; a decisive push on the way in.
      const idle = openingRef.current ? 0 : Math.sin(t * 0.09) * 0.5 + 0.5;
      const push = easeOpen(openProgress) * CAMERA_PUSH;
      camera.position.z = 8.4 - idle * 0.55 - push;
      camera.position.x += (pointer.x * 0.12 - camera.position.x) * Math.min(1, dt * 2.2);
      camera.position.y = 1.62 - pointer.y * 0.07 - push * 0.045;
      camera.lookAt(0, 1.72 - push * 0.06, 0);

      /* --- Atmosphere --------------------------------------------------- */
      // Lights ease toward their targets rather than snapping to them.
      const ease = 1 - Math.pow(0.001, dt);
      interior.intensity += (interiorTarget - interior.intensity) * ease;
      interiorFill.intensity += (interiorFillTarget - interiorFill.intensity) * ease;

      // Flames breathe, so the warm light is never static.
      const flicker = 0.85 + Math.sin(t * 7.3) * 0.1 + Math.sin(t * 3.1) * 0.08;
      diyaLightL.intensity = 0.5 * flicker;
      diyaLightR.intensity = 0.5 * (1.7 - flicker);

      // Update drift positions.
      for (const drift of [dust, petals]) {
        if (!drift) continue;
        const spread = (drift.points.userData as { spread: number }).spread;
        const attr = drift.points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < drift.velocity.length; i += 1) {
          const fall = drift.velocity[i];
          const phase = drift.phase[i];
          const x = arr[i * 3];
          const y = arr[i * 3 + 1];
          if (fall === undefined || phase === undefined || x === undefined || y === undefined) {
            continue;
          }

          const nextY = y - fall * dt;
          const nextX = x + Math.sin(t * 0.5 + phase) * spread * dt;

          arr[i * 3] = nextX;
          // Reset above the top of frame, keeping the fall seamless.
          arr[i * 3 + 1] = nextY < -0.4 ? 5 : nextY;
        }
        attr.needsUpdate = true;
      }

      renderer.render(scene, camera);

      // Announce readiness only once a frame has actually been presented, so
      // the copy above never fades in against an empty canvas.
      if (!announcedReady) {
        announcedReady = true;
        onReadyRef.current?.();
      }
    };

    raf = requestAnimationFrame(render);

    /* --- Watchdog: demote rather than stutter --------------------------- */
    const stopWatchdog =
      tier === 'essential' ? () => undefined : startFpsWatchdog({ onDemote: onDemoteRef.current });

    /* =====================================================================
       Teardown
       ===================================================================== */
    return () => {
      disposed = true;
      stopWatchdog();
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      disposables.forEach((d) => d.dispose());

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [tier, interactive]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}

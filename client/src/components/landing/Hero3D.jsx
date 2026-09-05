import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Isometric lattice of glass cubes — one node per supported language.
 * Lazy-loaded and landing-only (spec §11): none of this reaches the practice bundle.
 * Uses three.js directly rather than a renderer wrapper to keep the chunk small.
 */
export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = () => document.documentElement.classList.contains('dark');

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(9, 8, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const TEAL = 0x0d9488;
    const SAFFRON = 0xf97316;
    const group = new THREE.Group();
    scene.add(group);

    // 11 nodes on a 4x3 lattice, minus one corner — one per language.
    const coords = [];
    for (let x = -1.5; x <= 1.5; x += 1) {
      for (let z = -1; z <= 1; z += 1) coords.push([x, z]);
    }
    coords.pop();

    const geometry = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    const edges = new THREE.EdgesGeometry(geometry);
    const cubes = [];

    coords.forEach(([x, z], i) => {
      // Every third node takes the saffron accent, so the grid reads as a rhythm.
      const accent = i % 3 === 1;
      const color = accent ? SAFFRON : TEAL;

      const solid = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: accent ? 0.5 : 0.28 })
      );
      const wire = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );

      const node = new THREE.Group();
      node.add(solid, wire);
      node.position.set(x * 1.25, 0, z * 1.25);
      node.userData = { phase: i * 0.55, baseY: 0 };
      group.add(node);
      cubes.push(node);
    });

    // Ground plane grid to anchor the lattice isometrically.
    const grid = new THREE.GridHelper(9, 9, TEAL, TEAL);
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = -1.2;
    group.add(grid);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const frustum = 4.2;
      camera.left = -frustum * aspect;
      camera.right = frustum * aspect;
      camera.top = frustum;
      camera.bottom = -frustum;
      camera.updateProjectionMatrix();
      grid.material.opacity = isDark() ? 0.16 : 0.1;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const themeObserver = new MutationObserver(resize);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Subtle parallax toward the pointer.
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      const r = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
    };
    mount.addEventListener('pointermove', onPointerMove);

    let raf;
    const clock = new THREE.Clock();

    const render = () => {
      const t = clock.getElapsedTime();

      if (!reduceMotion) {
        cubes.forEach((node) => {
          node.position.y = node.userData.baseY + Math.sin(t * 0.9 + node.userData.phase) * 0.18;
          node.rotation.y = t * 0.25 + node.userData.phase;
        });
        group.rotation.y += (pointer.x - group.rotation.y * 0.5) * 0.012;
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pointer.y * 0.4, 0.05);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      mount.removeEventListener('pointermove', onPointerMove);
      geometry.dispose();
      edges.dispose();
      scene.traverse((o) => {
        o.material?.dispose?.();
        o.geometry?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label="An isometric lattice of eleven cubes, one for each supported language"
      className="h-[300px] w-full cursor-grab sm:h-[380px]"
    />
  );
}

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Shield, Radio, RefreshCw, Zap, Maximize2, Globe2 } from 'lucide-react';
import { useCluster } from '../../context/ClusterContext';
import { useTheme } from '../../context/ThemeContext';

export default function SentinelDefenseGlobe({ height = 360, className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { activeCluster } = useCluster();
  const { theme } = useTheme();

  const [isRotating, setIsRotating] = useState(true);
  const [pulseCount, setPulseCount] = useState(1420);
  const [activeNode, setActiveNode] = useState('Gateway Primary');

  const sceneStateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    sphereGroup: null,
    particles: null,
    rings: [],
    radarBeam: null,
    animId: null,
    isInteracting: false,
    mouseX: 0,
    mouseY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    isVisible: true,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const h = height;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // Color palette based on Sentinel luxury styling
    const isDark = theme === 'dark';
    const goldColor = 0xd4af37;
    const cyanColor = 0x06b6d4;
    const emeraldColor = 0x10b981;
    const amberColor = 0xf59e0b;
    const inkColor = isDark ? 0x222938 : 0xd8d8d0;

    // 2. Wireframe Core Sphere
    const coreGeometry = new THREE.IcosahedronGeometry(70, 2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: inkColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    sphereGroup.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(62, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: goldColor,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    sphereGroup.add(innerMesh);

    // 3. Orbital Defense Rings
    const rings = [];
    const ringRadii = [82, 94, 106];
    ringRadii.forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.6, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? goldColor : i === 1 ? cyanColor : emeraldColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDark ? 0.45 : 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = (Math.PI / 3) * (i + 1) * 0.5;
      ringMesh.rotation.y = (Math.PI / 4) * i;
      sphereGroup.add(ringMesh);
      rings.push({ mesh: ringMesh, speed: (i % 2 === 0 ? 1 : -1) * 0.004 });
    });

    // 4. Perimeter Particle Shield (Telemetry Nodes)
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cGold = new THREE.Color(goldColor);
    const cCyan = new THREE.Color(cyanColor);
    const cEmerald = new THREE.Color(emeraldColor);
    const cAmber = new THREE.Color(amberColor);
    const palette = [cGold, cCyan, cEmerald, cAmber];

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere surface
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const sqrt = Math.sqrt(particleCount * Math.PI);
      const theta = sqrt * phi;
      const radius = 72 + (Math.sin(i * 0.5) * 3);

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    sphereGroup.add(particles);

    // 5. Radar Sweep Line / Beam
    const beamGeo = new THREE.BufferGeometry();
    const beamPoints = new Float32Array([0, 0, 0, 0, 95, 0]);
    beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPoints, 3));
    const beamMat = new THREE.LineBasicMaterial({
      color: goldColor,
      transparent: true,
      opacity: 0.6,
    });
    const radarBeam = new THREE.Line(beamGeo, beamMat);
    sphereGroup.add(radarBeam);

    // Store state in ref
    const state = sceneStateRef.current;
    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
    state.sphereGroup = sphereGroup;
    state.particles = particles;
    state.rings = rings;
    state.radarBeam = radarBeam;

    // 6. Animation Loop with FPS-efficient delta and visibility check
    let lastTime = performance.now();

    const animate = (currentTime) => {
      state.animId = requestAnimationFrame(animate);

      if (!state.isVisible) return; // Zero GPU when tab hidden or offscreen

      const delta = (currentTime - lastTime) * 0.001;
      lastTime = currentTime;

      // Smooth mouse rotation damping
      sphereGroup.rotation.y += (state.targetRotationY - sphereGroup.rotation.y) * 0.05;
      sphereGroup.rotation.x += (state.targetRotationX - sphereGroup.rotation.x) * 0.05;

      // Natural continuous rotation
      if (isRotating) {
        sphereGroup.rotation.y += 0.0035;
      }

      // Rotate orbital rings
      rings.forEach(({ mesh, speed }) => {
        mesh.rotation.z += speed;
      });

      // Rotate radar sweep
      radarBeam.rotation.z += 0.025;

      // Subtle breathing pulse on particles
      const scale = 1 + Math.sin(currentTime * 0.002) * 0.02;
      particles.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    state.animId = requestAnimationFrame(animate);

    // 7. Resize Observer for seamless responsive resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          camera.aspect = newWidth / height;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, height);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Intersection Observer to halt rendering when out of viewport
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        state.isVisible = e.isIntersecting;
      });
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);

    // 9. Page Visibility Listener (Pause when tab is hidden)
    const handleVisibilityChange = () => {
      state.isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up on unmount
    return () => {
      if (state.animId) cancelAnimationFrame(state.animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Dispose geometries and materials
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      rings.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
      });

      renderer.dispose();
    };
  }, [theme, height, isRotating]);

  // Mouse Interaction handlers for interactive 3D parallax
  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    sceneStateRef.current.targetRotationY = x * 0.75;
    sceneStateRef.current.targetRotationX = -y * 0.45;
  };

  const handleMouseLeave = () => {
    sceneStateRef.current.targetRotationX = 0;
    sceneStateRef.current.targetRotationY = 0;
  };

  const triggerShockwave = () => {
    setPulseCount((prev) => prev + 12);
    if (sceneStateRef.current.particles) {
      sceneStateRef.current.particles.scale.set(1.15, 1.15, 1.15);
      setTimeout(() => {
        if (sceneStateRef.current.particles) {
          sceneStateRef.current.particles.scale.set(1, 1, 1);
        }
      }, 300);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-luxury-surface/40 dark:bg-stone-950/40 border border-luxury-border/60 shadow-subtle ${className}`}
      style={{ minHeight: height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Top Left HUD: Cluster & Status */}
      <div className="absolute top-3.5 left-4 z-10 pointer-events-none flex flex-col gap-1 font-sans">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>MESH PERIMETER SECURED</span>
          </span>
          <span className="text-[11px] font-mono text-luxury-muted">
            {activeCluster.region} • {activeCluster.latencyMs}ms
          </span>
        </div>
        <div className="text-xs font-semibold text-luxury-ink tracking-tight flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Cluster Node: {activeCluster.name}</span>
        </div>
      </div>

      {/* Top Right HUD: Telemetry Metrics */}
      <div className="absolute top-3.5 right-4 z-10 pointer-events-none flex items-center gap-3 font-mono text-[11px] text-luxury-muted backdrop-blur-sm">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-wider text-luxury-muted">Neural Classifier</span>
          <span className="text-xs font-bold text-luxury-ink">SGD 97.7%</span>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-wider text-luxury-muted">Intrusions Intercepted</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {pulseCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="absolute bottom-3 inset-x-4 z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-luxury-surface/80 hover:bg-luxury-surface border border-luxury-border text-luxury-ink backdrop-blur-md transition-colors cursor-pointer shadow-subtle"
            title="Toggle Continuous Rotation"
          >
            <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{isRotating ? 'Orbiting' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={triggerShockwave}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 backdrop-blur-md transition-colors cursor-pointer"
            title="Simulate Neural Ping Wave"
          >
            <Zap className="w-3 h-3" />
            <span>Neural Ping</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-luxury-muted hidden md:flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-luxury-muted" />
          <span>Interactive 3D WebGL Telemetry</span>
        </div>
      </div>
    </div>
  );
}

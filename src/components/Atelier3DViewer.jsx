import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCw, Sparkles, ZoomIn, Check, ArrowRight, ShieldCheck, Layers, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

// Material presets for the Atelier piece
const MATERIALS = {
  leather: {
    id: 'leather',
    name: 'Tuscan Matte Leather',
    origin: 'Santa Croce sull’Arno, Italy',
    spec: '1.4mm Full-Grain Vegetable-Tanned Cowhide',
    color: 0x181818,
    roughness: 0.42,
    metalness: 0.08,
    bumpScale: 0.015,
    pattern: 'leather',
    accentColor: '#171717',
    badge: 'Flagship Leather'
  },
  denim: {
    id: 'denim',
    name: '14oz Kuroki Selvedge',
    origin: 'Okayama Prefecture, Japan',
    spec: 'Rope-Dyed Indigo Raw Cotton Selvedge',
    color: 0x161e2b,
    roughness: 0.88,
    metalness: 0.02,
    bumpScale: 0.025,
    pattern: 'denim',
    accentColor: '#1e293b',
    badge: 'Raw Selvedge'
  },
  canvas: {
    id: 'canvas',
    name: 'Heavy Structured Canvas',
    origin: 'Biella, Northern Italy',
    spec: '600 GSM High-Density Combed Cotton Weave',
    color: 0x242422,
    roughness: 0.92,
    metalness: 0.01,
    bumpScale: 0.03,
    pattern: 'canvas',
    accentColor: '#27272a',
    badge: 'Heavy Canvas'
  }
}

// 3D Hotspot definitions (in 3D model coordinates)
const HOTSPOTS = [
  {
    id: 'hardware',
    title: 'Brushed PVD Hardware',
    subtitle: 'Aircraft-grade matte black alloy',
    desc: 'Solid cast zinc-aluminum alloy with hand-brushed physical vapor deposition finish for zero patina wear.',
    pos: new THREE.Vector3(1.3, 0.4, 0.6),
    cameraTarget: { x: 1.2, y: 0.5, z: 2.8 }
  },
  {
    id: 'stitching',
    title: 'Single-Needle Seams',
    subtitle: '7 stitches per inch, waxed thread',
    desc: 'Japanese nylon-core thread bonded with organic beeswax, lockstitched at high tension for lifetime durability.',
    pos: new THREE.Vector3(0, 0.72, 0.4),
    cameraTarget: { x: 0, y: 0.8, z: 2.5 }
  },
  {
    id: 'handle',
    title: 'Reinforced Arch Handle',
    subtitle: 'Hand-rolled core support',
    desc: 'Dual contoured arch handles reinforced with high-density EVA core for fatigue-free extended transport.',
    pos: new THREE.Vector3(0, 1.15, 0),
    cameraTarget: { x: 0, y: 1.1, z: 2.6 }
  }
]

// Generate procedural textures for leather, denim, and canvas
function createProceduralTexture(type) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 512, 512)

  if (type === 'leather') {
    // Subtle cellular pebble grain
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const radius = 1 + Math.random() * 2
      const shade = Math.floor(100 + Math.random() * 80)
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'denim') {
    // 3x1 twill diagonal weave lines
    ctx.strokeStyle = '#555555'
    ctx.lineWidth = 1.5
    for (let i = -512; i < 1024; i += 4) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 512, 512)
      ctx.stroke()
    }
    // Cross hatch weft
    ctx.strokeStyle = '#777777'
    ctx.lineWidth = 1
    for (let y = 0; y < 512; y += 6) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }
  } else if (type === 'canvas') {
    // Heavy grid basketweave
    ctx.fillStyle = '#606060'
    for (let x = 0; x < 512; x += 8) {
      for (let y = 0; y < 512; y += 8) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, 6, 6)
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(type === 'denim' ? 8 : 4, type === 'denim' ? 8 : 4)
  return texture
}

export default function Atelier3DViewer() {
  const mountRef = useRef(null)
  const [selectedMaterial, setSelectedMaterial] = useState('leather')
  const [activeHotspot, setActiveHotspot] = useState(null)
  const [isRotating, setIsRotating] = useState(true)
  const [hotspotScreenPositions, setHotspotScreenPositions] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Three.js internal references
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const bagGroupRef = useRef(null)
  const bagMeshRef = useRef(null)
  const texturesRef = useRef({})
  const mouseStateRef = useRef({
    isDown: false,
    prevX: 0,
    prevY: 0,
    rotSpeedX: 0,
    rotSpeedY: 0
  })

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0.8, 3.8)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    // Key light (soft warm white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 5, 4)
    scene.add(keyLight)

    // Fill light (neutral cool)
    const fillLight = new THREE.DirectionalLight(0xf0f4ff, 1.2)
    fillLight.position.set(-4, 2, 2)
    scene.add(fillLight)

    // Rim light (highlighting edges & silhouette)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8)
    rimLight.position.set(0, -3, -4)
    scene.add(rimLight)

    // Generate procedural bump textures
    texturesRef.current = {
      leather: createProceduralTexture('leather'),
      denim: createProceduralTexture('denim'),
      canvas: createProceduralTexture('canvas')
    }

    // Root model group
    const bagGroup = new THREE.Group()
    bagGroup.position.set(0, -0.2, 0)
    scene.add(bagGroup)
    bagGroupRef.current = bagGroup

    // 1. Bag Main Body (Sculpted Duffel/Carryall Barrel)
    const bodyGeometry = new THREE.CylinderGeometry(0.72, 0.72, 2.3, 48, 16)
    // Rotate to lie horizontally
    bodyGeometry.rotateZ(Math.PI / 2)

    const initialMat = MATERIALS[selectedMaterial]
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: initialMat.color,
      roughness: initialMat.roughness,
      metalness: initialMat.metalness,
      bumpMap: texturesRef.current[initialMat.pattern],
      bumpScale: initialMat.bumpScale
    })
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    bodyMesh.castShadow = true
    bagMeshRef.current = bodyMesh
    bagGroup.add(bodyMesh)

    // Rounded end caps
    const capGeometry = new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const leftCap = new THREE.Mesh(capGeometry, bodyMaterial)
    leftCap.rotation.z = -Math.PI / 2
    leftCap.position.x = -1.15
    bagGroup.add(leftCap)

    const rightCap = new THREE.Mesh(capGeometry, bodyMaterial)
    rightCap.rotation.z = Math.PI / 2
    rightCap.position.x = 1.15
    bagGroup.add(rightCap)

    // 2. Hardware: Metallic Trim, Zipper Line & Anchors
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.25,
      metalness: 0.95
    })

    // Top zipper rib
    const zipperGeometry = new THREE.BoxGeometry(2.1, 0.05, 0.08)
    const zipper = new THREE.Mesh(zipperGeometry, metalMaterial)
    zipper.position.set(0, 0.73, 0)
    bagGroup.add(zipper)

    // 3. Dual Arch Handles
    const handleShape = new THREE.TorusGeometry(0.55, 0.065, 16, 48, Math.PI)
    const handleFront = new THREE.Mesh(handleShape, bodyMaterial)
    handleFront.position.set(0, 0.65, 0.32)
    bagGroup.add(handleFront)

    const handleBack = new THREE.Mesh(handleShape, bodyMaterial)
    handleBack.position.set(0, 0.65, -0.32)
    bagGroup.add(handleBack)

    // Handle Metallic Clamps
    const clampGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16)
    ;[-0.55, 0.55].forEach((xPos) => {
      const clampFront = new THREE.Mesh(clampGeom, metalMaterial)
      clampFront.position.set(xPos, 0.68, 0.32)
      bagGroup.add(clampFront)

      const clampBack = new THREE.Mesh(clampGeom, metalMaterial)
      clampBack.position.set(xPos, 0.68, -0.32)
      bagGroup.add(clampBack)
    })

    // 4. Side D-Rings (Shoulder Strap Anchors)
    const dRingGeom = new THREE.TorusGeometry(0.12, 0.025, 12, 24)
    const leftRing = new THREE.Mesh(dRingGeom, metalMaterial)
    leftRing.position.set(-1.42, 0.3, 0)
    leftRing.rotation.y = Math.PI / 2
    bagGroup.add(leftRing)

    const rightRing = new THREE.Mesh(dRingGeom, metalMaterial)
    rightRing.position.set(1.42, 0.3, 0)
    rightRing.rotation.y = Math.PI / 2
    bagGroup.add(rightRing)

    // 5. Studio Pedestal Turntable Disc
    const pedestalGeom = new THREE.CylinderGeometry(1.9, 2.05, 0.08, 64)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.3,
      metalness: 0.1
    })
    const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat)
    pedestal.position.set(0, -0.76, 0)
    bagGroup.add(pedestal)

    // Subtle contact shadow disk
    const shadowGeom = new THREE.RingGeometry(0.1, 2.2, 32)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    })
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.77
    bagGroup.add(shadowMesh)

    // Animation & Render Loop
    let animationFrameId
    const targetCameraPos = new THREE.Vector3(0, 0.8, 3.8)

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Apply drag momentum or auto-rotation
      const state = mouseStateRef.current
      if (state.isDown) {
        bagGroup.rotation.y += state.rotSpeedX
        bagGroup.rotation.x += state.rotSpeedY
        // Clamp vertical tilt
        bagGroup.rotation.x = Math.max(-0.35, Math.min(0.45, bagGroup.rotation.x))
        state.rotSpeedX *= 0.92
        state.rotSpeedY *= 0.92
      } else {
        if (isRotating) {
          bagGroup.rotation.y += 0.0035
        } else {
          bagGroup.rotation.y += state.rotSpeedX
          bagGroup.rotation.x += state.rotSpeedY
          state.rotSpeedX *= 0.94
          state.rotSpeedY *= 0.94
        }
        // Smoothly settle X tilt back toward gentle angle
        bagGroup.rotation.x = THREE.MathUtils.lerp(bagGroup.rotation.x, 0.08, 0.04)
      }

      // Smooth camera lerping when inspecting hotspot
      camera.position.lerp(targetCameraPos, 0.05)

      // Project 3D Hotspots into 2D Screen Space
      const positions = HOTSPOTS.map((h) => {
        const worldPos = h.pos.clone()
        worldPos.applyEuler(bagGroup.rotation)
        worldPos.add(bagGroup.position)

        const screenPos = worldPos.clone().project(camera)
        const isFacing = worldPos.z > -0.2 // Hide hotspots on back-face

        return {
          id: h.id,
          x: ((screenPos.x + 1) * width) / 2,
          y: ((-screenPos.y + 1) * height) / 2,
          visible: isFacing
        }
      })
      setHotspotScreenPositions(positions)

      renderer.render(scene, camera)
    }

    animate()

    // Responsive window resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const newW = container.clientWidth
      const newH = container.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container && renderer.domElement) {
        container.innerHTML = ''
      }
    }
  }, [isRotating])

  // Update material properties on selection
  useEffect(() => {
    if (!bagMeshRef.current || !bagGroupRef.current) return
    const matConfig = MATERIALS[selectedMaterial]
    const tex = texturesRef.current[matConfig.pattern]

    bagGroupRef.current.traverse((child) => {
      if (child.isMesh && child.material && child.material.bumpMap !== undefined) {
        child.material.color.setHex(matConfig.color)
        child.material.roughness = matConfig.roughness
        child.material.metalness = matConfig.metalness
        child.material.bumpMap = tex
        child.material.bumpScale = matConfig.bumpScale
        child.material.needsUpdate = true
      }
    })
  }, [selectedMaterial])

  // Pointer / Touch drag controls
  const handlePointerDown = (e) => {
    setIsDragging(true)
    setIsRotating(false)
    setHasInteracted(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    mouseStateRef.current = {
      isDown: true,
      prevX: clientX,
      prevY: clientY,
      rotSpeedX: 0,
      rotSpeedY: 0
    }
  }

  const handlePointerMove = (e) => {
    if (!mouseStateRef.current.isDown) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - mouseStateRef.current.prevX
    const deltaY = clientY - mouseStateRef.current.prevY

    mouseStateRef.current.prevX = clientX
    mouseStateRef.current.prevY = clientY
    mouseStateRef.current.rotSpeedX = deltaX * 0.007
    mouseStateRef.current.rotSpeedY = deltaY * 0.007
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    mouseStateRef.current.isDown = false
  }

  const activeMat = MATERIALS[selectedMaterial]

  return (
    <section className="w-full py-20 lg:py-28 bg-neutral-950 text-white relative overflow-hidden select-none">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 lg:mb-14 gap-6">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
              The Structured Carryall
            </h2>
            <p className="text-base text-neutral-300 max-w-xl font-light leading-relaxed">
              Drag 360° to inspect architectural seam geometry, hand-finished PVD hardware, and tactile materials sourced across Europe and Japan.
            </p>
          </div>

          {/* Quick Specifications Pill */}
          <div data-ui className="hidden md:flex items-center gap-6 text-sm text-neutral-400 bg-neutral-900 border border-neutral-800 px-6 py-3.5 rounded-2xl">
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider font-medium">Volume</p>
              <p className="font-medium text-white text-base tabular-nums">38 Litres</p>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider font-medium">Weight</p>
              <p className="font-medium text-white text-base tabular-nums">1,240 Grams</p>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider font-medium">Hardware</p>
              <p className="font-medium text-white text-base">Brushed PVD</p>
            </div>
          </div>
        </div>

        {/* 3D Canvas Stage Container */}
        <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden group">
          
          {/* WebGL Canvas */}
          <div
            ref={mountRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className={`w-full h-full cursor-grab active:cursor-grabbing ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
          />

          {/* Initial Drag Guidance Cue */}
          {!hasInteracted && (
            <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-black/80 border border-neutral-700 px-5 py-2.5 rounded-full flex items-center gap-3 text-sm text-white"
              >
                <RotateCw size={15} className="animate-spin" />
                <span>Click and drag anywhere to inspect 360°</span>
              </motion.div>
            </div>
          )}

          {/* Interactive 3D Screen Space Hotspots */}
          {hotspotScreenPositions.map((pos) => {
            const hotspotData = HOTSPOTS.find((h) => h.id === pos.id)
            if (!pos.visible || !hotspotData) return null

            return (
              <div
                key={pos.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveHotspot(activeHotspot?.id === pos.id ? null : hotspotData)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    activeHotspot?.id === pos.id
                      ? 'bg-white text-black ring-4 ring-white/30'
                      : 'bg-black/90 text-white border border-neutral-600 hover:border-white'
                  }`}
                  aria-label={`Inspect detail: ${hotspotData.title}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                </motion.button>
              </div>
            )
          })}

          {/* Active Hotspot Inspector Card Overlay */}
          <AnimatePresence>
            {activeHotspot && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-6 left-6 z-30 max-w-sm bg-neutral-950 border border-neutral-700 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 font-medium">
                    Tactile Provenance
                  </span>
                  <button
                    onClick={() => setActiveHotspot(null)}
                    className="text-neutral-400 hover:text-white text-sm font-semibold px-2 py-1"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-lg font-semibold text-white">
                    {activeHotspot.title}
                  </h4>
                  <p className="text-sm text-neutral-400 font-medium">
                    {activeHotspot.subtitle}
                  </p>
                </div>
                <p className="text-base text-neutral-300 leading-relaxed font-light">
                  {activeHotspot.desc}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Material Switcher Pill Dock (Bottom Left) */}
          <div data-ui className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-2 sm:gap-3 bg-neutral-950/90 border border-neutral-800 p-2 sm:p-2.5 rounded-2xl">
            <span className="text-sm font-medium text-neutral-400 px-2 hidden sm:inline">
              Fabric:
            </span>
            {Object.values(MATERIALS).map((mat) => {
              const isActive = selectedMaterial === mat.id
              return (
                <button
                  key={mat.id}
                  onClick={() => {
                    setSelectedMaterial(mat.id)
                    setHasInteracted(true)
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-neutral-600 shrink-0"
                    style={{ backgroundColor: mat.accentColor }}
                  />
                  <span>{mat.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Turntable Auto-Rotate Toggle (Bottom Right) */}
          <div data-ui className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`p-3 rounded-full border text-sm transition-colors flex items-center justify-center ${
                isRotating
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950/90 text-neutral-300 border-neutral-800 hover:border-neutral-600'
              }`}
              title={isRotating ? 'Pause rotation' : 'Resume auto rotation'}
              aria-label="Toggle turntable auto rotation"
            >
              <RotateCw size={16} className={isRotating ? 'animate-spin' : ''} />
            </button>
          </div>

        </div>

        {/* Material Specification Summary Band */}
        <div className="mt-8 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-neutral-500 font-medium">Selected Material</p>
            <p className="text-white font-semibold text-base">{activeMat.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-neutral-500 font-medium">Provenance Workshop</p>
            <p className="text-neutral-300 text-base">{activeMat.origin}</p>
          </div>
          <div className="space-y-1 flex sm:justify-end items-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-neutral-300 transition-colors"
            >
              <span>Explore All Handcrafted Carry Goods</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { AppTheme } from "../../../lib/theme";
import {
  HERO_STACK_LAYERS,
  computeHeroPointerTilt,
  computeLayerTargets,
  getHeroStackThemePalette,
  type HeroStackThemePalette,
} from "./heroStackModel";

export interface HeroStackSceneOptions {
  container: HTMLElement;
  initialTheme: AppTheme;
  initialActiveLayer: number;
  onSelectLayer: (index: number) => void;
  onHoverLayer?: (index: number | null) => void;
  onContextLost?: () => void;
}

interface SlabRefs {
  group: THREE.Group;
  bodyMat: THREE.MeshPhysicalMaterial;
  rimMat: THREE.MeshStandardMaterial;
  panelCanvas: HTMLCanvasElement;
  panelTexture: THREE.CanvasTexture;
  hitProxy: THREE.Mesh;
  currentY: number;
  currentZ: number;
  currentScale: number;
}

interface PulseRefs {
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  phase: number;
}

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    grad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    grad.addColorStop(0.55, "rgba(0, 0, 0, 0.24)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/**
 * Draws crisp architectural UI telemetry vector graphics onto each floating slab
 * so the 3D layers visually mirror TrueHire's product (Resume -> Role Match -> Proof).
 */
function drawSlabPanelCanvas(
  canvas: HTMLCanvasElement,
  layerIndex: number,
  palette: HeroStackThemePalette,
  isFocused: boolean,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Clean architectural base fill
  ctx.fillStyle = palette.panelSurface;
  fillRoundedRect(ctx, 0, 0, w, h, 24);

  // Subtle architectural grid lines
  ctx.strokeStyle = palette.panelGridLine;
  ctx.lineWidth = 1;
  for (let gx = 48; gx < w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, 16);
    ctx.lineTo(gx, h - 16);
    ctx.stroke();
  }
  for (let gy = 48; gy < h; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(16, gy);
    ctx.lineTo(w - 16, gy);
    ctx.stroke();
  }

  // Border frame
  ctx.strokeStyle = isFocused
    ? layerIndex === 2
      ? palette.success
      : palette.primary
    : palette.panelGridLine;
  ctx.lineWidth = isFocused ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 18);
  ctx.stroke();

  const layer = HERO_STACK_LAYERS[layerIndex];
  const accentColor =
    layerIndex === 2
      ? palette.success
      : layerIndex === 1
        ? palette.primary
        : palette.primaryBright;

  // Top index + title row
  ctx.font = "600 22px 'IBM Plex Mono', monospace";
  ctx.fillStyle = accentColor;
  ctx.textBaseline = "middle";
  ctx.fillText(layer.index, 34, 44);

  ctx.font = "600 24px 'Manrope', sans-serif";
  ctx.fillStyle = palette.panelTextPrimary;
  ctx.fillText(layer.label, 82, 44);

  // Right-side signal indicator square (static, no pulsing dot)
  ctx.fillStyle = accentColor;
  fillRoundedRect(ctx, w - 58, 34, 22, 20, 6);

  // Layer-specific crisp data visualization geometry
  if (layerIndex === 0) {
    // Layer 01: Resume Signals — structured extracted skill vector rows
    const bars = [
      { label: "PostgreSQL", pct: 0.86, tone: palette.primary },
      { label: "TypeScript & Node", pct: 0.78, tone: palette.primaryBright },
      { label: "Distributed Systems", pct: 0.62, tone: palette.panelTextMuted },
      { label: "API Auth", pct: 0.44, tone: palette.warning },
    ];
    bars.forEach((b, i) => {
      const y = 98 + i * 52;
      ctx.font = "500 18px 'Manrope', sans-serif";
      ctx.fillStyle = palette.panelTextMuted;
      ctx.fillText(b.label, 34, y);

      // Track
      ctx.fillStyle = palette.panelGridLine;
      fillRoundedRect(ctx, 232, y - 7, 240, 14, 7);

      // Filled bar
      ctx.fillStyle = b.tone;
      fillRoundedRect(ctx, 232, y - 7, Math.round(240 * b.pct), 14, 7);
    });
  } else if (layerIndex === 1) {
    // Layer 02: Role Coverage — 8/12 requirement matrix & score gauge arc
    const cx = 112;
    const cy = 192;
    const r = 64;

    ctx.lineWidth = 14;
    ctx.strokeStyle = palette.panelGridLine;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = palette.primary;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.74);
    ctx.stroke();

    ctx.font = "700 30px 'IBM Plex Mono', monospace";
    ctx.fillStyle = palette.panelTextPrimary;
    ctx.textAlign = "center";
    ctx.fillText("74%", cx, cy + 2);
    ctx.textAlign = "left";

    // Requirement cells matrix (3x4 grid)
    const states = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0];
    states.forEach((st, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const bx = 224 + col * 64;
      const by = 116 + row * 54;
      ctx.fillStyle =
        st === 1
          ? palette.primary
          : st === 2
            ? palette.success
            : palette.panelGridLine;
      fillRoundedRect(ctx, bx, by, 50, 38, 10);
    });
  } else {
    // Layer 03: Interview Proof — ascending readiness sparkline + verified metric
    const pts = [
      [44, 246],
      [130, 224],
      [220, 192],
      [310, 152],
      [400, 126],
      [470, 96],
    ];

    // Area gradient
    const grad = ctx.createLinearGradient(0, 90, 0, 270);
    grad.addColorStop(0, "rgba(74, 222, 128, 0.28)");
    grad.addColorStop(1, "rgba(74, 222, 128, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], 266);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(pts[pts.length - 1][0], 266);
    ctx.closePath();
    ctx.fill();

    // Crisp trend stroke
    ctx.strokeStyle = palette.success;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Node markers
    pts.forEach(([x, y], i) => {
      ctx.fillStyle = i === pts.length - 1 ? palette.success : palette.panelSurface;
      ctx.strokeStyle = palette.success;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, i === pts.length - 1 ? 10 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.font = "600 22px 'IBM Plex Mono', monospace";
    ctx.fillStyle = palette.success;
    ctx.fillText("+14 pts verified", 44, 118);
  }
}

export class HeroStackSceneController {
  private readonly container: HTMLElement;
  private readonly isSoftwareGl: boolean;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly envRenderTarget: THREE.WebGLRenderTarget;

  private readonly assemblyGroup: THREE.Group;
  private readonly slabs: SlabRefs[] = [];
  private readonly interactables: THREE.Object3D[] = [];
  private readonly pulses: PulseRefs[] = [];
  private readonly gridDots: THREE.InstancedMesh;

  // Theme-synced materials & lights
  private readonly conduitMat: THREE.MeshStandardMaterial;
  private readonly returnConduitMat: THREE.MeshStandardMaterial;
  private readonly pulsePrimaryMat: THREE.MeshStandardMaterial;
  private readonly pulseSuccessMat: THREE.MeshStandardMaterial;
  private readonly gridDotMat: THREE.MeshStandardMaterial;
  private readonly contactShadowMat: THREE.MeshBasicMaterial;
  private readonly keyLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly rimLight: THREE.DirectionalLight;

  private readonly disposables: Array<{ dispose: () => void }> = [];

  // Runtime interaction state
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2(99, 99);
  private pointerX = 0;
  private pointerY = 0;
  private activeLayerIndex: number;
  private hoveredLayerIndex: number | null = null;
  private palette: HeroStackThemePalette;
  private onSelectLayer: (index: number) => void;
  private onHoverLayer?: (index: number | null) => void;
  private onContextLost?: () => void;

  private lastRaycastMs = 0;
  private frameId = 0;
  private isTimeoutFrame = false;
  private isDisposed = false;
  private isInView = true;
  private isTabVisible =
    typeof document === "undefined" ? true : !document.hidden;
  private lastTickMs = 0;
  private elapsedSeconds = 0;

  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(options: HeroStackSceneOptions) {
    this.container = options.container;
    this.activeLayerIndex = options.initialActiveLayer;
    this.onSelectLayer = options.onSelectLayer;
    this.onHoverLayer = options.onHoverLayer;
    this.onContextLost = options.onContextLost;
    this.palette = getHeroStackThemePalette(options.initialTheme);
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(260, this.container.clientWidth || 600);
    const height = Math.max(260, this.container.clientHeight || 420);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.palette.background);
    this.scene.fog = new THREE.FogExp2(this.palette.fog, 0.036);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 60);
    this.updateCameraFraming(width, height);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");
    this.container.appendChild(canvas);

    // Procedural Studio Environment Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // 3-Point Studio Lighting Rig
    this.keyLight = new THREE.DirectionalLight(
      this.palette.keyLightColor,
      this.palette.keyLightIntensity,
    );
    this.keyLight.position.set(5.4, 7.8, 6.2);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 22;
    this.keyLight.shadow.camera.left = -5;
    this.keyLight.shadow.camera.right = 5;
    this.keyLight.shadow.camera.top = 5;
    this.keyLight.shadow.camera.bottom = -5;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(
      this.palette.hemiSky,
      this.palette.hemiGround,
      this.palette.hemiIntensity,
    );
    this.scene.add(this.hemiLight);

    this.rimLight = new THREE.DirectionalLight(
      this.palette.rimLightColor,
      this.palette.rimLightIntensity,
    );
    this.rimLight.position.set(-6.0, 3.2, -5.0);
    this.scene.add(this.rimLight);

    // Shared Materials
    this.conduitMat = new THREE.MeshStandardMaterial({
      color: this.palette.conduitBase,
      metalness: 0.55,
      roughness: 0.34,
    });
    this.returnConduitMat = new THREE.MeshStandardMaterial({
      color: this.palette.success,
      emissive: this.palette.success,
      emissiveIntensity: 0.25,
      metalness: 0.25,
      roughness: 0.28,
    });
    this.pulsePrimaryMat = new THREE.MeshStandardMaterial({
      color: this.palette.primaryBright,
      emissive: this.palette.primary,
      emissiveIntensity: 0.9,
      metalness: 0.15,
      roughness: 0.18,
    });
    this.pulseSuccessMat = new THREE.MeshStandardMaterial({
      color: this.palette.success,
      emissive: this.palette.success,
      emissiveIntensity: 0.95,
      metalness: 0.15,
      roughness: 0.18,
    });
    this.gridDotMat = new THREE.MeshStandardMaterial({
      color: this.palette.gridDot,
      metalness: 0.3,
      roughness: 0.6,
    });

    const shadowTex = createContactShadowTexture();
    this.contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: this.palette.shadowOpacity,
      depthWrite: false,
    });
    this.disposables.push(
      this.conduitMat,
      this.returnConduitMat,
      this.pulsePrimaryMat,
      this.pulseSuccessMat,
      this.gridDotMat,
      shadowTex,
      this.contactShadowMat,
    );

    // Root Architectural Sculpture Group
    this.assemblyGroup = new THREE.Group();
    this.assemblyGroup.rotation.set(0.34, -0.52, 0);
    this.scene.add(this.assemblyGroup);

    // Subtle Grounded Contact Shadow + Architectural Dot Matrix Floor
    const shadowGeo = new THREE.CircleGeometry(3.5, 48);
    const shadowPlane = new THREE.Mesh(shadowGeo, this.contactShadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.18;
    this.assemblyGroup.add(shadowPlane);

    const dotGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.016, 12);
    const gridCount = 36;
    this.gridDots = new THREE.InstancedMesh(dotGeo, this.gridDotMat, gridCount);
    let idx = 0;
    for (let gx = 0; gx < 6; gx += 1) {
      for (let gz = 0; gz < 6; gz += 1) {
        _vecA.set((gx - 2.5) * 0.95, -2.16, (gz - 2.5) * 0.72);
        _quat.identity();
        _scale.set(1, 1, 1);
        _mat4.compose(_vecA, _quat, _scale);
        this.gridDots.setMatrixAt(idx, _mat4);
        idx += 1;
      }
    }
    this.gridDots.instanceMatrix.needsUpdate = true;
    this.gridDots.computeBoundingSphere();
    this.assemblyGroup.add(this.gridDots);
    this.disposables.push(shadowGeo, dotGeo);

    // =========================================================================
    // 1. THREE BEVELED ARCHITECTURAL VERIFICATION SLABS (Composite 5-part Groups)
    // =========================================================================
    const slabW = 3.7;
    const slabD = 2.35;
    const slabShape = createRoundedRectShape(slabW, slabD, 0.24);
    const slabExtrudeGeo = new THREE.ExtrudeGeometry(slabShape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 4,
    });
    slabExtrudeGeo.center();
    slabExtrudeGeo.rotateX(-Math.PI / 2);

    const rimShape = createRoundedRectShape(slabW + 0.06, slabD + 0.06, 0.26);
    const rimHole = createRoundedRectShape(slabW - 0.08, slabD - 0.08, 0.2);
    rimShape.holes.push(rimHole);
    const rimExtrudeGeo = new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    rimExtrudeGeo.center();
    rimExtrudeGeo.rotateX(-Math.PI / 2);

    const panelGeo = new THREE.PlaneGeometry(slabW - 0.24, slabD - 0.24);
    const pinGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.19, 16);
    const hitGeo = new THREE.BoxGeometry(slabW + 0.25, 0.42, slabD + 0.25);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const maxAnisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy(),
    );

    this.disposables.push(
      slabExtrudeGeo,
      rimExtrudeGeo,
      panelGeo,
      pinGeo,
      hitGeo,
      hitMat,
    );

    const initialTargets = computeLayerTargets(this.activeLayerIndex, null);

    HERO_STACK_LAYERS.forEach((_layer, layerIdx) => {
      const isFocused = layerIdx === this.activeLayerIndex;
      const target = initialTargets[layerIdx];
      const group = new THREE.Group();
      group.position.set(0, target.y, target.zSlide);
      group.scale.setScalar(target.scale);
      this.assemblyGroup.add(group);

      // Part 1: Beveled main architectural slab body
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: isFocused ? this.palette.slabActiveBody : this.palette.slabBody,
        metalness: this.palette.metalness,
        roughness: this.palette.roughness,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
      });
      const bodyMesh = new THREE.Mesh(slabExtrudeGeo, bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);

      // Part 2: Precision perimeter bezel trim
      const accentRim =
        layerIdx === 2 ? this.palette.success : this.palette.slabActiveRim;
      const rimMat = new THREE.MeshStandardMaterial({
        color: isFocused ? accentRim : this.palette.slabRim,
        emissive: isFocused ? accentRim : "#000000",
        emissiveIntensity: isFocused ? 0.35 : 0,
        metalness: 0.72,
        roughness: 0.24,
      });
      const rimMesh = new THREE.Mesh(rimExtrudeGeo, rimMat);
      rimMesh.position.y = 0.058;
      group.add(rimMesh);

      // Part 3: High-DPI procedural UI telemetry face
      const panelCanvas = document.createElement("canvas");
      panelCanvas.width = 512;
      panelCanvas.height = 320;
      drawSlabPanelCanvas(panelCanvas, layerIdx, this.palette, isFocused);
      const panelTexture = new THREE.CanvasTexture(panelCanvas);
      panelTexture.colorSpace = THREE.SRGBColorSpace;
      panelTexture.anisotropy = maxAnisotropy;

      const panelMat = new THREE.MeshBasicMaterial({
        map: panelTexture,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const panelMesh = new THREE.Mesh(panelGeo, panelMat);
      panelMesh.rotation.x = -Math.PI / 2;
      panelMesh.position.y = 0.102;
      group.add(panelMesh);

      // Part 4: 4 chamfered metallic corner anchor pins
      const corners = [
        [-slabW * 0.44, -slabD * 0.41],
        [slabW * 0.44, -slabD * 0.41],
        [-slabW * 0.44, slabD * 0.41],
        [slabW * 0.44, slabD * 0.41],
      ];
      corners.forEach(([cx, cz]) => {
        const pin = new THREE.Mesh(pinGeo, rimMat);
        pin.position.set(cx, 0, cz);
        group.add(pin);
      });

      // Part 5: Fast raycast proxy
      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.userData.layerIndex = layerIdx;
      group.add(hitProxy);
      this.interactables.push(hitProxy);

      this.disposables.push(bodyMat, rimMat, panelTexture, panelMat);

      this.slabs.push({
        group,
        bodyMat,
        rimMat,
        panelCanvas,
        panelTexture,
        hitProxy,
        currentY: target.y,
        currentZ: target.zSlide,
        currentScale: target.scale,
      });
    });

    // =========================================================================
    // 2. INTER-LAYER FIBER CONDUITS + GLIDING SIGNAL PULSES
    // =========================================================================
    const conduitSpecs: Array<{
      pts: THREE.Vector3[];
      isReturn: boolean;
      speed: number;
      phase: number;
    }> = [
      {
        pts: [
          new THREE.Vector3(-1.35, -1.25, 0.72),
          new THREE.Vector3(-1.58, 0.0, 0.85),
          new THREE.Vector3(-1.35, 1.25, 0.72),
        ],
        isReturn: false,
        speed: 0.24,
        phase: 0.05,
      },
      {
        pts: [
          new THREE.Vector3(1.38, -1.25, -0.7),
          new THREE.Vector3(1.62, 0.0, -0.82),
          new THREE.Vector3(1.38, 1.25, -0.7),
        ],
        isReturn: false,
        speed: 0.21,
        phase: 0.48,
      },
      {
        pts: [
          new THREE.Vector3(-1.28, -1.25, -0.78),
          new THREE.Vector3(-1.44, 0.0, -0.94),
          new THREE.Vector3(-1.28, 1.25, -0.78),
        ],
        isReturn: false,
        speed: 0.19,
        phase: 0.72,
      },
      {
        // Emerald verified proof return spline (Layer 03 -> Layer 02)
        pts: [
          new THREE.Vector3(1.45, 1.28, 0.76),
          new THREE.Vector3(2.22, 0.72, 1.04),
          new THREE.Vector3(1.52, 0.02, 0.78),
        ],
        isReturn: true,
        speed: 0.3,
        phase: 0.2,
      },
    ];

    const pulseCoreGeo = new THREE.OctahedronGeometry(0.075, 0);
    const pulseHaloGeo = new THREE.TorusGeometry(0.115, 0.013, 8, 22);
    this.disposables.push(pulseCoreGeo, pulseHaloGeo);

    conduitSpecs.forEach((spec) => {
      const curve = new THREE.CatmullRomCurve3(spec.pts);
      const tubeGeo = new THREE.TubeGeometry(
        curve,
        48,
        spec.isReturn ? 0.026 : 0.018,
        10,
        false,
      );
      const tubeMesh = new THREE.Mesh(
        tubeGeo,
        spec.isReturn ? this.returnConduitMat : this.conduitMat,
      );
      this.assemblyGroup.add(tubeMesh);
      this.disposables.push(tubeGeo);

      const carrier = new THREE.Group();
      const mat = spec.isReturn ? this.pulseSuccessMat : this.pulsePrimaryMat;
      const core = new THREE.Mesh(pulseCoreGeo, mat);
      const halo = new THREE.Mesh(pulseHaloGeo, mat);
      halo.rotation.x = Math.PI / 2;
      carrier.add(core, halo);
      this.assemblyGroup.add(carrier);

      this.pulses.push({
        mesh: carrier,
        curve,
        speed: spec.speed,
        phase: spec.phase,
      });
    });

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.renderFrame(0.016);
    this.startLoop();
  }

  private updateCameraFraming(width: number, height: number): void {
    const aspect = width / Math.max(1, height);
    this.camera.aspect = aspect;
    const zoomAdjust = aspect < 1.15 ? 1.15 / Math.max(0.76, aspect) : 1;
    this.camera.position.set(0.25, 2.35 * zoomAdjust, 8.85 * zoomAdjust);
    this.camera.lookAt(0, -0.05, 0);
    this.camera.updateProjectionMatrix();
  }

  private refreshSlabVisuals(): void {
    const focus = this.hoveredLayerIndex ?? this.activeLayerIndex;
    this.slabs.forEach((slab, idx) => {
      const isFocused = idx === focus;
      const accentRim =
        idx === 2 ? this.palette.success : this.palette.slabActiveRim;

      slab.bodyMat.color.set(
        isFocused ? this.palette.slabActiveBody : this.palette.slabBody,
      );
      slab.bodyMat.metalness = this.palette.metalness;
      slab.bodyMat.roughness = this.palette.roughness;

      slab.rimMat.color.set(isFocused ? accentRim : this.palette.slabRim);
      slab.rimMat.emissive.set(isFocused ? accentRim : "#000000");
      slab.rimMat.emissiveIntensity = isFocused ? 0.35 : 0;

      drawSlabPanelCanvas(slab.panelCanvas, idx, this.palette, isFocused);
      slab.panelTexture.needsUpdate = true;
    });
  }

  public setTheme(theme: AppTheme): void {
    if (this.isDisposed) return;
    this.palette = getHeroStackThemePalette(theme);

    this.scene.background = new THREE.Color(this.palette.background);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(this.palette.fog);
    }

    this.conduitMat.color.set(this.palette.conduitBase);
    this.returnConduitMat.color.set(this.palette.success);
    this.returnConduitMat.emissive.set(this.palette.success);
    this.pulsePrimaryMat.color.set(this.palette.primaryBright);
    this.pulsePrimaryMat.emissive.set(this.palette.primary);
    this.pulseSuccessMat.color.set(this.palette.success);
    this.pulseSuccessMat.emissive.set(this.palette.success);
    this.gridDotMat.color.set(this.palette.gridDot);
    this.contactShadowMat.opacity = this.palette.shadowOpacity;

    this.keyLight.color.set(this.palette.keyLightColor);
    this.keyLight.intensity = this.palette.keyLightIntensity;
    this.hemiLight.color.set(this.palette.hemiSky);
    this.hemiLight.groundColor.set(this.palette.hemiGround);
    this.hemiLight.intensity = this.palette.hemiIntensity;
    this.rimLight.color.set(this.palette.rimLightColor);
    this.rimLight.intensity = this.palette.rimLightIntensity;

    this.refreshSlabVisuals();
    this.renderer.render(this.scene, this.camera);
  }

  public setActiveLayer(index: number): void {
    if (this.isDisposed) return;
    const clamped = Math.max(0, Math.min(HERO_STACK_LAYERS.length - 1, index));
    if (clamped === this.activeLayerIndex) return;
    this.activeLayerIndex = clamped;
    this.refreshSlabVisuals();
    this.renderer.render(this.scene, this.camera);
  }

  public setCallbacks(callbacks: {
    onSelectLayer: (index: number) => void;
    onHoverLayer?: (index: number | null) => void;
    onContextLost?: () => void;
  }): void {
    this.onSelectLayer = callbacks.onSelectLayer;
    this.onHoverLayer = callbacks.onHoverLayer;
    this.onContextLost = callbacks.onContextLost;
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerX = nx;
    this.pointerY = ny;
    this.pointerNdc.set(nx, ny);

    const now = performance.now();
    if (now - this.lastRaycastMs < 40) return;
    this.lastRaycastMs = now;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    const nextHover =
      hits.length > 0 && typeof hits[0].object.userData.layerIndex === "number"
        ? (hits[0].object.userData.layerIndex as number)
        : null;

    if (nextHover !== this.hoveredLayerIndex) {
      this.hoveredLayerIndex = nextHover;
      this.renderer.domElement.style.cursor =
        nextHover !== null ? "pointer" : "default";
      this.refreshSlabVisuals();
      this.onHoverLayer?.(nextHover);
    }
  };

  private handlePointerLeave = (): void => {
    this.pointerX = 0;
    this.pointerY = 0;
    if (this.hoveredLayerIndex !== null) {
      this.hoveredLayerIndex = null;
      this.renderer.domElement.style.cursor = "default";
      this.refreshSlabVisuals();
      this.onHoverLayer?.(null);
    }
  };

  private handleClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    if (hits.length > 0 && typeof hits[0].object.userData.layerIndex === "number") {
      const idx = hits[0].object.userData.layerIndex as number;
      this.setActiveLayer(idx);
      this.onSelectLayer(idx);
    }
  };

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.stopLoop();
    this.onContextLost?.();
  };

  private handleVisibilityChange = (): void => {
    this.isTabVisible = !document.hidden;
    if (this.isTabVisible && this.isInView) {
      this.lastTickMs = performance.now();
      this.startLoop();
    } else {
      this.stopLoop();
    }
  };

  private bindEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointermove", this.handlePointerMove, {
      passive: true,
    });
    canvas.addEventListener("pointerleave", this.handlePointerLeave, {
      passive: true,
    });
    canvas.addEventListener("click", this.handleClick);
    canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.isDisposed) return;
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(260, Math.round(entry.contentRect.width));
        const h = Math.max(260, Math.round(entry.contentRect.height));
        this.updateCameraFraming(w, h);
        this.renderer.setPixelRatio(
          this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
        );
        this.renderer.setSize(w, h, false);
        this.renderer.render(this.scene, this.camera);
      });
      this.resizeObserver.observe(this.container);
    }

    if (typeof IntersectionObserver !== "undefined") {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          this.isInView = entry.isIntersecting;
          if (this.isInView && this.isTabVisible) {
            this.lastTickMs = performance.now();
            this.startLoop();
          } else {
            this.stopLoop();
          }
        },
        { threshold: 0.05 },
      );
      this.intersectionObserver.observe(this.container);
    }
  }

  private renderFrame(dt: number): void {
    this.elapsedSeconds += dt;

    // 1. Subtle architectural tilt + calm ambient breathing sway
    const { rotX, rotY } = computeHeroPointerTilt(this.pointerX, this.pointerY);
    const swayY = Math.sin(this.elapsedSeconds * 0.42) * 0.045;
    this.assemblyGroup.rotation.x = THREE.MathUtils.damp(
      this.assemblyGroup.rotation.x,
      rotX,
      4.5,
      dt,
    );
    this.assemblyGroup.rotation.y = THREE.MathUtils.damp(
      this.assemblyGroup.rotation.y,
      rotY + swayY,
      4.5,
      dt,
    );

    // 2. Smooth exploded-layer depth choreography
    const targets = computeLayerTargets(
      this.activeLayerIndex,
      this.hoveredLayerIndex,
    );
    for (let i = 0; i < this.slabs.length; i += 1) {
      const slab = this.slabs[i];
      const t = targets[i];
      const floatOffset = Math.sin(this.elapsedSeconds * 1.05 + i * 1.2) * 0.035;

      slab.currentY = THREE.MathUtils.damp(
        slab.currentY,
        t.y + floatOffset,
        6.0,
        dt,
      );
      slab.currentZ = THREE.MathUtils.damp(slab.currentZ, t.zSlide, 6.0, dt);
      slab.currentScale = THREE.MathUtils.damp(
        slab.currentScale,
        t.scale,
        6.0,
        dt,
      );

      slab.group.position.set(0, slab.currentY, slab.currentZ);
      slab.group.scale.setScalar(slab.currentScale);
    }

    // 3. Gliding signal pulses along inter-layer conduits
    for (let p = 0; p < this.pulses.length; p += 1) {
      const pulse = this.pulses[p];
      const u = (this.elapsedSeconds * pulse.speed + pulse.phase) % 1;
      pulse.curve.getPointAt(u, _vecA);
      pulse.curve.getTangentAt(u, _vecB);
      pulse.mesh.position.copy(_vecA);
      _vecB.add(_vecA);
      pulse.mesh.lookAt(_vecB);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private scheduleAfterDraw(cb: () => void): void {
    const gl = this.renderer.getContext();
    if (
      typeof WebGL2RenderingContext !== "undefined" &&
      gl instanceof WebGL2RenderingContext
    ) {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      let polls = 0;
      const poll = () => {
        if (this.isDisposed || !this.isInView || !this.isTabVisible) {
          if (sync) gl.deleteSync(sync);
          this.frameId = 0;
          return;
        }
        polls += 1;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED && polls < 40) {
          this.isTimeoutFrame = true;
          this.frameId = window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          this.isTimeoutFrame = true;
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.isTimeoutFrame = true;
      this.frameId = window.setTimeout(poll, 6);
      return;
    }

    this.isTimeoutFrame = true;
    this.frameId = window.setTimeout(cb, 90);
  }

  private tick = (): void => {
    if (this.isDisposed || !this.isInView || !this.isTabVisible) {
      this.frameId = 0;
      return;
    }
    const now = performance.now();
    const dt =
      this.lastTickMs > 0
        ? Math.min(0.05, Math.max(0.001, (now - this.lastTickMs) / 1000))
        : 0.016;
    this.lastTickMs = now;

    this.renderFrame(dt);

    if (this.isSoftwareGl) {
      this.scheduleAfterDraw(this.tick);
    } else {
      this.isTimeoutFrame = false;
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  private startLoop(): void {
    if (this.isDisposed || this.frameId !== 0) return;
    if (!this.isInView || !this.isTabVisible) return;
    this.lastTickMs = performance.now();
    if (this.isSoftwareGl) {
      this.isTimeoutFrame = true;
      this.frameId = window.setTimeout(this.tick, 80);
    } else {
      this.isTimeoutFrame = false;
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  }

  private stopLoop(): void {
    if (this.frameId !== 0) {
      if (this.isTimeoutFrame) {
        window.clearTimeout(this.frameId);
      } else {
        window.cancelAnimationFrame(this.frameId);
      }
      this.frameId = 0;
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.stopLoop();

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointermove", this.handlePointerMove);
    canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    canvas.removeEventListener("click", this.handleClick);
    canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    for (const item of this.disposables) {
      item.dispose();
    }
    this.envRenderTarget.dispose();
    this.renderer.dispose();

    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}

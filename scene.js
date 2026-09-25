/* ============================================================
   DINUDSI PORTFOLIO — 3D SCENE
   "Agent Constellation": a central orchestration core orbited
   by agent nodes, scroll-choreographed camera, mouse parallax.
   ============================================================ */

import * as THREE from "three";

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;
const isMobile = window.matchMedia("(max-width: 768px)").matches;

const COLORS = {
    ink: 0x060608,
    bone: 0xf2f0ea,
    acid: 0xd6ff3f,
    violet: 0x7c5cff,
    ember: 0xff6b35,
};

function init() {
    const canvas = document.getElementById("webgl");
    const fallback = document.querySelector(".scene-fallback");
    if (!canvas) return;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !isMobile,
            alpha: false,
            powerPreference: "high-performance",
        });
    } catch (e) {
        console.warn("WebGL unavailable, using CSS fallback.", e);
        return;
    }

    renderer.setClearColor(COLORS.ink, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(COLORS.ink, 0.045);

    const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / window.innerHeight,
        0.1,
        60
    );
    camera.position.set(0, 0, 7.2);

    /* ---------------- Lights ---------------- */
    scene.add(new THREE.AmbientLight(0x2a2a36, 1.4));

    const keyLight = new THREE.DirectionalLight(COLORS.bone, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(COLORS.acid, 1.6);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const violetLight = new THREE.PointLight(COLORS.violet, 60, 30, 2);
    violetLight.position.set(-4, 2, 3);
    scene.add(violetLight);

    const acidLight = new THREE.PointLight(COLORS.acid, 40, 25, 2);
    acidLight.position.set(3, -3, 4);
    scene.add(acidLight);

    /* ---------------- Root group ---------------- */
    const group = new THREE.Group();
    scene.add(group);

    /* ---------------- Core ---------------- */
    const coreGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0e0e14,
        metalness: 0.85,
        roughness: 0.28,
        flatShading: true,
        emissive: COLORS.acid,
        emissiveIntensity: 0.06,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Wireframe shell
    const shellGeo = new THREE.IcosahedronGeometry(1.38, 0);
    const shellEdges = new THREE.EdgesGeometry(shellGeo);
    const shellMat = new THREE.LineBasicMaterial({
        color: COLORS.acid,
        transparent: true,
        opacity: 0.35,
    });
    const shell = new THREE.LineSegments(shellEdges, shellMat);
    group.add(shell);

    // Inner glow sphere
    const glowCore = new THREE.Mesh(
        new THREE.SphereGeometry(1.16, 32, 32),
        new THREE.MeshBasicMaterial({
            color: COLORS.acid,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide,
        })
    );
    group.add(glowCore);

    // Soft additive glow sprite behind core
    const glowTex = makeGlowTexture();
    const coreGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTex,
            color: COLORS.acid,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    coreGlow.scale.set(6.5, 6.5, 1);
    group.add(coreGlow);

    const violetGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTex,
            color: COLORS.violet,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    violetGlow.scale.set(9, 9, 1);
    violetGlow.position.set(-1.4, 0.8, -2);
    group.add(violetGlow);

    /* ---------------- Orbital rings + agents ---------------- */
    const ringDefs = [
        { rx: 2.1, ry: 2.1, tilt: [0.55, 0.2, 0.1], color: COLORS.acid, op: 0.28, speed: 0.16 },
        { rx: 2.75, ry: 2.45, tilt: [-0.7, 0.6, 0.35], color: COLORS.violet, op: 0.24, speed: -0.11 },
        { rx: 3.3, ry: 3.05, tilt: [0.25, -0.85, -0.4], color: COLORS.bone, op: 0.12, speed: 0.07 },
    ];

    const rings = [];
    const agents = [];
    const agentColors = [COLORS.acid, COLORS.violet, COLORS.ember, COLORS.bone];

    ringDefs.forEach((def, ri) => {
        const ringGroup = new THREE.Group();
        ringGroup.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
        group.add(ringGroup);

        // Visible orbit line
        const pts = [];
        const SEG = 128;
        for (let i = 0; i <= SEG; i++) {
            const a = (i / SEG) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a) * def.rx, 0, Math.sin(a) * def.ry));
        }
        const ringLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({
                color: def.color,
                transparent: true,
                opacity: def.op,
            })
        );
        ringGroup.add(ringLine);

        rings.push({
            group: ringGroup,
            rx: def.rx,
            ry: def.ry,
            speed: def.speed,
            quat: new THREE.Quaternion(),
        });

        // Agents on this ring
        const count = isMobile ? 2 : ri === 0 ? 3 : 2;
        for (let i = 0; i < count; i++) {
            const color = agentColors[(ri + i) % agentColors.length];
            const agent = new THREE.Mesh(
                new THREE.OctahedronGeometry(ri === 0 ? 0.16 : 0.12, 0),
                new THREE.MeshStandardMaterial({
                    color: 0x101018,
                    metalness: 0.6,
                    roughness: 0.3,
                    flatShading: true,
                    emissive: color,
                    emissiveIntensity: 0.9,
                })
            );
            group.add(agent);

            // Link line core → agent (dynamic endpoints)
            const linkGeo = new THREE.BufferGeometry();
            linkGeo.setAttribute(
                "position",
                new THREE.BufferAttribute(new Float32Array(6), 3)
            );
            const link = new THREE.Line(
                linkGeo,
                new THREE.LineBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.22,
                })
            );
            group.add(link);

            agents.push({
                mesh: agent,
                link,
                ringIndex: rings.length - 1,
                angle: Math.random() * Math.PI * 2,
                // slight radial offset breathing
                wobble: Math.random() * Math.PI * 2,
                spin: 0.4 + Math.random() * 0.8,
            });
        }
    });

    /* ---------------- Dust particles ---------------- */
    const pCount = isMobile ? 350 : 800;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const cAcid = new THREE.Color(COLORS.acid);
    const cViolet = new THREE.Color(COLORS.violet);
    const cBone = new THREE.Color(COLORS.bone);

    for (let i = 0; i < pCount; i++) {
        const r = 4.5 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        pPos[i * 3 + 2] = r * Math.cos(phi);

        const c = Math.random() < 0.6 ? cBone : Math.random() < 0.5 ? cAcid : cViolet;
        pCol[i * 3] = c.r;
        pCol[i * 3 + 1] = c.g;
        pCol[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));

    const dust = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
            size: isMobile ? 0.035 : 0.028,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            sizeAttenuation: true,
            depthWrite: false,
        })
    );
    scene.add(dust);

    /* ---------------- Interaction state ---------------- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollProgress = 0;
    // Keep the core to the right of hero copy on wide screens
    let baseX = window.innerWidth > 900 ? 2.1 : 0;

    window.addEventListener(
        "pointermove",
        (e) => {
            pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
        },
        { passive: true }
    );

    function updateScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    }
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    /* ---------------- Resize ---------------- */
    function onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)
        );
        renderer.setSize(w, h);
        baseX = w > 900 ? 2.1 : 0;
    }
    window.addEventListener("resize", onResize);

    /* ---------------- Loop ---------------- */
    const tmpVec = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const clock = new THREE.Clock();
    let rafId = 0;
    let running = true;

    function frame() {
        if (!running) return;
        rafId = requestAnimationFrame(frame);
        const t = clock.getElapsedTime();
        const p = scrollProgress;

        // Pointer easing
        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;

        // Core rotation + breathing
        core.rotation.y = t * 0.18 + p * Math.PI * 1.2;
        core.rotation.x = Math.sin(t * 0.22) * 0.18 + p * 0.6;
        shell.rotation.y = -t * 0.12 - p * Math.PI * 0.8;
        shell.rotation.z = t * 0.05;
        const breathe = 1 + Math.sin(t * 1.4) * 0.035;
        core.scale.setScalar(breathe);
        glowCore.scale.setScalar(breathe);

        coreMat.emissiveIntensity = 0.06 + Math.sin(t * 2.2) * 0.03 + p * 0.05;

        // Group float + scroll drift
        group.position.y = Math.sin(t * 0.5) * 0.1 - p * 0.4;
        group.position.x = baseX + Math.sin(p * Math.PI) * -1.4;
        group.rotation.y = pointer.x * 0.35 + p * 0.5;
        group.rotation.x = pointer.y * 0.22;

        // Rings rotate
        rings.forEach((ring) => {
            ring.group.rotation.y += ring.speed * 0.008;
            ring.quat.copy(ring.group.quaternion);
        });

        // Agents orbit + links
        agents.forEach((a) => {
            const ring = rings[a.ringIndex];
            a.angle += ring.speed * 0.012;
            const wob = Math.sin(t * 1.2 + a.wobble) * 0.06;
            const rx = ring.rx + wob;
            const ry = ring.ry + wob;

            tmpVec.set(Math.cos(a.angle) * rx, 0, Math.sin(a.angle) * ry);
            // apply ring local rotation into group space
            tmpQuat.copy(ring.group.quaternion);
            tmpVec.applyQuaternion(tmpQuat);
            a.mesh.position.copy(tmpVec);
            a.mesh.rotation.y += 0.01 * a.spin;
            a.mesh.rotation.x += 0.006 * a.spin;

            // Update link endpoint (positions attr: origin at core, end at agent)
            const attr = a.link.geometry.getAttribute("position");
            attr.setXYZ(0, 0, 0, 0);
            attr.setXYZ(1, tmpVec.x, tmpVec.y, tmpVec.z);
            attr.needsUpdate = true;
        });

        // Camera choreography (scroll-scrubbed orbit + pull-back)
        const orbit = p * Math.PI * 0.55;
        const radius = 7.2 + p * 2.4;
        const camX = Math.sin(orbit) * radius * 0.3 + pointer.x * 0.5;
        const camY = pointer.y * -0.4 + p * 0.8;
        const camZ = radius;
        camera.position.x += (camX - camera.position.x) * 0.06;
        camera.position.y += (camY - camera.position.y) * 0.06;
        camera.position.z += (camZ - camera.position.z) * 0.06;
        camera.lookAt(group.position.x * 0.55, -p * 0.5, 0);

        // Dim scene slightly as we scroll past hero
        renderer.toneMappingExposure = 1 - p * 0.35;
        shellMat.opacity = 0.35 - p * 0.15;

        // Dust drift
        dust.rotation.y = t * 0.015 + p * 0.3;
        dust.rotation.x = pointer.y * 0.05;

        renderer.render(scene, camera);
    }

    function renderStatic() {
        renderer.render(scene, camera);
    }

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            running = false;
            cancelAnimationFrame(rafId);
        } else if (!reducedMotion) {
            running = true;
            clock.start();
            frame();
        }
    });

    // Reveal canvas + hide CSS fallback
    canvas.classList.add("is-ready");
    if (fallback) fallback.classList.add("is-hidden");

    if (reducedMotion) {
        renderStatic();
    } else {
        frame();
    }
}

function makeGlowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(0.6, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// Boot when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

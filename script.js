/* ============================================================
   DINUDSI PORTFOLIO — UI ORCHESTRATION
   preloader · cursor · lenis · gsap reveals · magnetic ·
   typing · counters · scramble · clock · marquee · nav
   ============================================================ */

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   PRELOADER
   ============================================================ */
function runPreloader() {
    const pre = document.getElementById("preloader");
    const countEl = document.getElementById("preloaderCount");
    const barEl = document.getElementById("preloaderBar");
    if (!pre) return Promise.resolve();

    if (reducedMotion) {
        pre.classList.add("is-done");
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const duration = 1400;
        const start = performance.now();
        let settled = false;

        function finish() {
            if (settled) return;
            settled = true;
            if (countEl) countEl.textContent = "100";
            if (barEl) barEl.style.transform = "scaleX(1)";
            pre.classList.add("is-done");
            resolve();
        }

        function tick(now) {
            if (settled) return;
            const p = Math.max(0, Math.min((now - start) / duration, 1));
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.round(eased * 100);
            if (countEl) countEl.textContent = String(val).padStart(2, "0");
            if (barEl) barEl.style.transform = `scaleX(${eased})`;
            if (p < 1) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(finish, 180);
            }
        }
        requestAnimationFrame(tick);

        // Hard fallback if rAF is throttled/frozen (bg tab, headless, etc.)
        setTimeout(finish, 2800);
    });
}

/* ============================================================
   SMOOTH SCROLL (Lenis)
   ============================================================ */
let lenis = null;

function initLenis() {
    if (reducedMotion || typeof window.Lenis === "undefined") return null;

    lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
    });

    document.documentElement.classList.add("lenis");

    if (ScrollTrigger) {
        lenis.on("scroll", ScrollTrigger.update);
    }

    if (gsap) {
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    } else {
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    return lenis;
}

function scrollToTarget(target) {
    const offset = -80;
    if (lenis) {
        lenis.scrollTo(target, { offset, duration: 1.3 });
    } else {
        const top =
            target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
}

/* ============================================================
   ANCHOR LINKS
   ============================================================ */
function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const href = anchor.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            closeMobileMenu();
            scrollToTarget(target);
            history.replaceState(null, "", href);
        });
    });
}

/* ============================================================
   NAV + SCROLL PROGRESS + ACTIVE SECTION
   ============================================================ */
function initNav() {
    const nav = document.getElementById("nav");
    const bar = document.getElementById("scrollProgressBar");
    const links = document.querySelectorAll(".nav-link");

    function onScroll() {
        const y = window.scrollY;
        if (nav) nav.classList.toggle("scrolled", y > 40);

        const wa = document.querySelector(".floating-wa");
        if (wa) wa.classList.toggle("is-visible", y > 320);

        const max =
            document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Active section
    const sections = document.querySelectorAll("section[id]");
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                links.forEach((l) =>
                    l.classList.toggle(
                        "active",
                        l.getAttribute("href") === `#${id}`
                    )
                );
            });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

function closeMobileMenu() {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    if (lenis) lenis.start();
}

function initMobileMenu() {
    if (!navToggle || !mobileMenu) return;

    navToggle.addEventListener("click", () => {
        const open = navToggle.getAttribute("aria-expanded") === "true";
        if (open) {
            closeMobileMenu();
        } else {
            navToggle.setAttribute("aria-expanded", "true");
            mobileMenu.classList.add("is-open");
            mobileMenu.setAttribute("aria-hidden", "false");
            document.body.classList.add("menu-open");
            if (lenis) lenis.stop();
        }
    });
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
    if (!finePointer || reducedMotion) return;

    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    const label = document.querySelector(".cursor-label");
    if (!dot || !ring) return;

    document.body.classList.add("has-cursor");

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };
    let visible = false;

    window.addEventListener(
        "pointermove",
        (e) => {
            pos.x = e.clientX;
            pos.y = e.clientY;
            if (!visible) {
                visible = true;
                dot.style.opacity = "1";
                ring.style.opacity = "1";
            }
            dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
        },
        { passive: true }
    );

    function loop() {
        ringPos.x += (pos.x - ringPos.x) * 0.16;
        ringPos.y += (pos.y - ringPos.y) * 0.16;
        ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
    }
    loop();

    // Hover states
    const hoverables = document.querySelectorAll(
        "a, button, [data-cursor], .tag"
    );
    hoverables.forEach((el) => {
        el.addEventListener("pointerenter", () => {
            const mode = el.getAttribute("data-cursor");
            ring.classList.remove("is-hover", "is-label");
            if (mode === "view" || mode === "copy") {
                ring.classList.add("is-label");
                if (label) label.textContent = mode === "copy" ? "Copy" : "View";
            } else {
                ring.classList.add("is-hover");
            }
        });
        el.addEventListener("pointerleave", () => {
            ring.classList.remove("is-hover", "is-label");
        });
    });
}

/* ============================================================
   MAGNETIC ELEMENTS
   ============================================================ */
function initMagnetic() {
    if (!finePointer || reducedMotion) return;

    document.querySelectorAll(".magnetic").forEach((el) => {
        const strength = 0.35;
        el.addEventListener("pointermove", (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
        el.addEventListener("pointerleave", () => {
            el.style.transform = "translate(0, 0)";
        });
    });
}

/* ============================================================
   CARD TILT + GLARE
   ============================================================ */
function initTilt() {
    if (!finePointer || reducedMotion) return;

    document.querySelectorAll(".tilt").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = ((y - cy) / cy) * -5;
            const ry = ((x - cx) / cx) * 5;
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
            card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
            card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
        });
        card.addEventListener("pointerleave", () => {
            card.style.transform =
                "perspective(900px) rotateX(0deg) rotateY(0deg)";
        });
    });
}

/* ============================================================
   TEXT SCRAMBLE
   ============================================================ */
const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#________";

function scrambleText(el) {
    if (reducedMotion || el.dataset.scrambling === "1") return;
    const original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    el.dataset.scrambling = "1";

    let frame = 0;
    const total = 14;
    const queue = original.split("").map((char, i) => ({
        char,
        start: Math.floor(Math.random() * 6),
        end: Math.floor(Math.random() * 6) + 6 + i,
    }));

    function update() {
        const output = original
            .split("")
            .map((ch, i) => {
                const q = queue[i];
                if (frame >= q.end) return ch;
                if (frame >= q.start)
                    return SCRAMBLE_CHARS[
                        Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                    ];
                return ch;
            })
            .join("");

        el.textContent = output;
        frame++;
        if (frame <= total) {
            requestAnimationFrame(update);
        } else {
            el.textContent = original;
            el.dataset.scrambling = "0";
        }
    }
    update();
}

function initScramble() {
    document.querySelectorAll("[data-scramble]").forEach((el) => {
        el.addEventListener("pointerenter", () => scrambleText(el));
    });
}

/* ============================================================
   TYPING ROLES
   ============================================================ */
function initTyping() {
    const el = document.getElementById("typingText");
    if (!el) return;

    const roles = [
        "System Architect",
        "AI Engineer",
        "Agent Builder",
        "Indie Hacker",
        "Security Reviewer",
    ];

    if (reducedMotion) {
        el.textContent = roles.join(" · ");
        return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function type() {
        const current = roles[roleIndex];
        if (deleting) {
            charIndex--;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(type, 320);
                return;
            }
            setTimeout(type, 36);
        } else {
            charIndex++;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
                deleting = true;
                setTimeout(type, 1900);
                return;
            }
            setTimeout(type, 68);
        }
    }
    setTimeout(type, 600);
}

/* ============================================================
   SPLIT HERO NAME INTO CHARS
   ============================================================ */
function splitHeroName() {
    const el = document.querySelector("[data-split]");
    if (!el) return [];
    const text = el.textContent.trim();
    el.textContent = "";
    const chars = [];
    text.split("").forEach((ch) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = ch;
        el.appendChild(span);
        chars.push(span);
    });
    return chars;
}

/* ============================================================
   HERO INTRO (GSAP)
   ============================================================ */
let heroIntroStarted = false;
let heroIntroCompleted = false;

function forceHeroVisible() {
    document
        .querySelectorAll(".hero-name-inner .char, .hero .reveal-line")
        .forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
        });
    heroIntroCompleted = true;
    animateCounters();
}

function playHeroIntro(chars) {
    heroIntroStarted = true;
    const lines = document.querySelectorAll(".hero .reveal-line");

    if (reducedMotion || !gsap) {
        chars.forEach((c) => {
            c.style.opacity = 1;
            c.style.transform = "none";
        });
        lines.forEach((l) => {
            l.style.opacity = 1;
            l.style.transform = "none";
        });
        heroIntroCompleted = true;
        animateCounters();
        return;
    }

    gsap.set(lines, { y: 26, opacity: 0 });

    const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => {
            heroIntroCompleted = true;
        },
    });

    tl.to(chars, {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.1,
        stagger: 0.045,
    })
        .to(
            lines,
            {
                y: 0,
                opacity: 1,
                duration: 0.9,
                stagger: 0.1,
            },
            "-=0.7"
        )
        .add(() => animateCounters(), "-=0.5");
}

/* ============================================================
   STAT COUNTERS
   ============================================================ */
let countersDone = false;

function animateCounters() {
    if (countersDone) return;
    countersDone = true;

    const nums = document.querySelectorAll(".stat-number");

    nums.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-count"), 10);
        if (Number.isNaN(target)) return;

        if (reducedMotion) {
            counter.textContent = String(target);
            return;
        }

        counter.textContent = "0";
        const duration = 1600;
        const start = performance.now();
        let settled = false;

        const finalize = () => {
            if (settled) return;
            settled = true;
            counter.textContent = String(target);
        };

        function update(now) {
            if (settled) return;
            const p = Math.max(0, Math.min((now - start) / duration, 1));
            const eased = 1 - Math.pow(1 - p, 3);
            counter.textContent = String(Math.max(0, Math.round(eased * target)));
            if (p < 1) requestAnimationFrame(update);
            else finalize();
        }
        requestAnimationFrame(update);

        // Settle even if rAF is throttled/frozen or timestamps skew
        setTimeout(finalize, duration + 500);
    });
}

/* ============================================================
   SCROLL REVEALS
   ============================================================ */
function initReveals() {
    const els = document.querySelectorAll(".fade-up");

    if (reducedMotion) {
        els.forEach((el) => el.classList.add("is-visible"));
        return;
    }

    // Stagger siblings within the same parent
    const groups = new Map();
    els.forEach((el) => {
        const parent = el.parentElement;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(el);
    });
    groups.forEach((siblings) => {
        siblings.forEach((el, i) => {
            el.style.setProperty("--d", `${Math.min(i * 0.07, 0.5)}s`);
        });
    });

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                }
            });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
}

/* ============================================================
   QUOTE WORD REVEAL (scroll-scrubbed)
   ============================================================ */
function initQuote() {
    const quote = document.querySelector(".quote-text");
    if (!quote) return;

    const words = quote.textContent.trim().split(/\s+/);
    quote.innerHTML = words
        .map((w) => `<span class="word">${w}</span>`)
        .join(" ");
    const spans = quote.querySelectorAll(".word");

    if (reducedMotion || !gsap || !ScrollTrigger) {
        spans.forEach((s) => s.classList.add("is-lit"));
        return;
    }

    ScrollTrigger.create({
        trigger: quote,
        start: "top 80%",
        end: "bottom 45%",
        scrub: 0.6,
        onUpdate: (self) => {
            const lit = Math.floor(self.progress * spans.length);
            spans.forEach((s, i) => s.classList.toggle("is-lit", i <= lit));
        },
    });
}

/* ============================================================
   MARQUEE (infinite loop)
   ============================================================ */
function initMarquee() {
    const track = document.getElementById("marqueeTrack");
    if (!track || reducedMotion) return;

    // Track content is already duplicated in HTML; animate half width
    let x = 0;
    const speed = 0.6;

    function measure() {
        return track.scrollWidth / 2;
    }
    let half = measure();
    window.addEventListener("resize", () => {
        half = measure();
    });

    function loop() {
        x -= speed;
        if (Math.abs(x) >= half) x = 0;
        track.style.transform = `translate3d(${x}px, 0, 0)`;
        requestAnimationFrame(loop);
    }
    loop();
}

/* ============================================================
   CLOCKS (nav + HUD, Asia/Kolkata)
   ============================================================ */
function initClocks() {
    const navClock = document.getElementById("navClock");
    const hudClock = document.getElementById("hudClock");
    if (!navClock && !hudClock) return;

    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    function update() {
        const now = new Date();
        const parts = fmt.formatToParts(now);
        const get = (t) => parts.find((p) => p.type === t)?.value || "00";
        const time = `${get("hour")}:${get("minute")}:${get("second")}`;
        if (navClock) navClock.textContent = time;
        if (hudClock) hudClock.textContent = `${time} IST`;
    }
    update();
    setInterval(update, 1000);
}

/* ============================================================
   COPY EMAIL + TOAST
   ============================================================ */
function initCopyEmail() {
    const btn = document.getElementById("copyEmail");
    const toast = document.getElementById("toast");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        const email = btn.getAttribute("data-email") || "";
        try {
            await navigator.clipboard.writeText(email);
            showToast(toast, "Email copied to clipboard");
        } catch {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = email;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            showToast(toast, "Email copied to clipboard");
        }
    });
}

let toastTimer = null;
function showToast(toast, msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-show"), 2200);
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
    // Hide reveal targets only now (preloader covers the swap)
    document.documentElement.classList.add("js-anim");

    // Split + hide hero chars early so there's no flash under the preloader
    let heroChars = [];
    if (!reducedMotion && gsap) {
        heroChars = splitHeroName();
        gsap.set(heroChars, {
            yPercent: 110,
            opacity: 0,
            rotateX: -40,
            transformPerspective: 600,
        });
    } else {
        heroChars = splitHeroName();
    }

    initNav();
    initMobileMenu();
    initAnchors();
    initClocks();
    initTyping();
    initCursor();
    initMagnetic();
    initTilt();
    initScramble();
    initReveals();
    initQuote();
    initMarquee();
    initCopyEmail();

    await runPreloader();
    initLenis();
    playHeroIntro(heroChars);

    // Refresh ScrollTrigger after layout settles
    if (ScrollTrigger) {
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}

// Last-resort: never leave the hero hidden (broken CDN, frozen ticker, …)
setTimeout(() => {
    if (heroIntroStarted && !heroIntroCompleted) forceHeroVisible();
}, 7000);

# dinudsi.github.io

Personal portfolio site for **Dinudsi** — System Architect, AI Engineer & Indie Hacker.

## Live Site

[https://dinudsi.github.io](https://dinudsi.github.io)

## Design

"SYSTEM://DINUDSI" — a dark, technical HUD/editorial direction:

- **Palette:** ink `#060608` · bone `#F2F0EA` · acid `#D6FF3F` (violet `#7C5CFF` accents)
- **Type:** Syne (display) · Inter (body) · JetBrains Mono (labels/HUD)
- **3D:** scroll-choreographed "Agent Constellation" — a central orchestration core orbited by agent nodes (Three.js)

## Features

- Preloader with counter + clip-path exit
- Three.js WebGL scene: core + orbital agents + dust field, scroll-scrubbed camera, mouse parallax
- Lenis smooth scrolling + GSAP ScrollTrigger
- Custom cursor (dot + lagging ring) with contextual labels
- Magnetic buttons, card tilt with specular glare
- Text scramble on nav/footer links
- Split-character hero intro, role typewriter, animated stat counters
- Infinite marquee, scroll-scrubbed quote reveal, Udaipur (IST) live clock
- Click-to-copy email with toast
- Fullscreen mobile menu
- `prefers-reduced-motion` + no-WebGL/no-JS fallbacks
- Zero build step — pure HTML/CSS/JS, libraries via CDN

## Sections

- **Hero** — name, statement, roles, stats, CTAs over the 3D scene
- **Marquee** — capability ticker
- **Profile** — bio + spec sheet
- **Stack** — bento grid of the agent-first toolkit
- **Work** — 8 selected builds (strangers.lol, Docly, BrainSync, Commitify, …)
- **Approach** — highlights, philosophy quote, principles
- **Contact** — email / WhatsApp / GitHub / X / Peerlist cells

## SEO / GEO

Structured data (Person, ProfilePage, ItemList, FAQPage, Breadcrumb), Open Graph, Twitter cards, and screen-reader-visible summaries for AI crawlers are preserved in `index.html`.

## Deployment

Push to the `main` branch and enable GitHub Pages in repository settings (source: root of `main` branch).

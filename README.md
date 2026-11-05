# PHILO // 3D Systems Architecture Developer Portfolio

An immersive, scroll-driven interactive 3D portfolio prototype tailored for a Full-Stack Software Engineer specializing in **Backend Engineering, System Design, and Resilient Architecture**.

Built with **Next.js App Router**, **TypeScript**, **React Three Fiber**, **Three.js**, and custom editorial CSS.

---

## 1. Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Linting
```bash
npx tsc --noEmit
npm run lint
```

### Production Build & Launch
```bash
npm run build
npm run start
```

---

## 2. Project Architecture & File Boundaries

```
src/
├── app/
│   ├── layout.tsx             # Root layout, metadata & viewport configuration
│   ├── page.tsx               # Continuous scroll orchestrator (Scenes 01–06)
│   ├── globals.css            # Base CSS import
│   ├── work/[slug]/page.tsx   # Detailed project case study routes
│   └── notes/[slug]/page.tsx  # Engineering deep-dive article routes
├── components/
│   ├── Navigation.tsx         # Accessible navigation bar, skip link, mobile drawer
│   ├── FallbackView.tsx       # Accessibility status badge for WebGL fallback
│   └── ProjectSchematicVisual.tsx # Interactive schematic runtime visualizers
├── scenes/
│   ├── HeroScene.tsx          # Scene 01: The Arrival
│   ├── TransformationScene.tsx# Scene 02: The Transformation
│   ├── ArchitectureScene.tsx  # Scene 03: Behind the Systems
│   ├── ProjectsScene.tsx      # Scene 04: Selected Work
│   ├── NotesScene.tsx         # Scene 05: Engineering Notes
│   └── FinaleScene.tsx        # Scene 06: The Finale & Contact
├── three/
│   ├── PortfolioCanvas.tsx    # Persistent lazy R3F Canvas with DPR caps & context-loss handler
│   ├── SceneDirector.tsx      # Camera choreography & synchronized lighting transitions
│   ├── CharacterMesh.tsx      # Procedural lavender clay systems-keeper character
│   ├── PortalMesh.tsx         # Expanding dark circular portal geometry
│   └── SystemNodesMesh.tsx    # 3D spatial architecture nodes with animated signal flows
├── data/
│   └── portfolioData.ts       # Central typed data for brand, projects, notes & stack
├── lib/
│   └── useTestOverrides.ts    # Deterministic test hooks (?webgl=off, ?motion=off)
├── styles/
│   └── globals.css            # Editorial typography, color variables & layout styling
└── types/
    └── index.ts               # Complete TypeScript interfaces
```

---

## 3. How to Customize & Edit

### Editing Personal Identity & Brand Info
Open `src/data/portfolioData.ts`. Update `BRAND_INFO`:
```typescript
export const BRAND_INFO = {
  name: 'PHILO',
  role: 'Full-Stack Software Engineer',
  specialization: 'Backend Engineering, System Design & Architecture',
  tagline: 'Full-Stack Engineer. Backend at Heart.',
  email: 'contact@philo.dev',
  github: 'https://github.com/your-username',
  linkedin: 'https://linkedin.com/in/your-username',
  cvAvailable: false, // Set to true when /public/cv.pdf is added
};
```

### Adding or Modifying Projects
In `src/data/portfolioData.ts`, edit the `PROJECTS` array. Each project automatically generates:
- A showcase card in Scene 04.
- A static case-study route at `/work/[slug]`.
- An interactive schematic (`task-flow`, `license-matrix`, or `security-topology`).

### Adding or Modifying Engineering Notes
In `src/data/portfolioData.ts`, edit the `NOTES` array. Each note automatically generates:
- An editorial card in Scene 05.
- A readable article route at `/notes/[slug]` with code syntax highlighting.

---

## 4. 3D Systems-Keeper Character & Animations

### Character Silhouette & Features (`src/three/CharacterMesh.tsx`)
- **Procedural Clay Silhouette**: Built entirely from procedural geometries (spheres, capsules, and tori) with soft lavender clay materials (`#B9A5F6`).
- **Signature Silhouette**: Features a playful sculpted curl/hood on the head crest and a beveled stage pedestal with a contact shadow disc.
- **Expressive Eyes**: Large glossy porcelain sclera, obsidian pupils, specular catchlights, and organic eyelid blinking logic.
- **Pointer Tracking**: Head and pupils smoothly lerp toward cursor coordinates on desktop, with subtle autonomous breathing and sway on mobile.
- **Scroll Response**: Welcoming in Scene 01, retreats backward into the circular portal in Scene 02, and re-emerges in a graceful resting pose in Scene 06.

### Replacing the Character with an External GLTF/GLB Model
If you wish to use a custom 3D model instead of procedural geometry:
1. Place your `.glb` file inside `/public/models/character.glb`.
2. In `src/three/CharacterMesh.tsx`, import `useGLTF` from `@react-three/drei`:
   ```tsx
   import { useGLTF } from '@react-three/drei';
   const { scene } = useGLTF('/models/character.glb');
   return <primitive object={scene} />;
   ```

### Customizing Camera Choreography (`src/three/SceneDirector.tsx`)
Camera positioning across scroll sections is managed within `SceneDirector.tsx`'s `useFrame` hook. The `scrollProgress` (0.0 to 1.0) controls camera coordinates `(x, y, z)` and `lookAt` vectors for each scene interval:
- `0.00 – 0.18`: Scene 01 (Arrival)
- `0.18 – 0.35`: Scene 02 (Transformation / Portal scrub)
- `0.35 – 0.62`: Scene 03 (Behind the Systems / Architecture)
- `0.62 – 0.82`: Scenes 04 & 05 (Projects & Notes)
- `0.82 – 1.00`: Scene 06 (Finale Return)

---

## 5. Performance, Accessibility & Test Hooks

- **DPR Hard Cap**: Max `1.0` on mobile viewports and `1.5` on desktop to prevent mobile GPU throttling.
- **Frame Loop Management**: The render loop pauses when the document is hidden (`document.visibilityState === 'hidden'`).
- **Deterministic Test Query Overrides**:
  - `?webgl=off`: Forces WebGL canvas unmount and displays the accessible HTML/CSS fallback presentation.
  - `?motion=off`: Disables camera scrub transitions and character sway, adhering to `prefers-reduced-motion`.
- **Keyboard & Screen Reader Support**: Includes a skip link, semantic HTML landmarks (`<header>`, `<main>`, `<section>`, `<footer>`), ARIA attributes, and accessible mobile drawer with `Escape` key listeners.

---

## 6. Known Limitations

1. **Demonstration Data**: Current projects and engineering notes represent architectural demonstration profiles. Links to third-party repositories remain non-interactive placeholders until configured in `portfolioData.ts`.
2. **WebGL Hardware Acceleration**: Requires a WebGL2-compatible browser. If disabled or on low-end hardware, the site falls back gracefully to standard responsive CSS layouts without layout shift.

---

## 7. License & Integrity

This prototype uses 100% original procedural geometry and custom styling. No restricted, third-party, or proprietary 3D assets or reference code were copied or reused. All code is licensed under the MIT License.

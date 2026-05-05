# Frontend Design and Interaction Boundaries

Load this rule for UI-facing work. Keep the loaded surface small.

## Activation

Use this rule for:
- UI, UX, page, screen, component, layout, landing, dashboard, form, onboarding, animation, interaction
- redesign, reskin, visual refresh, responsive fix, hierarchy fix
- frontend deliverables inside fullstack or backend work

## Authority

- Use current repo evidence, the active brief, and current project docs as valid style context.
- Treat `.agent-context/` as design governance authority.
- Treat `README.md` as overview/install/user context only when design or architecture rules conflict.
- Do not choose final style, framework, palette, typography, layout paradigm, or animation library offline.
- Research current official docs before adding a new UI, animation, scroll, 3D, canvas, charting, icon, styling, or primitive library.
- Keep design continuity opt-in. Repo evidence outranks memory residue.

## Required Design Contract

Before UI code, create or refine:
- `docs/DESIGN.md`
- `docs/design-intent.json`

The contract must record:
- `motionPaletteDecision`
- `conceptualAnchor`
- `derivedTokenLogic`
- `aiSafeUiAudit`
- `designExecutionPolicy`
- `designExecutionHandoff`
- `reviewRubric`
- `contextHygiene`
- `libraryResearchStatus` and `libraryDecisions[]`

## Anti-Generic UI Gate

Do not ship interchangeable dashboard chrome, balanced card grids, centered marketing shells, generic component-kit surfaces, generic abstract logos, or nonfunctional background decoration unless the product earns them.

For new screens or broad redesigns, make at least three at-a-glance product-specific signals visible. Signals may be data treatment, iconography, state language, motion behavior, spatial structure, typography, material logic, or color behavior.

Use the rename test: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, revise before implementation is considered complete.

Use the old-design regression test for broad redesigns: if the UI reads as the previous design with fewer details, removed animation, simplified sections, or a new palette on the same composition, revise before implementation is considered complete.

Background lines, grids, scanlines, noise, glows, blobs, abstract logos, and decorative geometry are invalid as wallpaper. Do not use grid or line backgrounds as first-output filler. Use them only for a named product function such as alignment, crop guidance, map/route orientation, timeline reading, measurement, status, or motion continuity.

## Dynamic Anchor Gate

If the user gives no current-task visual research or reference:
- Do not count old UI, existing design docs, or scaffold seeds as research.
- Choose one high-variance non-software conceptual anchor before UI code.
- Internally reject the safest dashboard, portal, card-grid, admin-shell, or minimalist-web-app mental model.
- Record one real-world anchor reference, one signature motion behavior, and one typographic decision with role contrast.
- Derive typography, spacing, morphology, motion, and responsive recomposition from that anchor.
- Reject anchors described only by generic quality words such as modern, clean, premium, expressive, minimal, or bold.

## Motion, Palette, and 3D

- Product categories are heuristics, not style presets.
- Choose motion density from task, content density, brand intent, device budget, performance, and accessibility.
- Map states before coding: default, hover, focus-visible, active, disabled, loading, empty, error, success, transition.
- Prefer visually exploratory, product-derived palettes while preserving WCAG contrast and status clarity.
- Do not default to dark slate, cream/beige/tan, purple-blue gradients, monochrome palettes, cyber-neon terminals, or uniform card surfaces without product evidence.
- Treat motion, 3D, WebGL, canvas, scroll choreography, and animation libraries as first-class options.
- Omit rich motion or spatial UI only after naming the product-fit reason and the replacement interaction quality.
- For new screens or broad redesigns, research the expressive implementation path instead of defaulting to static native CSS. Use native or already-installed tools only when they can still deliver the chosen ambition, or when a concrete blocker is documented.
- Keep reduced-motion, keyboard, loading, performance, mobile, and non-3D fallbacks explicit.

## Zero-Based Redesign

If the user asks for a redesign from zero:
- Treat existing UI as behavioral/content evidence only.
- Discard prior palette, typography, hero composition, navigation placement, component morphology, motion signature, and image framing unless the user requests continuity.
- Rewrite or materially update both design docs before coding.
- Change primary composition, content hierarchy, interaction model, and responsive information architecture.
- Reject palette swaps, dark-mode flips, and restyled heroes.
- Reject implementations that remove animation, media, depth, or interaction density merely to reduce complexity when the request calls for a more distinctive experience.

## Responsive Mutation

Responsive quality is not scale-only.

- Mobile must prioritize the first decisive action.
- Tablet must regroup surfaces instead of shrinking desktop.
- Desktop may expose more context but must not become interchangeable admin chrome.
- At least one major surface must change position, grouping, priority, or disclosure strategy between mobile and desktop.

## Accessibility

- WCAG 2.2 AA is the hard floor.
- APCA is advisory perceptual tuning only.
- Hard checks include focus visibility, focus appearance, target size, keyboard access, accessible authentication, color-only meaning, and dynamic status/state access.
- Fix accessibility issues without flattening the UI into generic safe chrome unless no expressive safe option remains.

## Implementation Boundaries

- Follow the shipped project stack and current repo patterns.
- Do not hardcode Zustand, React Query, smart/dumb component doctrine, or framework-specific architecture as universal design law.
- Keep structure feature-oriented when it improves maintainability.
- Keep component states recognizable across hover, focus, loading, success, empty, and error.
- Do not let repeated surfaces share one visual treatment by habit; repetition needs a product reason.

# Bootstrap Dynamic Design Contract

Use this prompt for UI, UX, frontend layout, screen, Tailwind, animation, 3D, canvas, or redesign work.

Create or refine:
- `docs/DESIGN.md` for human-readable design reasoning.
- `docs/design-intent.json` for machine-readable design intent, guardrails, and review signals.

This contract is a decision scaffold, not a style preset. We guide the agent; we do not pick the final style, stack, framework, palette, typography, layout paradigm, or animation library offline.

## Authority
- Treat `.agent-context/` and current project docs as technical authority.
- Treat `README.md` as overview, install, and user-facing context only. Do not use it as coding, architecture, or design authority when `.agent-context/` gives a stricter rule.
- Use current repo evidence, product copy, route names, component names, user goals, and existing constraints as the source of truth.
- Treat prior-chat visuals, unrelated project memory, benchmark screenshots, and famous-product aesthetics as tainted context unless the user explicitly approves continuity.
- Keep external references non-copying; extract constraints only.
- Before choosing a new UI, animation, scroll, 3D, canvas, chart, icon, styling, or component library, research current official docs.

## Required Order
1. Read `AGENTS.md`, this prompt, `../rules/frontend-architecture.md`, current UI code, current project docs, and existing design docs.
2. Refine existing `docs/DESIGN.md` and `docs/design-intent.json`; do not replace them blindly.
3. If either design doc is missing, create it before UI implementation.
4. Record `motionPaletteDecision` before UI code; product categories are heuristics, not style presets.
5. Encode `repoEvidence.designEvidenceSummary` when onboarding or detector evidence exists.
6. Keep both design docs synchronized after implementation.

## Creative Commitment Gate
Before broad compliance review or UI implementation, record an agent-chosen visual direction in both design docs:
- one concrete real-world anchor reference
- one signature motion behavior more specific than "smooth"
- one typographic decision with meaningful role contrast
- one authored visual bet visible in the first viewport

Reject generic anchors. Do not accept "modern", "clean", "premium", "expressive", "minimal", or "bold" as the anchor. Name a material, instrument, artifact class, architectural system, editorial genre, cinematic behavior, exhibition system, scientific apparatus, or industrial mechanism.

## Dynamic Avant-Garde Anchor Engine
If no current-task research or visual reference exists, activate the Dynamic Avant-Garde Anchor Engine before coding.

Rules:
- Treat old design docs, prior UI, and scaffold seeds as evidence, not research.
- Internally consider at least three high-variance anchors.
- Discard the two safest or most predictable options.
- Output only the chosen anchor, specific reference point, and rationale.
- Forbid final anchors named dashboard, portal, cards, admin panel, SaaS shell, web app shell, or minimalist interface.
- Derive typography, spacing, density, color behavior, morphology, motion, and responsive composition from the chosen anchor.
- Use reduced-motion fallbacks instead of suppressing motion.

## Creative Ambition Floor
Before UI code, record:
- one product-derived palette move
- one signature motion, spatial, or interaction behavior
- one morphology or composition choice that avoids interchangeable card stacks when the product allows it
- at least three at-a-glance product-specific signals for new screens or broad redesigns

Do not ship AI-safe UI. Record exact drift signals in `reviewRubric`; at minimum reject decorative grid wallpaper, default line backgrounds, soft glow backgrounds, generic abstract marks, and first-output composition with only local copy swapped in when they have no product function.

## Brave Redesign Default
For UI design work, the agent owns the ambition decision. For broad screens, redesigns, or new visual systems, treat expressive motion, spatial hierarchy, distinctive composition, and product-specific interaction as the baseline even when the user did not say "rich". Do not reduce the request to a safer version of the existing UI, a static implementation, or a component-kit rearrangement because research or dependency selection feels inconvenient.

If the expressive path needs a new motion, 3D, canvas, scroll, or interaction library and web search is available, perform the official-doc research and record the decision. If web search is unavailable, use already-present dependencies or native browser capabilities while preserving the intended ambition, then mark library verification as pending.

Only downshift ambition after naming the concrete blocker: product fit, content density, performance budget, accessibility, device support, package conflict, security risk, or missing runtime capability. Pair every downshift with a replacement interaction quality that still changes composition, hierarchy, feedback, or memorability.

## AI Color and Template Residue Audit
AI color drift happens when a palette uses safe defaults before product meaning.

Complete the AI color audit before coding:
- Explain what product evidence or anchorReference makes the palette fit.
- Name the color roles that carry task, status, data, or navigation meaning.
- Name one color behavior that would not transfer cleanly to another product category.
- Use visually exploratory, product-derived palettes while preserving WCAG contrast and status clarity.

Cream, slate, monochrome, purple-blue gradients, cyber-neon terminals, pale editorial surfaces, soft glow atmospheres, and dark control rooms are autopilot risks, not banned palettes.

## Motion and 3D Courage Rule
Motion, 3D, canvas, WebGL, scroll choreography, and modern animation libraries are first-class UI options when they improve understanding, exploration, feedback, hierarchy, memorability, or confidence.

Use modern, expressive interaction when it improves hierarchy, feedback, confidence, or memorability.

If rich motion or spatial UI is omitted, record the product, content-density, performance, accessibility, or device reason and the replacement interaction quality. "Not necessary" is not enough.

If 3D or canvas is used, record product role, interaction model, fallback path, runtime/library choice, loading state, keyboard path, and reduced-motion behavior.

## Token Derivation Audit
Before implementation, `docs/design-intent.json` must include top-level `derivedTokenLogic`:
- `anchorReference`
- `colorDerivationSource`
- `spacingDerivationSource`
- `typographyDerivationSource`
- `motionDerivationSource`
- `validationRule`

Every token must trace to `anchorReference`. If the rationale is "looks good", "common practice", "modern default", or "framework default", revise the token before code.

## Library Research Protocol
If web search is available:
- Verify each new UI-related library against current official docs.
- Record source URL, fetched date, stable compatible version, purpose, risk, and fallback in `libraryDecisions[]`.
- Set `libraryResearchStatus` to `verified` only when every external library decision has evidence.

If web search is unavailable:
- Do not hallucinate package names, APIs, versions, or imports.
- Use native CSS, browser APIs, or already-present dependencies.
- Set `libraryResearchStatus` to `pending-verification`.

Treat unresearched dependency choices as review findings.

## Zero-Based Redesign Protocol

When the user says "redesign from zero", "redesain dari 0", "ulang dari 0", or "research ulang":
- Treat existing UI as content, behavior, accessibility, and asset evidence only.
- Rewrite or materially update both design docs before UI code.
- Add `visualResetStrategy`.
- Reset composition, hierarchy, palette/typography, motion or interaction, and responsive information architecture.
- Do not ship a palette swap, dark-mode flip, or same hero with new colors.
- Run the redesign regression test: if the result preserves the old hero structure, navigation grammar, card rhythm, motion density, image framing, or primary interaction model without explicit user-approved continuity, revise before implementation is considered complete.

## Responsive Recomposition Plan

Responsive design means recomposition, not resizing.

Define viewport mutation rules:
- Mobile: prioritize the first decisive action and touch flow.
- Tablet: regroup surfaces without becoming a shrunken desktop.
- Desktop: expose more context without defaulting to admin chrome.
- For each viewport, name what is reordered, merged, hidden, disclosed, promoted, and forbidden.

## Required `docs/DESIGN.md` Sections

1. Design Intent and Product Personality
2. Audience and Use-Context Signals
3. Visual Direction and Distinctive Moves
4. Color, Typography, Spacing, and Density Decisions
5. Token Architecture and Alias Strategy
6. Responsive Recomposition Plan
7. Motion, Interaction, and Feedback Rules
8. Component Language, States, and Morphology
9. Source Boundaries and Context Hygiene
10. Accessibility Non-Negotiables
11. Anti-Patterns to Avoid
12. Implementation Notes for Future UI Tasks

## Required `docs/design-intent.json` Behavior

The JSON is the source of truth for machine review. It must stay project-specific and include:
- confirmed project context and assumptions
- agent-chosen visual direction
- `motionPaletteDecision`
- `conceptualAnchor`
- `derivedTokenLogic`
- `aiSafeUiAudit`
- `tokenSystem`, `colorTruth`, `crossViewportAdaptation`, `motionSystem`, and `componentMorphology`
- `accessibilityPolicy`
- `designExecutionPolicy`
- `designExecutionHandoff`
- `reviewRubric`
- `contextHygiene`
- `libraryResearchStatus` and `libraryDecisions[]`
- `forbiddenPatterns`
- `repoEvidence.designEvidenceSummary` when available

## Accessibility and Review

WCAG 2.2 AA is the hard floor. APCA may be used only as advisory perceptual tuning.

Define a review rubric that names drift signals and separates taste from failure.

Block or flag:
- inaccessible contrast, focus, target size, keyboard, auth, or dynamic-status behavior
- scale-only responsive behavior
- default component-kit styling without product rationale
- nonfunctional background effects, including decorative grid wallpaper
- grid or line backgrounds used as filler instead of product function
- palette choices that use readability as an excuse for safe defaults
- visual direction copied from unrelated memory or external references
- genericity findings that cannot name the exact drift signal

Wait for user approval before generating Figma or code assets when the user only asked for planning or design direction.

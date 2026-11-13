# Tweety Chang · Living Portrait (builder prompt)

Paste everything below the line into Lovable, Bolt, v0, Cursor, or Claude. First replace the line under **1. Stack & files** with the stack line for your tool:

| Tool | Stack line |
|---|---|
| Lovable | React + Vite + TypeScript + Tailwind CSS + shadcn/ui, framer-motion for animation, lucide-react for icons. Put the colour tokens as HSL CSS variables in `index.css`. |
| Bolt | Vite + React + TypeScript + Tailwind CSS + Framer Motion, single page, no backend. One component per file: `LivingPortrait.tsx`, `PortraitControls.tsx`. |
| v0 | Next.js App Router + Tailwind + shadcn/ui; framer-motion for animation. Implement every animation listed below exactly; do not omit any. |
| Cursor / Claude | A single `index.html` with inline CSS and JS, no build step, no libraries. |

The image URLs below are live once the `portrait-gaze` branch is merged and GitHub Pages has redeployed.

---

## 0. Brief
Build one section: the **About** block of a personal portfolio for **Tweety Chang**, Associate Relationship Manager at Bank SinoPac (corporate banking, Los Angeles).
Aesthetic: Apple product page. Quiet, light, precise, human.
Signature idea: a **living portrait**. It opens as a still suit photo. Press Play and she looks toward the cursor, smiles as it nears her face, blinks, and reacts to two buttons. Every expression is a real photo frame, not generated motion.
Fidelity: build exactly as specified. Add no cards, badges, gradients, icons, or sections that are not listed.

## 1. Stack & files
{{replace with the stack line for your tool}}

## 2. Fonts
| Role | Family | Weights | Used on |
|---|---|---|---|
| All text | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif` | 400, 500, 600, 700 | everything |
Load no web fonts.

## 3. Colour tokens
```css
:root{
  --bg:#f5f5f7;      /* section background */
  --fg:#1d1d1f;
  --muted:#6e6e73;
  --line:#d2d2d7;
  --accent:#0071e3;  /* links and focus ring only */
}
html,body{background:#fff;color:var(--fg)}
```

## 4. Assets (transparent cut-outs, identical crop, 960 × 988, WebP with alpha)
Base URL: `https://rsm-twchang.github.io/Tweety_Chang_Portfolio/assets/img/portrait/`
Each frame has a `-480.webp` (1×) and a `-960.webp` (2×) version. Pick 960 when `devicePixelRatio > 1.5`.

| Frame | File stem | Shows |
|---|---|---|
| base (always rendered) | `original` | original suit photo, neutral, facing forward |
| blink | `blink` | eyes closed |
| look-left / look-right | `look-left`, `look-right` | eyes only, toward the viewer's left / right |
| look-up / look-down | `look-up`, `look-down` | eyes up / down |
| turn-left / turn-right | `turn-left`, `turn-right` | head turned toward the viewer's left / right, small smile |
| soft, smile, laugh, grin, warm | same names | rising smile intensity |
| surprise | `surprise` | raised brows, open mouth |
| concern | `concern` | worried brows (used when the cursor reaches Pause) |
| wink, puff, tilt, frown, concern2 | same names | playful frames for portrait taps |

Art direction: subject centred, shoulders cropped at the bottom edge. The PNG fallback for the base is `original-480.png`.

## 5. Layout
Section: `background:var(--bg); padding:clamp(72px,12vw,140px) 0`. Container max-width 980px, side padding 22px (32px ≥734px).
Grid: one column on mobile; ≥1024px `grid-template-columns:1.15fr 1fr; gap:40px; align-items:center`.

Left column (reading order):
| Element | Copy | Tag | Size | Weight | Tracking | Colour |
|---|---|---|---|---|---|---|
| eyebrow | ABOUT | p | 12px | 600 | .04em | --muted |
| headline | Hi, I'm Tweety. | h2 | clamp(40px,5.5vw,74px), line-height 1.04 | 700 | -.055em | --fg |
| lede | I support U.S. corporate and syndicated lending at Bank SinoPac in Los Angeles. I read a borrower's financials like an accountant, test them like an analyst, and present the findings clearly in English or Chinese. | p | clamp(17px,1.7vw,20px), line-height 1.55, max-width 43ch | 400 | -.022em | --muted |

Right column: the portrait, `width:min(84vw,520px); margin:0 auto`.

## 6. Portrait structure
```
figure.portrait
  div.stage            aspect-ratio 480/494; perspective 900px; position relative
    ::before           light pool: inset 6% 4% 0; border-radius 50%;
                       radial-gradient(ellipse,#e5e9ef 0%,rgba(229,233,239,.45) 45%,transparent 72%)
    div.breathe        animation breathe 7s cubic-bezier(.25,.1,.25,1) infinite
      div.layers       rotateX(var(--rx)) rotateY(var(--ry)); transition transform .8s;
                       mask-image: linear-gradient(to bottom,#000 72%,transparent 99%)
        img.base       original frame, width 100%
        img.frame × N  position absolute; inset 0; opacity 0; transition opacity .22s
                       .is-on → opacity 1;  blink uses .07s
  figcaption.controls  flex, centred, gap 8px, margin-top 14px
```
```css
@keyframes breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.012)}}
```
Only one frame has `.is-on` at a time. No frame on = the base photo shows.

## 7. Controls (exact copy)
| State | Caption (12px, --muted, aria-live="polite") | Buttons |
|---|---|---|
| Paused (on load) | Taking a moment. | Play |
| Live | A little more human. | Surprise · Smile · Pause |
Button style: pill, 12px, colour --muted, 1px --line border, radius 980px, padding 8px 16px, min-height 44px. Hover: colour --fg, border --muted. Play/Pause carries `aria-pressed` and an aria-label of "Play portrait" or "Pause portrait".

## 8. Behaviour
1. **On load: paused.** Show only the base photo. No breathing, no tilt, no frames loaded.
2. **Preload** all frames when the cursor enters Play, or when Play receives focus.
3. **Play** loads the frames, starts breathing, and switches the caption and buttons. Tapping the photo while paused also plays.
4. **Gaze (fine pointer).** On `pointermove`, throttled with requestAnimationFrame, measure from the face point `(left + 0.5w, top + 0.36h)` of `div.layers`, in units of the portrait width:
   - `d < 0.16` → smile; `d < 0.36` → soft;
   - else if `|dx| ≥ 0.8|dy|`: right → `look-right`, switching to `turn-right` once the cursor is more than 65% of the way from the face to the right window edge; the same for left with `look-left` / `turn-left`;
   - else up → look-up, down → look-down.
   - Cursor leaves the window → base photo. Cursor on Pause → concern.
5. **Tilt (fine pointer).** `--ry = x*6deg`, `--rx = -y*4deg`, where x and y are the cursor offset from the portrait centre divided by half the viewport, clamped to −1..1. The light pool moves `x*14px, y*10px`.
6. **Gaze (touch).** On scroll, `off = (portrait top + 0.4h − viewport middle) / viewport height`. `|off| < .1` → smile; `|off| > .45` → base; off > 0 → look-up, off < 0 → look-down.
7. **Blinks.** Only while facing forward (no gaze frame on). Every 2.8–6.2 s, show blink for 130 ms; 15% of the time, blink twice (120 ms, a 140 ms gap, 120 ms).
8. **Sequences** (frame, ms), then return to the gaze frame:
   - Surprise: surprise 1300 → soft 600
   - Smile: soft 260 → smile 700 → laugh 1400 → grin 600 → warm 600
   - Tap the photo while live, cycling: wink 900 → warm 500 | puff 1300 → grin 700 | tilt 1400 → soft 500 | frown 900 → laugh 1200 → warm 500 | concern2 1100 → grin 800
9. **Pause** returns to the base photo, stops breathing, tilt, and blinks, and restores the paused caption and Play.
10. Stop the blink timer while `document.hidden`.

## 9. Accessibility & performance
- `prefers-reduced-motion: reduce`: no breathing, no tilt, no fades. Frame swaps are instant, Play still works, and there are no automatic blinks.
- The base image has alt text "Portrait of Tweety Chang in a dark blazer and white shirt". Frames use `alt=""`.
- Visible focus ring: 2px solid #0071e3, offset 3px.
- Frames load only after Play intent. The base image is the only image fetched on page load.

## 10. Do not
Do not add a dark background, glassmorphism, gradients other than the light pool, emoji, icons inside the buttons, extra captions, or autoplaying motion before Play. Do not crop, recolour, or regenerate the photos. Do not invent new expressions.

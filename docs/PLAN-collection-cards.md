# Project Plan: Collection Cards Re-layout

## Context
The user requested a redesign of the `collection.html` page to make it feel like a real Trading Card Game (TCG) collection binder, rather than a simple data list. The cards should maintain their visual identity from the summoning ritual.

We are applying `@frontend-design` principles: every pixel has a purpose. We will focus on the Visceral and Behavioral emotional design levels to make the collection feel premium and immersive.

## User Requirements
1. **Layout Strategy (Fitts' Law & Grid Harmony):** 
   - A grid of **"real-sized" cards** (no miniatures). The cards will look exactly as they do when summoned, creating a visceral connection to the ritual.
   - Clicking an owned card opens a detailed overlay/modal.
2. **Missing/Locked Cards (Von Restorff Effect):** 
   - Missing cards will display strictly as a generic frame (visually distinct from owned colourful cards).
   - Inside the center of the frame, ONLY the card number will be displayed (e.g., `001`, without the `#` character).
3. **Quantity Indicator & Expanded View (Information Architecture):** 
   - **Main Grid:** A floating badge/seal in the top right corner of the card (e.g., `x3`) to show duplicates clearly without cluttering the card face.
   - **Expanded Overlay (Modal):** The card is displayed inside a larger frame styled like a parchment scroll. Below the card, it will show detailed RPG stats: date acquired, attack/defense stats, speed, actions, abilities, etc.

---

## Technical Approach & Frontend Design Specs

### Phase 1: Preparation & CSS Refactoring (`collection.css`)
- **Spacing (8-Point Grid Concept):** Use multiples of 8px for the card grid gap (ex: `24px` or `32px`).
- **Layout:** Responsive CSS Grid with `auto-fill` and a `minmax` matching the card width (approx `280px`).
- **Missing Card UI:** Create a generic card back/frame CSS class that strips away the image and colors, leaving a dark medieval texture with the raw number (`001`) in a high-contrast elegant serif font (Cinzel).
- **Quantity Badge:** A subtle, premium floating element (`position: absolute`) on the top right. Use a deep crimson or gold accent circle. 
- **Interactions:** Subtle hover elevations (`transform: translateY(-4px)`) and a golden glow shadow for owned cards to invite clicks. 

### Phase 2: Overlay / Modal Implementation (`collection.html` & `style.css`)
- **Backdrop (Focus):** Semi-transparent dark overlay with a very subtle backdrop-blur (glassmorphism applied carefully, dark/gold tones only) to draw focus to the opened card.
- **Modal Container (Parchment):** The overlay content will be wrapped in a parchment-styled container for the RPG feel.
- **Information Hierarchy (Miller's Law):** 
  - Top: The Full-Size Card.
  - Middle: Core Stats (CR, Type, Attack, Defense).
  - Bottom: Flavor Text / Abilities & Date First Obtained.
- **Animations (Timing Concept):** Use `ease-out` for the modal entering (scaling from `0.95` to `1` while fading in).

### Phase 3: JavaScript Logic Updates (`collection-page.js`)
- **Render Refactor:** Change `renderCards` to generate the full-sized card HTML structure instead of rows/miniatures.
- **DOM Logic (Missing):** If unowned, render the `.col-card-missing` template injecting `{cardNumber}` formatted to 3 digits (e.g. `042`).
- **DOM Logic (Owned):** Render the full card with the exact DOM structure used in the ritual phase, plus the `.qty-badge`.
- **Event Delegation:** Add one global click listener on the grid that detects clicks on `.card` elements to trigger the modal overlay.
- **Modal Databinding:** Populate the modal DOM elements with the clicked card's full JSON data (`stats`, `hp`, `ac`, `cr`, `firstObtained`) and display it.

## Verification Checklist
- [x] Socratic Gate / Requirements gathered.
- [ ] Cards display full-size in a responsive grid.
- [ ] Missing cards show only the frame and the raw number (e.g., `124`).
- [ ] Quantity badge appears correctly on owned cards.
- [ ] Clicking an owned card opens the parchment modal.
- [ ] Modal correctly displays all detailed RPG information and the date acquired.
- [ ] Animations are smooth and purposeful.
- [ ] No layout breaks on mobile screens.

## Assigned Agents
- `frontend-specialist`: Implementation of layout, modal styling, animations, and typography pairings.
- `project-planner`: This plan document.

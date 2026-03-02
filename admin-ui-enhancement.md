# Admin UI Enhancement & Multi-Table Support Plan (Orchestration Phase 1)

## Overview
The goal is to enhance the Admin Dashboard (`admin.html`) to support dynamic Table creation (unlimited tables) and allow monsters to belong to multiple tables simultaneously while maintaining a single global Tier. Additionally, the UI must be completely overhauled following `@/frontend-design` principles to fix contrast issues, improve readability, and provide a premium "Wow Factor" experience.

## Success Criteria
- [ ] Admin can create, edit, and delete an unlimited number of Tables and define their max `d100` ranges.
- [ ] Admin can assign a monster to **multiple** tables (e.g., Goblin belongs to Table A and Table B).
- [ ] Admin can assign a single global Tier to a monster.
- [ ] The engine (`logic.js` and `api.js`) respects the new multi-table array schema mapping.
- [ ] UI is redesigned using UX psychology, adequate spacing (8-point grid), proper contrast, and medieval high-fantasy aesthetic tokens.

## Tech Stack
- Frontend: HTML/CSS/JS (Vanilla). CSS Grid/Flexbox for the new layout.
- Backend: Exists (`server/server.js`), schema will simply adapt to arrays.

## Data Schema Change
The `admin_config.json` will evolve:
```json
{
  "tables": {
    "A": { "maxD100": 50 },
    "B": { "maxD100": 80 },
    "C": { "maxD100": 100 },
    "Custom_Swamp": { "maxD100": 20 } 
  },
  "monsterOverrides": {
    "goblin": {
      "tables": ["A", "Custom_Swamp"], 
      "tier": "C"
    }
  }
}
```

## Task Breakdown

### Task 1: UI/UX Redesign (Frontend-Design)
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `ui-ux-pro-max`
- **Action**: Completely rewrite `admin.html` and add specific admin CSS. Apply proper spacing, contrast, Miller's Law (chunking information), and Hick's Law (clear actions). Use a two-column or strictly grouped layout for Tables vs. Monsters.
- **INPUT**: Current `admin.html` layout.
- **OUTPUT**: A beautiful, highly readable HTML/CSS foundation.
- **VERIFY**: Open `admin.html` in browser; the contrast and typography are clean and readable.

### Task 2: Multi-Table & Dynamic Config Logic
- **Agent**: `backend-specialist` + `frontend-specialist`
- **Skills**: `clean-code`
- **Action**: 
  1. Rewrite `admin.js` to allow adding/removing Tables dynamically.
  2. Rewrite monster listing to use a multi-select (checkboxes or tags) for Tables, avoiding a simple `<select>`.
  3. Ensure saving maps `tables` to an array.
- **INPUT**: The new `admin.html`.
- **OUTPUT**: Fully functional JS matching the new schema.
- **VERIFY**: Clicking "Save" generates the correct JSON structure with arrays for `tables`.

### Task 3: Engine Compatibility Update
- **Agent**: `game-developer`
- **Skills**: `game-development`
- **Action**: Update `api.js` to read `override.tables` (Array) instead of a single string. Update `logic.js` `findCards` to filter monsters where `monster.tables.includes(tableResult)`.
- **INPUT**: Modified `admin_config.json` schema.
- **OUTPUT**: Game pulls cards correctly from dynamic tables.
- **VERIFY**: `SummonEngine.testDistribution()` runs without throwing errors and respects the new schema.

## Phase X: Verification
- [ ] All tests run smoothly.
- [ ] Design is audited manually to ensure no unreadable contrast areas exist.
- [ ] Multiple tables created successfully via UI and reflected in JSON.

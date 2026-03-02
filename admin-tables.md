# Admin Tables Refactoring Plan (Orchestration Phase 1)

## Overview
The goal is to decouple the Table and Tier logic from the hardcoded `logic.js` and `api.js`, and allow the game administrator to manage their own TABLES, Tiers, and D100 roll chances via an Admin Page. To support saving JSON files, we will need to decide if we want to replace the `python -m http.server` with a simple Node.js server to support `POST` requests for JSON saving, or if the Admin Page should use a "Download Data" / "Upload Data" system for pure frontend operation.

## Success Criteria
- [ ] Tables are now driven by a data structure (`data/tables.json` or similar) instead of hardcoded rules in `logic.js`.
- [ ] The engine reads the configurable D100 ranges from the JSON to determine which Table is selected for a summon.
- [ ] Monsters reside in their own list, and Tables reference monsters (or specify filter conditions).
- [ ] Tiers are configurable globally for each monster.
- [ ] An Admin UI (`admin.html`) exists where users can visually select monsters for a Tier, configure Tables, and define D100 ranges.
- [ ] CRUD capabilities for Tables are fully functional (JSON-based).

## Tech Stack
- Frontend: HTML/CSS/JS (Vanilla) for the Admin Page, matching existing styles.
- Backend/Data: **Decision Required**. Since `python -m http.server` does not support saving files via API, we have two options:
  1. Setup a tiny Node.js (`server.js` with Express) to serve files AND provide a `/save` endpoint for JSON.
  2. Keep Python server and make the Admin page use "Export JSON" which the admin drops into the `data/` folder.
  (Option 1 is recommended for a real CRUD experience)

## File Structure Changes
- `admin.html` (NEW): The admin dashboard UI.
- `admin.js` (NEW): Logic for the admin page.
- `data/admin_config.json` (NEW): Stores the Table ranges and custom Tiers.
- `server.js` (NEW, Optional): A Node backend to write to `admin_config.json`.
- `logic.js` (MODIFIED): Update `getTableFromRoll`, `getTierFromRoll`, and `findCards` to use dynamically loaded config.
- `api.js` (MODIFIED): Fetch the admin configuration to apply specific Tiers to monsters.

## Task Breakdown

### Task 1: Foundation (Data Structure & Server Decision)
- **Agent**: `backend-specialist`
- **Skills**: `nodejs-best-practices`
- **Action**: Create `admin_config.json` structure. Create a basic Node script (or decide on purely manual export) to allow saving JSON.
- **INPUT**: Current `api.js` and `logic.js` logic.
- **OUTPUT**: A working local API to read/write JSON configuration, and initial `admin_config.json`.
- **VERIFY**: Making a POST request writes a change to `admin_config.json`.

### Task 2: Admin UI Prototype
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `clean-code`
- **Action**: Create `admin.html` and `admin.js`. Build the layout for Table CRUD, D100 Range Slider/Inputs, and Monster Tier selection lists.
- **INPUT**: `style.css` matching design.
- **OUTPUT**: A functional UI connecting to the local API.
- **VERIFY**: The UI loads and shows mocked or real monsters to place in tables.

### Task 3: Engine Refactoring
- **Agent**: `backend-specialist` / `frontend-specialist`
- **Skills**: `clean-code`
- **Action**: Modify `logic.js` and `api.js` to consume `admin_config.json` on boot. Remove hardcoded d100 and d20 tier mappings.
- **INPUT**: `admin_config.json`
- **OUTPUT**: `summon()` function uses the loaded configurations dynamically.
- **VERIFY**: Emulated local summons respect the new configured ranges.

### Task 4: UI Polish and Translation
- **Agent**: `frontend-specialist`
- **Skills**: `i18n-localization`
- **Action**: Make sure the admin interface is translated (using existing `i18n` logic) and visually appealing.
- **INPUT**: `admin.html`
- **OUTPUT**: Polished UI.
- **VERIFY**: UX Audit scripts pass.

## Phase X: Verification
- [ ] Logic checks pass (`testDistribution` reflects new JSON config).
- [ ] No hardcoded Tiers or Tables remain in `logic.js` and `api.js`.
- [ ] Admin page successfully writes to `admin_config.json`.

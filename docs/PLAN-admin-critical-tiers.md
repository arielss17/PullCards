# Planning: Admin Controls for Critical Hits

## Objective
Provide the administrator with the ability to define which Tiers are awarded when a D20 critical roll is made during the summoning ritual, instead of having them hardcoded to "S" (for the initial D20=20) and "Z" (for the inner D20=20). 

## Context
Currently, in `logic.js`, the `handleCritical` function strictly returns:
- Inner Roll = 20: 1 card of Type "Z"
- Inner Roll < 20: 2 cards of Type "S"

The goal is to move this logic to the `admin_config.json` payload, give the GM UI controls in the Config tab, and consume this config during the ritual.

## Proposed Strategy & Changes

### 1. Database/Config Schema Update
Modify the base `admin_config.json` structure (and default fallback in `server.js`) to include a new `criticalRules` object.
```json
{
  "criticalRules": {
    "baseRewardTier": "S",
    "baseRewardCount": 2,
    "innerCriticalTier": "Z",
    "innerCriticalCount": 1
  }
}
```

### 2. Backend (`server.js`)
- Update `initConfig()` to inject default `criticalRules` if they are missing from an existing `admin_config.json`.
- Ensure the `POST /api/config` endpoint persists this new object.

### 3. Frontend Admin UI (`admin.html` & `admin.js`)
- **UI:** Add a new section (a new `.admin-card`) inside the "Configuração" tab (Tab 1), probably below or beside the "Gestão de Tiers".
- **Fields:**
  - Dropdown: "Tier para Crítico Padrão" (Populated with available Tiers)
  - Number input: "Qtd. de Cartas para Crítico"
  - Dropdown: "Tier para Crítico Duplo (Inner 20)"
  - Number input: "Qtd. de Cartas Crit. Duplo"
- **JS Logic:**
  - Initialize the `config.criticalRules` object if it doesn't exist.
  - Render the new UI block based on this data.
  - Update `criticalRules` upon HTML input changes.
  - `btnSaveConfig` already saves the entire `config` object, so no changes are needed to the save flow.

### 4. Logic Engine (`logic.js`)
- **`handleCritical()` update**: Instead of hardcoding `"S"` and `"Z"`, read from `config.criticalRules`.
- `config` is already accessible globally within `SummonEngine` once `api.js` loads it and calls `SummonEngine.setConfig()`.

## Verification Checklist
1. The new "Regras de Crítico" card appears on the Admin Panel under Configuration.
2. The dropdown menus correctly list the available tiers (Z, S, A, etc.).
3. Saving updates `admin_config.json` correctly.
4. Performing a summon with a rigged D20 = 20 awards the customized tiers, not the old hardcoded ones.

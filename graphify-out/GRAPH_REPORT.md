# Graph Report - SEMAR  (2026-11-19)

## Corpus Check
- 71 files · ~86,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 373 nodes · 522 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `76cd4827`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `query()` - 16 edges
2. `expo` - 13 edges
3. `SEMAR_COLORS` - 12 edges
4. `apiRequest()` - 12 edges
5. `scripts` - 7 edges
6. `useBinStore` - 7 edges
7. `📡 Daftar Endpoint API` - 7 edges
8. `SEMAR Web Service API (Express.js)` - 6 edges
9. `adaptiveIcon` - 5 edges
10. `🚀 Cara Menjalankan` - 5 edges

## Surprising Connections (you probably didn't know these)
- `StatusScreen()` --calls--> `useBinStore`  [EXTRACTED]
  prot-react-native/src/app/(tabs)/status.tsx → prot-react-native/src/stores/useBinStore.ts
- `RealtimeInfoCard()` --calls--> `useBinStore`  [EXTRACTED]
  prot-react-native/src/components/common/RealtimeInfoCard.tsx → prot-react-native/src/stores/useBinStore.ts
- `useTheme()` --calls--> `useColorScheme()`  [INFERRED]
  prot-react-native/src/hooks/use-theme.ts → prot-react-native/src/hooks/use-color-scheme.web.ts
- `getBinById()` --calls--> `query()`  [EXTRACTED]
  backend/src/controllers/binController.js → backend/src/config/db.js
- `getBins()` --calls--> `query()`  [EXTRACTED]
  backend/src/controllers/binController.js → backend/src/config/db.js

## Communities (29 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (35): AppHeaderProps, styles, BottomSheetModalProps, styles, RealtimeInfoCard(), styles, styles, styles (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (37): ENDPOINTS, BinItem, DrumItem, FloorImpactItem, HarvestLogItem, initialBinsData, initialDampakData, initialDrumsData (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (44): dependencies, expo, expo-constants, expo-device, expo-font, expo-glass-effect, expo-image, expo-image-picker (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (25): query(), formatBinRow(), getBinById(), getBins(), pickUpBin(), recordTelemetry(), toggleBinSensor(), createSetoran() (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (24): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (23): 1. Health Check, 1. Masuk ke direktori backend, 2. Instalasi Dependensi (jika belum), 2. Status Tong Sampah Pintar (`/api/bins`), 3. Catat Setoran & Sensor Lantai (`/api/catat`), 3. Konfigurasi Environment, 4. Menjalankan Server, 4. Pengolahan Kompos & Maggot (`/api/olah`) (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): author, dependencies, cors, dotenv, express, morgan, multer, mysql2 (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (17): getDampak(), updateDampak(), createHarvestLog(), getDrums(), getHarvestLogs(), getMaggotStatus(), updateDrum(), updateMaggotStatus() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (8): config, openApiSpec, errorHandler(), notFound(), router, app, __dirname, __filename

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (9): code:bash (npm install), code:bash (npx expo start), code:bash (npm run reset-project), Get a fresh project, Get started, Join the community, Learn more, Other setup steps (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (6): Colors, Fonts, Spacing, ThemeColor, useColorScheme(), useTheme()

### Community 11 - "Community 11"
Cohesion: 0.20
Nodes (8): exampleAssets, exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/*, @/assets/*

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): fill, automatic-gradient, groups, supported-platforms, circles, squares

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): Building with EAS, code:bash (npx expo install <package>  # ALWAYS use instead of npm/yarn), Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): config, fs, { getDefaultConfig }, gracefulFs

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (4): editor.codeActionsOnSave, source.fixAll, source.organizeImports, source.sortMembers

## Knowledge Gaps
- **170 isolated node(s):** `name`, `version`, `description`, `main`, `type` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08985507246376812 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11051693404634581 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
# Agent Database App - TODO

## Phase 1: Architecture & Schema
- [x] Design and implement agents table schema in Drizzle
- [x] Create migration SQL and apply to database
- [x] Set up database import helper function

## Phase 2: Backend & Import
- [x] Create data import procedure (tRPC) to load agents from SQLite
- [x] Implement import-on-first-load logic
- [x] Create search and filter procedures (tRPC)
- [x] Add export data procedure (tRPC)

## Phase 3: Frontend UI
- [x] Build main agents list page with layout
- [x] Implement search input with real-time filtering
- [x] Implement type filter dropdown
- [x] Implement line code presence filter
- [x] Build paginated data table component
- [x] Implement agent detail modal/view
- [x] Add loading and empty states

## Phase 4: Export Functionality
- [x] Implement CSV export logic
- [x] Implement Excel export logic
- [x] Add export buttons to UI
- [x] Test export respects active filters

## Phase 5: Polish & Testing

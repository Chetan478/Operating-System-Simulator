# RAILOS — Railway Ticket Booking OS Simulator

Educational simulation for Operating Systems (MSBTE subject code 315319). It does not connect to IRCTC or perform real bookings.

## Requirements
- Node.js 20 or newer (Node.js 22 recommended)
- npm
- Visual Studio Code or another editor

## Run on Windows
1. Extract this folder to a normal location, for example `D:\Projects\osy_chetan`.
2. Open the `osy_chetan` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the local URL Vite prints, normally `http://localhost:5173/`.

If you get a dependency/binary error after copying a `node_modules` folder from another operating system, delete `node_modules` and run `npm install` again. Do not upload `node_modules` to GitHub.

## Build check
Run `npm run build`. This runs TypeScript checking and builds the production web app.

## Modules
- Dashboard: simulated system overview and active booking process count.
- Booking Sessions: create/terminate simulated booking processes and inspect PCB concepts.
- CPU Scheduling: FCFS, SJF, Priority and Round Robin with Gantt chart and timing metrics.
- Banker's Algorithm: inspect safe and unsafe sample resource-allocation states.
- Memory Paging: FIFO/LRU page replacement for a supplied reference string.
- PNR File System: create/search/delete demonstration PNR records stored with linked block allocation.

## Important assignment-format note
The project brief describes a menu-driven command-line simulator in C or Python. This project is a React/TypeScript web simulator because the uploaded starter archive was already configured for Vite/React and included TypeScript algorithm modules. Please confirm with your teacher whether this format is acceptable before final submission. If command-line C/Python is compulsory, this web app should not be submitted as a substitute without permission.

# Runjian PMMS — 3 FE Demos

Three frontend concepts for Runjian's solar PMMS portal (rundoai.com / iRun Workbench),
demonstrating a 2.5D animated map, an AI agent chat panel, and one-click BO/CMS actions —
in three different visual languages.

## Open

Serve from this directory and open `index.html`:

```bash
cd /Users/sebastianbelulok/runjian
python3 -m http.server 8765
open http://localhost:8765/
```

The landing page links to each demo individually:

- **Demo 01** — `demo-1-workbench/` · Product-native 2.5D dashboard
- **Demo 02** — `demo-2-rts/` · Warcraft III-style RTS HUD
- **Demo 03** — `demo-3-command/` · Cinematic mission-control war room

## Shared

All three demos:

- Pull from `/assets/` (the AI-generated isometric pack)
- Use the same 5 Malaysian plants (Kedah, Penang, Perak, Melaka, Johor)
- Render the same 8 AI agents (Alarm, Ticket, Schedule, Predict, Inspect, PV, Diagnose, Data Q&A)
- Fire the same `BO/CMS` action payload structure on each interaction
- Are pure HTML / CSS / vanilla JS — no build step, no dependencies

## Hotkeys (all demos)

| Key | Action |
|---|---|
| Q | View Alarms |
| W | Create Work Order |
| E | Dispatch Crew |
| R | Inspection |
| T | Diagnose / Ticket History |
| Y | Smart Report |
| U | Maintenance |
| ⇧Q / D | SOS Escalate |

## File layout

```
runjian/
├── index.html              # Landing page linking the 3 demos
├── README.md
├── assets/                 # Existing AI-generated assets (675 files)
├── demo-1-workbench/       # 2.5D map + side chat + bottom BO bar
│   ├── index.html
│   ├── style.css
│   └── script.js
├── demo-2-rts/             # Warcraft III-style HUD
│   ├── index.html
│   ├── style.css
│   └── script.js
└── demo-3-command/         # Mission control / war room
    ├── index.html
    ├── style.css
    └── script.js
```

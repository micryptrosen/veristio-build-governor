# Build Governor

A dependency-free local browser prototype for Build With AI Hackathon #2.

## Features

- Define project goals, risk, owner decisions, forbidden actions, evidence, and checks.
- Track Discover, Plan, Implement, Verify, Commit, and Closeout phase gates.
- Generate a governed build report, owner-decision list, and closeout checklist.

## Run Locally

Open `index.html` in a browser, or serve this folder over localhost:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/`. No dependency installation, account, API key, or paid service is needed. The app uses plain HTML, CSS, and JavaScript with no external network calls, telemetry, or input storage. Clipboard availability depends on the browser; use the displayed fallback selection when necessary.

## Demo

[Watch the demo](https://youtu.be/4rY9jDAVvGc). Public publication was reported by the owner; uploaded playback and metadata have not been independently verified.

## Limitations

A general product for planning AI-assisted builds. Use synthetic project data. It does not execute checks or enforce approvals outside the app; phase statuses are user-reported.

## Project Notes

See `ROADMAP.md`, `DEMO_SCRIPT.md`, `DEVPOST_REQUIREMENTS.md`, and `SOURCE_CUSTODY.md`. This repository is a fresh publication snapshot of an independently developed local prototype; its first commit does not represent the beginning of development. Devpost submission has not been performed.

## License

MIT. See `LICENSE`. The license covers this independent prototype, not excluded source-reference materials.

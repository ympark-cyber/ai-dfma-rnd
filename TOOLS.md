# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

## Google Workspace (gog) account rule

- Always check connected accounts before Google operations: `gog auth list`
- Always set account explicitly with `--account` for Gmail/Drive/Calendar commands
- Always report which account was used in results
- Default preference unless user says otherwise:
  - General Drive/Gmail: `thereelsdirector@gmail.com`
  - Company-only tasks: `chloe@ljkstudio.com`

---

Add whatever helps you do your job. This is your cheat sheet.

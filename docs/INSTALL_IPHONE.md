# Installation on iPhone – Volley Live Capture v1.3.2

Screens: `Volley_Live_Capture_Screens_v1.3.2.pdf` (page 11).

## Prerequisites
- iPhone with **Safari**.
- Repository published on an **HTTPS** static host (e.g. GitHub Pages). Not the professional SharePoint / OneDrive.

## First installation
1. Open the HTTPS address in **Safari** (not Chrome, not an in-app browser).
2. **Share → Add to Home Screen → Add**. The *Volley Live* icon appears.
3. Start the app **from its icon** once, with network. Home shows **v1.3.2**.
4. Airplane mode, close the app, start it again from its icon: it must open.

## Update
1. In the app: **SAVE .JSON** → *Save to Files* (safety copy).
2. Push the new files to the host.
3. With network: open the app from its icon, close it completely, open it again.
4. Check the version on Home. The stored match is kept (v1.1.x matches open at Advanced level).

## Choosing the detail level
| Situation | Level |
|---|---|
| Following the score from the stands, one hand | **Basic** – Team → Point / Error |
| Who scores and who errs, without action detail | **Intermediate** – Player → Point / Error |
| Full statistics by action (coach, statistician) | **Advanced** – Player → Action → Result |

The level is fixed for the whole match.

## Good practice
- Always start from the **icon**: Safari and the installed app keep **separate** data.
- **SAVE .JSON** at the end of each set; **REPORT .HTML** at the end of the match.
- One match stored at a time; deleting the icon deletes the data.
- Set Auto-Lock to *Never* during a match.

## Troubleshooting
| Symptom | Action |
|---|---|
| Old version still displayed | Open with network, close completely, reopen (twice if needed) |
| Does not open in Airplane mode | Never started from the icon with network: repeat step 3 |
| Match missing | Home → **OPEN MATCH .JSON** → select the saved file |

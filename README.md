# Fundación MAC CF

Website for **Fundación MAC CF**, an amateur football club from Mazatlán, Sinaloa, founded by a group of friends in 2025. The club's motto is simple: faith, patience and good humor matter more than winning, and the goal of every match is to *connect two passes in a row*.

The site is a static, mobile-first page that presents the team, publishes match results, points visitors to the venue and the club's social networks, and collects feedback from teammates.

**Live site:** `https://anghecrazy010.github.io/Fundacion-Mac-website-ofc/`

<!-- Add a screenshot after publishing: save it as docs/preview.png and uncomment the line below.
![Site preview](docs/preview.png)
-->

## Features

- **Team presentation:** crest, story, values and a short fact sheet.
- **Next match:** a featured pre-match image taken from the `img/Novedades/` folder. The most recently added image is shown until its match day is over; after that a generic "to be defined" card takes its place.
- **Results:** a rotating carousel of the result graphics the club publishes on Instagram, a full results table and a win/draw/loss record. Results are split into two tabs, **Liga Fut 9** (league) and **Amistosos** (friendlies), so friendlies never affect the league record.
- **Venue:** address with a link that opens directions in Google Maps.
- **Social links:** Instagram (`@fmac_fc`) and Facebook.
- **Feedback section:** a button that opens a Google Form where teammates leave suggestions and improvements, entering their own name (no login required).
- **Light and dark themes** that follow the visitor's system setting.

## Tech stack

| Area | Choice |
|---|---|
| Markup, styles, behavior | Plain HTML, CSS and vanilla JavaScript in a single `index.html` (no build step, no dependencies) |
| Typography | [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) for headings and [Barlow](https://fonts.google.com/specimen/Barlow) for text, loaded from Google Fonts |
| Hosting | GitHub Pages |
| Automation | Python scripts: Pillow to prepare the images and, optionally, the Google Drive API to download them |
| Feedback storage | Google Forms, with responses saved to Google Sheets |

## Project structure

```
fundacion-mac/
├── index.html              # The whole site: markup, styles and script
├── README.md
├── img/
│   ├── logo.jpg            # Club crest (also used as the favicon)
│   ├── Liga Sahop/         # League result images: j1.jpg … j7.jpg
│   ├── Amistosos/          # Friendly result images: a1.jpg … a3.jpg
│   └── Novedades/          # Pre-match images (filled by the sync script)
│       ├── novedades.js    # Generated index read by the page
│       └── 2026-10-18_jornada-8.jpg
└── scripts/
    ├── descargar_drive.py  # (Optional) downloads images from a Drive folder with the Drive API
    └── sync_novedades.py   # Resizes images in img/Novedades/ and writes its novedades.js index
```

> **Note:** GitHub Pages is case-sensitive. Folder and file names in `index.html` must match the real names exactly, including capital letters and spaces.

## Next match image (Novedades)

The "Próximo partido" section shows the pre-match graphic. It works in three parts:

1. **One folder.** The image goes into `img/Novedades/`, either placed by hand or downloaded there by `scripts/descargar_drive.py` (Drive API). There is no separate source folder.
2. **Sync script.** `scripts/sync_novedades.py` looks at the images in that folder, shrinks any larger than 1080 × 1350 px in place and writes `novedades.js` in the same folder. This small index lists each image by file name, match date, title and the moment it was added. (GitHub Pages cannot list a folder, so the page needs this index.) The page prepends `img/Novedades/` to the file name, so the script needs no web path and does not inspect `index.html`.
3. **Page.** It picks the **most recently added** image. When the **match day is over** (Mazatlán time) it hides the image and shows "Por definir" with a short note instead.

File names in Drive must start with the **match date**:

```
2026-10-18_jornada-8.jpg      →  title "Jornada 8", match date 18 October 2026
```

Files without a valid `YYYY-MM-DD` prefix are skipped and reported by the script. Keep names lowercase without accents or spaces, since GitHub Pages is case-sensitive.

### Step 1: prepare the images (local)

Set `ORIGEN_POR_DEFECTO` at the top of `scripts/sync_novedades.py` to the full path of your local `img/Novedades/` folder (on Windows, build it with `Path.home() / "Folder" / "Subfolder"` so backslashes are not an issue). Put the image there and run:

```bash
pip install pillow
python scripts/sync_novedades.py
```

The script prints the path of the index it wrote and which image the page will show. Running it again is safe: images already small enough are left alone and the "added" timestamps are preserved. The script never touches Git.

Example of the generated `novedades.js`:

```js
var NOVEDADES = [
  { "archivo": "2026-10-18_jornada-8.jpg", "partido": "2026-10-18", "titulo": "Jornada 8", "subido": "2026-10-14T16:03:00-07:00" }
];
```

Hiding the image after the match is done by the page, not the script: once the match date is before today (Mazatlán time), the card switches to "Por definir". No re-run is needed for that.

### Step 2 (optional): download the images from Google Drive

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
python scripts/descargar_drive.py --carpeta "https://drive.google.com/drive/folders/FOLDER_ID" --listar   # only list
python scripts/descargar_drive.py --carpeta "https://drive.google.com/drive/folders/FOLDER_ID"            # download
```

It uses the Google Drive API with **read-only** access. The OAuth credentials (`credentials.json`) and the saved login (`token.json`) live in `~/.fmac_drive/`, outside the repository, and must never be committed. The setup steps are at the top of the script. Only new or modified images are downloaded, and each image's real Drive creation time is saved in `drive_fechas.json`, so `sync_novedades.py` knows which image was uploaded last even when many are downloaded at once. It downloads straight into the project's `img/Novedades/` by default, so after downloading you only need to run `sync_novedades.py`.

### Local first, then published

The project folder on the computer is the **development copy**: nothing there is visible to anyone. Check the page locally (`python -m http.server`) and, when everything looks right, publish manually with `git add`, `git commit` and `git push`, which updates GitHub Pages, the **production site**. Neither script runs Git.

## How the results work

Results are stored as plain data at the top of the `<script>` block in `index.html`. One entry per match:

```js
var PARTIDOS = [
  { tipo: "liga",     jornada: 1, gf: 0, gc: 3, img: "img/Liga Sahop/j1.jpg" },
  { tipo: "amistoso", num: 1,     gf: 0, gc: 0, img: "img/Amistosos/a1.jpg" }
];
```

| Field | Meaning |
|---|---|
| `tipo` | `"liga"` or `"amistoso"`. Decides which tab the match appears in. |
| `jornada` / `num` | Matchday number for league games, sequence number for friendlies. |
| `gf` | Goals scored by Fundación MAC. |
| `gc` | Goals conceded. |
| `img` | Path to the result graphic. |
| `fecha` *(optional)* | Match date as `"YYYY-MM-DD"`. When present on all matches of a tab, results are ordered by date instead of by matchday. |

The outcome (win, draw or loss), the table and the record are all calculated from `gf` and `gc`, so adding a match only requires one new line plus its image. The score always lists the club's goals first, whatever the layout of the result graphic.

An opponent name field (`rival`) is planned but not displayed yet.

### Adding a new result

1. Save the image in the matching folder, for example `img/Liga Sahop/j8.jpg`.
2. Add a line to `PARTIDOS`.
3. Commit and push.

Images are resized to about 540 × 675 px before publishing, which is enough for the carousel and keeps the page fast on mobile data.

## Running locally

No installation is needed. Open `index.html` in a browser, or serve the folder to mimic the real site:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

1. Push the project to a public repository (for example `fundacion-mac`).
2. In the repository, go to **Settings → Pages**.
3. Under *Build and deployment*, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, and save.
4. After a minute or two the site is available at the URL shown on that page.

Every `git push` to `main` updates the site automatically. A custom domain is optional and can be connected later without changing the code.

## Feedback form setup

The feedback section reads the form address from one variable near the top of the script:

```js
var FORMULARIO = "https://forms.gle/your-form-link";
```

While the variable is empty, the button is hidden and the section shows a "coming soon" message.

Recommended Google Form fields:

1. **Name**, short answer, required. Visitors type their own name, so no account is needed. The name is self-reported and not verified.
2. **Type of comment**, multiple choice: suggestion, improvement, something is not working, other.
3. **Message**, paragraph, required.

In the form settings, leave *Collect email addresses* off and do not limit responses to one per person, since both options force a Google sign-in. Link the form to a Google Sheet from the *Responses* tab, and optionally turn on email notifications for new responses.

## Design notes

- **Palette** taken from the crest: navy, gold and white. The dark navy bands stay the same in both themes, and the rest of the page switches between a light and a dark palette.
- **Mobile first.** Layouts collapse to a single column on narrow screens, and the page does not scroll horizontally at phone widths.
- **Accessibility:** semantic sections and tables, descriptive `alt` text on every result image, visible keyboard focus, labelled controls, and a carousel that pauses on hover, focus or touch and can be paused with a button. Auto-rotation is off for visitors who prefer reduced motion.
- **Results are data, not scraped content.** Scores are entered as structured records instead of being read from Instagram posts. Match graphics are free-form images and captions are inconsistent, so structured records are more reliable, and scraping would also go against Instagram's terms.

## Roadmap

**Phase 1, static site (current).** Team info, venue, social links, league and friendly results, feedback form.

**Phase 2, more content.**
- Match dates and opponents for every result.
- Fully automatic image sync (a scheduled GitHub Action reading the Drive folder) so the site updates without anyone's computer.
- Full squad page with photos, positions and shirt numbers.
- News section for posts, reels and memes, fed from the club's Instagram through the official API for professional accounts (tokens expire roughly every 60 days and need refreshing).

**Phase 3, data.**
- Individual statistics such as goals, assists and appearances, with a top scorers table.
- League standings.
- An admin area to record matches and events, backed by a relational database.
- A small analytics pipeline over the match data: scheduled ingestion, a dimensional model (matches, players, seasons, events), data quality tests and a dashboard.

## Content and privacy

The crest, photos and result graphics belong to Fundación MAC CF. Player photos should only be published with the players' consent, and the repository should not contain phone numbers or other personal data. Responses to the feedback form are stored in a private Google Sheet and are not part of this repository.

## License

The code license has not been chosen yet. Until one is added, all rights are reserved. The crest, photos and result graphics are not covered by any code license.

## Links

- Instagram: [@fmac_fc](https://www.instagram.com/fmac_fc)
- Facebook: [Fundación MAC CF](https://www.facebook.com/share/1Jzns3B9dS/)

# Planes Chase

A responsive Planechase companion for playing Magic: The Gathering. Choose an official planar deck, reveal a starting card, roll the planar die, and track turns and additional-roll costs.

The app bundles **151 official Plane and Phenomenon names** and **17 preconstructed planar decks** from Planechase, Planechase 2012, March of the Machine Commander, and Doctor Who Commander. The complete card pool is also available as a deck. Card rules text and artwork are not bundled; each card links to its Scryfall reference.

## Run locally

```sh
npm ci
npm run dev
```

Run the unit tests and production build with:

```sh
npm test
npm run build
```

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the app when changes are pushed to `main`, or when manually triggered. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

Vite uses the repository name from `GITHUB_REPOSITORY` as the Pages base path, so the project can be deployed from a repository path without extra configuration.

## Add a deck

Decks are developer-managed JSON files; there is no in-app deck editor. Add one file under `src/data/decks/` using this schema:

```json
{
  "schemaVersion": 1,
  "id": "my-planar-deck",
  "name": "My Planar Deck",
  "edition": "Custom",
  "description": "A short deck description.",
  "cards": [
    "Academy at Tolaria West",
    "Agyrem",
    "Akoum",
    "Aretopolis",
    "Astral Arena",
    "Bant",
    "Bloodhill Bastion",
    "Celestine Reef",
    "Cliffside Market",
    "Edge of Malacol"
  ]
}
```

Deck requirements:

- Use a unique lowercase, hyphen-separated `id`.
- Include at least 10 unique card names in `cards`.
- Card names must match entries in `src/data/cards.json`.
- When introducing an official card that is not in the catalog, add its name to the appropriate `planes` or `phenomena` list in the same file.

Vite discovers every deck JSON file automatically. The loader validates the schema, deck size, duplicate names, and card references during build.

## Card data

The bundled catalog contains card names and whether each is a Plane or Phenomenon. It does not contain rules text or artwork. Card details open on Scryfall.

Sources for the official card pool and preconstructed lists include [Scryfall's Planechase Anthology gallery](https://scryfall.com/sets/opca), Wizards of the Coast's [Planechase theme deck lists](https://magic.wizards.com/en/articles/archive/planechase-theme-decks-2009-08-31) and [Planechase 2012 deck lists](https://magic.wizards.com/en/news/feature/planechase-2012-decklists-2012-05-28), and the official [March of the Machine Planechase](https://magic.wizards.com/en/news/card-image-gallery/march-of-the-machine-planechase) and [Doctor Who](https://magic.wizards.com/en/news/card-image-gallery/doctor-who) card galleries.

This is an unofficial fan-made companion and is not affiliated with Wizards of the Coast.

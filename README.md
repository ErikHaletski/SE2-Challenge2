# SE2-Challenge2

A bilingual Hugo-based web application for finding plant-based substitute products and comparing them with the original product. The project combines a static frontend with structured content, custom search logic, and a small Go/Gin backend for serving product JSON.

## Overview

The application helps users search for an original product such as `salami` or `egg`, find matching substitute products, and view product details including nutrition values, labels, category assignments, and comparison data.

Core characteristics:

- Static site built with **Hugo**
- Content managed in **Markdown front matter**
- UI available in **German and English**
- Custom **fuzzy search** for product lookup
- Product/substitute mapping via content-driven relations
- Optional lightweight **Go/Gin API** for serving product JSON
- CMS integration through **Sveltia CMS** and GitHub backend configuration

## Features

- Multilingual homepage and navigation
- Product detail pages with overview and nutrition tabs
- Comparison table between replacement product and searched original product
- Fuzzy search with suggestions and multi-match handling
- Category-based filtering
- Product metadata stored as structured content
- Label and Nutri-Score assets rendered from static resources
- CMS entry point under `/admin`

## Repository Structure

```text
SE2-Challenge2/
├── assets/
│   ├── css/                    # Search/detail page styles
│   ├── js/                     # Search, overview, and helper scripts
│   ├── labels/                 # Label icons
│   └── nutriscore/             # Nutri-Score icons
├── content/
│   ├── de/                     # German content
│   └── en/                     # English content
│       ├── produkte/           # Product definitions
│       ├── ersatzprodukte/     # Product replacement relations
│       ├── categories/         # Category pages/metadata
│       ├── labels/             # Label pages/metadata
│       └── search_erweitert/   # Search page content
├── i18n/                       # Shared translation strings
├── layouts/                    # Hugo templates
│   ├── produkte/               # Product detail template
│   └── *.html                  # Base, home, search templates
├── static/                     # Static media files
├── themes/ananke/              # Hugo theme submodule
├── public/                     # Generated site output
├── main.go                     # Gin backend
├── hugo.json                   # Hugo configuration
├── config.json                 # CMS configuration
└── go.mod                      # Go module definition
```

## Tech Stack

- **Hugo** for static site generation
- **Go + Gin** for the backend service
- **Vanilla JavaScript** for client-side search and page interactions
- **Sveltia CMS** for content editing
- **Ananke** as the Hugo theme base

## Setup

### Prerequisites

Install the following locally:

- **Git**
- **Hugo** (extended version recommended)
- **Go** matching the version declared in `go.mod`
- Optional: a modern browser for testing the generated site

Because the repository uses a theme submodule, clone it with submodules enabled.

### 1. Clone the repository

```bash
git clone --recurse-submodules <your-repository-url>
cd SE2-Challenge2
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

### 2. Review the main configuration files

Relevant files:

- `hugo.json` — site configuration, languages, theme
- `config.json` — CMS backend configuration
- `content/` — structured page and product data
- `assets/` — JS/CSS and icons
- `main.go` — backend routes

### 3. Start the Hugo frontend

For local development:

```bash
hugo server -D
```

Expected default URL:

```text
http://localhost:1313
```

Notes:

- The site is configured for **German and English**.
- Content is stored under `content/de` and `content/en`.
- Generated output is written to `public/`.

### 4. Start the Go backend

In a second terminal:

```bash
go run main.go
```

Expected default backend URL:

```text
http://localhost:8080
```

Available routes from `main.go`:

- `GET /ping` — health check
- `GET /produkte/:file` — returns product JSON from `content/produkte/<file>.json`

Important implementation note:

- The repository currently stores products primarily as **Markdown files** under language folders such as `content/de/produkte` and `content/en/produkte`.
- The backend route expects JSON files under `content/produkte/`.
- If you want to actively use the backend route, you may need to add or generate those JSON files, or adapt the backend to the current content layout.

### 5. Open the CMS (optional)

The repository includes a CMS entry page:

```text
/admin
```

The CMS is configured to use GitHub as backend. Before using it in your own environment, verify and update the repository and branch settings in the CMS config.

### 6. Build for production

Generate a production build with Hugo:

```bash
hugo
```

The generated static site will be placed in:

```text
public/
```

## Tutorial

### Add a new product

1. Create a new Markdown file in:
   - `content/de/produkte/`
   - `content/en/produkte/`
2. Add front matter similar to:

```yaml
---
product_id: tofu-salami
title: Tofu Salami
calories: 210
fats: 12
saturated_fats: 1.8
carbs: 4
sugars: 1
fiber: 3
protein: 18
salt: 2.1
image: /media/produkte/tofu-salami.png
best_for: "Pizza, sandwiches"
nutriscore: B
texture: 7
description: "Plant-based salami alternative with a smoky taste."
ratio: "1:1"
labels:
  - vegan
categories:
  - fleisch
  - aufschnitt
---
```

3. Add the corresponding image under `static/media/produkte/`.
4. Repeat for the second language version.
5. Start Hugo and verify the product page is generated.

### Add a replacement relation

To make the search page return a substitute, create a relation file in:

- `content/de/ersatzprodukte/`
- `content/en/ersatzprodukte/`

Example:

```yaml
---
title: "Salami → Tofu Salami"
searchProduct: salami
substituteProduct: tofu-salami
hint: "Einfach 1 zu 1 ersetzen."
---
```

This means:

- user searches for `salami`
- application resolves that search key
- matching substitute product `tofu-salami` is displayed

### Add translations

There are two translation layers:

1. **Content translations** in `content/de` and `content/en`
2. **Interface strings** in `i18n/de.json` and `i18n/en.json`

When adding a new UI label, define it in both JSON files.

### Update the homepage

Homepage structure is mainly controlled by:

- `layouts/home.html`
- localized homepage content in `content/de/_index.md` and `content/en/_index.md`

### Run a search manually

After starting the site, open the advanced search page and use query parameters such as:

```text
/search_erweitert/?q=salami
```

or category-based filtering:

```text
/search_erweitert/?c=fleisch
```

## Architecture

### High-level architecture

```text
┌─────────────────────────────────────────────┐
│                 Content Layer               │
│  Markdown front matter, translations, media │
│  - content/de                              │
│  - content/en                              │
│  - static/media                            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               Hugo Build Layer              │
│  Templates + assets compile into static UI  │
│  - layouts/*.html                           │
│  - assets/js/*.js                           │
│  - assets/css/*.css                         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              Browser / Frontend             │
│  - search UI                               │
│  - fuzzy matching                          │
│  - product detail rendering                │
│  - nutrition comparison                    │
└──────────────────────┬──────────────────────┘
                       │ optional
                       ▼
┌─────────────────────────────────────────────┐
│               Go / Gin Backend              │
│  - /ping                                   │
│  - /produkte/:file                         │
│  serves JSON files when available          │
└─────────────────────────────────────────────┘
```

### Frontend architecture

The frontend is primarily generated by Hugo and enhanced in the browser with JavaScript.

#### Template layer

- `layouts/baseof.html` defines the global page shell.
- `layouts/home.html` customizes the landing page.
- `layouts/search_erweitert.html` builds the advanced search UI and serializes product/relation data into JavaScript.
- `layouts/produkte/single.html` renders the detail page and comparison table.

#### Client-side scripts

- `assets/js/fuzzy_search.js`
  - normalizes search text
  - tokenizes terms
  - uses Levenshtein distance and token overlap
  - resolves likely search keys and suggestions

- `assets/js/search_erweitert.js`
  - reads URL parameters (`q`, `c`)
  - invokes fuzzy resolver
  - renders search results, suggestions, or category matches
  - builds result cards and links

- `assets/js/overview.js`
  - reads the `q` parameter on a product detail page
  - looks up the originally searched product
  - fills the comparison table dynamically
  - toggles between overview and nutrition tabs

### Content architecture

The project is content-driven.

#### Product content

Product files contain fields such as:

- `product_id`
- `title`
- `nutrition values`
- `image`
- `best_for`
- `nutriscore`
- `description`
- `ratio`
- `labels`
- `categories`

#### Relation content

Replacement mapping is not hardcoded in JavaScript. Instead, it is stored in `ersatzprodukte` content files with:

- `searchProduct`
- `substituteProduct`
- optional `hint`

This keeps the search behavior maintainable and editable through content changes.

#### Localization

The site uses Hugo multilingual configuration:

- `content/de` for German
- `content/en` for English
- `i18n/*.json` for shared interface labels

### Backend architecture

The Go service in `main.go` is intentionally minimal.

Responsibilities:

- expose a health endpoint
- serve JSON product data from disk


## How search works

1. Hugo serializes all products into `window.SEARCH_PRODUCTS`.
2. Hugo serializes all replacement relations into `window.SEARCH_RELS`.
3. `search_erweitert.js` reads the URL query.
4. `fuzzy_search.js` normalizes and scores possible matches.
5. The best matching `searchProduct` key is selected.
6. Matching relations are resolved to substitute products.
7. Product cards are rendered in the browser.
8. When the user opens a detail page, the original query is passed along using `?q=...` so the comparison table can show both products.


## Known Limitations

- No automated test suite is included in the repository.
- The backend expects JSON files that are not part of the main multilingual Markdown content structure.
- Error handling in the backend is minimal.
- Some generated output in `public/` suggests local base URLs may still need cleanup before deployment.
- Setup depends on the Ananke theme submodule being initialized correctly.

## Release Process

A simple release flow for this project:

1. Update product/content entries.
2. Verify translations in both languages.
3. Run local frontend and backend checks.
4. Build the Hugo site.
5. Update `RELEASE_NOTES.md`.
6. Tag the release in Git.

## Contributors

This repository appears to be a student/team project with feature branches and merged work on homepage, search, translation, and deployment preparation.

## License

No license file is present in the repository snapshot. Add a `LICENSE` file before public distribution if needed.

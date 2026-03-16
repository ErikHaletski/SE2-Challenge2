# Release Notes

## v1.0.0 - Initial functional release

This release delivers the first functional version of the bilingual substitute-product web application.

### Highlights

- Added a Hugo-based multilingual frontend
- Added German and English content structure
- Implemented custom advanced search page
- Added fuzzy search for product lookup and typo tolerance
- Added substitute-product mapping through content files
- Added product detail pages with overview and nutrition comparison
- Added category navigation and homepage improvements
- Added translation support for search and general UI text
- Added deployment preparation work
- Added lightweight Gin backend with `/ping` and `/produkte/:file`

### Included functionality

#### Frontend

- Homepage with navigation and mission section
- Product overview/detail pages
- Nutrition comparison view
- Search result rendering with suggestions
- Category-based browsing
- Responsive static site generation through Hugo

#### Content model

- Structured product entries with nutrition and metadata
- Substitute relation entries for search-to-replacement mapping
- Category and label content types
- Bilingual content in `de` and `en`

#### Search

- Fuzzy matching using normalized terms, token overlap, and Levenshtein scoring
- Support for direct and approximate product queries
- Suggestion rendering when no exact result is found
- Multi-match handling for ambiguous queries

#### Backend

- Health check endpoint: `GET /ping`
- Product file endpoint: `GET /produkte/:file`

### Notable development themes reflected in the Git history

- Homepage implementation and refinement
- Translation fixes and language support completion
- Search bar improvements and fuzzy search extraction
- Nutrition table adjustments and comparison improvements
- Additional product content and search fixes
- Deployment preparation
- Navigation and layout fixes

### Breaking changes

None documented for this initial release.

### Known issues

- Backend expects JSON files under `content/produkte/`, while the current main content model uses Markdown files under language-specific folders.
- Backend error handling should be hardened; missing files currently cause a panic instead of a clean HTTP error.
- Generated site output includes local development URLs in some places and should be reviewed before production deployment.
- No automated tests are included yet.

### Upgrade notes

For a fresh setup:

1. Initialize Git submodules.
2. Install Hugo and Go locally.
3. Start Hugo with `hugo server -D`.
4. Start the backend with `go run main.go`.

### Suggested next release targets

- Align backend data source with Markdown product content
- Add automated tests for search and backend endpoints
- Improve backend error handling and validation
- Consolidate CMS configuration
- Add CI/CD pipeline and release tagging conventions

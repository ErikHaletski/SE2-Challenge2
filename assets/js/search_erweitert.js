(function () {
    function param(parameter) {
        // https://www.w3schools.com/jsref/obj_location.asp -> window location
        // https://www.w3schools.com/jsref/prop_loc_search.asp --> gibt query string der url (also bspw. ?q=ei&wasauchimmer=irgendwas)
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams --> erschafft objekt aus dem parameter
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get --> returned erstes value, was mit dem parameter assoziert ist
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(parameter);
    }

    function hide(elem) {
        if (elem) elem.style.display = "none";
    }

    // security stuff um weirden/bedrohlichen user generated content zu verhindern (gegen XSS)
    function esc(s) {
        return String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function withQueryParam(url, key, value) {
        try {
            const u = new URL(url, window.location.origin);
            u.searchParams.set(key, value);
            return u.pathname + u.search + u.hash;
        } catch (e) {
            const sep = url.includes("?") ? "&" : "?";
            return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
    }

    // --- Fuzzy helper is outsourced to assets/js/fuzzy_search.js ---------------------------------
    // The module registers itself on window.SE2_FUZZY.
    const FUZZY = window.SE2_FUZZY || null;

    // Parameter je nach Modus
    const qRaw = param("q") || "";
    const cRaw = param("c") || "";

    const termQ = qRaw.trim().toLowerCase();
    const termC = cRaw.trim().toLowerCase();

    // Priorität: q > c
    const mode = termQ ? "q" : (termC ? "c" : "none");

    const loading = document.querySelector(".search-loading");
    const resultsEl = document.getElementById("search-results");
    const infoEl = document.getElementById("search-info");
    const queryInput = document.getElementById("search-query");

    if (queryInput) {
        queryInput.value = qRaw;
        queryInput.setAttribute("placeholder", termQ || "Search…");
    }

    const PRODUCTS = window.SEARCH_PRODUCTS || {};
    const RELS = window.SEARCH_RELS || [];
    const SEARCH_PAGE = window.SEARCH_PAGE || window.location.pathname;

    if (!resultsEl) {
        hide(loading);
        return;
    }

    if (infoEl) infoEl.innerHTML = "";

    if (mode === "none") {
        resultsEl.innerHTML = "";
        hide(loading);
        return;
    }

    function renderCard(p, linkOverride) {
        const link = linkOverride || p.link;
        const imgHtml = p.image
            ? `
        <div class="product-media">
          <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
        </div>`
            : `
        <div class="product-media product-media--placeholder"></div>
      `;
        return `
      <div class="product-card">
        ${imgHtml}
        <div class="pa3 tc">
          <h2 class="f3 mt2 mb2">
            <a href="${esc(link)}" class="link eg-product-title">${esc(p.title)}</a>
          </h2>
        </div>      
      </div>
    `;
    }

    const relSearchKeys = Array.from(
        new Set(
            RELS
                .map(r => String(r.searchProduct ?? "").toLowerCase().trim())
                .filter(Boolean)
        )
    );

    const resolver = FUZZY && typeof FUZZY.createSearchKeyResolver === "function"
        ? FUZZY.createSearchKeyResolver({ products: PRODUCTS, relations: RELS })
        : null;

    function renderSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) return "";

        const items = suggestions.map(s => {
            const title = PRODUCTS[s.key]?.title || s.key;
            const link = withQueryParam(SEARCH_PAGE, "q", s.key);
            return `<li class="mv1"><a href="${esc(link)}" class="link">${esc(title)}</a></li>`;
        }).join("\n");

        return `
          <div class="mt3">
            <div class="mid-gray">Did you mean:</div>
            <ul class="list pl0 mt2">
              ${items}
            </ul>
          </div>
        `;
    }

    if (mode === "q") {
        const { keys: foundKeys, suggestions } = resolver
            ? resolver.resolveKeysMulti(qRaw)
            : {
                keys: relSearchKeys.includes(String(qRaw ?? "").trim().toLowerCase())
                    ? [String(qRaw ?? "").trim().toLowerCase()]
                    : [],
                suggestions: []
            };

        // If multiple keys detected, show chooser UI instead of picking one.
        if (foundKeys.length > 1) {
            const items = foundKeys.map(k => {
                const title = PRODUCTS[k]?.title || k;
                const link = withQueryParam(SEARCH_PAGE, "q", k);
                return `<li class="mv2"><a href="${esc(link)}" class="link">${esc(title)}</a></li>`;
            }).join("\n");

            if (infoEl) {
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">Multiple products detected. Choose one:</div>`;
            }

            resultsEl.innerHTML = `
              <div class="mt3">
                <ul class="list pl0 mt2 tc">
                  ${items}
                </ul>
              </div>
            `;
            hide(loading);
            return;
        }

        const searchKey = foundKeys[0] || "";

        if (!searchKey) {
            if (infoEl) {
                const msg = `No substitutes found for “${esc(qRaw.trim())}”.`;
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">${msg}${renderSuggestions(suggestions)}</div>`;
                resultsEl.innerHTML = "";
            } else {
                resultsEl.innerHTML = `<p class="tc mid-gray f4 mt5">No substitutes found for “${esc(qRaw.trim())}”.</p>`;
            }
            hide(loading);
            return;
        }

        const rels = RELS.filter(r =>
            String(r.searchProduct ?? "").toLowerCase().trim() === searchKey
        );

        if (infoEl) {
            const wanted = qRaw.trim();
            const resolvedTitle = PRODUCTS[searchKey]?.title || searchKey;
            if (!wanted) {
                infoEl.innerHTML = "";
            } else if (wanted.trim().toLowerCase() === searchKey) {
                infoEl.innerHTML = "";
            } else {
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">Showing substitutes for “${esc(resolvedTitle)}” (matched from “${esc(wanted)}”).</div>`;
            }
        }

        const ids = [];
        for (const r of rels) {
            const sub = (r.substituteProduct || "").toLowerCase();
            if (!sub) continue;
            if (!ids.includes(sub)) ids.push(sub);
        }

        if (ids.length === 0) {
            if (infoEl) {
                const msg = `No substitutes found for “${esc(PRODUCTS[searchKey]?.title || searchKey)}”.`;
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">${msg}</div>`;
            }
            resultsEl.innerHTML = "";
            hide(loading);
            return;
        }

        const cardObjs = [];
        for (const id of ids) {
            const p = PRODUCTS[id];
            if (!p) continue;

            const mergedLink = withQueryParam(p.link, "q", searchKey);
            cardObjs.push({
                title: String(p.title || ""),
                html: renderCard(p, mergedLink)
            });
        }

        if (cardObjs.length === 0) {
            const missing = ids.filter(id => !PRODUCTS[id]);
            console.warn("Relations found, but substitute products are missing in PRODUCTS:", missing);
            if (infoEl) {
                const msg = `No substitutes found for “${esc(PRODUCTS[searchKey]?.title || searchKey)}”.`;
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">${msg}</div>`;
            }
            resultsEl.innerHTML = "";
            hide(loading);
            return;
        }

        cardObjs.sort((a, b) => a.title.localeCompare(b.title));

        resultsEl.innerHTML = cardObjs.map(x => x.html).join("\n");
        hide(loading);
        return;
    }

    if (mode === "c") {
        if (infoEl) infoEl.innerHTML = "";

        const all = Object.values(PRODUCTS);

        const matches = all.filter(p => {
            const cats = Array.isArray(p.categories) ? p.categories : [];
            return cats.map(x => String(x).toLowerCase()).includes(termC);
        });

        if (matches.length === 0) {
            if (infoEl) {
                infoEl.innerHTML = `<div class="tc mid-gray f5 mt4">No products found in category “${esc(termC)}”.</div>`;
            }
            resultsEl.innerHTML = "";
            hide(loading);
            return
        }

        matches.sort((a, b) => String(a.title).localeCompare(String(b.title)));

        const cards = matches.map(p => {
            const linkToQ = withQueryParam(SEARCH_PAGE, "q", p.id);
            return renderCard(p, linkToQ);
        });

        resultsEl.innerHTML = cards.join("\n");
        hide(loading);
    }
})();
(function () {
    function param(parameter) {
        // https://www.w3schools.com/jsref/obj_location.asp -> window location
        // https://www.w3schools.com/jsref/prop_loc_search.asp --> gibt query string der url (also bspw. ?q=ei&wasauchimmer=irgendwas)
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams --> erschafft objekt aus dem parameter und
        const urlParams = new URLSearchParams(window.location.search);
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get --> returned erstes value, was mit dem parameter assoziert ist
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

    // Parameter je nach Modus
    const qRaw = param("q") || "";
    const cRaw = param("c") || "";

    const termQ = qRaw.trim().toLowerCase();
    const termC = cRaw.trim().toLowerCase();

    // Priorität: q > c
    const mode = termQ ? "q" : (termC ? "c" : "none");

    const loading = document.querySelector(".search-loading");
    const resultsEl = document.getElementById("search-results");
    const queryInput = document.getElementById("search-query");

    // befüllen der searchbar (mit der ursprünglichen eingabe)
    // nur sinnvoll im q-mode
    if (queryInput) {
        queryInput.value = qRaw;
        queryInput.setAttribute("placeholder", termQ || "Search…");
    }

    // gesetzt durch html
    // searchproducts = produktdaten keyed durch product_id
    // searchrels = liste aller beziehungen (ersatzprodukte)
    const PRODUCTS = window.SEARCH_PRODUCTS || {};
    const RELS = window.SEARCH_RELS || [];
    const SEARCH_PAGE = window.SEARCH_PAGE || window.location.pathname;

    if (!resultsEl) {
        hide(loading);
        return;
    }

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
        <div class="pa3">
          <h2 class="f3 mt2 mb3">
            <a href="${esc(link)}" class="link">${esc(p.title)}</a>
          </h2>
        </div>
      </div>
    `;
    }

    if (mode === "q") {
        const rels = RELS.filter(r => (r.searchProduct || "").toLowerCase() === termQ);

        const ids = [];
        for (const r of rels) {
            const sub = (r.substituteProduct || "").toLowerCase();
            if (!sub) continue;
            if (!ids.includes(sub)) ids.push(sub);
        }

        if (ids.length === 0) {
            resultsEl.innerHTML = `<p class="tc mid-gray f4 mt5">No substitutes found for “${esc(termQ)}”.</p>`;
            hide(loading);
            return;
        }

        const cards = [];
        for (const id of ids) {
            const p = PRODUCTS[id];
            if (!p) continue;

            const mergedLink = withQueryParam(p.link, "q", termQ);
            cards.push(renderCard(p, mergedLink));
        }

        resultsEl.innerHTML = cards.join("\n");
        hide(loading);
        return;
    }

    if (mode === "c") {
        const all = Object.values(PRODUCTS);

        const matches = all.filter(p => {
            const cats = Array.isArray(p.categories) ? p.categories : [];
            return cats.map(x => String(x).toLowerCase()).includes(termC);
        });

        if (matches.length === 0) {
            resultsEl.innerHTML = `<p class="tc mid-gray f4 mt5">No products found in category “${esc(termC)}”.</p>`;
            hide(loading);
            return;
        }

        matches.sort((a, b) => String(a.title).localeCompare(String(b.title)));

        const cards = matches.map(p => {
            // Klick startet q-search (SEARCH_PAGE?q=<product_id>)
            const linkToQ = withQueryParam(SEARCH_PAGE, "q", p.id);
            return renderCard(p, linkToQ);
        });

        resultsEl.innerHTML = cards.join("\n");
        hide(loading);
    }
})();
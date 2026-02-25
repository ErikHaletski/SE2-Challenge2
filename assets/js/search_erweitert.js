(function () {
    function param(parameter) {
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

    // --- Basic fuzzy matching helpers -------------------------------------------------------------

    // Normalisiert User-Input + Kandidaten, damit "Salami", "salami!", "Sàlàmi" etc. vergleichbar sind.
    // Ziel: robust gegen Groß/Klein, Umlaute/Diakritika, Sonderzeichen, mehrfach Spaces.
    function normalizeText(input) {
        return String(input ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // diacritics
            .replace(/ß/g, "ss")
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .replace(/\s+/g, " ");
    }

    function tokenize(norm) {
        if (!norm) return [];
        return norm.split(" ").filter(Boolean);
    }

    // Levenshtein-Distanz (Edit-Distance) für Tippfehler.
    function levenshtein(a, b) {
        if (a === b) return 0;
        if (!a) return b.length;
        if (!b) return a.length;

        const aLen = a.length;
        const bLen = b.length;
        const v0 = new Array(bLen + 1);
        const v1 = new Array(bLen + 1);

        for (let i = 0; i <= bLen; i++) v0[i] = i;

        for (let i = 0; i < aLen; i++) {
            v1[0] = i + 1;
            const aChar = a.charCodeAt(i);

            for (let j = 0; j < bLen; j++) {
                const cost = aChar === b.charCodeAt(j) ? 0 : 1;
                v1[j + 1] = Math.min(
                    v1[j] + 1,      // insertion
                    v0[j + 1] + 1,  // deletion
                    v0[j] + cost    // substitution
                );
            }

            for (let j = 0; j <= bLen; j++) v0[j] = v1[j];
        }

        return v0[bLen];
    }

    function tokenJaccard(aTokens, bTokens) {
        if (!aTokens.length || !bTokens.length) return 0;
        const aSet = new Set(aTokens);
        const bSet = new Set(bTokens);
        let inter = 0;
        for (const t of aSet) if (bSet.has(t)) inter++;
        const union = new Set([...aSet, ...bSet]).size;
        return union ? inter / union : 0;
    }

    // Liefert Score 0..1; höher = besser.
    // - Substring/Token-Overlap für "vegane salami" -> "salami"
    // - Levenshtein für "sallami" -> "salami"
    function scoreCandidate(queryNorm, candNorm) {
        if (!candNorm) return 0;
        if (queryNorm === candNorm) return 1;

        const qTokens = tokenize(queryNorm);
        const cTokens = tokenize(candNorm);

        let substringScore = 0;
        if (queryNorm.length >= 3) {
            if (queryNorm.includes(candNorm)) substringScore = 0.97;
            else if (candNorm.includes(queryNorm)) substringScore = 0.93;
        }

        const tokenScore = tokenJaccard(qTokens, cTokens); // 0..1

        let levScore = 0;
        const maxLen = Math.max(queryNorm.length, candNorm.length);
        if (maxLen) {
            const dist = levenshtein(queryNorm, candNorm);
            levScore = 1 - dist / maxLen;
        }

        // Gewichtung: primär Levenshtein, mit etwas Token-Overlap, plus Substring-Boost.
        const blended = (levScore * 0.88) + (tokenScore * 0.12);
        return Math.max(substringScore, tokenScore * 0.9, blended);
    }

    function bestMatches(queryNorm, candidates, limit = 3) {
        const scored = candidates
            .map(c => ({ ...c, score: scoreCandidate(queryNorm, c.norm) }))
            .sort((a, b) => b.score - a.score);
        return scored.slice(0, Math.min(limit, scored.length));
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
    const infoEl = document.getElementById("search-info");
    const queryInput = document.getElementById("search-query");

    // befüllen der searchbar (mit der ursprünglichen eingabe)
    if (queryInput) {
        queryInput.value = qRaw;
        queryInput.setAttribute("placeholder", termQ || "Search…");
    }

    // gesetzt durch html
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
        <div class="pa3">
          <h2 class="f3 mt2 mb2">
            <a href="${esc(link)}" class="link">${esc(p.title)}</a>
          </h2>
        </div>
      </div>
    `;
    }

    // Kandidatenliste: welche searchProduct-Werte existieren überhaupt?
    const relSearchKeys = Array.from(
        new Set(
            RELS
                .map(r => String(r.searchProduct ?? "").toLowerCase().trim())
                .filter(Boolean)
        )
    );

    const relCandidates = relSearchKeys.map(key => {
        const p = PRODUCTS[key];
        const title = p && p.title ? String(p.title) : "";
        // Norm-String enthält Key + Title, damit "Salami" und "salami" beide gut matchen.
        const norm = normalizeText([key, title].filter(Boolean).join(" "));
        return { key, title, norm };
    });

    function resolveSearchKeyFromQuery(rawQuery) {
        const rawLower = String(rawQuery ?? "").trim().toLowerCase();
        const qNorm = normalizeText(rawQuery);

        if (!qNorm) return { key: "", qNorm: "", match: null, suggestions: [] };

        // 1) Exact key
        if (relSearchKeys.includes(rawLower)) {
            return { key: rawLower, qNorm, match: { via: "exact", score: 1 }, suggestions: [] };
        }

        // 2) Exact title match (normalisiert)
        for (const c of relCandidates) {
            if (c.title && normalizeText(c.title) === qNorm) {
                return { key: c.key, qNorm, match: { via: "title", score: 1 }, suggestions: [] };
            }
        }

        // 3) Fuzzy (bei sehr kurzen Strings zu ungenau)
        if (qNorm.length < 2) {
            return { key: "", qNorm, match: null, suggestions: [] };
        }

        const best = bestMatches(qNorm, relCandidates, 1)[0];
        const threshold = qNorm.length <= 4 ? 0.82 : 0.72;

        const suggestions = bestMatches(qNorm, relCandidates, 3)
            .filter(x => x.score >= 0.45);

        if (!best || best.score < threshold) {
            return { key: "", qNorm, match: null, suggestions };
        }

        return {
            key: best.key,
            qNorm,
            match: { via: "fuzzy", score: best.score },
            suggestions
        };
    }

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
        const { key: searchKey, suggestions } = resolveSearchKeyFromQuery(qRaw);

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

        const rels = RELS.filter(r => normalizeText(r.searchProduct) === normalizeText(searchKey));

        // Info, wenn nicht exakt gematcht wurde.
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

            // q-Param weitergeben (für Context). Hier besser: der aufgelöste Key.
            const mergedLink = withQueryParam(p.link, "q", searchKey);
            cardObjs.push({
                title: String(p.title || ""),
                html: renderCard(p, mergedLink)
            });
        }

        // Alphabetisch nach Titel
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
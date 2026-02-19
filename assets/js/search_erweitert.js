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

    const qRaw = param("q") || "";
    const term = qRaw.trim().toLowerCase();

    const loading = document.querySelector(".search-loading");
    const resultsEl = document.getElementById("search-results");
    const queryInput = document.getElementById("search-query");

    // befüllen der searchbar (mit der ursprünglichen eingabe)
    if (queryInput) {
        queryInput.value = qRaw;
        queryInput.setAttribute("placeholder", term || "Search…");
    }

    // gesetzt durch html
    // searchproducts = produktdaten keyed durch product_id
    // searchrels = liste aller beziehungen (ersatzprodukte)
    const PRODUCTS = window.SEARCH_PRODUCTS || {}; // { id: {id,title,link,image,description,ratio} }
    const RELS = window.SEARCH_RELS || [];         // [{searchProduct, substituteProduct, hint}]

    if (!resultsEl) {
        hide(loading);
        return;
    }

    if (!term) {
        resultsEl.innerHTML = "";
        hide(loading);
        return;
    }

    // passende ersatzprodukte finden
    // gibt nur zurück, wo searchProduct = term
    const rels = RELS.filter(r => (r.searchProduct || "").toLowerCase() === term);

    // die substitude ids und deren beschreibung/hinweise sammeln
    const ids = [];
    for (const r of rels) {
        const sub = (r.substituteProduct || "").toLowerCase();
        if (!sub) continue;
        if (!ids.includes(sub)) ids.push(sub);
    }

    // wenn keine ersatzprodukte zum term existieren -> zeige hardcoded value an
    if (ids.length === 0) {
        resultsEl.innerHTML = `<p class="tc mid-gray f4 mt5">No substitutes found for “${esc(term)}”.</p>`;
        hide(loading);
        return;
    }

    // html für produktkarte erzeugen (ich will quasi tiles mit bild, titel und read more)
    function renderCard(p) {
        const imgHtml = p.image
            ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" class="w-100 br2 mb2" loading="lazy">`
            : "";
        return `
    <div class="w-100 w-30-l mb4 relative bg-white">
      ${imgHtml}
      <div class="pa3">
        <h2 class="f3 mt2 mb3">
          <a href="${esc(p.link)}" class="link">${esc(p.title)}</a>
        </h2>
        <a class="ba b--black-20 br2 ph2 pv1 f6 dib link" href="${esc(p.link)}">read more</a>
      </div>
    </div>
  `;
    }

    // für jedes ersatzprodukt: produktobjekt aus products und erzeuge htmlkarte und pushe in cards
    const cards = [];
    for (const id of ids) {
        const p = PRODUCTS[id];
        if (!p) continue;
        cards.push(renderCard(p));
    }

    // schreiben der karten in html-string, string wird in search-results eingesetzt
    resultsEl.innerHTML = cards.join("\n");
    hide(loading);
})();

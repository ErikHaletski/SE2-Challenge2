(function () {
    function param(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function formatValue(value, unit) {
        if (value === undefined || value === null || value === "") return "—";
        return `${value}${unit ?? ""}`;
    }

    function show(el, display = "block") {
        if (el) el.style.display = display;
    }

    function hide(el) {
        if (el) el.style.display = "none";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const qRaw = param("q") || "";
        const searchProductId = qRaw.trim().toLowerCase();

        const products = window.SEARCH_PRODUCTS || {};
        const p = products[searchProductId];

        const compareTable = document.getElementById("nutrition-compare-table");
        const noteEl = document.getElementById("search-product-note");

        // Wenn du die Detailseite ohne ?q öffnest
        if (!searchProductId) {
            hide(compareTable);
            if (noteEl) {
                noteEl.textContent = "Kein Suchprodukt übergeben (URL Parameter ?q=...).";
                show(noteEl, "block");
            }
            return;
        }

        // Wenn ?q nicht zu einem product_id passt
        if (!p) {
            hide(compareTable);
            if (noteEl) {
                noteEl.textContent = `Unbekanntes Suchprodukt: "${searchProductId}". (product_id stimmt nicht?)`;
                show(noteEl, "block");
            }
            return;
        }

        // Tabelle befüllen
        setText("search-product-title", p.title || searchProductId);
        setText("sp-calories", formatValue(p.calories, "kcal"));
        setText("sp-fats", formatValue(p.fats, "g"));
        setText("sp-saturated_fats", formatValue(p.saturated_fats, "g"));
        setText("sp-carbs", formatValue(p.carbs, "g"));
        setText("sp-sugars", formatValue(p.sugars, "g"));
        setText("sp-fiber", formatValue(p.fiber, "g"));
        setText("sp-protein", formatValue(p.protein, "g"));
        setText("sp-salt", formatValue(p.salt, "g"));

        hide(noteEl);
        show(compareTable, "table");
    });
})();

function showOverview() {
    var x = document.getElementById("produkt-id");
    var y = document.getElementById("produkt-label");
    var nutrition = document.getElementById("nutritions-detail");
    const btnOverview = document.getElementById("btn-overview");
    const btnNutrition = document.getElementById("btn-nutrition");

    x.style.display = "flex";
    y.style.display = "block";
    nutrition.style.display = "none";
    btnOverview.classList.add("active");
    btnNutrition.classList.remove("active");
}

function showNutrition() {
    var x = document.getElementById("produkt-id");
    var y = document.getElementById("produkt-label");
    var nutrition = document.getElementById("nutritions-detail");
    const btnOverview = document.getElementById("btn-overview");
    const btnNutrition = document.getElementById("btn-nutrition");

    x.style.display = "none";
    y.style.display = "none";
    nutrition.style.display = "block";
    btnOverview.classList.remove("active");
    btnNutrition.classList.add("active");
}
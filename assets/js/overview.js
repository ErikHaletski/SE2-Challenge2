(function () {
    const qRaw = new URLSearchParams(window.location.search).get("q") || "";
    const term = qRaw.trim().toLowerCase();

    const compare = document.querySelector(".nutrition-compare-table");

    console.log("term:", term);
})();


function showOverview() {
    var x = document.getElementById("produkt-id");
    var y = document.getElementById("produkt-label");
    var nutrition = document.getElementById("nutritions-detail");
    const btnOverview = document.getElementById("btn-overview");
    const btnNutrition = document.getElementById("btn-nutrition");

    x.style.display = "flex";
    y.style.display = "block";
    nutrition.style.display = "none"
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


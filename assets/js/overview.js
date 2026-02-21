function showOverview() {
    var x = document.getElementById("produkt-id");
    var nutrition = document.getElementById("nutritions-detail");
    const btnOverview = document.getElementById("btn-overview");
    const btnNutrition = document.getElementById("btn-nutrition");

    x.style.display = "flex";
    nutrition.style.display = "none"
    btnOverview.classList.add("active");
    btnNutrition.classList.remove("active");
  }

function showNutrition() {
    var x = document.getElementById("produkt-id");
    var nutrition = document.getElementById("nutritions-detail");
    const btnOverview = document.getElementById("btn-overview");
    const btnNutrition = document.getElementById("btn-nutrition");

    x.style.display = "none";
    nutrition.style.display = "block";
    btnOverview.classList.remove("active");
    btnNutrition.classList.add("active");
} 


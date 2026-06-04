let addIngredientsBtn = document.getElementById("addIngredientsBtn");
let ingredientList = document.querySelector(".ingredientList");
let ingredientDiv = document.querySelectorAll(".ingredientDiv")[0];
let addStepsBtn = document.getElementById("addStepsBtn");
let stepList = document.querySelector(".stepList");
let stepDiv = document.querySelectorAll(".stepDiv")[0];

if (addIngredientsBtn && ingredientList && ingredientDiv) {
  addIngredientsBtn.addEventListener("click", function () {
    let newIngredients = ingredientDiv.cloneNode(true);
    let input = newIngredients.querySelector("input");

    input.value = "";
    ingredientList.appendChild(newIngredients);
  });
}

if (addStepsBtn && stepList && stepDiv) {
  addStepsBtn.addEventListener("click", function () {
    let newStep = stepDiv.cloneNode(true);
    let input = newStep.querySelector("input");

    input.value = "";
    stepList.appendChild(newStep);
  });
}

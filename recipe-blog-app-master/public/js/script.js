let addIngredientsBtn = document.getElementById("addIngredientsBtn");
let ingredientList = document.querySelector(".ingredientList");
let ingredientDiv = document.querySelectorAll(".ingredientDiv")[0];

addIngredientsBtn.addEventListener("click", function () {
  let newIngredients = ingredientDiv.cloneNode(true);
  let input = newIngredients.querySelector("input");

  input.value = "";
  ingredientList.appendChild(newIngredients);
});

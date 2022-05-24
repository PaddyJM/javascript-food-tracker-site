import FetchWrapper from "./fetch-wrapper.js";
import { capitalize, calculateCalories } from "./helpers.js";
import * as snackbar from "snackbar";

const API = new FetchWrapper(
  "https://168yhpo157.execute-api.eu-west-2.amazonaws.com/prod"
);

const list = document.querySelector("#food-list");
const form = document.querySelector("#create-form");
const name = document.querySelector("#create-name");
const carbs = document.querySelector("#create-carbs");
const protein = document.querySelector("#create-protein");
const fat = document.querySelector("#create-fat");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  API.post("/foodlogtable", {
    fields: {
      Name: { S: name.value },
      Carbs: { N: carbs.value },
      Protein: { N: protein.value },
      Fat: { N: fat.value },
    },
  }).then((data) => {
    console.log(data);
    if (data.error) {
      // there was an error
      snackbar.show("Some data is missing.");
      return;
    }

    const calories = calculateCalories(carbs.value, protein.value, fat.value)

    displayEntry(list, name.value, calories, carbs.value, protein.value, fat.value)

    snackbar.show("Food added successfully.");

    name.value = "";
    carbs.value = "";
    protein.value = "";
    fat.value = "";
  });
});

const init = () => {
    API.get("/foodlogtable").then((data) => {
      console.log(data)
      data.Items?.forEach((item) => {
        const calories = calculateCalories(item.Fat.N, item.Protein.N, item.Fat.N)

         displayEntry(list, item.Name.S, calories, item.Carbs.N, item.Protein.N, item.Fat.N)
      });
    });
}

const displayEntry = (list, name, calories, carbs, protein, fat) => {
    list.insertAdjacentHTML(
      "beforeend",
      `<li class="card">
          <div>
            <h3 class="name">${capitalize(name)}</h3>
            <div class="calories">${calories} calories</div>
            <ul class="macros">
              <li class="carbs"><div>Carbs</div><div class="value">${
                carbs
              }g</div></li>
              <li class="protein"><div>Protein</div><div class="value">${
                protein
              }g</div></li>
              <li class="fat"><div>Fat</div><div class="value">${
                fat
              }g</div></li>
            </ul>
          </div>
        </li>`
    );
}

init();
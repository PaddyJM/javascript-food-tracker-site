// TODO
const baseURL =
  "https://firestore.googleapis.com/v1/projects/jsdemo-3f387/databases/(default)/documents/paddyjm77";

const form = document.querySelector("#create-form");

const name = document.querySelector("#create-name");

const carbs = document.querySelector("#create-carbs");

const protein = document.querySelector("#create-protein");

const fat = document.querySelector("#create-fat");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch(baseURL + "/", {
    method: "post",
    body: JSON.stringify({
      fields: {
        name: { stringValue: name.value },
        carbs: { integerValue: carbs.value },
        protein: { integerValue: protein.value },
        fat: { integerValue: fat.value },
      },
    }),
  });

  const data = await response.json();

  if (!data.error) {
    name.value = "";
    carbs.value = "";
    protein.value = "";
    fat.value = "";
  }
});

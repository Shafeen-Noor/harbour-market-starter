import { describe, getJSON } from "./api.js";
import { state, toggleSaved } from "./state.js";
import { save, load } from "./storage.js";
import { render } from "./render.js";
import { setupMenu } from "./menu.js";
import { setupTickets } from "./tickets.js";

const filters = document.querySelector(".filters");
const list = document.querySelector(".vendor-list");
const search = document.querySelector("#vendor-search");
const errorBox = document.querySelector(".load-error");

function update() {
  render();
  save();
}

async function loadStalls() {
  state.status = "loading";
  state.error = "";
  render();

  try {
    state.stalls = await getJSON("/stalls");
    state.total = state.stalls.length;
    state.status = "ready";
  } catch (error) {
    state.error = `Couldn't load the vendors: ${describe(error)}.`;
    state.status = "error";
    console.error(error);
  }

  render();
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.tag = button.dataset.filter;
  update();
});

search.addEventListener("input", (event) => {
  state.query = event.target.value;
  update();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".save");
  if (!button) return;
  toggleSaved(button.closest(".stall").dataset.id);
  update();
});

errorBox.querySelector("button").addEventListener("click", () => {
  document.querySelector(".finder .status").focus();
  void loadStalls();
});

setupMenu();
setupTickets();
load();
render();
await loadStalls();

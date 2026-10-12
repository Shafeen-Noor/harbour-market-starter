import { describe, getJSON } from "./api.js";
import { state, toggleSaved } from "./state.js";
import { save, load } from "./storage.js";
import { render } from "./render.js";
import { setupMenu } from "./menu.js";
import { setupTickets } from "./tickets.js";

const filters = document.querySelector(".filters");
const list = document.querySelector(".vendor-list");
const search = document.querySelector("#vendor-search");
const status = document.querySelector(".finder .status");
const errorBox = document.querySelector(".load-error");
const tags = new Set(["all", "food", "music", "crafts", "drinks"]);
let controller;
let searchTimer;

function updateUrl() {
  const url = new URL(window.location.href);
  const query = state.query.trim();
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  if (state.tag === "all") url.searchParams.delete("tag");
  else url.searchParams.set("tag", state.tag);
  history.pushState(null, "", url);
}

function readUrl(useUrlFilter = false) {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") ?? "";
  const tag = params.get("tag");
  if (useUrlFilter || params.has("q") || params.has("tag")) {
    state.tag = tags.has(tag) ? tag : "all";
  }
}

async function loadStalls() {
  controller?.abort();
  controller = new AbortController();
  const requestController = controller;
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.tag !== "all") params.set("tag", state.tag);
  const suffix = params.size ? `?${params}` : "";
  let totalCount;

  state.status = "loading";
  state.error = "";
  render();

  try {
    const stalls = await getJSON(`/stalls${suffix}`, {
      signal: requestController.signal,
      onResponse(response) {
        if (requestController !== controller) return;
        const count = Number(response.headers.get("X-Total-Count"));
        if (response.headers.has("X-Total-Count") && Number.isFinite(count)) totalCount = count;
      },
    });
    if (requestController !== controller) return;
    state.stalls = stalls;
    state.total = totalCount ?? stalls.length;
    state.status = "ready";
  } catch (error) {
    if (error.name === "AbortError" || requestController !== controller) return;
    state.status = "error";
    state.error = `Couldn't load the vendors: ${describe(error)}.`;
    console.error(error);
  }

  render();
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.tag = button.dataset.filter;
  save();
  clearTimeout(searchTimer);
  updateUrl();
  void loadStalls();
});

search.addEventListener("input", (event) => {
  state.query = event.target.value;
  controller?.abort();
  render();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    updateUrl();
    void loadStalls();
  }, 250);
});

window.addEventListener("popstate", () => {
  clearTimeout(searchTimer);
  readUrl(true);
  save();
  render();
  void loadStalls();
});

errorBox.querySelector("button").addEventListener("click", () => {
  status.focus();
  void loadStalls();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".save");
  if (!button) return;
  toggleSaved(button.closest(".stall").dataset.id);
  save();
  render();
});

setupMenu();
setupTickets();
load();
readUrl();
render();
await loadStalls();

import { state, visibleStalls } from "./state.js";

const template = document.querySelector("#stall-template");
const list = document.querySelector(".vendor-list");
const filters = document.querySelector(".filters"); // module scope: main.js has its own
const count = document.querySelector(".filter-count");
const savedCount = document.querySelector(".saved-count");
const search = document.querySelector("#vendor-search");
const errorBox = document.querySelector(".load-error");

// Data in, element out
function card(stall) {
  const li = template.content.firstElementChild.cloneNode(true);
  li.dataset.id = stall.id;
  li.dataset.tag = stall.tag;

  const article = li.querySelector(".vendor-card");
  article.classList.toggle("featured", Boolean(stall.featured));
  article.classList.toggle("sold-out", Boolean(stall.soldOut)); // Boolean: a missing key is undefined, and toggle(name, undefined) flips

  li.querySelector(".tag").textContent = stall.tag;
  li.querySelector("h3").textContent = stall.name;
  li.querySelector(".blurb").textContent = stall.blurb;
  li.querySelector(".price").textContent = stall.price === 0 ? "free" : `from €${stall.price}`;
  li.querySelector(".badge").hidden = !stall.soldOut;
  const rating = li.querySelector(".rating");
  rating.textContent = stall.rating == null
    ? "no reviews yet"
    : `★ ${Number(stall.rating).toFixed(1)} · ${stall.reviewCount} ${stall.reviewCount === 1 ? "review" : "reviews"}`;

  const isSaved = state.saved.has(stall.id);
  const save = li.querySelector(".save");
  save.setAttribute("aria-pressed", String(isSaved));
  save.setAttribute("aria-label", `Save ${stall.name}`);
  save.textContent = isSaved ? "♥" : "♡";
  return li;
}

// Draws everything that depends on state. Safe to call any number of times.
export function render() {
  const visible = visibleStalls();
  list.setAttribute("aria-busy", String(state.status === "loading"));

  if (visible.length) {
    list.replaceChildren(...visible.map(card));
  } else if (state.status === "loading" && state.total === 0) {
    const loading = document.createElement("li");
    loading.className = "empty";
    loading.textContent = "Loading the vendors…";
    list.replaceChildren(loading);
  } else if (state.status === "error" && state.total === 0) {
    const unavailable = document.createElement("li");
    unavailable.className = "empty";
    unavailable.textContent = "The vendors couldn't be loaded.";
    list.replaceChildren(unavailable);
  } else {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = state.query.trim()
      ? `No stall matches “${state.query}”.`
      : "No stalls to show.";
    list.replaceChildren(empty);
  }

  for (const button of filters.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === state.tag));
  }
  count.textContent = state.status === "loading"
    ? "Loading the vendors…"
    : state.status === "error"
      ? "The vendors didn't load."
      : `${visible.length} ${visible.length === 1 ? "stall" : "stalls"}`;
  savedCount.textContent = state.saved.size ? `♥ ${state.saved.size} saved` : "";
  errorBox.querySelector("p").textContent = state.error;
  errorBox.querySelector("button").hidden = state.status !== "error";

  // Controls are part of the page too: draw them from state
  // (only when different: rewriting the box you're typing in can move the cursor)
  if (search.value !== state.query) search.value = state.query;
}

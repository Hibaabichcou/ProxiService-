const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#service-search");
const professionalCards = [...document.querySelectorAll(".professional-card")];
const emptyState = document.querySelector("#empty-state");
const resultsMessage = document.querySelector("#results-message");

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function filterProfessionals(query, { scroll = false } = {}) {
  const searchTerm = normalizeText(query);
  let visibleCount = 0;

  for (const card of professionalCards) {
    const searchableText = normalizeText(
      `${card.dataset.professional} ${card.textContent}`,
    );
    const isMatch = !searchTerm || searchableText.includes(searchTerm);

    card.hidden = !isMatch;
    if (isMatch) visibleCount += 1;
  }

  emptyState.hidden = visibleCount > 0;
  resultsMessage.textContent = searchTerm
    ? `${visibleCount} ${visibleCount > 1 ? "professionnels trouvés" : "professionnel trouvé"} pour « ${query.trim()} ».`
    : "";

  if (scroll) {
    document.querySelector("#professionnels").scrollIntoView({ behavior: "smooth" });
  }
}

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  mainNav.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute(
    "aria-label",
    isExpanded ? "Ouvrir le menu" : "Fermer le menu",
  );
  mainNav.classList.toggle("is-open", !isExpanded);
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  filterProfessionals(searchInput.value, { scroll: true });
});

document.querySelectorAll("[data-search]").forEach((control) => {
  control.addEventListener("click", () => {
    const query = control.dataset.search.split(/\s+/)[0];
    searchInput.value = query;
    filterProfessionals(query, { scroll: true });
  });
});

document.querySelector("#current-year").textContent = String(
  new Date().getFullYear(),
);

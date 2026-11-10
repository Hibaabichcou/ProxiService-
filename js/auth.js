const STORAGE_KEYS = {
  accounts: "proxiservice.demo.accounts.v1",
  session: "proxiservice.demo.session.v1",
  workspace: "proxiservice.demo.workspace.v1",
};

const page = document.body.dataset.page;
const currentYear = document.querySelector("[data-current-year]");

if (currentYear) currentYear.textContent = String(new Date().getFullYear());

function readAccounts() {
  const saved = localStorage.getItem(STORAGE_KEYS.accounts);
  if (!saved) return [];

  const accounts = JSON.parse(saved);
  if (!Array.isArray(accounts)) {
    throw new Error("Les comptes de démonstration enregistrés sont illisibles.");
  }
  return accounts;
}

function writeAccounts(accounts) {
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

function readWorkspace() {
  const saved = localStorage.getItem(STORAGE_KEYS.workspace);
  if (!saved) return { requests: [], services: [] };

  const workspace = JSON.parse(saved);
  if (
    !workspace
    || !Array.isArray(workspace.requests)
    || !Array.isArray(workspace.services)
  ) {
    throw new Error("Les données de démonstration enregistrées sont illisibles.");
  }
  return workspace;
}

function writeWorkspace(workspace) {
  localStorage.setItem(STORAGE_KEYS.workspace, JSON.stringify(workspace));
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  if (!crypto.subtle) {
    throw new Error(
      "Le navigateur ne permet pas la vérification locale des mots de passe. Ouvrez le site depuis une adresse locale en HTTPS ou localhost.",
    );
  }

  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function setSession(email) {
  localStorage.setItem(STORAGE_KEYS.session, email);
}

function getCurrentAccount() {
  const email = localStorage.getItem(STORAGE_KEYS.session);
  if (!email) return null;
  return readAccounts().find((account) => account.email === email) ?? null;
}

function redirectToDashboard() {
  window.location.href = "tableau-de-bord.html";
}

function showFeedback(element, message, type = "error") {
  element.textContent = message;
  element.dataset.state = type;
}

function setupSignup() {
  const form = document.querySelector("#signup-form");
  if (!form) return;

  const feedback = document.querySelector("#signup-feedback");
  const professionalFields = document.querySelector("#professional-fields");
  const roleOptions = [...form.querySelectorAll('input[name="role"]')];
  const tradeInput = form.elements.namedItem("trade");
  const descriptionInput = form.elements.namedItem("description");
  const cityInput = form.elements.namedItem("city");
  const priceInput = form.elements.namedItem("price");
  const professionalInputs = [
    tradeInput,
    descriptionInput,
    cityInput,
    priceInput,
  ];

  function updateRoleFields() {
    const isProfessional = form.elements.namedItem("role").value === "professional";
    professionalFields.hidden = !isProfessional;
    professionalInputs.forEach((input) => {
      input.disabled = !isProfessional;
      input.required = isProfessional;
    });
  }

  roleOptions.forEach((option) => {
    option.addEventListener("change", updateRoleFields);
  });
  updateRoleFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.textContent = "";
    const formData = new FormData(form);
    const email = String(formData.get("email")).trim().toLocaleLowerCase("fr");
    const password = String(formData.get("password"));
    const role = String(formData.get("role"));

    try {
      const accounts = readAccounts();
      if (accounts.some((account) => account.email === email)) {
        showFeedback(feedback, "Un compte de démonstration utilise déjà cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.");
        return;
      }

      const salt = createSalt();
      const passwordHash = await hashPassword(password, salt);
      const account = {
        id: createId(),
        name: String(formData.get("name")).trim(),
        email,
        phone: String(formData.get("phone")).trim(),
        role,
        passwordSalt: salt,
        passwordHash,
        createdAt: new Date().toISOString(),
        profile: role === "professional"
          ? {
            trade: String(formData.get("trade")).trim(),
            description: String(formData.get("description")).trim(),
            city: String(formData.get("city")).trim(),
            price: String(formData.get("price")).trim(),
          }
          : {},
      };

      accounts.push(account);
      writeAccounts(accounts);
      setSession(email);

      if (role === "professional") {
        const workspace = readWorkspace();
        workspace.services.push({
          id: createId(),
          owner: email,
          name: account.profile.trade,
          description: account.profile.description,
          price: account.profile.price,
          createdAt: new Date().toISOString(),
        });
        workspace.requests.push({
          id: createId(),
          owner: email,
          trade: account.profile.trade,
          description: `Exemple de demande pour le métier « ${account.profile.trade} ». Cette demande est fictive.`,
          city: account.profile.city,
          customerName: "Client de démonstration",
          status: "Nouvelle",
          isDemo: true,
          createdAt: new Date().toISOString(),
        });
        writeWorkspace(workspace);
      }

      form.reset();
      redirectToDashboard();
    } catch (error) {
      showFeedback(
        feedback,
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer ce compte de démonstration dans le navigateur.",
      );
    }
  });
}

function setupLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  const feedback = document.querySelector("#login-feedback");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.textContent = "";
    const formData = new FormData(form);
    const email = String(formData.get("email")).trim().toLocaleLowerCase("fr");
    const password = String(formData.get("password"));

    try {
      const account = readAccounts().find((savedAccount) => savedAccount.email === email);
      if (!account) {
        showFeedback(feedback, "Aucun compte de démonstration trouvé pour cette adresse. Vous pouvez d'abord en créer un.");
        return;
      }

      const passwordHash = await hashPassword(password, account.passwordSalt);
      if (passwordHash !== account.passwordHash) {
        showFeedback(feedback, "Le mot de passe ne correspond pas à ce compte de démonstration.");
        return;
      }

      setSession(email);
      redirectToDashboard();
    } catch (error) {
      showFeedback(
        feedback,
        error instanceof Error
          ? error.message
          : "Impossible de vérifier ce compte de démonstration dans le navigateur.",
      );
    }
  });
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeStatus(status) {
  const statusClass = status === "Terminée"
    ? "status-badge--done"
    : status === "Acceptée"
      ? "status-badge--accepted"
      : "status-badge--new";
  return makeElement("span", `status-badge ${statusClass}`, status);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function requestCard(request, { professional = false, onStatusChange } = {}) {
  const card = makeElement("article", "dashboard-item");
  const header = makeElement("div", "dashboard-item-header");
  const heading = makeElement("div", "dashboard-item-title");
  heading.append(
    makeElement("h4", "", request.trade),
    makeStatus(request.status),
  );
  header.append(heading);
  if (request.isDemo) {
    header.append(makeElement("span", "sample-badge", "Exemple"));
  }

  const description = makeElement("p", "dashboard-item-description", request.description);
  const meta = makeElement(
    "p",
    "dashboard-item-meta",
    professional
      ? `${request.customerName} · ${request.city} · ${formatDate(request.createdAt)}`
      : `${request.city} · ${formatDate(request.createdAt)}`,
  );
  card.append(header, description, meta);

  if (professional && onStatusChange && request.status !== "Terminée") {
    const actions = makeElement("div", "dashboard-item-actions");
    const nextStatus = request.status === "Nouvelle" ? "Acceptée" : "Terminée";
    const button = makeElement(
      "button",
      "text-button",
      request.status === "Nouvelle" ? "Accepter la demande" : "Marquer comme terminée",
    );
    button.type = "button";
    button.addEventListener("click", () => onStatusChange(request.id, nextStatus));
    actions.append(button);
    card.append(actions);
  }

  return card;
}

function setupClientDashboard(account, workspace) {
  const section = document.querySelector("#client-dashboard");
  section.hidden = false;
  const requestsList = document.querySelector("#client-requests");
  const emptyState = document.querySelector("#client-empty");
  const count = document.querySelector("#client-request-count");
  const feedback = document.querySelector("#request-feedback");
  const form = document.querySelector("#request-form");

  function renderRequests() {
    requestsList.replaceChildren();
    const requests = workspace.requests
      .filter((request) => request.owner === account.email)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    count.textContent = `${requests.length} ${requests.length > 1 ? "demandes" : "demande"}`;
    emptyState.hidden = requests.length > 0;
    requests.forEach((request) => requestsList.append(requestCard(request)));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    feedback.textContent = "";
    const formData = new FormData(form);
    try {
      const accounts = readAccounts();
      const professionals = accounts.filter((candidate) => candidate.role === "professional");
      const trade = String(formData.get("trade")).trim();
      const normalizedTrade = normalizeText(trade);
      const matchingProfessionals = professionals.filter((professional) => {
        const professionalTrade = normalizeText(professional.profile.trade);
        return professionalTrade.includes(normalizedTrade)
          || normalizedTrade.includes(professionalTrade);
      });
      const recipients = matchingProfessionals.length > 0
        ? matchingProfessionals
        : professionals;
      const request = {
        id: createId(),
        owner: account.email,
        trade,
        description: String(formData.get("description")).trim(),
        city: String(formData.get("city")).trim(),
        customerName: account.name,
        assignedTo: recipients.map((professional) => professional.email),
        status: "Nouvelle",
        isDemo: false,
        createdAt: new Date().toISOString(),
      };

      workspace.requests.push(request);
      writeWorkspace(workspace);
      form.reset();
      form.elements.namedItem("city").value = account.profile.city || "Safi";
      showFeedback(feedback, "Votre demande de démonstration a été ajoutée à votre historique.", "success");
      renderRequests();
    } catch (error) {
      showFeedback(
        feedback,
        error instanceof Error ? error.message : "Impossible d'enregistrer cette demande dans le navigateur.",
      );
    }
  });

  renderRequests();
}

function setupProfessionalDashboard(account, workspace) {
  const section = document.querySelector("#professional-dashboard");
  section.hidden = false;
  const servicesList = document.querySelector("#professional-services");
  const servicesEmpty = document.querySelector("#services-empty");
  const requestsList = document.querySelector("#professional-requests");
  const requestsEmpty = document.querySelector("#professional-empty");
  const requestCount = document.querySelector("#professional-request-count");
  const serviceForm = document.querySelector("#service-form");
  const serviceFeedback = document.querySelector("#service-feedback");
  const requestSectionFeedback = document.createElement("p");
  requestSectionFeedback.className = "form-feedback";
  requestSectionFeedback.setAttribute("role", "status");
  requestSectionFeedback.setAttribute("aria-live", "polite");
  requestsList.before(requestSectionFeedback);

  if (!workspace.services.some((service) => service.owner === account.email)) {
    workspace.services.push({
      id: createId(),
      owner: account.email,
      name: account.profile.trade,
      description: account.profile.description,
      price: account.profile.price,
      createdAt: new Date().toISOString(),
    });
    writeWorkspace(workspace);
  }

  function renderServices() {
    servicesList.replaceChildren();
    const services = workspace.services.filter((service) => service.owner === account.email);
    servicesEmpty.hidden = services.length > 0;

    services.forEach((service) => {
      const card = makeElement("article", "dashboard-item dashboard-item--service");
      const header = makeElement("div", "dashboard-item-header");
      header.append(makeElement("h4", "", service.name));
      if (service.price) header.append(makeElement("span", "price-badge", service.price));

      const description = makeElement("p", "dashboard-item-description", service.description);
      const actions = makeElement("div", "dashboard-item-actions");
      const editButton = makeElement("button", "text-button", "Modifier");
      editButton.type = "button";
      editButton.addEventListener("click", () => {
        serviceForm.elements.namedItem("serviceId").value = service.id;
        serviceForm.elements.namedItem("name").value = service.name;
        serviceForm.elements.namedItem("description").value = service.description;
        serviceForm.elements.namedItem("price").value = service.price;
        document.querySelector("#service-submit").textContent = "Enregistrer les modifications";
        document.querySelector("#service-cancel").hidden = false;
        serviceForm.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      const deleteButton = makeElement("button", "text-button text-button--danger", "Supprimer");
      deleteButton.type = "button";
      deleteButton.addEventListener("click", () => {
        workspace.services = workspace.services.filter((item) => item.id !== service.id);
        try {
          writeWorkspace(workspace);
          renderServices();
        } catch (error) {
          showFeedback(
            serviceFeedback,
            error instanceof Error ? error.message : "Impossible de modifier les prestations locales.",
          );
        }
      });

      actions.append(editButton, deleteButton);
      card.append(header, description, actions);
      servicesList.append(card);
    });
  }

  function renderRequests() {
    requestsList.replaceChildren();
    const requests = workspace.requests
      .filter((request) => request.owner === account.email || request.assignedTo?.includes(account.email))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    requestCount.textContent = `${requests.length} ${requests.length > 1 ? "demandes" : "demande"}`;
    requestsEmpty.hidden = requests.length > 0;
    requests.forEach((request) => {
      requestsList.append(requestCard(request, {
        professional: true,
        onStatusChange: (requestId, status) => {
          const currentRequest = workspace.requests.find((item) => item.id === requestId);
          if (!currentRequest) return;

          currentRequest.status = status;
          try {
            writeWorkspace(workspace);
            requestSectionFeedback.textContent = `Demande mise à jour : ${status.toLocaleLowerCase("fr")}.`;
            requestSectionFeedback.dataset.state = "success";
            renderRequests();
          } catch (error) {
            showFeedback(
              requestSectionFeedback,
              error instanceof Error ? error.message : "Impossible de modifier cette demande locale.",
            );
          }
        },
      }));
    });
  }

  document.querySelector("#service-cancel").addEventListener("click", () => {
    serviceForm.reset();
    serviceForm.elements.namedItem("serviceId").value = "";
    document.querySelector("#service-submit").textContent = "Ajouter la prestation";
    document.querySelector("#service-cancel").hidden = true;
    serviceFeedback.textContent = "";
  });

  serviceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    serviceFeedback.textContent = "";
    const formData = new FormData(serviceForm);
    const serviceId = String(formData.get("serviceId"));
    const existing = workspace.services.find(
      (service) => service.id === serviceId && service.owner === account.email,
    );

    if (serviceId && !existing) {
      showFeedback(serviceFeedback, "Cette prestation n'existe plus dans les données locales. Actualisez la page puis réessayez.");
      return;
    }

    const service = {
      id: existing?.id ?? createId(),
      owner: account.email,
      name: String(formData.get("name")).trim(),
      description: String(formData.get("description")).trim(),
      price: String(formData.get("price")).trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      workspace.services = workspace.services.map((item) => item.id === existing.id ? service : item);
    } else {
      workspace.services.push(service);
    }

    try {
      writeWorkspace(workspace);
      serviceForm.reset();
      document.querySelector("#service-submit").textContent = "Ajouter la prestation";
      document.querySelector("#service-cancel").hidden = true;
      showFeedback(
        serviceFeedback,
        existing ? "Prestation de démonstration modifiée." : "Prestation de démonstration ajoutée.",
        "success",
      );
      renderServices();
    } catch (error) {
      showFeedback(
        serviceFeedback,
        error instanceof Error ? error.message : "Impossible d'enregistrer cette prestation dans le navigateur.",
      );
    }
  });

  renderServices();
  renderRequests();
}

function setupDashboard() {
  let account;
  try {
    account = getCurrentAccount();
  } catch (error) {
    const notice = document.querySelector(".dashboard-notice");
    showFeedback(
      notice.querySelector("p"),
      error instanceof Error ? error.message : "Impossible de lire les données locales du compte.",
    );
    return;
  }

  if (!account) {
    window.location.replace("connexion.html");
    return;
  }

  const isProfessional = account.role === "professional";
  document.querySelector("#dashboard-title").textContent = `Bonjour, ${account.name} !`;
  document.querySelector("#dashboard-subtitle").textContent = isProfessional
    ? "Suivez vos prestations et les demandes des habitants de Safi."
    : "Retrouvez vos demandes et décrivez votre prochain besoin.";
  document.querySelector("#dashboard-role").textContent = isProfessional
    ? "Professionnel"
    : "Client";
  document.querySelector("#profile-name").textContent = account.name;
  document.querySelector("#profile-detail").textContent = account.email;
  document.querySelector("#profile-avatar").textContent = account.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("fr");
  document.querySelector("#profile-city").textContent = isProfessional
    ? `${account.profile.trade} · ${account.profile.city}`
    : account.profile.city || "Safi, Maroc";

  document.querySelector("#logout-button").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    window.location.href = "index.html";
  });

  try {
    const workspace = readWorkspace();
    if (isProfessional) {
      setupProfessionalDashboard(account, workspace);
    } else {
      setupClientDashboard(account, workspace);
    }
  } catch (error) {
    const notice = document.querySelector(".dashboard-notice");
    showFeedback(
      notice.querySelector("p"),
      error instanceof Error ? error.message : "Impossible de charger les données locales.",
    );
  }
}

if (page === "signup") setupSignup();
if (page === "login") setupLogin();
if (page === "dashboard") setupDashboard();

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONVERSATION_LENGTH = 12_000;
const MAX_OUTPUT_TOKENS = 600;

const PROXIBOT_INSTRUCTIONS = [
  "Tu es ProxiBot, l'assistant de la plateforme ProxiService, qui met en relation les habitants et les professionnels locaux à Safi, au Maroc.",
  "Réponds dans la langue de la personne : français, arabe, anglais ou darija marocaine. Pour la darija, utilise une formulation naturelle et respecte de préférence l'alphabet employé par la personne.",
  "Aide à comprendre les services de la plateforme, à préciser un besoin et à utiliser la recherche de professionnels.",
  "Tu n'as pas accès à l'annuaire, aux comptes, aux demandes, aux tarifs ni aux disponibilités en temps réel. N'invente jamais de professionnel, de coordonnées, de tarif, de disponibilité ou de fonctionnalité. Invite la personne à consulter l'annuaire du site pour vérifier les informations actuelles.",
  "Tu peux donner des conseils généraux et des recommandations pratiques, sans les présenter comme un avis professionnel certifié. En cas d'urgence ou de danger, conseille de contacter les services compétents.",
  "Ne demande jamais de mot de passe, de clé API, de code de connexion ni de donnée bancaire. Ne prétends pas effectuer une réservation, contacter un professionnel ou modifier une demande.",
].join("\n");

export function validateChatMessages(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Le corps de la requête doit être un objet JSON." };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { error: "Le champ messages doit contenir au moins un message." };
  }

  if (body.messages.length > MAX_MESSAGES) {
    return { error: `La conversation ne peut pas dépasser ${MAX_MESSAGES} messages.` };
  }

  let totalLength = 0;
  const messages = [];
  for (const message of body.messages) {
    if (
      !message
      || typeof message !== "object"
      || !["user", "assistant"].includes(message.role)
      || typeof message.content !== "string"
    ) {
      return { error: "Chaque message doit contenir un rôle user ou assistant et un texte." };
    }

    const content = message.content.trim();
    if (!content) {
      return { error: "Les messages ne peuvent pas être vides." };
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { error: `Chaque message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` };
    }

    totalLength += content.length;
    if (totalLength > MAX_CONVERSATION_LENGTH) {
      return { error: `La conversation ne peut pas dépasser ${MAX_CONVERSATION_LENGTH} caractères.` };
    }

    messages.push({ role: message.role, content });
  }

  if (messages.at(-1).role !== "user") {
    return { error: "Le dernier message doit être un message user." };
  }

  return { messages };
}

export function createChatService(provider, model) {
  return {
    reply(messages) {
      return provider.generateResponse({
        model,
        instructions: PROXIBOT_INSTRUCTIONS,
        input: messages,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
    },
  };
}

import { client } from "./client.js";

export async function triage(ticket) {
  return client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    system: "You are a support triage assistant. Classify the ticket into one of the following categories and draft a reply. Be concise, be accurate, and never promise a refund. Always ask for an order number when one is missing from the message body. Escalate anything mentioning legal action immediately.",
    messages: [{ role: "user", content: ticket }],
  });
}

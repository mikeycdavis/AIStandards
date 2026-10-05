import fs from "node:fs";
import { client } from "./client.js";

const SYSTEM = fs.readFileSync("prompts/triage.prompt.md", "utf8");

export async function triage(ticket) {
  return client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    system: SYSTEM,
    messages: [{ role: "user", content: ticket }],
  });
}

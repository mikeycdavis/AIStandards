<!-- AISTANDARDS-SCAFFOLD: this file is a template, not evidence. A person must answer each section; remove this comment only when they have. -->

# AI system description: REPLACE-ME

This is the narrative companion to `ai-system.yml`. The manifest is the structured declaration; this
document says what the manifest cannot. Answer each question from what you know. Where you do not
know, write "unknown" and say who could find out. An honest gap is worth more than a guess.

## Purpose and users

- What is the system for, in one paragraph? REPLACE-ME
- Who uses it, and who is affected by what it does without being a user? REPLACE-ME
- What is it explicitly not for? REPLACE-ME

## Ownership

- Who answers for the system? REPLACE-ME
- Who is the contact when it misbehaves? REPLACE-ME

## Models

- Which models does the system invoke, and for what role each? Keep this consistent with `models` in
  `ai-system.yml`. REPLACE-ME
- Is each model identifier pinned to a version, or does it name a moving alias? REPLACE-ME
- What happens when a provider retires or changes a model you use? REPLACE-ME

## Prompts and instructions

- Where do the system's instructions live in the repository, and are they versioned there? REPLACE-ME
- What is the trust boundary between instructions and content the system reads? REPLACE-ME

## Tools and authority

- Which tools can the system invoke? Each one declared in the manifest must be classified in
  `tool-permissions.yml`. REPLACE-ME
- What can the system do without a human acting? REPLACE-ME
- How does a human stop it, and who is allowed to? REPLACE-ME

## Data

- What data does the system read, retrieve, or learn from? Name each source and where it comes from.
  A `dataSources` entry has a `kind` of `retrieval-index`, `fine-tuning-set`, `evaluation-set`,
  `prompt-fixture` or `other`. REPLACE-ME
- Which of those sources could contain information about identifiable people? REPLACE-ME

## Lifecycle

- Where is the system in its life, and what would move it to the next stage? REPLACE-ME
- How will it be retired, and who decides? REPLACE-ME

## Evaluation

- Where is the evaluation plan, and how is the evaluation suite run? See `EVALUATION-PLAN.md`. REPLACE-ME

## What is not established

List everything above you could not answer, and what would settle it. REPLACE-ME

<!-- AISTANDARDS-SCAFFOLD: this file is a template, not evidence. A person must answer each section; remove this comment only when they have. -->

# Evaluation plan: REPLACE-ME

Write this before the evaluation run it governs. No schema in this release governs a plan's form;
Standard 17 (Evaluation Plans for Generative Systems, in the AIStandards pack) records that, and this
template is only a prompt for what a plan usually needs to say. It does not restate what any other
standard requires. If you use it, edit it to fit the system.

The manifest can point at three things, all optional, under `evaluation`: `evaluation.planPath`
(where this document lives), `evaluation.suiteCommand` (the command that runs the evaluation suite)
and `evaluation.baselinePath` (where the prior version's results are recorded). Declare them only
when the file or command exists.

## Question being answered

- What decision will the results inform? REPLACE-ME
- What would count as a failure, decided before looking at results? REPLACE-ME

## Subject under evaluation

- Which system version, model identifier, prompts and configuration are being evaluated? REPLACE-ME

## Data

- What cases are used, where do they come from, and who wrote them? REPLACE-ME
- Are any cases held out from tuning, and how is that kept true? REPLACE-ME
- Could any case contain information about identifiable people? REPLACE-ME

## Method

- How is each case run, and how is each output judged (exact match, human review, another model)?
  REPLACE-ME
- If a model or person judges outputs, how was the judge itself checked? REPLACE-ME
- How many runs, and how is variation between runs handled? REPLACE-ME

## Comparison

- What is the baseline, and where is its result recorded? REPLACE-ME

## Reporting

- Where will results be recorded, and by whom? Every reported result must come from a run that
  happened. REPLACE-ME
- What will be reported if results are poor or incomplete? REPLACE-ME

## Limits

- What can this evaluation not tell you? REPLACE-ME

Create a repository of practical, machine-checkable AI engineering standards modeled on the existing EngineeringStandards repository.
The repository should define how AI systems are designed, built, evaluated, deployed, monitored, governed, and retired. Cover areas including:

* AI safety, misuse prevention, and human oversight
* Data privacy, provenance, consent, retention, and access control
* Model evaluation, benchmark integrity, robustness, and regression testing
* Prompt, tool, agent, and retrieval security
* Hallucination, uncertainty, citation, and capability honesty
* Reproducibility, versioning, model/data lineage, and rollback
* Observability, incident response, red teaming, and auditability
* Accessibility, fairness, transparency, and user disclosure
* Cost, latency, environmental impact, and operational resilience
* Approval gates for high-impact, destructive, autonomous, or externally visible actions

Use one numbered normative document per standard. Each standard must clearly state:

1. Scope and applicability
2. Normative requirements using MUST, MUST NOT, SHOULD, and MAY
3. Rationale and failure modes
4. Evidence required to demonstrate compliance
5. Automated, manual-review, or not-evaluable validation type
6. Severity and non-exemptibility
7. Minimum tests and falsifiers
8. Exceptions, attestations, expiry, and review-staleness rules
9. Related standards and ADRs

Also create:

* A versioned machine-readable policy schema
* A policy file selecting applicable standards and levels
* `audit` for evidence discovery
* `validate` for policy-aware compliance verdicts
* A clear distinction between passed, failed, warning, skipped, not-evaluated, and prohibited-but-unestablished
* Templates for AI system manifests, threat models, evaluation plans, incident reports, ADRs, and agent instructions
* Local and containerized CI with pinned dependencies and reproducible exact-revision checks
* Tests for every detector, including negative controls, mutation tests, stale-attestation tests, and tests proving that unavailable evidence never becomes a false pass
* Documentation explaining adoption, reconstruction of existing AI systems, governance roles, review ownership, and release criteria

Do not invent historical intent, test results, approvals, reviewers, model capabilities, or compliance evidence. Preserve uncertainty explicitly. Never weaken a test, policy, standard, or evidence requirement merely to make a gate pass.
Before implementing anything, inspect the repository and produce a proposed structure, standards catalog, validation architecture, adoption workflow, ADR list, and phased implementation plan. Mark every claim as observed, inferred, confirmed by owner, or unknown.
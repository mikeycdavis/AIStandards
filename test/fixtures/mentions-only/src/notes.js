// Do not use BLOCK_NONE here. A previous revision set safetySettings to BLOCK_NONE and it
// took three weeks to notice. See README.md.
// Also avoid model: "claude-sonnet-latest" - pin the dated identifier instead.
export const SAFE = true;

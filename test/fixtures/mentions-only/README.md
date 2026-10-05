# Security notes

Never set `threshold: "BLOCK_NONE"` in production; it disables the provider safety filter.
Avoid floating aliases such as `claude-sonnet-latest` because they re-point without notice.
Do not pass a long `system:` string inline at the call site; keep prompts in files.

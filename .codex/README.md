# Development configuration reference

Keywords: Codex, MCP, SocratiCode, codebase index, incremental update, RAG,
Qdrant, Ollama, nomic-embed-text, Windows, local development.

`config.toml` is the original workstation reference. Its Node executable,
SocratiCode entry point and working directory are absolute paths for that
workstation; teammates must adapt them to their own checkout/runtime before use.
It contains localhost service addresses, not a shared hosted service. Do not
commit credentials or private service URLs when adapting it.

See [local RAG setup](../docs/local-rag.md) for prerequisites, commands and index
scope. This commit does not install tools, download models or change the running
MCP connection.

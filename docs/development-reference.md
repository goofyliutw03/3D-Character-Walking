# v02 development reference

目前 3D 知識與架構總入口（2026-11-08）：[3D 基礎知識與專案架構指南](3d-knowledge-architecture.md)。
包含原 [2A-1]～[2A-8] 主題索引、名詞中英對照、逐幀流程、目前程式位置與驗證限制；
下列 tag 為歷史快照，不能代表工作樹中的 Needle、多場景及新輸入功能已包含在該 tag。

Development branch: `codex/v02-particle-system`.
Annotated Git tag: `dev/v02-water-lighting-inspector`.

Keywords: particle-system, Caster, Target, waterfall-spray, wet-lens, camera-mist,
night-lighting, object-light-pool, scene-object-inspector, object-tree,
stable-object-id, regex-filter, range-filter, camera-obstruction, xray,
mobile-orbit, TypeScript, Three.js, Vite, pnpm, WebGL2, Codex, MCP, SocratiCode,
RAG, Qdrant, Ollama, VS Code, Windows, incremental-release.

## Entry points

| Topic | Reference |
|---|---|
| 3D foundations and current architecture | [繁體中文知識指南](3d-knowledge-architecture.md) |
| Viewer setup and controls | [README](../README.md) |
| Water, spray and wet lens API | [Water API](water-api.md) |
| Reusable object lighting API | [Lighting API](lighting-api.md) |
| Object tree, labels and filters | [Inspector validation](../.kiro/specs/scene-object-inspector/validation.md) |
| Feature scope and pending acceptance | [Roadmap](../.kiro/steering/roadmap.md), [remaining acceptance](remaining-acceptance.md) |
| Local code search and indexing | [RAG setup](local-rag.md), [Codex reference](../.codex/README.md) |
| Editor workstation reference | [VS Code reference](../.vscode/README.md) |
| Tests, build and incremental publishing | [Release process](release.md) |

The workstation configuration files are preserved as supplied, with no secrets
found during this publication check. Their absolute paths are not portable;
read the directory notes before adapting them. ESP-IDF is not required by this
project. No source, dependencies or local service data are copied to Release.

This tag identifies a development snapshot, not completion of all physical
device, folding-screen or cross-GPU acceptance. See the linked validation
records for evidence and limits.

To inspect the snapshot after fetching tags:

```sh
git show dev/v02-water-lighting-inspector
git log --oneline dev/v02-water-lighting-inspector
```

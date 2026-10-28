---
name: implementar-fluxo-dms
description: "Implementa ou ajusta um fluxo do DMS entre API Express e interface React, com testes de regressão."
argument-hint: "Descreva o comportamento esperado para o fluxo"
agent: agent
---

# Implementar fluxo do DMS

Implemente o fluxo descrito: `${input:fluxo:descreva o comportamento esperado}`.

Antes de editar, leia `.github/copilot-instructions.md`, `docs/specs/dms-spec.md` quando existir e o código próximo ao fluxo solicitado. Preserve alterações locais não relacionadas.

## Diretrizes

- No backend, mantenha o fluxo `routes -> controllers -> services -> repositories`; cada camada depende somente da camada interna seguinte.
- Preserve Express/CommonJS, JavaScript sem TypeScript e o runner nativo `node:test`.
- Mantenha os arquivos enviados no filesystem local via Multer `diskStorage` e os metadados em memória. Não adicione armazenamento externo.
- No frontend, use componentes funcionais com Hooks e o cliente `fetch` existente pelo prefixo `/api`; reutilize os componentes e serviços já disponíveis.
- Inclua estados de carregamento, vazio e erro, além de rótulos e interação por teclado adequados nos controles afetados.
- Trate erros nos limites HTTP e filesystem com respostas consistentes, sem expor caminhos internos ou detalhes sensíveis.
- Para nomes de arquivos, preserve UTF-8 no upload e use `Content-Disposition` compatível com Unicode no download.
- Evite dependências novas, abstrações não necessárias e alterações fora do fluxo solicitado.

## Validação

- Adicione ou atualize testes de regressão próximos ao comportamento, usando os padrões existentes.
- Execute `cd backend && npm test` quando houver alterações no backend.
- Execute `cd frontend && npm run build` quando houver alterações no frontend.
- Ao concluir, resuma o comportamento implementado, os arquivos alterados e os comandos de validação executados.

## Referência adaptada

Este prompt adapta princípios do agente [Expert React Frontend Engineer](https://github.com/github/awesome-copilot/blob/main/agents/expert-react-frontend-engineer.agent.md), especialmente componentes funcionais, acessibilidade, estados explícitos e testes. As orientações foram restringidas ao React + Vite e aos padrões JavaScript deste repositório; recomendações específicas de Next.js, TypeScript ou bibliotecas não instaladas não se aplicam.
# Especificação — Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos armazenados no filesystem local da aplicação, mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Associação simples do documento a um identificador de usuário.
- Listagem dos documentos associados ao usuário informado.
- Download de um documento pelo identificador, limitado ao usuário associado.
- Armazenamento local com `multer` e `diskStorage`.
- Metadados mantidos em memória durante a execução do processo.
- Interface web para upload, listagem e download.

### Fora do escopo

- Autenticação ou gestão de contas.
- Armazenamento externo ou em nuvem.
- Persistência de metadados em banco de dados.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Busca, categorias ou pastas.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo no campo `file` de uma requisição `multipart/form-data`. |
| RF-02 | O sistema deve associar o documento ao identificador recebido no cabeçalho `X-User-Id`. |
| RF-03 | O upload deve responder com os metadados públicos do documento e status `201`. |
| RF-04 | A listagem deve retornar somente documentos associados ao `X-User-Id` informado. |
| RF-05 | O download deve permitir acesso somente quando o documento pertencer ao `X-User-Id` informado. |
| RF-06 | O sistema deve rejeitar identificador de usuário ausente ou vazio e requisição de upload sem arquivo. |
| RF-07 | O sistema deve rejeitar arquivos acima do limite configurado. |
| RF-08 | Erros da API devem usar status HTTP apropriado e corpo JSON com `error.code` e `error.message`. |
| RF-09 | A interface deve permitir enviar, listar e baixar documentos e apresentar estados de carregamento, vazio, sucesso e erro. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local usando `multer` com `diskStorage`; não usar serviços externos. |
| RNF-02 | O diretório padrão é `backend/storage`, configurável pela variável `STORAGE_DIR`. |
| RNF-03 | Os metadados permanecem em memória e são perdidos ao reiniciar o backend. |
| RNF-04 | O backend deve seguir `routes -> controllers -> services -> repositories`, sem lógica de negócio nas rotas. |
| RNF-05 | O backend usa Node.js, Express e CommonJS; os testes usam `node:test`. |
| RNF-06 | O frontend usa React, componentes funcionais e `fetch` pelo prefixo `/api`, encaminhado pelo proxy do Vite. |
| RNF-07 | `PORT`, `STORAGE_DIR` e `UPLOAD_MAX_FILE_SIZE_BYTES` devem ser configuráveis por ambiente. |
| RNF-08 | O limite padrão de upload é 10 MiB (`10485760` bytes). |
| RNF-09 | O nome de armazenamento deve ser gerado pelo servidor; caminhos físicos não são expostos pela API. |
| RNF-10 | O identificador `X-User-Id` é uma convenção funcional, não autenticação segura. |

## 5. Modelo de dados

Os metadados são guardados em memória. `storageName` é interno e nunca deve ser retornado pela API.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string (UUID) | Identificador único do documento. |
| `originalName` | string | Nome original fornecido no upload. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Data e hora do upload. |
| `owner` | string | Valor validado do cabeçalho `X-User-Id`. |
| `mimeType` | string | Tipo MIME informado pelo cliente, usado como metadado. |
| `storageName` | string | Nome UUID do arquivo no diretório local; campo interno. |

O caminho de armazenamento é resolvido no repositório a partir do diretório configurado e do `storageName`. O nome original não deve ser usado como caminho.

## 6. Contratos de API

As rotas são registradas diretamente no backend. No frontend, `/api` é removido pelo proxy do Vite antes do encaminhamento.

Formato dos erros:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### `POST /upload`

- Cabeçalho obrigatório: `X-User-Id`.
- Corpo: `multipart/form-data`, um arquivo no campo `file`.
- Sucesso: `201 Created` e metadados públicos (`id`, `originalName`, `size`, `uploadedAt`, `owner`, `mimeType`).
- Erros: `400` para usuário ou arquivo ausente e upload inválido; `413` para arquivo acima do limite; `500` para falha inesperada de armazenamento.

### `GET /documents`

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK` com lista de metadados públicos; lista vazia quando o usuário não tem documentos.
- Erros: `400` para usuário ausente/vazio; `500` para falha inesperada.

### `GET /documents/:id/download`

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário como anexo e nome original no `Content-Disposition`.
- Erros: `400` para usuário ausente/vazio; `404` para documento inexistente, de outro usuário ou indisponível no disco; `500` para falha inesperada.
- Não revelar se um documento existe para outro usuário: usar o mesmo `404` para documento inexistente e não pertencente ao solicitante.

## 7. Decisões arquiteturais

- `routes` registram os endpoints, validam a presença do usuário e aplicam o middleware de upload.
- `controllers` traduzem HTTP para chamadas de serviço e resultados para respostas HTTP.
- `services` aplicam as regras de associação, listagem e autorização do download.
- `repositories` isolam metadados em memória e acesso aos arquivos locais.
- `multer` com `diskStorage` grava em `backend/storage` por padrão, usando nome interno gerado pelo servidor.
- O frontend usa `fetch` com `X-User-Id`; o identificador escolhido fica armazenado localmente no navegador.
- A associação por cabeçalho não substitui autenticação. Não expor a aplicação como multiusuário segura sem adicionar autenticação confiável.

## 8. Plano de execução

1. **Especificar o produto**: registrar escopo, requisitos, modelo de dados, contratos e critérios neste documento. Aceite: especificação revisável sem detalhar alterações por arquivo.
2. **Implementar a API**: construir as camadas da API, upload local, metadados em memória, listagem, download e tratamento de erros. Aceite: contratos atendidos e `cd backend && npm test` aprovado.
3. **Implementar a interface**: criar os fluxos de upload, seleção do usuário, listagem e download pelo proxy `/api`. Aceite: build Vite aprovado e estados principais disponíveis.
4. **Validar a integração**: executar frontend e backend juntos e verificar upload, isolamento por usuário e download. Aceite: o arquivo enviado aparece na lista do usuário correto e pode ser baixado; outro identificador recebe lista vazia e `404` no download.

## 9. Limitações e riscos

- Reiniciar o backend elimina os metadados em memória; arquivos podem permanecer no disco sem registro.
- `X-User-Id` pode ser escolhido ou falsificado pelo cliente e não identifica uma pessoa autenticada.
- O MIME enviado pelo cliente não é validação de segurança.
- Falhas de permissão, espaço ou leitura do disco podem interromper upload e download; detalhes internos não devem ser expostos.
- O limite padrão de 10 MiB pode ser ajustado por configuração de ambiente.
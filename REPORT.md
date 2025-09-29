# RELATÓRIO TÉCNICO — Loja Escolar (NEO)

## 1. Objetivo
Implementar um **Sistema de Vendas - Loja Escolar** com frontend em HTML/CSS/JS e backend em **FastAPI** (Python) com **SQLite**, contemplando CRUD de produtos e fluxo de compra, tema preto + ciano e carrinho lateral.

## 2. Arquitetura
- **Frontend:** HTML sem build, CSS próprio, JavaScript vanilla. Comunicação com API por `fetch` (JSON).
- **Backend:** FastAPI, SQLAlchemy, Pydantic; banco SQLite local (`backend/loja.db`). Swagger em `/docs`.
- **Integração:** Endpoints REST:
  - `GET /produtos` (filtros `search`, `categoria`, `sort`)
  - `POST /produtos`
  - `PUT /produtos/{id}`
  - `DELETE /produtos/{id}`
  - `POST /carrinho/confirmar` (aplica cupom `ALUNO10` e baixa estoque)

## 3. Modelo de Dados (Produto)
- `id` (int, PK)
- `nome` (str, obrigatório)
- `descricao` (str, opcional)
- `preco` (float, > 0)
- `estoque` (int, ≥ 0)
- `categoria` (str) — material-escolar, livros, uniformes, tecnologia
- `sku` (str, opcional)

## 4. Pontos de UX/Detalhes
- Tema preto + ciano com toggle claro/escuro persistente.
- Toasts de feedback e loading global.
- Acessibilidade básica (labels, aria, foco).
- Atalhos: `Ctrl+K` (foco busca), `Alt+N` (abrir Admin), `Esc` (fechar modais).
- Carrinho salvo no `localStorage`.

## 5. Como testar
1. Rodar API (`uvicorn app:app --reload`).
2. Abrir `frontend/index.html`.
3. Adicionar itens ao carrinho, aplicar cupom `ALUNO10` (10%), finalizar pedido. Verificar estoque baixando.
4. Cadastrar/editar/excluir produtos pelo modal Admin.
5. Buscar e ordenar para validar filtros.

## 6. Screenshots (adicione no envio final)
- Lista de produtos
- Modal Carrinho
- Modal Admin
- Tema escuro (preto + ciano)

## 7. IA e prompts
- Implementação auxiliada por IA para estrutura e CSS/JS base.
- Ajustes manuais para integração com FastAPI e SQLite.

## 8. Melhorias futuras
- Autenticação (admin).
- Upload de imagens reais dos produtos.
- Testes automatizados.
- Paginação server-side e cache.

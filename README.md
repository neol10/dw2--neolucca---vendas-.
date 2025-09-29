# Loja Escolar • Sistema de Vendas (NEO)

Tema preto + ciano (estilo tech/gamer), Frontend (HTML/CSS/JS) e Backend (FastAPI + SQLite).

## Como rodar

### 1) Backend (API)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt

# criar/atualizar banco e popular com dados (10 por categoria, slugs)
python seed.py

# iniciar a API
uvicorn app:app --reload

Documentação Swagger/OpenAPI: http://127.0.0.1:8000/docs
```
A API iniciará em: http://127.0.0.1:8000

### 2) Frontend
Abra o arquivo `frontend/index.html` no navegador (duplo clique) **ou** sirva com uma extensão tipo *Live Server* no VS Code.

> O frontend espera a API em `http://127.0.0.1:8000`. Ajuste `API_BASE_URL` em `frontend/scripts.js` se necessário.

## Funcionalidades
- Lista de produtos (grid), busca, filtro por categoria, ordenação e paginação.
- Carrinho lateral (drawer) com subtotal, cupom `ALUNO10` (10%) e total; persiste em `localStorage`.
- CRUD de produtos (modal Admin): criar, editar e excluir.
- Tema preto + ciano (toggle claro/escuro), toasts, loading, atalhos (Ctrl+K busca, Alt+N admin, Esc fecha).
- Validações e feedbacks de UI.

## Estrutura
```
frontend/
  index.html
  styles.css
  scripts.js
backend/
  app.py
  models.py
  database.py
  seed.py
  requirements.txt
README.md
REPORT.md
```

# Loja Escolar • Sistema de Vendas (NEO)

Projeto bimestral (2TIA) — Frontend (HTML/CSS/JS) + Backend (FastAPI + SQLite).

## Como rodar

### 1) Backend (API)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt

# criar/atualizar banco e popular com dados
python seed.py

# iniciar a API
uvicorn app:app --reload
```
A API iniciará em: http://127.0.0.1:8000

### 2) Frontend
Abra o arquivo `frontend/index.html` no navegador (duplo clique) **ou** sirva com uma extensão tipo *Live Server* no VS Code.

> O frontend espera a API em `http://127.0.0.1:8000`. Ajuste em `frontend/scripts.js` se necessário.

## Funcionalidades
- Lista de produtos, filtro por categoria, busca, ordenação e paginação.
- Carrinho com resumo (subtotal, cupom `ALUNO10`, total) e persistência em `localStorage`.
- CRUD de produtos pelo modal Admin (criar, editar e excluir).
- Tema claro/escuro, toasts, loading, atalhos de teclado (Ctrl+K busca, Alt+N admin).
- Validações básicas no formulário.

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

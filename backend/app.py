from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from typing import List

from database import Base, engine, get_db
from models import Produto, Pedido, PedidoItem
from schemas import ProdutoCreate, ProdutoUpdate, ProdutoOut, PaginatedProdutos, ConfirmarCarrinhoIn, PedidoOut, PedidoItemOut
from sqlalchemy import text

app = FastAPI(title="Loja Escolar API", version="1.0.0")

# CORS para o frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# cria tabelas e migrações simples
Base.metadata.create_all(bind=engine)

# Migração simples: adicionar coluna imagem_url se não existir (SQLite)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE produtos ADD COLUMN imagem_url VARCHAR(300)"))
    except Exception:
        # coluna já existe ou outro motivo; ignorar silenciosamente
        pass

@app.get("/health")
def health():
    return {"status": "ok"}

# -------- Produtos --------
# Nota: alteramos o contrato para paginação: retorna dict com items/total/page/page_size
@app.get("/produtos", response_model=PaginatedProdutos)
def list_produtos(
    search: str = Query(default=""),
    categoria: str | None = Query(default=None),
    sort: str | None = Query(default=None), # "preco_asc", "preco_desc", "nome", "nome_asc", "nome_desc", "estoque_asc", "estoque_desc"
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Produto)

    if search:
        like = f"%{search}%"
        stmt = stmt.where(Produto.nome.ilike(like))

    if categoria:
        stmt = stmt.where(Produto.categoria == categoria)

    if sort == "preco_asc":
        stmt = stmt.order_by(Produto.preco.asc())
    elif sort == "preco_desc":
        stmt = stmt.order_by(Produto.preco.desc())
    elif sort in ("nome", "nome_asc"):
        stmt = stmt.order_by(Produto.nome.asc())
    elif sort == "nome_desc":
        stmt = stmt.order_by(Produto.nome.desc())
    elif sort == "estoque_asc":
        stmt = stmt.order_by(Produto.estoque.asc())
    elif sort == "estoque_desc":
        stmt = stmt.order_by(Produto.estoque.desc())
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    offset = (page - 1) * page_size
    items = list(db.scalars(stmt.offset(offset).limit(page_size)).all())
    # Coerce ORM objects into Pydantic models for safe JSON serialization
    items_out = [ProdutoOut.model_validate(i) for i in items]
    return {"items": items_out, "total": total, "page": page, "page_size": page_size}

@app.post("/produtos", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED)
def create_produto(payload: ProdutoCreate, db: Session = Depends(get_db)):
    prod = Produto(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod

@app.put("/produtos/{produto_id}", response_model=ProdutoOut)
def update_produto(produto_id: int, payload: ProdutoUpdate, db: Session = Depends(get_db)):
    prod = db.get(Produto, produto_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    return prod

@app.delete("/produtos/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produto(produto_id: int, db: Session = Depends(get_db)):
    prod = db.get(Produto, produto_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(prod)
    db.commit()
    return None

@app.get("/categorias")
def list_categorias(db: Session = Depends(get_db)):
    rows = db.scalars(select(Produto.categoria).distinct().order_by(Produto.categoria.asc())).all()
    return rows

# -------- Carrinho --------
@app.post("/carrinho/confirmar", response_model=PedidoOut)
def confirmar_carrinho(payload: ConfirmarCarrinhoIn, db: Session = Depends(get_db)):
    if not payload.itens:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    # Carregar produtos e validar estoque
    mapa_produtos: dict[int, Produto] = {}
    subtotal = 0
    itens_out: list[PedidoItemOut] = []
    for item in payload.itens:
        prod = db.get(Produto, item.produto_id)
        if not prod:
            raise HTTPException(status_code=404, detail=f"Produto {item.produto_id} não encontrado")
        if item.quantidade <= 0:
            raise HTTPException(status_code=400, detail="Quantidade inválida")
        if prod.estoque < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {prod.nome}")
        mapa_produtos[item.produto_id] = prod
        subtotal += float(prod.preco) * item.quantidade

    # Cupom 10%
    desconto = 0.0
    cupom = (payload.cupom or '').strip().upper()
    if cupom == 'ALUNO10':
        desconto = round(subtotal * 0.10, 2)
    total = round(subtotal - desconto, 2)

    # Criar pedido e itens; debitar estoque
    pedido = Pedido(cupom=cupom or None, subtotal=subtotal, desconto=desconto, total=total)
    db.add(pedido)
    db.flush()  # get id
    for item in payload.itens:
        prod = mapa_produtos[item.produto_id]
        prod.estoque -= item.quantidade
        pi = PedidoItem(
            pedido_id=pedido.id,
            produto_id=prod.id,
            nome=prod.nome,
            quantidade=item.quantidade,
            preco_unitario=prod.preco,
        )
        db.add(pi)
        itens_out.append(PedidoItemOut(produto_id=prod.id, nome=prod.nome, quantidade=item.quantidade, preco_unitario=prod.preco))
    db.commit()

    return PedidoOut(
        id=pedido.id,
        cupom=pedido.cupom,
        subtotal=pedido.subtotal,
        desconto=pedido.desconto,
        total=pedido.total,
        itens=itens_out,
    )
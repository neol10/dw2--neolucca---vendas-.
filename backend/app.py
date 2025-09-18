from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc
from typing import List, Optional
from datetime import timedelta
from pydantic import BaseModel, Field, EmailStr
from database import Base, engine, get_db
from models import Produto, Usuario
from auth import (
    criar_token, gerar_senha_hash, verificar_senha,
    get_current_user, get_current_active_user, get_current_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(title='Loja Escolar - API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Create tables
Base.metadata.create_all(bind=engine)

# -------- Schemas --------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UsuarioBase(BaseModel):
    email: EmailStr
    nome: str

class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioOut(UsuarioBase):
    id: int
    is_active: bool
    is_admin: bool
    class Config:
        from_attributes = True

class ProdutoIn(BaseModel):
    nome: str = Field(min_length=3)
    descricao: Optional[str] = None
    preco: float = Field(gt=0)
    estoque: int = Field(ge=0)
    categoria: str
    sku: Optional[str] = None

class ProdutoOut(ProdutoIn):
    id: int
    class Config:
        from_attributes = True

class ItemPedido(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)

class PedidoIn(BaseModel):
    cupom: Optional[str] = None
    itens: List[ItemPedido]

# -------- Auth Endpoints --------
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verificar_senha(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = criar_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/usuarios/", response_model=UsuarioOut)
async def criar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    novo_usuario = Usuario(
        email=usuario.email,
        nome=usuario.nome,
        senha_hash=gerar_senha_hash(usuario.senha)
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@app.get("/usuarios/me/", response_model=UsuarioOut)
async def ler_usuarios_me(current_user: Usuario = Depends(get_current_active_user)):
    return current_user

# -------- Endpoints --------
@app.get('/produtos', response_model=List[ProdutoOut])
def listar_produtos(
    search: Optional[str] = None,
    categoria: Optional[str] = None,
    sort: str = Query('nome-asc', pattern='^(nome|preco|estoque)-(asc|desc)$'),
    db: Session = Depends(get_db)
):
    stmt = select(Produto)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(
            (Produto.nome.ilike(like)) |
            (Produto.descricao.ilike(like)) |
            (Produto.sku.ilike(like))
        )
    if categoria:
        stmt = stmt.where(Produto.categoria == categoria)
    key, direction = sort.split('-')
    col = {'nome': Produto.nome, 'preco': Produto.preco, 'estoque': Produto.estoque}[key]
    stmt = stmt.order_by(asc(col) if direction=='asc' else desc(col))
    results = db.execute(stmt).scalars().all()
    return results

@app.post('/produtos', response_model=ProdutoOut, status_code=201)
def criar_produto(data: ProdutoIn, db: Session = Depends(get_db)):
    p = Produto(**data.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return p

@app.put('/produtos/{pid}', response_model=ProdutoOut)
def atualizar_produto(pid: int, data: ProdutoIn, db: Session = Depends(get_db)):
    p = db.get(Produto, pid)
    if not p: raise HTTPException(404, 'Produto não encontrado')
    for k,v in data.model_dump().items(): setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@app.delete('/produtos/{pid}', status_code=204)
def excluir_produto(pid: int, db: Session = Depends(get_db)):
    p = db.get(Produto, pid)
    if not p: raise HTTPException(404, 'Produto não encontrado')
    db.delete(p); db.commit()
    return

@app.post('/carrinho/confirmar')
def confirmar_pedido(pedido: PedidoIn, db: Session = Depends(get_db)):
    # Calcula total e aplica cupom; baixa estoque
    total = 0.0
    for item in pedido.itens:
        p = db.get(Produto, item.produto_id)
        if not p: raise HTTPException(400, f'Produto {item.produto_id} inválido')
        if p.estoque < item.quantidade:
            raise HTTPException(400, f'Estoque insuficiente para {p.nome}')
        total += p.preco * item.quantidade
    desconto = 0.0
    if (pedido.cupom or '').upper() == 'ALUNO10':
        desconto = total * 0.10
    # baixa estoque
    for item in pedido.itens:
        p = db.get(Produto, item.produto_id)
        p.estoque -= item.quantidade
    db.commit()
    return { 'subtotal': total, 'desconto': desconto, 'total': total - desconto, 'itens': len(pedido.itens) }

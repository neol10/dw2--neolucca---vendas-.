from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc, func
from typing import List, Optional
from datetime import timedelta, datetime, date
from pydantic import BaseModel, Field, EmailStr
import csv
import json
import io
from database import Base, engine, get_db
from models import Produto, Usuario, Livro, Turma, Aluno
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

class LivroIn(BaseModel):
    titulo: str = Field(min_length=3)
    autor: str = Field(min_length=3)
    ano: int = Field(ge=1900, le=2030)
    genero: str
    isbn: Optional[str] = None

class LivroOut(LivroIn):
    id: int
    status: str
    data_emprestimo: Optional[datetime] = None
    class Config:
        from_attributes = True

class EmprestimoIn(BaseModel):
    livro_id: int

class TurmaCreate(BaseModel):
    nome: str = Field(min_length=3)
    capacidade: int = Field(gt=0, le=50)

class TurmaOut(TurmaCreate):
    id: int
    total_alunos: int = 0
    class Config:
        from_attributes = True

class AlunoCreate(BaseModel):
    nome: str = Field(min_length=3)
    data_nascimento: date
    email: Optional[str] = None
    turma_id: Optional[int] = None

class AlunoOut(AlunoCreate):
    id: int
    status: str
    turma_nome: Optional[str] = None
    class Config:
        from_attributes = True

class MatriculaIn(BaseModel):
    aluno_id: int
    turma_id: int

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
@app.get('/produtos')
def listar_produtos(
    search: str = '', 
    categoria: str = '', 
    sort: str = 'nome-asc', 
    page: int = 1, 
    per_page: int = 9,
    db: Session = Depends(get_db)
):
    # Validar parâmetros de paginação
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 50:
        per_page = 9
    
    stmt = select(Produto)
    if search:
        like = f'%{search}%'
        stmt = stmt.where(
            (Produto.nome.ilike(like)) |
            (Produto.descricao.ilike(like)) |
            (Produto.sku.ilike(like))
        )
    if categoria:
        stmt = stmt.where(Produto.categoria == categoria)
    
    # Contar total de registros
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar()
    
    # Aplicar ordenação
    key, direction = sort.split('-')
    col = {'nome': Produto.nome, 'preco': Produto.preco, 'estoque': Produto.estoque}[key]
    stmt = stmt.order_by(asc(col) if direction=='asc' else desc(col))
    
    # Aplicar paginação
    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)
    
    results = db.execute(stmt).scalars().all()
    
    # Converter para dict
    items = [ProdutoOut.model_validate(produto).model_dump() for produto in results]
    
    total_pages = (total + per_page - 1) // per_page
    
    return {
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }

@app.post('/produtos', response_model=ProdutoOut, status_code=201)
def criar_produto(data: ProdutoIn, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    # Validações de negócio
    if data.preco <= 0:
        raise HTTPException(400, 'Preço deve ser maior que zero')
    if data.estoque < 0:
        raise HTTPException(400, 'Estoque não pode ser negativo')
    if len(data.nome.strip()) < 3:
        raise HTTPException(400, 'Nome deve ter pelo menos 3 caracteres')
    
    # Verificar se SKU já existe
    existing_sku = db.query(Produto).filter(Produto.sku == data.sku).first()
    if existing_sku:
        raise HTTPException(400, 'SKU já existe')
    
    p = Produto(**data.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return p

@app.put('/produtos/{pid}', response_model=ProdutoOut)
def atualizar_produto(pid: int, data: ProdutoIn, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    p = db.get(Produto, pid)
    if not p: raise HTTPException(404, 'Produto não encontrado')
    
    # Validações de negócio
    if data.preco <= 0:
        raise HTTPException(400, 'Preço deve ser maior que zero')
    if data.estoque < 0:
        raise HTTPException(400, 'Estoque não pode ser negativo')
    if len(data.nome.strip()) < 3:
        raise HTTPException(400, 'Nome deve ter pelo menos 3 caracteres')
    
    # Verificar se SKU já existe (exceto o próprio produto)
    existing_sku = db.query(Produto).filter(Produto.sku == data.sku, Produto.id != pid).first()
    if existing_sku:
        raise HTTPException(400, 'SKU já existe')
    
    for k,v in data.model_dump().items(): setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@app.delete('/produtos/{pid}')
def deletar_produto(pid: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_admin_user)):
    p = db.get(Produto, pid)
    if not p: raise HTTPException(404, 'Produto não encontrado')
    db.delete(p); db.commit()
    return {'message': 'Produto deletado'}

@app.get('/produtos/export/csv')
def exportar_produtos_csv(
    search: str = '', 
    categoria: str = '', 
    sort: str = 'nome-asc',
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    # Buscar produtos com filtros
    stmt = select(Produto)
    if search:
        like = f'%{search}%'
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
    
    produtos = db.execute(stmt).scalars().all()
    
    # Criar CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Nome', 'Descrição', 'Preço', 'Estoque', 'Categoria', 'SKU'])
    
    for produto in produtos:
        writer.writerow([
            produto.id,
            produto.nome,
            produto.descricao or '',
            produto.preco,
            produto.estoque,
            produto.categoria,
            produto.sku or ''
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=produtos.csv'}
    )

@app.get('/produtos/export/json')
def exportar_produtos_json(
    search: str = '', 
    categoria: str = '', 
    sort: str = 'nome-asc',
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    # Buscar produtos com filtros
    stmt = select(Produto)
    if search:
        like = f'%{search}%'
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
    
    produtos = db.execute(stmt).scalars().all()
    
    # Converter para dict
    produtos_data = []
    for produto in produtos:
        produtos_data.append({
            'id': produto.id,
            'nome': produto.nome,
            'descricao': produto.descricao,
            'preco': produto.preco,
            'estoque': produto.estoque,
            'categoria': produto.categoria,
            'sku': produto.sku
        })
    
    json_data = json.dumps(produtos_data, ensure_ascii=False, indent=2)
    
    return StreamingResponse(
        io.BytesIO(json_data.encode('utf-8')),
        media_type='application/json',
        headers={'Content-Disposition': 'attachment; filename=produtos.json'}
    )

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

# -------- Biblioteca Endpoints --------
@app.get('/livros', response_model=List[LivroOut])
def listar_livros(
    search: Optional[str] = None,
    genero: Optional[str] = None,
    status: Optional[str] = None,
    sort: str = Query('titulo-asc', pattern='^(titulo|autor|ano)-(asc|desc)$'),
    db: Session = Depends(get_db)
):
    stmt = select(Livro)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(
            (Livro.titulo.ilike(like)) |
            (Livro.autor.ilike(like)) |
            (Livro.isbn.ilike(like))
        )
    if genero:
        stmt = stmt.where(Livro.genero == genero)
    if status:
        stmt = stmt.where(Livro.status == status)
    key, direction = sort.split('-')
    col = {'titulo': Livro.titulo, 'autor': Livro.autor, 'ano': Livro.ano}[key]
    stmt = stmt.order_by(asc(col) if direction=='asc' else desc(col))
    results = db.execute(stmt).scalars().all()
    return results

@app.post('/livros', response_model=LivroOut, status_code=201)
def criar_livro(data: LivroIn, db: Session = Depends(get_db)):
    l = Livro(**data.model_dump())
    db.add(l); db.commit(); db.refresh(l)
    return l

@app.put('/livros/{lid}', response_model=LivroOut)
def atualizar_livro(lid: int, data: LivroIn, db: Session = Depends(get_db)):
    l = db.get(Livro, lid)
    if not l: raise HTTPException(404, 'Livro não encontrado')
    for k,v in data.model_dump().items(): setattr(l, k, v)
    db.commit(); db.refresh(l)
    return l

@app.delete('/livros/{lid}', status_code=204)
def excluir_livro(lid: int, db: Session = Depends(get_db)):
    l = db.get(Livro, lid)
    if not l: raise HTTPException(404, 'Livro não encontrado')
    db.delete(l); db.commit()
    return

@app.post('/livros/{lid}/emprestar')
def emprestar_livro(lid: int, db: Session = Depends(get_db)):
    l = db.get(Livro, lid)
    if not l: raise HTTPException(404, 'Livro não encontrado')
    if l.status == 'emprestado':
        raise HTTPException(400, 'Livro já está emprestado')
    l.status = 'emprestado'
    l.data_emprestimo = datetime.now()
    db.commit()
    return {'message': f'Livro "{l.titulo}" emprestado com sucesso'}

@app.post('/livros/{lid}/devolver')
def devolver_livro(lid: int, db: Session = Depends(get_db)):
    l = db.get(Livro, lid)
    if not l: raise HTTPException(404, 'Livro não encontrado')
    if l.status == 'disponivel':
        raise HTTPException(400, 'Livro já está disponível')
    l.status = 'disponivel'
    l.data_emprestimo = None
    db.commit()
    return {'message': f'Livro "{l.titulo}" devolvido com sucesso'}

# -------- Escola Endpoints --------
@app.get('/turmas', response_model=List[TurmaOut])
def listar_turmas(
    search: Optional[str] = None,
    sort: str = Query('nome-asc', pattern='^(nome|capacidade)-(asc|desc)$'),
    db: Session = Depends(get_db)
):
    stmt = select(Turma)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(Turma.nome.ilike(like))
    key, direction = sort.split('-')
    col = {'nome': Turma.nome, 'capacidade': Turma.capacidade}[key]
    stmt = stmt.order_by(asc(col) if direction=='asc' else desc(col))
    turmas = db.execute(stmt).scalars().all()
    
    # Adicionar contagem de alunos
    result = []
    for turma in turmas:
        turma_dict = {
            'id': turma.id,
            'nome': turma.nome,
            'capacidade': turma.capacidade,
            'total_alunos': len(turma.alunos)
        }
        result.append(TurmaOut(**turma_dict))
    return result

@app.post("/turmas", response_model=TurmaOut)
async def criar_turma(turma: TurmaCreate, current_user: Usuario = Depends(get_current_admin_user)):
    # Validações de negócio
    if turma.capacidade <= 0:
        raise HTTPException(400, 'Capacidade deve ser maior que zero')
    if turma.capacidade > 50:
        raise HTTPException(400, 'Capacidade máxima é 50 alunos')
    if len(turma.nome.strip()) < 3:
        raise HTTPException(400, 'Nome deve ter pelo menos 3 caracteres')
    
    # Verificar se nome da turma já existe
    existing_turma = db.query(Turma).filter(Turma.nome == turma.nome).first()
    if existing_turma:
        raise HTTPException(400, 'Já existe uma turma com este nome')
    
    db_turma = Turma(**turma.dict())
    db.add(db_turma)
    db.commit()
    db.refresh(db_turma)
    return TurmaOut(id=db_turma.id, nome=db_turma.nome, capacidade=db_turma.capacidade, total_alunos=0)

@app.put('/turmas/{tid}', response_model=TurmaOut)
def atualizar_turma(tid: int, data: TurmaCreate, db: Session = Depends(get_db)):
    t = db.get(Turma, tid)
    if not t: raise HTTPException(404, 'Turma não encontrada')
    for k,v in data.model_dump().items(): setattr(t, k, v)
    db.commit(); db.refresh(t)
    return TurmaOut(id=t.id, nome=t.nome, capacidade=t.capacidade, total_alunos=len(t.alunos))

@app.delete('/turmas/{tid}', status_code=204)
def excluir_turma(tid: int, db: Session = Depends(get_db)):
    t = db.get(Turma, tid)
    if not t: raise HTTPException(404, 'Turma não encontrada')
    if len(t.alunos) > 0:
        raise HTTPException(400, 'Não é possível excluir turma com alunos matriculados')
    db.delete(t); db.commit()
    return

@app.get('/alunos', response_model=List[AlunoOut])
def listar_alunos(
    search: Optional[str] = None,
    turma_id: Optional[int] = None,
    status: Optional[str] = None,
    sort: str = Query('nome-asc', pattern='^(nome|data_nascimento)-(asc|desc)$'),
    db: Session = Depends(get_db)
):
    stmt = select(Aluno)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(Aluno.nome.ilike(like))
    if turma_id:
        stmt = stmt.where(Aluno.turma_id == turma_id)
    if status:
        stmt = stmt.where(Aluno.status == status)
    key, direction = sort.split('-')
    col = {'nome': Aluno.nome, 'data_nascimento': Aluno.data_nascimento}[key]
    stmt = stmt.order_by(asc(col) if direction=='asc' else desc(col))
    alunos = db.execute(stmt).scalars().all()
    
    # Adicionar nome da turma
    result = []
    for aluno in alunos:
        aluno_dict = {
            'id': aluno.id,
            'nome': aluno.nome,
            'data_nascimento': aluno.data_nascimento,
            'email': aluno.email,
            'status': aluno.status,
            'turma_id': aluno.turma_id,
            'turma_nome': aluno.turma.nome if aluno.turma else None
        }
        result.append(AlunoOut(**aluno_dict))
    return result

@app.post('/alunos', response_model=AlunoOut, status_code=201)
def criar_aluno(data: AlunoCreate, db: Session = Depends(get_db)):
    # Validar turma se especificada
    if data.turma_id:
        turma = db.get(Turma, data.turma_id)
        if not turma:
            raise HTTPException(400, 'Turma não encontrada')
        if len(turma.alunos) >= turma.capacidade:
            raise HTTPException(400, 'Turma já atingiu a capacidade máxima')
    
    a = Aluno(**data.model_dump())
    db.add(a); db.commit(); db.refresh(a)
    return AlunoOut(
        id=a.id, nome=a.nome, data_nascimento=a.data_nascimento,
        email=a.email, status=a.status, turma_id=a.turma_id,
        turma_nome=a.turma.nome if a.turma else None
    )

@app.put('/alunos/{aid}', response_model=AlunoOut)
def atualizar_aluno(aid: int, data: AlunoCreate, db: Session = Depends(get_db)):
    a = db.get(Aluno, aid)
    if not a: raise HTTPException(404, 'Aluno não encontrado')
    
    # Validar mudança de turma
    if data.turma_id and data.turma_id != a.turma_id:
        turma = db.get(Turma, data.turma_id)
        if not turma:
            raise HTTPException(400, 'Turma não encontrada')
        if len(turma.alunos) >= turma.capacidade:
            raise HTTPException(400, 'Turma já atingiu a capacidade máxima')
    
    for k,v in data.model_dump().items(): setattr(a, k, v)
    db.commit(); db.refresh(a)
    return AlunoOut(
        id=a.id, nome=a.nome, data_nascimento=a.data_nascimento,
        email=a.email, status=a.status, turma_id=a.turma_id,
        turma_nome=a.turma.nome if a.turma else None
    )

@app.delete('/alunos/{aid}', status_code=204)
def excluir_aluno(aid: int, db: Session = Depends(get_db)):
    a = db.get(Aluno, aid)
    if not a: raise HTTPException(404, 'Aluno não encontrado')
    db.delete(a); db.commit()
    return

@app.post('/matriculas')
def matricular_aluno(matricula: MatriculaIn, db: Session = Depends(get_db)):
    aluno = db.get(Aluno, matricula.aluno_id)
    if not aluno: raise HTTPException(404, 'Aluno não encontrado')
    
    turma = db.get(Turma, matricula.turma_id)
    if not turma: raise HTTPException(404, 'Turma não encontrada')
    
    if len(turma.alunos) >= turma.capacidade:
        raise HTTPException(400, 'Turma já atingiu a capacidade máxima')
    
    if aluno.turma_id == matricula.turma_id:
        raise HTTPException(400, 'Aluno já está matriculado nesta turma')
    
    aluno.turma_id = matricula.turma_id
    aluno.status = 'ativo'
    db.commit()
    return {'message': f'Aluno {aluno.nome} matriculado na turma {turma.nome} com sucesso'}

@app.delete('/matriculas/{aluno_id}')
def desmatricular_aluno(aluno_id: int, db: Session = Depends(get_db)):
    aluno = db.get(Aluno, aluno_id)
    if not aluno: raise HTTPException(404, 'Aluno não encontrado')
    if not aluno.turma_id: raise HTTPException(400, 'Aluno não está matriculado em nenhuma turma')
    
    turma_nome = aluno.turma.nome
    aluno.turma_id = None
    db.commit()
    return {'message': f'Aluno {aluno.nome} desmatriculado da turma {turma_nome} com sucesso'}

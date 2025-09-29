from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(500), nullable=True)
    preco: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)   # R$ xx.xx
    estoque: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    categoria: Mapped[str] = mapped_column(String(40), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(40), unique=False, nullable=True)
    imagem_url: Mapped[str | None] = mapped_column(String(300), nullable=True)

class Usuario(Base):
    __tablename__ = 'usuarios'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nome: Mapped[str] = mapped_column(String(120))
    senha_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Column(Integer, default=0))
    is_active: Mapped[bool] = mapped_column(Column(Integer, default=1))

class Pedido(Base):
    __tablename__ = 'pedidos'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    cupom: Mapped[str | None] = mapped_column(String(40), nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(10,2), nullable=False, default=0)
    desconto: Mapped[float] = mapped_column(Numeric(10,2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(10,2), nullable=False, default=0)

    itens: Mapped[list["PedidoItem"]] = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")

class PedidoItem(Base):
    __tablename__ = 'pedido_itens'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey('pedidos.id', ondelete='CASCADE'))
    produto_id: Mapped[int] = mapped_column(ForeignKey('produtos.id'))
    nome: Mapped[str] = mapped_column(String(120))
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[float] = mapped_column(Numeric(10,2), nullable=False)

    pedido: Mapped[Pedido] = relationship("Pedido", back_populates="itens")

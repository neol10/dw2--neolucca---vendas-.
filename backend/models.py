from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Produto(Base):
    __tablename__ = 'produtos'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    preco: Mapped[float] = mapped_column(Float, nullable=False)
    estoque: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    categoria: Mapped[str] = mapped_column(String(60), index=True)
    sku: Mapped[str | None] = mapped_column(String(40), nullable=True, unique=False)

class Usuario(Base):
    __tablename__ = 'usuarios'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nome: Mapped[str] = mapped_column(String(120))
    senha_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

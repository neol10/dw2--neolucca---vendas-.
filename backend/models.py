from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
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

class Livro(Base):
    __tablename__ = 'livros'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(200), index=True)
    autor: Mapped[str] = mapped_column(String(120), index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    genero: Mapped[str] = mapped_column(String(60), index=True)
    isbn: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    status: Mapped[str] = mapped_column(String(20), default="disponivel")  # disponivel, emprestado
    data_emprestimo: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Turma(Base):
    __tablename__ = 'turmas'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    capacidade: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relacionamento com alunos
    alunos: Mapped[list["Aluno"]] = relationship("Aluno", back_populates="turma")

class Aluno(Base):
    __tablename__ = 'alunos'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    data_nascimento: Mapped[date] = mapped_column(Date, nullable=False)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ativo")  # ativo, inativo
    turma_id: Mapped[int | None] = mapped_column(Integer, ForeignKey('turmas.id'), nullable=True)
    
    # Relacionamento com turma
    turma: Mapped["Turma"] = relationship("Turma", back_populates="alunos")

class Usuario(Base):
    __tablename__ = 'usuarios'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nome: Mapped[str] = mapped_column(String(120))
    senha_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

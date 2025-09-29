from pydantic import BaseModel, Field, field_validator
from decimal import Decimal

class ProdutoBase(BaseModel):
    nome: str = Field(min_length=3, max_length=60)
    descricao: str | None = Field(default=None, max_length=500)
    preco: Decimal = Field(gt=Decimal("0.00"))
    estoque: int = Field(ge=0)
    categoria: str
    sku: str | None = Field(default=None, max_length=40)
    imagem_url: str | None = Field(default=None, max_length=300)

    @field_validator("preco")
    @classmethod
    def duas_casas(cls, v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"))

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=60)
    descricao: str | None = Field(default=None, max_length=500)
    preco: Decimal | None = Field(default=None, gt=Decimal("0.00"))
    estoque: int | None = Field(default=None, ge=0)
    categoria: str | None = None
    sku: str | None = Field(default=None, max_length=40)
    imagem_url: str | None = Field(default=None, max_length=300)

class ProdutoOut(ProdutoBase):
    id: int
    class Config:
        from_attributes = True

class PaginatedProdutos(BaseModel):
    items: list[ProdutoOut]
    total: int
    page: int
    page_size: int

# ----- Pedido (Order) -----
class ItemCarrinho(BaseModel):
    produto_id: int
    quantidade: int = Field(ge=1)

class ConfirmarCarrinhoIn(BaseModel):
    cupom: str | None = None
    itens: list[ItemCarrinho]

class PedidoItemOut(BaseModel):
    produto_id: int
    nome: str
    quantidade: int
    preco_unitario: Decimal

class PedidoOut(BaseModel):
    id: int
    cupom: str | None
    subtotal: Decimal
    desconto: Decimal
    total: Decimal
    itens: list[PedidoItemOut]
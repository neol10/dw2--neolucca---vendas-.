class Product:
    def __init__(self, id: int, name: str, description: str, price: float, stock: int, category: str, sku: str):
        self.id = id
        self.name = name
        self.description = description
        self.price = price
        self.stock = stock
        self.category = category
        self.sku = sku

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price}, stock={self.stock})>"
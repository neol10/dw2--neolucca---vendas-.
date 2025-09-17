export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    sku: string;
}

export interface Order {
    id: number;
    productId: number;
    quantity: number;
    totalPrice: number;
    orderDate: Date;
}
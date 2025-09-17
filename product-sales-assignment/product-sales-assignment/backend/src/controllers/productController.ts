import { Request, Response } from 'express';
import Product from '../models/product';

// Fetch all products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
    const { name, description, price, stock, category, sku } = req.body;
    try {
        const newProduct = await Product.create({ name, description, price, stock, category, sku });
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error });
    }
};

// Update an existing product
export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, stock, category, sku } = req.body;
    try {
        const updatedProduct = await Product.update({ name, description, price, stock, category, sku }, { where: { id } });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await Product.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};
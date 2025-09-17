import React, { useEffect, useState } from 'react';
import ProductList from '../components/ProductList';

const Home: React.FC = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div>
            <h1>Product Sales</h1>
            <ProductList products={products} />
        </div>
    );
};

export default Home;
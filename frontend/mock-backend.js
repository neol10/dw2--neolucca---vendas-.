// Mock Backend para testar o frontend sem servidor Python
class MockBackend {
    constructor() {
        this.users = [
            {
                id: 1,
                email: "admin@neo.com",
                nome: "Administrador",
                senha: "admin123",
                is_admin: true,
                is_active: true
            },
            {
                id: 2,
                email: "user@neo.com", 
                nome: "Usuário Teste",
                senha: "user123",
                is_admin: false,
                is_active: true
            }
        ];
        
        this.produtos = [
            {
                id: 1,
                nome: "Caderno Universitário",
                descricao: "Caderno 200 folhas",
                preco: 15.90,
                estoque: 50,
                categoria: "Material Escolar",
                sku: "CAD001"
            },
            {
                id: 2,
                nome: "Caneta Azul",
                descricao: "Caneta esferográfica azul",
                preco: 2.50,
                estoque: 100,
                categoria: "Material Escolar", 
                sku: "CAN001"
            }
        ];
        
        this.currentToken = null;
        this.currentUser = null;
    }

    // Simular endpoint /token
    async login(username, password) {
        const user = this.users.find(u => u.email === username && u.senha === password);
        if (!user) {
            throw new Error("Email ou senha incorretos");
        }
        
        this.currentToken = `mock_token_${Date.now()}`;
        this.currentUser = user;
        
        return {
            access_token: this.currentToken,
            token_type: "bearer"
        };
    }

    // Simular endpoint /usuarios/me/
    async getCurrentUser(token) {
        if (token !== this.currentToken) {
            throw new Error("Token inválido");
        }
        
        return {
            id: this.currentUser.id,
            email: this.currentUser.email,
            nome: this.currentUser.nome,
            is_admin: this.currentUser.is_admin,
            is_active: this.currentUser.is_active
        };
    }

    // Simular endpoint /produtos/
    async getProdutos(search = '', categoria = '', page = 1, limit = 10) {
        let produtos = [...this.produtos];
        
        if (search) {
            produtos = produtos.filter(p => 
                p.nome.toLowerCase().includes(search.toLowerCase()) ||
                p.descricao.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (categoria) {
            produtos = produtos.filter(p => p.categoria === categoria);
        }
        
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
            items: produtos.slice(start, end),
            total: produtos.length,
            page: page,
            pages: Math.ceil(produtos.length / limit)
        };
    }
}

// Instância global do mock backend
window.mockBackend = new MockBackend();

// Interceptar fetch para simular API
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    const API_BASE_URL = 'http://127.0.0.1:8000';
    
    // Se não for uma chamada para nossa API, usar fetch normal
    if (!url.startsWith(API_BASE_URL)) {
        return originalFetch(url, options);
    }
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
        // Endpoint /token (login)
        if (url === `${API_BASE_URL}/token` && options.method === 'POST') {
            const formData = options.body;
            const username = formData.get('username');
            const password = formData.get('password');
            
            const result = await window.mockBackend.login(username, password);
            
            return {
                ok: true,
                status: 200,
                json: async () => result
            };
        }
        
        // Endpoint /usuarios/me/
        if (url === `${API_BASE_URL}/usuarios/me/` && options.method === 'GET') {
            const authHeader = options.headers?.Authorization;
            const token = authHeader?.replace('Bearer ', '');
            
            const result = await window.mockBackend.getCurrentUser(token);
            
            return {
                ok: true,
                status: 200,
                json: async () => result
            };
        }
        
        // Endpoint /produtos/
        if (url.startsWith(`${API_BASE_URL}/produtos`) && options.method === 'GET') {
            const urlObj = new URL(url);
            const search = urlObj.searchParams.get('search') || '';
            const categoria = urlObj.searchParams.get('categoria') || '';
            const page = parseInt(urlObj.searchParams.get('page') || '1');
            const limit = parseInt(urlObj.searchParams.get('limit') || '10');
            
            const result = await window.mockBackend.getProdutos(search, categoria, page, limit);
            
            return {
                ok: true,
                status: 200,
                json: async () => result
            };
        }
        
        // Endpoint raiz /
        if (url === `${API_BASE_URL}/`) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ message: "NEO Loja Escolar API - Mock Backend" })
            };
        }
        
        // Outros endpoints - retornar erro 404
        return {
            ok: false,
            status: 404,
            json: async () => ({ detail: "Endpoint não encontrado no mock backend" })
        };
        
    } catch (error) {
        return {
            ok: false,
            status: 400,
            json: async () => ({ detail: error.message })
        };
    }
};

console.log("🔧 Mock Backend ativado! Você pode testar o login com:");
console.log("📧 Admin: admin@neo.com / admin123");
console.log("👤 User: user@neo.com / user123");


// ===== CONFIG =====
const API_BASE_URL = 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 9;

// ===== STATE =====
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
let filtros = JSON.parse(localStorage.getItem('filtros') || '{"categoria":"","busca":"","ordenacao":"nome-asc"}');
let paginaAtual = 1;
let editandoProduto = null;
let tema = localStorage.getItem('tema') || 'light';
let authToken = localStorage.getItem('authToken');
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  configurarTema();
  configurarEventListeners();
  carregarProdutos();
  atualizarCarrinho();
  atualizarUI();
});

// ===== THEME =====
function configurarTema() {
  document.documentElement.setAttribute('data-theme', tema);
  const toggleBtn = document.getElementById('toggleTheme');
  toggleBtn.textContent = tema === 'dark' ? '☀️' : '🌙';
}
function alternarTema() {
  tema = tema === 'light' ? 'dark' : 'light';
  localStorage.setItem('tema', tema);
  configurarTema();
  mostrarToast(`Tema ${tema === 'dark' ? 'escuro' : 'claro'} ativado!`, 'success');
}

// ===== LISTENERS =====
function configurarEventListeners() {
  document.getElementById('cartBtn').addEventListener('click', abrirCarrinho);
  document.getElementById('adminBtn').addEventListener('click', abrirAdmin);
  document.getElementById('loginBtn').addEventListener('click', abrirAuth);
  document.getElementById('userMenuBtn').addEventListener('click', abrirUserMenu);
  document.getElementById('toggleTheme').addEventListener('click', alternarTema);
  document.getElementById('showRegisterForm').addEventListener('click', mostrarRegistro);
  document.getElementById('showLoginForm').addEventListener('click', mostrarLogin);
  document.getElementById('loginForm').addEventListener('submit', fazerLogin);
  document.getElementById('registerForm').addEventListener('submit', fazerRegistro);
  document.getElementById('closeAuthBtn').addEventListener('click', fecharAuth);
  const searchInput = document.getElementById('searchInput');
  document.getElementById('searchBtn').addEventListener('click', ()=>{
    filtros.busca = searchInput.value.trim(); paginaAtual = 1; renderizarProdutos();
  });
  searchInput.addEventListener('input', debounce(function(){
    filtros.busca = this.value.trim(); paginaAtual = 1; renderizarProdutos();
  }, 300));
  document.getElementById('categoryFilter').addEventListener('change', function(){
    filtros.categoria = this.value; paginaAtual = 1; renderizarProdutos(); salvarFiltros();
  });
  document.getElementById('sortFilter').addEventListener('change', function(){
    filtros.ordenacao = this.value; paginaAtual = 1; renderizarProdutos(); salvarFiltros();
  });
  document.getElementById('closeCartBtn').addEventListener('click', fecharCarrinho);
  document.getElementById('applyCouponBtn').addEventListener('click', aplicarCupom);
  document.getElementById('checkoutBtn').addEventListener('click', finalizarPedido);
  document.getElementById('closeAdminBtn').addEventListener('click', fecharAdmin);
  document.getElementById('cancelBtn').addEventListener('click', cancelarEdicao);
  document.getElementById('productForm').addEventListener('submit', salvarProduto);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ fecharCarrinho(); fecharAdmin(); }
    if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); document.getElementById('searchInput').focus(); }
    if(e.altKey && e.key.toLowerCase()==='n'){ e.preventDefault(); abrirAdmin(); }
  });
  // Preload filtros para selects
  document.getElementById('categoryFilter').value = filtros.categoria || '';
  document.getElementById('sortFilter').value = filtros.ordenacao || 'nome-asc';
}
function salvarFiltros(){ localStorage.setItem('filtros', JSON.stringify(filtros)); }

// ===== API =====
async function carregarProdutos(){
  try{
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtros.busca) params.append('search', filtros.busca);
    if(filtros.categoria) params.append('categoria', filtros.categoria);
    if(filtros.ordenacao) params.append('sort', filtros.ordenacao);
    const res = await fetch(`${API_BASE_URL}/produtos?${params.toString()}`);
    if(!res.ok) throw new Error('Falha ao carregar produtos');
    produtos = await res.json();
    renderizarProdutos();
  }catch(err){
    console.error(err); mostrarToast('Erro ao carregar produtos.', 'error');
    produtos = []; renderizarProdutos();
  }finally{ esconderLoading(); }
}

async function salvarProduto(e){
  e.preventDefault();
  const produto = coletarDoFormulario();
  if(!validarProduto(produto)) return;
  try{
    const method = editandoProduto ? 'PUT' : 'POST';
    const url = editandoProduto ? `${API_BASE_URL}/produtos/${editandoProduto.id}` : `${API_BASE_URL}/produtos`;
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(produto) });
    if(!res.ok) throw new Error('Falha ao salvar produto');
    await carregarProdutos();
    fecharAdmin();
    mostrarToast(editandoProduto ? 'Produto atualizado!' : 'Produto criado!', 'success');
    editandoProduto = null;
  }catch(err){
    console.error(err); mostrarToast('Erro ao salvar produto.', 'error');
  }
}

async function deletarProduto(id){
  if(!confirm('Tem certeza que deseja excluir?')) return;
  try{
    const res = await fetch(`${API_BASE_URL}/produtos/${id}`, { method: 'DELETE' });
    if(!res.ok) throw new Error('Falha ao excluir');
    await carregarProdutos();
    mostrarToast('Produto removido.', 'success');
  }catch(err){ console.error(err); mostrarToast('Erro ao excluir.', 'error'); }
}

async function finalizarPedido(){
  if(carrinho.length===0){ mostrarToast('Carrinho vazio.', 'error'); return; }
  try{
    const cupom = (document.getElementById('couponInput').value || '').trim();
    const payload = { cupom, itens: carrinho.map(c=>({ produto_id: c.id, quantidade: c.qtd })) };
    const res = await fetch(`${API_BASE_URL}/carrinho/confirmar`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Falha ao finalizar');
    carrinho = [];
    localStorage.removeItem('carrinho');
    atualizarCarrinho(); fecharCarrinho(); await carregarProdutos();
    mostrarToast('Pedido finalizado! 🎉', 'success');
  }catch(err){ console.error(err); mostrarToast('Erro ao finalizar.', 'error'); }
}

// ===== RENDER =====
function renderizarProdutos(){
  const grid = document.getElementById('productsGrid');
  const lista = ordenarProdutos(filtrarProdutos(produtos));
  const totalPages = Math.max(1, Math.ceil(lista.length / ITEMS_PER_PAGE));
  paginaAtual = Math.min(paginaAtual, totalPages);
  const start = (paginaAtual-1)*ITEMS_PER_PAGE;
  const pageItems = lista.slice(start, start+ITEMS_PER_PAGE);
  if(pageItems.length===0){
    grid.innerHTML = `<div class="product-card" style="grid-column:1/-1;text-align:center">Nenhum produto encontrado.</div>`;
  } else {
    grid.innerHTML = pageItems.map(p => `
      <div class="product-card">
        <div class="product-image">${getCategoryIcon(p.categoria)}</div>
        <div class="product-info">
          <h3>${escapeHtml(p.nome)}</h3>
          <p>${escapeHtml(p.descricao || 'Sem descrição')}</p>
          <div class="product-price">R$ ${formatMoney(p.preco)}</div>
          <div class="product-stock">${p.estoque>0? '✅ '+p.estoque+' em estoque' : '❌ Fora de estoque'}</div>
        </div>
        <div class="product-actions">
          <button class="add-to-cart-btn" ${p.estoque===0?'disabled':''} onclick="adicionarAoCarrinho(${p.id})">${p.estoque===0?'Indisponível':'🛒 Adicionar'}</button>
          <button class="edit-btn" onclick="editarProduto(${p.id})">✏️</button>
          <button class="delete-btn" onclick="deletarProduto(${p.id})">🗑️</button>
        </div>
      </div>
    `).join('');
  }
  renderizarPaginacao(totalPages);
}
function renderizarPaginacao(total){
  const el = document.getElementById('pagination');
  if(total<=1){ el.innerHTML = ''; return; }
  let html = `<button ${paginaAtual===1?'disabled':''} onclick="mudarPagina(${paginaAtual-1})">←</button>`;
  const max = 5;
  let start = Math.max(1, paginaAtual - Math.floor(max/2));
  let end = Math.min(total, start + max - 1);
  if(end - start + 1 < max) start = Math.max(1, end - max + 1);
  for(let i=start;i<=end;i++){
    html += `<button class="${i===paginaAtual?'active':''}" onclick="mudarPagina(${i})">${i}</button>`;
  }
  html += `<button ${paginaAtual===total?'disabled':''} onclick="mudarPagina(${paginaAtual+1})">→</button>`;
  el.innerHTML = html;
}
function mudarPagina(p){ paginaAtual = p; renderizarProdutos(); }

function filtrarProdutos(arr){
  return arr.filter(p=>{
    const catOk = !filtros.categoria || p.categoria===filtros.categoria;
    const b = (filtros.busca||'').toLowerCase();
    const sOk = !b || p.nome.toLowerCase().includes(b) || (p.descricao||'').toLowerCase().includes(b) || (p.sku||'').toLowerCase().includes(b);
    return catOk && sOk;
  });
}
function ordenarProdutos(arr){
  const by = filtros.ordenacao || 'nome-asc';
  return [...arr].sort((a,b)=>{
    switch(by){
      case 'nome-asc': return a.nome.localeCompare(b.nome);
      case 'nome-desc': return b.nome.localeCompare(a.nome);
      case 'preco-asc': return a.preco - b.preco;
      case 'preco-desc': return b.preco - a.preco;
      case 'estoque-asc': return a.estoque - b.estoque;
      case 'estoque-desc': return b.estoque - a.estoque;
      default: return 0;
    }
  });
}

// ===== CART =====
function atualizarCarrinho(){
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  document.getElementById('cartBadge').textContent = carrinho.reduce((a,c)=>a+c.qtd,0);
  atualizarResumoCarrinho();
  renderizarItensCarrinho();
}
function adicionarAoCarrinho(id){
  const p = produtos.find(x=>x.id===id); if(!p) return;
  if(p.estoque<=0){ mostrarToast('Produto sem estoque.','error'); return; }
  const found = carrinho.find(x=>x.id===id);
  if(found){ if(found.qtd < p.estoque) found.qtd++; else { mostrarToast('Sem estoque suficiente.','error'); return; } }
  else carrinho.push({ id:p.id, nome:p.nome, preco:p.preco, qtd:1 });
  atualizarCarrinho(); mostrarToast('Adicionado ao carrinho.','success');
}
function removerDoCarrinho(id){ carrinho = carrinho.filter(x=>x.id!==id); atualizarCarrinho(); }
function alterarQtd(id,delta){
  const it = carrinho.find(x=>x.id===id); if(!it) return;
  const p = produtos.find(x=>x.id===id); if(!p) return;
  const nova = it.qtd + delta;
  if(nova<=0) return removerDoCarrinho(id);
  if(nova>p.estoque){ mostrarToast('Sem estoque suficiente.','error'); return; }
  it.qtd = nova; atualizarCarrinho();
}
function renderizarItensCarrinho(){
  const el = document.getElementById('cartItems');
  if(carrinho.length===0){ el.innerHTML = `<div class="empty-cart">Seu carrinho está vazio.</div>`; return; }
  el.innerHTML = carrinho.map(it=>`
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${escapeHtml(it.nome)}</h4>
        <div class="cart-item-price">R$ ${formatMoney(it.preco)}</div>
      </div>
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="alterarQtd(${it.id},-1)">−</button>
        <div class="quantity-display">${it.qtd}</div>
        <button class="quantity-btn" onclick="alterarQtd(${it.id},1)">+</button>
      </div>
      <button class="remove-item-btn" onclick="removerDoCarrinho(${it.id})">Remover</button>
    </div>
  `).join('');
}
function abrirCarrinho(){ document.getElementById('cartModal').classList.add('active'); }
function fecharCarrinho(){ document.getElementById('cartModal').classList.remove('active'); }

// ===== COUPON/TOTAL =====
let descontoAtual = 0;
function aplicarCupom(){
  const code = (document.getElementById('couponInput').value||'').trim().toUpperCase();
  if(!code){ descontoAtual = 0; atualizarResumoCarrinho(); return; }
  if(code==='ALUNO10'){ descontoAtual = 0.10; mostrarToast('Cupom aplicado: 10%','success'); }
  else { descontoAtual = 0; mostrarToast('Cupom inválido.','error'); }
  atualizarResumoCarrinho();
}
function atualizarResumoCarrinho(){
  const subtotal = carrinho.reduce((a,c)=>a+c.preco*c.qtd,0);
  const desconto = subtotal * descontoAtual;
  const total = subtotal - desconto;
  document.getElementById('subtotalValue').textContent = 'R$ ' + formatMoney(subtotal);
  document.getElementById('discountValue').textContent = 'R$ ' + formatMoney(desconto);
  document.getElementById('totalValue').textContent = 'R$ ' + formatMoney(total);
}

// ===== ADMIN =====
function abrirAdmin(){ document.getElementById('adminModal').classList.add('active'); resetForm(); }
function fecharAdmin(){ document.getElementById('adminModal').classList.remove('active'); editandoProduto=null; resetForm(); }
function cancelarEdicao(){ fecharAdmin(); }
function editarProduto(id){
  const p = produtos.find(x=>x.id===id); if(!p) return;
  editandoProduto = p;
  document.getElementById('nome').value = p.nome;
  document.getElementById('preco').value = p.preco;
  document.getElementById('estoque').value = p.estoque;
  document.getElementById('categoria').value = p.categoria;
  document.getElementById('sku').value = p.sku || '';
  document.getElementById('descricao').value = p.descricao || '';
  abrirAdmin();
}
function coletarDoFormulario(){
  return {
    nome: document.getElementById('nome').value.trim(),
    preco: parseFloat(document.getElementById('preco').value),
    estoque: parseInt(document.getElementById('estoque').value,10),
    categoria: document.getElementById('categoria').value,
    sku: document.getElementById('sku').value.trim() || null,
    descricao: document.getElementById('descricao').value.trim() || null
  };
}
function validarProduto(p){
  let ok = true;
  const setErr = (id,msg)=>{ document.getElementById('err-'+id).textContent = msg||''; };
  setErr('nome'); setErr('preco'); setErr('estoque'); setErr('categoria');
  if(!p.nome || p.nome.length<3){ setErr('nome','Informe um nome (mín. 3).'); ok=false; }
  if(isNaN(p.preco) || p.preco<=0){ setErr('preco','Preço inválido.'); ok=false; }
  if(!Number.isInteger(p.estoque) || p.estoque<0){ setErr('estoque','Estoque inválido.'); ok=false; }
  if(!p.categoria){ setErr('categoria','Selecione a categoria.'); ok=false; }
  return ok;
}
function resetForm(){ document.getElementById('productForm').reset(); ['nome','preco','estoque','categoria'].forEach(i=>document.getElementById('err-'+i).textContent=''); }

// ===== UTILS =====
function debounce(fn, wait){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }
function mostrarLoading(btn = null) {
    document.getElementById('loading').classList.add('active');
    if (btn) {
        btn.classList.add('btn-loading');
        btn.originalText = btn.textContent;
        btn.textContent = 'Aguarde...';
    }
}
function esconderLoading(btn = null) {
    document.getElementById('loading').classList.remove('active');
    if (btn) {
        btn.classList.remove('btn-loading');
        btn.textContent = btn.originalText;
    }
}
function mostrarToast(msg, type = '') {
    const el = document.getElementById('toastContainer');
    const id = 't' + Date.now();
    const node = document.createElement('div');
    node.className = 'toast ' + (type || '');
    node.id = id;
    node.textContent = msg;
    el.appendChild(node);
    
    // Animar saída
    setTimeout(() => {
        node.style.opacity = '0';
        node.style.transform = 'translateX(100%)';
        setTimeout(() => node.remove(), 300);
    }, 3000);
    
    // Limitar número de toasts
    const toasts = el.children;
    if (toasts.length > 3) {
        toasts[0].remove();
    }
}
function getCategoryIcon(cat){
  const map = { 'material-escolar':'📚', 'livros':'📖', 'uniformes':'🧢', 'tecnologia':'💻' };
  return map[cat] || '📦';
}
function formatMoney(v){ return v.toFixed(2).replace('.',','); }

// ===== AUTH =====
function atualizarUI() {
  const adminBtn = document.getElementById('adminBtn');
  const loginBtn = document.getElementById('loginBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenuName = document.getElementById('userMenuName');

  if (usuario && authToken) {
    loginBtn.style.display = 'none';
    userMenuBtn.style.display = 'block';
    userMenuName.textContent = usuario.nome;
    if (usuario.is_admin) {
      adminBtn.style.display = 'block';
    } else {
      adminBtn.style.display = 'none';
    }
  } else {
    loginBtn.style.display = 'block';
    userMenuBtn.style.display = 'none';
    adminBtn.style.display = 'none';
  }
}

function abrirAuth() {
  const modal = document.getElementById('authModal');
  modal.classList.add('active');
  mostrarLogin();
}

function fecharAuth() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('active');
}

function mostrarLogin() {
  document.getElementById('authModalTitle').textContent = 'Entrar';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

function mostrarRegistro() {
  document.getElementById('authModalTitle').textContent = 'Criar Conta';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

async function fazerLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  mostrarLoading(btn);

  const formData = new FormData();
  formData.append('username', document.getElementById('loginEmail').value);
  formData.append('password', document.getElementById('loginPassword').value);

  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Email ou senha incorretos');
    }

    const data = await response.json();
    authToken = data.access_token;
    localStorage.setItem('authToken', authToken);

    // Buscar dados do usuário
    const userResponse = await fetch(`${API_BASE_URL}/usuarios/me/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Erro ao buscar dados do usuário');
    }

    usuario = await userResponse.json();
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    mostrarToast('Login realizado com sucesso! 👋', 'success');
    fecharAuth();
    atualizarUI();
    
  } catch (error) {
    mostrarToast('🚫 ' + (error.message || 'Erro ao fazer login'), 'error');
  } finally {
    esconderLoading(btn);
  }
}

async function fazerRegistro(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  mostrarLoading(btn);

  const dados = {
    email: document.getElementById('registerEmail').value,
    nome: document.getElementById('registerName').value,
    senha: document.getElementById('registerPassword').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar conta');
    }

    mostrarToast('✨ Conta criada com sucesso!', 'success');
    mostrarLogin();
    document.getElementById('loginEmail').value = dados.email;
    
  } catch (error) {
    mostrarToast('🚫 ' + (error.message || 'Erro ao criar conta'), 'error');
  } finally {
    esconderLoading(btn);
  }
}

function fazerLogout() {
  authToken = null;
  usuario = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
  atualizarUI();
  mostrarToast('Logout realizado com sucesso!', 'success');
}

function abrirUserMenu() {
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <span>${usuario.nome}</span>
      <span class="user-email">${usuario.email}</span>
    </div>
    <button onclick="fazerLogout()">Sair</button>
  `;
  
  document.body.appendChild(menu);
  
  const btn = document.getElementById('userMenuBtn');
  const rect = btn.getBoundingClientRect();
  menu.style.position = 'absolute';
  menu.style.top = rect.bottom + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  
  // Remover menu ao clicar fora
  const removeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.remove();
      document.removeEventListener('click', removeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', removeMenu), 0);
}

// Função auxiliar para requests autenticados
async function fetchAuth(url, options = {}) {
  if (!authToken) {
    throw new Error('Usuário não autenticado');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authToken}`
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expirado ou inválido
    fazerLogout();
    throw new Error('Sessão expirada');
  }

  return response;
}
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[s])); }

// Expose for HTML
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQtd = alterarQtd;
window.editarProduto = editarProduto;
window.mudarPagina = mudarPagina;
window.deletarProduto = deletarProduto;

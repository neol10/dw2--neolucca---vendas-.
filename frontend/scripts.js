
// ===== CONFIG =====
const API_BASE_URL = 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 9;

// ===== STATE =====
let produtos = [];
let livros = [];
let turmas = [];
let alunos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
let filtros = { busca: '', categoria: '', ordenacao: 'nome-asc', precoMin: '', precoMax: '', estoqueMin: '' };
let filtrosLivros = { busca: '', categoria: '', status: '', ordenacao: 'titulo-asc', anoMin: '', anoMax: '' };
let filtrosAvancados = false;
let filtrosTurmas = JSON.parse(localStorage.getItem('filtrosTurmas') || '{"busca":"","ordenacao":"nome-asc"}');
let filtrosAlunos = JSON.parse(localStorage.getItem('filtrosAlunos') || '{"busca":"","turma_id":"","status":"","ordenacao":"nome-asc"}');
let paginaAtual = 1;
let paginaAtualLivros = 1;
let paginaAtualTurmas = 1;
let paginaAtualAlunos = 1;
let totalPaginas = 1;
let editandoProduto = null;
let editandoLivro = null;
let editandoTurma = null;
let editandoAluno = null;
let secaoAtiva = 'vendas';
let subSecaoEscola = 'turmas';
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
  document.getElementById('bibliotecaBtn').addEventListener('click', () => alternarSecao('biblioteca'));
  document.getElementById('escolaBtn').addEventListener('click', () => alternarSecao('escola'));
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
    filtros.busca = searchInput.value.trim(); paginaAtual = 1; carregarProdutos(); salvarFiltros();
  });
  searchInput.addEventListener('input', debounce(function(){
    filtros.busca = this.value.trim(); paginaAtual = 1; carregarProdutos();
  }, 300));
  document.getElementById('categoryFilter').addEventListener('change', function(){
    filtros.categoria = this.value; paginaAtual = 1; carregarProdutos(); salvarFiltros();
  });
  document.getElementById('sortFilter').addEventListener('change', function(){
    filtros.ordenacao = this.value; paginaAtual = 1; carregarProdutos(); salvarFiltros();
  });
  document.getElementById('closeCartBtn').addEventListener('click', fecharCarrinho);
  document.getElementById('applyCouponBtn').addEventListener('click', aplicarCupom);
  document.getElementById('checkoutBtn').addEventListener('click', finalizarPedido);
  document.getElementById('closeAdminBtn').addEventListener('click', fecharAdmin);
  document.getElementById('cancelBtn').addEventListener('click', cancelarEdicao);
  document.getElementById('productForm').addEventListener('submit', salvarProduto);
  
  // Export listeners
  document.getElementById('exportCsvBtn').addEventListener('click', exportarCSV);
  document.getElementById('exportJsonBtn').addEventListener('click', exportarJSON);
  
  // Advanced filters listeners
  document.getElementById('toggleAdvancedFilters').addEventListener('click', toggleAdvancedFilters);
  document.getElementById('applyAdvancedFilters').addEventListener('click', applyAdvancedFilters);
  document.getElementById('clearAdvancedFilters').addEventListener('click', clearAdvancedFilters);
  
  // Biblioteca listeners
  document.getElementById('adminLivroBtn').addEventListener('click', abrirAdminLivro);
  document.getElementById('closeAdminLivroBtn').addEventListener('click', fecharAdminLivro);
  document.getElementById('cancelLivroBtn').addEventListener('click', cancelarEdicaoLivro);
  document.getElementById('livroForm').addEventListener('submit', salvarLivro);
  
  const livroSearchInput = document.getElementById('livroSearchInput');
  livroSearchInput.addEventListener('input', debounce(function(){
    filtrosLivros.busca = this.value.trim(); paginaAtualLivros = 1; renderizarLivros();
  }, 300));
  document.getElementById('generoFilter').addEventListener('change', function(){
    filtrosLivros.genero = this.value; paginaAtualLivros = 1; renderizarLivros(); salvarFiltrosLivros();
  });
  document.getElementById('statusFilter').addEventListener('change', function(){
    filtrosLivros.status = this.value; paginaAtualLivros = 1; renderizarLivros(); salvarFiltrosLivros();
  });
  document.getElementById('livroSortFilter').addEventListener('change', function(){
    filtrosLivros.ordenacao = this.value; paginaAtualLivros = 1; renderizarLivros(); salvarFiltrosLivros();
  });
  
  // Escola listeners
  document.getElementById('turmasTab').addEventListener('click', () => alternarSubSecaoEscola('turmas'));
  document.getElementById('alunosTab').addEventListener('click', () => alternarSubSecaoEscola('alunos'));
  
  document.getElementById('adminTurmaBtn').addEventListener('click', abrirAdminTurma);
  document.getElementById('closeAdminTurmaBtn').addEventListener('click', fecharAdminTurma);
  document.getElementById('cancelTurmaBtn').addEventListener('click', cancelarEdicaoTurma);
  document.getElementById('turmaForm').addEventListener('submit', salvarTurma);
  
  document.getElementById('adminAlunoBtn').addEventListener('click', abrirAdminAluno);
  document.getElementById('closeAdminAlunoBtn').addEventListener('click', fecharAdminAluno);
  document.getElementById('cancelAlunoBtn').addEventListener('click', cancelarEdicaoAluno);
  document.getElementById('alunoForm').addEventListener('submit', salvarAluno);
  
  const turmaSearchInput = document.getElementById('turmaSearchInput');
  turmaSearchInput.addEventListener('input', debounce(function(){
    filtrosTurmas.busca = this.value.trim(); paginaAtualTurmas = 1; renderizarTurmas();
  }, 300));
  document.getElementById('turmaSortFilter').addEventListener('change', function(){
    filtrosTurmas.ordenacao = this.value; paginaAtualTurmas = 1; renderizarTurmas(); salvarFiltrosTurmas();
  });
  
  const alunoSearchInput = document.getElementById('alunoSearchInput');
  alunoSearchInput.addEventListener('input', debounce(function(){
    filtrosAlunos.busca = this.value.trim(); paginaAtualAlunos = 1; renderizarAlunos();
  }, 300));
  document.getElementById('alunoTurmaFilter').addEventListener('change', function(){
    filtrosAlunos.turma_id = this.value; paginaAtualAlunos = 1; renderizarAlunos(); salvarFiltrosAlunos();
  });
  document.getElementById('alunoStatusFilter').addEventListener('change', function(){
    filtrosAlunos.status = this.value; paginaAtualAlunos = 1; renderizarAlunos(); salvarFiltrosAlunos();
  });
  document.getElementById('alunoSortFilter').addEventListener('change', function(){
    filtrosAlunos.ordenacao = this.value; paginaAtualAlunos = 1; renderizarAlunos(); salvarFiltrosAlunos();
  });
  
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ fecharCarrinho(); fecharAdmin(); fecharAdminLivro(); fecharAdminTurma(); fecharAdminAluno(); }
    if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); 
      if(secaoAtiva === 'biblioteca') document.getElementById('livroSearchInput').focus();
      else if(secaoAtiva === 'escola' && subSecaoEscola === 'turmas') document.getElementById('turmaSearchInput').focus();
      else if(secaoAtiva === 'escola' && subSecaoEscola === 'alunos') document.getElementById('alunoSearchInput').focus();
      else document.getElementById('searchInput').focus();
    }
    if(e.altKey && e.key.toLowerCase()==='n'){ e.preventDefault(); 
      if(secaoAtiva === 'biblioteca') abrirAdminLivro();
      else if(secaoAtiva === 'escola' && subSecaoEscola === 'turmas') abrirAdminTurma();
      else if(secaoAtiva === 'escola' && subSecaoEscola === 'alunos') abrirAdminAluno();
      else abrirAdmin();
    }
  });
  // Preload filtros para selects
  document.getElementById('categoryFilter').value = filtros.categoria || '';
  document.getElementById('sortFilter').value = filtros.ordenacao || 'nome-asc';
  document.getElementById('generoFilter').value = filtrosLivros.genero || '';
  document.getElementById('statusFilter').value = filtrosLivros.status || '';
  document.getElementById('livroSortFilter').value = filtrosLivros.ordenacao || 'titulo-asc';
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
    params.append('page', paginaAtual);
    params.append('per_page', ITEMS_PER_PAGE);
    const res = await fetch(`${API_BASE_URL}/produtos?${params.toString()}`);
    if(!res.ok) throw new Error('Falha ao carregar produtos');
    const data = await res.json();
    
    // Suporte para paginação server-side
    if(data.items){
      produtos = data.items;
      totalPaginas = data.total_pages;
    } else {
      produtos = data;
      totalPaginas = 1;
    }
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
  
  if(produtos.length === 0){
    grid.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = produtos.map(produto => `
    <div class="product-card">
      <div class="product-image">${produto.categoria === 'Papelaria' ? '📝' : produto.categoria === 'Acessórios' ? '🎒' : '🔢'}</div>
      <div class="product-info">
        <h3>${escapeHtml(produto.nome)}</h3>
        <p>${escapeHtml(produto.descricao)}</p>
        <div class="product-price">R$ ${produto.preco.toFixed(2)}</div>
        <div class="product-stock">Estoque: ${produto.estoque}</div>
      </div>
      <div class="product-actions">
        <button onclick="adicionarAoCarrinho(${produto.id})" class="add-to-cart-btn">Adicionar</button>
        ${usuario?.is_admin ? `
          <button onclick="editarProduto(${produto.id})" class="edit-btn">✏️</button>
          <button onclick="deletarProduto(${produto.id})" class="delete-btn">🗑️</button>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  renderizarPaginacao('pagination', paginaAtual, totalPaginas, (page) => {
    paginaAtual = page;
    carregarProdutos(); // Recarregar com nova página
  });
}

function renderizarPaginacao(containerId, currentPage, totalPages, onPageChange) {
  const el = document.getElementById(containerId);
  if(totalPages<=1){ el.innerHTML = ''; return; }
  let html = `<button ${currentPage===1?'disabled':''} onclick="mudarPagina(${currentPage-1})">←</button>`;
  const max = 5;
  let start = Math.max(1, currentPage - Math.floor(max/2));
  let end = Math.min(totalPages, start + max - 1);
  if(end - start + 1 < max) start = Math.max(1, end - max + 1);
  for(let i=start;i<=end;i++){
    html += `<button class="${i===currentPage?'active':''}" onclick="mudarPagina(${i})">${i}</button>`;
  }
  html += `<button ${currentPage===totalPages?'disabled':''} onclick="mudarPagina(${currentPage+1})">→</button>`;
  el.innerHTML = html;
}
function mudarPagina(p){ paginaAtual = p; carregarProdutos(); }

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
function mostrarToast(msg, type = '', duracao = 4000) {
    const el = document.getElementById('toastContainer');
    const id = 't' + Date.now();
    const node = document.createElement('div');
    node.id = id;
    node.className = `toast toast-${type}`;
    node.setAttribute('role', 'alert');
    node.setAttribute('aria-live', 'assertive');
    
    // Ícones para diferentes tipos
    const icones = {
        success: '✅',
        error: '❌', 
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    node.innerHTML = `
        <span class="toast-icon">${icones[type] || icones.info}</span>
        <span class="toast-message">${msg}</span>
        <button class="toast-close" aria-label="Fechar notificação" onclick="document.getElementById('${id}').remove()">&times;</button>
    `;
    
    el.appendChild(node);
    setTimeout(() => node.classList.add('show'), 100);
    setTimeout(() => {
        if (document.getElementById(id)) {
            document.getElementById(id).remove();
        }
    }, duracao);
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

// Função auxiliar para// ===== FETCH WITH AUTH & ERROR HANDLING =====
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('authToken');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle different HTTP status codes
    if (!response.ok) {
      let errorMessage = 'Erro desconhecido';
      
      switch (response.status) {
        case 400:
          errorMessage = 'Dados inválidos enviados';
          break;
        case 401:
          errorMessage = 'Não autorizado - faça login novamente';
          // Auto logout on 401
          localStorage.removeItem('authToken');
          localStorage.removeItem('usuario');
          atualizarUI();
          break;
        case 403:
          errorMessage = 'Acesso negado - permissões insuficientes';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 409:
          errorMessage = 'Conflito - recurso já existe';
          break;
        case 422:
          errorMessage = 'Dados de entrada inválidos';
          break;
        case 429:
          errorMessage = 'Muitas tentativas - tente novamente em alguns minutos';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        case 502:
          errorMessage = 'Servidor indisponível';
          break;
        case 503:
          errorMessage = 'Serviço temporariamente indisponível';
          break;
        default:
          errorMessage = `Erro HTTP ${response.status}`;
      }
      
      // Try to get detailed error from response
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erro de conexão - verifique sua internet');
    }
    
    // Re-throw other errors
    throw error;
    // Token expirado ou inválido
    fazerLogout();
    throw new Error('Sessão expirada');
  }

  return response;
}
function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[s])); }

// ===== ESCOLA FUNCTIONS =====
function salvarFiltrosTurmas(){ localStorage.setItem('filtrosTurmas', JSON.stringify(filtrosTurmas));}
function salvarFiltrosAlunos(){ localStorage.setItem('filtrosAlunos', JSON.stringify(filtrosAlunos));}

async function carregarTurmas(){
  try{
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtrosTurmas.busca) params.append('search', filtrosTurmas.busca);
    
    const response = await fetch(`${API_BASE_URL}/turmas?${params}`);
    if(!response.ok) throw new Error('Erro ao carregar turmas');
    turmas = await response.json();
    renderizarTurmas();
    atualizarFiltroTurmasAlunos();
  }catch(error){
    console.error('Erro ao carregar turmas:', error);
    mostrarToast('Erro ao carregar turmas', 'error');
  }finally{
    esconderLoading();
  }
}

async function carregarAlunos(){
  try{
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtrosAlunos.busca) params.append('search', filtrosAlunos.busca);
    if(filtrosAlunos.turma_id) params.append('turma_id', filtrosAlunos.turma_id);
    if(filtrosAlunos.status) params.append('status', filtrosAlunos.status);
    
    const response = await fetch(`${API_BASE_URL}/alunos?${params}`);
    if(!response.ok) throw new Error('Erro ao carregar alunos');
    alunos = await response.json();
    renderizarAlunos();
  }catch(error){
    console.error('Erro ao carregar alunos:', error);
    mostrarToast('Erro ao carregar alunos', 'error');
  }finally{
    esconderLoading();
  }
}

function atualizarFiltroTurmasAlunos(){
  const select = document.getElementById('alunoTurmaFilter');
  const selectModal = document.getElementById('alunoTurma');
  
  // Limpar opções existentes (exceto "Todas as turmas" no filtro)
  select.innerHTML = '<option value="">Todas as turmas</option>';
  selectModal.innerHTML = '<option value="">Sem turma</option>';
  
  turmas.forEach(turma => {
    const option1 = document.createElement('option');
    option1.value = turma.id;
    option1.textContent = turma.nome;
    select.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = turma.id;
    option2.textContent = turma.nome;
    selectModal.appendChild(option2);
  });
}

function renderizarTurmas(){
  const grid = document.getElementById('turmasGrid');
  const turmasFiltradas = filtrarTurmas();
  const turmasOrdenadas = ordenarTurmas(turmasFiltradas);
  const { items: turmasPaginadas, totalPages } = paginarItems(turmasOrdenadas, paginaAtualTurmas);
  
  if(turmasPaginadas.length === 0){
    grid.innerHTML = '<div class="empty-state">Nenhuma turma encontrada</div>';
    document.getElementById('turmasPagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = turmasPaginadas.map(turma => `
    <div class="turma-card">
      <div class="turma-header">
        <h3>${escapeHtml(turma.nome)}</h3>
        <div class="turma-capacidade">
          <span class="capacidade-atual">${turma.alunos_matriculados || 0}</span>
          <span class="capacidade-total">/${turma.capacidade}</span>
        </div>
      </div>
      <div class="turma-info">
        <div class="turma-stat">
          <span class="stat-label">Vagas disponíveis:</span>
          <span class="stat-value">${turma.capacidade - (turma.alunos_matriculados || 0)}</span>
        </div>
        <div class="turma-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((turma.alunos_matriculados || 0) / turma.capacidade * 100)}%"></div>
          </div>
        </div>
      </div>
      ${usuario?.is_admin ? `
        <div class="turma-actions">
          <button onclick="editarTurma(${turma.id})" class="btn-edit">✏️ Editar</button>
          <button onclick="deletarTurma(${turma.id})" class="btn-delete">🗑️ Excluir</button>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  renderizarPaginacao('turmasPagination', paginaAtualTurmas, totalPages, (page) => {
    paginaAtualTurmas = page;
    renderizarTurmas();
  });
}

function renderizarAlunos(){
  const grid = document.getElementById('alunosGrid');
  const alunosFiltrados = filtrarAlunos();
  const alunosOrdenados = ordenarAlunos(alunosFiltrados);
  const { items: alunosPaginados, totalPages } = paginarItems(alunosOrdenados, paginaAtualAlunos);
  
  if(alunosPaginados.length === 0){
    grid.innerHTML = '<div class="empty-state">Nenhum aluno encontrado</div>';
    document.getElementById('alunosPagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = alunosPaginados.map(aluno => {
    const turma = turmas.find(t => t.id === aluno.turma_id);
    const idade = calcularIdade(aluno.data_nascimento);
    
    return `
      <div class="aluno-card">
        <div class="aluno-header">
          <h3>${escapeHtml(aluno.nome)}</h3>
          <span class="aluno-status ${aluno.ativo ? 'ativo' : 'inativo'}">
            ${aluno.ativo ? '✅ Ativo' : '❌ Inativo'}
          </span>
        </div>
        <div class="aluno-info">
          <div class="aluno-detail">
            <span class="detail-label">Idade:</span>
            <span class="detail-value">${idade} anos</span>
          </div>
          <div class="aluno-detail">
            <span class="detail-label">Turma:</span>
            <span class="detail-value">${turma ? escapeHtml(turma.nome) : 'Sem turma'}</span>
          </div>
          ${aluno.email ? `
            <div class="aluno-detail">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${escapeHtml(aluno.email)}</span>
            </div>
          ` : ''}
        </div>
        ${usuario?.is_admin ? `
          <div class="aluno-actions">
            <button onclick="editarAluno(${aluno.id})" class="btn-edit">✏️ Editar</button>
            <button onclick="deletarAluno(${aluno.id})" class="btn-delete">🗑️ Excluir</button>
            ${turma ? `
              <button onclick="desmatricularAluno(${aluno.id})" class="btn-secondary">📤 Desmatricular</button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  renderizarPaginacao('alunosPagination', paginaAtualAlunos, totalPages, (page) => {
    paginaAtualAlunos = page;
    renderizarAlunos();
  });
}

function filtrarTurmas(){
  return turmas.filter(turma => {
    const matchBusca = !filtrosTurmas.busca || 
      turma.nome.toLowerCase().includes(filtrosTurmas.busca.toLowerCase());
    return matchBusca;
  });
}

function filtrarAlunos(){
  return alunos.filter(aluno => {
    const matchBusca = !filtrosAlunos.busca || 
      aluno.nome.toLowerCase().includes(filtrosAlunos.busca.toLowerCase()) ||
      (aluno.email && aluno.email.toLowerCase().includes(filtrosAlunos.busca.toLowerCase()));
    
    const matchTurma = !filtrosAlunos.turma_id || 
      aluno.turma_id?.toString() === filtrosAlunos.turma_id;
    
    const matchStatus = !filtrosAlunos.status || 
      (filtrosAlunos.status === 'ativo' && aluno.ativo) ||
      (filtrosAlunos.status === 'inativo' && !aluno.ativo);
    
    return matchBusca && matchTurma && matchStatus;
  });
}

function ordenarTurmas(turmas){
  const [campo, direcao] = filtrosTurmas.ordenacao.split('-');
  return [...turmas].sort((a, b) => {
    let valorA, valorB;
    
    switch(campo){
      case 'nome':
        valorA = a.nome.toLowerCase();
        valorB = b.nome.toLowerCase();
        break;
      case 'capacidade':
        valorA = a.capacidade;
        valorB = b.capacidade;
        break;
      default:
        return 0;
    }
    
    if(valorA < valorB) return direcao === 'asc' ? -1 : 1;
    if(valorA > valorB) return direcao === 'asc' ? 1 : -1;
    return 0;
  });
}

function ordenarAlunos(alunos){
  const [campo, direcao] = filtrosAlunos.ordenacao.split('-');
  return [...alunos].sort((a, b) => {
    let valorA, valorB;
    
    switch(campo){
      case 'nome':
        valorA = a.nome.toLowerCase();
        valorB = b.nome.toLowerCase();
        break;
      case 'data_nascimento':
        valorA = new Date(a.data_nascimento);
        valorB = new Date(b.data_nascimento);
        break;
      default:
        return 0;
    }
    
    if(valorA < valorB) return direcao === 'asc' ? -1 : 1;
    if(valorA > valorB) return direcao === 'asc' ? 1 : -1;
    return 0;
  });
}

function calcularIdade(dataNascimento){
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  if(mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())){
    idade--;
  }
  
  return idade;
}

// ===== ADVANCED FILTERS =====
function toggleAdvancedFilters() {
  const advancedFilters = document.getElementById('advancedFilters');
  const toggleBtn = document.getElementById('toggleAdvancedFilters');
  
  filtrosAvancados = !filtrosAvancados;
  
  if (filtrosAvancados) {
    advancedFilters.style.display = 'block';
    toggleBtn.textContent = '🔍 Ocultar Filtros';
    toggleBtn.setAttribute('aria-expanded', 'true');
  } else {
    advancedFilters.style.display = 'none';
    toggleBtn.textContent = '🔍 Filtros Avançados';
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
}

function applyAdvancedFilters() {
  const precoMin = document.getElementById('precoMinFilter').value;
  const precoMax = document.getElementById('precoMaxFilter').value;
  const estoqueMin = document.getElementById('estoqueMinFilter').value;
  
  // Validações
  if (precoMin && precoMax && parseFloat(precoMin) > parseFloat(precoMax)) {
    mostrarToast('Preço mínimo não pode ser maior que o máximo', 'error');
    return;
  }
  
  filtros.precoMin = precoMin;
  filtros.precoMax = precoMax;
  filtros.estoqueMin = estoqueMin;
  
  paginaAtual = 1;
  aplicarFiltrosLocais();
  salvarFiltros();
  
  mostrarToast('Filtros avançados aplicados!', 'success');
}

function clearAdvancedFilters() {
  document.getElementById('precoMinFilter').value = '';
  document.getElementById('precoMaxFilter').value = '';
  document.getElementById('estoqueMinFilter').value = '';
  
  filtros.precoMin = '';
  filtros.precoMax = '';
  filtros.estoqueMin = '';
  
  paginaAtual = 1;
  aplicarFiltrosLocais();
  salvarFiltros();
  
  mostrarToast('Filtros avançados limpos!', 'info');
}

function aplicarFiltrosLocais() {
  let produtosFiltrados = [...produtos];
  
  // Filtro de busca
  if (filtros.busca) {
    const busca = filtros.busca.toLowerCase();
    produtosFiltrados = produtosFiltrados.filter(p => 
      p.nome.toLowerCase().includes(busca) ||
      (p.descricao && p.descricao.toLowerCase().includes(busca)) ||
      (p.sku && p.sku.toLowerCase().includes(busca))
    );
  }
  
  // Filtro de categoria
  if (filtros.categoria) {
    produtosFiltrados = produtosFiltrados.filter(p => p.categoria === filtros.categoria);
  }
  
  // Filtros avançados
  if (filtros.precoMin) {
    produtosFiltrados = produtosFiltrados.filter(p => p.preco >= parseFloat(filtros.precoMin));
  }
  
  if (filtros.precoMax) {
    produtosFiltrados = produtosFiltrados.filter(p => p.preco <= parseFloat(filtros.precoMax));
  }
  
  if (filtros.estoqueMin) {
    produtosFiltrados = produtosFiltrados.filter(p => p.estoque >= parseInt(filtros.estoqueMin));
  }
  
  // Ordenação
  const [campo, direcao] = filtros.ordenacao.split('-');
  produtosFiltrados.sort((a, b) => {
    let valorA = a[campo];
    let valorB = b[campo];
    
    if (typeof valorA === 'string') {
      valorA = valorA.toLowerCase();
      valorB = valorB.toLowerCase();
    }
    
    if (direcao === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });
  
  // Paginação
  totalPaginas = Math.ceil(produtosFiltrados.length / ITEMS_PER_PAGE);
  const inicio = (paginaAtual - 1) * ITEMS_PER_PAGE;
  const produtosPaginados = produtosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  
  renderizarProdutos(produtosPaginados);
  renderizarPaginacao();
}

// ===== EXPORT FUNCTIONS =====
async function exportarCSV() {
  if (!usuario?.is_admin) {
    mostrarToast('Acesso negado', 'error');
    return;
  }
  
  try {
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtros.busca) params.append('search', filtros.busca);
    if(filtros.categoria) params.append('categoria', filtros.categoria);
    params.append('sort', filtros.ordenacao);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/produtos/export/csv?${params}`);
    if (!response.ok) throw new Error('Erro ao exportar CSV');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarToast('CSV exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    mostrarToast('Erro ao exportar CSV', 'error');
  } finally {
    esconderLoading();
  }
}

async function exportarJSON() {
  if (!usuario?.is_admin) {
    mostrarToast('Acesso negado', 'error');
    return;
  }
  
  try {
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtros.busca) params.append('search', filtros.busca);
    if(filtros.categoria) params.append('categoria', filtros.categoria);
    params.append('sort', filtros.ordenacao);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/produtos/export/json?${params}`);
    if (!response.ok) throw new Error('Erro ao exportar JSON');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarToast('JSON exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar JSON:', error);
    mostrarToast('Erro ao exportar JSON', 'error');
  } finally {
    esconderLoading();
  }
}

// ===== ADMIN TURMAS =====
function abrirAdminTurma(turmaId = null) {
  if (!usuario?.is_admin) {
    mostrarToast('Acesso negado', 'error');
    return;
  }
  
  editandoTurma = turmaId;
  const modal = document.getElementById('adminTurmaModal');
  const form = document.getElementById('turmaForm');
  const titulo = modal.querySelector('h2');
  
  form.reset();
  limparErros(['turmaNome', 'turmaCapacidade']);
  
  if (turmaId) {
    const turma = turmas.find(t => t.id === turmaId);
    if (turma) {
      titulo.textContent = 'Editar turma';
      document.getElementById('turmaNome').value = turma.nome;
      document.getElementById('turmaCapacidade').value = turma.capacidade;
    }
  } else {
    titulo.textContent = 'Nova turma';
  }
  
  modal.style.display = 'flex';
  document.getElementById('turmaNome').focus();
}

function fecharAdminTurma() {
  document.getElementById('adminTurmaModal').style.display = 'none';
  editandoTurma = null;
}

function cancelarEdicaoTurma() {
  fecharAdminTurma();
}

async function salvarTurma(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const turmaData = {
    nome: formData.get('nome').trim(),
    capacidade: parseInt(formData.get('capacidade'))
  };
  
  // Validações
  const erros = {};
  if (!turmaData.nome || turmaData.nome.length < 3) {
    erros.turmaNome = 'Nome deve ter pelo menos 3 caracteres';
  }
  if (!turmaData.capacidade || turmaData.capacidade < 1 || turmaData.capacidade > 50) {
    erros.turmaCapacidade = 'Capacidade deve ser entre 1 e 50';
  }
  
  if (Object.keys(erros).length > 0) {
    mostrarErros(erros);
    return;
  }
  
  try {
    mostrarLoading();
    
    const url = editandoTurma 
      ? `${API_BASE_URL}/turmas/${editandoTurma}`
      : `${API_BASE_URL}/turmas`;
    
    const method = editandoTurma ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turmaData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao salvar turma');
    }
    
    const turma = await response.json();
    
    if (editandoTurma) {
      const index = turmas.findIndex(t => t.id === editandoTurma);
      if (index !== -1) turmas[index] = turma;
      mostrarToast('Turma atualizada com sucesso!', 'success');
    } else {
      turmas.push(turma);
      mostrarToast('Turma criada com sucesso!', 'success');
    }
    
    renderizarTurmas();
    atualizarFiltroTurmasAlunos();
    fecharAdminTurma();
    
  } catch (error) {
    console.error('Erro ao salvar turma:', error);
    mostrarToast(error.message, 'error');
  } finally {
    esconderLoading();
  }
}

async function editarTurma(turmaId) {
  abrirAdminTurma(turmaId);
}

async function deletarTurma(turmaId) {
  const turma = turmas.find(t => t.id === turmaId);
  if (!turma) return;
  
  if (!confirm(`Tem certeza que deseja excluir a turma "${turma.nome}"?`)) {
    return;
  }
  
  try {
    mostrarLoading();
    
    const response = await fetchWithAuth(`${API_BASE_URL}/turmas/${turmaId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao excluir turma');
    }
    
    turmas = turmas.filter(t => t.id !== turmaId);
    renderizarTurmas();
    atualizarFiltroTurmasAlunos();
    mostrarToast('Turma excluída com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao excluir turma:', error);
    mostrarToast(error.message, 'error');
  } finally {
    esconderLoading();
  }
}

// ===== ADMIN ALUNOS =====
function abrirAdminAluno(alunoId = null) {
  if (!usuario?.is_admin) {
    mostrarToast('Acesso negado', 'error');
    return;
  }
  
  editandoAluno = alunoId;
  const modal = document.getElementById('adminAlunoModal');
  const form = document.getElementById('alunoForm');
  const titulo = modal.querySelector('h2');
  
  form.reset();
  limparErros(['alunoNome', 'alunoDataNascimento']);
  
  if (alunoId) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) {
      titulo.textContent = 'Editar aluno';
      document.getElementById('alunoNome').value = aluno.nome;
      document.getElementById('alunoDataNascimento').value = aluno.data_nascimento;
      document.getElementById('alunoEmail').value = aluno.email || '';
      document.getElementById('alunoTurma').value = aluno.turma_id || '';
    }
  } else {
    titulo.textContent = 'Novo aluno';
  }
  
  modal.style.display = 'flex';
  document.getElementById('alunoNome').focus();
}

function fecharAdminAluno() {
  document.getElementById('adminAlunoModal').style.display = 'none';
  editandoAluno = null;
}

function cancelarEdicaoAluno() {
  fecharAdminAluno();
}

async function salvarAluno(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const alunoData = {
    nome: formData.get('nome').trim(),
    data_nascimento: formData.get('data_nascimento'),
    email: formData.get('email')?.trim() || null,
    turma_id: formData.get('turma_id') ? parseInt(formData.get('turma_id')) : null
  };
  
  // Validações
  const erros = {};
  if (!alunoData.nome || alunoData.nome.length < 3) {
    erros.alunoNome = 'Nome deve ter pelo menos 3 caracteres';
  }
  if (!alunoData.data_nascimento) {
    erros.alunoDataNascimento = 'Data de nascimento é obrigatória';
  }
  
  if (Object.keys(erros).length > 0) {
    mostrarErros(erros);
    return;
  }
  
  try {
    mostrarLoading();
    
    const url = editandoAluno 
      ? `${API_BASE_URL}/alunos/${editandoAluno}`
      : `${API_BASE_URL}/alunos`;
    
    const method = editandoAluno ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alunoData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao salvar aluno');
    }
    
    const aluno = await response.json();
    
    if (editandoAluno) {
      const index = alunos.findIndex(a => a.id === editandoAluno);
      if (index !== -1) alunos[index] = aluno;
      mostrarToast('Aluno atualizado com sucesso!', 'success');
    } else {
      alunos.push(aluno);
      mostrarToast('Aluno criado com sucesso!', 'success');
    }
    
    renderizarAlunos();
    carregarTurmas(); // Recarregar para atualizar contadores
    fecharAdminAluno();
    
  } catch (error) {
    console.error('Erro ao salvar aluno:', error);
    mostrarToast(error.message, 'error');
  } finally {
    esconderLoading();
  }
}

async function editarAluno(alunoId) {
  abrirAdminAluno(alunoId);
}

async function deletarAluno(alunoId) {
  const aluno = alunos.find(a => a.id === alunoId);
  if (!aluno) return;
  
  if (!confirm(`Tem certeza que deseja excluir o aluno "${aluno.nome}"?`)) {
    return;
  }
  
  try {
    mostrarLoading();
    
    const response = await fetchWithAuth(`${API_BASE_URL}/alunos/${alunoId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao excluir aluno');
    }
    
    alunos = alunos.filter(a => a.id !== alunoId);
    renderizarAlunos();
    carregarTurmas(); // Recarregar para atualizar contadores
    mostrarToast('Aluno excluído com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao excluir aluno:', error);
    mostrarToast(error.message, 'error');
  } finally {
    esconderLoading();
  }
}

async function desmatricularAluno(alunoId) {
  const aluno = alunos.find(a => a.id === alunoId);
  if (!aluno) return;
  
  if (!confirm(`Tem certeza que deseja desmatricular o aluno "${aluno.nome}"?`)) {
    return;
  }
  
  try {
    mostrarLoading();
    
    const response = await fetchWithAuth(`${API_BASE_URL}/alunos/${alunoId}/desmatricular`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao desmatricular aluno');
    }
    
    const alunoAtualizado = await response.json();
    const index = alunos.findIndex(a => a.id === alunoId);
    if (index !== -1) alunos[index] = alunoAtualizado;
    
    renderizarAlunos();
    carregarTurmas(); // Recarregar para atualizar contadores
    mostrarToast('Aluno desmatriculado com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao desmatricular aluno:', error);
    mostrarToast(error.message, 'error');
  } finally {
    esconderLoading();
  }
}

// ===== BIBLIOTECA FUNCTIONS =====
function salvarFiltrosLivros(){ localStorage.setItem('filtrosLivros', JSON.stringify(filtrosLivros));}

function atualizarVisibilidadeAdmin() {
  const isAdmin = usuario?.is_admin;
  document.getElementById('adminBtn').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('exportButtons').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('adminLivroBtn').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('adminTurmaBtn').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('adminAlunoBtn').style.display = isAdmin ? 'block' : 'none';
}

function alternarSecao(secao) {
  // Esconder todas as seções
  document.getElementById('vendasSection').style.display = 'none';
  document.getElementById('bibliotecaSection').style.display = 'none';
  document.getElementById('escolaSection').style.display = 'none';
  
  // Resetar botões
  document.getElementById('bibliotecaBtn').textContent = '📚 Biblioteca';
  document.getElementById('escolaBtn').textContent = '🎓 Escola';
  
  if (secao === 'biblioteca') {
    secaoAtiva = 'biblioteca';
    document.getElementById('bibliotecaSection').style.display = 'block';
    document.getElementById('bibliotecaBtn').textContent = '🛒 Vendas';
    carregarLivros();
  } else if (secao === 'escola') {
    secaoAtiva = 'escola';
    document.getElementById('escolaSection').style.display = 'block';
    document.getElementById('escolaBtn').textContent = '🛒 Vendas';
    carregarTurmas();
    carregarAlunos();
  } else {
    secaoAtiva = 'vendas';
    document.getElementById('vendasSection').style.display = 'block';
  }
}

function alternarSubSecaoEscola(subSecao) {
  subSecaoEscola = subSecao;
  
  // Atualizar tabs
  document.getElementById('turmasTab').classList.toggle('active', subSecao === 'turmas');
  document.getElementById('alunosTab').classList.toggle('active', subSecao === 'alunos');
  
  // Mostrar/esconder subseções
  document.getElementById('turmasSubsection').style.display = subSecao === 'turmas' ? 'block' : 'none';
  document.getElementById('alunosSubsection').style.display = subSecao === 'alunos' ? 'block' : 'none';
  
  if (subSecao === 'turmas') {
    renderizarTurmas();
  } else {
    renderizarAlunos();
  }
}

async function carregarLivros(){
  try{
    mostrarLoading();
    const params = new URLSearchParams();
    if(filtrosLivros.busca) params.append('search', filtrosLivros.busca);
    if(filtrosLivros.genero) params.append('genero', filtrosLivros.genero);
    if(filtrosLivros.status) params.append('status', filtrosLivros.status);
    if(filtrosLivros.ordenacao) params.append('sort', filtrosLivros.ordenacao);
    const res = await fetch(`${API_BASE_URL}/livros?${params.toString()}`);
    if(!res.ok) throw new Error('Falha ao carregar livros');
    livros = await res.json();
    renderizarLivros();
  }catch(err){
    console.error(err); mostrarToast('Erro ao carregar livros.', 'error');
    livros = []; renderizarLivros();
  }finally{ esconderLoading(); }
}

function renderizarLivros(){
  const grid = document.getElementById('booksGrid');
  const totalPaginas = Math.ceil(livros.length / ITEMS_PER_PAGE);
  const inicio = (paginaAtualLivros - 1) * ITEMS_PER_PAGE;
  const livrosPagina = livros.slice(inicio, inicio + ITEMS_PER_PAGE);
  
  if(livrosPagina.length === 0){
    grid.innerHTML = '<div class="empty-state">📚 Nenhum livro encontrado</div>';
  } else {
    grid.innerHTML = livrosPagina.map(livro => `
      <div class="book-card">
        <div class="book-header">
          <h3>${escapeHtml(livro.titulo)}</h3>
          <span class="book-status ${livro.status}">${livro.status === 'disponivel' ? '✅ Disponível' : '📅 Emprestado'}</span>
        </div>
        <div class="book-info">
          <p><strong>Autor:</strong> ${escapeHtml(livro.autor)}</p>
          <p><strong>Ano:</strong> ${livro.ano}</p>
          <p><strong>Gênero:</strong> ${escapeHtml(livro.genero)}</p>
          ${livro.isbn ? `<p><strong>ISBN:</strong> ${escapeHtml(livro.isbn)}</p>` : ''}
          ${livro.data_emprestimo ? `<p><strong>Emprestado em:</strong> ${new Date(livro.data_emprestimo).toLocaleDateString('pt-BR')}</p>` : ''}
        </div>
        <div class="book-actions">
          ${livro.status === 'disponivel' ? 
            `<button onclick="emprestarLivro(${livro.id})" class="btn-emprestar">📤 Emprestar</button>` :
            `<button onclick="devolverLivro(${livro.id})" class="btn-devolver">📥 Devolver</button>`
          }
          ${usuario && usuario.is_admin ? `
            <button onclick="editarLivro(${livro.id})" class="btn-edit">✏️</button>
            <button onclick="deletarLivro(${livro.id})" class="btn-delete">🗑️</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }
  
  renderizarPaginacaoLivros(totalPaginas);
}

function renderizarPaginacaoLivros(totalPaginas){
  const paginacao = document.getElementById('booksPagination');
  if(totalPaginas <= 1){ paginacao.innerHTML = ''; return; }
  
  let html = '';
  for(let i = 1; i <= totalPaginas; i++){
    html += `<button onclick="mudarPaginaLivros(${i})" ${i === paginaAtualLivros ? 'class="active"' : ''}>${i}</button>`;
  }
  paginacao.innerHTML = html;
}

function mudarPaginaLivros(pagina){
  paginaAtualLivros = pagina;
  renderizarLivros();
}

async function emprestarLivro(id){
  try{
    mostrarLoading();
    const res = await fetch(`${API_BASE_URL}/livros/${id}/emprestar`, { method: 'POST' });
    if(!res.ok) throw new Error('Falha ao emprestar livro');
    const result = await res.json();
    mostrarToast(result.message, 'success');
    carregarLivros();
  }catch(err){
    console.error(err); mostrarToast('Erro ao emprestar livro.', 'error');
  }finally{ esconderLoading(); }
}

async function devolverLivro(id){
  try{
    mostrarLoading();
    const res = await fetch(`${API_BASE_URL}/livros/${id}/devolver`, { method: 'POST' });
    if(!res.ok) throw new Error('Falha ao devolver livro');
    const result = await res.json();
    mostrarToast(result.message, 'success');
    carregarLivros();
  }catch(err){
    console.error(err); mostrarToast('Erro ao devolver livro.', 'error');
  }finally{ esconderLoading(); }
}

function abrirAdminLivro(){
  editandoLivro = null;
  document.getElementById('livroForm').reset();
  document.getElementById('adminLivroModal').style.display = 'flex';
  document.getElementById('adminLivroModal').setAttribute('aria-hidden', 'false');
  document.getElementById('titulo').focus();
}

function fecharAdminLivro(){
  document.getElementById('adminLivroModal').style.display = 'none';
  document.getElementById('adminLivroModal').setAttribute('aria-hidden', 'true');
  editandoLivro = null;
}

function cancelarEdicaoLivro(){
  fecharAdminLivro();
}

function editarLivro(id){
  const livro = livros.find(l => l.id === id);
  if(!livro) return;
  editandoLivro = livro;
  document.getElementById('titulo').value = livro.titulo;
  document.getElementById('autor').value = livro.autor;
  document.getElementById('ano').value = livro.ano;
  document.getElementById('genero').value = livro.genero;
  document.getElementById('isbn').value = livro.isbn || '';
  abrirAdminLivro();
}

async function salvarLivro(e){
  e.preventDefault();
  const livro = {
    titulo: document.getElementById('titulo').value.trim(),
    autor: document.getElementById('autor').value.trim(),
    ano: parseInt(document.getElementById('ano').value),
    genero: document.getElementById('genero').value,
    isbn: document.getElementById('isbn').value.trim() || null
  };
  
  try{
    mostrarLoading();
    const url = editandoLivro ? `${API_BASE_URL}/livros/${editandoLivro.id}` : `${API_BASE_URL}/livros`;
    const method = editandoLivro ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(livro)
    });
    if(!res.ok) throw new Error('Falha ao salvar livro');
    mostrarToast(`Livro ${editandoLivro ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    fecharAdminLivro();
    carregarLivros();
  }catch(err){
    console.error(err); mostrarToast('Erro ao salvar livro.', 'error');
  }finally{ esconderLoading(); }
}

async function deletarLivro(id){
  if(!confirm('Tem certeza que deseja excluir este livro?')) return;
  try{
    mostrarLoading();
    const res = await fetch(`${API_BASE_URL}/livros/${id}`, { method: 'DELETE' });
    if(!res.ok) throw new Error('Falha ao excluir livro');
    mostrarToast('Livro excluído com sucesso!', 'success');
    carregarLivros();
  }catch(err){
    console.error(err); mostrarToast('Erro ao excluir livro.', 'error');
  }finally{ esconderLoading(); }
}

// Expose for HTML
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQtd = alterarQtd;
window.editarProduto = editarProduto;
window.mudarPagina = mudarPagina;
window.deletarProduto = deletarProduto;
window.mudarPaginaLivros = mudarPaginaLivros;
window.emprestarLivro = emprestarLivro;
window.devolverLivro = devolverLivro;
window.editarLivro = editarLivro;
window.deletarLivro = deletarLivro;

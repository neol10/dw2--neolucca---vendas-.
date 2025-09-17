from database import Base, engine, SessionLocal
from models import Produto, Livro, Usuario, Turma, Aluno
from auth import gerar_senha_hash
from datetime import date

Base.metadata.create_all(bind=engine)

produtos = [
    {'nome': 'Caderno Universitário', 'descricao': 'Caderno 200 folhas', 'preco': 15.90, 'categoria': 'Papelaria', 'estoque': 50, 'sku': 'CAD001'},
    {'nome': 'Caderno Brochura', 'descricao': 'Caderno 96 folhas', 'preco': 8.50, 'categoria': 'Papelaria', 'estoque': 75, 'sku': 'CAD002'},
    {'nome': 'Caderno Desenho', 'descricao': 'Caderno para desenho A4', 'preco': 12.90, 'categoria': 'Papelaria', 'estoque': 30, 'sku': 'CAD003'},
    {'nome': 'Caneta Azul', 'descricao': 'Caneta esferográfica azul', 'preco': 2.50, 'categoria': 'Papelaria', 'estoque': 100, 'sku': 'CAN001'},
    {'nome': 'Caneta Preta', 'descricao': 'Caneta esferográfica preta', 'preco': 2.50, 'categoria': 'Papelaria', 'estoque': 95, 'sku': 'CAN002'},
    {'nome': 'Caneta Vermelha', 'descricao': 'Caneta esferográfica vermelha', 'preco': 2.50, 'categoria': 'Papelaria', 'estoque': 80, 'sku': 'CAN003'},
    {'nome': 'Lápis HB', 'descricao': 'Lápis grafite HB', 'preco': 1.20, 'categoria': 'Papelaria', 'estoque': 80, 'sku': 'LAP001'},
    {'nome': 'Lápis 2B', 'descricao': 'Lápis grafite 2B', 'preco': 1.30, 'categoria': 'Papelaria', 'estoque': 65, 'sku': 'LAP002'},
    {'nome': 'Lápis de Cor 12 cores', 'descricao': 'Caixa com 12 lápis de cor', 'preco': 18.90, 'categoria': 'Papelaria', 'estoque': 40, 'sku': 'LAP003'},
    {'nome': 'Borracha Branca', 'descricao': 'Borracha escolar branca', 'preco': 1.50, 'categoria': 'Papelaria', 'estoque': 60, 'sku': 'BOR001'},
    {'nome': 'Borracha Colorida', 'descricao': 'Borracha escolar colorida', 'preco': 2.00, 'categoria': 'Papelaria', 'estoque': 45, 'sku': 'BOR002'},
    {'nome': 'Régua 30cm', 'descricao': 'Régua transparente 30cm', 'preco': 3.80, 'categoria': 'Papelaria', 'estoque': 40, 'sku': 'REG001'},
    {'nome': 'Régua 15cm', 'descricao': 'Régua transparente 15cm', 'preco': 2.50, 'categoria': 'Papelaria', 'estoque': 55, 'sku': 'REG002'},
    {'nome': 'Esquadro 45°', 'descricao': 'Esquadro de 45 graus', 'preco': 4.90, 'categoria': 'Papelaria', 'estoque': 25, 'sku': 'ESQ001'},
    {'nome': 'Compasso Escolar', 'descricao': 'Compasso para geometria', 'preco': 12.50, 'categoria': 'Papelaria', 'estoque': 20, 'sku': 'COM001'},
    {'nome': 'Mochila Escolar', 'descricao': 'Mochila com compartimentos', 'preco': 89.90, 'categoria': 'Acessórios', 'estoque': 25, 'sku': 'MOC001'},
    {'nome': 'Mochila Infantil', 'descricao': 'Mochila pequena colorida', 'preco': 65.00, 'categoria': 'Acessórios', 'estoque': 18, 'sku': 'MOC002'},
    {'nome': 'Estojo Duplo', 'descricao': 'Estojo com dois compartimentos', 'preco': 25.50, 'categoria': 'Acessórios', 'estoque': 35, 'sku': 'EST001'},
    {'nome': 'Estojo Simples', 'descricao': 'Estojo básico', 'preco': 15.90, 'categoria': 'Acessórios', 'estoque': 42, 'sku': 'EST002'},
    {'nome': 'Calculadora Científica', 'descricao': 'Calculadora para matemática', 'preco': 45.00, 'categoria': 'Eletrônicos', 'estoque': 20, 'sku': 'CAL001'},
    {'nome': 'Calculadora Básica', 'descricao': 'Calculadora simples', 'preco': 18.50, 'categoria': 'Eletrônicos', 'estoque': 30, 'sku': 'CAL002'},
    {'nome': 'Apontador Simples', 'descricao': 'Apontador de lápis', 'preco': 1.80, 'categoria': 'Papelaria', 'estoque': 70, 'sku': 'APO001'},
    {'nome': 'Apontador com Depósito', 'descricao': 'Apontador com reservatório', 'preco': 3.50, 'categoria': 'Papelaria', 'estoque': 50, 'sku': 'APO002'},
    {'nome': 'Cola Bastão', 'descricao': 'Cola em bastão 20g', 'preco': 4.90, 'categoria': 'Papelaria', 'estoque': 60, 'sku': 'COL001'},
    {'nome': 'Fita Adesiva', 'descricao': 'Fita adesiva transparente', 'preco': 3.20, 'categoria': 'Papelaria', 'estoque': 45, 'sku': 'FIT001'},
]

livros = [
    dict(titulo='Dom Casmurro', autor='Machado de Assis', ano=1899, genero='Romance', isbn='978-85-359-0277-5'),
    dict(titulo='O Cortiço', autor='Aluísio Azevedo', ano=1890, genero='Romance', isbn='978-85-359-0123-5'),
    dict(titulo='Iracema', autor='José de Alencar', ano=1865, genero='Romance', isbn='978-85-359-0456-4'),
    dict(titulo='O Guarani', autor='José de Alencar', ano=1857, genero='Romance', isbn='978-85-359-0789-3'),
    dict(titulo='Senhora', autor='José de Alencar', ano=1875, genero='Romance', isbn='978-85-359-0234-8'),
    dict(titulo='Memórias Póstumas de Brás Cubas', autor='Machado de Assis', ano=1881, genero='Romance', isbn='978-85-359-0567-7'),
    dict(titulo='O Ateneu', autor='Raul Pompéia', ano=1888, genero='Romance', isbn='978-85-359-0678-9'),
    dict(titulo='Casa Grande & Senzala', autor='Gilberto Freyre', ano=1933, genero='Sociologia', isbn='978-85-359-0890-5'),
    dict(titulo='Capitães da Areia', autor='Jorge Amado', ano=1937, genero='Romance', isbn='978-85-359-0345-2'),
    dict(titulo='Vidas Secas', autor='Graciliano Ramos', ano=1938, genero='Romance', isbn='978-85-359-0456-1'),
    dict(titulo='O Auto da Compadecida', autor='Ariano Suassuna', ano=1955, genero='Teatro', isbn='978-85-359-0567-4'),
    dict(titulo='Quincas Borba', autor='Machado de Assis', ano=1891, genero='Romance', isbn='978-85-359-0678-2'),
    dict(titulo='A Moreninha', autor='Joaquim Manuel de Macedo', ano=1844, genero='Romance', isbn='978-85-359-0789-6'),
    dict(titulo='Lucíola', autor='José de Alencar', ano=1862, genero='Romance', isbn='978-85-359-0890-8'),
    dict(titulo='Helena', autor='Machado de Assis', ano=1876, genero='Romance', isbn='978-85-359-0123-9'),
    dict(titulo='A Escrava Isaura', autor='Bernardo Guimarães', ano=1875, genero='Romance', isbn='978-85-359-0234-1'),
    dict(titulo='O Mulato', autor='Aluísio Azevedo', ano=1881, genero='Romance', isbn='978-85-359-0345-5'),
    dict(titulo='Ubirajara', autor='José de Alencar', ano=1874, genero='Romance', isbn='978-85-359-0456-7'),
    dict(titulo='Til', autor='José de Alencar', ano=1872, genero='Romance', isbn='978-85-359-0567-1'),
    dict(titulo='Ressurreição', autor='Machado de Assis', ano=1872, genero='Romance', isbn='978-85-359-0678-5'),
    dict(titulo='A Mão e a Luva', autor='Machado de Assis', ano=1874, genero='Romance', isbn='978-85-359-0789-9'),
    dict(titulo='Cinco Minutos', autor='José de Alencar', ano=1856, genero='Romance', isbn='978-85-359-0890-2'),
]

usuarios = [
    dict(nome='Neo Lucca Viana e Silva', email='neo.lucca@escola.com', senha_hash=gerar_senha_hash('123456'), is_admin=True),
    dict(nome='Admin Sistema', email='admin@escola.com', senha_hash=gerar_senha_hash('admin123'), is_admin=True),
    dict(nome='Bibliotecário', email='biblioteca@escola.com', senha_hash=gerar_senha_hash('biblio123'), is_admin=False),
]

turmas = [
    dict(nome='1º Ano A', capacidade=30),
    dict(nome='1º Ano B', capacidade=28),
    dict(nome='2º Ano A', capacidade=32),
    dict(nome='2º Ano B', capacidade=30),
    dict(nome='3º Ano A', capacidade=25),
    dict(nome='3º Ano B', capacidade=27),
    dict(nome='Pré-Vestibular', capacidade=40),
    dict(nome='Técnico em Informática', capacidade=35),
]

alunos = [
    dict(nome='Ana Silva Santos', data_nascimento=date(2007, 3, 15), email='ana.silva@email.com'),
    dict(nome='Bruno Costa Lima', data_nascimento=date(2006, 8, 22), email='bruno.costa@email.com'),
    dict(nome='Carla Oliveira', data_nascimento=date(2007, 1, 10), email='carla.oliveira@email.com'),
    dict(nome='Daniel Ferreira', data_nascimento=date(2006, 11, 5), email='daniel.ferreira@email.com'),
    dict(nome='Eduarda Mendes', data_nascimento=date(2007, 6, 18), email='eduarda.mendes@email.com'),
    dict(nome='Felipe Rodrigues', data_nascimento=date(2006, 4, 30), email='felipe.rodrigues@email.com'),
    dict(nome='Gabriela Alves', data_nascimento=date(2007, 9, 12), email='gabriela.alves@email.com'),
    dict(nome='Henrique Barbosa', data_nascimento=date(2006, 2, 25), email='henrique.barbosa@email.com'),
    dict(nome='Isabela Cardoso', data_nascimento=date(2007, 7, 8), email='isabela.cardoso@email.com'),
    dict(nome='João Pedro Souza', data_nascimento=date(2006, 12, 14), email='joao.souza@email.com'),
    dict(nome='Larissa Martins', data_nascimento=date(2007, 5, 3), email='larissa.martins@email.com'),
    dict(nome='Mateus Pereira', data_nascimento=date(2006, 10, 20), email='mateus.pereira@email.com'),
    dict(nome='Natália Gomes', data_nascimento=date(2007, 4, 17), email='natalia.gomes@email.com'),
    dict(nome='Otávio Ribeiro', data_nascimento=date(2006, 9, 7), email='otavio.ribeiro@email.com'),
    dict(nome='Priscila Dias', data_nascimento=date(2007, 2, 28), email='priscila.dias@email.com'),
    dict(nome='Rafael Nascimento', data_nascimento=date(2006, 6, 11), email='rafael.nascimento@email.com'),
    dict(nome='Sofia Araújo', data_nascimento=date(2007, 11, 24), email='sofia.araujo@email.com'),
    dict(nome='Thiago Moreira', data_nascimento=date(2006, 1, 16), email='thiago.moreira@email.com'),
    dict(nome='Vitória Campos', data_nascimento=date(2007, 8, 9), email='vitoria.campos@email.com'),
    dict(nome='Wesley Teixeira', data_nascimento=date(2006, 3, 2), email='wesley.teixeira@email.com'),
]

db = SessionLocal()

# Seed produtos
if db.query(Produto).count() == 0:
    for it in itens:
        db.add(Produto(**it))
    db.commit()
    print('Banco populado com produtos iniciais.')
else:
    print('Produtos já existem.')

# Seed livros
if db.query(Livro).count() == 0:
    for livro in livros:
        db.add(Livro(**livro))
    db.commit()
    print('Banco populado com livros iniciais.')
else:
    print('Livros já existem.')

# Seed usuários
if db.query(Usuario).count() == 0:
    for usuario in usuarios:
        db.add(Usuario(**usuario))
    db.commit()
    print('Banco populado com usuários iniciais.')
else:
    print('Usuários já existem.')

# Seed turmas
if db.query(Turma).count() == 0:
    for turma in turmas:
        db.add(Turma(**turma))
    db.commit()
    print('Banco populado com turmas iniciais.')
else:
    print('Turmas já existem.')

# Seed alunos
if db.query(Aluno).count() == 0:
    # Criar alunos sem turma inicialmente
    for aluno in alunos:
        db.add(Aluno(**aluno))
    db.commit()
    
    # Matricular alguns alunos em turmas (respeitando capacidade)
    turmas_db = db.query(Turma).all()
    alunos_db = db.query(Aluno).all()
    
    # Matricular primeiros alunos nas primeiras turmas
    for i, aluno in enumerate(alunos_db[:15]):  # Matricular 15 dos 20 alunos
        turma_idx = i % len(turmas_db)  # Distribuir entre as turmas
        aluno.turma_id = turmas_db[turma_idx].id
    
    db.commit()
    print('Banco populado com alunos iniciais.')
else:
    print('Alunos já existem.')

db.close()

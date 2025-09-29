from database import Base, engine, SessionLocal
from models import Produto

Base.metadata.create_all(bind=engine)

# Lista expandida: 10 itens por categoria
produtos = [
    # MATERIAL ESCOLAR (10)
    {"nome":"Caderno Universitário 10 Matérias","descricao":"Capa dura","preco":29.90,"estoque":60,"categoria":"material-escolar","sku":"MAT-CAD001","imagem_url":"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Caderno Brochura 96fl","descricao":"Pautado","preco":12.90,"estoque":80,"categoria":"material-escolar","sku":"MAT-CAD002","imagem_url":"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Estojo Duplo","descricao":"Poliéster resistente","preco":39.90,"estoque":45,"categoria":"material-escolar","sku":"MAT-EST001","imagem_url":"https://images.unsplash.com/photo-1514477917009-389c76a86b68?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Mochila Escolar","descricao":"Impermeável","preco":149.90,"estoque":25,"categoria":"material-escolar","sku":"MAT-MOC001","imagem_url":"https://images.unsplash.com/photo-1596495578065-8a6c69fca2b9?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Lápis HB nº2 (12un)","descricao":"Madeira reflorestada","preco":9.90,"estoque":120,"categoria":"material-escolar","sku":"MAT-LAP001","imagem_url":"https://images.unsplash.com/photo-1502452213786-a5bc0a67e963?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Caneta Esferográfica Azul (3un)","descricao":"Ponta 1.0mm","preco":7.90,"estoque":150,"categoria":"material-escolar","sku":"MAT-CAN001","imagem_url":"https://images.unsplash.com/photo-1527176930608-09cb256ab504?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Borracha Branca","descricao":"Não mancha","preco":3.90,"estoque":200,"categoria":"material-escolar","sku":"MAT-BOR001","imagem_url":"https://images.unsplash.com/photo-1624001553151-1edb8314f49e?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Apontador com Depósito","descricao":"Lâmina de aço","preco":4.90,"estoque":180,"categoria":"material-escolar","sku":"MAT-APO001","imagem_url":"https://images.unsplash.com/photo-1624001368394-23d05345d022?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Régua 30cm","descricao":"Acrílico","preco":5.90,"estoque":140,"categoria":"material-escolar","sku":"MAT-REG001","imagem_url":"https://images.unsplash.com/photo-1615486364469-d6f6f3d7cf19?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Cola Branca 90g","descricao":"Atóxica","preco":6.90,"estoque":130,"categoria":"material-escolar","sku":"MAT-COL001","imagem_url":"https://images.unsplash.com/photo-1598184277221-37ca0e05b9f2?auto=format&fit=crop&w=900&q=60"},

    # LIVROS (10)
    {"nome":"Atlas de Ciências","descricao":"Ilustrado","preco":89.90,"estoque":18,"categoria":"livros","sku":"LIV-001","imagem_url":"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Gramática Essencial","descricao":"Ensino médio","preco":59.90,"estoque":30,"categoria":"livros","sku":"LIV-002","imagem_url":"https://images.unsplash.com/photo-1513791055331-36f41e0b9a5e?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Matemática em Exercícios","descricao":"Volume 1","preco":64.90,"estoque":22,"categoria":"livros","sku":"LIV-003","imagem_url":"https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=60"},
    {"nome":"História do Brasil","descricao":"Edição atualizada","preco":72.90,"estoque":20,"categoria":"livros","sku":"LIV-004","imagem_url":"https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Química Fácil","descricao":"Teoria e prática","preco":54.90,"estoque":26,"categoria":"livros","sku":"LIV-005","imagem_url":"https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Física Essencial","descricao":"Fundamentos","preco":61.90,"estoque":24,"categoria":"livros","sku":"LIV-006","imagem_url":"https://images.unsplash.com/photo-1543106443-812715ff2b8b?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Biologia Ilustrada","descricao":"Sistemas do corpo","preco":78.90,"estoque":19,"categoria":"livros","sku":"LIV-007","imagem_url":"https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Geografia Contemporânea","descricao":"Globalização","preco":57.90,"estoque":28,"categoria":"livros","sku":"LIV-008","imagem_url":"https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Literatura Brasileira","descricao":"Clássicos","preco":45.90,"estoque":35,"categoria":"livros","sku":"LIV-009","imagem_url":"https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Inglês para Estudantes","descricao":"Básico ao intermediário","preco":69.90,"estoque":27,"categoria":"livros","sku":"LIV-010","imagem_url":"https://images.unsplash.com/photo-1474904200416-6b2b7926f789?auto=format&fit=crop&w=900&q=60"},

    # UNIFORMES (10)
    {"nome":"Camiseta Escolar","descricao":"Malha fria","preco":39.90,"estoque":70,"categoria":"uniformes","sku":"UNI-001","imagem_url":"https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Calça Moletom","descricao":"Com punho","preco":69.90,"estoque":40,"categoria":"uniformes","sku":"UNI-002","imagem_url":"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Agasalho Escolar","descricao":"Jaqueta + Calça","preco":189.90,"estoque":20,"categoria":"uniformes","sku":"UNI-003","imagem_url":"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Bermuda Escolar","descricao":"Tecido leve","preco":49.90,"estoque":50,"categoria":"uniformes","sku":"UNI-004","imagem_url":"https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Meias (par)","descricao":"Algodão","preco":12.90,"estoque":100,"categoria":"uniformes","sku":"UNI-005","imagem_url":"https://images.unsplash.com/photo-1628453910169-4a5c4e18b820?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Tênis Escolar","descricao":"Solado antiderrapante","preco":199.90,"estoque":18,"categoria":"uniformes","sku":"UNI-006","imagem_url":"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Boné Escolar","descricao":"Ajustável","preco":29.90,"estoque":60,"categoria":"uniformes","sku":"UNI-007","imagem_url":"https://images.unsplash.com/photo-1520975922325-24baf02c8f9b?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Camiseta Manga Longa","descricao":"Conforto térmico","preco":54.90,"estoque":35,"categoria":"uniformes","sku":"UNI-008","imagem_url":"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Saia Escolar","descricao":"Modelo plissado","preco":79.90,"estoque":22,"categoria":"uniformes","sku":"UNI-009","imagem_url":"https://images.unsplash.com/photo-1542718610-a1d656d1884a?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Cardigã Escolar","descricao":"Tricô","preco":119.90,"estoque":15,"categoria":"uniformes","sku":"UNI-010","imagem_url":"https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=900&q=60"},

    # TECNOLOGIA (10)
    {"nome":"Fone Bluetooth","descricao":"Over-ear","preco":199.90,"estoque":15,"categoria":"tecnologia","sku":"TEC-001","imagem_url":"https://images.unsplash.com/photo-1518443882834-96f9f2f3a734?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Mouse sem fio","descricao":"1600dpi","preco":59.90,"estoque":50,"categoria":"tecnologia","sku":"TEC-002","imagem_url":"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Teclado compacto","descricao":"ABNT2","preco":119.90,"estoque":20,"categoria":"tecnologia","sku":"TEC-003","imagem_url":"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Pendrive 64GB","descricao":"USB 3.1","preco":39.90,"estoque":100,"categoria":"tecnologia","sku":"TEC-004","imagem_url":"https://images.unsplash.com/photo-1587213811864-46e59f02a2c2?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Carregador 2xUSB 20W","descricao":"Bivolt","preco":69.90,"estoque":40,"categoria":"tecnologia","sku":"TEC-005","imagem_url":"https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Cabo HDMI 2.0 2m","descricao":"4K","preco":29.90,"estoque":80,"categoria":"tecnologia","sku":"TEC-006","imagem_url":"https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Webcam HD","descricao":"Microfone embutido","preco":149.90,"estoque":25,"categoria":"tecnologia","sku":"TEC-007","imagem_url":"https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Caixa de Som Bluetooth","descricao":"Portátil","preco":129.90,"estoque":30,"categoria":"tecnologia","sku":"TEC-008","imagem_url":"https://images.unsplash.com/photo-1490376840453-5f616fbebe5b?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Power Bank 10.000mAh","descricao":"USB-C","preco":159.90,"estoque":22,"categoria":"tecnologia","sku":"TEC-009","imagem_url":"https://images.unsplash.com/photo-1541976076758-347942db1970?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Headset com Microfone","descricao":"Cancelamento de ruído","preco":219.90,"estoque":18,"categoria":"tecnologia","sku":"TEC-010","imagem_url":"https://images.unsplash.com/photo-1606229365485-93a3b8ee0381?auto=format&fit=crop&w=900&q=60"},

    # ARTE & PAPÉIS (10)
    {"nome":"Tinta Guache 6 cores","descricao":"Lavável","preco":24.90,"estoque":60,"categoria":"arte-papeis","sku":"ART-001","imagem_url":"https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Pincel nº 12","descricao":"Cerdas macias","preco":8.90,"estoque":120,"categoria":"arte-papeis","sku":"ART-002","imagem_url":"https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Papel A4 500fl","descricao":"75g/m²","preco":32.90,"estoque":35,"categoria":"arte-papeis","sku":"ART-003","imagem_url":"https://images.unsplash.com/photo-1520975922325-24baf02c8f9b?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Aquarela Pastilhada","descricao":"12 cores","preco":39.90,"estoque":40,"categoria":"arte-papeis","sku":"ART-004","imagem_url":"https://images.unsplash.com/photo-1505575972945-34142e0c6ddb?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Lápis de Cor 24un","descricao":"Cores vivas","preco":49.90,"estoque":55,"categoria":"arte-papeis","sku":"ART-005","imagem_url":"https://images.unsplash.com/photo-1617957771946-0b6a19b87c00?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Papel Canson A3","descricao":"180g/m²","preco":34.90,"estoque":30,"categoria":"arte-papeis","sku":"ART-006","imagem_url":"https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Bloco Sulfite A4","descricao":"100 folhas","preco":12.90,"estoque":100,"categoria":"arte-papeis","sku":"ART-007","imagem_url":"https://images.unsplash.com/photo-1513185041617-8ab03f83d6c5?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Cola Bastão","descricao":"10g","preco":4.90,"estoque":140,"categoria":"arte-papeis","sku":"ART-008","imagem_url":"https://images.unsplash.com/photo-1528720128808-cf6a32c70a3a?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Marcador Permanente (4un)","descricao":"Ponta fina","preco":19.90,"estoque":80,"categoria":"arte-papeis","sku":"ART-009","imagem_url":"https://images.unsplash.com/photo-1551727974-8af20a3322e4?auto=format&fit=crop&w=900&q=60"},
    {"nome":"Massinha de Modelar","descricao":"12 cores","preco":22.90,"estoque":65,"categoria":"arte-papeis","sku":"ART-010","imagem_url":"https://images.unsplash.com/photo-1605733160314-4f53a3805048?auto=format&fit=crop&w=900&q=60"},
]

db = SessionLocal()

inseridos = 0
try:
    for it in produtos:
        sku = it.get("sku")
        existente = None
        if sku:
            existente = db.query(Produto).filter(Produto.sku == sku).first()
        if not existente:
            existente = db.query(Produto).filter(Produto.nome == it["nome"], Produto.categoria == it["categoria"]).first()
        if existente:
            continue
        db.add(Produto(**it))
        inseridos += 1
    if inseridos:
        db.commit()
        print(f"Produtos inseridos: {inseridos}")
    else:
        print("Nenhum produto novo para inserir. Base já populada.")
finally:
    db.close()

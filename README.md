# FooPay
-----

Este é o repositório do projeto FooPay, desenvolvido para a disciplina de Desenvolvimento Móvel. FP-Back é uma API que gerencia usuários, documentos, pontos, holerites e notas fiscais.

## Requisitos

- Node.js (versão 14 ou superior)
- Docker
- Docker Compose

## Instalação

1. Clone o repositório:

   ```sh
   git clone https://github.com/ArthurCandido/FP-BACK.git
   cd FP-BACK
   ```
2. Instale as dependências do projeto:
    ```sh
    npm install
    ```
3. Configure o banco de dados usando Docker Compose:
    ```sh
    docker-compose up -d
    ```
## Configuração

Certifique-se de que o banco de dados está configurado corretamente. O arquivo docker-compose.yml já está configurado para criar um contêiner PostgreSQL com as seguintes credenciais:

- Usuário: **postgres**
- Senha: **senha123**
- Banco de dados: **foobase**
- Porta: **5434**

## Execução

Para iniciar o servidor, execute o seguinte comando:
```sh
npm start
```
O servidor estará rodando em [localhost:3000](http://localhost:3000).

## Documentação da API

A documentação da API é gerada automaticamente pelo Swagger. Para acessá-la, abra o navegador e vá para:

```
http://localhost:3000/api-docs
```
Ou simplesmente clique [aqui](http://localhost:3000/api-docs).

## Estrutura do Projeto

**app.js**: Arquivo principal que configura e inicia o servidor Express.
**rotas/**: Diretório que contém todas as rotas da API.
**db.js**: Configuração da conexão com o banco de dados PostgreSQL.
**swagger.js**: Configuração do Swagger para gerar a documentação da API.
**docker-compose.yml**: Arquivo de configuração do Docker Compose para o banco de dados PostgreSQL.
**authMiddleware.js**: Middleware para autenticação JWT.

```
foopay/
├── app.js                 # Arquivo principal
├── db.js                  # Configuração do banco
├── swagger.js            # Configuração Swagger
├── docker-compose.yml    # Config Docker
├── rotas/               # Endpoints da API
│   ├── usuario.js
│   ├── documento.js
│   ├── ponto.js
│   ├── holerite.js
│   └── nota_fiscal.js
└── authMiddleware.js    # Middleware JWT
```

## Comandos Úteis

- Iniciar o servidor:
```
npm start
```
- Subir o banco de dados com Docker Compose:
```
docker-compose up -d
```
- Parar o banco de dados com Docker Compose:
```
docker-compose down
```

## Contribuição
Se você deseja contribuir com o projeto, por favor, siga os passos abaixo:

1. Faça um fork do repositório.
2. Crie uma nova branch (**git checkout -b feature/nova-feature**).
3. Faça commit das suas alterações (**git commit -am 'Adiciona nova feature'**).
4. Faça push para a branch (**git push origin feature/nova-feature**).
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença ISC. Veja o arquivo *LICENSE* para mais detalhes.

-----

# Golden Raspberry Awards API

Este projeto é uma API RESTful desenvolvida para manipular e consultar dados relacionados aos indicados e vencedores da categoria Pior Filme do Golden Raspberry Awards. A API permite a leitura, armazenamento e análise dos dados para identificar os intervalos entre prêmios consecutivos de produtores.

## Requisitos do Sistema

### Funcionalidades e descrições
1. Ler o arquivo CSV dos filmes e inserir os dados em uma base de dados ao iniciar a aplicação.
2. Fornecer o produtor com o maior intervalo entre dois prêmios consecutivos e o que obteve dois prêmios mais rápido.
3. O banco de dados é em memória, utilizando SQLite, sem necessidade de instalação externa.
4. Testes de integração garantem que os dados obtidos estão de acordo com a proposta.

## Pré-requisitos
- Node.js v16 ou superior.
- npm (Node Package Manager).

## Instalação
1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DO_REPOSITORIO>
   ```
2. Instale as dependências do projeto:
   ```bash
   npm install
   ```

## Estrutura do Projeto
```
.
├── app.js              # Configuração principal da aplicação e rotas
├── server.js           # Inicialização do servidor
├── movielist.csv       # Arquivo de entrada com os dados do Golden Raspberry Awards
├── integration.test.js # Testes de integração da API
├── package.json        # Configurações e dependências do projeto
└── README.md           # Documentação do projeto
```

## Uso

### Inicializar o Servidor
Para iniciar a aplicação, execute o seguinte comando:
```bash
npm run dev
```
O servidor estará disponível em `http://localhost:3000`.

### Endpoints Disponíveis

#### 1. **GET /**
- **Descrição**: Verifica o status da API.
- **Resposta**:
  ```json
  {
    "message": "API is running"
  }
  ```

#### 2. **GET /movies**
- **Descrição**: Retorna todos os filmes armazenados na base de dados.
- **Resposta**: Lista de filmes com os seguintes campos:
  - `year`: Ano do filme.
  - `title`: Título do filme.
  - `studios`: Estúdios responsáveis pelo filme.
  - `producers`: Produtores do filme.
  - `winner`: Indica se o filme venceu a categoria.

#### 3. **GET /intervals**
- **Descrição**: Retorna os dois maiores e dois menores intervalos entre prêmios consecutivos de produtores.
- **Resposta**:
  ```json
  {
    "min": [
      {
        "producer": "Producer 1",
        "interval": 1,
        "previousWin": 2008,
        "followingWin": 2009
      }
    ],
    "max": [
      {
        "producer": "Producer 2",
        "interval": 99,
        "previousWin": 1900,
        "followingWin": 1999
      }
    ]
  }
  ```

## Testes

Os testes de integração garantem a funcionalidade da API.

### Executar Testes
Para rodar os testes, utilize:
```bash
npm test
```
Os testes verificam:
- A inicialização correta do banco de dados.
- O retorno dos filmes pela API.
- O cálculo correto dos intervalos de prêmios.

## Dependências

### Produção
- `express`: Framework web para Node.js.
- `sqlite3`: Banco de dados em memória.
- `csv-parser`: Parser para leitura de arquivos CSV.

### Desenvolvimento
- `jest`: Framework de testes.
- `supertest`: Testes de integração para APIs.

## Especificações Adicionais
- O banco de dados é carregado automaticamente ao iniciar a aplicação a partir do arquivo `movielist.csv`.
- Todos os dados são armazenados em memória e serão descartados ao finalizar o processo.

## Desenvolvedora
Este projeto foi desenvolvido por [**Carol Sauhi**](https://github.com/carolsauhi).

## Licença
Este projeto é de uso livre para estudo e desenvolvimento. Entre em contato para mais informações sobre direitos e permissões.


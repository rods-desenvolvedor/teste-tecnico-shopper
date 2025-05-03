# Desafio Técnico Shopper

Este projeto é uma API desenvolvida em Node.js com TypeScript, que realiza o processamento de medições de água e gás, integrando com a API do Gemini para leitura de imagens.

## Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- MongoDB
- Mongoose
- Jest (para testes)
- Docker e Docker Compose

## Pré-requisitos

Para rodar este projeto, é necessário ter instalado:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- (Opcional para rodar localmente sem Docker) [Node.js](https://nodejs.org/en) e [MongoDB](https://www.mongodb.com/try/download/community)

## Variáveis de ambiente

O projeto utiliza variáveis de ambiente para a integração com a API Gemini. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

GEMINI_API_KEY=sua-chave-aqui


> Essa variável será usada automaticamente pelo Docker Compose se você estiver usando o arquivo `.env`.

## Como rodar o projeto

### 1. Rodando com Docker (recomendado)

A forma mais simples de iniciar o projeto é usando Docker Compose, que já configura a aplicação e o MongoDB automaticamente.

Execute o seguinte comando:

```bash
docker-compose up --build
```

sso fará o seguinte:

Subirá o container do MongoDB na porta 27017

Subirá o container da aplicação na porta 3000

A API estará disponível em:

http://localhost:3000

Para encerrar os containers:

```bash
docker-compose down -v
```

### 2. Rodando localmente sem Docker
Certifique-se de que o MongoDB está rodando localmente na porta padrão (27017).

Depois, execute os comandos:

```bash
npm install
npm run dev
```

A API estará disponível em:

http://localhost:3000

## Endpoints disponíveis
POST /upload
Realiza o upload de uma imagem de medição, processa com a API Gemini e armazena os dados.

PATCH /confirm
Confirma ou corrige o valor de uma medição já registrada.

GET /:customer_code/list
Lista todas as medições de um determinado cliente. Aceita o parâmetro opcional measure_type (WATER ou GAS).

## Rodando os testes
Para executar os testes unitários:

```bash
npm run test
```

## Estrutura do projeto
src/controllers: Lógica das rotas da API

src/services: Regras de negócio

src/Models: Modelos do MongoDB

tests: Testes unitários

## Observações
A pasta temp/ (onde as imagens são salvas temporariamente) está no .gitignore e não é enviada para o repositório. Ela será criada automaticamente quando as imagens forem processadas.

Certifique-se de que sua chave da API Gemini está válida antes de realizar testes com upload de imagens.

Limpeza de arquivos temporários
Atualmente, o projeto não implementa a remoção automática dos arquivos da pasta temp/. Se necessário, essa limpeza pode ser feita manualmente sem impactar o funcionamento da API (as URLs das imagens antigas podem quebrar após a exclusão).





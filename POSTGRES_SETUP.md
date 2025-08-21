# Configuração do PostgreSQL para o Projeto Checkout

Este documento fornece instruções sobre como configurar e usar o PostgreSQL com este projeto.

## Pré-requisitos

1. PostgreSQL instalado localmente ou em um servidor
2. Node.js e npm instalados

## Instalação das Dependências

Quando o Node.js e npm estiverem disponíveis, execute o seguinte comando para instalar as dependências necessárias:

```bash
npm install @prisma/client prisma pg
```

## Configuração do Banco de Dados

1. O banco de dados PostgreSQL já está configurado em um servidor VPS:

   - **Host**: easypanel.lockpainel.shop
   - **Porta**: 1111
   - **Usuário**: root
   - **Senha**: Zreel123!
   - **Nome do Banco**: jcheckout

2. As credenciais estão configuradas no arquivo `.env`:

```
DATABASE_URL="postgresql://root:Zreel123!@easypanel.lockpainel.shop:1111/jcheckout"
```

## Inicialização do Prisma

Quando as dependências estiverem instaladas, execute os seguintes comandos para inicializar o banco de dados:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Isso criará as tabelas definidas no arquivo `prisma/schema.prisma` no seu banco de dados.

## Estrutura do Banco de Dados

O projeto utiliza os seguintes modelos:

- **User**: Usuários do sistema
- **Store**: Lojas associadas aos usuários
- **Product**: Produtos disponíveis nas lojas
- **Order**: Pedidos realizados nas lojas
- **OrderItem**: Itens incluídos nos pedidos

## Uso na Aplicação

O cliente Prisma está configurado em `src/lib/prisma.ts` e pode ser importado em qualquer arquivo da aplicação:

```typescript
import prisma from '@/lib/prisma';

// Exemplo de uso
const users = await prisma.user.findMany();
```

## APIs Disponíveis

O projeto inclui as seguintes APIs para interagir com o banco de dados:

- **GET/POST /api/stores**: Listar e criar lojas
- **GET/POST /api/products**: Listar e criar produtos
- **GET/POST /api/orders**: Listar e criar pedidos
- **GET/POST /api/users**: Listar e criar usuários

## Migrando do Firebase para PostgreSQL

Se você estiver migrando dados do Firebase para o PostgreSQL, o projeto inclui utilitários para facilitar a migração em `src/lib/migrate-firebase-to-postgres.ts`. Para iniciar a migração, você pode fazer uma requisição POST para `/api/migrate`.

Exemplo de uso do utilitário de migração:

```typescript
import { migrateAllData } from '@/lib/migrate-firebase-to-postgres';

// Migrar todos os dados
await migrateAllData();

// Ou migrar apenas usuários
import { migrateUsers } from '@/lib/migrate-firebase-to-postgres';
await migrateUsers();
```
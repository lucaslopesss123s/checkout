# Checkout - Sistema de E-commerce

Este é um projeto NextJS para gerenciamento de lojas online, com suporte a PostgreSQL e Firebase.

## Tecnologias

- Next.js 15
- TypeScript
- Tailwind CSS
- PostgreSQL (via Prisma ORM)
- Firebase (autenticação e armazenamento)

## Configuração

### Banco de Dados PostgreSQL

O projeto agora suporta PostgreSQL como banco de dados principal. Para configurar:

1. Instale as dependências necessárias:
   ```bash
   npm install @prisma/client prisma pg
   ```

2. Configure a URL de conexão no arquivo `.env`

3. Execute as migrações do Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```

Para mais detalhes, consulte o arquivo [POSTGRES_SETUP.md](./POSTGRES_SETUP.md).

### Firebase

O projeto também utiliza Firebase para autenticação. As configurações estão no arquivo `.env`.

## Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento será iniciado em http://localhost:9002.

## Migração de Dados

Se você estiver migrando do Firebase para o PostgreSQL, o projeto inclui utilitários para facilitar a migração. Consulte o arquivo `src/lib/migrate-firebase-to-postgres.ts` para mais detalhes.

## APIs Disponíveis

- **Usuários**: `/api/users`
- **Lojas**: `/api/stores`
- **Produtos**: `/api/products`
- **Pedidos**: `/api/orders`
- **Migração**: `/api/migrate` (POST para iniciar a migração de dados)

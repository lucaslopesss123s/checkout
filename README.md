# Checkout - Sistema de E-commerce

Este é um projeto NextJS para gerenciamento de lojas online, com suporte a PostgreSQL.

## Tecnologias

- Next.js 15
- TypeScript
- Tailwind CSS
- PostgreSQL (via Prisma ORM)

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

Para mais detalhes sobre configuração do banco de dados, consulte a documentação do Prisma.

## Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento será iniciado em http://localhost:3000.

## APIs Disponíveis

- **Usuários**: `/api/users`
- **Lojas**: `/api/stores`
- **Produtos**: `/api/products`
- **Pedidos**: `/api/orders`
- **Migração**: `/api/migrate` (POST para iniciar a migração de dados)

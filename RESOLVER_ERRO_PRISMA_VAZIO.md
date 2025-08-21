# Resolução do Erro do Prisma - Migrações Vazias

O problema atual está relacionado ao fato de que a pasta de migrações do Prisma está vazia, mas o código está tentando usar um cliente Prisma para acessar um banco de dados que provavelmente não tem as tabelas necessárias.

## Passos para Resolver

### 1. Gerar a Migração Inicial

Primeiro, precisamos criar a migração inicial para criar todas as tabelas no banco de dados:

```bash
npx prisma migrate dev --name init
```

Este comando irá:
- Criar um arquivo de migração na pasta `prisma/migrations`
- Aplicar a migração ao banco de dados
- Gerar o cliente Prisma

### 2. Se o Comando Acima Falhar

Se o comando acima falhar, pode ser devido a problemas de conexão com o banco de dados. Verifique:

#### 2.1. Conexão com o Banco de Dados

Verifique se o banco de dados PostgreSQL está acessível usando a URL fornecida no arquivo `.env`:

```
DATABASE_URL="postgresql://root:Zreel123!@easypanel.lockpainel.shop:1111/jcheckout"
```

Você pode testar a conexão usando uma ferramenta como o `psql` ou qualquer cliente PostgreSQL:

```bash
psql postgresql://root:Zreel123!@easypanel.lockpainel.shop:1111/jcheckout
```

#### 2.2. Criar o Banco de Dados Manualmente

Se o banco de dados `jcheckout` não existir, você precisará criá-lo:

```sql
CREATE DATABASE jcheckout;
```

#### 2.3. Verificar Permissões do Usuário

Certifique-se de que o usuário `root` tem permissões para criar tabelas no banco de dados `jcheckout`.

### 3. Aplicar a Migração Manualmente

Se ainda houver problemas, você pode tentar aplicar o esquema diretamente:

```bash
npx prisma db push
```

Este comando irá sincronizar o esquema do Prisma com o banco de dados sem criar arquivos de migração.

### 4. Gerar o Cliente Prisma

Após aplicar o esquema ao banco de dados, gere o cliente Prisma:

```bash
npx prisma generate
```

### 5. Reiniciar o Servidor

Após realizar essas etapas, reinicie o servidor da aplicação:

```bash
npm run dev
```

## Solução Alternativa: Criar as Tabelas Manualmente

Se todas as opções acima falharem, você pode criar as tabelas manualmente no banco de dados usando SQL. Aqui está um exemplo baseado no seu esquema:

```sql
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "Store" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Product" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" FLOAT NOT NULL,
  "storeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE
);

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "total" FLOAT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE
);

CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" FLOAT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);
```

Depois de criar as tabelas manualmente, execute:

```bash
npx prisma generate
```

E reinicie o servidor.

## Verificação Final

Para verificar se tudo está funcionando corretamente, você pode criar um script de teste simples para verificar a conexão com o banco de dados:

```typescript
// test-db.ts
import prisma from './src/lib/prisma';

async function main() {
  try {
    // Tenta conectar ao banco de dados
    const users = await prisma.user.findMany();
    console.log('Conexão bem-sucedida!');
    console.log('Usuários encontrados:', users.length);
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

Execute com:

```bash
npx ts-node test-db.ts
```
# Resolução do Erro P3006 - Tabela User não existe

O erro que você está enfrentando é específico:

```
Error: P3006 
Migration `20240601000000_add_user_auth` failed to apply cleanly to the shadow database. 
Error code: P1014 
Error: The underlying table for model `User` does not exist.
```

Este erro ocorre porque a migração está tentando modificar uma tabela `User` que ainda não existe no banco de dados. Vamos resolver isso com os seguintes passos:

## 1. Criar uma Nova Migração Inicial

Vamos criar uma migração que primeiro cria a tabela User antes de tentar modificá-la:

1. Remova a migração atual:

```bash
rm -r prisma/migrations/20240601000000_add_user_auth
```

2. Modifique o schema.prisma para garantir que ele tenha a definição completa do modelo User:

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  stores    Store[]
}
```

3. Crie uma nova migração inicial:

```bash
npx prisma migrate dev --name init
```

## 2. Alternativa: Criar a Tabela Manualmente

Se a abordagem acima não funcionar, você pode criar a tabela manualmente no PostgreSQL:

1. Conecte-se ao seu banco de dados PostgreSQL usando uma ferramenta como psql, pgAdmin ou DBeaver.

2. Execute o seguinte SQL para criar a tabela User:

```sql
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
```

3. Depois de criar a tabela manualmente, execute:

```bash
npx prisma db pull
npx prisma generate
```

## 3. Verificar Permissões do Usuário

Certifique-se de que o usuário `root` com senha `Zreel123!` tem permissões para criar tabelas no banco de dados `jcheckout`:

```sql
GRANT ALL PRIVILEGES ON DATABASE jcheckout TO root;
GRANT ALL PRIVILEGES ON SCHEMA public TO root;
```

## 4. Verificar a Conexão com o Banco de Dados

Verifique se a URL do banco de dados está correta no arquivo `.env`:

```
DATABASE_URL="postgresql://root:Zreel123!@easypanel.lockpainel.shop:1111/jcheckout"
```

Teste a conexão com:

```bash
npx prisma db pull
```

## 5. Iniciar do Zero (Último Recurso)

Se nada funcionar, você pode optar por iniciar do zero:

1. Remova todas as migrações existentes:

```bash
rm -r prisma/migrations
```

2. Crie uma nova migração inicial:

```bash
npx prisma migrate dev --name init
```

Este comando criará todas as tabelas definidas no seu schema.prisma.

## 6. Verificar se o Banco de Dados Existe

Certifique-se de que o banco de dados `jcheckout` existe:

```sql
CREATE DATABASE jcheckout;
```

Espero que estas instruções ajudem a resolver o erro P3006. Se você continuar enfrentando problemas, considere fornecer mais detalhes sobre o ambiente de banco de dados.
# Instalação de Dependências para o Sistema de Autenticação

Para que o sistema de autenticação funcione corretamente, é necessário instalar as seguintes dependências:

```bash
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

## Dependências

- **bcrypt**: Biblioteca para criptografar senhas
- **jsonwebtoken**: Biblioteca para gerar e verificar tokens JWT
- **@types/bcrypt** e **@types/jsonwebtoken**: Tipos TypeScript para as bibliotecas

## Configuração

O arquivo `.env` já foi configurado com a variável `JWT_SECRET` necessária para a geração e verificação de tokens JWT.

## Migração do Banco de Dados

Após instalar as dependências, execute as migrações do Prisma para criar a tabela de usuários com os novos campos:

```bash
npx prisma migrate dev --name add_user_auth
```

Esta migração irá atualizar o esquema do banco de dados para incluir os campos `username` e `password` na tabela `User`.

## Uso do Sistema de Autenticação

O sistema de autenticação inclui as seguintes funcionalidades:

1. **Registro de Usuários**: `/api/auth` (POST)
2. **Login de Usuários**: `/api/auth/login` (POST)
3. **Perfil do Usuário**: `/api/user/profile` (GET - requer autenticação)

### Páginas de Interface

- **/login**: Página de login
- **/register**: Página de registro
- **/dashboard/profile**: Página de perfil do usuário (requer autenticação)

### Middleware de Autenticação

O arquivo `src/lib/auth.ts` contém funções para verificar a autenticação do usuário em rotas protegidas.
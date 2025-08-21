# Sistema de Autenticação com Username e Senha

Este documento descreve o sistema de autenticação implementado neste projeto, que substitui a autenticação do Firebase por um sistema baseado em username e senha utilizando JWT (JSON Web Tokens) e PostgreSQL.

## Visão Geral

O sistema de autenticação implementa:

1. **Registro de usuários** com username e senha
2. **Login de usuários** com geração de token JWT
3. **Proteção de rotas** com middleware de autenticação
4. **Perfil de usuário** para visualizar e gerenciar informações

## Estrutura do Banco de Dados

O modelo `User` no Prisma foi atualizado para usar username e senha em vez de email:

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  stores    Store[]
}
```

## APIs Disponíveis

### Registro de Usuário

**Endpoint:** `/api/auth` (POST)

**Corpo da Requisição:**
```json
{
  "username": "usuario_exemplo",
  "password": "senha_segura",
  "name": "Nome Completo"
}
```

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid-gerado",
  "username": "usuario_exemplo",
  "name": "Nome Completo",
  "createdAt": "2023-06-01T00:00:00.000Z",
  "updatedAt": "2023-06-01T00:00:00.000Z"
}
```

### Login de Usuário

**Endpoint:** `/api/auth/login` (POST)

**Corpo da Requisição:**
```json
{
  "username": "usuario_exemplo",
  "password": "senha_segura"
}
```

**Resposta de Sucesso:**
```json
{
  "user": {
    "id": "uuid-gerado",
    "username": "usuario_exemplo",
    "name": "Nome Completo",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-01T00:00:00.000Z"
  },
  "token": "jwt-token-gerado"
}
```

### Perfil do Usuário

**Endpoint:** `/api/user/profile` (GET)

**Cabeçalhos:**
```
Authorization: Bearer jwt-token-gerado
```

**Resposta de Sucesso:**
```json
{
  "user": {
    "id": "uuid-gerado",
    "username": "usuario_exemplo",
    "name": "Nome Completo",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-01T00:00:00.000Z"
  }
}
```

## Fluxo de Autenticação

1. **Registro:**
   - O usuário se registra fornecendo username, senha e nome
   - A senha é criptografada com bcrypt antes de ser armazenada
   - Um novo registro é criado na tabela User

2. **Login:**
   - O usuário fornece username e senha
   - O sistema verifica se o username existe e se a senha está correta
   - Se as credenciais forem válidas, um token JWT é gerado e retornado

3. **Autenticação em Rotas Protegidas:**
   - O cliente inclui o token JWT no cabeçalho Authorization
   - O middleware verifica se o token é válido
   - Se o token for válido, a requisição prossegue; caso contrário, retorna erro 401

## Componentes de Interface

1. **Página de Login** (`/login`):
   - Formulário para inserir username e senha
   - Botão para enviar credenciais
   - Link para a página de registro

2. **Página de Registro** (`/register`):
   - Formulário para inserir nome, username e senha
   - Botão para enviar dados de registro
   - Link para a página de login

3. **Página de Perfil** (`/dashboard/profile`):
   - Exibe informações do usuário autenticado
   - Botão para logout

## Segurança

- Senhas são criptografadas com bcrypt antes de serem armazenadas
- Tokens JWT são assinados com uma chave secreta definida em variáveis de ambiente
- Tokens têm validade de 7 dias
- Rotas protegidas verificam a autenticação do usuário

## Migração de Usuários Existentes

Para migrar usuários do Firebase para o novo sistema:

1. Crie um script de migração que:
   - Busque usuários do Firebase
   - Gere senhas temporárias ou solicite que os usuários definam novas senhas
   - Crie registros no PostgreSQL com os dados migrados

2. Notifique os usuários sobre a mudança no sistema de autenticação

## Próximos Passos

1. Implementar recuperação de senha
2. Adicionar autenticação de dois fatores
3. Implementar controle de permissões baseado em funções
4. Adicionar logs de auditoria para ações de autenticação
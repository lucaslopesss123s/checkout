# Erro no Sistema de Autenticação

O erro que você está enfrentando é devido à falta de instalação das dependências necessárias para o sistema de autenticação. As bibliotecas `bcrypt` e `jsonwebtoken` são essenciais para o funcionamento do login e registro de usuários.

## Como Resolver

1. **Instale as dependências necessárias**:

   ```bash
   npm install bcrypt jsonwebtoken
   npm install --save-dev @types/bcrypt @types/jsonwebtoken
   ```

2. **Execute as migrações do banco de dados**:

   ```bash
   npx prisma migrate dev --name add_user_auth
   ```

3. **Verifique a configuração do ambiente**:
   
   Certifique-se de que o arquivo `.env` contém a variável `JWT_SECRET` com um valor seguro:

   ```
   JWT_SECRET=checkout_secret_key_2024
   ```

## Erro de Execução de Scripts no PowerShell

Se você estiver enfrentando o erro "a execução de scripts foi desabilitada neste sistema", você pode resolver isso executando o PowerShell como administrador e usando o seguinte comando:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Em seguida, tente instalar as dependências novamente.

## Verificação

Após instalar as dependências e executar as migrações, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

Agora o sistema de autenticação deve funcionar corretamente, permitindo o registro e login de usuários com nome de usuário e senha.
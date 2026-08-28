# Guia de Configuração e Troubleshooting da VPS Oracle (Projeto Cozinha)

Este documento registra tudo o que foi feito na tentativa de deploy na VPS da Oracle, bem como os exatos próximos passos para resolver o erro atual quando retornarmos ao trabalho.

## 1. O que já foi feito e resolvido
* **Acesso SSH:** Configurado com sucesso através do PowerShell usando a chave `.key`. (Nota: Os arquivos da VPS e a chave SSH estão localizados na pasta `D:\VPSOracle\ssh-key-2026-08-27.key`).
* **Liberação de Portas (Firewall Interno):** Rodamos o script `iptables` na VPS para liberar as portas `80`, `443` e `3001` (backend).
* **Configuração de Frontend:** O arquivo `.env`/`docker-compose.yml` e o `api.ts` foram alterados para que o frontend aponte para o IP público da VPS (`137.131.151.125:3001/api`) em vez do `localhost`.
* **Segurança do Seed:** Adicionamos a variável de ambiente `SEED_SECRET=cozinha2026` no `docker-compose.yml`.
* **Banco de Dados:** O contêiner subiu e aplicamos as migrações iniciais (`npx prisma migrate deploy`), o que eliminou os erros de Timeout.

## 2. O Erro Atual
Ao tentar fazer login, o backend está retornando Erro 500. Os logs (`docker compose logs backend --tail 20`) mostram o erro:
`DriverAdapterError: ColumnNotFound`

**Por que isso acontece?**
O banco de dados foi criado usando uma migração antiga, mas o código atual (o arquivo `schema.prisma`) possui colunas novas que não existem no banco. Quando o código tenta ler o usuário no momento do login, ele procura uma coluna inexistente e quebra.

---

## 3. PRÓXIMOS PASSOS (Fazer quando voltar)

Siga EXATAMENTE esta ordem no terminal da VPS (`ubuntu@137.131.151.125`):

### Passo A: Sincronizar o Banco de Dados com o Prisma
Este comando vai ler o seu código e forçar a criação de qualquer coluna ou tabela que esteja faltando no banco de dados.

```bash
docker compose exec backend npx prisma db push
```
*(Aguarde a mensagem verde de sucesso)*

### Passo B: Criar o Usuário Administrador
Como o banco está zerado, o seu login local não existe lá. Vamos criar o primeiro usuário usando a rota protegida pela nossa senha secreta.

```bash
curl -X POST -H "x-seed-secret: cozinha2026" http://localhost:3001/api/auth/seed
```
*(Deve retornar: `{"message":"Sistema inicializado com sucesso"}`)*

### Passo C: Testar o Login
Abra o navegador no seu IP e faça login com:
* **Email:** `admin@cozinha.com`
* **Senha:** `admin123`

Se der certo, o sistema estará 100% no ar!

---

## 4. AVISO CRÍTICO (TESTE DE FOGO)
> **ATENÇÃO:** O sistema agora está em produção (Teste de Fogo) e possui dados reais inseridos pelo usuário.
> **NUNCA** execute comandos que dropem, resetem ou recriem o banco de dados (como `prisma migrate reset` ou `prisma db push` que cause perda de dados).
> Qualquer nova modificação estrutural no banco (`schema.prisma`) deve ser feita preservando os dados existentes (ex: usar `npx prisma migrate dev --name nova_feature` com cuidado, ou `prisma db push --accept-data-loss` APENAS SE garantido que as tabelas de negócio não serão apagadas).

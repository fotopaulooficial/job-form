# Formulário de vaga (Next.js + Resend)

Formulário de candidatura com upload de currículo (PDF/DOC/DOCX, até 4 MB).
Os dados e o currículo (como anexo) chegam por e-mail via Resend.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as 3 variáveis
npm run dev
```

Abra http://localhost:3000

## Variáveis de ambiente

| Variável | O que é |
|---|---|
| `RESEND_API_KEY` | Chave criada em resend.com/api-keys |
| `RESEND_FROM` | Remetente de um domínio verificado no Resend (para teste: `Vagas <onboarding@resend.dev>`) |
| `RESEND_TO` | E-mail(s) que recebem as candidaturas (separe vários por vírgula) |

> Com `onboarding@resend.dev` o Resend só entrega para o e-mail da sua própria conta. Para enviar a qualquer destinatário, verifique seu domínio em resend.com/domains.

## Deploy na Vercel

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project** e importe o repositório (Framework: Next.js, detectado sozinho).
3. Em **Settings → Environment Variables**, cadastre `RESEND_API_KEY`, `RESEND_FROM` e `RESEND_TO`.
4. Faça o deploy (ou **Redeploy** se já tinha feito antes de cadastrar as variáveis).

## Observações

- A Vercel limita o corpo das requisições a ~4,5 MB, por isso o limite de 4 MB no currículo.
- O servidor valida extensão e assinatura do arquivo, escapa o HTML do e-mail e usa um campo "honeypot" contra bots.
- O `replyTo` do e-mail é o do candidato: basta clicar em "Responder".

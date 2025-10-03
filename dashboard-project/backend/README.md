# Notifications Webhook Service

Serviço simples para integrar Make (Integromat) com o WhatsApp Cloud API via webhook. Armazena configurações de notificações em Supabase (tabela `NotificaçõesClientes`).

Endpoints principais:
- GET /notifications
- GET /notifications/:id
- POST /notifications { nome, numero }
- PUT /notifications/:id { nome, numero }
- DELETE /notifications/:id
- POST /webhook { id, message, phone_number_id, token }  -> envia mensagem para o número configurado no registro `id`

Como usar:
1. Configure as variáveis de ambiente em `.env` (veja `.env.example`).
2. Instale dependências: `npm install`.
3. Inicie: `npm start`.

No Make (Integromat) configure um HTTP module que faça POST para `/webhook` com JSON contendo:
{
  "id": 1,
  "message": "Texto a ser enviado",
  "phone_number_id": "739791392560679",
  "token": "<seu_whatsapp_token>"
}

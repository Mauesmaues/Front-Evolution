# 📤 Como Compartilhar Propostas

## 🔗 Formato do Link

O sistema gera automaticamente um link simplificado para cada proposta:

```
http://localhost:3000/proposta.html?id={ID_DA_PROPOSTA}
```

**✅ IMPORTANTE**: Apenas o ID é necessário! Todas as informações (tipo, WhatsApp, arquivo/link) são buscadas automaticamente do banco de dados.

### Exemplo:
```
http://localhost:3000/proposta.html?id=123
```

## 📋 Passo a Passo

### 1️⃣ Criar a Proposta
1. Acesse o painel administrativo
2. Vá até "Propostas"
3. Clique em "Nova Proposta"
4. Preencha os dados:
   - **Nome**: Nome da proposta
   - **Descrição**: Descrição opcional
   - **Tipo**: Escolha entre:
     - **arquivo**: Para propostas com PDF/documentos
     - **canva**: Para propostas com link do Canva
   - **Pedir WhatsApp**: Marque se deseja coletar WhatsApp do cliente
   - **Arquivo** (se tipo = arquivo): Faça upload do arquivo
   - **Link Canva** (se tipo = canva): Cole o link do Canva
5. Clique em "Salvar"

### 2️⃣ Copiar o Link Automaticamente
Após salvar a proposta, **clique no botão verde com ícone de copiar** (<i class="fas fa-copy"></i>) na lista de propostas.

O link será copiado automaticamente para sua área de transferência no formato:
```
http://localhost:3000/proposta.html?id=123
```

### 3️⃣ Compartilhar
Cole o link e envie para o cliente via:
- 📱 WhatsApp
- 📧 E-mail
- 💬 SMS
- 📋 Qualquer outro canal


## 🎯 O Que Acontece Quando o Cliente Acessa

### Proposta Tipo "arquivo" (PDF/Documentos)
1. Cliente abre o link
2. Vê um formulário solicitando:
   - Nome completo
   - WhatsApp (se configurado `pedir_whatsapp: true`)
3. Após preencher, clica em "Download Proposta"
4. Sistema registra a visualização com:
   - Nome do cliente
   - WhatsApp (se coletado)
   - IP de acesso
   - Data e hora
5. Download do arquivo inicia automaticamente
6. Cliente pode fazer download novamente se necessário

### Proposta Tipo "canva" (Link do Canva)
1. Cliente abre o link
2. Vê um formulário solicitando:
   - Nome completo
   - WhatsApp (se configurado `pedir_whatsapp: true`)
3. Após preencher, clica em "Quero ver!"
4. Sistema registra a visualização
5. Cliente é redirecionado para o link do Canva em nova aba
6. Countdown de 5 segundos antes do redirecionamento automático

## 📊 Rastreamento de Visualizações

Cada vez que um cliente acessa uma proposta e preenche o formulário, o sistema registra:

```javascript
{
  "proposta_id": 123,
  "nome_acesso": "João Silva",
  "wpp_acesso": "(11) 98765-4321", // Opcional
  "ip": "192.168.1.100",
  "data_abertura": "2025-10-20T14:30:00Z"
}
```

### Visualizar Aberturas
1. Acesse o painel administrativo
2. Vá até "Propostas"
3. Clique na proposta desejada
4. Veja a lista de aberturas com:
   - Nome do cliente
   - WhatsApp (se coletado)
   - IP de acesso
   - Data e hora da abertura

## 🔒 Segurança

### Vantagens desta Abordagem
✅ **URL limpa**: Apenas o ID é exposto
✅ **Segurança**: Dados sensíveis não ficam na URL
✅ **Privacidade**: Arquivo e configurações ficam no banco
✅ **Rastreamento**: Registra cada acesso
✅ **Controle**: Pode desativar proposta sem quebrar links

### Como Funciona
1. Cliente acessa URL com apenas o ID
2. Frontend busca dados no backend: `GET /api/proposta/{id}`
3. Backend retorna:
   ```json
   {
     "success": true,
     "data": {
       "id": 123,
       "nome": "Proposta Marketing Digital",
       "tipo": "arquivo",
       "pedir_whatsapp": true,
       "arquivo": {
         "url": "https://supabase.co/storage/...",
         "downloadUrl": "https://supabase.co/storage/..."
       }
     }
   }
   ```
4. Frontend renderiza formulário dinamicamente
5. Cliente preenche e submete
6. Sistema registra visualização: `POST /api/proposta/{id}/visualizar`
7. Cliente acessa o conteúdo (download ou Canva)

## 🎨 Personalização

### Modificar Aparência
Edite o arquivo `public/proposta.html`:
- Cores
- Logo
- Textos
- Animações

### Campos Personalizados
Para adicionar novos campos no formulário, edite:
1. `public/proposta.html` - Adicionar campo HTML
2. `backend/controllers/PropostaController.js` - Método `registrarVisualizacao`
3. `database/propostas_tables.sql` - Adicionar coluna em `aberturas_proposta`

## 📱 Exemplo de Uso Real

### Cenário: Proposta de Marketing Digital

```
1. Vendedor cria proposta no painel:
   - Nome: "Proposta Marketing Digital - Empresa ABC"
   - Tipo: arquivo
   - Arquivo: proposta-marketing-abc.pdf
   - Pedir WhatsApp: true
   
2. Sistema gera ID: 42

3. Vendedor envia para cliente via WhatsApp:
   "Olá! Segue o link da sua proposta personalizada:
    http://localhost:3000/proposta.html?id=42"
   
4. Cliente acessa o link:
   - Vê formulário solicitando nome e WhatsApp
   - Preenche: "João Silva" / "(11) 98765-4321"
   - Clica em "Download Proposta"
   
5. Sistema registra:
   ✅ Nome: João Silva
   ✅ WhatsApp: (11) 98765-4321
   ✅ IP: 189.45.234.12
   ✅ Data: 2025-10-20 14:30:00
   
6. Download do PDF inicia automaticamente

7. Vendedor visualiza no painel:
   - Vê que João Silva acessou a proposta
   - Tem o WhatsApp para contato
   - Sabe quando acessou
   - Pode fazer follow-up
```

## 🚀 Produção

Em produção, substitua `localhost:3000` pelo seu domínio:

```
https://seudominio.com.br/proposta.html?id=123
```

## 🔧 Troubleshooting

### Link não funciona
- ✅ Verifique se o servidor está rodando
- ✅ Confirme que o ID existe no banco
- ✅ Verifique logs do console do navegador (F12)

### Arquivo não baixa
- ✅ Verifique se o arquivo foi enviado corretamente
- ✅ Confirme que o bucket do Supabase está público
- ✅ Verifique políticas RLS do Storage

### Campo WhatsApp não aparece
- ✅ Confirme que `pedir_whatsapp: true` na proposta
- ✅ Verifique console do navegador para erros

### Visualizações não são registradas
- ✅ Verifique tabela `aberturas_proposta` no banco
- ✅ Confirme que a rota `/api/proposta/{id}/visualizar` funciona
- ✅ Verifique logs do servidor

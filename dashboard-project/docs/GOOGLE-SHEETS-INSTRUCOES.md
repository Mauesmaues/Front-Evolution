# 📊 Google Sheets - Integração com CRM

## 🎯 Visão Geral

Este script permite enviar leads de uma planilha Google Sheets para o CRM automaticamente, **sem reenviar leads já processados**.

## ⚙️ Configuração Inicial

### 1. **Configurar o Script**

Edite o objeto `CONFIG` no início do script:

```javascript
const CONFIG = {
  urlBackend: 'http://162.240.157.62:3000/api/leads',  // URL do seu backend
  empresaId: '1',                                        // ID da empresa no banco
  abaLeads: 'Formulário do Meta',                      // Nome da aba
  linhaInicio: 2,                                       // Linha onde começam os dados
  colunaStatus: 'J',                                    // Coluna para status (auto)
  debug: true                                           // Ativar logs detalhados
};
```

### 2. **Preparar a Planilha**

1. Abra a planilha
2. No menu **🚀 CRM**, clique em **🔧 Preparar Planilha**
3. Isso criará automaticamente a coluna de status (coluna J)

### 3. **Testar o Envio**

1. No menu **🚀 CRM**, clique em **🧪 Testar Envio (1 Lead)**
2. O script enviará o primeiro lead não enviado
3. Verifique se apareceu `✅ Enviado` na coluna de status

### 4. **Configurar Envio Automático**

1. No menu **🚀 CRM**, clique em **⏰ Configurar Trigger Automático**
2. Autorize o script quando solicitado
3. O script será executado **a cada 1 minuto** automaticamente

## 🚀 Opções do Menu

### 📤 Enviar Leads Novos
- Envia **apenas** leads sem status ou com erro
- **NÃO reenvia** leads já enviados com sucesso
- **Use esta opção para envio manual seguro**

### 🔄 Reenviar Todos (Ignorar Status)
- ⚠️ **ATENÇÃO:** Reenvia TODOS os leads, incluindo os já enviados
- Use apenas se precisar reprocessar tudo
- Pede confirmação dupla

### 🧪 Testar Envio (1 Lead)
- Envia apenas o primeiro lead não enviado
- Ideal para testar a conexão
- Mostra detalhes do resultado

### 📊 Ver Configuração
- Mostra as configurações atuais
- Informa se o trigger automático está ativo
- Útil para verificar URL, empresa, etc

### 🔧 Preparar Planilha
- Adiciona o cabeçalho da coluna de status
- Formata a coluna (verde, negrito)
- Execute uma vez antes de começar

### ⏰ Configurar Trigger Automático
- Cria um trigger que roda a cada 1 minuto
- Executa `enviarLeadsNovos()` automaticamente
- Apenas leads novos são processados

### 🗑️ Remover Trigger Automático
- Remove o trigger automático
- Para de enviar leads automaticamente
- Use quando quiser pausar o sistema

## 📋 Estrutura da Planilha

### Exemplo de Cabeçalho (Linha 1):

| Nome | Email | Telefone | Campanha | Interesse | ... | Status CRM |
|------|-------|----------|----------|-----------|-----|------------|

### Exemplo de Dados (Linha 2+):

| João Silva | joao@email.com | 41999887766 | Facebook | Produto X | ... | ✅ Enviado<br>27/10/2025 15:30 |

## 🎨 Status Possíveis

| Status | Significado |
|--------|-------------|
| (vazio) | Lead ainda não enviado |
| ⏳ Enviando... | Envio em andamento |
| ✅ Enviado | Enviado com sucesso (com data/hora) |
| ❌ Erro | Falha no envio (com mensagem de erro) |

## 🔍 Logs Detalhados

Com `debug: true`, o script registra:

- ✅ Cada lead processado
- 📦 Dados do lead montados
- 🌐 Requisições HTTP
- 📡 Respostas do servidor
- ❌ Erros detalhados

Para ver os logs:
1. No editor de script, vá em **Exibir** → **Logs**
2. Ou use **Ctrl+Enter** durante a execução

## 📊 Exemplo de Log

```
[2025-10-27T15:30:00.000Z] 🚀 ==== INICIANDO ENVIO DE LEADS NOVOS ====
[2025-10-27T15:30:01.000Z] 📊 Total de linhas na planilha: 150
[2025-10-27T15:30:01.000Z] 📍 Coluna de status: J (índice 9)
[2025-10-27T15:30:02.000Z] 
--- Processando linha 2 ---
[2025-10-27T15:30:02.000Z] 📋 Linha 2: Status atual = ""
[2025-10-27T15:30:02.000Z] 📤 Linha 2: Montando dados do lead...
[2025-10-27T15:30:02.000Z] 🔨 Montando lead...
[2025-10-27T15:30:02.000Z] ✅ Nome mapeado: João Silva
[2025-10-27T15:30:02.000Z] ✅ Email mapeado: joao@email.com
[2025-10-27T15:30:02.000Z] ✅ Telefone mapeado: 41999887766
[2025-10-27T15:30:02.000Z] 🌐 Enviando para http://162.240.157.62:3000/api/leads...
[2025-10-27T15:30:03.000Z] 📡 Resposta recebida - HTTP 201
[2025-10-27T15:30:03.000Z] ✅ Linha 2: SUCESSO - Lead João Silva enviado
```

## ⚡ Funcionamento do Trigger

### Como Funciona

1. **A cada 1 minuto**, o trigger executa `enviarLeadsNovos()`
2. O script **lê a planilha** e verifica a coluna de status
3. Para cada linha:
   - Se status está **vazio** → Envia
   - Se status contém **"✅ Enviado"** → Pula
   - Se status contém **"❌ Erro"** → Tenta reenviar

### Vantagens

✅ Não reenvia leads já processados  
✅ Reprocessa automaticamente leads com erro  
✅ Atualiza status em tempo real  
✅ Logs detalhados para debug  
✅ Funciona mesmo com planilha fechada  

## 🔧 Mapeamento de Campos

O script mapeia automaticamente:

| Coluna na Planilha | Campo no CRM | Variações Aceitas |
|--------------------|--------------|-------------------|
| Nome | `nome` | name, cliente, full_name |
| Email | `email` | e-mail, mail, email_address |
| Telefone | `telefone` | phone, whatsapp, celular, phone_number |
| Data | `data_contato` | date, data_contato, contact_date |
| Outras | `[nome_coluna]` | Qualquer outro campo vai como está |

**Campos automáticos:**
- `empresa_id`: Configurado no `CONFIG.empresaId`
- `origem`: Sempre "Google Sheets"
- `data_importacao`: Data/hora atual

## 🐛 Troubleshooting

### Problema: Leads não estão sendo enviados

**Solução:**
1. Verifique se o trigger está ativo: Menu → **📊 Ver Configuração**
2. Veja os logs: **Exibir** → **Logs**
3. Teste manualmente: Menu → **🧪 Testar Envio**

### Problema: Erro "Aba não encontrada"

**Solução:**
1. Verifique o nome da aba no `CONFIG.abaLeads`
2. O nome deve ser **exato**, incluindo maiúsculas/minúsculas

### Problema: Erro de conexão (HTTP 0)

**Solução:**
1. Verifique se o backend está rodando
2. Teste a URL no navegador: `http://162.240.157.62:3000/api/leads`
3. Verifique firewall/permissões

### Problema: Erro 400 - empresa_id obrigatório

**Solução:**
1. Verifique se `CONFIG.empresaId` está configurado
2. Certifique-se de que a empresa existe no banco

### Problema: Leads sendo reenviados

**Solução:**
1. Certifique-se de usar **Enviar Leads Novos**, não "Reenviar Todos"
2. Verifique se a coluna de status está correta (`CONFIG.colunaStatus`)
3. Execute **Preparar Planilha** novamente

### Problema: Script travando

**Solução:**
1. Desative o debug: `CONFIG.debug = false`
2. Aumente o delay: Mude `Utilities.sleep(300)` para `Utilities.sleep(1000)`
3. Processe menos linhas por vez

## 📝 Boas Práticas

1. **Sempre prepare a planilha** antes de começar
2. **Teste com 1 lead** antes de enviar muitos
3. **Monitore os logs** nas primeiras execuções
4. **Use "Enviar Leads Novos"**, não "Reenviar Todos"
5. **Não apague** a coluna de status manualmente
6. **Mantenha o debug ativado** até ter certeza que funciona

## 🔐 Segurança

- O script **não armazena** dados fora da planilha
- Requisições são feitas via **HTTPS** (se configurado)
- Apenas usuários autorizados podem executar o script
- Logs ficam apenas no seu Google Apps Script

## 📞 Suporte

Em caso de problemas:

1. Verifique os **logs** detalhados
2. Teste o **envio manual** de 1 lead
3. Verifique a **configuração** do backend
4. Consulte a **documentação do CRM**

---

**Última atualização:** 27 de outubro de 2025  
**Versão:** 2.0 (Com controle de duplicação)

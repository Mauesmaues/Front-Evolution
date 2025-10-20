# Troubleshooting - Sistema de Propostas

## Problema 1: Arquivo não está sendo enviado para o bucket

### Passos para resolver:

1. **Verificar se o bucket existe:**
   ```bash
   cd backend
   node test-bucket.js
   ```

2. **Se o bucket não existir, criar manualmente:**
   - Acesse: https://supabase.com/dashboard
   - Vá em Storage > Buckets
   - Clique em "New bucket"
   - Nome: `arquivos-propostas`
   - Marque: "Public bucket"
   - File size limit: 50 MB
   - Clique em "Create bucket"

3. **Testar upload:**
   - Abra o console do navegador (F12)
   - Crie uma nova proposta do tipo "arquivo"
   - Selecione um arquivo
   - Veja os logs no console

### Logs esperados:
```
📤 Iniciando upload do arquivo: teste.pdf
🔄 Enviando arquivo para /api/upload-arquivo...
📡 Resposta do upload - Status: 200
✅ Upload realizado com sucesso: { success: true, data: {...} }
📝 Dados do arquivo adicionados à proposta: { nome, url, ... }
```

## Problema 2: Página proposta.html não atualiza

### Verificar se a API está retornando os dados corretamente:

1. **Abrir console do navegador (F12)**
2. **Acessar a página da proposta**
3. **Verificar logs:**

```
Parâmetros da URL: { id: "...", tipo: "arquivo", wpp: false }
Buscando proposta com ID: ...
📦 Resposta completa da API: { success: true, data: {...} }
✅ PropostaData carregado da API: { nome, tipo, arquivo, ... }
```

### Se o arquivo estiver null:

**Causa:** A proposta foi criada antes do sistema de upload estar funcionando

**Solução:** 
1. Excluir a proposta antiga
2. Criar uma nova proposta após o bucket estar configurado
3. O arquivo agora deve ter uma URL válida

## Estrutura esperada dos dados:

### Proposta no banco de dados:
```json
{
  "id": "uuid",
  "nome": "Nome da Proposta",
  "tipo": "arquivo",
  "pedir_whatsapp": false,
  "arquivo": {
    "nome": "teste.pdf",
    "tamanho": 12345,
    "tipo": "application/pdf",
    "url": "https://[projeto].supabase.co/storage/v1/object/public/arquivos-propostas/propostas/...",
    "downloadUrl": "https://[projeto].supabase.co/storage/v1/object/public/arquivos-propostas/propostas/..."
  }
}
```

### Resposta da API /api/proposta/:id:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Nome da Proposta",
    "tipo": "arquivo",
    "pedir_whatsapp": false,
    "arquivo": {
      "url": "https://...",
      "downloadUrl": "https://..."
    }
  }
}
```

## Comandos úteis:

### Testar bucket:
```bash
cd backend
node test-bucket.js
```

### Ver logs do servidor:
```bash
cd backend
npm start
# ou
node server.js
```

### Ver logs no navegador:
- Pressione F12
- Vá na aba "Console"
- Recarregue a página

## Checklist de funcionamento:

- [ ] Bucket "arquivos-propostas" existe no Supabase
- [ ] Bucket está marcado como público
- [ ] Upload funciona (teste com test-bucket.js)
- [ ] Criar proposta salva o arquivo no banco
- [ ] Página proposta.html carrega os dados da API
- [ ] Botão muda para "Download" quando tipo é "arquivo"
- [ ] Campo WhatsApp aparece/esconde conforme configuração
- [ ] Download funciona ao clicar no botão

## Se nada funcionar:

1. **Reinicie o servidor backend**
2. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
3. **Recarregue a página** (Ctrl+F5)
4. **Verifique as permissões do bucket no Supabase**
5. **Verifique se o usuário está autenticado** (para upload)

## Contato e Suporte:

Se os problemas persistirem após seguir estes passos, verifique:
- Configuração do Supabase (URL e chave no .env)
- Permissões de Storage no Supabase
- Logs do servidor backend

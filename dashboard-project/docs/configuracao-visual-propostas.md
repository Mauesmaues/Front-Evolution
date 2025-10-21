# 🎨 Configuração de Visuais para Propostas

## 📋 Resumo
Sistema completo para personalização visual das propostas por empresa, incluindo logo, cores dos objetos flutuantes e cor de fundo do painel esquerdo.

## 🗄️ Passo 1: Criar Tabela no Supabase

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela para armazenar configurações visuais das propostas por empresa
CREATE TABLE visual_proposta (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    logo_url TEXT,
    cor_objetos_flutuantes VARCHAR(7) DEFAULT '#00bcd4',
    cor_fundo_painel_esquerdo VARCHAR(7) DEFAULT '#070707',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id)
);

-- Índice para melhorar performance nas buscas por empresa
CREATE INDEX idx_visual_proposta_empresa_id ON visual_proposta(empresa_id);

-- Comentários para documentação
COMMENT ON TABLE visual_proposta IS 'Armazena configurações visuais das propostas por empresa';
COMMENT ON COLUMN visual_proposta.empresa_id IS 'ID da empresa dona deste visual';
COMMENT ON COLUMN visual_proposta.logo_url IS 'URL do logo armazenado no Supabase Storage';
COMMENT ON COLUMN visual_proposta.cor_objetos_flutuantes IS 'Cor hexadecimal dos objetos decorativos';
COMMENT ON COLUMN visual_proposta.cor_fundo_painel_esquerdo IS 'Cor hexadecimal do fundo do painel esquerdo';
```

**OBS:** O sistema usa o bucket **`arquivos-propostas`** que já existe no projeto (criado pelo UploadController).
Os logos serão salvos na pasta `logos/` dentro deste bucket.

## 📦 Passo 2: Verificar Bucket no Supabase Storage

O sistema utiliza o bucket **`arquivos-propostas`** que já foi criado automaticamente pelo sistema de upload de arquivos das propostas.

**Verifique se o bucket está configurado como público:**

1. Acesse seu projeto no Supabase
2. Vá em **Storage** → **arquivos-propostas**
3. Clique em **Settings** (ícone de engrenagem)
4. Certifique-se que **Public bucket** está **ATIVADO**
5. Os logos serão salvos na pasta `logos/` automaticamente

**Estrutura do bucket:**
```
arquivos-propostas/
├── propostas/           (arquivos PDF/docs das propostas)
└── logos/              (logos das empresas - NOVO)
    └── logo-empresa-{id}-{timestamp}.{ext}
```

## 📦 Passo 3: Instalar Dependência Multer (se ainda não estiver instalada)

O sistema usa **multer** para upload de arquivos. Verifique se já está instalado:

```bash
npm list multer
```

Se não estiver instalado, execute:

```bash
npm install multer
```

## 🔄 Passo 4: Reiniciar o Servidor

Reinicie o servidor Node.js para carregar os novos controllers e rotas:

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente
npm start
```

## 🎯 Como Funciona

### 1️⃣ **Fluxo de Salvamento**

```
Usuário acessa Dashboard → Propostas → Aba Visuais
    ↓
Seleciona Logo + Escolhe Cores
    ↓
Clica em "Salvar Alterações"
    ↓
POST /api/configuracoes/visuais
    ↓
VisualPropostaController.salvarVisual()
    ↓
- Upload do logo para Supabase Storage (bucket: arquivos-propostas/logos/)
- Salva/Atualiza registro na tabela visual_proposta
- Vincula à primeira empresa do usuário
```

### 2️⃣ **Fluxo de Aplicação**

```
Cliente abre proposta.html?id=123
    ↓
Carrega dados da proposta (GET /api/proposta/123)
    ↓
Extrai empresa_id da proposta
    ↓
Busca visual (GET /api/configuracoes/visuais/:empresaId)
    ↓
Aplica visuais:
- Logo → .logo-svg
- Cor objetos → .shape (todos)
- Cor fundo → .left-section
```

## 🗂️ Estrutura de Arquivos Criados

```
backend/
├── controllers/
│   └── VisualPropostaController.js    ✅ CRIADO
└── routes/
    └── api.js                          ✅ ATUALIZADO

public/
├── js/
│   └── propostas.js                    ✅ ATUALIZADO
└── proposta.html                       ✅ ATUALIZADO

docs/
└── configuracao-visual-propostas.md    ✅ ESTE ARQUIVO
```

## 🔌 Endpoints da API

### **POST** `/api/configuracoes/visuais`
Salvar ou atualizar configurações visuais

**Autenticação:** Requerida (sessão do usuário)

**Content-Type:** `multipart/form-data`

**Body:**
```javascript
{
  empresaId: 5,                        // ID da empresa (obrigatório)
  logo: File,                          // Arquivo da imagem (opcional)
  corObjetosFlutuantes: '#00bcd4',     // Cor hexadecimal
  corFundoPainelEsquerdo: '#070707'    // Cor hexadecimal
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "empresa_id": 5,
    "logo_url": "https://xxx.supabase.co/storage/v1/object/public/arquivos-propostas/logos/logo-empresa-5-1729512345678.png",
    "cor_objetos_flutuantes": "#00bcd4",
    "cor_fundo_painel_esquerdo": "#070707",
    "created_at": "2025-10-21T12:00:00Z",
    "updated_at": "2025-10-21T12:05:00Z"
  },
  "message": "Configuração visual salva com sucesso"
}
```

---

### **GET** `/api/configuracoes/visuais`
Buscar configurações visuais do usuário atual (primeira empresa vinculada)

**Autenticação:** Requerida

**Resposta:** Mesmo formato acima

---

### **GET** `/api/configuracoes/visuais/:empresaId`
Buscar configurações visuais de uma empresa específica

**Autenticação:** Não requerida (usado em proposta.html pública)

**Params:**
- `empresaId` - ID da empresa

**Resposta:** Mesmo formato acima, ou padrão se não encontrado:
```json
{
  "success": true,
  "data": {
    "empresa_id": 5,
    "logo_url": null,
    "cor_objetos_flutuantes": "#00bcd4",
    "cor_fundo_painel_esquerdo": "#070707"
  },
  "message": "Configuração visual padrão"
}
```

## 🎨 Interface do Usuário

### **Aba Visuais** (Dashboard → Propostas → Visuais)

**IMPORTANTE:** O sistema requer que você selecione uma empresa antes de editar o visual.

**Fluxo de uso:**
1. ✅ Acesse **Dashboard → Propostas → Visuais**
2. ✅ **Selecione uma empresa** no dropdown
3. ✅ O formulário aparecerá com as configurações atuais da empresa
4. ✅ Faça as alterações desejadas
5. ✅ Clique em "Salvar Alterações"

**Controles disponíveis:**
- ✅ **Seletor de Empresa** (obrigatório)
- ✅ Upload de Logo (PNG, JPG, SVG, WebP - máx. 2MB)
- ✅ Color Picker - Cor dos Objetos Flutuantes
- ✅ Input Hexadecimal - Cor dos Objetos Flutuantes
- ✅ Color Picker - Cor de Fundo do Painel Esquerdo
- ✅ Input Hexadecimal - Cor de Fundo do Painel Esquerdo
- ✅ Preview em Tempo Real
- ✅ Botão "Salvar Alterações"
- ✅ Botão "Resetar" (valores padrão)

**Preview mostra:**
- Logo centralizado
- 4 objetos flutuantes com cores personalizadas
- Painel esquerdo com cor de fundo personalizada
- Painel direito com formulário (inalterado)

**Mensagens importantes:**
- ⚠️ "Cada empresa possui suas próprias configurações visuais. Selecione uma empresa para editar seu visual."
- ℹ️ "As alterações serão aplicadas às propostas desta empresa"

## 🔐 Segurança e Permissões

- ✅ **Upload de logo:** Apenas imagens (JPEG, PNG, SVG, WebP)
- ✅ **Tamanho máximo:** 2MB
- ✅ **Armazenamento:** Supabase Storage (bucket `arquivos-propostas`)
- ✅ **Pasta:** `logos/`
- ✅ **Nomenclatura:** `logo-empresa-{empresaId}-{timestamp}.{ext}`
- ✅ **Validação de cores:** Regex hexadecimal `^#[0-9A-Fa-f]{6}$`
- ✅ **Vínculo por empresa:** Cada empresa tem apenas 1 configuração visual
- ✅ **Usuário acessa:** Apenas empresas às quais está vinculado
- ✅ **Bucket compartilhado:** Usa o mesmo bucket das propostas (arquivos-propostas)

## 🧪 Testando o Sistema

### Teste 1: Seleção de Empresa
1. Faça login no dashboard
2. Vá para **Propostas → Visuais**
3. Observe o alerta: "Cada empresa possui suas próprias configurações visuais..."
4. Verifique se o dropdown tem suas empresas listadas
5. O formulário deve estar oculto inicialmente

### Teste 2: Salvar Visual de uma Empresa
1. Selecione uma empresa no dropdown
2. O formulário deve aparecer automaticamente
3. Upload de uma logo
4. Escolha cores diferentes
5. Clique em "Salvar Alterações"
6. Verifique o console do navegador (deve mostrar sucesso)

### Teste 3: Alternar entre Empresas
1. Selecione uma empresa e configure um visual
2. Salve as alterações
3. Selecione outra empresa
4. Observe que o visual carregado é diferente (ou padrão se não foi configurado)
5. Configure um visual diferente para esta segunda empresa
6. Volte para a primeira empresa - o visual dela deve ser mantido

### Teste 4: Verificar no Banco
```sql
SELECT 
  vp.id,
  e.nome as empresa_nome,
  vp.logo_url,
  vp.cor_objetos_flutuantes,
  vp.cor_fundo_painel_esquerdo,
  vp.created_at,
  vp.updated_at
FROM visual_proposta vp
INNER JOIN empresas e ON e.id = vp.empresa_id
ORDER BY e.nome;
```

### Teste 5: Aplicar na Proposta
1. Crie uma proposta vinculada à empresa com visual configurado
2. Copie o link da proposta
3. Abra em uma aba anônima
4. Verifique se logo e cores da EMPRESA foram aplicadas
5. Crie outra proposta para empresa diferente
6. Verifique que o visual é diferente

### Teste 6: Preview em Tempo Real
1. Selecione uma empresa
2. Mude as cores
3. Observe o preview mudando instantaneamente
4. Não salve, apenas selecione outra empresa
5. Volte para a empresa anterior
6. As cores devem estar nos valores salvos anteriormente (não mudados)

## 🐛 Troubleshooting

### Problema: "Logo não aparece na proposta"
**Soluções:**
- Verifique se o bucket `arquivos-propostas` existe no Supabase Storage
- Configure o bucket como **público**
- Verifique a URL no campo `logo_url` da tabela
- Certifique-se que a pasta `logos/` foi criada automaticamente

### Problema: "Erro ao fazer upload"
**Soluções:**
- Verifique se multer está instalado: `npm list multer`
- Verifique permissões do Supabase Storage
- Tamanho do arquivo < 2MB
- Tipo de arquivo permitido

### Problema: "Cores não aplicam"
**Soluções:**
- Abra o console do navegador (F12)
- Verifique se a função `aplicarVisuais()` foi chamada
- Verifique se `visualData` está preenchido
- Formato hexadecimal correto (#RRGGBB)

### Problema: "Formulário não aparece"
**Soluções:**
- Verifique se você selecionou uma empresa no dropdown
- Verifique se o elemento `containerFormularioVisuais` existe no HTML
- Abra o console (F12) e verifique erros JavaScript

### Problema: "Não consigo salvar - empresaId não informado"
**Soluções:**
- Certifique-se de selecionar uma empresa no dropdown antes de salvar
- Verifique se a variável `empresaSelecionadaVisuais` está definida
- Veja o console do navegador para detalhes do erro
**Soluções:**
- Usuário deve estar vinculado a pelo menos uma empresa
- Verifique tabela `usuario_empresa`
- Proposta deve ter `empresa_id` preenchido

## 📊 Banco de Dados - Relacionamentos

```
empresas
   ↓ (1:N)
usuario_empresa ← usuarios
   ↓ (1:1)
visual_proposta

propostas
   ↓ (N:1)
empresas
   ↓ (1:1)
visual_proposta
```

## 🚀 Próximos Passos Sugeridos

1. ✅ **Adicionar mais opções de customização:**
   - Cor do botão "Quero ver!"
   - Fonte personalizada
   - Cor do texto do formulário

2. ✅ **Múltiplos visuais por empresa:**
   - Permitir criar templates
   - Vincular proposta a um template específico

3. ✅ **Galeria de logos:**
   - Listar logos já enviados
   - Reutilizar logos anteriores

4. ✅ **Exportação de visuais:**
   - Duplicar visual para outra empresa
   - Importar/exportar JSON

## ✅ Checklist de Implementação

- [x] Criar tabela `visual_proposta`
- [x] Criar `VisualPropostaController.js`
- [x] Adicionar rotas em `api.js`
- [x] Implementar upload de logo (Multer + Supabase)
- [x] Atualizar frontend (propostas.js)
- [x] Atualizar proposta.html
- [x] Aplicar visuais dinamicamente
- [ ] Executar SQL para criar tabela visual_proposta
- [ ] Verificar se bucket arquivos-propostas está público
- [ ] Verificar se multer está instalado
- [ ] Reiniciar servidor
- [ ] Testar salvamento de visual
- [ ] Testar aplicação na proposta
- [ ] Testar upload de logo

---

**Documentação criada em:** 21 de outubro de 2025
**Versão:** 1.0
**Autor:** GitHub Copilot + Sistema Dashboard

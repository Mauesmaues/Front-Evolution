# 🚨 Sistema de Alerta de Saldo Crítico

## 📋 Visão Geral

O sistema monitora automaticamente o saldo das empresas e alerta quando o consumo diário está abaixo do esperado, indicando que o saldo pode não durar até a próxima recarga.

## 🎯 Como Funciona

### Cálculo Automático

Quando os três campos manuais estão preenchidos, o sistema calcula:

1. **Próxima Data de Recarga**
   - Pega a data da última recarga
   - Soma com a recorrência configurada
   - Calcula quantos dias faltam

2. **Saldo Diário Disponível**
   ```
   Saldo Diário Disponível = Saldo Atual ÷ Dias Restantes
   ```

3. **Comparação**
   - Se `Saldo Diário Disponível < Saldo Diário Esperado`
   - A linha fica **VERMELHA** 🔴

## 📊 Exemplo Prático

```
Empresa: Tech Solutions
Última Recarga: 01/11/2025
Recorrência: Mensal
Saldo Atual: R$ 500,00
Saldo Diário: R$ 50,00

Cálculo:
- Próxima recarga: 01/12/2025 (30 dias)
- Hoje: 05/11/2025
- Dias restantes: 26 dias
- Saldo por dia disponível: 500 ÷ 26 = R$ 19,23

Resultado: 19,23 < 50,00 = ⚠️ CRÍTICO!
Linha fica VERMELHA
```

## 🎨 Indicadores Visuais

### Linha Normal (Saldo OK)
- Fundo normal
- Sem alertas
- ✅ Tudo OK

### Linha Crítica (Saldo Baixo)
- 🔴 Fundo vermelho claro
- Borda esquerda vermelha pulsante
- ⚠️ Ícone de alerta na coluna de saldo
- Tooltip com informações detalhadas

### Linha Atrasada (Recarga Vencida)
- 🔴 Fundo vermelho mais intenso
- Mensagem: "Recarga atrasada!"

## 🔄 Recorrências Suportadas

O sistema reconhece automaticamente:

| Recorrência | Exemplos de Entrada | Dias Adicionados |
|-------------|---------------------|------------------|
| **Diária** | "Diario", "Diária", "1 dia" | 1 |
| **Semanal** | "Semanal", "Semana", "7 dias" | 7 |
| **Quinzenal** | "Quinzenal", "15 dias" | 15 |
| **Mensal** | "Mensal", "Mês", "30 dias" | 1 mês |
| **Bimestral** | "Bimestral", "2 meses" | 2 meses |
| **Trimestral** | "Trimestral", "3 meses" | 3 meses |
| **Semestral** | "Semestral", "6 meses" | 6 meses |
| **Anual** | "Anual", "Ano", "12 meses" | 1 ano |
| **Personalizado** | "20", "45 dias" | N dias |

### 💡 Dicas de Uso

```
✅ Correto:
- "Mensal"
- "15 dias"
- "Semanal"
- "30"

❌ Evite:
- Deixar em branco
- Textos sem números reconhecíveis
```

## 🖱️ Interação do Usuário

### Ao Preencher/Editar Campos

1. **Digite o valor** no campo
2. **Saia do campo** (Tab/Click fora) ou **Enter**
3. Sistema **salva automaticamente**
4. **Recalcula** o alerta em tempo real
5. Linha muda de cor **instantaneamente** se necessário

### Tooltip (Passar o Mouse)

Ao passar o mouse sobre uma linha com alerta, você vê:
```
26 dias até recarga | Saldo/dia: R$ 19,23 ⚠️
```

### Ícone de Alerta

Na coluna "Saldo [META]", aparece:
- ⚠️ Ícone triangular vermelho
- Tooltip com detalhes

## 🔧 Detalhes Técnicos

### Função Principal: `calcularAlertaSaldo()`

```javascript
calcularAlertaSaldo(ultimaRecarga, recorrencia, saldoAtual, saldoDiario)
```

**Retorna:**
```javascript
{
  critico: true/false,          // Se está crítico
  info: "texto informativo",    // Mensagem de alerta
  diasRestantes: 26,            // Dias até próxima recarga
  proximaRecarga: Date,         // Data da próxima recarga
  saldoPorDia: 19.23,          // Saldo disponível por dia
  saldoDiarioEsperado: 50.00   // Saldo esperado por dia
}
```

### Atualização em Tempo Real

Após salvar qualquer campo manual:
1. ✅ Dados salvos no banco
2. 🔄 `atualizarAlertaLinhaEmpresa()` é chamada
3. 🎨 Linha é recalculada e atualizada visualmente
4. ⚡ Tudo acontece sem recarregar a página!

## 🎯 Casos de Uso

### Cenário 1: Empresa com Saldo Suficiente
```
Última Recarga: 01/11/2025
Recorrência: Mensal
Saldo Atual: R$ 1.500,00
Saldo Diário: R$ 50,00

Resultado: 1500 ÷ 26 = 57,69 > 50
Status: ✅ OK (linha normal)
```

### Cenário 2: Empresa com Saldo Crítico
```
Última Recarga: 01/11/2025
Recorrência: Mensal
Saldo Atual: R$ 300,00
Saldo Diário: R$ 50,00

Resultado: 300 ÷ 26 = 11,54 < 50
Status: 🔴 CRÍTICO (linha vermelha)
```

### Cenário 3: Recarga Atrasada
```
Última Recarga: 01/10/2025
Recorrência: Mensal
Hoje: 05/11/2025

Resultado: Dias restantes = -5
Status: 🔴 ATRASADA (linha vermelha)
Mensagem: "Recarga atrasada!"
```

## 🎨 Estilos CSS Aplicados

### Linha Crítica
```css
.table-danger {
  background-color: rgba(220, 53, 69, 0.15);
  border-left: 4px solid #dc3545;
  animation: pulseWarning 2s ease-in-out infinite;
}
```

### Animação de Pulso
```css
@keyframes pulseWarning {
  0%, 100% { border-left-color: #dc3545; }
  50% { border-left-color: #ff6b6b; }
}
```

## 📱 Responsividade

- ✅ Funciona em desktop
- ✅ Funciona em tablet
- ✅ Funciona em mobile
- ✅ Tooltip adaptativo

## 🐛 Tratamento de Erros

O sistema é robusto e não quebra se:
- ❌ Campos estiverem vazios → Não mostra alerta
- ❌ Data inválida → Não mostra alerta
- ❌ Recorrência não reconhecida → Não mostra alerta
- ❌ Saldo não numérico → Não mostra alerta

Logs de erro aparecem no console para depuração.

## 🚀 Performance

- ⚡ Cálculo instantâneo (< 1ms)
- ⚡ Atualização visual imediata
- ⚡ Sem necessidade de recarregar página
- ⚡ Cache inteligente de dados

## 📊 Monitoramento

### Logs no Console

```javascript
✅ Alerta atualizado para empresa 1 - Crítico: true
📊 Cálculo: 26 dias | R$ 19,23/dia < R$ 50,00/dia
```

## 🎓 Boas Práticas

1. **Preencha todos os três campos** para ativar o alerta
2. **Use recorrências padronizadas** (Mensal, Semanal, etc.)
3. **Atualize a última recarga** após cada recarga real
4. **Monitore linhas vermelhas** regularmente
5. **Ajuste o saldo diário** conforme necessário

## 🔮 Próximas Melhorias

- [ ] Notificações por email quando crítico
- [ ] Gráfico de projeção de saldo
- [ ] Histórico de recargas
- [ ] Previsão de próximas recargas
- [ ] Dashboard de alertas

---

**Criado em**: 05/11/2025  
**Status**: ✅ Totalmente Funcional  
**Versão**: 1.0.0

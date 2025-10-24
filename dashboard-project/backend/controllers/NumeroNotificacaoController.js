const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

class NumeroNotificacaoController {
  
  // Listar todos os números cadastrados
  static async listarNumeros(req, res) {
    try {
      const { data, error } = await supabase
        .from('notificasaldobaixo')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar números:', error);
        return res.status(500).json(
          responseFormatter.error('Erro ao buscar números de notificação.')
        );
      }
      
      return res.json(
        responseFormatter.success(data, 'Números encontrados.')
      );
      
    } catch (error) {
      console.error('Erro interno ao listar números:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
  
  // Adicionar novo número
  static async adicionarNumero(req, res) {
    try {
      console.log('📥 [NumeroNotificacaoController] adicionarNumero - body:', req.body);
      const { numero } = req.body;
      
      if (!numero) {
        return res.status(400).json(
          responseFormatter.error('Número não fornecido.')
        );
      }
      
      // Verificar se o número já existe
      const { data: existente, error: errorVerificacao } = await supabase
        .from('notificasaldobaixo')
        .select('id')
        .eq('numero', numero)
        .single();

      if (errorVerificacao && !existente) {
        // Quando não existe, supabase pode retornar "No rows found" como erro em .single(),
        // então só reportamos erro quando realmente houver um problema diferente.
        if (errorVerificacao.code && errorVerificacao.code !== 'PGRST116') {
          console.error('Erro na verificação de existência:', errorVerificacao);
          return res.status(500).json(
            responseFormatter.error('Erro ao verificar número existente.', errorVerificacao)
          );
        }
      }

      if (existente) {
        return res.status(400).json(
          responseFormatter.error('Este número já está cadastrado.')
        );
      }
      
      // Inserir número
      const { data, error } = await supabase
        .from('notificasaldobaixo')
        .insert([{ numero }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar número:', error);
        return res.status(500).json(
          responseFormatter.error('Erro ao adicionar número.', error)
        );
      }
      
      return res.status(201).json(
        responseFormatter.success(data, 'Número cadastrado com sucesso.')
      );
      
    } catch (error) {
      console.error('Erro interno ao adicionar número:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
  
  // Excluir número
  static async excluirNumero(req, res) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('notificasaldobaixo')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir número:', error);
        return res.status(500).json(
          responseFormatter.error('Erro ao excluir número.')
        );
      }
      
      return res.json(
        responseFormatter.success(null, 'Número excluído com sucesso.')
      );
      
    } catch (error) {
      console.error('Erro interno ao excluir número:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
  
  // Enviar notificações de saldo baixo
  static async enviarNotificacoesSaldoBaixo(req, res) {
    try {
      console.log('🔔 Iniciando envio de notificações de saldo baixo...');
      
      // 1. Buscar todos os números cadastrados
      const { data: numeros, error: errorNumeros } = await supabase
        .from('notificasaldobaixo')
        .select('*');
      
      if (errorNumeros) {
        console.error('Erro ao buscar números:', errorNumeros);
        return res.status(500).json(
          responseFormatter.error('Erro ao buscar números de notificação.')
        );
      }
      
      if (!numeros || numeros.length === 0) {
        console.log('⚠️ Nenhum número cadastrado para notificação');
        return res.json(
          responseFormatter.success(null, 'Nenhum número cadastrado para notificação.')
        );
      }
      
      // 2. Buscar todas as empresas
      const { data: empresas, error: errorEmpresas } = await supabase
        .from('empresas')
        .select('*');
      
      if (errorEmpresas || !empresas || empresas.length === 0) {
        console.log('⚠️ Nenhuma empresa encontrada');
        return res.json(
          responseFormatter.success(null, 'Nenhuma empresa encontrada.')
        );
      }
      
      // 3. Buscar saldos e verificar empresas com saldo baixo
      const empresasComSaldoBaixo = [];
      const LIMIAR_SALDO_BAIXO = 90;
      
      // Função auxiliar para extrair valor numérico do saldo (formato BR/EN)
      const extrairValorSaldo = (saldo) => {
        if (saldo === null || saldo === undefined) return NaN;
        if (typeof saldo === 'number') return saldo;
        
        let s = String(saldo).trim();
        if (!s) return NaN;
        
        // Verificar se é cartão
        const saldoStrLower = s.toLowerCase();
        if (saldoStrLower.includes('cartão') || saldoStrLower.includes('cartao') || saldoStrLower.includes('card')) {
          return NaN;
        }
        
        // Remover símbolos de moeda e letras, manter dígitos, ponto e vírgula
        let clean = s.replace(/[^\d.,-]/g, '');
        if (!clean) return NaN;
        
        // Tratar formatos BR e EN
        if (clean.indexOf('.') !== -1 && clean.indexOf(',') !== -1) {
          const posVirgula = clean.indexOf(',');
          const posPonto = clean.indexOf('.');
          
          if (posPonto < posVirgula) {
            // Formato BR (1.029,61): remover pontos e trocar vírgula por ponto
            clean = clean.replace(/\./g, '').replace(',', '.');
          } else {
            // Formato EN (1,029.61): remover vírgulas
            clean = clean.replace(/,/g, '');
          }
        } else if (clean.indexOf(',') !== -1 && clean.indexOf('.') === -1) {
          // Só vírgula (formato BR): trocar por ponto
          clean = clean.replace(',', '.');
        } else if (clean.indexOf('.') !== -1 && clean.indexOf(',') === -1) {
          // Só ponto: verificar se é separador de milhar ou decimal
          const partes = clean.split('.');
          
          if (partes.length > 2) {
            // Múltiplos pontos: separador de milhar BR
            clean = clean.replace(/\./g, '');
          } else if (partes.length === 2) {
            const parteDecimal = partes[1];
            // Se tem 3 dígitos após o ponto, é separador de milhar BR (ex: 1.029)
            if (parteDecimal.length === 3) {
              clean = clean.replace('.', '');
            }
            // Senão, é decimal EN (ex: 10.5 ou 10.50)
          }
        }
        
        const num = parseFloat(clean);
        return isNaN(num) ? NaN : num;
      };
      
      for (const emp of empresas) {
        try {
          const resSaldo = await fetch(`http://localhost:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/saldo`);
          const saldo = await resSaldo.json();
          const saldoOriginal = saldo?.data?.saldoOriginal || 0;
          
          // Extrair valor numérico usando função melhorada
          const valorNumerico = extrairValorSaldo(saldoOriginal);
          
          if (!isNaN(valorNumerico) && valorNumerico < LIMIAR_SALDO_BAIXO) {
            empresasComSaldoBaixo.push({
              nome: emp.nome,
              contaDeAnuncio: emp.contaDeAnuncio,
              saldo: valorNumerico.toFixed(2)
            });
          }
        } catch (err) {
          console.error(`Erro ao buscar saldo de ${emp.nome}:`, err);
        }
      }
      
      if (empresasComSaldoBaixo.length === 0) {
        console.log('✅ Nenhuma empresa com saldo baixo');
        return res.json(
          responseFormatter.success(null, 'Nenhuma empresa com saldo baixo.')
        );
      }
      
      console.log(`🚨 ${empresasComSaldoBaixo.length} empresa(s) com saldo baixo encontrada(s)`);
      
      // 4. Montar mensagem
      let mensagem = `⚠️ *ALERTA DE SALDO BAIXO*\n\n`;
      mensagem += `${empresasComSaldoBaixo.length} empresa(s) com saldo abaixo de R$${LIMIAR_SALDO_BAIXO}:\n\n`;
      
      empresasComSaldoBaixo.forEach((emp, index) => {
        mensagem += `${index + 1}. *${emp.nome}*\n`;
        mensagem += `   💰 Saldo: R$ ${emp.saldo}\n`;
        mensagem += `   📊 Conta: ${emp.contaDeAnuncio}\n\n`;
      });
      
      // 5. Enviar notificação para cada número (com verificação de data)
      const today = new Date().toISOString().split('T')[0];
      let numerosNotificados = 0;
      let numerosIgnorados = 0;
      
      for (const numeroData of numeros) {
        try {
          // Verificar se já recebeu notificação hoje
          const ultimaNoti = numeroData.ultimanoti;
          
          if (ultimaNoti === today) {
            console.log(`⏭️ Pulando ${numeroData.numero} - Já recebeu notificação hoje (${ultimaNoti})`);
            numerosIgnorados++;
            continue; // Pula para o próximo número
          }
          
          // Enviar notificação
          const response = await fetch(`https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/133147/oma7bYgznono/`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              telefone: numeroData.numero,
              nome: 'Sistema de Alertas',
              mensagem: mensagem
            })
          });
          
          const responseData = await response.json();
          console.log(`✅ Notificação enviada para ${numeroData.numero}:`, responseData);
          
          // Atualizar data da última notificação
          await supabase
            .from('notificasaldobaixo')
            .update({ ultimanoti: today })
            .eq('id', numeroData.id);
          
          numerosNotificados++;
          
        } catch (error) {
          console.error(`❌ Erro ao enviar notificação para ${numeroData.numero}:`, error);
        }
      }
      
      return res.json(
        responseFormatter.success(
          { 
            numerosNotificados: numeros.length, 
            empresasComSaldoBaixo: empresasComSaldoBaixo.length 
          }, 
          'Notificações enviadas com sucesso.'
        )
      );
      
    } catch (error) {
      console.error('Erro interno ao enviar notificações:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
}

module.exports = NumeroNotificacaoController;

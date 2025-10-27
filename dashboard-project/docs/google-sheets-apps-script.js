/**
 * ============================================================
 * GOOGLE SHEETS APPS SCRIPT - ENVIAR LEADS PARA CRM
 * ============================================================
 * 
 * Este script envia leads de uma planilha Google Sheets para
 * o backend do CRM com permissionamento por empresa.
 * 
 * IMPORTANTE:
 * - Cada lead DEVE ter empresa_id
 * - Use URL do Ngrok para testes locais
 * - Use URL de produção para ambiente real
 * ============================================================
 */

// ⭐ CONFIGURAÇÃO - ALTERE AQUI ⭐
const CONFIG = {
  // URL do backend (altere conforme necessário)
  // DESENVOLVIMENTO (Ngrok): 'https://abc123.ngrok.io/api/leads'
  // PRODUÇÃO: 'https://seu-backend.com/api/leads'
  urlBackend: 'http://162.240.157.62:3000/api/leads',
  
  // ID da empresa (consulte no banco: SELECT id, nome FROM empresas)
  empresaId: '1',
  
  // Nome da aba da planilha
  abaLeads: 'Formulário do Meta',
  
  // Linha onde começam os dados (1 = cabeçalho, 2 = primeiro lead)
  linhaInicio: 2,
  
  // Coluna onde será marcado o status do envio (letra da coluna, ex: 'J', 'K', etc)
  // Esta coluna será criada automaticamente se não existir
  colunaStatus: 'J',
  
  // Ativar modo debug (logs detalhados)
  debug: true
};

/**
 * Criar menu personalizado no Google Sheets
 * Este menu aparece quando a planilha é aberta
 */
function onOpen() {
  log('📋 Criando menu personalizado...');
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 CRM')
    .addItem('📤 Enviar Leads Novos', 'enviarLeadsNovos')
    .addItem('🔄 Reenviar Todos (Ignorar Status)', 'reenviarTodosLeads')
    .addItem('🧪 Testar Envio (1 Lead)', 'testarEnvioUmLead')
    .addSeparator()
    .addItem('📊 Ver Configuração', 'mostrarConfiguracao')
    .addItem('🔧 Preparar Planilha', 'prepararPlanilha')
    .addItem('⏰ Configurar Trigger Automático', 'configurarTrigger')
    .addItem('🗑️ Remover Trigger Automático', 'removerTrigger')
    .addToUi();
  log('✅ Menu criado com sucesso');
}

/**
 * Função auxiliar para logs com debug
 */
function log(mensagem) {
  if (CONFIG.debug) {
    const timestamp = new Date().toISOString();
    Logger.log(`[${timestamp}] ${mensagem}`);
  }
}

/**
 * Preparar planilha adicionando coluna de status
 */
function prepararPlanilha() {
  try {
    log('🔧 Preparando planilha...');
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaLeads);
    
    if (!planilha) {
      SpreadsheetApp.getUi().alert('Erro', `Aba "${CONFIG.abaLeads}" não encontrada!`, SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Converter letra da coluna para número (A=1, B=2, etc)
    const colunaNumero = CONFIG.colunaStatus.toUpperCase().charCodeAt(0) - 64;
    log(`📍 Coluna de status: ${CONFIG.colunaStatus} (número ${colunaNumero})`);
    
    // Adicionar cabeçalho se não existir
    const celulaStatus = planilha.getRange(1, colunaNumero);
    const valorAtual = celulaStatus.getValue();
    
    if (!valorAtual || valorAtual.toString().trim() === '') {
      log('➕ Adicionando cabeçalho "Status CRM"');
      celulaStatus.setValue('Status CRM');
      celulaStatus.setFontWeight('bold');
      celulaStatus.setBackground('#4CAF50');
      celulaStatus.setFontColor('#FFFFFF');
    } else {
      log(`ℹ️ Cabeçalho já existe: "${valorAtual}"`);
    }
    
    SpreadsheetApp.getUi().alert(
      '✅ Sucesso!', 
      `Planilha preparada!\n\nColuna de status: ${CONFIG.colunaStatus}\nAba: ${CONFIG.abaLeads}`, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    log('✅ Planilha preparada com sucesso');
    
  } catch (error) {
    log(`❌ Erro ao preparar planilha: ${error}`);
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Mostrar configuração atual
 */
function mostrarConfiguracao() {
  log('📊 Mostrando configuração...');
  const ui = SpreadsheetApp.getUi();
  
  // Verificar se há triggers ativos
  const triggers = ScriptApp.getProjectTriggers();
  const triggerAtivo = triggers.length > 0 ? `✅ SIM (${triggers.length} trigger(s))` : '❌ NÃO';
  
  const mensagem = `
📋 Configuração Atual:

🌐 URL do Backend:
${CONFIG.urlBackend}

🏢 Empresa ID: ${CONFIG.empresaId}

📊 Aba: ${CONFIG.abaLeads}
📍 Linha Início: ${CONFIG.linhaInicio}
📝 Coluna Status: ${CONFIG.colunaStatus}
🐛 Debug: ${CONFIG.debug ? 'Ativado' : 'Desativado'}

⏰ Trigger Automático: ${triggerAtivo}

⚙️ Para alterar, edite o objeto CONFIG no código.
  `;
  
  ui.alert('Configuração do CRM', mensagem, ui.ButtonSet.OK);
  log('✅ Configuração exibida');
}

/**
 * Enviar APENAS leads novos (sem status ou com status vazio)
 * Esta é a função que deve ser chamada pelo trigger automático
 */
function enviarLeadsNovos() {
  try {
    log('🚀 ==== INICIANDO ENVIO DE LEADS NOVOS ====');
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaLeads);
    
    if (!planilha) {
      log(`❌ Aba "${CONFIG.abaLeads}" não encontrada`);
      return;
    }
    
    const dados = planilha.getDataRange().getValues();
    const cabecalho = dados[0];
    const colunaNumero = CONFIG.colunaStatus.toUpperCase().charCodeAt(0) - 64;
    
    log(`📊 Total de linhas na planilha: ${dados.length}`);
    log(`📍 Coluna de status: ${CONFIG.colunaStatus} (índice ${colunaNumero - 1})`);
    
    let processados = 0;
    let enviados = 0;
    let erros = 0;
    let pulados = 0;
    
    // Processar cada linha
    for (let i = CONFIG.linhaInicio - 1; i < dados.length; i++) {
      const linha = dados[i];
      const numeroLinha = i + 1;
      
      log(`\n--- Processando linha ${numeroLinha} ---`);
      
      // Pular linhas vazias (sem dados na primeira coluna)
      if (!linha[0] || linha[0].toString().trim() === '') {
        log(`⏭️ Linha ${numeroLinha}: Vazia, pulando`);
        continue;
      }
      
      processados++;
      
      // Verificar status atual
      const statusAtual = linha[colunaNumero - 1] ? linha[colunaNumero - 1].toString().trim() : '';
      log(`📋 Linha ${numeroLinha}: Status atual = "${statusAtual}"`);
      
      // Pular se já foi enviado com sucesso
      if (statusAtual === '✅ Enviado' || statusAtual.includes('Sucesso')) {
        log(`⏭️ Linha ${numeroLinha}: Já foi enviado, pulando`);
        pulados++;
        continue;
      }
      
      try {
        log(`📤 Linha ${numeroLinha}: Montando dados do lead...`);
        const lead = montarLead(cabecalho, linha);
        log(`📦 Linha ${numeroLinha}: Lead montado - Nome: ${lead.nome || 'Sem nome'}`);
        
        // Marcar como "Enviando..."
        planilha.getRange(numeroLinha, colunaNumero).setValue('⏳ Enviando...');
        SpreadsheetApp.flush(); // Forçar atualização visual
        
        log(`🌐 Linha ${numeroLinha}: Enviando para ${CONFIG.urlBackend}...`);
        const resposta = enviarLead(lead);
        
        log(`📡 Linha ${numeroLinha}: Resposta recebida - HTTP ${resposta.httpCode}`);
        
        if (resposta.success) {
          // Sucesso
          const timestamp = new Date().toLocaleString('pt-BR');
          const mensagemSucesso = `✅ Enviado\n${timestamp}`;
          planilha.getRange(numeroLinha, colunaNumero).setValue(mensagemSucesso);
          
          enviados++;
          log(`✅ Linha ${numeroLinha}: SUCESSO - Lead ${lead.nome} enviado`);
        } else {
          // Erro
          const mensagemErro = `❌ Erro\n${resposta.message || 'Erro desconhecido'}`;
          planilha.getRange(numeroLinha, colunaNumero).setValue(mensagemErro);
          planilha.getRange(numeroLinha, colunaNumero).setBackground('#ffebee'); // Vermelho claro
          
          erros++;
          log(`❌ Linha ${numeroLinha}: ERRO - ${resposta.message}`);
        }
        
      } catch (error) {
        erros++;
        const mensagemErro = `❌ Erro\n${error.toString().substring(0, 50)}`;
        planilha.getRange(numeroLinha, colunaNumero).setValue(mensagemErro);
        planilha.getRange(numeroLinha, colunaNumero).setBackground('#ffebee');
        
        log(`❌ Linha ${numeroLinha}: EXCEÇÃO - ${error}`);
      }
      
      // Delay para não sobrecarregar a API
      Utilities.sleep(300);
    }
    
    log('\n🏁 ==== RESUMO DO PROCESSAMENTO ====');
    log(`📊 Total processados: ${processados}`);
    log(`✅ Enviados: ${enviados}`);
    log(`❌ Erros: ${erros}`);
    log(`⏭️ Pulados (já enviados): ${pulados}`);
    log('========================================\n');
    
    // Se foi executado manualmente, mostrar resultado
    if (enviados > 0 || erros > 0) {
      const mensagemFinal = `✅ Enviados: ${enviados}\n❌ Erros: ${erros}\n⏭️ Pulados: ${pulados}`;
      SpreadsheetApp.getUi().alert('Resultado do Envio', mensagemFinal, SpreadsheetApp.getUi().ButtonSet.OK);
    }
    
  } catch (error) {
    log(`❌ ERRO FATAL: ${error}`);
    throw error;
  }
}

/**
 * Reenviar TODOS os leads, ignorando o status
 * Use com cuidado! Vai reenviar até mesmo os já enviados
 */
function reenviarTodosLeads() {
  try {
    log('⚠️ ==== REENVIO FORÇADO DE TODOS OS LEADS ====');
    const ui = SpreadsheetApp.getUi();
    
    // Confirmação dupla
    const resposta = ui.alert(
      '⚠️ ATENÇÃO', 
      'Isso vai REENVIAR TODOS os leads, incluindo os já enviados!\n\nTem certeza?', 
      ui.ButtonSet.YES_NO
    );
    
    if (resposta !== ui.Button.YES) {
      log('❌ Reenvio cancelado pelo usuário');
      return;
    }
    
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaLeads);
    if (!planilha) {
      ui.alert('Erro', `Aba "${CONFIG.abaLeads}" não encontrada!`, ui.ButtonSet.OK);
      return;
    }
    
    const dados = planilha.getDataRange().getValues();
    const cabecalho = dados[0];
    const colunaNumero = CONFIG.colunaStatus.toUpperCase().charCodeAt(0) - 64;
    
    let enviados = 0;
    let erros = 0;
    const mensagensErro = [];
    
    // Processar cada linha (sem verificar status)
    for (let i = CONFIG.linhaInicio - 1; i < dados.length; i++) {
      const linha = dados[i];
      const numeroLinha = i + 1;
      
      // Pular linhas vazias
      if (!linha[0]) continue;
      
      try {
        const lead = montarLead(cabecalho, linha);
        log(`📤 Reenviando linha ${numeroLinha}: ${lead.nome}`);
        
        planilha.getRange(numeroLinha, colunaNumero).setValue('⏳ Enviando...');
        const resposta = enviarLead(lead);
        
        if (resposta.success) {
          const timestamp = new Date().toLocaleString('pt-BR');
          planilha.getRange(numeroLinha, colunaNumero).setValue(`✅ Enviado\n${timestamp}`);
          enviados++;
          log(`✅ Linha ${numeroLinha}: SUCESSO`);
        } else {
          const mensagemErro = `❌ Erro\n${resposta.message || 'Erro desconhecido'}`;
          planilha.getRange(numeroLinha, colunaNumero).setValue(mensagemErro);
          erros++;
          mensagensErro.push(`${lead.nome}: ${resposta.message}`);
          log(`❌ Linha ${numeroLinha}: ERRO - ${resposta.message}`);
        }
        
        Utilities.sleep(500);
        
      } catch (error) {
        erros++;
        const mensagemErro = `❌ Erro\n${error.toString().substring(0, 50)}`;
        planilha.getRange(numeroLinha, colunaNumero).setValue(mensagemErro);
        mensagensErro.push(`Linha ${numeroLinha}: ${error.toString()}`);
        log(`❌ Linha ${numeroLinha}: EXCEÇÃO - ${error}`);
      }
    }
    
    // Mostrar resultado
    let mensagemFinal = `✅ Enviados: ${enviados}\n❌ Erros: ${erros}`;
    
    if (mensagensErro.length > 0) {
      mensagemFinal += '\n\n🔍 Detalhes dos erros:\n' + mensagensErro.slice(0, 5).join('\n');
      if (mensagensErro.length > 5) {
        mensagemFinal += `\n... e mais ${mensagensErro.length - 5} erros (veja os logs)`;
      }
    }
    
    ui.alert('Resultado do Reenvio', mensagemFinal, ui.ButtonSet.OK);
    log('🏁 Reenvio concluído');
    
  } catch (error) {
    log(`❌ ERRO FATAL no reenvio: ${error}`);
    SpreadsheetApp.getUi().alert('❌ Erro Fatal', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Testar envio de um único lead (primeira linha de dados não enviada)
 */
function testarEnvioUmLead() {
  try {
    log('🧪 ==== TESTE DE ENVIO (1 LEAD) ====');
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.abaLeads);
    
    if (!planilha) {
      SpreadsheetApp.getUi().alert('Erro', `Aba "${CONFIG.abaLeads}" não encontrada!`, SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const dados = planilha.getDataRange().getValues();
    const cabecalho = dados[0];
    const colunaNumero = CONFIG.colunaStatus.toUpperCase().charCodeAt(0) - 64;
    
    log(`📊 Buscando primeira linha não enviada...`);
    
    // Buscar primeira linha não enviada
    let linhaParaTestar = null;
    let numeroLinhaParaTestar = null;
    
    for (let i = CONFIG.linhaInicio - 1; i < dados.length; i++) {
      const linha = dados[i];
      
      if (!linha[0]) continue; // Pular vazias
      
      const status = linha[colunaNumero - 1] ? linha[colunaNumero - 1].toString() : '';
      
      if (!status.includes('✅') && !status.includes('Enviado')) {
        linhaParaTestar = linha;
        numeroLinhaParaTestar = i + 1;
        log(`✅ Encontrada linha ${numeroLinhaParaTestar} sem envio`);
        break;
      }
    }
    
    if (!linhaParaTestar) {
      SpreadsheetApp.getUi().alert('Info', 'Todos os leads já foram enviados!\n\nUse "Reenviar Todos" para reenviar.', SpreadsheetApp.getUi().ButtonSet.OK);
      log('ℹ️ Nenhum lead pendente encontrado');
      return;
    }
    
    // Montar lead
    log(`📦 Montando dados do lead da linha ${numeroLinhaParaTestar}...`);
    const lead = montarLead(cabecalho, linhaParaTestar);
    log(`📋 Lead montado: ${JSON.stringify(lead, null, 2)}`);
    
    // Marcar como enviando
    planilha.getRange(numeroLinhaParaTestar, colunaNumero).setValue('⏳ Testando...');
    
    // Enviar
    log(`🌐 Enviando para ${CONFIG.urlBackend}...`);
    const resposta = enviarLead(lead);
    log(`📡 Resposta: ${JSON.stringify(resposta, null, 2)}`);
    
    if (resposta.success) {
      const timestamp = new Date().toLocaleString('pt-BR');
      planilha.getRange(numeroLinhaParaTestar, colunaNumero).setValue(`✅ Enviado\n${timestamp}`);
      
      SpreadsheetApp.getUi().alert(
        '✅ Sucesso!', 
        `Lead "${lead.nome}" enviado com sucesso!\n\nLinha: ${numeroLinhaParaTestar}\nID: ${resposta.data?.id || 'N/A'}`, 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      log('✅ Teste concluído com SUCESSO');
    } else {
      const mensagemErro = `❌ Erro\n${resposta.message || 'Erro desconhecido'}`;
      planilha.getRange(numeroLinhaParaTestar, colunaNumero).setValue(mensagemErro);
      planilha.getRange(numeroLinhaParaTestar, colunaNumero).setBackground('#ffebee');
      
      SpreadsheetApp.getUi().alert(
        '❌ Erro', 
        `Falha ao enviar lead:\n\nLinha: ${numeroLinhaParaTestar}\nErro: ${resposta.message || 'Erro desconhecido'}\nHTTP: ${resposta.httpCode}`, 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      log(`❌ Teste concluído com ERRO: ${resposta.message}`);
    }
    
  } catch (error) {
    log(`❌ EXCEÇÃO no teste: ${error}`);
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Configurar trigger automático para executar a cada 1 minuto
 */
function configurarTrigger() {
  try {
    log('⏰ Configurando trigger automático...');
    
    // Verificar se já existe trigger
    const triggers = ScriptApp.getProjectTriggers();
    const triggerExistente = triggers.find(t => t.getHandlerFunction() === 'enviarLeadsNovos');
    
    if (triggerExistente) {
      const resposta = SpreadsheetApp.getUi().alert(
        '⚠️ Trigger já existe', 
        'Já existe um trigger automático configurado.\n\nDeseja removê-lo e criar um novo?', 
        SpreadsheetApp.getUi().ButtonSet.YES_NO
      );
      
      if (resposta === SpreadsheetApp.getUi().Button.YES) {
        ScriptApp.deleteTrigger(triggerExistente);
        log('🗑️ Trigger antigo removido');
      } else {
        log('❌ Configuração cancelada');
        return;
      }
    }
    
    // Criar novo trigger (a cada 1 minuto)
    ScriptApp.newTrigger('enviarLeadsNovos')
      .timeBased()
      .everyMinutes(1)
      .create();
    
    SpreadsheetApp.getUi().alert(
      '✅ Sucesso!', 
      'Trigger automático configurado!\n\nA função "enviarLeadsNovos" será executada a cada 1 minuto.\n\nApenas leads novos (sem status) serão enviados.', 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    log('✅ Trigger criado com sucesso');
    
  } catch (error) {
    log(`❌ Erro ao configurar trigger: ${error}`);
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Remover trigger automático
 */
function removerTrigger() {
  try {
    log('🗑️ Removendo triggers...');
    
    const triggers = ScriptApp.getProjectTriggers();
    let removidos = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'enviarLeadsNovos') {
        ScriptApp.deleteTrigger(trigger);
        removidos++;
        log(`🗑️ Trigger removido: ${trigger.getUniqueId()}`);
      }
    });
    
    if (removidos > 0) {
      SpreadsheetApp.getUi().alert(
        '✅ Sucesso!', 
        `${removidos} trigger(s) removido(s).\n\nO envio automático foi desativado.`, 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      log(`✅ ${removidos} trigger(s) removido(s)`);
    } else {
      SpreadsheetApp.getUi().alert(
        'ℹ️ Info', 
        'Nenhum trigger automático encontrado.', 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      log('ℹ️ Nenhum trigger encontrado');
    }
    
  } catch (error) {
    log(`❌ Erro ao remover trigger: ${error}`);
    SpreadsheetApp.getUi().alert('❌ Erro', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Montar objeto lead a partir do cabeçalho e linha de dados
 * Adiciona logs detalhados para debug
 */
function montarLead(cabecalho, linha) {
  log('🔨 Montando lead...');
  
  const lead = {
    empresa_id: CONFIG.empresaId, // ⭐ OBRIGATÓRIO
    origem: 'Google Sheets',
    data_importacao: new Date().toISOString()
  };
  
  log(`📋 Empresa ID: ${CONFIG.empresaId}`);
  
  // Mapear colunas
  cabecalho.forEach((nomeColuna, index) => {
    const valor = linha[index];
    
    // Pular valores vazios
    if (valor === null || valor === undefined || valor === '') {
      log(`⏭️ Coluna "${nomeColuna}": vazia, pulando`);
      return;
    }
    
    // Normalizar nome da coluna
    const colunaLower = nomeColuna.toString().toLowerCase().trim();
    log(`📝 Processando coluna "${nomeColuna}" (${colunaLower}): ${valor}`);
    
    // Mapear campos conhecidos
    if (['nome', 'name', 'cliente', 'full_name'].includes(colunaLower)) {
      lead.nome = valor.toString();
      log(`✅ Nome mapeado: ${lead.nome}`);
    } else if (['email', 'e-mail', 'mail', 'email_address'].includes(colunaLower)) {
      lead.email = valor.toString();
      log(`✅ Email mapeado: ${lead.email}`);
    } else if (['telefone', 'phone', 'whatsapp', 'celular', 'phone_number'].includes(colunaLower)) {
      lead.telefone = valor.toString();
      log(`✅ Telefone mapeado: ${lead.telefone}`);
    } else if (['data', 'date', 'data_contato', 'contact_date'].includes(colunaLower)) {
      lead.data_contato = valor.toString();
      log(`✅ Data contato mapeada: ${lead.data_contato}`);
    } else {
      // Outros campos vão como estão
      lead[nomeColuna] = valor.toString();
      log(`➕ Campo extra "${nomeColuna}": ${valor}`);
    }
  });
  
  log(`✅ Lead montado: ${lead.nome || 'Sem nome'} | ${lead.email || 'Sem email'} | ${lead.telefone || 'Sem telefone'}`);
  
  return lead;
}

/**
 * Enviar lead para o backend via HTTP POST
 * Com logs detalhados para debug
 */
function enviarLead(lead) {
  try {
    log(`🌐 Preparando requisição HTTP POST para ${CONFIG.urlBackend}`);
    log(`📦 Payload: ${JSON.stringify(lead, null, 2)}`);
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(lead),
      muteHttpExceptions: true // Não lançar exceção em erro HTTP
    };
    
    log('📡 Enviando requisição...');
    const response = UrlFetchApp.fetch(CONFIG.urlBackend, options);
    const codigo = response.getResponseCode();
    const conteudo = response.getContentText();
    
    log(`📥 Resposta recebida - HTTP ${codigo}`);
    log(`📄 Conteúdo da resposta: ${conteudo.substring(0, 500)}`); // Primeiros 500 caracteres
    
    // Tentar parsear JSON
    let resultado;
    try {
      resultado = JSON.parse(conteudo);
      log('✅ JSON parseado com sucesso');
    } catch (e) {
      log(`⚠️ Erro ao parsear JSON: ${e}`);
      resultado = { success: false, message: conteudo };
    }
    
    // Adicionar código HTTP ao resultado
    resultado.httpCode = codigo;
    
    if (codigo >= 200 && codigo < 300) {
      log(`✅ Requisição bem-sucedida (HTTP ${codigo})`);
    } else {
      log(`❌ Requisição falhou (HTTP ${codigo})`);
    }
    
    return resultado;
    
  } catch (error) {
    log(`❌ EXCEÇÃO na requisição HTTP: ${error}`);
    log(`Stack trace: ${error.stack || 'N/A'}`);
    
    return {
      success: false,
      message: 'Erro de conexão: ' + error.toString(),
      httpCode: 0
    };
  }
}

/**
 * ============================================================
 * EXEMPLO DE ESTRUTURA DA PLANILHA
 * ============================================================
 * 
 * Linha 1 (Cabeçalho):
 * | Nome | Email | Telefone | Campanha | Interesse |
 * 
 * Linha 2 (Dados):
 * | João Silva | joao@email.com | 41999887766 | Facebook Ads | Produto X |
 * 
 * ============================================================
 * NOTAS IMPORTANTES:
 * ============================================================
 * 
 * 1. Certifique-se de que a URL do backend está correta
 * 2. Para testes locais, use Ngrok: https://abc123.ngrok.io/api/leads
 * 3. empresa_id é configurado no CONFIG.empresaId
 * 4. Colunas Nome, Email, Telefone são mapeadas automaticamente
 * 5. Outras colunas vão para dados_originais como estão
 * 
 * ============================================================
 */

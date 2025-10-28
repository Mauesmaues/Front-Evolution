const responseFormatter = require('../utils/responseFormatter');
const supabase = require('../utils/supabaseCliente');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// Função utilitária para hash SHA256 (requisito do Meta para email/telefone)
function sha256(str) {
  return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
}

const MetaConversionController = {
  // Envia lead qualificado para a API de Conversões do Meta
  async enviarLead(req, res) {
    try {
  const { empresaId, id: leadId } = req.params;
      console.log('[MetaConversion] empresaId:', empresaId, 'leadId:', leadId);
      // Permite customizar o nome do evento via body, ou usa 'Lead_Convertido' como padrão
      const eventName = 'Purchase';
      // Buscar chave do pixel da empresa
      const { data: track, error: errorTrack } = await supabase
        .from('trackeamento_empresa')
        .select('api_pixel_meta, id_pixel_meta')
        .eq('id_empresa', empresaId)
        .maybeSingle();
      if (errorTrack || !track || !track.api_pixel_meta || !track.id_pixel_meta) {
        return res.status(400).json(responseFormatter.error('Chave do pixel Meta ou ID do Pixel não configurados para esta empresa'));
      }
      const accessToken = track.api_pixel_meta;
      const pixelId = track.id_pixel_meta;
      // Buscar dados do lead
      const { data: lead, error: errorLead } = await supabase
        .from('leads')
        .select('id, nome, email, telefone, created_at')
        .eq('id', leadId)
        .maybeSingle();
      console.log('[MetaConversion] Resultado busca lead:', { errorLead, lead });
      if (errorLead || !lead) {
        return res.status(404).json(responseFormatter.error('Lead não encontrado'));
      }
      // Buscar dados da empresa (para nome, url, etc)
      const { data: empresa, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', empresaId)
        .maybeSingle();
      // Montar payload conforme padrão Meta CRM
      const eventTime = Math.floor(Date.now() / 1000);
      const userData = {};
      // Email não é obrigatório para envio ao Meta
      if (lead.email && lead.email.trim()) userData.em = sha256(lead.email); // string
      if (lead.telefone && lead.telefone.trim()) userData.ph = sha256(lead.telefone); // string
      if (lead.id) userData.lead_id = lead.id;
      if (lead.nome && lead.nome.trim()) {
        const partes = lead.nome.trim().split(' ');
        userData.fn = [sha256(partes[0])];
        if (partes.length > 1) userData.ln = [sha256(partes.slice(1).join(' '))];
      }
      // Monta o payload conforme padrão fornecido
      const customData = {
        lead_event_source: 'Space',
        event_source: 'crm'
      };
      // Se o evento for de compra, adicionar moeda padrão BRL
      if (eventName === 'Purchase') {
        customData.currency = 'BRL';
        customData.value = 0.03;
      }
      const payload = {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            action_source: 'system_generated',
            user_data: userData,
            custom_data: customData
          }
        ]
      };
      // Enviar para o Meta
      const url = `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const metaResp = await resp.json();
      if (!resp.ok) {
        console.error('[MetaConversion] Erro ao enviar para o Meta:', metaResp);
        return res.status(500).json(responseFormatter.error('Erro ao enviar lead para o Meta', metaResp));
      }
      return res.status(200).json(responseFormatter.success(metaResp, 'Lead enviado para o Meta com sucesso!'));
    } catch (err) {
      return res.status(500).json(responseFormatter.error('Erro interno ao enviar lead para o Meta', err));
    }
  }
};

module.exports = MetaConversionController;

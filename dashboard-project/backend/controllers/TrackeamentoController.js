const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

const TrackeamentoController = {
  // Salva ou atualiza a chave do pixel Meta para uma empresa
  async salvarChave(req, res) {
    try {
      const { empresaId } = req.params;
      const { api_pixel_meta } = req.body;
      if (!api_pixel_meta) {
        return res.status(400).json(responseFormatter.error('Chave da API do Pixel Meta é obrigatória'));
      }
      // Upsert: se já existe, atualiza; se não, insere
      const { data, error } = await supabase
        .from('trackeamento_empresa')
        .upsert({
          id_empresa: parseInt(empresaId),
          api_pixel_meta: api_pixel_meta,
          atualizado_em: new Date().toISOString()
        }, { onConflict: ['id_empresa'] })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(responseFormatter.success(data, 'Chave salva com sucesso'));
    } catch (error) {
      return res.status(500).json(responseFormatter.error('Erro ao salvar chave', error));
    }
  },

  // Busca a chave do pixel Meta para uma empresa
  async buscarChave(req, res) {
    try {
      const { empresaId } = req.params;
      const { data, error } = await supabase
        .from('trackeamento_empresa')
        .select('api_pixel_meta')
        .eq('id_empresa', empresaId)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(responseFormatter.success(data));
    } catch (error) {
      return res.status(500).json(responseFormatter.error('Erro ao buscar chave', error));
    }
  }
};

module.exports = TrackeamentoController;

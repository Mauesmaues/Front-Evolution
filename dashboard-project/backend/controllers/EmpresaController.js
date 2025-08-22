const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');
const Empresa = require('../models/Empresa');

    async function create(req, res) {
        const { nome, contaDeAnuncio } = req.body;

        const empresa = new Empresa(nome, contaDeAnuncio);

        try {
            const { data, error } = await supabase
                .from('empresas')
                .insert(empresa)
                .single();

            if (error) throw error;

            res.status(201).json(responseFormatter.success(data));
        } catch (error) {
            res.status(500).json(responseFormatter.error('Erro ao criar empresa', error));
        }
    }

module.exports = { create };

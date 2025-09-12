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

    async function buscarEmpresas(req, res) {
        try {
            // Verificar se há usuário logado na sessão
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;
            let empresas = [];

            // ADMIN e GESTOR: acesso a todas as empresas
            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                const { data, error } = await supabase
                    .from("empresas")   
                    .select("*");      

                if (error) throw error;
                empresas = data || [];
            } 
            // USER: apenas empresas vinculadas
            else if (usuario.permissao === 'USER') {
                // Buscar empresas vinculadas ao usuário
                const { data: empresasVinculadas, error: errorVinculo } = await supabase
                    .from('usuario_empresa')
                    .select(`
                        empresa_id,
                        empresas (
                            id,
                            nome,
                            contaDeAnuncio
                        )
                    `)
                    .eq('usuario_id', usuario.id);

                if (errorVinculo) throw errorVinculo;

                // Extrair dados das empresas
                empresas = empresasVinculadas.map(vinculo => vinculo.empresas);
            }

            res.status(200).json(responseFormatter.success(empresas));
        } catch (error) {
            res.status(500).json(responseFormatter.error("Erro ao buscar empresas", error));
        }
    }
    

module.exports = { create, buscarEmpresas };

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
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }
            const usuario = req.session.user;
            let empresas = [];
            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                const { data, error } = await supabase
                    .from('empresas')
                    .select('id, nome, contaDeAnuncio');
                if (error) throw error;
                empresas = data || [];
            } else if (usuario.permissao === 'USER') {
                // 1. Buscar IDs das empresas vinculadas
                const { data: vinculos, error: errorVinculo } = await supabase
                    .from('usuario_empresa')
                    .select('empresa_id')
                    .eq('usuario_id', usuario.id);
                if (errorVinculo) throw errorVinculo;
                if (!vinculos || vinculos.length === 0) {
                    // Nenhuma empresa vinculada, retorna vazio imediatamente
                    res.status(200).json(responseFormatter.success([]));
                    return;
                }
                const empresaIds = vinculos.map(v => v.empresa_id);
                // 2. Buscar empresas por esses IDs
                const { data, error } = await supabase
                    .from('empresas')
                    .select('id, nome, contaDeAnuncio')
                    .in('id', empresaIds);
                if (error) throw error;
                empresas = data || [];
            }
            res.status(200).json(responseFormatter.success(empresas));
        } catch (error) {
            res.status(500).json(responseFormatter.error('Erro ao buscar empresas', error));
        }
    }
    async function atualizarEmpresa(req, res) {
        try {
            const { id } = req.params;
            const { nome, contaDeAnuncio } = req.body;

            if (!nome || !contaDeAnuncio) {
                return res.status(400).json(responseFormatter.error('Nome e conta de anúncio são obrigatórios'));
            }

            const { data, error } = await supabase
                .from('empresas')
                .update({ nome, contaDeAnuncio })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json(responseFormatter.success(data));
        } catch (error) {
            res.status(500).json(responseFormatter.error('Erro ao atualizar empresa', error));
        }
    }

    async function excluirEmpresa(req, res) {
        try {
            const { id } = req.params;

            // Primeiro, remover associações com usuários
            await supabase
                .from('usuario_empresa')
                .delete()
                .eq('empresa_id', id);

            // Depois, remover a empresa
            const { data, error } = await supabase
                .from('empresas')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json(responseFormatter.success(data));
        } catch (error) {
            res.status(500).json(responseFormatter.error('Erro ao excluir empresa', error));
        }
    }
    

module.exports = { create, buscarEmpresas, atualizarEmpresa, excluirEmpresa };

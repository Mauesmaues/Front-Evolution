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
            console.log('🔍 Iniciando buscarEmpresas');
            if (!req.session || !req.session.user) {
                console.log('❌ Sessão não encontrada');
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }
            const usuario = req.session.user;
            console.log('👤 Usuário autenticado:', usuario.email, '- Permissão:', usuario.permissao);
            let empresas = [];
            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                console.log('🔑 Buscando todas as empresas (ADMIN/GESTOR)');
                const { data, error } = await supabase
                    .from('empresas')
                    .select('id, nome, contaDeAnuncio');
                if (error) {
                    console.error('❌ Erro ao buscar empresas:', error);
                    throw error;
                }
                empresas = data || [];
                console.log('✅ Empresas encontradas:', empresas.length);
            } else if (usuario.permissao === 'USER') {
                console.log('🔑 Buscando empresas vinculadas ao usuário');
                // 1. Buscar IDs das empresas vinculadas
                const { data: vinculos, error: errorVinculo } = await supabase
                    .from('usuario_empresa')
                    .select('empresa_id')
                    .eq('usuario_id', usuario.id);
                if (errorVinculo) {
                    console.error('❌ Erro ao buscar vínculos:', errorVinculo);
                    throw errorVinculo;
                }
                if (!vinculos || vinculos.length === 0) {
                    console.log('⚠️ Nenhuma empresa vinculada ao usuário');
                    // Nenhuma empresa vinculada, retorna vazio imediatamente
                    res.status(200).json(responseFormatter.success([]));
                    return;
                }
                const empresaIds = vinculos.map(v => v.empresa_id);
                console.log('📋 IDs das empresas vinculadas:', empresaIds);
                // 2. Buscar empresas por esses IDs
                const { data, error } = await supabase
                    .from('empresas')
                    .select('id, nome, contaDeAnuncio')
                    .in('id', empresaIds);
                if (error) {
                    console.error('❌ Erro ao buscar empresas vinculadas:', error);
                    throw error;
                }
                empresas = data || [];
                console.log('✅ Empresas vinculadas encontradas:', empresas.length);
            }

            // Buscar dados manuais para cada empresa
            console.log('📊 Buscando dados manuais para', empresas.length, 'empresas');
            const empresaIdsAll = empresas.map(e => e.id);
            let manuais = [];
            if (empresaIdsAll.length > 0) {
                console.log('🔍 IDs para buscar dados manuais:', empresaIdsAll);
                try {
                    // Tentar buscar dados manuais - se a tabela não existir, continuar sem erro
                    const { data: manuaisData, error: manuaisError } = await supabase
                        .from('controle_saldo_inputs_manuais')
                        .select('id_empresa, ultima_recarga, saldo_diario, recorrencia')
                        .in('id_empresa', empresaIdsAll);
                    
                    if (manuaisError) {
                        console.warn('⚠️ Aviso ao buscar dados manuais (tabela pode não existir):', manuaisError.message);
                        // Não lançar erro, apenas continuar sem os dados manuais
                    } else {
                        manuais = manuaisData || [];
                        console.log('✅ Dados manuais encontrados:', manuais.length);
                    }
                } catch (err) {
                    console.warn('⚠️ Erro ao buscar dados manuais (ignorado):', err.message);
                }
            }
            // Mesclar dados manuais nas empresas
            console.log('🔄 Mesclando dados manuais nas empresas');
            const empresasComManuais = empresas.map(emp => {
                const manual = manuais.find(m => m.id_empresa === emp.id) || {};
                return {
                    ...emp,
                    ultima_recarga: manual.ultima_recarga || null,
                    saldo_diario: manual.saldo_diario || null,
                    recorrencia: manual.recorrencia || null
                };
            });
            console.log('✅ Dados mesclados com sucesso. Total de empresas:', empresasComManuais.length);
            res.status(200).json(responseFormatter.success(empresasComManuais));
        } catch (error) {
            console.error('❌ Erro detalhado ao buscar empresas:', error);
            console.error('Stack trace:', error.stack);
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
    
    async function salvarCamposManuais(req, res) {
        try {
            console.log('🔍 [DEBUG] Iniciando salvarCamposManuais');
            console.log('🔍 [DEBUG] req.body completo:', JSON.stringify(req.body, null, 2));
            console.log('🔍 [DEBUG] Content-Type:', req.headers['content-type']);
            
            const { id_empresa, ultima_recarga, saldo_diario, recorrencia } = req.body;
            
            console.log('💾 Salvando campos manuais para empresa:', id_empresa);
            console.log('📊 Dados recebidos:', { 
                id_empresa, 
                ultima_recarga, 
                saldo_diario, 
                recorrencia 
            });
            console.log('🔍 Tipos dos dados:', {
                id_empresa: typeof id_empresa,
                ultima_recarga: typeof ultima_recarga,
                saldo_diario: typeof saldo_diario,
                recorrencia: typeof recorrencia
            });

            if (!id_empresa) {
                console.log('❌ Erro: ID da empresa não fornecido');
                return res.status(400).json(responseFormatter.error('ID da empresa é obrigatório'));
            }

            // Verificar se já existe registro para esta empresa
            console.log('🔍 Verificando se já existe registro para empresa:', id_empresa);
            const { data: registroExistente, error: errorBusca } = await supabase
                .from('controle_saldo_inputs_manuais')
                .select('id')
                .eq('id_empresa', id_empresa)
                .single();

            if (errorBusca && errorBusca.code !== 'PGRST116') {
                console.error('❌ Erro ao buscar registro existente:', errorBusca);
                throw errorBusca;
            }

            console.log('🔍 Registro existente:', registroExistente ? 'SIM' : 'NÃO');

            let resultado;
            if (registroExistente) {
                // Atualizar registro existente
                console.log('🔄 Atualizando registro existente');
                
                const dadosAtualizacao = {
                    ultima_recarga: ultima_recarga || null,
                    saldo_diario: saldo_diario || null,
                    recorrencia: recorrencia || null,
                    updated_at: new Date().toISOString()
                };
                
                console.log('🔍 Dados para atualização:', dadosAtualizacao);
                
                const { data, error } = await supabase
                    .from('controle_saldo_inputs_manuais')
                    .update(dadosAtualizacao)
                    .eq('id_empresa', id_empresa)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Erro ao atualizar:', error);
                    throw error;
                }
                resultado = data;
                console.log('✅ Atualização bem-sucedida:', resultado);
            } else {
                // Criar novo registro
                console.log('➕ Criando novo registro');
                
                const dadosInsercao = {
                    id_empresa: id_empresa,
                    ultima_recarga: ultima_recarga || null,
                    saldo_diario: saldo_diario || null,
                    recorrencia: recorrencia || null
                };
                
                console.log('🔍 Dados para inserção:', dadosInsercao);
                
                const { data, error } = await supabase
                    .from('controle_saldo_inputs_manuais')
                    .insert(dadosInsercao)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Erro ao inserir:', error);
                    throw error;
                }
                resultado = data;
                console.log('✅ Inserção bem-sucedida:', resultado);
            }

            console.log('✅ Campos manuais salvos com sucesso');
            res.status(200).json(responseFormatter.success(resultado));
        } catch (error) {
            console.error('❌ Erro ao salvar campos manuais:', error);
            console.error('❌ Stack trace:', error.stack);
            console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
            res.status(500).json(responseFormatter.error('Erro ao salvar campos manuais', error));
        }
    }

module.exports = { create, buscarEmpresas, atualizarEmpresa, excluirEmpresa, salvarCamposManuais };


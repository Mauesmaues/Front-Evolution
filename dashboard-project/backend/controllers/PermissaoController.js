const supabase = require('../utils/supabaseCliente');

async function carregarEmpresasPermitidas(req, res) {
    try {
        const userId = req.params.userId;
        
        // Verificar se há usuário logado na sessão
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const usuario = req.session.user;
        let accountIds = [];

        // ADMIN e GESTOR: acesso a todas as empresas
        if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
            const { data: todasEmpresas, error } = await supabase
                .from('empresas')
                .select('contaDeAnuncio');
            
            if (error) throw error;
            accountIds = todasEmpresas.map(empresa => empresa.contaDeAnuncio);
        } 
        // USER: apenas empresas vinculadas
        else if (usuario.permissao === 'USER') {
            let empresasPermitidas = [];
            
            const empresasResponse = await supabase
                .from('usuario_empresa')
                .select('empresa_id')
                .eq('usuario_id', userId);
            
            if (empresasResponse.error) {
                return res.status(500).json({ error: empresasResponse.error.message });
            }
            
            // Adicionar IDs das empresas ao array
            empresasResponse.data.forEach(empresa => {
                empresasPermitidas.push(empresa.empresa_id);
            });
            
            // Buscar account_ids das empresas permitidas
            accountIds = await carregarAccountIdsPermitidos(empresasPermitidas);
        }
        
        res.json({ accountIds: accountIds || [] });
    } catch (error) {
        console.error('Erro em carregarEmpresasPermitidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

async function carregarAccountIdsPermitidos(empresasPermitidas) {
    try {
        if (!empresasPermitidas || empresasPermitidas.length === 0) {
            return [];
        }
        
        // Buscar todos os account_ids de uma só vez
        const accountIdsResponse = await supabase
            .from('empresas')
            .select('contaDeAnuncio')
            .in('id', empresasPermitidas);
        
        if (accountIdsResponse.error) {
            console.error('Erro ao buscar account_ids:', accountIdsResponse.error);
            return [];
        }
        
        return accountIdsResponse.data.map(item => item.contaDeAnuncio);
    } catch (error) {
        console.error('Erro em carregarAccountIdsPermitidos:', error);
        return [];
    }
}

module.exports = { carregarEmpresasPermitidas, carregarAccountIdsPermitidos };
const supabase = require('../config/supabaseClient');

async function carregarEmpresasPermitidas(req, res) {
    try {
        const userId = req.params.userId;
        
        // Limpar array para evitar dados duplicados
        let empresasPermitidas = [];
        
        const empresasResponse = await supabase
            .from('usuarios_empresas')
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
        let accountIds = await carregarAccountIdsPermitidos(empresasPermitidas);
        
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
            .select('account_id')
            .in('id', empresasPermitidas);
        
        if (accountIdsResponse.error) {
            console.error('Erro ao buscar account_ids:', accountIdsResponse.error);
            return [];
        }
        
        return accountIdsResponse.data.map(item => item.account_id);
    } catch (error) {
        console.error('Erro em carregarAccountIdsPermitidos:', error);
        return [];
    }
}

module.exports = { carregarEmpresasPermitidas, carregarAccountIdsPermitidos };
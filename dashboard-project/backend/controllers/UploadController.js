const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');
const multer = require('multer');
const path = require('path');

// Configurar multer para armazenar arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
        // Aceitar apenas arquivos PDF, imagens e documentos
        const allowedTypes = /pdf|jpeg|jpg|png|gif|doc|docx|xls|xlsx|ppt|pptx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use PDF, imagens ou documentos do Office.'));
        }
    }
});

class UploadController {
    // Fazer upload de arquivo para o Supabase Storage
    static async uploadArquivo(req, res) {
        try {
            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            if (!req.file) {
                return res.status(400).json(responseFormatter.error('Nenhum arquivo enviado'));
            }

            const file = req.file;
            const usuario = req.session.user;

            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const extension = path.extname(file.originalname);
            const fileName = `${timestamp}-${randomStr}${extension}`;
            const filePath = `propostas/${fileName}`;

            console.log('Fazendo upload do arquivo:', {
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                filePath: filePath
            });

            // Fazer upload para o Supabase Storage
            const { data, error } = await supabase.storage
                .from('arquivos-propostas') // Nome do bucket no Supabase
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Erro ao fazer upload no Supabase Storage:', error);
                
                // Se o bucket não existe, tentar criar
                if (error.message.includes('not found')) {
                    console.log('Tentando criar bucket...');
                    const { error: createBucketError } = await supabase.storage.createBucket('arquivos-propostas', {
                        public: true,
                        fileSizeLimit: 52428800 // 50MB
                    });
                    
                    if (createBucketError) {
                        console.error('Erro ao criar bucket:', createBucketError);
                        throw new Error('Erro ao configurar armazenamento de arquivos');
                    }
                    
                    // Tentar upload novamente
                    const { data: retryData, error: retryError } = await supabase.storage
                        .from('arquivos-propostas')
                        .upload(filePath, file.buffer, {
                            contentType: file.mimetype,
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    if (retryError) {
                        throw retryError;
                    }
                    
                    // Obter URL pública
                    const { data: publicUrlData } = supabase.storage
                        .from('arquivos-propostas')
                        .getPublicUrl(filePath);
                    
                    return res.json(responseFormatter.success({
                        url: publicUrlData.publicUrl,
                        fileName: file.originalname,
                        size: file.size,
                        mimetype: file.mimetype,
                        path: filePath
                    }));
                }
                
                throw error;
            }

            // Obter URL pública do arquivo
            const { data: publicUrlData } = supabase.storage
                .from('arquivos-propostas')
                .getPublicUrl(filePath);

            console.log('Upload concluído com sucesso:', publicUrlData.publicUrl);

            // Retornar informações do arquivo com a URL
            res.json(responseFormatter.success({
                url: publicUrlData.publicUrl,
                fileName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                path: filePath
            }));

        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            res.status(500).json(responseFormatter.error('Erro ao fazer upload do arquivo', error.message));
        }
    }

    // Excluir arquivo do Supabase Storage
    static async excluirArquivo(req, res) {
        try {
            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const { path: filePath } = req.body;

            if (!filePath) {
                return res.status(400).json(responseFormatter.error('Caminho do arquivo é obrigatório'));
            }

            // Excluir do Supabase Storage
            const { error } = await supabase.storage
                .from('arquivos-propostas')
                .remove([filePath]);

            if (error) {
                console.error('Erro ao excluir arquivo:', error);
                throw error;
            }

            res.json(responseFormatter.success({ message: 'Arquivo excluído com sucesso' }));

        } catch (error) {
            console.error('Erro ao excluir arquivo:', error);
            res.status(500).json(responseFormatter.error('Erro ao excluir arquivo', error.message));
        }
    }
}

// Exportar controller e middleware do multer
module.exports = {
    UploadController,
    uploadMiddleware: upload.single('arquivo')
};

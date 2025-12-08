interface ErrorDetail {
    message: string;
    statusCode: number;
    code?: ErrorCode;
}

export type ErrorCode = keyof typeof error_list;

export const error_list = {
    'INVALID_CREDENTIALS': {
        message: 'Credenciais inválidas.',
        statusCode: 401,
    },
    'VALIDATION_ERROR': {
        message: 'Dados de entrada inválidos.',
        statusCode: 400,
    },
    'TOKEN_NOT_EXIST': {
        message: 'Credenciais inválidas.',
        statusCode: 401,
    },
    'TOKEN_REDIS_INSERT_ERROR': {
        message: 'Erro ao inserir token no Redis.',
        statusCode: 500,
    },
    'TOKEN_NOT_FOUND_IN_REDIS': {
        message: 'Token não encontrado no Redis.',
        statusCode: 404,
    },
    'INTERNAL_SERVER_ERROR': {
        message: 'Erro interno do servidor.',
        statusCode: 500,
    },
    'USER_NOT_FOUND': {
        message: 'Usuário não encontrado.',
        statusCode: 404,
    },
    'CREATE_USER_AUTH_ERROR': {
        message: 'Erro ao criar usuário na tabela de autenticação.',
        statusCode: 500,
    },
    'USER_ID_NOT_RETURNED': {
        message: 'ID do usuário não retornado após criação.',
        statusCode: 500,
    },
    'CREATE_USER_ERROR': {
        message: 'Erro ao criar usuário na tabela de usuários.',
        statusCode: 500,
    },
    'USER_ALREADY_EXISTS': {
        message: 'Usuário com este e-mail já existe.',
        statusCode: 409,
    },
    'TOKEN_INVALID': {
        message: 'Token de sessão inválido.',
        statusCode: 401,
    },
    'SUPABASE_TOKEN_CREATION_ERROR': {
        message: 'Erro ao criar token do Supabase.',
        statusCode: 500,
    },
    'SUPABASE_JWT_SECRET_NOT_DEFINED': {
        message: 'Segredo JWT do Supabase não está definido.',
        statusCode: 500,
    },
    'PS_EDITION_NOT_FOUND': {
        message: 'Edição de PS não encontrada.',
        statusCode: 404,
    },
    'FILE_VALIDATION_ERROR': {
        message: 'Erro na validação do arquivo enviado.',
        statusCode: 400,
    },
    'FILE_UPLOAD_FAILED': {
        message: 'Falha ao fazer upload do arquivo.',
        statusCode: 500,
    },
    'PS_USER_CARD_UPDATE_FAILED': {
        message: 'Falha ao atualizar o cartão do usuário no processo seletivo.',
        statusCode: 500,
    },
    'PS_USER_CARDS_NOT_FOUND': {
        message: 'Cartões do usuário no processo seletivo não encontrados.',
        statusCode: 404,
    },
    'CARD_NOT_FOUND_IN_PROGRESS': {
        message: 'Cartão não encontrado no progresso do usuário.',
        statusCode: 404,
    },
    'INVALID_INPUT': {
        message: 'Entrada inválida fornecida.',
        statusCode: 400,
    },
    'USER_NOT_FOUND_ERROR': {
        message: 'Usuário não encontrado.',
        statusCode: 404,
    },
    'UPDATE_USER_ERROR': {
        message: 'Erro ao atualizar os dados do usuário.',
        statusCode: 500,
    },
    'DISABLE_USER_ERROR': {
        message: 'Erro ao desativar a conta do usuário.',
        statusCode: 500,
    },
    'USER_DISABLED_PERMANENTLY': {
        message: 'Conta do usuário desativada permanentemente.',
        statusCode: 403,
    },
    'RECOVER_USER_ERROR': {
        message: 'Erro ao recuperar a conta do usuário.',
        statusCode: 500,
    },
    'PS_SIGNUP_FAILED': {
        message: 'Falha ao inscrever-se no processo seletivo.',
        statusCode: 500,
    },
    'CERTIFICATE_CODE_MISSING': {
        message: 'Código do certificado ausente.',
        statusCode: 400,
    },
    'CERTIFICATE_NOT_FOUND': {
        message: 'Certificado não encontrado.',
        statusCode: 404,
    },
    'CERTIFICATES_NOT_FOUND': {
        message: 'Nenhum certificado encontrado para o CPF fornecido.',
        statusCode: 404,
    },
    'USER_DONT_HAVE_CERTIFICATES': {
        message: 'O usuário não possui certificados.',
        statusCode: 404,
    },
    'CPF_REQUIRED': {
        message: 'CPF é obrigatório.',
        statusCode: 400,
    },
    'CPF_INVALID': {
        message: 'CPF inválido.',
        statusCode: 400,
    },
    'MISSING_CERTIFICATE_ID': {
        message: 'ID do certificado ausente.',
        statusCode: 400,
    },
    'PS_EDITION_CREATION_FAILED': {
        message: 'Falha ao criar a edição do processo seletivo.',
        statusCode: 500,
    },
    'PS_USER_PRESENCE_UPDATE_FAILED': {
        message: 'Falha ao atualizar a presença do usuário no processo seletivo.',
        statusCode: 500,
    },
    'PS_USER_PRESENCE_NOT_FOUND': {
        message: 'Presença do usuário no processo seletivo não encontrada.',
        statusCode: 404,
    },
    'CERTIFICATE_NOT_CREATED': {
        message: 'Falha ao emitir o certificado.',
        statusCode: 500,
    },
    'RLS_UNAUTHENTICATED_ERROR': {
        message: 'Operação não autorizada. Autenticação necessária falhou.',
        statusCode: 401,
    },
    'CHALLENGE_DATA_NOT_FOUND': {
        message: 'Dados do desafio não encontrados.',
        statusCode: 404,
    },
    'NUCLEI_CONFIG_UPDATE_FAILED': {
        message: 'Falha ao atualizar a configuração do núcleo.',
        statusCode: 500,
    }
}


function isErrorCode(error: unknown): error is ErrorCode {
    return (
        typeof error === 'string' &&
        Object.prototype.hasOwnProperty.call(error_list, error)
    );
}

/**
 * Function to handle errors and return appropriate details.
 * @param error - The error code or unknown error.
 * @returns ErrorDetail object containing message and statusCode.
 */
export const handle_error = (error: unknown): ErrorDetail => {
    if (isErrorCode(error)) {
        const detail = error_list[error];
        return { ...detail, code: error };
    }
    
    const detail = error_list['INTERNAL_SERVER_ERROR'];
    return { ...detail, code: 'INTERNAL_SERVER_ERROR' };
}
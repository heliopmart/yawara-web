const IMAGE_YAWARA = process.env.NEXT_PUBLIC_APP_URL + '/images/yawara-icon-color.png';

export const reset_password_template = (reset_link: string) => {
    return `
        <!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha - Yawara</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .header { background-color: #000000; padding: 30px; text-align: center; }
        .header img { max-width: 150px; }
        .content { padding: 40px; text-align: center; color: #333333; }
        .content h1 { font-size: 24px; margin-bottom: 20px; color: #000000; }
        .content p { font-size: 16px; line-height: 1.6; color: #666666; margin-bottom: 30px; }
        .button { background-color: #ef5350; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }
        .danger-text { color: #ef5350; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${IMAGE_YAWARA}" alt="Yawara Logo">
        </div>

        <div class="content">
            <h1>Recuperação de Acesso</h1>
            <p>Olá, </p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no ecossistema Yawara. Se você não realizou esta solicitação, pode ignorar este e-mail com segurança.</p>
            
            <a href="${reset_link}" class="button">REDEFINIR MINHA SENHA</a>

            <p style="margin-top: 30px; font-size: 14px;">
                Este link expira em <span class="danger-text">2 horas</span>.
            </p>
        </div>

        <div class="footer">
            <p>Projeto Yawara - Tecnologias Sustentáveis</p>
            <p>DOURADOS - MS | UFGD</p>
            <p>&copy; 2026 Projeto Yawara. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
    `
}
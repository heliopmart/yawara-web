export const challengesEmailTemplate = (userName: string, downloadUrl: string): string => {
  const colorPrimary = '#8a1212'; 
  const colorBackground = '#f4f4f7';
  const colorWhite = '#ffffff';
  const colorText = '#51545e';
  
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Desafio Técnico Yawara Disponível</title>
    <style type="text/css" rel="stylesheet" media="all">
    /* Reset básico para emails */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    
    body {
      width: 100% !important;
      height: 100%;
      margin: 0;
      -webkit-text-size-adjust: none;
      background-color: ${colorBackground};
      color: ${colorText};
      font-family: 'Inter', Helvetica, Arial, sans-serif;
    }
    
    a {
      color: ${colorPrimary};
      text-decoration: none;
    }
    
    /* Classes utilitárias */
    .email-wrapper {
      width: 100%;
      margin: 0;
      padding: 0;
      -premailer-width: 100%;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
      background-color: ${colorBackground};
    }
    
    .email-content {
      width: 100%;
      margin: 0;
      padding: 0;
      -premailer-width: 100%;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
    }
    
    /* Container Principal */
    .email-body {
      width: 100%;
      margin: 0;
      padding: 0;
      -premailer-width: 100%;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
    }
    
    .email-body_inner {
      width: 570px;
      margin: 0 auto;
      padding: 0;
      -premailer-width: 570px;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
      background-color: ${colorWhite};
    }
    
    /* Header Tech */
    .header-cell {
      padding: 25px;
      text-align: center;
      background-color: ${colorPrimary};
      color: white;
      border-bottom: 3px solid #000;
    }
    
    .brand-text {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    /* Conteúdo do Texto */
    .content-cell {
      padding: 45px;
    }
    
    h1 {
      margin-top: 0;
      color: #333333;
      font-size: 22px;
      font-weight: bold;
      text-align: left;
    }
    
    p {
      font-size: 16px;
      line-height: 1.625;
      color: ${colorText};
      margin: .4em 0 1.1875em;
    }
    
    /* Botão Call to Action */
    .action {
      margin: 30px 0;
      padding: 0;
      text-align: center;
      width: 100%;
      -premailer-width: 100%;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
    }
    
    .button {
      background-color: ${colorPrimary};
      border-top: 10px solid ${colorPrimary};
      border-right: 18px solid ${colorPrimary};
      border-bottom: 10px solid ${colorPrimary};
      border-left: 18px solid ${colorPrimary};
      display: inline-block;
      color: #FFF;
      text-decoration: none;
      border-radius: 3px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
      -webkit-text-size-adjust: none;
      box-sizing: border-box;
      font-weight: bold;
    }
    
    /* Painel de Aviso */
    .attributes {
      margin: 0 0 21px;
    }
    
    .attributes_content {
      background-color: #f4f4f7;
      padding: 16px;
      border-left: 4px solid ${colorPrimary};
    }

    .footer {
      width: 570px;
      margin: 0 auto;
      padding: 0;
      -premailer-width: 570px;
      -premailer-cellpadding: 0;
      -premailer-cellspacing: 0;
      text-align: center;
    }
    
    .footer p {
      color: #aeaeae;
      font-size: 12px;
      text-align: center;
    }
    </style>
  </head>
  <body>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            
            <tr>
              <td class="header-cell">
                 <span class="brand-text">YAWARA // SYSTEM</span>
              </td>
            </tr>
            
            <tr>
              <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell">
                      <h1>Olá, ${userName}.</h1>
                      
                      <p>UAU! Seu Histórico Academico é impressionante. Você foi <strong>aprovado(a)</strong> na fase de triagem inicial e seu perfil técnico foi selecionado para a próxima etapa. <b>VOCÊ AGORA ESTÁ NO PORTÃO DE FERRO</b></p>
                      
                      <p>Um desafio técnico personalizado foi gerado para você. Este documento contém todas as instruções, regras de submissão e prazos.</p>
                      
                      <table class="action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                              <tr>
                                <td align="center">
                                  <a href="${downloadUrl}" class="button" target="_blank">BAIXAR PROTOCOLO DO DESAFIO</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="attributes_content">
                            <p style="font-size: 14px; margin: 0;"><strong>Atenção:</strong> Este link gera um documento PDF único, rastreável e assinado digitalmente para o seu CPF. O prazo começa a contar a partir do recebimento deste e-mail.</p>
                          </td>
                        </tr>
                      </table>
                      
                      <p>Siga as instruções contidas no PDF rigorosamente. A falha em cumprir os requisitos de formatação resultará em desclassificação automática pelo nosso sistema de validação.</p>
                      
                      <p>Boa sorte,<br>Equipe Yawara.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr>
              <td>
                <table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell" align="center">
                      <p>Enviado automaticamente pelo Sistema Yawara.</p>
                      <p>Se você não se inscreveu neste processo seletivo, ignore este e-mail.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
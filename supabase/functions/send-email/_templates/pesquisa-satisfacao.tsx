export function PesquisaSatisfacaoTemplate(
  clienteNome: string,
  montadorNome: string,
  jobDescricao: string,
  linkPesquisa: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pesquisa de Satisfação - YOULY</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: #e94560;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .stars {
            font-size: 32px;
            margin: 20px 0;
          }
          .info-box {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⭐ Pesquisa de Satisfação</h1>
          <p>Sua opinião é muito importante!</p>
        </div>
        
        <div class="content">
          <p>Olá <strong>${clienteNome}</strong>,</p>
          
          <p>O serviço de montagem foi concluído. Gostaríamos muito de saber como foi sua experiência!</p>
          
          <div class="info-box">
            <p><strong>Montador:</strong> ${montadorNome}</p>
            <p><strong>Serviço:</strong> ${jobDescricao}</p>
          </div>
          
          <div class="stars">⭐⭐⭐⭐⭐</div>
          
          <p>Clique no botão abaixo para avaliar o serviço:</p>
          
          <center>
            <a href="${linkPesquisa}" class="button">
              Avaliar Agora
            </a>
          </center>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Este link é válido por 30 dias. Sua avaliação nos ajuda a melhorar continuamente.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            YOULY - Plataforma de Montagem de Móveis<br>
            Conectando você aos melhores profissionais
          </p>
        </div>
      </body>
    </html>
  `;
}

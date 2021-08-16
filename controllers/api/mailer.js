var mailer = require('@sendgrid/mail');
var { templateEmails } = require('../templates.js');
var SG_ApiKey = require('./../../config/sendgrid').key;
var Mailer = module.exports

mailer.setApiKey(SG_ApiKey);

Mailer.sendEmailRecuperacao = function(destination, link){
  var conteudo = templateEmails("Recuperação password", "Para recuperar a sua password, basta clicar no botão abaixo. Caso não tenha pedido esta recuperação, por favor ignore este email."
  + "<br/><br/>" + 
  "<a style='display: block; width: 30%;text-decoration: none; padding: 20px; padding-left: 50px; padding-right: 50px; border: 2px solid black; border-radius: 5px; background: #00acda;' href='" 
  + link + "'>Recuperar Password</a><br/>" + 
  "Após a receção deste email possui 30 minutos para alterar a sua password, caso contrário o mesmo expira.");

  const msg = {
      from: 'recuperacao@clav.dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Recuperação password',
      html: conteudo,
  };
  mailer.send(msg);
}


Mailer.sendEmailNovo = function(destination, notificacao){
  var conteudo =  templateEmails("Novo Pedido", "Pedido nrº: " + notificacao.pedido + ".<br/>" +
    notificacao.acao + " de " + notificacao.tipo + ".<br/><br/>" +
    "Movido para " + notificacao.novoEstado + ".<br/>" + 
    "Entidade responsavel: " + notificacao.entidade.split("_")[1] + ".<br/>");

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Novo Pedido',
      html: conteudo,
  };
  mailer.send(msg);
}

Mailer.sendEmailDevolvido = function(destination, notificacao){
  var conteudo =  templateEmails("Pedido Devolvido", "Pedido nrº: " + notificacao.pedido + ".<br/>" +
    notificacao.acao + " de " + notificacao.tipo + ".<br/><br/>" +
    "Movido para " + notificacao.novoEstado + ".<br/>" + 
    "Entidade responsavel: " + notificacao.entidade.split("_")[1] + ".<br/>");

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Pedido Devolvido',
      html: conteudo,
  };
  mailer.send(msg);
}

Mailer.sendEmailRegistoAPI = function(destination, jwt){
  var conteudo =  templateEmails("Registo chave API", "Obrigado pelo seu registo na plataforma CLAV. Em baixo pode ver a sua chave API, que deve utilizar para qualquer pedido na plataforma."
  + "<br/><br/><div>" + jwt 
  + "</div></br></br>" +
  "Esta chave API pode ser enviada na query string <strong>apikey</strong> ou no campo do cabeçalho <strong>Authorization</strong> com o formato <strong>apikey <chave API></strong> de modo a ser validada na nossa plataforma." + "<div style='color: red; text-align: center;'>Esta chave API é válida por apenas 30 dias após a sua emissão.</div>");
  const msg = {
      from: 'api@clav.dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Registo chave API',
      html: conteudo,
  };
  mailer.send(msg);
}

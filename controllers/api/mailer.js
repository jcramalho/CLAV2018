var mailer = require('@sendgrid/mail');
var SG_ApiKey = require('./../../config/sendgrid').key;
var Mailer = module.exports

mailer.setApiKey(SG_ApiKey);

Mailer.sendEmailRecuperacao = function(destination, link){
    const msg = {
        from: 'recuperacao@clav.dglab.gov.pt',
        to: destination,
        templateId: 'd-0e44af0539c04db4adc4eca28c2ef67e',
        dynamic_template_data: {
          url: link
        }
    };
    mailer.send(msg);
}


Mailer.sendEmailNovo = function(destination, notificacao){
  var conteudo = "Pedido nrº: " + notificacao.pedido + ".<br/>" +
    notificacao.acao + " de " + notificacao.tipo + ".<br/><br/>" +
    "Movido para " + notificacao.novoEstado + ".<br/>" + 
    "Entidade responsavel: " + notificacao.entidade.split("_")[1] + ".<br/>"

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Novo Pedido',
      html: conteudo,
  };
  mailer.send(msg);
}

Mailer.sendEmailRegistoAPI = function(destination, jwt){
  const msg = {
      from: 'api@clav.dglab.gov.pt',
      to: destination,
      templateId: 'd-113714263ec4430194429f0ff92617b7',
      dynamic_template_data: {
        key: jwt
      }
  };
  mailer.send(msg);
}

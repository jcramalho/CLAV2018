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

Mailer.distribuirEmail = function(pedido, notificacao){
  if(pedido.pedido.estado == "Devolvido") {
    const ultimoEstado = pedido.pedido.distribuicao ? pedido.pedido.distribuicao[pedido.pedido.distribuicao.length - 1].estado : "Submetido";
    switch(ultimoEstado){
      case "Submetido":
      case "Ressubmetido":
        Mailer.sendEmailDevolvido1(pedido.pedido.criadoPor, notificacao);
        break;
      case "Distribuído":
      case "Redistribuído":
      case "Apreciado":
      case "Reapreciado":
      case "Apreciado2v":
      case "Reapreciado2v":
        Mailer.sendEmailDevolvido2(pedido.pedido.criadoPor, notificacao);
        break;
    } 
  } else if (pedido.pedido.estado == "Ressubmetido")
    Mailer.sendEmailNovo(pedido.pedido.criadoPor, notificacao)
  else if (pedido.pedido.estado == "Validado")
    Mailer.sendEmailValidado(pedido.pedido.criadoPor)
  else if ((pedido.pedido.estado == "Distribuído" || pedido.pedido.estado == "Redistribuído") && pedido.pedido.objeto.tipo == "Auto de Eliminação"){
    // TODO: Emails Pedido em apreciação dos autos de eliminação
    return 0;
  }
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

Mailer.sendEmailDevolvido1 = function(destination, notificacao){
  var conteudo =  templateEmails("Pedido Devolvido", "Pedido nrº: " + notificacao.pedido + ".<br/>" +
    "Pedido devolvido para revisão. Consulte o pedido <a href='http://localhost:8080/pedidos/novos/"+ notificacao.pedido + "'>aqui</a>.<br/>");

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Pedido Devolvido',
      html: conteudo,
  };
  mailer.send(msg);
}

Mailer.sendEmailDevolvido2 = function(destination, notificacao){
  var conteudo =  templateEmails("Pedido Devolvido", "Pedido nrº: " + notificacao.pedido + ".<br/>" +
    "Pedido devolvido para revisão de acordo com alterações propostas no <a href='http://localhost:8080/users/pedidos/"+ notificacao.pedido + "/relatorio'>relatório</a>.<br/>");

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Pedido Devolvido',
      html: conteudo,
  };
  mailer.send(msg);
}

Mailer.sendEmailValidado = function(destination){
  var conteudo =  templateEmails("Pedido Validado", "O seu pedido foi aprovado, encontra-se agora disponivel na CLAV.<br/>");

  const msg = {
      from: 'clav@dglab.gov.pt',
      to: destination,
      subject: 'CLAV: Pedido Validado',
      html: conteudo,
  };
  mailer.send(msg);
}

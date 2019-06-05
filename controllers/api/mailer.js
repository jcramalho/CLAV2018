var mailer = require('@sendgrid/mail');
var SG_ApiKey = require('./../../config/sendgrid').key;
var Mailer = module.exports

mailer.setApiKey(SG_ApiKey);

Mailer.sendEmail = function(destination, link){
    console.log("DESTINO: "+ destination + " LINK: " + link)
    const msg = {
        from: 'recuperacao@clav.dglab.gov.pt',
        to: destination,
        templateId: 'd-0e44af0539c04db4adc4eca28c2ef67e',
        dynamic_template_data: {
          url: link,
        }
    };
    mailer.send(msg);
}
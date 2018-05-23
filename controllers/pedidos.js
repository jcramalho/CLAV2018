var Pedido = require('../models/pedido');
var Entidade = require('../models/entidade');

var Pedidos = module.exports

Pedidos.add = function(dataObj, user, req){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();

    Pedido.getCountPedidos(function(err, count){
        if (err) {
            console.log(err);
            req.send("Ocorreu um erro!");    
        }
        else {
            var num = count+1+"-"+yyyy;

            Entidade.getEntidadeByRepresentante(user.email, function(err, entity){
                if (err) {
                    console.log(err);
                    req.send("Ocorreu um erro!");    
                }
                else if(!entity) {
                    console.log("Utilizador sem entidade relacionada");
                    req.send("Ocorreu um erro! Sem entidade associada!"); 
                }
                else{
                    var newPedido = new Pedido({
                        numero: num,
                        tipo: dataObj.type,
                        descricao: dataObj.desc,
        
                        entidade: {
                            nome: entity.nome,
                            email: entity.email
                        },
        
                        utilizador: {
                            nome: user.name,
                            email: user.email,
                        },
        
                        data: dd+"/"+mm+"/"+yyyy,
                        tratado: false,

                        objetoID: dataObj.id,
                        alterado: dataObj.alt,
                    });
                    
                    Pedido.createPedido(newPedido, function (err, request) {
                        if (err) {
                            console.log(err);
                            req.flash('error_msg', 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                            req.send('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                        }
                        else {
                            Logging.logger.info('Novo pedido ' + request.tipo + ': '+request.numero+' submetido por '+req.user._id);
    
                            req.flash('success_msg', 'Pedido submetido com sucesso!');
                            res.send(request.numero);
                        }
                    });  
                } 
            });
        }
    });
}
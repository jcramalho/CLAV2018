var Pedido = require('../models/pedido');
var Entidade = require('../models/entidade');

var Pedidos = module.exports

var Logging = require('../controllers/logging');

Pedidos.add = function(dataObj, req, res){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();

    // 1728000000 = número de ms em 20 dias
    var deadline = new Date(today.getTime()+1728000000);
    var deadlineD = deadline.getDate();
    var deadlineM = deadline.getMonth()+1;
    var deadlineY = deadline.getFullYear();

    var num = '777'+"-"+yyyy;

    Entidade.getEntidadeByRepresentante(req.user.email, function(err, entity){
        if (err) {
            console.log(err);
            res.send("Ocorreu um erro!");    
        }
        else{
            if(!entity){
                entity = {
                    nome: "Sem Entidade",
                    email: "teste@teste.com"
                };
            }

            var newPedido = new Pedido({
                numero: num,
                tipo: dataObj.type,
                descricao: dataObj.desc,
        
                entidade: {
                    nome: entity.nome,
                    email: entity.email
                },
        
                utilizador: {
                    nome: req.user.name,
                    email: req.user.email,
                },
        
                data: yyyy+"/"+mm+"/"+dd,
                prazo: deadlineY+"/"+deadlineM+"/"+deadlineD,
                estado: "Novo",

                objetoID: dataObj.id,
                alterado: dataObj.alt,
            });
                    
            Pedido.createPedido(newPedido, function (err, request) {
                if (err) {
                    console.log(err);
                    req.flash('error_msg', 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                    res.send('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
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

Pedidos.criar = function(tipoPedido, tipoObjeto, novoObj, utilizador){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
 
    // 1728000000 = número de ms em 20 dias
    var deadline = new Date(today.getTime()+1728000000);
    var deadlineD = deadline.getDate();
    var deadlineM = deadline.getMonth()+1;
    var deadlineY = deadline.getFullYear();
 
    var num = '777'+"-"+yyyy;
 
    Entidade.getEntidadeByRepresentante(utilizador, function(err, entity){
        if (err) {
            console.log(err);
            return(err);    
        }
        else{
            if(!entity){
                entity = {
                    nome: "Sem Entidade",
                    email: "teste@teste.com"
                };
            }
 
            var newPedido = new Pedido({
                codigo: num,
                criadoPor: utilizador,
                objeto: {
                    codigo: novoObj.codigo,
                    dados: novoObj,
                    tipo: tipoObjeto,
                    acao: tipoPedido
                },
                distribuicao: [{
                    estado: "Submetido"
                }]
            });

            newPedido.save(function (err) {
                if (err) {
                    console.log(err);
                    return ('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
                }
                else{
                    Logging.logger.info('Novo pedido ' + newPedido.objeto.acao + ' de ' + newPedido.objeto.tipo + ': '+newPedido.codigo
                        +' submetido por '+ newPedido.criadoPor);
                    return(newPedido.codigo);
                }
            });
        }
    })
}

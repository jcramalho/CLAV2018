const Contador = require('../../models/contador');
const Contadores = module.exports;

Contadores.listar = ( codigo ) => {
    return Contador.findOne({ codigo });
};

Contadores.incrementar = ( codigo ) => {
    return Contador.updateOne({ codigo }, { $inc: { valor: 1 } });
};
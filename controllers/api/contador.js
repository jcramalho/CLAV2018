const Contador = require('../../models/contador');
const Contadores = module.exports;

Contadores.get = ( codigo ) => {
    return Contador.findOne({ codigo: codigo }).exec();
};

Contadores.incrementar = ( codigo ) => {
    return Contador.updateOne({ codigo: codigo }, { $inc: { valor: 1 } });
};

Contadores.criar = (contador) => {
    var novo = new Contador(contador)
    return novo.save()
}
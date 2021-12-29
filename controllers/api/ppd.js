var PPD = require('../../models/ppd');

var PPD_export = module.exports


PPD_export.getAllPPD = () => {
    console.log('get PPDs');
    return PPD
        .find({}, {"geral" : 1})
        .exec()
}

PPD_export.inserirPPD = async function ( ppd ) {
    console.log('MONGO: insert(' + ppd + ')');
    var newPPD = new PPD(ppd);
    return newPPD.save();
};


PPD_export.getPPD = ( id ) => {
    console.log("GET ONE PPD " + id)
    return PPD.findOne({ "_id": id }).exec();
};
var PPD = require('../../models/ppd');

var PPDs = module.exports


PPDs.getAllPPDs = () => {
    return PPD
        .find()
        .exec()
}

PPDs.inserirPPD = async function (ppd) {
    console.log('MONGO: insert(' + ppd + ')');
    var newPPD = new PPD(ppd);
    return newPPD.save();
};

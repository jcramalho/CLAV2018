var PPD = require('../../models/ppd');

var PPD_me = module.exports


PPD_me.getAllPPDs = () => {
    return PPD
        .find()
        .exec()
}

PPD_me.inserirPPD = async function (ppd) {
    console.log('MONGO: insert(' + ppd + ')');
    var newPPD = new PPD(ppd);
    return newPPD.save();
};

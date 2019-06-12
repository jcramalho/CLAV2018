var ApiStat = require('../../models/api');
var ApiStats = module.exports

ApiStats.getStats = function (callback) {
    ApiStat.find({}, function(err, stats){
        if(!err){
            callback(null, stats);
        }else{
            callback(err, null);
        }
    });
}
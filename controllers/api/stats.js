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

ApiStats.getCallCount = function(callback){
    ApiStat.find({}, function(err, res){
        if(!err){
            var calls = 0;
            for(var i = 0; i < res.length; i++) {
                if(res[i]._id!= '' && res[i]._id!= 'unknown route')
                    calls += res[i].nCallsGet + res[i].nCallsPost + res[i].nCallsPut;
            }
            callback(null, calls);
        }else{
            callback(err, null);
        }
    });
}
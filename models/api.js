var mongoose = require('mongoose');

// User Schema
var ApiStatsSchema = mongoose.Schema({
	_id: {},
	nCallsGet: {
        type: Number,
        default: 0
    },
    nCallsPost: {
        type: Number,
        default: 0
    },
    nCallsPut: {
        type: Number,
        default: 0
    },
});

var ApiStats = module.exports = mongoose.model('ApiStats', ApiStatsSchema, 'apistats');

module.exports.addUsage = function (method, route) {

    ApiStats.findById(route,function(err, stats){
        if(err || stats==null){

            var newStats = new ApiStats({
                _id: route,
                nCallsGet: 0,
                nCallsPost: 0,
                nCallsPut: 0
            });

            if(method=='GET') 
                newStats.nCallsGet=1;
            else if(method=='POST')
                newStats.nCallsPost=1;
            else if(method=='PUT')
                newStats.nCallsPut=1;

            ApiStats.collection.insert(newStats, function(err) {
                if (err) {
                    throw err;
                } else {
                    console.log("Criado contador para API: " + route)
                }
            });

        }else{
            if(method=='GET') 
                stats.nCallsGet+=1;
            else if(method=='POST')
                stats.nCallsPost+=1;
            else if(method=='PUT')
                stats.nCallsPut+=1;

            stats.save(function(err) {
                if (err) {
                    throw err;
                } 
                else {
                    console.log("Incrementei " + method +" da rota " + route);
                }
            });
        }
    })
}

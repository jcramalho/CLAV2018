var AggregateLog = require('../../models/aggregateLog');
var AggregateLogs = module.exports
const methodsAllowed = ["GET", "POST", "PUT", "DELETE"]

AggregateLogs.newAggregateLog = async function(method, id, type){
    method = method.toUpperCase()

    if(methodsAllowed.includes(method)){
        var aggLog = await AggregateLog.findOne({id: id, type: type})
        var methodCamp = "n" + method + "s"

        if(aggLog){
            aggLog.lastAccess = Date.now()
        }else{
            aggLog = new AggregateLog({
                type: type,
                id: id
            })
        }
        aggLog[methodCamp]++

        return aggLog.save()
    }else{
        throw("Não foi possível criar o log agregrado, parâmetros incorretos.")
    }
}

AggregateLogs.getAllAggregateLogs = function(){
    return AggregateLog.find({})
}

AggregateLogs.getAggregateLog = function(id, type){
    return AggregateLog.findOne({id: id, type: type})
}

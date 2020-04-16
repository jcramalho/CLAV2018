var AggregateLog = require('../../models/aggregateLog');
var AggregateLogs = module.exports
const methodsAllowed = ["GET", "POST", "PUT", "DELETE"]

AggregateLogs.newAggregateLog = async function(route, method, id, type){
    method = method.toUpperCase()

    if(methodsAllowed.includes(method)){
        var aggLog = await AggregateLog.findOne({id: id, type: type})
        var methodCamp = "n" + method + "s"

        if(aggLog){
            aggLog.lastAccess = Date.now()

            var found = false
            for(var i = 0; i < aggLog.routes.length && !found; i++){
                if(aggLog.routes[i].route == route){
                    aggLog.routes[i][methodCamp]++
                    aggLog.routes[i].lastAccess = Date.now()
                    found = true
                }
            }

            if(!found){
                var r = {route: route}
                r[methodCamp] = 1;
                aggLog.routes.push(r)
            }
        }else{
            aggLog = new AggregateLog({
                type: type,
                id: id,
                routes: []
            })

            var r = {route: route}
            r[methodCamp] = 1;
            aggLog.routes.push(r)
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

AggregateLogs.getAggregateLogRoute = async function(route){
    var o = {}
    o.map = `function(){
        var found = false
        for(var i = 0; i < this.routes.length && !found; i++){
            if(this.routes[i].route == "${route}"){
                found = true
                emit(this.routes[i].route, this.routes[i])
            }
        }
    }`
    o.reduce = function(key, values){
        var ret = {
            nGETs: 0,
            nPOSTs: 0,
            nPUTs: 0,
            nDELETEs: 0,
            route: key
        }
        var dates = []

        for(var i = 0; i < values.length; i++){
           ret.nGETs += values[i].nGETs
           ret.nPOSTs += values[i].nPOSTs
           ret.nPUTs += values[i].nPUTs
           ret.nDELETEs += values[i].nDELETEs
           dates.push(new Date(values[i].lastAccess))
        }

        ret.lastAccess = new Date(Math.max.apply(null, dates))
        return ret
    }
    o.out = {inline:1}
    var mR = await AggregateLog.mapReduce(o)
    mR = mR.results.map(e => e.value)[0]
    return mR
}

AggregateLogs.getAggregateLogRoutes = async function(){
    var o = {}
    o.map = function(){
        for(var i = 0; i < this.routes.length; i++){
            emit(this.routes[i].route, this.routes[i])
        }
    }
    o.reduce = function(key, values){
        var ret = {
            nGETs: 0,
            nPOSTs: 0,
            nPUTs: 0,
            nDELETEs: 0,
            route: key
        }
        var dates = []

        for(var i = 0; i < values.length; i++){
           ret.nGETs += values[i].nGETs
           ret.nPOSTs += values[i].nPOSTs
           ret.nPUTs += values[i].nPUTs
           ret.nDELETEs += values[i].nDELETEs
           dates.push(new Date(values[i].lastAccess))
        }

        ret.lastAccess = new Date(Math.max.apply(null, dates))
        return ret
    }
    o.out = {inline:1}
    var mR = await AggregateLog.mapReduce(o)
    mR = mR.results.map(e => e.value)
    return mR
}

AggregateLogs.totalAggregateLogs = async function(){
    var agg = await AggregateLog.aggregate([{
        $project: {
            total: { $sum: ["$nGETs", "$nPOSTs", "$nPUTs", "$nDELETEs"] }
        }
    }])
    agg = agg.map(v => v.total)
    var ret = agg.reduce((a, b) => a + b, 0)
    return ret
}

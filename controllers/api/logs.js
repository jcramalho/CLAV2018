var Log = require('../../models/log');
var dataBases = require('../../config/database');
var Logs = module.exports
const deleteBefore = 30 //days
const repeatPeriod = 1 //days
const pageSize = 2500

Logs.getRoute = function(req){
    var route = req.originalUrl.replace(/\?.*$/,"")
    route = route.replace("/" + dataBases.apiVersion, "")
    return route
}

Logs.removeOldLogs = function(){
    const dateDaysAgo = new Date(new Date().setDate(new Date().getDate()-deleteBefore))
    return Log.deleteMany({accessDate: {$lte: dateDaysAgo}})
}

Logs.removeOldLogsPeriodically = function(){
    setInterval(function(){Logs.removeOldLogs()}, repeatPeriod*24*60*60*1000)
}

Logs.newLog = function(route, method, id, type, httpStatus){
    return Log.create({
        route: route,
        method: method,
        type: type,
        id: id,
        httpStatus: httpStatus,
        accessDate: Date.now()
    })
}

Logs.getAllLogs = async function(page){
    var ret = {
        items: await Log.find({})
            .sort({accessDate: -1})
            .skip(page*pageSize)
            .limit(pageSize),
        total: await Log.estimatedDocumentCount()
    }

    return ret
}

Logs.getRouteLogs = function(route, method){
    return Log.find({route: route, method: method})
}

Logs.getUserLogs = function(id, type){
    return Log.find({id: id, type: type})
}

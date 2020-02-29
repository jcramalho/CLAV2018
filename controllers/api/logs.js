var Call = require('../../models/log');
var dataBases = require('../../config/database');
var Calls = module.exports

Calls.getRoute = function(req){
    var route = req.originalUrl.replace(/\?.*$/,"")
    route = route.replace("/" + dataBases.apiVersion, "")
    return route
}

Calls.newCall = async function(route, method, id, type, httpStatus){
    return Call.create({
        route: route,
        method: method,
        type: type,
        id: id,
        httpStatus: httpStatus,
        accessDate: Date.now()
    })
}

Calls.getAllCalls = function(){
    return Call.find({})
}

Calls.getRouteCalls = function(route, method){
    return Call.find({route: route, method: method})
}

Calls.getUserCalls = async function(id, type){
    return Call.find({id: id, type: type})
}

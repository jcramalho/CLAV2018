var Call = require('./../../models/call');
var Calls = module.exports

Calls.getRoute = function(req){
    return req.originalUrl.replace(/\?.*$/,"")
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

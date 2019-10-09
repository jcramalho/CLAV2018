var Call = require('./../../models/call');
var Calls = module.exports

Calls.getRoute = function(req){
    const route = req.route ? req.route.path : '' // check if the handler exist
    const baseUrl = req.baseUrl ? req.baseUrl : '' // adding the base url if the handler is a child of another handler

    return route ? `${baseUrl === '/' ? '' : baseUrl + route}` : 'unknown route'
}

Calls.newCall = async function(route, method, id, type){
    var call = await Call.findOne({route: route, method: method})

    if(call){
        call = await Call.findOne(
        {
            route: route,
            method: method,
            accesses: {$elemMatch: {id: id, type: type}}
        })

        if(call){
            return Call.findOneAndUpdate(
            {
                route: route,
                method: method,
                accesses: {$elemMatch: {id: id, type: type}}
            },
            {
                $inc: {
                    "accesses.$.nCalls": 1
                }
            },
            {
                useFindAndModify: false
            })
        }else{
            return Call.findOneAndUpdate(
            {
                route: route,
                method: method
            },
            {
                $push: {
                    accesses: {
                        id: id,
                        type: type,
                        nCalls: 1
                    }
                }
            },
            {
                useFindAndModify: false
            })
        }   
    }else{
        return Call.create({
            route: route,
            method: method,
            accesses: [{
                id: id,
                type: type,
                nCalls: 1
            }]
        })
    }
}

Calls.getCall = function(route, method){
    return Call.findOne({route: route, method: method})
}

Calls.getUserCalls = function(id, type){
    return Call.find({accesses: {$elemMatch: {id: id, type: type}}})
}

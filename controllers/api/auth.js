var AuthCall = require('../../models/auth');
var AuthCalls = module.exports

AuthCalls.addRedirectUrl = async function (redirect, callback) {
    try{
        redirect = await redirect.save()
        callback(null, redirect)
    }catch(err){
        callback(err, null)
    }
}

AuthCalls.get = function(id, callback){
    AuthCall.findById(id, function(err, authcall){
        if (err) {	
            callback(err, null)
        } else {
            // callback(null, authcall.url);
            AuthCall.findByIdAndRemove(id, function(err, res){
                if (err) {	
                    callback(err, null)
                } else {
                    if(authcall != null){
                        callback(null, authcall.url);
                    }else{
                        callback("AuthCall not exist",null)
                    }
                }
            });
        }
    });
}

AuthCalls.remove = function(id, callback){
    AuthCall.findByIdAndRemove(id, function(err, authcall){
        if (err) {	
            callback(err, null)
        } else {
		    callback(null, authcall);
        }
    });
}

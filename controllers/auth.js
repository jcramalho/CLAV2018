var Auth = module.exports

var jwt = require('jsonwebtoken');
var ConfigJWT = require('./../config/jwt');

//Novo middleware de autenticação com JWT
Auth.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()){
        jwt.verify(req.session.token, ConfigJWT.jwt.secret, function(err, decoded){
            if(err){
                req.logout();
                req.flash('error_msg', 'Token JWT expirado! Faça login novamente.');
                res.redirect('/users/login');
            }else{
                return next();
            }
        });
    }else{
        req.flash('warn_msg', 'Login necessário para aceder a esta página');
        res.redirect('/users/login');
    }
}

/*
Auth.isInternal = function (req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.internal) {
            return next();
        }
        else {
            req.flash('warn_msg', 'Não tem permissões para aceder a esta página');
            res.redirect('back');
        }
    }
    else {
        req.flash('warn_msg', 'Login necessário para aceder a esta página');
        res.redirect('/users/login');
    }
}

Auth.isExternal = function (req, res, next) {
    if (req.isAuthenticated()) {
        if (!req.user.internal) {
            return next();
        }
        else {
            req.flash('warn_msg', 'Não tem permissões para aceder a esta página');
            res.redirect('back');
        }
    }
    else {
        req.flash('warn_msg', 'Login necessário para aceder a esta página');
        res.redirect('/users/login');
    }
}
*/

Auth.checkLevel1 = function (req, res, next) {
    return Auth.isLevel(1, req, res, next);
}

Auth.checkLevel2 = function (req, res, next) {
    return Auth.isLevel(2, req, res, next);
}

Auth.checkLevel3 = function (req, res, next) {
    return Auth.isLevel(3, req, res, next);
}

Auth.checkLevel4 = function (req, res, next) {
    return Auth.isLevel(4, req, res, next);
}

Auth.checkLevel5 = function (req, res, next) {
    return Auth.isLevel(5, req, res, next);
}

Auth.checkLevel6 = function (req, res, next) {
    return Auth.isLevel(6, req, res, next);
}

Auth.checkLevel7 = function (req, res, next) {
    return Auth.isLevel(7, req, res, next);
}

Auth.isLevel = function (clearance, req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.level >= clearance) {
            return next();
        } else {
            req.flash('warn_msg', 'Não tem permissões suficientes para aceder a esta página');
            res.redirect('back');
        }
    } else {
        req.flash('warn_msg', 'Login necessário para aceder a esta página');
        res.redirect('/users/login');
    }
}

Auth.isLoggedInAPI = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send('Login necessário para esta operação');
}
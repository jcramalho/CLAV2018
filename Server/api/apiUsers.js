var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../users');


module.exports = function (app) {
    var expressValidator = require('express-validator');
    app.use(expressValidator());

    // Register User
    app.post('/registar', function (req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var password2 = req.body.password2;

        console.log(req.body);

        // Validation
        req.checkBody('name', 'Nome é obrigatório').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            res.render('Pages/Users/registar', {
                errors: errors
            });
        } else {
            var newUser = new User({
                name: name,
                email: email,
                password: password
            });

            User.createUser(newUser, function (err, user) {
                if (err) throw err;
                console.log(user);
            });

            //req.flash('success_msg', 'You are registered and can now login');

            res.redirect('/');
        }
    });

    passport.use(new LocalStrategy(
        function (username, password, done) {
            User.getUserByUsername(username, function (err, user) {
                if (err) throw err;
                if (!user) {
                    return done(null, false, { message: 'Unknown User' });
                }

                User.comparePassword(password, user.password, function (err, isMatch) {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Invalid password' });
                    }
                });
            });
        }));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.getUserById(id, function (err, user) {
            done(err, user);
        });
    });

    app.post('/login',
        passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }),
        function (req, res) {
            res.redirect('/');
        });

    app.get('/logout', function (req, res) {
        req.logout();

        req.flash('success_msg', 'You are logged out');

        res.redirect('/login');
    });
}
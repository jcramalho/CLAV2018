var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../users');


module.exports = function (app) {
    // Register User
    app.post('/registar', function (req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var password2 = req.body.password2;

        // Validation
        req.checkBody('name', 'Nome é obrigatório').notEmpty();
        req.checkBody('email', 'Email é obrigatório').notEmpty();
        req.checkBody('email', 'Email inválido').isEmail();
        req.checkBody('password', 'Password é obrigatória').notEmpty();
        req.checkBody('password2', 'Passwords têm de ser iguais').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            res.render('Users/registar', {
                errors: errors
            });
        } else {
            var newUser = new User({
                name: name,
                level: 1,
                email: email,
                password: password
            });

            User.createUser(newUser, function (err, user) {
                if (err) throw err;
                console.log(user);
            });

            req.flash('success_msg', 'A sua conta foi criada, pode agora fazer login');

            res.redirect('/');
        }
    });

    passport.use(new LocalStrategy(
        function (email, password, done) {
            User.getUserByEmail(email, function (err, user) {
                if (err) throw err;
                if (!user) {
                    return done(null, false, { message: 'Email não reconhecido' });
                }

                User.comparePassword(password, user.password, function (err, isMatch) {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password Inválida' });
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
        passport.authenticate('local', { failureFlash: true }),
        function (req, res) {
            res.redirect(req.body.location);
        });

    app.get('/logout', function (req, res) {
        var url = require('url');
        var parts = url.parse(req.url, true);
        var location = parts.query.l;

        req.logout();

        req.flash('success_msg', 'You are logged out');

        res.redirect(location);
    });
}
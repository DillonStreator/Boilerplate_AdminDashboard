var LocalStrategy   = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var User = require('../models/User').User;
var {LogError} = require('./common');

// expose this function to our app using module.exports
module.exports = function(passport) {
    
	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
		done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        User.findOne({_id:id}, (err, user) => {
            if (err) 
                done(err, null);
            else
                done(null, user);
        });
    });
	

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    async (req, email, password, done) => {

        try {
            let foundUser = await User.findOne({email});
            if (foundUser) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }

            let _user = new User();
            _user.email = email;
            _user.password = await bcrypt.hash(password, 12);
            let user = await _user.save();
            return done(null, user);
        }
        catch (error) {
            LogError(error,req);
            return done(error, null);
        }
        
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    async (req, email, password, done) => { // callback with email and password from our form

        try {
            let foundUser = await User.findOne({email});
            if (!foundUser) {
                req.flash('errorMessages', 'Incorrect email or password.');
                return done(null, false);
            }
            if (foundUser.status == 'blocked') {
                req.flash('errorMessages', "You've been blocked. Please contact support.");
                return done(null, false);
            }
            let confirmedPassword = await bcrypt.compare(password, foundUser.password);
            if (!confirmedPassword) {
                req.flash('errorMessages', 'Incorrect email or password.');
                return done(null, false);
            }

            req.flash('successMessages', 'Successfully logged in!');
            return done(null, foundUser);
        }
        catch (error) {
            LogError(error,req);
            return done(error);
        }

    }));

};

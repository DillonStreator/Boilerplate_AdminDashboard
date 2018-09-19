var mongoose = require("mongoose");

var UserSchema = mongoose.Schema({

    email: String,
    password: String,
    role: {type: String, default: 'enduser'},
    // profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    jwt: String,
    created: {type: Date, default: new Date()},
    lastSeen: Date,
    status: {type: String, default: 'active'},

    // Keep track of number of logins per ip address.. potential use case is keeping track of home/work machines
    ips: [{
        ip: String,
        accessCount: Number
    }],

    location: {
        latitude: Number,
        longitude: Number
    }

})


var User = mongoose.model('User', UserSchema);

module.exports = {
    User
}
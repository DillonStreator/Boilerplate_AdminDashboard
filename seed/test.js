var bcrypt = require('bcrypt');
var User = require('../config/models/User').User;
var common = require('../config/common');
var async = require('async');


(async ()=>{
    try {
        let _user = new User();
        _user.email = "dillon@gmail.com";
        _user.password = await bcrypt.hash('test', 12);
        _user.role = "SuperAdmin";
        _user.created = new Date();
        let user = await _user.save();
        console.log("created user");
        console.log(user);
    }
    catch (error) {
        console.log("error:",error);
    }
})();





// var emails = [];
// for (let i = 50000; i < 57500; i++) {
//     let username = `tester+${i}@gmail.com`;
//     emails.push(username);
// }

// async.each(emails, async (email,done)=>{

//     try {
//         let _user = new User();
//         _user.role = 'Admin';
//         _user.email = email;
//         _user.password = await bcrypt.hash('test',5);
//         _user.created = new Date();
//         let user = await _user.save();
//         await common.LogActivity("Create user",null);
//         done();
//     }
//     catch (error) {
//         done(error);
//     }
    
// },(err)=>{
//     if (err) {
//         console.log("Finished with error:",err);
//     }
//     else {
//         console.log("Finished without error!!!");
//     }
// });

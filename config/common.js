const ActivityLog = require('../models/ActivityLog').ActivityLog;
const ErrorLog = require('../models/ErrorLog').ErrorLog;
const EmailLog = require('../models/EmailLog').EmailLog;
const nodemailer = require('nodemailer');


/**
 * Function to send emails
 * 
 * @param {Object} emailArgs Object contains the following: "to", "subject", "html"
 */
exports.SendEmail = async (emailArgs) => {
    var transport = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        let promises = [
            transport.sendMail(emailArgs),
            LogEmail(emailArgs.to, emailArgs.subject, emailArgs.html)
        ];
        await Promise.all(promises);
        return true;
    }
    catch (error) {
        throw new Error(error);
    }
}
// =======================================================================|
// ============================ EMAIL EXAMPLE ============================|
// =======================================================================|
// const {SendEmail} = require("path_to_common.js");
// let emailArgs = {
//     to: "someone@email.com",
//     subject: "Important subject line",
//     html: `
//         <h1>Hello there</h1>
//         <p>I can send emails that contain html</p>
//     `
// }
// await SendEmail(emailArgs);
// =======================================================================|
// ============================ EMAIL EXAMPLE ============================|
// =======================================================================|

/**
 * Logs an email in the database for later reference
 * 
 * @param {string} subject The subject line of the email that was sent
 * @param {string} content The body/content of the email that was sent
 * @param {ObjectId} userId The id of the user that was referenced in for the email
 */
const LogEmail = async (to, subject, content) => {

    try {
        let _emailLog = new EmailLog();
        _emailLog.created = new Date();
        _emailLog.to = to;
        _emailLog.subject = subject;
        _emailLog.content = content;
        let emailLog = await _emailLog.save();
        return emailLog;
    }
    catch (error) {
        throw new Error(error);
    }

}


/**
 * Generic function to log errors into the database with relevant data.
 * Returns a Promise.
 * 
 * @param {string} error The error
 * @param {string} req The express request object
 */
exports.LogError = async (error, req) => {

    try {
        let _errorLog = new ErrorLog();
        _errorLog.created = new Date();
        _errorLog.category = `'${req.method}' | ${req.originalUrl}`;
        _errorLog.error = error;
        _errorLog.user = req.user._id;
        _errorLog.ip = req.ip;
        _errorLog.deviceType = req.device.type;
        _errorLog.deviceName = req.device.name;
        let errorLog = await _errorLog.save();
        return errorLog;
    }
    catch (error) {
        throw new Error(error);
    }

}


/**
 * Generic function for creating a new entry in the activity log.
 * Returns a Promise.
 * 
 * @param {string} activity The activity name
 * @param {ObjectId} userId The users objectId that has performed the activity
 * @param {string} ip The ip address of the user. Accessed through req.ip
 * @param {string} deviceType The device type
 * @param {string} deviceName The device name
 * @param {Number} latitude Point of latitude for the activity
 * @param {Number} longitude Point of longitude for the activity
 */
exports.LogActivity = async (activity,content,userId,req) => {

    try {
        let _activityLog = new ActivityLog();
        _activityLog.created = new Date();
        _activityLog.activity = activity;
        _activityLog.content = content;
        _activityLog.user = userId;
        _activityLog.ip = req.ip;
        _activityLog.deviceType = (req.device && req.device.type);
        _activityLog.deviceName = (req.device && req.device.name);
        _activityLog.latitude = (req.location && req.location.latitude);
        _activityLog.longitude = (req.location && req.location.longitude);
        let activityLog = await _activityLog.save();
        return activityLog;
    }
    catch (error) {
        throw new Error(error);
    }

}


/**
 * Upload/move an image assuming the use of express-fileupload
 * @param {Object} image The file object that lives on the request object e.g. req.files
 * @param {string} userId The id of the user that is uploading the image
 */
exports.UploadImage = async (image, userId) => {

    let findFileExt = /(?:\.([^.]+))?$/; //gets the file extension
    let ext = findFileExt.exec(image.name)[1];
    let timestamp = new Date().getTime();
    let guid = exports.guid(false);

    if (ext === undefined) {
        throw new Error("Attempted to upload the image, but there was no extension.");
    }
    else {
        let imagePath = 'public/uploads/' + userId + '_' + guid + '_' + timestamp + '.' + ext;
        let retrievePath = process.env.apiUrl + 'uploads/' + userId + '_' + guid + '_' + timestamp + '.' + ext;
        image.mv(imagePath, (err) => {

            if (err) {
                throw new Error(err);
            }
            else {
                return retrievePath;
            }

        });
    }

}
// exports.UploadImage = (image, userId) => {

//     return new Promise((resolve,reject) => {
        
//         let findFileExt = /(?:\.([^.]+))?$/; //gets the file extension
//         let ext = findFileExt.exec(image.name)[1];
//         let timestamp = new Date().getTime();
//         let guid = exports.guid(false);
    
//         if (ext === undefined) {
//             reject("Attempted to upload the image, but there was no extension.");
//         }
//         else {
//             let imagePath = 'public/uploads/' + userId + '_' + guid + '_' + timestamp + '.' + ext;
//             let retrievePath = process.env.apiUrl + 'uploads/' + userId + '_' + guid + '_' + timestamp + '.' + ext;
//             image.mv(imagePath, (err) => {
    
//                 if (err) {
//                     reject(err);
//                 }
//                 else {
//                     resolve(retrievePath);
//                 }
    
//             });
//         }

//     });

// }


/**
 * Returns a Globally Unique Identifier with or without dashes
 * @param {boolean} dashes whether or not to add dashes to the output string. Defaults to true
 */
exports.guid = (dashes=true) => {
    function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}
    let guid = b();
    return ( dashes ? guid : guid.replace(/-/g,'') );
}


exports.errorMessages = {
    generic500: "There was a problem processing that request. If this issue persists, please contact support."
};

const {LogActivity,LogError,errorMessages} = require('../../../config/common');

module.exports = async (req, res) => {

    try {
        let _user = req.user;

        _user.jwt = null;
        let user = await _user.save();

        LogActivity("Logout",`User ${req.user.email} logged out.`,req.user._id,req);
        return res.json({success:true,message:"Successfully logged out"});
    }
    catch (error) {
        LogError(error,req);
        return res.json({success:false,message:errorMessages.generic500});
    }
    
}
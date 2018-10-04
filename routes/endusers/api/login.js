const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {User} = require('../../../models');
const {LogError,LogActivity,errorMessages} = require('../../../config/common');

module.exports = async (req, res) => {

    let {email, password} = req.body;

    if (!email || !password) {
        return res.json({success:false,message:"Must provide both forms of credentials."});
    }

    try {
        let _user = await User.find({email});
        if (!_user) {
            return res.json({success:false,message:"Incorrect email or password."});
        }

        if (_user.status == 'blocked') {
            return res.json({success:false,message:"You've been blocked. Please contact support."});
        }

        let passwordConfirmed = await bcrypt.compare(password,_user.password);
        if (!passwordConfirmed) {
            return res.json({success:false,message:"Incorrect email or password."});
        }

        let token = jwt.sign({_id:_user._id},process.env.SECRET);

        _user.jwt = token;
        let user = await _user.save();

        LogActivity("Login",`User ${email} logged in`,_user._id,req);
        return res.json({success:true,content:token});

    }
    catch (error) {
        LogError(error,req);
        return res.json({success:false,message:errorMessages.generic500});
    }

}
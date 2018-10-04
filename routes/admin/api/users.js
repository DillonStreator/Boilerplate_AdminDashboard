const express = require('express');
const router = express.Router();
const adminAuth = require('../../../middlewares/adminAuth');
const {User} = require('../../../models');
const {LogError,errorMessages} = require('../../../config/common');

/* GET all users */
router.get('/', adminAuth, async (req, res) => {

	try {
		let users = await User.find();
		return res.json({success:true,data:users});
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}
	
});

router.post('/:id/update', adminAuth, async (req, res) => {
	try {
		let user = await User.findOne({_id:req.body.pk});
		user[req.body.name] = req.body.value;

		await user.save();

		return res.json({success:true,message:`Successfully update ${req.body.name} to ${req.body.value}!`});
	}
	catch (error) {
		LogError(error,req);
		return res.statu(500).json({success:false,message:error.message});
	}
});


module.exports = router;

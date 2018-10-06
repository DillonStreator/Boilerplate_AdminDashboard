const {
	User,
	Note
} = require('../../models');
const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/adminAuth');
const common = require('../../config/common');
const permission = require('permission');
const bcrypt = require('bcrypt');
const moment = require('moment');

/* GET users listing. */
router.get('/', adminAuth, (req, res) => {
	console.log(__dirname);
	res.render(
		'users',
		{
			menu: 'users',
			title: 'Users'
		}
	);
});

router.get('/:id', adminAuth, async (req, res) => {
	let _id = req.params.id;
	try {
		let enduser = await User.findOne({ _id });
		let notes = await Note.find({to:_id,isRoot:true}).sort({created:-1});
		res.render(
			'user',
			{
				menu: 'users',
				title: 'User',
				enduser,
				notes,
				moment
			}
		);
	}
	catch (error) {
		common.LogError(error,req);
		res.render('error500');
	}

});

router.post('/', adminAuth, async (req, res) => {

	if (!req.body.email || !req.body.password || !req.body.passwordConfirm || !req.body.role) {
		return res.json({ success: false, message: "Must fill in all fields to create a new user." });
	}

	if (req.body.password !== req.body.passwordConfirm) {
		return res.json({ success: false, message: "The password must match the password confirm" });
	}

	try {

		let foundUser = await User.findOne({ email: req.body.email });
		if (foundUser) {
			return res.json({ success: false, message: "That email address is already in use" });
		}

		let hash = await bcrypt.hash(req.body.password, 12);

		let _user = new User();
		_user.email = req.body.email;
		_user.password = hash;
		_user.role = req.body.role;
		_user.created = new Date();
		_user.ips = [];
		_user.lastSeen = null;
		_user.location = {
			latitude: (req.location && req.location.latitude),
			longitude: (req.location && req.location.longitude)
		}

		let user = await _user.save();

		common.LogActivity("Create User", req);

		let email = {
			to: user.email,
			subject: process.env.COMPANY + " | New User",
			html: "Welcome to " + process.env.COMPANY
		}
		common.SendEmail(email);

		req.flash('successMessages', `Successfully created new user ${user.email}!`);
		return res.redirect('/admin/users');

		//If using ajax
		// return res.json({success:true,message:"Successfully created the new user!"});

	}
	catch (error) {
		common.LogError(error,req);

		req.flash('errorMessages', common.errorMessages.generic500);
		return res.redirect('/admin/users');

		// return res.json({success:false,message:common.errorMessages.generic500});
	}

});


router.delete('/:_id', adminAuth, permission(['SuperAdmin']), async (req, res) => {

	try {
		let _id = req.params._id;
		await User.deleteOne({ _id });

		common.LogActivity("Delete User", req);

		return res.json({ success: true, message: "Successfully deleted user!" });
	}
	catch (error) {
		common.LogError(error,req);
		return res.json({ success: false, message: common.errorMessages.generic500 });
	}

});

module.exports = router;

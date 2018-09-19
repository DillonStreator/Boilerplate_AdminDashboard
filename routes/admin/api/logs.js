const ActivityLog = require('../../../models/ActivityLog').ActivityLog;
const EmailLog = require('../../../models/EmailLog').EmailLog;
const ErrorLog = require('../../../models/ErrorLog').ErrorLog;
const express = require('express');
const router = express.Router();
const adminAuth = require('../../../middlewares/adminAuth');
const {LogError,errorMessages} = require('../../../config/common');
const moment = require('moment');

/* GET all logs */
router.get('/activity', adminAuth, async (req, res) => {
	
	try {
		let logs = await ActivityLog.find().sort({created:-1});
							
		return res.json({success:true,data:logs});
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}
	
});

router.post('/activity/filter', adminAuth, async (req, res) => {

	try {
		let minDate = req.body.minDate;
		let maxDate = req.body.maxDate;
		let activityFilter = new RegExp(req.body.activity,"i");
		let filter = {
			created:{'$lte':moment(maxDate),'$gte':moment(minDate)},
			activity: activityFilter
		};
		let activities = await ActivityLog.find(filter)

		let dateTotals = activities.reduce((acc,curr,index)=>{
			let dateCreated = moment(curr.created).format('YYYY-MM-DD');
			if (acc[dateCreated]) {
				acc[dateCreated] += 1;
			}
			else {
				acc[dateCreated] = 1;
			}
			return acc;
		},{});

		let	start = moment(minDate).format('YYYY-MM-DD'),
			end = moment(maxDate).format('YYYY-MM-DD');

		let nextDay = moment(start).format('YYYY-MM-DD');

		while(nextDay <= end) {
			if(!dateTotals[nextDay]){
				dateTotals[nextDay] = 0;
			}
			nextDay = moment(nextDay).add(1,'days').format('YYYY-MM-DD');
		}

		//Format the dates to preset to flot chart [['datetime','amount'],['datetime','amount'],...]
		let flotFormattedDates = [];
		for (const date in dateTotals) {
			if (dateTotals.hasOwnProperty(date)) {
				flotFormattedDates.push([new Date(date).getTime(),dateTotals[date]]);
			}
		}
		flotFormattedDates = flotFormattedDates.sort((a,b)=> a[0] - b[0] );
		
		return res.json({success:true,content:flotFormattedDates})

	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}

});

router.get('/email', adminAuth, async (req, res) => {

	try {
		let logs = await EmailLog.find().sort({created:-1});
		return res.json({success:true,data:logs});
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}
	
});

router.get('/error', adminAuth, async (req, res) => {

	try {
		let logs = await ErrorLog.find().sort({created:-1});
		return res.json({success:true,data:logs});
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}
	
});


router.get('/devices', adminAuth, async (req, res) => {

	try {
		let devices = await ActivityLog.find();
		devices = devices.reduce((acc,curr)=>{
			if (!curr.deviceName) return acc;

			if (acc[`${curr.deviceType} | ${curr.deviceName}`]) {
				acc[`${curr.deviceType} | ${curr.deviceName}`] += 1
			}
			else {
				acc[`${curr.deviceType} | ${curr.deviceName}`] = 1
			}

			return acc;
		},{});

		return res.json(devices);
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}

});


//Get all access activity and grab lat/lng if exists
//If the access data set becomes too large, we can display last 30 days of activity
router.get('/heatmap', adminAuth, async (req, res) => {

	try {
		let accessActivity = await ActivityLog.find({activity:'Access',latitude:{$ne:null}});

		const normalizeCoord = (coord) => parseFloat(coord.toFixed(4));
		accessActivity = accessActivity.reduce((acc,curr)=>{
			let index = acc.findIndex( e => {
				return (
							e.lat === normalizeCoord(curr.latitude) && 
							e.lng === normalizeCoord(curr.longitude)
						)
			});
			if (index !== -1) {
				acc[index].count += 1;
			}
			else {
				acc.push({
					lat: normalizeCoord(curr.latitude),
					lng: normalizeCoord(curr.longitude),
					count: 1
				});
			}
			return acc;
		},[])
		
		return res.json({success:true,content:accessActivity});
	}
	catch (error) {
		LogError(error,req);
		return res.json({success:false,message:errorMessages.generic500});
	}
	
});

module.exports = router;
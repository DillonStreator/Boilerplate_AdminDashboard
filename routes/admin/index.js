const {
	ActivityLog,
	ErrorLog,
	User
} = require('../../models');
const {LogError} = require('../../config/common');
const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/adminAuth');
const moment = require('moment');

/* GET home page. */
router.get('/', adminAuth, async (req, res) => {
	console.log('hitting this route');
	try {
		let createdDateRange = {created:{'$lte':new Date(),'$gte':moment().subtract(2,'weeks')}};
		let promises = [
			User.find(),
			ErrorLog.find(createdDateRange),
			ActivityLog.find(createdDateRange),
			ActivityLog.distinct("activity")
		]
		let [allUsers, allErrors, allActivities, distinctActivityTypes] = await Promise.all(promises);

		let [thisWeeksRegistrations, weeklyRegistrationIncreasePercent] = weekTotalAndPercentIncrease(allUsers);

		let [thisWeeksErrors, weeklyErrorIncreasePercent] = weekTotalAndPercentIncrease(allErrors);

		let allLogins = allActivities.filter( a => a.activity == 'Login' );
		let [thisWeeksLogins, weeklyLoginIncreasePercent] = weekTotalAndPercentIncrease(allLogins);

		distinctActivityTypes = distinctActivityTypes.sort( (a,b) => a > b );
		
		return res.render(
			'index',
			{
				menu: 'dashboard',
				title: 'Dashboard',
				totalUsers: allUsers.length,
				thisWeeksRegistrations,
				weeklyRegistrationIncreasePercent,
				thisWeeksErrors,
				weeklyErrorIncreasePercent,
				thisWeeksLogins,
				weeklyLoginIncreasePercent,
				distinctActivityTypes
			}
		);
	}
	catch (error) {
		LogError(error,req);
		return res.render('error500');
	}

});

/**
 * Get the percent increase in 2 numbers. If the result is a negative number then this is a percentage decrease.
 * @param {number} newNumber The new number
 * @param {number} originalNumber The original number
 */
function percentIncrease(newNumber, originalNumber){
	let increase = newNumber - originalNumber;
	return ((increase/originalNumber)*100).toFixed(2);
}

/**
 * Returns Array[thisWeeksItems, weeklyItemsIncreasePercent]
 * Assumes that the elements are objects with a 'created' propert that is a Javascript Date
 * Use ES6 Array destructuring with the return
 * 
 * @param {Array} items The items to get the weekly total of and the percent increase from previous week
 */
function weekTotalAndPercentIncrease(items){
	let thisWeeksItems = items.filter( i => i.created > moment().subtract(1,'weeks') ).length;
	let previousWeeksItems = items.filter( i => ( i.created > moment().subtract(2,'weeks') ) && ( i.created < moment().subtract(1,'weeks') ) ).length;
	let weeklyItemsIncreasePercent = 0;
	if (previousWeeksItems!==0) {
		weeklyItemsIncreasePercent = percentIncrease(thisWeeksItems, previousWeeksItems);
	}
	else {
		weeklyItemsIncreasePercent = parseInt(`${thisWeeksItems}00`);
	}
	return [thisWeeksItems, weeklyItemsIncreasePercent];
}

module.exports = router;

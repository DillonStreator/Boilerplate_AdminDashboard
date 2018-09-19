const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('connect-flash');
const permission = require('permission');
const device = require('express-device');
const useragent = require('useragent');
useragent(true);
const app = express();

require('dotenv').config();
require('./config/mongo');

const express_session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(express_session);

const sessionStore = new MongoDBStore({uri: `mongodb://localhost:27017/${process.env.DB_NAME}`, collection:"Admin_Sessions"});
sessionStore.on("error", (error) => {
	console.log("Session Error: " + error);
});
app.use(express_session({
	store: sessionStore,
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true,
	duration: 1000 * 60 * 60,	// 1 hour in milliseconds
	activeDuration: 1000 * 60 * 30	// 30 minutes in milliseconds
}));

const passport = require('passport');
require('./config/passport')(passport);

const fileUpload = require("express-fileupload");
app.use(fileUpload());
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '50mb'
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(device.capture({
	parseUserAgent: true
}));

app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Need this in order to grab the users IP address!
app.enable('trust proxy')

// ========================================================
// ====================== Permission ======================

const notAuthenticated = {
	flashType: 'errorMessages',
	message: 'The entered credentials are incorrect',
	redirect: '/admin/login'
};
const notAuthorized = {
	flashType: 'errorMessages',
	message: 'You do not have permissions to view this page',
	redirect: '/admin/login',
	status: 302
};
app.set('permission', {
	role: 'role',
	notAuthenticated: notAuthenticated,
	notAuthorized: notAuthorized
});

// ====================== Permission ======================
// ========================================================


/*
  Globals accessible in all views
*/
app.locals.COMPANY = process.env.COMPANY;
app.locals.COMPANY_ABV = process.env.COMPANY_ABV;
app.locals.COMPANY_FA_ICON = process.env.COMPANY_FA_ICON;

// ========================================================
// ===================== SEEDING ==========================
// *** uncomment in order to seed database with some test admin accounts
// require('./seed/admin');
// require('./seed/test');
// ===================== SEEDING ==========================
// ========================================================




// ========================================================
// ===================== MIDDLEWARE =======================

//Decodes the user
const jwtExtract = require('./middlewares/jwtExtract');
app.use(jwtExtract);
const mainMiddleware = require('./middlewares/main');
app.use(mainMiddleware);


const adminAuth = require('./middlewares/adminAuth');
const statusMonitor = require('express-status-monitor')();
//Must be authorized as an admin and be a 'SuperAdmin'
app.get('/admin/status', adminAuth, permission(['SuperAdmin']), (req, res) => {
	statusMonitor.pageRoute(req, res);
});

// ===================== MIDDLEWARE =======================
// ========================================================




// ========================================================
// ====================== Routers =========================

const indexRouter = require('./routes/admin');
const loginRouter = require('./routes/admin/login');
const logoutRouter = require('./routes/admin/logout');
const usersRouter = require('./routes/admin/users');
const logsRouter = require('./routes/admin/logs');
app.get('/',(req,res)=>res.redirect('/admin'));
app.use('/admin', indexRouter);
app.use('/admin/users', usersRouter);
app.use('/admin/login', loginRouter);
app.use('/admin/logout', logoutRouter);
app.use('/admin/logs', logsRouter);


const apiUsersRouter = require('./routes/admin/api/users');
const apiLogsRouter = require('./routes/admin/api/logs');
const apiNotesRouter = require('./routes/admin/api/notes');
app.use('/admin/api/users', apiUsersRouter);
app.use('/admin/api/logs', apiLogsRouter);
app.use('/admin/api/notes', apiNotesRouter);







const jwtAuth = require('./middlewares/jwtAuth');
const Login = require('./routes/endusers/api/login');
const Logout = require('./routes/endusers/api/logout');
app.get('/login', Login);
app.get('/logout', jwtAuth, Logout);


// ====================== Routers =========================
// ========================================================

// catch 404 and forward to error handler
app.use((req, res, next) => {
  	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error400');
});

module.exports = app;

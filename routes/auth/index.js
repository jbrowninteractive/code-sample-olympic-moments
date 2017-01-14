var log              = require('../../modules/logs.js');
var config           = require("../../modules/config");
var db               = process.db;
var geo              = require("../../modules/geo");
var express          = require("express");
var router           = express.Router();
var passport         = require("passport");
var GoogleStrategy   = require("passport-google-oauth").OAuth2Strategy
var FacebookStrategy = require("passport-facebook").Strategy;
var host             = config.HOST;
var _                = require("underscore");

// add port to host for local development
if (config.ENV === "local")
{
	host += ":" + config.PORT;
}

// setup google user strategy
passport.use(new GoogleStrategy(
{
	clientID          : config.GOOGLE_CLIENT_ID,
	clientSecret      : config.GOOGLE_CLIENT_SECRET,
	callbackURL       : host + "/auth/google/callback",
	passReqToCallback : true
},
function (req, accessToken, refreshToken, profile, cb)
{
	profile.ip           = req.ip;
	profile.accessToken  = accessToken;
	profile.refreshToken = refreshToken;
	cb(null, profile);
}));

// setup facebook user strategy
passport.use(new FacebookStrategy(
{
	clientID          : config.FACEBOOK_APP_ID,
	clientSecret      : config.FACEBOOK_APP_SECRET,
	callbackURL       : host + "/auth/facebook/callback",
	profileFields     : ["id", "name", "gender", "age_range", "displayName", "email", "picture.type(large)"],
	passReqToCallback : true
},
function (req, accessToken, refreshToken, profile, cb)
{
	profile.ip           = req.ip;
	profile.accessToken  = accessToken;
	profile.refreshToken = refreshToken;
	cb(null, profile);
}));

// serialize users
passport.serializeUser(function (profile, cb)
{
	var data =
	{
		login :
		{
			id          : profile.id,
			platform    : profile.provider,
			imageUrl    : profile.photos[0].value,
			email       : profile.emails[0].value,
			location    : '',
			displayName : profile.displayName || "",
			gender      : profile.gender      || "",
			ip          : profile.ip          || ""
		},
		services :
		{
			// added below
		}
	};

	data.services[profile.provider] =
	{
		active       : true,
		accessToken  : profile.accessToken  || "",
		refreshToken : profile.refreshToken || "",
		id           : profile.id
	};

	db.users.findOrCreate(data, function (err, user)
	{
		if (err)
		{
			return cb(err);
		}

		cb(null, user.id);
	});
});

// deserialize users
passport.deserializeUser(function (id, cb)
{
	db.users.read(["id", "=", id], function (err, results)
	{
		if (err)
		{
			return cb(err);
		}

		var user = results[0];

		if (!user)
		{
			return cb("User Not Found");
		}

		cb(null, user);
	});
});

router.get("/google", passport.authenticate("google",
{
	scope:
	[
		"profile",
		"email",
		"https://picasaweb.google.com/data/"
	]
}));

router.get("/google/callback", passport.authenticate('google',
{
	successRedirect : "/auth/success",
	failureRedirect : "/auth/failure"
}));

router.get("/facebook", passport.authenticate("facebook",
{
	scope :
	[
		"email",
		"user_photos"
	]
}));

router.get("/facebook/callback", passport.authenticate('facebook',
{
	successRedirect : "/auth/success",
	failureRedirect : "/auth/failure"
}));

router.get("/success", function (req, res)
{
	res.redirect("/tos");
});

// handle login failures
router.get("/failure", function (req, res)
{
	res.redirect("/");
});

// logout
router.get("/logout", function (req, res)
{
	req.logout();
	res.redirect("/signin");
});

module.exports = router;

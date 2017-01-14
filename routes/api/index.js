var log         = require("../../modules/logs.js");
var config      = require("../../modules/config");
var buckets     = require("../../modules/buckets");
var services    = require("../../modules/services");
var db          = process.db;
var gapi        = process.gapi;
var express     = require("express");
var multiparty  = require("multiparty");
var request     = require("request");
var Share       = require('../../modules/share');
var router      = express.Router();
var getLocation = require('../../modules/geo').getLocation;


// POST user video
router.post("/user/video", function(req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	// check if user is eligible to post a video
	if(Date.now() - req.user.video.timestamp < config.VIDEO_POST_LIMIT)
	{
		//return res.error("Video Limit Reached");
	}


	// get user moments
	var filters =
	[
		["userId", "=", req.user.id],
		["banned", "=", false],
		["nudity.scanned", "=", true],
		["nudity.result", "=", false]
	];

	db.moments.read(filters, function(err, moments)
	{
		if(err)
		{
			return res.error("Database Error", err);
		}

		if(moments.length < 1)
		{
			return res.error("No Moments");
		}

		// get stories
		db.stories.read(function(err, stories)
		{
			if(err)
			{
				return res.error("Database Error", err);
			}

			// associate stories with moments
			for(var i=0; i<moments.length; i++)
			{
			    var moment   = moments[i];
			    moment.story = getStory(moment.storyId, stories);
			}

			// send to video server


			var str     = config.VIDEO_SERVER_USER + ":" + config.VIDEO_SERVER_PASS;
			var auth    = "Basic " + new Buffer(str).toString("base64");
			var options =
			{
				url     : config.VIDEO_SERVER_HOST + "/video",
				method  : "POST",
				headers :
				{
					"Authorization": auth
				},
				json :
				{
					user    : req.user,
					moments : moments
				}
			};

      //var fs = require('fs');
      //fs.writeFile( './moments.json', JSON.stringify(moments), function(){});

			request(options, function(err, response)
			{
				if(err)
				{
					return res.error(err);
				}

				if(response.statusCode !== 200)
				{
					return res.error("Video Server Error", response.body);
				}

				// save url to db
				var data =
				{
					video :
					{
						url       : response.body.videoUrl,
						timestamp : Date.now()
					}
				};

				db.users.update(req.user.id, data, function(err, user)
				{
					if(err)
					{
						return res.error(err);
					}

					// respond
					res.data(data);
				});
			});
		});
	});

	// helper for associating story with moment
	function getStory(storyId, stories)
	{
		for(var i=0; i<stories.length; i++)
		{
		    var story = stories[i];

		    if(story.id === storyId)
		    {
		    	return story;
		    }
		}
	}
});

// GET current user
router.get("/user", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	// sanitize user for public consumption
	for(var key in req.user.services)
	{
		var service          = req.user.services[key];
		service.accessToken  = "";
		service.refreshToken = "";
	}

	res.data(req.user);
});

// GET list of stories
router.get("/stories", function (req, res)
{
	db.stories.read(function (err, stories)
	{
		if (err)
		{
			return res.error(err.message, err);
		}

		res.data(stories);
	});
});

// GET list of current users photos
router.get("/photos", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	services.getPhotos(req.user.id, function (err, photos)
	{
		if (err)
		{
			return res.error("Photo Service Error", err);
		}

		res.data(photos);
	});
});

router.post('/location', function (req, res)
{
  log.info('location hit ' + req.body.ip);

  if( !req.body.ip ) res.error();

  var ip = req.body.ip;

  getLocation( ip ).then( res.data );
});

// POST update current users preferences
router.post("/preferences/update", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	req.user.preferences = req.body;

	db.users.update(req.user.id, req.user, function (err, user)
	{
		if (err)
		{
			res.error(err.message, err);
		}

		res.data(user.preferences);
	});
});

// POST delete current user
router.post("/user/delete", function(req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	db.users.delete(req.user.id, function(err)
	{
		if(err)
		{
			return res.error("Database Error", err);
		}

		var data =
		{
			success : true
		};

		req.logout();

		res.data(data);
	});
});

// POST remove moment from gapi
router.post("/gapi/remove/:momentId", function(req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	gapi.removeMoment(req.params.momentId, function(err)
	{
		if(err)
		{
			return res.error("GAPI Error", err);
		}

		var data =
		{
			success : true
		};

		res.data(data);
	});
});


// POST upload photo for current user
router.post("/photos/add", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	var form = new multiparty.Form();

	form.parse(req, function (err, fields, files)
	{
		if(err)
		{
			return res.error("Form Parse Error", err);
		}

		var uploads = [];
		var errored = false;

		if(files.files.length === 0)
		{
			return res.error("No Files Found");
		}

		for(var i=0; i<files.files.length; i++)
		{
			var file = files.files[i];

			log.info( new Date( Number (file.originalFilename) ) );
			log.info( file )
			log.info( fields[i], fields )

			var data =
			{
				userId    : req.user.id,
				timestamp : Number(file.originalFilename) || Date.now(),
				imageUrl  : file.path
			};

			db.uploads.create(data, function(err, upload)
			{
				if(errored)
				{
					return;
				}

				if(err)
				{
					errored = true;
					res.error(err.message, err);
					return;
				}

				uploads.push(upload);

				if(uploads.length === files.files.length)
				{
					var args =
					{
						service : "uploads",
						userId  : req.user.id,
						login   : req.user.login
					};

					services.activate(args, function(err)
					{

						if(err)
						{
							return res.error("Photo Service Error", err);
						}

						res.data(uploads);
					});
				}
			});
		}
	});
});

// GET list of current users moments
router.get("/moments", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	db.moments.read(["userId", "=", req.user.id], function (err, moments)
	{
		if (err)
		{
			return res.error(err.message, err);
		}

		res.data(moments);
	});
});

// GET list of moments by user id
router.get("/moments/:userId", function (req, res)
{
	db.moments.read(["userId", "=", Number(req.params.userId)], function (err, moments)
	{
		if (err)
		{
			return res.error(err.message, err);
		}

		res.data(moments);
	});
});

// POST add moment for current user
router.post("/moments/add", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	var data =
	{
		userId         : req.user.id,
		storyId        : Number(req.body.storyId),
		imageUrl       : req.body.imageUrl,
		caption        : req.body.caption,
		service        : req.body.service,
		imageTimestamp : Number(req.body.imageTimestamp)
	};

	db.moments.create(data, function (err, moment)
	{
		if (err)
		{
			return res.error(err.message, err);
		}

		if(req.user.tos.commercial)
		{
			// give datastore time before retrieving moment
			setTimeout(function(){
				gapi.addMoment(moment.id);
			}, 500);
		}
		res.data(moment);
	});
});

// POST update existing moment by id
router.post("/moments/update/:id", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	var data = {};

	if (req.body.flagged === "true")
	{
		data.flagged = true;
	}

	if (req.body.hasOwnProperty("caption"))
	{
		data.caption = req.body.caption;
	}

	if (req.body.hasOwnProperty("imageUrl"))
	{
		data.imageUrl = req.body.imageUrl;
	}

	db.moments.update(req.params.id, data, function (err, moment)
	{
		if (err)
		{
			return res.error(err.message, err);
		}

		res.data(moment);
	});
});

// GET share by id
router.get("/shares/:id", function (req, res)
{
	db.shares.getShare(Number(req.params.id), function (err, share)
	{
		if (err)
		{
			return res.error(err);
		}

		res.data(share);
	});
});

// POST add share for current user
router.post("/moments/share", function (req, res)
{
	var data = req.body.content;

  var content = req.body.content;

	var createShare = function(){
		var _shareImage = Share.draw(content).then(function (imageUrl) {

				var data =
				{
					momentId : Number(content.momentId),
					imageUrl : imageUrl,
					userId   : Number(req.body.content.userId) || req.user.id
				};

				db.shares.create(data, function (err, share)
				{
					if (err)
					{
						return res.error(err.message, err);
					}

					res.data(share);
				});

			}).catch(function (err)
			{
				res.error("Share Error", err);
			});
	}

	if( req.user && !req.user.hasShared ){
		req.user.hasShared = true;

		db.users.update(req.user.id, req.user, function (err, user)
		{
			if (err)
			{
				res.error(err.message, err);
			}

			createShare();
		});
	}else{
		createShare();
	}
});

// POST update current users commercial status
router.post("/user/tos", function (req, res)
{
	if(!req.user)
	{
		return res.error("Unauthorized");
	}

	req.body.notifications = req.body.notifications || {};

	var data  =
	{
		tos :
		{
			chromeId      : req.body.chromeId || "",
			application   : req.body.application === "true",
			commercial    : req.body.commercial  === "true",
			notifications :
			{
				facebook : req.body.notifications.facebook === "true",
				chrome   : req.body.notifications.chrome   === "true",
				email    : req.body.notifications.email    === "true"
			}
		}
	};

	db.users.update(req.user.id, data, function (err, user)
	{
		if(err)
		{
			return res.error(err);
		}

		res.data(user);
	});
});

router.get('/notification', function(req, res){
  var obj = {
    title: 'Meus Momentos Gigantes',
    body: 'Meus Momentos Gigantes',
    icon: 'img/claro_logo.png'
  };

  res.send(obj);
})

router.post("/chrome", function( req, res)
{
  if(!req.user){
    return res.error("Unauthorized");
  }

  var data = { tos: { chromeId : req.body.chrome_registration } };

	db.users.update(req.user.id, data, function (err, user)
	{
		if(err)
		{
			return res.error(err);
		}

		res.data(user);
	});

});

router.get("/version", function(req, res)
{
	res.send(config.VERSION);
});

router.get("/ip", function( req, res )
{
	res.send(req.ip);
});

module.exports = router;

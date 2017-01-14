var config     = require("../../config");
var profanity  = require("../../profanity");
var Schema     = require("./Schema");
var validator  = require("validator");
var map        =
{
	id :
	{
		type     : Number,
		validate : function(value, data, entity, cb)
		{
			if(entity)
			{
				return cb(null);
			}

			var filter =
			[
				[ "userId" , "=", data.userId  ],
				[ "storyId", "=", data.storyId ]
			];

			this.model.read(filter, function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				if (results.length > 0)
				{
					return cb(new Error("Duplicate Moment"));
				}

				cb(null);
			});
		}
	},

	curated :
	{
		type    : Boolean,
		default : false
	},

	created :
	{
		type    : Number,
		default : function ()
		{
			return new Date().getTime()
		}
	},

	imageTimestamp :
	{
		type    : Number,
		default : function()
		{
			return Date.now()
		}
	},

	banned :
	{
		type     : Boolean,
		default  : false,
		validate : function(value, data, entity)
		{
			if(!entity)
			{
				return;
			}

			if(data.banned)
			{
				process.gapi.removeMoment(entity.id);
			}
		}
	},

	caption :
	{
		type     : String,
		default  : "",
		validate : function(value, data, entity)
		{
			if(!data.hasOwnProperty("caption"))
			{
				return;
			}

			// trim caption to max length
			data.caption = data.caption.substring(0, config.MAX_CAPTION_LENGTH);

			// test for profanity
			if(profanity.validate(data.caption))
			{
				data.flagged = true;
			}
		}
	},

	flagged :
	{
		type     : Boolean,
		default  : false,
		validate : function(value, data, entity)
		{
			if(data.flagged)
			{
				data.totalFlags = entity.data.totalFlags++;
			}
		}
	},

	totalFlags :
	{
		type    : Number,
		default : 0
	},

	imageUrl :
	{
		type     : String,
		required : true,
		validate : function (value, data, entity)
		{
			if(!validator.isURL(value))
			{
				return new Error("Invalid URL: Moment.imageUrl");
			}

			if(!entity)
			{
				return;
			}

			if
			(
				entity.data.nudity.scanned &&
				data.imageUrl              &&
				data.imageUrl !== entity.data.imageUrl
			)
			{
				data.nudity =
				{
					scanned : false,
					nudity  : false
				};
			}
		}
	},

	service :
	{
		type     : String,
		required : true,
		accepted :
		[
			"google",
			"facebook",
			"instagram",
			"uploads"
		]
	},

	nudity :
	{
		scanned :
		{
			type     : Boolean,
			default  : true,
			validate : function(value, data, entity, cb)
			{
				if(entity)
				{
					return cb(null);
				}

				if(data.service === "google" || data.service === "uploads")
				{
					process.nudity.scanUrl(data.imageUrl, function(err, result)
					{
						if(err)
						{
							return cb(null);
						}

						data.nudity =
						{
							scanned : true,
							result  : result
						}

						cb(null);
					});

					return;
				}

				cb(null);
			}
		},

		result :
		{
			type    : Boolean,
			default : false
		}
	},

	userId :
	{
		type     : Number,
		required : true,
		validate : function (value, data, entity, cb)
		{
			if(!data.hasOwnProperty("userId"))
			{
				return cb(null);
			}

			process.db.users.read(["id", "=", data.userId], function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				if (results.length < 1)
				{
					cb(new Error("Invalid ID: Moment.userId"));
				}

				cb(null);
			});
		}
	},

	storyId :
	{
		type     : Number,
		required : true,
		validate : function (value, data, entity, cb)
		{
			if(!data.hasOwnProperty("storyId"))
			{
				return cb(null);
			}

			process.db.stories.read(["id", "=", data.storyId], function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				if (results.length < 1)
				{
					cb(new Error("Invalid ID: Moment.storyId"));
				}

				cb(null);
			});
		}
	},

	commercialId :
	{
		type    : Number,
		default : 0
	}
};


class MomentSchema extends Schema
{
	constructor(model, kind)
	{
		super(model, kind, map);
	}
}

module.exports = MomentSchema;

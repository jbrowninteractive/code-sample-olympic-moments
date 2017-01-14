var Schema    = require("./Schema");
var validator = require("validator");
var bucket    = require("../../buckets").stories;

var map =
{
	created :
	{
		type    : Number,
		default : function ()
		{
			return new Date().getTime()
		}
	},

	timestamp :
	{
		type     : Number,
		required : true
	},

	day :
	{
		type     : Number,
		required : true
	},

	position :
	{
		type     : Number,
		required : true
	},

	caption :
	{
		type    : String,
		default : ""
	},

	description :
	{
		type    : String,
		default : ""
	},

	imageUrl :
	{
		type     : String,
		default  : "",
		validate : function(value, data, entity, cb)
		{
			if(!data.imageUrl)
			{
				return cb(null);
			}

			bucket.addImage(value, function (err, url)
			{
				if (err)
				{
					return cb(err);
				}

				data.imageUrl = url;

				cb(null);
			});
		}
	},

	weight :
	{
		type     : String,
		default  : "Regular",
		accepted :
		[
			"Primary",
			"Secondary",
			"Regular"
		]
	}
};

class StorySchema extends Schema
{
	constructor(model, kind)
	{
		super(model, kind, map);
	}
}

module.exports = StorySchema;

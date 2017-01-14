var Schema    = require("./Schema");
var validator = require("validator");
var bucket    = require("../../buckets").shares;

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

	momentId :
	{
		type     : Number,
		required : true,
		validate : function (value, data, entity, cb)
		{
			process.db.moments.read(["id", "=", value], function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				var moment = results[0];

				if (!moment)
				{
					return cb(new Error("Invalid Moment ID"));
				}

				cb(null);
			});
		}
	},

	userId :
	{
		type     : Number,
		required : true,
		validate : function (value, data, entity, cb)
		{
			process.db.users.read(["id", "=", value], function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				if (results.length < 1)
				{
					cb(new Error("Invalid ID: Share.userId"));
				}

				cb(null);
			});
		}
	},

	imageUrl :
	{
		type     : String,
		default  : "",
		validate : function(value, data, entity, cb)
		{
			bucket.addImage(value, "jpg", function (err, url)
			{
				if (err)
				{
					return cb(err);
				}

				data.imageUrl = url;

				cb(null);
			});
		}
	}
};

class ShareSchema extends Schema
{
	constructor(model, kind)
	{
		super(model, kind, map);
	}
}

module.exports = ShareSchema;

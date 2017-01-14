var Schema    = require("./Schema");
var validator = require("validator");
var bucket    = require("../../buckets").uploads;

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
					cb(new Error("Invalid ID: Upload.userId"));
				}

				cb(null);
			});
		}
	},

	imageUrl :
	{
		type     : String,
		required : true,
		validate : function(value, data, entity, cb)
		{
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
	}
};

class UploadSchema extends Schema
{
	constructor(model, kind)
	{
		super(model, kind, map);
	}
}

module.exports = UploadSchema;

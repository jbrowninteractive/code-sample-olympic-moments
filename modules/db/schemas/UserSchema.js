var Schema    = require("./Schema");
var validator = require("validator");

var map =
{

	video :
	{
		url :
		{
			type    : String,
			default : ""
		},

		timestamp:
		{
			type    : Number,
			default : 0
		}
	},

	created :
	{
		type    : Number,
		default : function ()
		{
			return new Date().getTime()
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

			if(value)
			{
				process.gapi.removeUser(entity.id);
			}
		}
	},

	hasShared  :
	{
		type    : Boolean,
		default : false
	},

	tos :
	{
		application :
		{
			type 	: Boolean,
			default : false
		},

		commercial :
		{
			type    : Boolean,
			default : false
		},

		chromeId :
		{
			type    : String,
			default : ""
		},

		notifications :
		{
			facebook :
			{
				type     : Boolean,
				default  : false,
				validate : function(value, data, entity)
				{
					if(entity)
					{
						return;
					}

					if(data.services.facebook)
					{
						data.tos =
						{
							notifications :
							{
								facebook : true
							}
						};
					}
				}
			},

			chrome :
			{
				type     : Boolean,
				default  : false,
				validate : function(value, data, entity)
				{
					if(entity)
					{
						return;
					}

					if(data.services.google)
					{
						data.tos =
						{
							notifications :
							{
								chrome : true
							}
						};
					}
				}
			},

			email :
			{
				type    : Boolean,
				default : true
			}
		}
	},

	login :
	{
		id:
		{
			type     : String,
			required : true
		},

		platform :
		{
			type     : String,
			required : true,
			accepted :
			[
				"facebook",
				"google"
			]
		},

		displayName :
		{
			type    : String,
			default : ""
		},

		gender :
		{
			type    : String,
			default : ""
		},

		email :
		{
			type    : String,
			default : ""
		},

		location :
		{
			type    : String,
			default : ""
		},

		ip :
		{
			type    : String,
			default : ""
		},

		imageUrl :
		{
			type     : String,
			required : true,
			validate : function (value)
			{
				if (!validator.isURL(value))
				{
					return new Error("Invalid URL: User.login.imageUrl");
				}
			}
		},

		last :
		{
			type    : Number,
			default : function ()
			{
				return new Date().getTime()
			}
		},

		total :
		{
			type    : Number,
			default : 1
		}
	},

	preferences :
	{
		restrictions :
		{
			urls :
			{
				type    : Array,
				default : []
			},

			stories :
			{
				type    : Array,
				default : []
			}
		}
	},

	services :
	{
		google :
		{
			active :
			{
				type    : Boolean,
				default : false
			},

			accessToken :
			{
				type    : String,
				default : ""
			},

			refreshToken :
			{
				type    : String,
				default : ""
			},

			id :
			{
				type    : String,
				default : ""
			}
		},

		facebook :
		{
			active :
				{
				type    : Boolean,
				default : false
			},

			accessToken :
			{
				type    : String,
				default : ""
			},

			refreshToken :
			{
				type    : String,
				default : ""
			},

			id :
			{
				type    : String,
				default : ""
			}
		},

		instagram :
		{
			active :
			{
				type    : Boolean,
				default : false
			},

			accessToken :
			{
				type    : String,
				default : ""
			},

			refreshToken :
			{
				type    : String,
				default : ""
			},

			id :
			{
				type    : String,
				default : ""
			}
		},

		uploads :
		{
			active :
			{
				type    : Boolean,
				default : false
			},

			accessToken :
			{
				type    : String,
				default : ""
			},

			refreshToken :
			{
				type    : String,
				default : ""
			},

			id:
			{
				type    : String,
				default : ""
			}
		}
	}
};

class UserSchema extends Schema
{
	constructor(model, kind)
	{
		super(model, kind, map);
	}
}

module.exports = UserSchema;

var Model = require("./Model");
var kind  = "Share";

class ShareModel extends Model
{
	constructor()
	{
		super(kind);
	}

	getShare(shareId, cb)
	{
		var db = process.db;

		this.read(["id", "=", shareId], function (err, results)
		{
			if (err)
			{
				return cb(err);
			}

			var share = results[0];

			if (!share)
			{
				return cb(new Error("Share Not Found"));
			}

			db.moments.read(["id", "=", share.momentId], function (err, results)
			{
				if (err)
				{
					return cb(err);
				}

				var moment = results[0];

				if (!moment)
				{
					return cb(new Error("Moment Not Found"));

				}

				db.users.read(["id", "=", moment.userId], function (err, results)
				{
					if (err)
					{
						return cb(err);
					}

					var user = results[0];

					if (!user)
					{
						return cb(new Error("User Not Found"));
					}

					share.user = {
						id: moment.userId,
						restrictedUrls: JSON.stringify( user.preferences.restrictions.stories ),
						login:
						{
							displayName: user.login.displayName,
              imageUrl: user.login.imageUrl,
              platform: user.login.platform
						}
					};

					db.stories.read(["id", "=", moment.storyId], function(err, results){
						if (err)
						{
							return cb(err);
						}

						var story = results[0];

						share.description = story.description;
						share.day = story.day + 4;

						cb(null, share);

					})

				});
			});
		});
	}
}

module.exports = ShareModel;

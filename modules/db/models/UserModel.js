var Model = require("./Model");
var kind  = "User";

class UserModel extends Model
{
	constructor()
	{
		super(kind);
	}

	delete(id, cb)
	{
		var self   = this;
		var db     = process.db;
		var gapi   = process.gapi;
		var filter = [ "userId", "=", id ];

		// notify google of user deletion
		gapi.removeUser(id);

		// init delete sequence
		deleteMoments();

		function deleteMoments()
		{
			deleteByUserId(db.moments, deleteShares);
		}

		function deleteShares()
		{
			deleteByUserId(db.shares, deleteUploads);
		}

		function deleteUploads()
		{
			deleteByUserId(db.uploads, done);
		}

		function done()
		{
			self._superDelete(id, cb);
		}

		function deleteByUserId(model, cb)
		{
			model.read(filter, function(err, results)
			{
				if(err)
				{
					return cb(err);
				}

				for(var i=0; i<results.length; i++)
				{
				    var result = results[i];
					model.delete(result.id);
				}

				cb(null);
			});
		}
	}

	_superDelete(id, cb)
	{
		super.delete(id, cb);
	}

	findOrCreate(data, cb)
	{
		var self = this;

		// 1. ensure login object exists
		if (!data || !data.login)
		{
			return cb(new Error("Invalid User Data"));
		}

		// 2. search for existing user by login.id and login.platform
		var filter =
		[
			["login.id", "=", data.login.id],
			["login.platform", "=", data.login.platform]
		];

		self.read(filter, function (err, results)
		{
			if (err)
			{
				return cb(err);
			}

			var user = results[0];

			// 3. if user is found update login information
			if (user)
			{
				data.login.last = new Date().getTime();
				data.login.total = ++user.login.total;

				return self.update(user.id, data, function (err, user)
				{
					if (err)
					{
						return cb(err);
					}

					cb(null, user);
				});
			}

			// 4. if not found create a new user
			self.create(data, function (err, user)
			{
				if (err)
				{
					return cb(err);
				}

				cb(null, user);
			});
		});
	}
}

module.exports = UserModel;

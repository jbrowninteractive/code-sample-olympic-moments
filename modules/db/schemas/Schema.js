class Schema
{
	constructor(model, kind, map)
	{
		this.model = model;
		this.kind  = kind;
		this.map   = map;
	}

	validate(data, entity, cb)
	{
		var self     = this;
		var obj      = entity ? this._clone(entity.data) : this._scaffold(this.map);
		var combined = this._merge(obj, data);
		var status   =
		{
			responsed : false,
			callbacks : 0,
			completed : 0
		};

		this._validate(this.map, combined, data, entity, this.kind, status, function (err)
		{
			process.nextTick(function ()
			{
				if (status.responded)
				{
					return;
				}

				if (err)
				{
					status.responded = true;
					return cb(err);
				}

				if (++status.completed === status.callbacks)
				{
					status.responded = true;
					data             = self._merge(obj, data);
					cb(null, data);
				}
			});
		});
	}

	_clone(obj)
	{
		try
		{
			return JSON.parse(JSON.stringify(obj));
		}
		catch(err)
		{
			// do nothingJSON.parse(JSON.stringify(obj))
		}
	}

	_validate(a, b, data, entity, hash, status, cb)
	{
		if (!a.type)
		{
			for (var key in a)
			{
				var va = a && a[key];
				var vb = b && b[key];
				var h  = hash + "." + key;

				this._validate(va, vb, data, entity, h, status, cb);
			}

			return;
		}

		status.callbacks++;

		var value = b;

		// required [Boolean]
		if(a.required && value == null)
		{
			return cb(new Error("Required Value: " + hash));
		}

		// type [Number, String, Array]
		if (value != null && a.type.prototype.constructor !== value.constructor)
		{
			return cb(new Error("Invalid Type: " + hash));
		}

		// check min and max values
		if (a.type === Number)
		{
			if (a.hasOwnProperty("min") && value < a.min)
			{
				return cb(new Error("Less Than Min Value: " + hash));
			}

			if (a.hasOwnProperty("max") && vb > value.max)
			{
				return cb(new Error("Greater Than Max Value: " + hash));
			}
		}

		// UPGRADE: check values in array are of correct type
		if (a.type === Array)
		{

		}

		// UPGRADE: add unique value checks
		// NOTE: potentially expensive operation
		if (a.unique)
		{

		}

		// accepted [Array]
		if (a.accepted)
		{
			if (a.accepted.indexOf(b) === -1)
			{
				return cb(new Error("Unaccepted Value: " + hash));
			}
		}

		// validate [Function]
		if (a.validate)
		{
			// check for async validation
			if (a.validate.length === 4)
			{
				return a.validate.call(this, value, data, entity, cb);
			}

			var err = a.validate(value, data, entity);

			if (err)
			{
				return cb(err);
			}
		}

		cb(null);
	}

	_scaffold(from)
	{
		var data = {};

		for (var key in from)
		{
			var obj = from[key];

			if (obj.type)
			{
				data[key] = typeof obj.default === "function" ? obj.default() : obj.default;
				continue;
			}

			data[key] = this._scaffold(obj);
		}

		return data;
	}

	_merge(a, b)
	{
		if (b === undefined || b === null)
		{
			return a;
		}

		for (var key in a)
		{
			var va = a[key];
			var vb = b[key];

			if (va && va.constructor === Object.prototype.constructor)
			{
				this._merge(va, vb);
				continue;
			}

			if (b.hasOwnProperty(key))
			{
				a[key] = vb;
			}
		}

		return a;
	}
}

module.exports = Schema;

var config = require("../../config");
var gcloud = require("gcloud");
var ds     = gcloud.datastore({ projectId: config.GCLOUD_PROJECT });

class Model
{
	constructor(kind)
	{
		var Schema  = require("../schemas/" + kind + "Schema");
		this.kind   = kind;
		this.schema = new Schema(this, kind);
	}

	create(data, cb)
	{
		data     = data || {};
		cb       = cb || process.noop;
		var self = this;

		this.schema.validate.call(this.schema, data, null, function (err, data)
		{
			if (err)
			{
				return cb(err);
			}

			var key    = ds.key([self.kind]);
			var entity =
			{
				key  : key,
				data : data
			};

			ds.save(entity, function (err)
			{
				if (err)
				{
					return cb(err);
				}

				var result = self._extract(entity);

				cb(null, result);
			});
		});
	}

	read(options, cb)
	{
		// Ex. filters [key, operator, value] or [ [k, o, v],  [k, o, v], etc. ]
		cb          = cb || process.noop;
		var self    = this;
		var filters = null;
		var limit   = config.MAX_READ_LIMIT;
		var offset  = null;
		var startVal = null;

		if (typeof options === "function")
		{
			cb      = options;
			options = null;
		}

		if (Array.isArray(options))
		{
			filters = options;
			options = null;
		}

		if (options)
		{
			if (Array.isArray(options.filters))
			{
				filters = options.filters;
			}

			if (options.limit > 0 && options.limit < limit)
			{
				limit = options.limit;
			}

			if (typeof options.offset === "number")
			{
				offset = options.offset;
			}

			if (typeof options.startVal === "string")
			{
				startVal = options.startVal;
			}

		}

		var query = ds.createQuery(self.kind).limit(limit);

		if (startVal)
		{
			query.autoPaginate(false);
			query.start(startVal);
		}

		if (filters)
		{
			self._addFilters(filters, query);
		}

		ds.runQuery(query, function (err, entities, next, info)
		{
			if (err)
			{
				return cb(err);

			}

			var results = [];

			for (var i = 0; i < entities.length; i++)
			{
				var entity = entities[i];
				var result = self._extract(entity);
				results.push(result);
			}

			cb(null, results, results.length, next && next.startVal);
		});
	}

	update(id, data, cb)
	{
		data     = data || {};
		cb       = cb || process.noop;
		var self = this;
		var key  = ds.key([self.kind, Number(id)]);

		ds.get(key, function (err, entity)
		{
			if (err)
			{
				return cb(err);
			}

			if (!entity)
			{
				return cb(new Error(self.kind + " Not Found"));
			}

			self.schema.validate.call(self.schema, data, entity, function (err, data)
			{
				if (err)
				{
					return cb(err);
				}

				entity.data = data;

				ds.save(entity, function (err)
				{
					if (err)
					{
						return cb(err);
					}

					var result = self._extract(entity);

					cb(null, result);
				});
			});
		});
	}

	delete(id, cb)
	{
		cb      = cb || process.noop;
		var key = ds.key([this.kind, Number(id)]);

		ds.delete(key, function (err)
		{
			cb(err);
		});
	}

	count(filters, cb)
	{
		// Ex. filters [key, operator, value] or [ [k, o, v],  [k, o, v], etc. ]

		if (typeof filters === "function")
		{
			cb      = filters;
			filters = null;
		}

		cb        = cb || process.noop;
		var query = ds.createQuery(this.kind).select("__key__");

		if (filters)
		{
			this._addFilters(filters, query);
		}

		ds.runQuery(query, function (err, entities)
		{
			if (err)
			{
				return cb(err);
			}

			cb(null, entities.length);
		});
	}

	_extract(entity)
	{
		if (!entity)
		{
			return null;
		}

		entity.data.id = entity.key.id;

		return entity.data;
	}

	_addFilters(obj, query)
	{
		var self = this;

		if (!Array.isArray(obj))
		{
			return;
		}

		if (Array.isArray(obj[0]))
		{
			for (var i = 0; i < obj.length; i++)
			{
				this._addFilters(obj[i], query);
			}

			return;
		}

		for (var i = 0; i < obj.length; i++)
		{
			var key      = obj[0];
			var operator = obj[1];
			var value    = obj[2];

			// UPGRADE: check if key exists in schema
			// UPGRADE: check if operator is accepted value
			if (typeof key !== "string" || typeof operator !== "string")
			{
				continue;
			}

			if (key === "id")
			{
				query.filter("__key__", "=", ds.key([self.kind, Number(value)]));
				continue;
			}

			query.filter(key, operator, value);
		}
	}

	_clone(obj)
	{
		try
		{
			return JSON.parse(JSON.stringify(obj));
		}
		catch(e)
		{
			return null;
		}
	}
}

module.exports = Model;

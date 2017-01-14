

// window.moments are created by jade

var url  = "/admin/moments/update";
var list = [];

function save()
{
	populate("delete");
	populate("flagged");
	populate("nudity");
	populate("curated");

	if(list.length === 0)
	{
		return;
	}

	$.post(url, {list:list}).always(function()
	{
		location.reload();
	});
}

function populate(className)
{
	var inputs = document.getElementsByClassName(className);

	for(var i=0; i<inputs.length; i++)
	{
		var input  = inputs[i];
		var moment = getMomentById(input.id);

		if(!moment)
		{
			continue;
		}

		switch(className)
		{
			case "delete" :
			{
				if(input.checked)
				{
					addItem(input.id, "delete", true);
				}

				break;
			}

			case "flagged" :
			{
				if(moment.flagged !== input.checked)
				{
					addItem(input.id, "flagged", input.checked);
				}

				break;
			}

			case "nudity" :
			{
				if(moment.nudity !== input.checked)
				{
					addItem(input.id, "nudity", input.checked);
				}

				break;
			}

			case "curated" :
			{
				if(moment.curated !== input.checked)
				{
					addItem(input.id, "curated", input.checked);
				}

				break;
			}

		}
	}
}

function getMomentById(id)
{
	id = Number(id);

	for(var i=0; i<moments.length; i++)
	{
		var moment = moments[i];

		if(moment.id === id)
		{
			return moment;
		}
	}
}

function addItem(id, key, value)
{
	id = Number(id);

	var item = getItemById(id);

	if(!item)
	{
		item =
		{
			id : id
		};

		list.push(item);
	}

	item[key] = value;
}

function getItemById(id)
{
	id = Number(id);

	for(var i=0; i<list.length; i++)
	{
		var item = list[i];

		if(item.id === id)
		{
			return item;
		}
	}
}

function update(self)
{
	var node = self.parentNode.getElementsByClassName("hidden")[0];
	node.innerHTML = self.checked;
}

function updateAll(self, className)
{
	var list = document.getElementsByClassName(className);

	for(var i=0; i<list.length; i++)
	{
	    var item = list[i];
	    item.checked = self.checked;
	    update(item);
	}
}

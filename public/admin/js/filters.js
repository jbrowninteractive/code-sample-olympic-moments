(function ()
{
	var filters = getFilters();

	if(!filters)
	{
		return;
	}

	var container = document.getElementById("filters");
	var table = container.getElementsByTagName("table")[0];
	var addBtn = container.getElementsByClassName("add")[0];
	var updateBtn = container.getElementsByClassName("update")[0];
	var operators = ["=", "<", ">"];

	container.style.display = "block";
	addBtn.onclick = add;
	updateBtn.onclick = update;
	populate();

	function add(key, operator, value)
	{
		key = typeof key === "undefined" ? "" : unescape(key);
		operator = typeof operator === "undefined" ? "" : unescape(operator);
		value = typeof value === "undefined" ? "" : unescape(value);

		switch (key)
		{
			case "created":
				value = brt.convert(Number(value));
				break;
		}

		var keysNode = new Select(key, filters);
		var opsNode = new Select(operator, operators);
		var valNode = new TextInput(value);
		var row = new TableRow([keysNode, opsNode, valNode]);
		table.appendChild(row);
	}

	function update()
	{
		var url = location.pathname + "?";

		for (var i = 0; i < table.rows.length; i++)
		{
			if (i !== 0)
			{
				url += "&";
			}

			var row = table.rows[i];

			var select = row.children[0].getElementsByTagName("select")[0];
			var key = select.selectedOptions[0].value;

			var select = row.children[1].getElementsByTagName("select")[0];
			var operator = select.selectedOptions[0].value;

			var textInput = row.children[2].getElementsByTagName("input")[0];
			var value = textInput.value.trim();

			switch (key)
			{
				case "created" :
					var parts = value.trim().split(" ");
					var date = parts[0].split("-");
					var time = parts[1] ? parts[1].split(":") : [];

					if(date.length < 2)
					{
						alert("Invalid Date Filter");
						return;
					}

					var day = date[0];
					var month = date[1];
					var year = date[2] || 2016;
					var hour = time[0] || 0;
					var min = time[1] || 0;
					var sec = time[2] || 0 ;
					var str = month + "/" + day + "/" + year + " " + hour + ":" + min + ":" + sec;
					value = new Date(str).getTime();
					value -= 1 * 60 * 60 * 1000
					break;
			}

			url += "filter=" + key + "|" + operator + "|" + value;

		}

		window.location = url;
	}

	function populate()
	{
		if (!location.search)
		{
			return [];
		}

		var queries = location.search.replace("?", "").split("&");

		for (var i = 0; i < queries.length; i++)
		{
			if (queries[i].split("=")[0] !== "filter")
			{
				continue;
			}

			var parts = queries[i].replace("filter=", "").split("|");
			add.apply(null, parts);
		}
	}

	function TableRow(tds)
	{
		var tr = document.createElement("tr");
		var btn = document.createElement("button");
		btn.innerHTML = "x";
		btn.onclick = function ()
		{
			table.removeChild(tr);
		};
		tds.push(btn)

		for (var i = 0; i < tds.length; i++)
		{
			var td = document.createElement("td");
			td.appendChild(tds[i]);
			tr.appendChild(td);
		}

		return tr;
	}

	function Select(def, values)
	{
		var node = document.createElement("select");

		for (var i = 0; i < values.length; i++)
		{
			var option = document.createElement("option");
			option.value = values[i].serverName || values[i];;
			option.innerHTML = values[i].displayName || values[i];;

			if(option.value === def)
			{
				option.setAttribute("selected", "");
			}

			node.appendChild(option);
		}

		return node;
	}

	function TextInput(value)
	{
		var node = document.createElement("input");
		node.value = value;
		return node;
	}

	function getFilters()
	{
		var table = document.getElementsByClassName("sortable")[0];

		if(!table)
		{
			return;
		}

		var filters = [];
		var headings = table.getElementsByTagName("th");

		for(var i=0; i<headings.length; i++)
		{
		    var heading = headings[i];
		    if(heading.hasAttribute("filter"))
		    {
		    	var filter =
		    	{
		    		serverName  : heading.getAttribute("filter"),
		    		displayName : heading.innerHTML.trim()
		    	};

		    	filters.push(filter);
		    }
		}

		return filters.length === 0 ? null : filters;

	}

})();

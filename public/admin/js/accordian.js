(function () {

	var nodes = document.getElementsByClassName("accordian");

	for (var i = 0; i < nodes.length; i++)
	{
		createAccordian(nodes[i]);
	}

	function createAccordian(node)
	{
		var ui = node.getElementsByClassName("ui")[0];
		var symbol = node.getElementsByClassName("symbol")[0];
		var table = node.getElementsByTagName("table")[0];

		ui.onclick = function ()
		{
			var display = window.getComputedStyle(table, null).display;

			if (display === "none")
			{
				table.style.display = "table";
				symbol.innerHTML = "-";
			}
			else
			{
				table.style.display = "none";
				symbol.innerHTML = "+";
			}
		};
	}
})();
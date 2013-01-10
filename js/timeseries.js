
/*
 * Create a Rickshaw plotter. The time series variable is first created,
 * then the plotter, X-axis, Y-axis and finally the legend and it's 
 * node select option.
 * @param {Array} nodes The list of nodes in the graph.
 * @param {Object} state The state of the network.
 */
createRickshawTimeseries = function (nodes, state) {
	// number of plots = 1
	for (var nplot = 0; nplot <= 0; nplot++) {
		var i, timeSeries = [];

		// Clear any previous plots
		$('#plotArea' + nplot)
			.html('');
		$('#axisY' + nplot)
			.html('');
		$('#legendNodes' + nplot)
			.html('');

		// Generate the timeSeries Object for the plotter
		for (i in state)
		timeSeries.push({
			color: randomColor(),
			data: [{
				x: 0,
				y: +state[i]
			}],
			name: i
		});

		// Create the Graph, constant hold interpolation  
		plot = new Rickshaw.Graph({
			element: $("#plotArea" + nplot)[0],
			width: $(window)
				.width() * 0.8,
			height: $(window)
				.height() * 0.1,
			renderer: 'line',
			interpolation: 'step-after',
			series: timeSeries
		});

		// Create the X & Y-axis, X is attached to the graph, whereas 
		// Y is separate
		var time = new Rickshaw.Fixtures.Time()
			.unit('second');
		time.formatter = function (d) {
			return d.getUTCSeconds();
		};
		var xAxis = new Rickshaw.Graph.Axis.Time({
			graph: plot,
			timeUnit: time
		});
		var yAxis = new Rickshaw.Graph.Axis.Y({
			graph: plot,
			orientation: 'left',
			ticks: 1,
			element: $('#axisY' + nplot)[0]
		});

		// Create the legend, separate from the graph
		var legend = new Rickshaw.Graph.Legend({
			element: $('#legendNodes' + nplot)[0],
			graph: plot,
		});

		// Create the choice list for the nodes, attach to legend
		var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
			graph: plot,
			legend: legend
		});

		// Render the plot and select the first node
		plot.render();
		$('#legendNodes' + nplot + ' ul :eq(0) span ')
			.trigger('click');
	}
};

/*
 * Append the newly calculated node states to the graph. The plot is 
 * then updated using the render function.
 * @param {Array} nodes The list of nodes in the graph.
 * @param {Object} state The state of the network.
 */
updateRickshawTimeseries = function (nodes, state) {
	var i, id;
	for (i in plot.series) {
		if (typeof (plot.series[i]) === 'object') {
			id = plot.series[i].name;
			plot.series[i].data.push({
				x: iterationCounter,
				y: +state[id]
			});
		}
	}
	plot.render();
};

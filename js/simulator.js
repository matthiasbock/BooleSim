var serverURL, controls;


/*
 * Generate a random color. The format is a 6 digit hex prefixed by a hash symbol.
 * @returns {string} The random color.
 */
randomColor = function () {
	var color = '#',
		i;
	// Get 6 random characters in hex
	for (i = 0; i < 6; i++)
	color += Math.round(Math.random() * 0xF)
		.toString(16);
	return color;
};


/*
 * Convert the update rule to a function. This is done by matching all 
 * the node ids and replacing them with the state variable equivalents.
 * @param {string} rule The update rule.
 * @returns {Function} The function for the update rule.
 */
rule2function = function (rule) {
	// Match the node ids
	var newRule = rule.replace(/[A-Za-z0-9_]+/g, function (text) {
		if (text === 'true' || text === 'false') return text;
		return "state['" + text + "']";
	});
	// Create the function passing the current state as the first parameter
	return Function("state", "return " + newRule + ";");
};


running = false;
obj = null;
config = null;
network = null;
ruleFunctions = {};
iterationCounter = 0;
plot = null;

	
/*
 * initialize the simulator. The initial states are calculated, the 
 * plotter is created and all the event handlers for the nodes are 
 * applied.
 * @param {jSBGN} jsbgn The network represented as a jSBGN object.
 * @param {number} simDelay The delay between successive iterations.
 * @param {Boolean} guessSeed Truth value for whether the guess seed for
 * SBML files should be applied.
 */
initializeSimulator = function (jsbgn, settings) {
	network = jsbgn;
	config = settings;
	network.state = {};

	console.log('Initializing simulator ...');

	$('#buttonSimulate')
		.click(startSimulator);
	//$('#buttonAnalyse')
	//	.click(findAttractors);

	// initialize the state of the network
	var i;
	for (i in network.rules) {
		if (network.rules[i].length !== 0) network.state[i] = controls.getInitialSeed();
	}

	createRickshawTimeseries(network.nodes, network.state);

	var svgNode;
	for (i in network.state) {
		ruleFunctions[i] = rule2function(network.rules[i]);
		// Get the node in the SVG and bind the event handlers
		svgNode = $('#' + i);
		if (svgNode !== null) {
			svgNode.click(onNodeClick);
			svgNode.hover(showRuleBox, removeInfoBox);
			svgNode.bind('contextmenu', onEditRuleDialogOpen);
			updateNodeColor(i);
		}
	}
};
		

/*
 * Update the color of a node after every iteration.
 * @param {string} nodeid The node id.
 */
updateNodeColor = function (nodeid) {
	var opacity = 0;
	if (network.state[nodeid] == true)
		opacity = 1;

	$('#' + nodeid + ' :eq(0)')
		.css('fill', '#10d010')
		.animate({
				'fill-opacity': opacity
				},
				config.simDelay);
};


/*
 * The event handler for right clicking a node. Opens the Edit rule
 * dialog box.
 * @param {Event} event The event object.
 */
onEditRuleDialogOpen = function (event) {
	event.preventDefault();

	var id = $(this)
		.attr('id');
	$('#textID')
		.text(id);
	$('#textRule')
		.val(network.rules[id]);
	$('#buttonEdit')
		.click(onEditRuleDialogSave);
	$('#dialogEdit')
		.dialog('open');
};

/*
 * The event handler for clicking the Update rule button of the edit
 * rule dialog box. The corresponding update rule function is updated.
 */
onEditRuleDialogSave = function (event) {
	var rule = $('#textRule')
		.val();
	var id = $('#textID')
		.text();
	
	// Update the rule and it's corresponding function
	network.rules[id] = rule;
	ruleFunctions[id] = rule2function(network.rules[id]);

	$('#buttonEdit')
		.unbind('click', onEditRuleDialogSave);
	$('#dialogEdit')
		.dialog('close');
};
	
	
/*
 * The event handler for left clicking a node. The node state is toggled.
 */
onNodeClick = function (event) {

	// Toggle the node state
	var nodeid = $(this).attr('id');
	if (!event.ctrlKey)
		network.state[nodeid] = !network.state[nodeid];
	updateNodeColor(nodeid);

	// Start the simulation if the One click option is checked
	if (config.oneClick && !running) setTimeout(function () {
		startSimulator();
	}, config.simDelay);
};

/*
 * The event handler for hovering over a node: displays update rule
 */
showRuleBox = function (event) {
	var id = $(this)
		.attr('id');
	var rule = id + ' = ' + network.rules[id];

	var mainEvent = event ? event : window.event;
//		var menuHeight = 41;   // the height of <ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all">

	// Create the info box
	$('<div/>', {
		id: 'boxInfo',
		text: rule,
		style: "left: "+event.clientX+"; top: "+event.clientY+"; width: auto;"
	})
		.prependTo('#tabNetwork')
		.click(removeInfoBox);
};

/*
 * The event handler for unhovering a node: delete info box
 */
removeInfoBox = function () {
	$('#boxInfo')
		.remove();
};


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


/*
 * Calculate the new state of the network using the update rules.
 * The node state is updated synchronously in the sense that the update
 * rule is calculated using the previous iteration's state. Only after
 * calculating all the new states, the state variable is updated.
 * @returns {Array} A list of the changed nodes.
 */
synchronousUpdate = function (state) {
	var i, id;
	var changed = [];
	var newState = {};

	// Get the new states by calling the respective update rule functions
	for (i in network.state) {
		newState[i] = ruleFunctions[i](state);
		if (newState[i] !== state[i]) changed.push(i);
	}
	// The update is synchronous: the states are updated only after all
	// the new states are calculated
	for (i in changed) {
		id = changed[i];
		state[id] = newState[id];
	}
	return changed;
};

/*
 * Run a single iteration. Call the run function after completing an
 * iteration. The node color is updated using an animation.
 */
updateAndContinue = function () {
	var changed, i;
	changed = synchronousUpdate(network.state);

	// Update the node colors after an iteration and call run again if
	// the Simulation has not reached steady state
	if (changed.length > 0) {
		for (i in changed)
			updateNodeColor(changed[i]);
		setTimeout(function () {
							runSimulator();
							}, config.simDelay);
	} else {
		console.log('Boolean network reached steady state.');
		stopSimulator();
	}
};

/*
 * Export all states to JSON. Required for the simulation of SBML files
 * using libscopes on the server.
 * @param {Array} states A list of the states which have to exported.
 * @returns {string} The JSON string for the exported states.
 */
exportStateJSON = function (states) {
	var i, j;
	var exportStates = [];
	// Loop over all states and convert Boolean to 0/1 for the Python
	// libscopes library
	for (i in states) {
		exportStates.push({});
		for (j in states[i]) {
			if (states[i][j]) exportStates[i][j] = 1;
			else exportStates[i][j] = 0;
		}
	}
	return JSON.stringify(exportStates);
};


/*
 * executes the simulator
 */
runSimulator = function () {
	if (!(running)) return;

	// update timeseries
	updateRickshawTimeseries(network.nodes, network.state);
	
	// update iteration counter
	$('#textIteration')
		.text(iterationCounter++);

	// Get the next states from the current state
	updateAndContinue();
};

/*
 * Generate a map for the state of the network.
 * @param {Object} state The state of the network.
 * @return {string} A map of the state of the network
 */
encodeStateMap = function (state) {
	var map = '',
		i;
	for (i in state)
	map += +state[i];
	return map;
};

/*
 * Decode the map of the state of the network
 * @param {string} map The map of the state of the network
 * @returns {Object} The state of the network
 */
decodeStateMap = function (map) {
	var state = {}, i, j = 0;
	for (i in network.state)
	state[i] = Boolean(parseInt(map[j++], 10));
	return state;
};

/*
 * Get some random initial states, used by the attractorSearch function.
 * @returns {Array} A list of states
 */
getInitStates = function () {
	var i, j;
	var initStates = [];
	for (i = 0; i < 30; i++) {
		initStates.push({});
		for (j in network.state) {
			initStates[i][j] = Boolean(Math.round(Math.random()));
		}
	}
	return initStates;
};

/*
 * The event handler for hovering over a node. Displays The state 
 * defined by the node for the network.
 */
showStateBox = function () {
	var id = $(this)
		.attr('id');
	// Get the state from the node id which is a map
	var state = decodeStateMap(id),
		i;
	var info = '';
	for (i in state)
	info += i + ': ' + state[i] + '<br>';

	// Generate the info box
	$('<div/>', {
		id: 'boxInfo',
		html: info
	})
		.prependTo('#graphStateTransition');
};

/*
 * Assign the state defined by the node in the State transition graph
 * to the nodes in the Network graph.
 */
copyStateNetwork = function () {
	var id = $(this)
		.attr('id'),
		i;
	network.state = decodeStateMap(id);
	for (i in network.state)
	updateNodeColor(i);
};

/*
 * Import the generated Attractor network into the State Transition Graph.
 * The d3 force layouter is applied to the graph, event handlers are
 * bound for each node and the attractors are colored.
 * @param {sb.Document} doc The SBGN document for the graph.
 * @param {Array} attractors A list of attractors of the graph.
 */
drawAttractors = function (doc, attractors) {

	// Convert the SBGN document to jSBGN
	var jsbgn = new jSBGN();
	var tmp = JSON.parse(sb.io.write(doc, 'jsbgn'));
	jsbgn.nodes = tmp.nodes;
	jsbgn.edges = tmp.edges;

	// Import the State transition graph into a bui.Graph instance
	controls.importNetwork(jsbgn, '#graphStateTransition');

	// Bind the event handlers for the node
	var i, id;
	for (i in jsbgn.nodes) {
		id = '#' + jsbgn.nodes[i].id;
		$(id)
			.hover(showStateBox, removeInfoBox);
		$(id)
			.click(copyStateNetwork);
	}
	// Color all the attractors with a unique color for each attractor
	var cycle, j, color;
	for (i in attractors) {
		cycle = attractors[i];
		color = randomColor();
		for (j in cycle)
		$('#' + cycle[j] + ' :eq(0)')
			.css('fill', color);
	}
};

/*
 * Calculate the attractors for the network graph and display a state
 * transition graph. The algorithm used is quite a simple one. 
 * For each initial state successive states are calculated and the nodes
 * (representing the state of the network) are added to the graph, 
 * and if a ndoe is repeated a edge is created and the next initial 
 * state is chosen.
 */
findAttractors = function () {
	var doc = new sb.Document();
	doc.lang(sb.Language.AF);

	var i, j;
	var initStates = getInitStates();

	// Loop over all the initial states to find the attractors
	var cycle, attractors = [];
	var map, prev, node, idx;
	var currStates, state;

	for (i in initStates) {
		state = initStates[i];
		currStates = [];
		prev = '';
		// Run the iterations for each initial state
		for (j = 0;; j++) {
			// A map is used to match two states, faster than directly
			// comparing the objects
			map = encodeStateMap(state);
			node = doc.node(map);
			// If the map does not exist in the graph document, create it
			if (node !== null) {
				idx = currStates.indexOf(map);
				// If the map already exists in the visited node array it means
				// that we have found a attractor
				if (idx !== -1) {
					cycle = currStates.slice(idx);
					attractors.push(cycle);
				}
				// Create the connecting arc for the state transition graph
				if (prev.length > 0) doc.createArc(prev + '->' + map)
					.type(sb.ArcType.PositiveInfluence)
					.source(prev)
					.target(map);
				break;
			} else {
				doc.createNode(map)
					.type(sb.NodeType.SimpleChemical);
				if (prev.length > 0) doc.createArc(prev + '->' + map)
					.type(sb.ArcType.PositiveInfluence)
					.source(prev)
					.target(map);
			}
			currStates.push(map);

			// Get the new states
			synchronousUpdate(state);
			prev = map;
		}
	}

	drawAttractors(doc, attractors);
};


/*
 * Export the update rules to a R BoolNet file. Take care of the 
 * difference is logical operators between JS and R.
 * @returns {string} The R BoolNet file data.
 */
exportRBoolNet = function () {
	var rbn = 'targets, factors\n';
	var i, r;

	// Replace the JS logical operators with those of R for each update
	// rule
	for (i in network.rules) {
		r = network.rules[i].replace(/&&/g, '&')
			.replace(/\|\|/g, '|')
			.replace(/true/g, 'TRUE')
			.replace(/false/g, 'FALSE');
		rbn += i + ', ' + r + '\n';
	}
	return rbn;
};

/*
 * Export the update rules to a Python BooleanNet file. Take care of the 
 * difference is logical operators between JS and Python.
 * @returns {string} The Python BooleanNet file data.
 */
exportPythonBooleanNet = function () {
	var pbn = '';
	var i, r;

	// Replace the JS logical operators with those of Python for each update
	// rule
	for (i in network.rules) {
		r = network.rules[i].replace(/&&/g, 'and')
			.replace(/\|\|/g, 'or')
			.replace(/true/g, 'True')
			.replace(/false/g, 'False')
			.replace(/[!]/g, 'not');
		pbn += i + '* = ' + r + '\n';
	}
	return pbn;
};



/*
 * bind event handlers
 */
startSimulator = function () {
	$('#buttonSimulate')
		.unbind('click', startSimulator);
	$('#buttonSimulate')
		.click(stopSimulator);
	$('#buttonSimulate')
		.button("option", "icons", {
		primary: 'ui-icon-pause'
	});
	$('#tabs')
		.tabs('select', '#tabNetwork');

	// Start the simulation
	running = true;
	runSimulator();
};

/*
 * unbind event handlers
 */
stopSimulator = function () {
	running = false;

	$('#buttonSimulate')
		.unbind('click', stopSimulator);
	$('#buttonSimulate')
		.click(startSimulator);
	$('#buttonSimulate')
		.button("option", "icons", {
		primary: 'ui-icon-play'
	});
};



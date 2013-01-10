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
	network.freeze = {};

	console.log('Initializing simulator ...');

	$('#buttonSimulate')
		.click(startSimulator);
	//$('#buttonAnalyse')
	//	.click(findAttractors);

	// initialize the state of the network
	var i;
	for (i in network.rules) {
		if (network.rules[i].length !== 0) {
			network.state[i] = controls.getInitialSeed();
			network.freeze[i] = false;
		}
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

	color = "#10d010";
	stroke = "black";
	width = "1px";
	if (network.freeze[nodeid]) {
		stroke = "#FF4538";
		width = "5px";
	}
	
	$('#' + nodeid + ' :eq(0)')
		.css('stroke', stroke)
		.css('stroke-width', width)
		.css('fill', color)
		.animate({
				'fill-opacity': opacity
				},
				config.simDelay);
};
	
/*
 * The event handler for left clicking a node. The node state is toggled.
 */
onNodeClick = function (event) {
	// Toggle the node state
	var nodeid = $(this).attr('id');
	if (!event.ctrlKey)
		network.state[nodeid] = ! network.state[nodeid];
	else
		network.freeze[nodeid] = ! network.freeze[nodeid];
	updateNodeColor(nodeid);

	// Start the simulation if the One click option is checked
	if (config.oneClick && !running) setTimeout(function () {
		startSimulator();
	}, config.simDelay);
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
		if (!network.freeze[i]) {
			newState[i] = ruleFunctions[i](state);
			if (newState[i] !== state[i])
				changed.push(i);
		}
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



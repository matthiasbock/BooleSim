var serverURL, controls;

/*
 * Generate a random color. The format is a 6 digit hex prefixed by a hash
 * symbol. @returns {string} The random color.
 */
randomColor = function() {
    var color = '#', i;
    // Get 6 random characters in hex
    for (i = 0; i < 6; i++)
        color += Math.round(Math.random() * 0xF).toString(16);
    return color;
};

/*
 * Convert the update rule to a function. This is done by matching all the node
 * ids and replacing them with the state variable equivalents. @param {string}
 * rule The update rule. @returns {Function} The function for the update rule.
 */
rule2function = function(node, rule) {
    var newRule;
    if (typeof (rule) === "undefined") {
        // during update the previous node value is set (equal to no update at
        // all)
        newRule = "state['" + node + "'];";
    } else {
        // Match the node ids
        newRule = rule.replace(/[A-Za-z0-9_]+/g, function(text) {
            if (text === 'true' || text === 'false')
                return text;
            return "state['" + text + "']";
        });
    }
    // Create the function passing the current state as the first parameter
    try {
        return Function("state", "return " + newRule + ";");
    } catch (e) {
        return null;
    }
};

updateAllGraphNodes = function(state, graph) {
    var drawables = graph.drawables();
    for (i in state) {
        updateGraphNode(drawables, i);
    }
};

updateGraphNode = function(drawables, i) {
    // Get the node in the SVG and bind the event handlers
    svgNode = $('#' + i);
    if (svgNode !== null) {
        drawables[i].bind(bui.Node.ListenerType.click, function() {
            this.bind(bui.Node.ListenerType.click, onNodeClick);
        });
        drawables[i].bind(bui.Node.ListenerType.dragStart, function() {
            this.unbind(bui.Node.ListenerType.click, onNodeClick);
        });
        drawables[i].bind(bui.Node.ListenerType.click, onNodeClick);
        svgNode.hover(showRuleBox, removeInfoBox);
        svgNode.bind('contextmenu', onRightClick);
        updateNodeColor(i);
    }
};

obj = null;
config = null;
network = null;
ruleFunctions = {};
running = false;
iterationCounter = 0;
initialIndex = 0;
plot = null;
states = [];

/*
 * Functions for the buttons in divNetworkLegend
 */

// reset node states to state upon import or state before simulation
$('#buttonResetStates').click(function() {
    if (network == null || network == undefined)
        return;
    var i;
    for (i in network.nodes) {
        var id = network.nodes[i].id;
        if (network.state.hasOwnProperty(id)) {
            if (network.initialState.hasOwnProperty(id))
                network.state[id] = network.initialState[id];
            else
                network.state[id] = true;
        }
    }
    updateAllGraphNodes(network.state, networkGraph);
});

// set all nodes to true
$('#buttonAllTrue').click(function() {
    if (network == null || network == undefined)
        return;
    var i;
    for (i in network.nodes) {
        var id = network.nodes[i].id;
        if (network.state.hasOwnProperty(id))
            network.state[id] = true;
    }
    updateAllGraphNodes(network.state, networkGraph);
});

// set all nodes to false
$('#buttonAllFalse').click(function() {
    if (network == null || network == undefined)
        return;
    var i;
    for (i in network.nodes) {
        var id = network.nodes[i].id;
        if (network.state.hasOwnProperty(id))
            network.state[id] = false;
    }
    updateAllGraphNodes(network.state, networkGraph);
});

/*
 * initialize the simulator. The initial states are calculated, the plotter is
 * created and all the event handlers for the nodes are applied. @param {jSBGN}
 * jsbgn The network represented as a jSBGN object. @param {number} simDelay The
 * delay between successive iterations. @param {Boolean} guessSeed Truth value
 * for whether the guess seed for SBML files should be applied.
 */
initializeSimulator = function(jsbgn, settings, graph) {
    network = jsbgn;
    config = settings;
    network.freeze = {};
    running = false;

    console.log('Initializing simulator ...');

    $('#buttonSimulate').click(startSimulator);
    // $('#buttonAnalyse')
    // .click(findAttractors);

    // initialize the state of the network
    var i;
    for (i in network.nodes) {
        var id = network.nodes[i].id;
        // Assign initial state to all nodes that don't have a state already
        if (!network.state.hasOwnProperty(id))
            network.state[id] = controls.getInitialSeed();
        network.freeze[id] = false;
    }

    resetTimeseries();
    createSteadyStates();

    ruleFunctions = {};
    for (i in network.state) {
        ruleFunctions[i] = rule2function(i, network.rules[i]);
    }
    updateAllGraphNodes(network.state, graph);
};

destroySimulator = function() {
    $('#buttonSimulate').unbind('click', startSimulator);
};

var resetSimulator = function() {
    if (running)
        stopSimulator();
    for (i in states[initialIndex])
        network.state[i] = states[initialIndex][i];
    updateAllGraphNodes(network.state, networkGraph);
    resetTimeseries();
};

/*
 * Update the color of a node after every iteration. @param {string} nodeid The
 * node id.
 */
updateNodeColor = function(nodeid) {
    if (network.state[nodeid])
        color = yellow;
    else
        color = blue;
    stroke = "black";
    width = "2px";
    if (network.freeze[nodeid]) {
        stroke = "#FF4538"; // red'ish
        width = "6px";
    }

    $('#' + nodeid + ' :eq(0)').css('stroke', stroke)
            .css('stroke-width', width)
            // ~ .css('fill', color);
            .animate({
                'fill' : color
            }, config.simDelay);
};

/*
 * The event handler for left clicking a node. The node state is toggled.
 */
onNodeClick = function(ob, ev) {
    // Toggle the node state
    var nodeid = this.id();

    if (!ev.ctrlKey) {
        network.state[nodeid] = !network.state[nodeid];
    } else {
        network.freeze[nodeid] = !network.freeze[nodeid];
    }
    updateNodeColor(nodeid);

    // Update the value in the plot
    states[iterationCounter] = {};
    $.extend(states[iterationCounter], network.state);

    // Start the simulation if the One click option is checked
    if (config.oneClick && (!running))
        setTimeout(function() {
            startSimulator();
        }, config.simDelay);
};

/*
 * Event handler for right click on a node: remove node
 */
onRightClick = function(event) {
    if (running) {
        alert('Node cannot be deleted while simulating');
        event.preventDefault();
        return;
    }
    if (!event.ctrlKey) {
        event.preventDefault();
        var id = $(this).attr('id');
        $('#deleteNodeID').html(id);
        $('#dialogDeleteNode').dialog('open');
        $('#buttonDeleteNodeYes')
            .unbind('click')
            .bind('click', id, controls.deleteNodeFromGraph);
    }
};

/*
 * Calculate the new state of the network using the update rules. The node state
 * is updated synchronously in the sense that the update rule is calculated
 * using the previous iteration's state. Only after calculating all the new
 * states, the state variable is updated. @returns {Array} A list of the changed
 * nodes.
 */
synchronousUpdate = function(state) {
    var i, id;
    var changed = [];
    var newState = {};

    // Get the new states by calling the respective update rule functions
    for (i in network.state) {
        if (!network.freeze[i]) {
            newState[i] = ruleFunctions[i](state);
            if (newState[i] !== state[i])
                changed.push(i);
        } else {
            newState[i] = state[i];
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
 * Run a single iteration. Call the run function after completing an iteration.
 * The node color is updated using an animation.
 */
updateAndContinue = function() {
    var changed, i;
    changed = synchronousUpdate(network.state);

    states.push({});
    $.extend(states[iterationCounter + 1], network.state);

    // Update the node colors after an iteration and call run again if
    // the Simulation has not reached steady state
    if (changed.length > 0) {

        // update bui
        for (i in changed)
            updateNodeColor(changed[i]);

        // iterate again after delay
        setTimeout(function() {
            runSimulator();
        }, config.simDelay);
    } else {
        console.log('Boolean network reached steady state.');
        stopSimulator();

        // append new steady-state to SteadyStates
        updateSteadyStates();
    }
};

/*
 * executes the simulator
 */
runSimulator = function() {
    if (!(running))
        return;

    // Get the next states from the current state
    updateAndContinue();

    // update iteration counter
    iterationCounter++;
    $('#textIteration').text(timeseriesLabelCounter);
    if (plot !== null)
        createNodeStateColumn(network.state, iterationCounter + skipped);
};

/*
 * bind event handlers
 */
startSimulator = function() {
    // reload update rules if in editor mode
    var index = $('#tabs').tabs('option', 'selected');
    if (index === 1) {
        if (!reloadUpdateRules()) {
            prevTab = 2;
            $('#tabs').tabs('select', 1);
            return;
        }
    }

    $('#buttonSimulate').unbind('click', startSimulator).click(stopSimulator)
            .button("option", "icons", {
                primary : 'ui-icon-pause'
            });
    $('#buttonSimulate span.ui-button-text').text('Pause');

    // Start the simulation
    running = true;

    if ($('#optionsResetStatesToBeforeSimulation').attr('checked')) {
        // before simulating: save current states to inital states dictionary
        network.initialState = {};
        for (id in network.state)
            network.initialState[id] = network.state[id];
    }

    if (iterationCounter > 0) {
        // move 2 steps to the right, delete the column inbetween
        removeNodeStateColumn(iterationCounter + skipped + 1);
        // reset timeseries label counter
        timeseriesLabelCounter = 1;
        // draw the next first timeseries column
        createNodeStateColumn(network.state, iterationCounter + skipped + 2);
        skipped += 2;
    }
    initialIndex = iterationCounter;

    runSimulator();
};

/*
 * unbind event handlers
 */
stopSimulator = function() {
    running = false;

    $('#buttonSimulate').unbind('click', stopSimulator).click(startSimulator)
            .button("option", "icons", {
                primary : 'ui-icon-play'
            });
    $('#buttonSimulate span.ui-button-text').text('Simulate');

    // switch on editing rules
    $('#textRules').prop('disabled', false);
};

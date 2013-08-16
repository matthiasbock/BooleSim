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
getSomeRandomStates = function () {
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
    var initStates = getSomeRandomStates();

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
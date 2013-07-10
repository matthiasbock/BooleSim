//
// Rules tab has been selected.
// Write current network rule configuration to edit field !
//
var loadRulesText = function () {
    var text = '';
    $('#textRules').val('');
    for (node in network.rules) {
        text += node + ' = ' + network.rules[node] + '\n';
    }
    $('#textRules').val(text);
    if (running)
        $('#textRules').prop('disabled', true);
    else
        $('#textRules').prop('disabled', false);
}

//
// Switching from "Rules" to "Network" tab.
// Read and parse edit field, refresh network graph !
//
var reloadUpdateRules = function () {
    var jsbgn = new jSBGN();

    if (!jsbgn.importBooleanNetwork($('#textRules').val(), '=', true)) {
        alert('Please check the syntax of the update rules');
        return false;
    }

    var jsbgnNodes = {};
    for (i in jsbgn.nodes) {
        var id = jsbgn.nodes[i].id;
        jsbgnNodes[id] = true;
    }

    var added = jsbgn.nodes.filter(function (i) {
        return !network.state.hasOwnProperty(i.id);
    });
    var removed = network.nodes.filter(function (i) {
        return !jsbgnNodes.hasOwnProperty(i.id);
    });
    var same = jsbgn.nodes.filter(function (i) {
        return network.state.hasOwnProperty(i.id);
    });

    for (i in same) {
        var id = same[i].id;
        ruleFunctions[id] = rule2function(id, jsbgn.rules[id]);
        if (ruleFunctions[id] == null) {
            alert('Please check the syntax of the update rules');
            return false;
        }
    }

    for (i in added) {
        var id = added[i].id;
        network.state[id] = controls.getInitialSeed();
        for (j = 0; j <= iterationCounter; j++)
            states[j][id] = network.state[id];
        network.freeze[id] = false;
        ruleFunctions[id] = rule2function(id, jsbgn.rules[id]);

        if (ruleFunctions[id] == null) {
            alert('Please check the syntax of the update rules');
            return false;
        }
    }

    for (i in removed) {
        var id = removed[i].id;
        delete network.state[id];
        delete network.freeze[id];
        delete ruleFunctions[id];
    }

    // time consuming, could be reduced
    controls.importNetwork(jsbgn, '#tabNetwork');
    updateAllGraphNodes(network.state, networkGraph);

    network.rules = jsbgn.rules;
    network.nodes = jsbgn.nodes;
    network.edges = jsbgn.edges;
    network.left = jsbgn.left;
    network.right = jsbgn.right;

    updateTimeseries();
    //~ identifyIONodes(network.left, network.right);
    //~ highlightIONodes();
    //~ createSteadyStates();

    return true;
}
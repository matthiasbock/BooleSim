
/*
 * Rules tab has been selected.
 * Write current network rule configuration to edit field !
 */
loadRulesText = function () {
    var text = '';
    $('#textRules').val('');
    for (node in network.rules) {
        text += node + ' = ' + network.rules[node] + '\n';
    }
    //console.log(text);
    $('#textRules').val(text);
    $('#textRules').attr('backup', text);
    if (running)
        $('#textRules').prop('disabled', true);
    else
        $('#textRules').prop('disabled', false);
};

//
// Clicking "Save Rules" button in "Rules" tab
// Read and parse edit field, refresh network graph if successfull
//
reloadUpdateRules = function () {

    if ($('#textRules').prop('disabled')) {
        return false;
    }

    var jsbgn = new jSBGN();

    if (!jsbgn.importBooleanNetwork($('#textRules').val(), '=', true)) {
        alert('Please check the syntax of your update rules');
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

    // deepcopy as backup in case of errors
    var oldRules = jQuery.extend(true, {}, ruleFunctions);

    for (i in same) {
        var id = same[i].id;
        ruleFunctions[id] = rule2function(id, jsbgn.rules[id]);
        if (ruleFunctions[id] == null) {
            alert('Please check the syntax of your update rules');
            ruleFunctions = oldRules; // fall back to previous rules
            return false;
        }
    }
    
    // deepcopy as backup in case of errors
    var oldNetwork = jQuery.extend(true, {}, network);
    
    for (i in added) {
        var id = added[i].id;
        network.state[id] = controls.getInitialSeed();
        for (var j = 0; j <= iterationCounter; j++)
            states[j][id] = network.state[id];
        network.freeze[id] = false;
        ruleFunctions[id] = rule2function(id, jsbgn.rules[id]);

        if (ruleFunctions[id] == null) {
            alert('Please check the syntax of your update rules');
            network = oldNetwork; // fall back to previous network
            ruleFunctions = oldRules; // and previous rules
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

    //updateTimeseries();
    resetTimeseries();
    //~ identifyIONodes(network.left, network.right);
    //~ highlightIONodes();
    //~ createSteadyStates();

    // Save was successfull
    $('#labelSaved').css('visibility', 'hidden');
    $('#textRules').attr('backup', $('#textRules').val());

    return true;
};

revertToSavedVersion = function() {
    var backup = $('#textRules').attr('backup');
    if (backup != undefined) {
        $('#textRules').val(backup).focus();
        rulesChanged = false;
        $('#labelSaved').css('visibility', 'hidden');
        $('.spellcheckWarning').remove();
        spell.check();
    }
};

$('#buttonSaveRules').click(reloadUpdateRules);
$('#buttonDiscardChanges').click(revertToSavedVersion);

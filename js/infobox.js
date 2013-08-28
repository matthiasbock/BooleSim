/*
 * The event handler for hovering over a node: displays update rule
 */
showRuleBox = function (event) {
    $('#boxInfo')
        .remove();

    var id = $(this)
        .attr('id');
    var rule = id + ' = ' + network.rules[id];

    var mainEvent = event ? event : window.event;
    //		var menuHeight = 41;   // the height of <ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all">

    // Create the info box
    $('<div/>', {
        id: 'boxInfo',
        text: rule,
        style: "left: " + event.clientX + "; top: " + event.clientY + "; width: auto;"
    })
        .prependTo('#tabNetwork')
        .click(removeInfoBox);
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
 * The event handler for unhovering a node: delete info box
 */
removeInfoBox = function () {
    $('#boxInfo')
        .remove();
};
var encounteredStateCombinations = [];
var networkInputNodes, networkOutputNodes;

/*
 * create an empty table in the SteadyStates tab
 */

var identifyIONodes = function (leftNodes, rightNodes) {
    networkInputNodes = rightNodes.filter(function (i) {
        return leftNodes.indexOf(i) < 0;
    });
    networkOutputNodes = leftNodes.filter(function (i) {
        return rightNodes.indexOf(i) < 0;
    });
}

var highlightIONodes = function () {
    input_color = "#3f84c6";
    output_color = "#c63fb8";
    for (i in networkInputNodes) {
        nodeid = networkInputNodes[i];
        $('#' + nodeid).css('stroke', input_color);
    }
    for (i in networkOutputNodes) {
        nodeid = networkOutputNodes[i];
        $('#' + nodeid).css('stroke', output_color);
    }
}

createSteadyStates = function () {

    //	var html = "<tr><th colspan="+(networkInputNodes.length+networkOutputNodes.length+1)+">Passed steady states</th></tr>\n";
    var html = "<tr><th colspan=" + networkInputNodes.length + ">Input nodes</th>";
    html += '<th style="width: 10px;">&nbsp;</th>';
    html += "<th colspan=" + networkOutputNodes.length + ">Output nodes</th></tr>";
    html += "<tr>\n";
    var i;
    for (i in networkInputNodes) {
        html += "<th>" + networkInputNodes[i] + "</th>";
    }
    html += "<th></th>";
    for (i in networkOutputNodes) {
        html += "<th>" + networkOutputNodes[i] + "</th>";
    }
    html += "</tr>\n";

    // set content of SteadyStates <table>
    $("#SteadyStates")
        .html(html);
}

appendSteadyStatesTable = function (stateCombination) {
    var row = "<tr>";
    var i;
    for (i in stateCombination) {
        // spacer between input and output nodes
        if (i == networkInputNodes.length)
            row += '<td style="border: none;"></td>';

        // green for on, white for off
        var state = "off";
        var color = "white";
        if (stateCombination[i]) {
            state = "on";
            color = "#10d010";
        }
        row += '<td style="background-color: ' + color + ';">' + state + '</td>';
    }
    row += "</tr>\n";

    $("#SteadyStates")
        .append(row);
}

workaroundChromiumArrayBug = function (stateCombination) {
    var result = "";
    for (i in stateCombination) {
        if (stateCombination[i]) {
            result += "1";
        } else {
            result += "0";
        }
    }
    return result;
}

/*
 * every time, the statespace is updated, check if
 * a new state combination has occured
 */
updateSteadyStates = function () {
    var currentStateCombination = [];
    var i;
    for (i in networkInputNodes) {
        currentStateCombination.push(network.state[networkInputNodes[i]]);
    }
    for (i in networkOutputNodes) {
        currentStateCombination.push(network.state[networkOutputNodes[i]]);
    }
    s = workaroundChromiumArrayBug(currentStateCombination);
    if (encounteredStateCombinations.indexOf(s) < 0) {
        encounteredStateCombinations.push(s);
        appendSteadyStatesTable(currentStateCombination);
    }
}
var networkInputNodes, networkOutputNodes = [];
var encounteredStateCombinations = [];

/*
 * create an empty table in the SteadyStates tab
 */
createSteadyStates = function() {

	networkInputNodes = [
					"oxygen",
					"glucose",
					"glycerol",
					"nitrogen",
					"rapamycin"
					];
	networkOutputNodes = [
					"autophagy",
					"basal_mitophagy",
					"elevated_mitophagy"
					];
	
//	var html = "<tr><th colspan="+(networkInputNodes.length+networkOutputNodes.length+1)+">Passed steady states</th></tr>\n";
	var html = "<tr><th colspan="+networkInputNodes.length+">Input nodes</th>";
	html += '<th style="width: 10px;">&nbsp;</th>';
	html += "<th colspan="+networkOutputNodes.length+">Output nodes</th></tr>";
	html += "<tr>\n";
	var i;
	for (i in networkInputNodes) {
		html += "<th>"+networkInputNodes[i]+"</th>";
	}
	html += "<th></th>";
	for (i in networkOutputNodes) {
		html += "<th>"+networkOutputNodes[i]+"</th>";
	}
	html += "</tr>\n";

	// set content of SteadyStates <table>
	$("#SteadyStates")
		.html(html);
}

appendSteadyStatesTable = function(stateCombination) {
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
		row +=  '<td style="background-color: '+color+';">'+state+'</td>';
	}
	row += "</tr>\n";
	
	$("#SteadyStates")
		.append(row);
}

/*
 * every time, the statespace is updated, check if
 * a new state combination has occured
 */
updateSteadyStates = function() {
	var currentStateCombination = [];
	var i;
	for (i in networkInputNodes) {
		currentStateCombination.push( network.state[networkInputNodes[i]] );
	}
	for (i in networkOutputNodes) {
		currentStateCombination.push( network.state[networkOutputNodes[i]] );
	}
	if (encounteredStateCombinations.indexOf(currentStateCombination) < 0) {
		appendSteadyStatesTable(currentStateCombination);
		encounteredStateCombinations.push(currentStateCombination);
	}
}

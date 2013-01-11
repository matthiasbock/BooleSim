var SteadyStatesNodes = [];
var encounteredStateCombinations = [];

/*
 * create an empty table in the SteadyStates tab
 */
createSteadyStates = function() {

	SteadyStatesNodes = [
					"oxygen",
					"glucose",
					"glycerol",
					"nitrogen",
					"rapamycin",
					"autophagy",
					"basal_mitophagy",
					"elevated_mitophagy"
				];
	
	var SteadyStates = "<tr><th colspan="+SteadyStatesNodes.length+">encountered steady-state node state combinations</th></tr>";
	SteadyStates += "<tr>";
	var i;
	for (i in SteadyStatesNodes) {
		SteadyStates += "<td>"+SteadyStatesNodes[i]+"</td>";
	}
	SteadyStates += "</tr>\n";

	// set content of SteadyStates <table>
	$("#SteadyStates")
		.html(SteadyStates);
}

appendSteadyStatesTable = function(states) {
	var row = "<tr>";
	var i;
	for (i in states) {
		var state = "off";
		var color = "white";
		if (states[i]) {
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
	for (i in SteadyStatesNodes) {
		currentStateCombination.push( network.state[SteadyStatesNodes[i]] );
	}
	if (encounteredStateCombinations.indexOf(currentStateCombination) < 0) {
		appendSteadyStatesTable(currentStateCombination);
		encounteredStateCombinations.push(currentStateCombination);
	}
}

var heatmapNodes = [];
var encounteredStateCombinations = [];

/*
 * create an empty table in the Heatmap tab
 */
createHeatmap = function() {

	heatmapNodes = [
					"oxygen",
					"glucose",
					"glycerol",
					"nitrogen",
					"rapamycin",
					"autophagy",
					"basal_mitophagy",
					"elevated_mitophagy"
				];
	
	var heatmap = "<tr><th colspan="+heatmapNodes.length+">encountered steady-state node state combinations</th></tr>";
	heatmap += "<tr>";
	var i;
	for (i in heatmapNodes) {
		heatmap += "<td>"+heatmapNodes[i]+"</td>";
	}
	heatmap += "</tr>\n";

	// set content of Heatmap <table>
	$("#Heatmap")
		.html(heatmap);
}

appendHeatmapTable = function(states) {
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
	
	$("#Heatmap")
		.append(row);
}

/*
 * every time, the statespace is updated, check if
 * a new state combination has occured
 */
updateHeatmap = function() {
	var currentStateCombination = [];
	var i;
	for (i in heatmapNodes) {
		currentStateCombination.push( network.state[heatmapNodes[i]] );
	}
	if (encounteredStateCombinations.indexOf(currentStateCombination) < 0) {
		appendHeatmapTable(currentStateCombination);
		encounteredStateCombinations.push(currentStateCombination);
	}
}

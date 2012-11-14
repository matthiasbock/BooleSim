
function jSBGN_to_d3(network) {
	var i;
	for (i in network.nodes) {
		n = network.nodes[i];
		n.index = i;
		n.x = 10;
		n.y = 10;
		n.px = 1;
		n.py = 1;
		n.fixed = false;
		n.weight = 1;
		}

	function getNodeById(id) {
		console.log(id);
		var i;
		for (i in network.nodes) {
			if (network.nodes[i].id == id || network.nodes[i] == id) {
//				console.log(i+': '+network.nodes[i].id);
				return network.nodes[i];
				}
			}
		console.error('node '+id+' not found. created.');
		return network.nodes.append( {'index':network.nodes.length, 'x':1, 'y':1, 'fixed':false} );
		}

	//
	// d3 expects edge source and targets specified as object links, rather than ids or indices
	//
	var i;
	for (i in network.edges) {
		network.edges[i].sourceNode = getNodeById(network.edges[i].source);
		network.edges[i].targetNode = getNodeById(network.edges[i].target);
		console.log('edge '+i+' from '+network.edges[i].sourceNode.id+' to '+network.edges[i].targetNode.id);
		}

	return network;
	}

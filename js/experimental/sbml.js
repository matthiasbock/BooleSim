/** 
 * Import an SBML file into the jSBGN object. The libSBGN.js library is
 * used as the initial importer. All the compartment and process nodes
 * are disabled.
 * @param {File} file The file object of the SBML file.
 * @param {string} data The data contained in the SBML file.
 */
jSBGN.prototype.importSBML = function (file, data) {

    // File submitted to server using a form
    var formData = new FormData();
    formData.append('file', file);

    /*
	// The SBML File is uploaded to the server so that it can be opened by
	// libscopes which runs on the server 
	$.ajax({
		url: serverURL + '/Put/UploadSBML',
		type: 'POST',
		data: formData,
		contentType: false,
		processData: false,
		async: false
	});
*/

    // Use libSBGN.js's SBML reader
    var reader = new sb.io.SbmlReader();
    var doc = reader.parseText(data);
    var jsbgn = JSON.parse(sb.io.write(doc, 'jsbgn'));

    this.nodes = jsbgn.nodes;
    this.edges = jsbgn.edges;
    this.rules = {};

    // Disable rules for nodes that are of type compartment or process
    var i, node;
    for (i in this.nodes) {
        node = this.nodes[i];
        node.data.label = node.id;
        if ((node.sbo === sb.sbo.NodeTypeMapping[sb.NodeType.Compartment]) || (node.sbo === sb.sbo.NodeTypeMapping[sb.NodeType.Process])) this.rules[node.id] = '';
        else this.rules[node.id] = 'update';
    }
};

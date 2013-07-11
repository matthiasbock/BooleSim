var serverURL;
/**
 * Representation of Graphs using nodes and edges arrays. Used as
 * a placeholder for importing graphs into biographer-ui. Look up
 * on the biographer wiki on the format specification.
 * @constructor
 */
var jSBGN = function () {
    this.nodes = [];
    this.edges = [];
    this.state = {};
};

/**
 * Substitutes the node id's in source and target properties
 * of edges with the actual node objects, as required for the d3
 * layouter.
 * @param {boolean} truth Whether the nodes should be connected or not
 */
jSBGN.prototype.connectNodes = function (truth) {
    var i, j;
    for (i in this.edges) {
        if (truth) {
            for (j in this.nodes) {
                if (this.edges[i].source == this.nodes[j].id)
                    this.edges[i].source = this.nodes[j];
                if (this.edges[i].target == this.nodes[j].id)
                    this.edges[i].target = this.nodes[j];
            }
        } else {
            this.edges[i].source = this.edges[i].source.id;
            this.edges[i].target = this.edges[i].target.id;
        }
    }
};

/**
 * Customised d3 force layouter. The d3 layouter is called synchronously.
 * The layout is calculated till the alpha value drops below a certain
 * threshold.
 * @param {bui.Graph} graph The bui graph instance.
 */
jSBGN.prototype.layoutGraph = function (graph) {
    // Give a canvas to the d3 layouter with the dimensions of the window
    var ratio = $(window).width() / $(window).height();
    var width = 1e6;
    var height = width / ratio;

    var layouter = d3.layout.force()
    // Charge is proportional to the size of the label
    .charge(function (node) {
        var size = 0;
        if (typeof (node.data.label) !== 'undefined') size = node.id.length;
        return -2000 - 500 * size;
    })
    // Link distance depends on two factors: The length of the labels of 
    // the source and target and the number of nodes connected to the source 
    .linkDistance(function (edge) {
        var size = 0;
        if (typeof (edge.source.data.label) !== 'undefined') size = edge.source.id.length + edge.target.id.length;
        return 100 + 30 * (edge.source.weight) + 5 * size;
    })
        .linkStrength(1)
        .gravity(0.1)
        .nodes(this.nodes)
        .links(this.edges)
        .size([width, height]);
    // Run the d3 layouter synchronously, alpha cut-off 0.005

    layouter.start();
    while (layouter.alpha() > 0.005)
        layouter.tick();
    layouter.stop();

    // Copy the layout data from d3 to jSBGN format
    var node, i;
    for (i = 0; i < this.nodes.length; i++) {
        node = this.nodes[i];
        node.data.x = node.x;
        node.data.y = node.y;
    }
};


/** 
 * Import a Boolean Net file(R/Python) into the jSBGN object. These
 * files are quite simple with each line containing an update rule. By
 * parsing this line the connections between nodes are made.
 * @param {string} data The data contained in the Boolean Net file.
 * @param {string} splitKey The character separating the LHS and RHS of
 * a update rule.
 */
jSBGN.prototype.importBooleanNetwork = function (data, splitKey, reImport) {

    var targetNode, sourceNode;
    var targetID, sourceID, edgeID;
    var rules = {}, ruleIDs, rule, right = [], left = [];

    var doc = new sb.Document();
    doc.lang(sb.Language.AF);

    // The file consists of multiple lines with each line representing 
    // the update rule for a node
    var lines, cols, i, j, trimmed;
    lines = data.split('\n');
    console.log('Importing Boolean network from ' + lines.length + ' lines of text ...');
    for (i = 0; i < lines.length; i++) {
        trimmed = lines[i].trim();
        // Skip empty lines
        if (trimmed.length === 0) continue;
        if (trimmed[0] != '#') {
            // Extract the columns using the split key which is different
            // for R and Python Boolean Net
            cols = trimmed.split(splitKey);
            if (cols.length != 2) {
                console.error('Syntax error: An update rule must have exactly two sides; line ' + i + ': "' + trimmed + '"');
                return false;
            }

            targetID = cols[0].trim();
            if (!reImport) {
                if (splitKey === ',') {
                    if (targetID === 'targets') continue;
                } else {
                    if (targetID[targetID.length - 1] === '*') {
                        targetID = targetID.substring(0, targetID.length - 1);
                    } else {
                        if ($('#seedFile').attr('checked')) {
                            rule = cols[cols.length - 1].trim();
                            for (j = 0; j < cols.length - 1; j++) {
                                targetID = cols[j].trim();
                                if (rule === 'True') this.state[targetID] = true;
                                else if (rule === 'False') this.state[targetID] = false;
                                else this.state[targetID] = controls.getRandomSeed();
                            }
                        }
                        continue;
                    }
                    cols[1] = cols[1].replace(/False/g, 'false');
                    cols[1] = cols[1].replace(/True/g, 'true');
                }
                // Replace R/Python's logical operators with JS logical operators.
                rule = cols[1].replace(/[&]/g, ' && ').replace(/[|]/g, ' || ')
                    .replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!')
                    .replace(/ +/g, ' ')
                    .trim();
            } else {
                rule = cols[1].trim();
            }

            var check = targetID.match(/[A-Za-z0-9_]+/g);

            if (check[0] !== targetID) {
                console.error('Syntax error: Bogus target ID; line ' + i + ': "' + trimmed + '"');
                return false;
            }

            // Create the node if it does not exist
            if (doc.node(targetID) === null) {
                targetNode = doc.createNode(targetID).type(sb.NodeType.Macromolecule).label(targetID);
            }

            // assign rules (right side equation) to array of nodes (left side of equation)
            rules[targetID] = rule;
            if (rule === '') {
                rules[targetID] = 'true';
                continue;
            }
            if (rule === 'true' || rule === 'false') continue;

            // Extract all the node id's in the update rule
            ruleIDs = rules[targetID].match(/[A-Za-z0-9_]+/g);
            right = $.unique($.merge(right, ruleIDs));
            left.push(targetID);

            for (j in ruleIDs) {
                sourceID = ruleIDs[j];
                if ((sourceID.toLowerCase() == 'true') || (sourceID.toLowerCase() == 'false')) continue;

                // Create the node if it does not exist
                if (doc.node(sourceID) === null) {
                    sourceNode = doc.createNode(sourceID).type(sb.NodeType.Macromolecule).label(sourceID);
                }
                // Connect the source and target and create the edge
                edgeID = sourceID + ' -> ' + targetID;
                if (doc.arc(edgeID) === null) {
                    re = new RegExp('![ ]*' + sourceID, 'g');
                    var matches = rule.match(re);
                    if (matches !== null)
                        doc.createArc(edgeID).type(sb.ArcType.Inhibition).source(sourceID).target(targetID);
                    else
                        doc.createArc(edgeID).type(sb.ArcType.Production).source(sourceID).target(targetID);
                }
            }
        }
    }
    var jsbgn = JSON.parse(sb.io.write(doc, 'jsbgn'));
    this.nodes = jsbgn.nodes;
    this.edges = jsbgn.edges;
    this.rules = rules;
    this.right = right;
    this.left = left;

    return true;
};


/** 
 * Import a GINML file into the jSBGN object. The jQuery XML library
 * makes parsing simple. By just passing a tag, all the respective
 * elements can be selected.
 * @param {string} data The data contained in the GINML file.
 */
jSBGN.prototype.importGINML = function (data) {

    // Use jQuery's XML parser
    var xml;
    try {
        xml = $.parseXML(data);
    } catch (e) {
        return false;
    }
    var nodes = $(xml).find('node');
    var edges = $(xml).find('edge');

    // Set the SBGN language to Activity Flow
    var doc = new sb.Document();
    doc.lang(sb.Language.AF);

    // Extract all nodes in the XML file
    $(nodes).each(function () {
        var id = $(this).attr('id');
        doc.createNode(id).type(sb.NodeType.Macromolecule).label(id);
    });

    // Extract all edges taking care of the sign
    $(edges).each(function () {
        var sign = $(this).attr('sign'),
            type;
        var id = $(this).attr('id');

        if (typeof (sign) !== 'undefined') {
            if (sign === 'positive') type = sb.ArcType.PositiveInfluence;
            else if (sign === 'negative') type = sb.ArcType.NegativeInfluence;
        } else type = sb.ArcType.UnknownInfluence;
        doc.createArc(id).type(type).source($(this).attr('from')).target($(this).attr('to'));
    });

    // Generate rules from the GINML file
    // There are two types of rules, the rule defined by the connecting
    // arcs and the other rule defined by the parameter tag for each node.
    var rules = {};
    $(nodes).each(function () {
        var i, rule;
        var arcs = doc.arcs(),
            incoming;
        var id = $(this).attr('id');
        incoming = [];
        // Create the rule given by the edges
        rule = '';
        for (i in arcs) {
            if (arcs[i].target().id() === id) {
            	if ( rule.length > 0 )
            		rule += ' || ';
                rule += arcs[i].source().id();
                incoming.push(arcs[i].id());
            }
        }
        rules[id] = '(' + Boolean(parseInt($(this).attr('basevalue'), 10)) +
            ' && !(' + rule + ')) || ((' + rule + ') && (false';

        // Add rules derived from the Active Interations for a node.
        $(this).find('parameter').each(function () {
            var i, links;
            links = $(this).attr('idActiveInteractions').split(' ');
            incoming = incoming.filter(function (i) {
                return links.indexOf(i) < 0;
            });

            rule = '';
            for (i in links){
            	if ( rule.length > 0 )
            		rule += ' && ';
                rule += doc.arc(links[i]).source().id();            	
            }
            for (i in incoming) {
            	if ( rule.length > 0 )
            		rule += ' && ';
                rule += '(!' + doc.arc(incoming[i]).source().id() + ')';
            }

            rules[id] += ' || (' + rule + ')';
        });

        rules[id] += '))';
        rules[id] = rules[id].replace(/true && /g, '');
        rules[id] = rules[id].replace(/false \|\| /g, '');
    });

    // Export the SBGN to jSBGN
    var jsbgn = JSON.parse(sb.io.write(doc, 'jsbgn'));
    this.nodes = jsbgn.nodes;
    this.edges = jsbgn.edges;
    this.rules = rules;
    this.right = Object.keys(rules);
    this.left = Object.keys(rules);

    return true;
};


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

jSBGN.prototype.importjSBGN = function (data) {

    var jsbgn;
    try {
        jsbgn = JSON.parse(data);
    } catch (e) {
        console.error("JSON parser raised an exception: "+e);
        return false;
    }

    this.nodes = jsbgn.nodes;
    this.edges = jsbgn.edges;
    this.rules = jsbgn.rules;

    left = [];
    right = [];
    for (i in this.rules) {
        if (this.rules[i] !== i) {
            var ruleIDs = this.rules[i].match(/[A-Za-z0-9_]+/g);
            right = $.unique($.merge(right, ruleIDs));
            left.push(i);
        }
    }
    this.right = right;
    this.left = left;

    return true;
};

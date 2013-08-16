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
        rule1 = '';
        for (i in arcs) {
            if (arcs[i].target().id() === id) {
            	if ( rule1.length > 0 )
            		rule1 += ' || ';
                rule1 += arcs[i].source().id();
                incoming.push(arcs[i].id());
            }
        }
        // Add rules derived from the Active Interations for a node.'
        rule2 = 'false';
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

            rule2 += ' || (' + rule + ')';
        });
        
        var base = Boolean(parseInt($(this).attr('basevalue'), 10));
        if (rule1.length > 0) {
            if (base) {
                rules[id] = '!(' + rule1 + ') || ';
            }
            else {
                rules[id] = '';
            }
            if (rule2 == 'false') {
                rules[id] += rule2;
            }
            else {
                rules[id] += '((' + rule1 + ') && (' + rule2 + '))';   
            }
        }
        else {
            rules[id] = rule2;
        }
        rules[id] = rules[id].replace(/false \|\| /g, '');
        rules[id] = rules[id].replace(/ \|\| false/g, '');
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
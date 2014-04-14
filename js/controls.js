
var controls, simulator = null;
var networkGraph = null;
var transitionGraph = null;
var prevTab = 2;
rulesChanged = false;

$(document).ready(function () {
    // Load up the UI
    controls = new Controls();
    controls.initialize();
});

/**
 * The Controls class hosts all the variables related to the UI, the
 * event handlers for the various jQuery UI components and additional
 * functions to fetch scripts and import networks into graphs.
 * @constructor
 */
var Controls = function () {
    
    // Private variables to hold the bui.Graph instances
    var obj = this;
    
    /**
     * initialize all the UI components and fetch the extra js files. The
     * UI consists of buttons, dialog boxes, a slider and a tab interface.
     */
    this.initialize = function () {
        
        // Load the jQuery UI tabs
        $('#tabs').tabs();
        $('#tabs').tabs('select', '#tabNetwork');
        $('#tabs').bind('tabsshow', changeTab);
        
        // initialize all the jQuery UI components
        $('.legendTrue').css('background-color', yellow);
        $('.legendFalse').css('background-color', blue); 
        
        $('#buttonCreate')
            .button({
                        icons: {
                            primary: "ui-icon-star"
                        }
                    })
            .click(createDefaultNetwork);

        $('#buttonInitialCreate')
            .button({
                        icons: {
                            primary: "ui-icon-star"
                        }
                    })
            .click(createDefaultNetwork);
        
        // the corresponding .click function is reloadUpdateRules
        // which is set in editrule.js
        $('#buttonSaveRules')
            .button({
                        icons: {
                            primary: "ui-icon-check"
                        }
                    });
        $('#buttonDiscardChanges')
            .button({
                        icons: {
                            primary: "ui-icon-trash"
                        }
                    });

        $('#buttonSimulate').button({
                                icons: {
                                    primary: "ui-icon-play"
                                }
                            });
        
        $('#buttonResetTime')
            .button( {icons: {primary: "ui-icon-seek-first"}} )
            .click(function () { resetTimeseries(); });

        $( "#divNetworkLegend" )
            .draggable({ containment: "#tabNetwork", scroll: false });
        $('#buttonResetStates')
            .button( {icons: {primary: "ui-icon-arrowreturnthick-1-w"}} );
        $('#buttonAllTrue')
            .button( {icons: {primary: "ui-icon-arrowthick-1-n"}} );
        $('#buttonAllFalse')
            .button( {icons: {primary: "ui-icon-arrowthick-1-s"}} );

        $('#dialogAddNode').dialog({
            autoOpen: false,
            minWidth: 200,
            modal: true
        });
        $('#buttonAddNodeCancel').click(function () {
            $('#dialogAddNode').dialog('close');
        });
        
        $('#dialogDeleteNode').dialog({
            autoOpen: false,
            minWidth: 300,
            minHeight: 80,
            resizable: false,
            modal: true
        });
        $('#buttonDeleteNodeNo').click(function () {
            $('#dialogDeleteNode').dialog('close');
        });

        $('#dialogImport').dialog({
            autoOpen: false,
            minWidth: 450,
            resizable: false,
            modal: true
        });
        $('#buttonImportDialog').button({
            icons: {
                primary: "ui-icon-folder-open"
            }
        }).click(openImportDialog);
        $('#buttonImportFile').click(importFile);
        $('#buttonImportCancel').click(function () {
            $('#dialogImport').dialog('close');
        });

        $('#buttonDemo1').click(importDemo1);
        $('#buttonDemo2').click(importDemo2);

        $('#dialogExport').dialog({
            autoOpen: false,
            minWidth: 400,
            modal: true
        });
        $('#buttonExportDialog').button({
            icons: {
                primary: "ui-icon-disk"
            }
        }).click(openExportDialog);
        $('#buttonExportFile').click(exportFile);
        $('#buttonExportCancel').click(function () {
            $('#dialogExport').dialog('close');
        });

        $('#dialogPreferences').dialog({
            autoOpen: false,
            minWidth: 520,
            resizable: false,
            modal: true,
            buttons: {
                Ok: function() {
                    $(this).dialog('close');
                }
            }
        });
        $('#buttonPreferences').button({
            icons: {
                primary: "ui-icon-wrench"
            }
        }).click(function () {
            $('#dialogPreferences').dialog('open');
        });

        $('#dialogHelp').dialog({
            autoOpen: false,
            minWidth: 650,
            resizable: false,
            modal: false
        });
        $('#buttonHelp').button({
            icons: {
                primary: "ui-icon-help"
            }
        }).click(function () {
            $('#dialogHelp').dialog('open');
        });
        $('#buttonHelpClose').click(function () {
            $('#dialogHelp').dialog('close');
        });

        $('#dialogConfirm').dialog({
            autoOpen: false,
            minWidth: 400,
            resizable: false,
            modal: true
        });
        $('#buttonConfirmExport').click(function () {
            $('#dialogConfirm').dialog('close');
            $('#dialogExport').dialog('open');
        });
        $('#buttonConfirmNo').click(function () {
            $('#dialogConfirm').dialog('close');
        });

        $('#buttonSimulate').click(function () {
            if (network == null || network == undefined || network == {}) {
                alert('You need to create or import a network before you can start simulation.');
                return;
            }
        });
        
        // load the additional JavaScripts
        loadAdditionalResources();
        
    };

    /** 
     * Fetch all the scripts not essential to UI asynchronously. All the
     * external libraries excluding the jquery core are fetched using this
     * method in addition to import and simulator js files.
     */
    var loadAdditionalResources = function () {
        // Ensure that the files are fetched as JS.
        $.ajaxSetup({
            cache: true,
            beforeSend: function (xhr) {
                xhr.overrideMimeType("text/javascript");
            }
        });

        $.getScript("include/jquery.simulate.js");
        $.getScript("include/jquery.color-2.1.1.min.js", function () {
            jQuery.Color.hook("fill stroke");
        });
        $.getScript("include/biographer-ui.js", function () {
            bui.settings.css.stylesheetUrl = 'css/visualization-svg.css';
        });
        $.getScript("include/interact.js");
        $.getScript("include/d3.v2.js");
        //$.getScript("include/rickshaw.js");
        $.getScript("include/libSBGN.js");

        $.getScript("js/import.js");
        $.getScript("js/export.js");
        $.getScript("js/infobox.js");
        $.getScript("js/editrule.js");
        $.getScript("js/timeseries.js");
        //$.getScript("js/attractors.js");
        $.getScript("js/steadystates.js");
        $.getScript("js/simulator.js");
        //$.getScript("js/spellchecker.js");

        $.ajaxSetup({
            beforeSend: null
        });
    };

    /** 
     * The event handler for a change in the value of the Graph Zoom slider.
     * A corresponding scale is applied to the selected graph tab.
     * @param {Event} event The event object containing information about the
     * type of event.
     * @param {UI} ui Contains the value of the slider.
     */
    zoomGraph = function (event, ui) {
        // Get the index of the selected tab.
        var index = $('#tabs').tabs('option', 'selected');
        var graph = null;

        // Get the correct bui.Graph instance depending on the current tab.
        if (index === 0) graph = networkGraph;
        // Exit if the graph has not been imported yet
        if (graph === null) return;
        // Scale the bui graph to the value set by the slider
        graph.scale(ui.value);
        graph.reduceTopLeftWhitespace();
    };

    /** 
     * The event handler for a tab change. It just sets the slider value
     * for the current tab graph.
     * @param {Event} event The event object containing information about the
     * type of event.
     * @param {UI} ui Contains the index of the selected tab.
     */
    changeTab = function (event, ui) {
        // select 1: Rules tab
        if (ui.index == 0 && network != null)
            $('#divNetworkLegend').css('visibility', 'visible');
        else
            $('#divNetworkLegend').css('visibility', 'hidden');
        if (ui.index == 1)
            $('#textRules').focus();

        prevTab = ui.index;
    };

    createDefaultNetwork = function () {
        plaintextImporter('demoNode* = not demoNode\n', false);
    };

    /** 
     * The event handler for opening the import dialog box. All the elements
     * are given a default value
     */
    openImportDialog = function () {
        // If the simulator is running stop it.
        if (simulator !== null) simulator.stop();

        // Set all values to their initial states.
        $('#fileNetwork').attr({
            value: ''
        });
        $('#dialogImport').dialog('open');
    };

    plaintextImporter = function (data, confirmed) {
        // Depending on the file type option checked in the import dialog box
        // call the appropriate importer
        
        // if a network is loaded already, confirm overwrite first
        if ((!confirmed) && (networkGraph !== null)) {
//            $('#buttonConfirmYes').unbind('click');
            $('#buttonConfirmYes').click(function () {
                $('#buttonConfirmYes').unbind('click');
                $('#dialogConfirm').dialog('close');
                plaintextImporter(data, true);
            });
            $('#dialogConfirm').dialog('open');
            return;
        }

        var guessed = 'unrecognized';
        var jsbgn = new jSBGN();

        if ($('#formatGuess').attr('checked')) {
            if (data.indexOf(' and ') + data.indexOf(' or ') + data.indexOf('*') > -1)
                guessed = 'Python';
            else if (data.indexOf(' & ') + data.indexOf(' | ') > -1)
                guessed = 'R';
            else if ((data.indexOf(' && ') + data.indexOf(' || ') > -1) || (data.indexOf('"sbgnlang"') > -1))
                guessed = 'jSBGN';
/*            else if (data.indexOf('<gxl') > -1)
                guessed = 'GINML'; */
            else {
                console.log('Import aborted: Inferring file format did not succeed.');
                alert('Sorry,\nthe format of your file could not be inferred.\nPlease try specifying it manually in the import dialog.');
                return;
            }
            console.log('Inferred file format: ' + guessed);
        }
        var result;
        var doLayout = true;

        if ($('#formatPyBooleanNet').attr('checked') || guessed == 'Python')
            result = jsbgn.importBooleanNetwork(data, '=', false);
        else if ($('#formatRBoolNet').attr('checked') || guessed == 'R')
            result = jsbgn.importBooleanNetwork(data, ',', false);
/*        else if ($('#formatGINML').attr('checked') || guessed == 'GINML')
            result = jsbgn.importGINML(data); */
        else if ($('#formatjSBGN').attr('checked') || guessed == 'jSBGN') {
            result = jsbgn.importjSBGN(data);
            doLayout = false;
        } else {
            console.log('Import failed: Unrecognized file format');
            alert('Import failed: Unrecognized file format');
            return;
        }

        if (!result) {
            console.log('Import failed: There appear to be syntax errors in the input file.');
            alert('Import failed: There appear to be syntax errors in your input file.');
            return;
        }

        /*
         * Steady states:
         * Identify input/output states
         */ 
        identifyIONodes(jsbgn.left, jsbgn.right);

        jsbgn.model = data;

        //$('#graphStateTransition').html('');
        // Import the jSBGN object into a bui.Graph instance
        obj.importNetwork(jsbgn, '#tabNetwork', doLayout);
        $('#tabNetwork').bind('contextmenu', addNodeDialog);
        $('#textRules').prop('disabled', false);
        $('#textIteration').text(timeseriesLabelCounter);

        // Delete any previous instance of the Simulator and initialize a new one
        //if (simulator !== null) simulator.destroy();
        //simulator = new Simulator();
        destroySimulator();

        // if ($('#formatSBML').attr('checked')) simulator.scopes = true;

        var settings = {
            simDelay: simDelay,
            oneClick: typeof ($('#optionsOneClick').attr('checked')) !== "undefined"
        };
        initializeSimulator(jsbgn, settings, networkGraph);

        loadRulesText();
        rulesChanged = false;
        $('.spellcheckWarning').remove();

        highlightIONodes();

        if (typeof ($('#optionsSimulateAfterImport').attr('checked')) !== "undefined")
            startSimulator();
    };


    /** 
     * The event handler for the import file button in the import file dialog
     * box. The file is read using the appropriate boolean network importer.
     * The simulator is then initialized using this network.
     */
    importFile = function () {
        // import file
        var files = $('#fileNetwork')[0].files;
        if (files.length === 0) {
            alert('Please choose a file to be imported.');
            return;
        }
        var file = files[0];

        // close import dialog
        $('#dialogImport').dialog('close');

        // Create an instance of the file reader and jSBGN.
        var reader = new FileReader();

        // This event handler is called when the file reading task is complete
        reader.onload = function (read) {
            // Get the data contained in the file
            plaintextImporter(read.target.result, false);
        };
        reader.readAsText(file);
    };

    importDemo1 = function () {
        // close import dialog
        $('#dialogImport').dialog('close');

        setTimeout(function () {
            plaintextImporter($('#demoNetwork1').html(), false);
        }, 200);
    };

    importDemo2 = function () {
        // close import dialog
        $('#dialogImport').dialog('close');

        setTimeout(function () {
            plaintextImporter($('#demoNetwork2').html(), false);
        }, 200);
    };

    /** 
     * Import a jSBGN object into the Network tab by creating a new bui.Graph
     * instance. First the layouting is done and then the graph is scaled
     * appropriately.
     * @param {jSBGN} jsbgn The network in the form of a jSBGN object.
     * @param {string} tab The tab in which to display the graph.
     * @returns {bui.Graph} The graph for the network.
     */
    this.importNetwork = function (jsbgn, tab, doLayout) {

        // only invoke d3 layouting, if doLayout was not specified or if it's true
        if (typeof doLayout == 'undefined' || doLayout) {
            // Do the layouting
            jsbgn.connectNodes(true);
            jsbgn.layoutGraph();
            jsbgn.connectNodes(false);
        }

        // Fix Self-loop edges
        for (i in jsbgn.edges) {
            var edge = jsbgn.edges[i];
            if (edge.source == edge.target) {
                edge.data.type = 'spline';
                edge.data.handles = [{
                    "x": 80.25,
                    "y": -136
                }, {
                    "x": -92.25,
                    "y": -119
                }];
            }
        }

        $(tab).html('');
        var graph = new bui.Graph($(tab)[0]);
        var handle = graph.suspendRedraw(20000);
        bui.importFromJSON(graph, jsbgn);

        // Center the graph and optionally scale it
        graph.reduceTopLeftWhitespace();
        if (typeof ($('#optionsScale').attr('checked')) !== "undefined")
            graph.fitToPage();
        graph.unsuspendRedraw(handle);
        
//        $('#sliderZoom').slider('option', 'value', graph.scale());
        $('#tabs').tabs('select', tab);
        $('#divNetworkLegend').css('visibility', 'visible');

        if (tab === '#graphStateTransition') transitionGraph = graph;
        else networkGraph = graph;
        
    };

    this.getRandomSeed = function () {
        return Boolean(Math.round(Math.random()));
    };

    /** 
     * Get the seed to be given initially to the network.
     * @returns {Boolean} The seed for the node in the network.
     */
    this.getInitialSeed = function () {
        if ($('#seedTrue').attr('checked')) return true;
        else if ($('#seedFalse').attr('checked')) return false;
        else if ($('#seedRandom').attr('checked')) return this.getRandomSeed();
        else return true;
    };

    /** 
     * The event handler for opening the export dialog. The simulator is
     * stopped if it's running.
     */
    openExportDialog = function () {
        if (network == null || network == undefined || network == {}) {
            alert('You need to create or import a network, before you can export it.');
            return;
        }

        if (simulator !== null) simulator.stop();
        $('#dialogExport').dialog('open');
    };

    var addNode = function (id, coords) {
        //Add node to the jSBGN
        var doc = new sb.Document();
        doc.lang(sb.Language.AF);
        doc.createNode(id).type(sb.NodeType.Macromolecule).label(id);
        var jsbgn = JSON.parse(sb.io.write(doc, 'jsbgn'));
        network.nodes.push(jsbgn.nodes[0]);

        network.state[id] = controls.getInitialSeed();
        network.freeze[id] = false;
        ruleFunctions[id] = rule2function(id, network.rules[id]);
        for (var j = 0; j <= iterationCounter; j++)
            states[j][id] = network.state[id];

        //Add node physically to the graph
        var node = networkGraph.add(bui.Macromolecule, id);
        node.label(id);

        var drawables = networkGraph.drawables();
        updateGraphNode(drawables, id);
        drawables[id].positionCenter(coords.x, coords.y);

        updateTimeseries();
    };

    var deleteNode = function (id) {
        //delete node from jSBGN
        delete network.state[id];
        delete network.freeze[id];
        delete ruleFunctions[id];
        delete network.rules[id];

        //delete node from other node's rules
        for (i in network.rules) {
            var rule = network.rules[i];
            rule = rule.replace(/ /g, '');
            var re = new RegExp('[&|]+!*' + id, 'g');
            rule = rule.replace(re, '');
            re = new RegExp('\\(' + id + '[&|]*', 'g');
            rule = rule.replace(re, '');
            var matches = rule.match(/\(!*[A-Za-z0-9_]+\)/g);
            for (j in matches) {
                rule = rule.replace(matches[j], matches[j].slice(1, matches[j].length - 1));
            }
            network.rules[i] = rule;
            ruleFunctions[i] = rule2function(i, rule);
        }

        //delete node from nodes, edges, left, right
        for (i in network.nodes) {
            var node = network.nodes[i];
            if (node.id == id) {
                network.nodes.splice(i, 1);
                break;
            }
        }
        for (i in network.edges) {
            var edge = network.edges[i];
            if ((edge.source == id) || (edge.target == id)) {
                network.edges.splice(i, 1);
            }
        }
        for (i in network.left) {
            var node = network.left[i];
            if (node == id) {
                network.left.splice(i, 1);
                break;
            }
        }
        for (i in network.right) {
            var node = network.right[i];
            if (node == id) {
                network.right.splice(i, 1);
                break;
            }
        }

        for (var j = 0; j <= iterationCounter; j++)
            delete states[j][id];

        //delete node from graph
        var drawables = networkGraph.drawables();
        drawables[id].remove();

        updateTimeseries();
        //~ identifyIONodes(network.left, network.right);
        //~ highlightIONodes();
        //~ createSteadyStates();
    };

    this.deleteNodeFromGraph = function (event) {
        var id = event.data;
        deleteNode(id);
        $('#dialogDeleteNode').dialog('close');
    };

    addNodeDialog = function (event) {
        if (running) {
            alert('You need to stop simulation before you can add nodes.');
            event.preventDefault();
            return;
        }

        if (event.ctrlKey) {
            event.preventDefault();
            $('#dialogAddNode').dialog('open');
            $('#textNodeID').val('');
            $('#buttonAddNode').unbind('click');
            $('#buttonAddNode').bind('click',
                networkGraph.toGraphCoords(event.clientX, event.clientY - $('#tabs > ul').height()),
                addNodeToGraph);
        }
    };

    addNodeToGraph = function (event) {
        var id = $('#textNodeID').val();
        if (network.state.hasOwnProperty(id)) {
            alert('A node with that name already exists.\nPlease choose a new name.');
        } else if (id.match(/[A-Za-z0-9_]/g).length !== id.length) {
            alert('Illegal character in name!\nOnly alphanumeric characters and underscore are allowed.');
        } else {
            addNode(id, event.data);
        }
        $('#dialogAddNode').dialog('close');
    };

    /** 
     * The event handler for clicking the export file button of the export
     * file dialog box. Multiple file export options are supported, if
     * a graph is exported then a file is created of the specified graph
     * type. If the update rules are exported then the respective boolean
     * network file is generated. The link is passed as a data URI.
     */
    exportFile = function () {
        // close the dialog and start to do the export
        $('#dialogExport').dialog('close');

        // Get the bui.Graph instance of the select graph to export
        var graph, bn, content, jsbgn;
        graph = networkGraph;

        // export R
        if ($('#exportNetworkRBoolNet').attr('checked')) {
            bn = exportRBoolNet(network);
            content = "data:text/plain," + encodeURIComponent(bn);
            window.open(content, 'tmp');
        } else

        // export Python
        if ($('#exportNetworkPyBooleanNet').attr('checked')) {
            bn = exportPythonBooleanNet(network);
            content = "data:text/plain," + encodeURIComponent(bn);
            window.open(content, 'tmp');
        } else

        // export jSBGN
        if ($('#exportjSBGN').attr('checked')) {
            jsbgn = graph.toJSON();
            jsbgn = $.extend(jsbgn, {
                rules: network.rules
            });
            content = "data:application/json," + encodeURIComponent(JSON.stringify(jsbgn));
            window.open(content, 'tmp');
        } else

        // export SVG
        if ($('#exportSVG').attr('checked')) {
            var svg = graph.rawSVG();
            content = "data:image/svg+xml," + encodeURIComponent(svg);
            window.open(content, 'tmp');
        }

        // export Time Series
        if ($('#exportTimeseries').attr('checked')) {
            $('#tabs').tabs('select', '#tabTimeseries');
            var svg = $('#divTimeseries > svg')[0].parentNode.innerHTML;
            content = "data:image/svg+xml," + encodeURIComponent(svg);
            window.open(content, 'tmp');
        }
    };
};
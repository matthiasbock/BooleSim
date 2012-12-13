var controls, simulator = null;

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
	var network = null,
		transition = null;
	var obj = this;

	/**
	 * initialize all the UI components and fetch the extra js files. The
	 * UI consists of buttons, dialog boxes, a slider and a tab interface.
	 */
	this.initialize = function () {
		// Load the jQuery UI tabs
		$('#tabs').tabs();
		$('#tabs').tabs('select', '#graphNetwork');
		$('#tabs').bind('tabsselect', changeTab);

		// initialize all the jQuery UI components
		/*$('#sliderZoom').slider({
			step: 0.1,
			max: 2,
			stop: zoomGraph
		});*/
		//$('#circleProgress').hide();
		
		// initialize jQuery UI buttons
		$('#buttonImportDialog').button({
			icons: {
				primary: "ui-icon-folder-open"
			}
		});
		$('#buttonExportDialog').button({
			icons: {
				primary: "ui-icon-disk"
			}
		});
		$('#buttonSimulate').button({
			icons: {
				primary: "ui-icon-play"
			}
		});
		$('#buttonHelp').button({
			icons: {
				primary: "ui-icon-help"
			}
		});
		/*$('#buttonAnalyse').button({
			icons: {
				primary: "ui-icon-gear"
			}
		});*/

		// initialize jQuery UI dialogs
		$('#dialogImport').dialog({
			autoOpen: false,
			minWidth: 450,
			modal: true
		});
		$('#dialogExport').dialog({
			autoOpen: false,
			minWidth: 400,
			modal: true
		});
		$('#dialogEdit').dialog({
			autoOpen: false,
			minWidth: 400,
			modal: true
		});

		// bind button event listeners
		$('#buttonImportDialog').click(openImportDialog);
		$('#buttonImportFile').click(importFile);
		$('#buttonImportDemo').click(importDemo);
		$('#buttonImportCancel').click(function () {
											$('#dialogImport').dialog('close');
											document.getElementById('Hourglass').style.visibility = 'hidden';
										});
		$('#buttonExportDialog').click(openExportDialog);
		$('#buttonExportFile').click(exportFile);
		$('#buttonExportCancel').click(function () {
											$('#dialogExport').dialog('close');
										});
		$('#buttonSimulate').click(function () {
										if ( network == null || network == undefined || network == {} ) {
											alert('You need to import a network, before you can simulate it.\n\nPlease click "Open", to do so.');
											return;
											}
										});


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

		$.getScript("lib/jquery.simulate.js");
		$.getScript("lib/biographer-ui.js", function () {
			bui.settings.css.stylesheetUrl = 'css/visualization-svg.css';
		});
		$.getScript("lib/interact.js");
		$.getScript("lib/d3.v2.min.js");
		$.getScript("lib/libSBGN.js");
		$.getScript("lib/rickshaw.js");

		$.getScript("js/import.js");
		$.getScript("js/simulator.js");
		
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
	var zoomGraph = function (event, ui) {
		// Get the index of the selected tab.
		var index = $('#tabs').tabs('option', 'selected');
		var graph = null;

		// Get the correct bui.Graph instance depending on the current tab.
		if (index === 0) graph = network;
		else if (index === 1) graph = transition;
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
	var changeTab = function (event, ui) {
		// Get the current tab index
		var graph = null;

		if (ui.index === 0) graph = network;
		else if (ui.index === 1) graph = transition;
		// Exit if the graph has not been imported yet
		if (graph === null) return;

		// Set the slider's value to the current graph's scale 
		$('#sliderZoom').slider('option', 'value', graph.scale());
	};

	/** 
	 * The event handler for opening the import dialog box. All the elements
	 * are given a default value
	 */
	var openImportDialog = function () {
		// If the simulator is running stop it.
		if (simulator !== null) simulator.stop();

		// show the hourglass behind the import dialog, such that it's already there when the browser window freezes on import
		document.getElementById('Hourglass').style.visibility = 'visible';

		// Set all values to their initial states.
		$('#fileNetwork').attr({
			value: ''
		});
		$('#dropFile span').html('Drag and Drop File');
		$('#dialogImport').dialog('open');
	};

	plaintextImporter = function (data) {
						// Depending on the file type option checked in the import dialog box
						// call the appropriate importer
						var guessed;
						var data, jsbgn = new jSBGN();
						if ($('#formatGuess').attr('checked')) {
									if ( data.indexOf(' and ') + data.indexOf(' or ') > -1 )
										guessed = 'Python';
									else if ( data.indexOf(' && ') + data.indexOf(' || ') > -1 )
										guessed = 'R';
									else if ( data.indexOf('<gxl') > -1 )
										guessed = 'GINML';
									else {
										alert('Sorry,\nthe format of your network file could not be detected.\nPlease try to specify it manually.\nThank you!');
										return;
										}
									console.log('Format not specified. Guessing: '+guessed);
									}
						if ($('#formatPyBooleanNet').attr('checked') || guessed == 'Python')
							jsbgn.importBooleanNetwork(data, '=');
						else if ($('#formatRBoolNet').attr('checked') || guessed == 'R')
							jsbgn.importBooleanNetwork(data, ',');
						else if ($('#formatGINML').attr('checked') || guessed == 'GINML' )
							jsbgn.importGINML(data);
						//else jsbgn.importSBML(file, data);

						//$('#graphStateTransition').html('');
						// Import the jSBGN object into a bui.Graph instance
						obj.importNetwork(jsbgn, '#graphNetwork');
						$('#tabs').tabs('select', '#graphNetwork');
						$('#textIteration').text(0);

						// Delete any previous instance of the Simulator and initialize a new one
						if (simulator !== null) simulator.destroy();

						simulator = new Simulator();

						// if ($('#formatSBML').attr('checked')) simulator.scopes = true;

						var settings = {
							simDelay: simDelay,
			//				guessSeed: $('#seedGuess').attr('checked'),
							oneClick: optionsSimulateAfterClick
						};
						simulator.initialize(jsbgn, settings);

						if (optionsSimulateAfterImport)
							simulator.start()
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
								plaintextImporter( read.target.result );
								};
		reader.readAsText(file);

		// make the hourglass disappear
		window.setTimeout( function() {
								document.getElementById('Hourglass').style.visibility = 'hidden';
								}, 1000
						);
	};

	importDemo = function() {
		// close import dialog
		$('#dialogImport').dialog('close');

		window.setTimeout( function() { plaintextImporter($('#demoNetwork').html()) }, 500 );

		// make the hourglass disappear
		window.setTimeout( function() {
								document.getElementById('Hourglass').style.visibility = 'hidden';
								}, 1000
						);
	}
	
	/** 
	 * Import a jSBGN object into the Network tab by creating a new bui.Graph
	 * instance. First the layouting is done and then the graph is scaled
	 * appropriately.
	 * @param {jSBGN} jsbgn The network in the form of a jSBGN object.
	 * @param {string} tab The tab in which to display the graph.
	 * @returns {bui.Graph} The graph for the network.
	 */
	this.importNetwork = function (jsbgn, tab) {
		$(tab).html('');
		var graph = new bui.Graph($(tab)[0]);

		var handle = graph.suspendRedraw(20000);
		bui.importFromJSON(graph, jsbgn);
		// Do the layouting
		jsbgn.connectNodes();
		jsbgn.layoutGraph(graph);
		jsbgn.redrawNodes(graph);

		// Center the graph and optionally scale it
		graph.reduceTopLeftWhitespace();
		if (optionsScaleGraphToWindow)
			graph.fitToPage();
		graph.unsuspendRedraw(handle);

		$('#sliderZoom').slider('option', 'value', graph.scale());
		$('#tabs').tabs('select', tab);

		if (tab === '#graphStateTransition') transition = graph;
		else network = graph;
	};

	/** 
	 * Get the seed to be given initially to the network.
	 * @returns {Boolean} The seed for the node in the network. 
	 */
	this.getInitialSeed = function () {
		if ($('#seedTrue').attr('checked')) return true;
		else if ($('#seedFalse').attr('checked')) return false;
		else if ($('#seedRandom').attr('checked')) return Boolean(Math.round(Math.random()));
		else return true;
	};

	/** 
	 * The event handler for opening the export dialog. The simulator is 
	 * stopped if it's running.
	 */
	var openExportDialog = function () {
		if ( network == null || network == undefined || network == {} ) {
			alert('You need to import a network, before you can export it.\n\nPlease click "Open", to do so.');
			return;
			}

		if (simulator !== null) simulator.stop();
		$('#dialogExport').dialog('open');
	};

	/** 
	 * The event handler for clicking the export file button of the export
	 * file dialog box. Multiple file export options are supported, if 
	 * a graph is exported then a file is created of the specified graph 
	 * type. If the update rules are exported then the respective boolean
	 * network file is generated. The link is passed as a data URI.
	 */
	var exportFile = function () {
		// close the dialog and start to do the export
		$('#dialogExport').dialog('close');

		// Get the bui.Graph instance of the select graph to export
		var graph, bn, content;
		if ($('#exportNetwork').attr('checked')) graph = network;
		else if ($('#exportStateTransition').attr('checked')) graph = transition;
		else {
			// Export the update rules to a Boolean Net format file.
			if (!$('#formatSBML').attr('checked')) {
				if ($('#exportNetworkRBoolNet').attr('checked')) bn = simulator.exportRBoolNet();
				else bn = simulator.exportPythonBooleanNet();
				content = "data:text/plain," + encodeURIComponent(bn);
				window.open(content, 'tmp');
			}
			return;
		}

		var jsbgn;
		// Check the file format to which the graph has to be exported
		if ($('#graphSBGN').attr('checked')) {
			jsbgn = graph.toJSON();
			var sbgn = null;
			console.log('Wait for Lian to finish his jsbgn reader');
		} else if ($('#graphjSBGN').attr('checked')) {
			jsbgn = JSON.stringify(graph.toJSON());
			content = "data:text/plain," + encodeURIComponent(jsbgn);
			window.open(content, 'tmp');
		} else if ($('#graphSVG').attr('checked')) {
			var svg = graph.rawSVG();
			content = "data:image/svg+xml," + encodeURIComponent(svg);
			window.open(content, 'tmp');
		}
	};
};
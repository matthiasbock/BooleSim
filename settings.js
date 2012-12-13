var serverURL = "http://127.0.0.1:8000/biographer";
var debug = true;
var simDelay = 300;

var optionsSimulateAfterImport = true;
var optionsSimulateAfterClick = true;
var optionsScaleGraphToWindow = true;

var autoload = true;
var autoload_file = 'autoload.net';

// If debugging or testing code
if (debug) {
	var errors = '';
	// Capture JS errors in selenium
	window.onerror = function (message, url, lineNumber) {
		errors += url + ':' + lineNumber + ' ' + message + '\n';
		$('body').attr('JSError', errors);
	}
	//Capture AJAX errors
	$.ajaxSetup({
		error: function (xhr, text, http) {
			errors += text + ':' + http + ' ' + this.url + '\n';
			console.log(errors);
			$('body').attr('JSError', errors);
		}
	});

	// Capture JS errors from js files called using the $.getScript function
	$.extend({
		getScript: function (url, callback) {
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.src = url;
			// Handle Script loading
			{
				var done = false;
				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function () {
					if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
						done = true;
						if (callback) callback();
						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;
					}
				};
			}
			head.appendChild(script);
			// We handle everything using the script element injection
			return undefined;
		},
	});
}

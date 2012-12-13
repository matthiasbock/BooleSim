/*
This code doesn't work.
importFile should do the job, but there is some problem with object parents, references or so ...

if (autoload) {
	$.ajaxSetup({
				cache: true,
				beforeSend: function (xhr) {
									xhr.overrideMimeType("text/plain");
									}
				});

	network = $.get(autoload_file);
	importFile(network);
	}
*/
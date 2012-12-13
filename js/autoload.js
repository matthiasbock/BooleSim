if (autoload) {
	$.ajaxSetup({
				cache: true,
				beforeSend: function (xhr) {
									xhr.overrideMimeType("text/javascript");
									}
				});

	$.getScript(autoload_file);
	}

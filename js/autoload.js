if (autoload) {
	$.ajaxSetup({
				cache: true,
				beforeSend: function (xhr) {
									xhr.overrideMimeType("text/javascript");
									}
				});

	$.get(autoload_file);
	}

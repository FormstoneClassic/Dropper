;(function ($, window) {
	"use strict";

	var namespace = "dropper",
		fileSupported = (window.File && window.FileReader && window.FileList),
		// Classes
		class_base               = namespace,
		class_dropzone           = namespace + "-dropzone",
		class_input              = namespace + "-input",
		class_multiple           = namespace + "-multiple",
		class_dropping           = namespace + "-dropping",
		// Event - Listen
		event_click              = "click."        + namespace,
		event_dragEnter          = "dragenter."    + namespace,
		event_dragOver           = "dragover."     + namespace,
		event_dragLeave          = "dragleave."    + namespace,
		event_drop               = "drop."         + namespace,
		event_change             = "change."       + namespace,
		event_fileError          = "fileError."    + namespace,
		event_fileStart          = "fileStart."    + namespace,
		event_fileProgress       = "fileProgress." + namespace,
		event_fileComplete       = "fileComplete." + namespace,
		event_beforeUnload       = "beforeunload." + namespace,
		event_complete           = "complete."     + namespace,
		event_start              = "start."        + namespace,
		// event_keyDown            = "keydown."      + namespace,
		// event_keyUp              = "keyup."        + namespace,
		// event_keyPress           = "keypress."     + namespace,
		// event_resize             = "resize."       + namespace,
		// event_load               = "load."         + namespace,
		// event_mouseEnter         = "mouseenter."   + namespace;
		// event_mouseMove          = "mousemove."    + namespace,
		// event_mouseLeave         = "mouseleave."   + namespace,
		// event_touchStart         = "touchstart."   + namespace,
		// event_touchMove          = "touchmove."    + namespace,
		// event_touchEnd           = "touchend."     + namespace,
		// event_clickTouchStart    = event_click + " " + event_touchStart,
		// event_transition
		event_clean_progress     = "progress";

	/**
	 * @options
	 * @param action [string] "Where to submit uploads"
	 * @param label [string] <'Drag and drop files or click to select'> "Dropzone text"
	 * @param leave [string] <'You have uploads pending, are you sure you want to leave this page?'> "Before leave message"
	 * @param maxQueue [int] <2> "Number of files to simultaneously upload"
	 * @param maxSize [int] <5242880> "Max file size allowed"
	 * @param postData [object] "Extra data to post with upload"
	 * @param postKey [string] <'file'> "Key to upload file as"
	 */

	var options = {
		action      : "",
		label       : "Drag and drop files or click to select",
		leave       : "You have uploads pending, are you sure you want to leave this page?",
		maxQueue    : 2,
		maxSize     : 5242880, // 5 mb
		postData    : {},
		postKey     : "file"
	};

	/**
	 * @events
	 * @event start.dropper ""
	 * @event complete.dropper ""
	 * @event fileStart.dropper ""
	 * @event fileProgress.dropper ""
	 * @event fileComplete.dropper ""
	 * @event fileError.dropper ""
	 */

	var pub = {

		/**
		 * @method
		 * @name defaults
		 * @description Sets default plugin options
		 * @param opts [object] <{}> "Options object"
		 * @example $.dropper("defaults", opts);
		 */
		defaults: function(opts) {
			options = $.extend(options, opts || {});
			return $(this);
		}
	};

	/**
	 * @method private
	 * @name init
	 * @description Initializes plugin
	 * @param opts [object] "Initialization options"
	 */
	function init(opts) {
		var $items = $(this);

		if (fileSupported) {
			// Settings
			opts = $.extend({}, options, opts);

			// Apply to each element
			for (var i = 0, count = $items.length; i < count; i++) {
				build($items.eq(i), opts);
			}
		}

		return $items;
	}

	/**
	 * @method private
	 * @name build
	 * @description Builds each instance
	 * @param $nav [jQuery object] "Target jQuery object"
	 * @param opts [object] <{}> "Options object"
	 */
	function build($dropper, opts) {
		opts = $.extend({}, opts, $dropper.data(namespace + "-options"));

		var html = "";

		html += '<div class="' + class_dropzone + '">';
		html += options.label;
		html += '</div>';
		html += '<input class="' + class_input + '" type="file"';
		if (options.maxQueue > 1) {
			html += ' ' + class_multiple;
		}
		html += '>';

		$dropper.addClass(class_base)
				.append(html);

		var data =  $.extend({
			$dropper: $dropper,
			$input: $dropper.find( classify(class_input) ),
			queue: [],
			total: 0,
			uploading: false
		}, opts);

		$dropper.on(event_click, classify(class_dropzone), data, onClick)
				.on(event_dragEnter, data, onDragEnter)
				.on(event_dragOver, data, onDragOver)
				.on(event_dragLeave, data, onDragOut)
				.on(event_drop, classify(class_dropzone), data, onDrop)
				.data(namespace, data);

		data.$input.on(event_change, data, onChange);
	}

	/**
	 * @method private
	 * @name onClick
	 * @description Handles click to dropzone
	 * @param e [object] "Event data"
	 */
	function onClick(e) {
		e.stopPropagation();
		e.preventDefault();

		var data = e.data;

		data.$input.trigger(event_click);
	}

	/**
	 * @method private
	 * @name onChange
	 * @description Handles change to hidden input
	 * @param e [object] "Event data"
	 */
	function onChange(e) {
		e.stopPropagation();
		e.preventDefault();

		var data = e.data,
			files = data.$input[0].files;

		if (files.length) {
			handleUpload(data, files);
		}
	}

	/**
	 * @method private
	 * @name onDragEnter
	 * @description Handles dragenter to dropzone
	 * @param e [object] "Event data"
	 */
	function onDragEnter(e) {
		e.stopPropagation();
		e.preventDefault();

		var data = e.data;

		data.$dropper.addClass(class_dropping);
	}

	/**
	 * @method private
	 * @name onDragOver
	 * @description Handles dragover to dropzone
	 * @param e [object] "Event data"
	 */
	function onDragOver(e) {
		e.stopPropagation();
		e.preventDefault();

		var data = e.data;

		data.$dropper.addClass(class_dropping);
	}

	/**
	 * @method private
	 * @name onDragOut
	 * @description Handles dragout to dropzone
	 * @param e [object] "Event data"
	 */
	function onDragOut(e) {
		e.stopPropagation();
		e.preventDefault();

		var data = e.data;

		data.$dropper.removeClass(class_dropping);
	}

	/**
	 * @method private
	 * @name onDrop
	 * @description Handles drop to dropzone
	 * @param e [object] "Event data"
	 */
	function onDrop(e) {
		e.preventDefault();

		var data = e.data,
			files = e.originalEvent.dataTransfer.files;

		data.$dropper.removeClass(class_dropping);

		handleUpload(data, files);
	}

	/**
	 * @method private
	 * @name handleUpload
	 * @description Handles new files
	 * @param data [object] "Instance data"
	 * @param files [object] "File list"
	 */
	function handleUpload(data, files) {
		var newFiles = [];

		for (var i = 0; i < files.length; i++) {
			var file = {
				index: data.total++,
				file: files[i],
				name: files[i].name,
				size: files[i].size,
				started: false,
				complete: false,
				error: false,
				transfer: null
			};

			newFiles.push(file);
			data.queue.push(file);
	   }

	   if (!data.uploading) {
		   $(window).on(event_beforeUnload, function(){
				return data.leave;
			});

			data.uploading = true;
		}

		data.$dropper.trigger(event_start, [ newFiles ]);

		checkQueue(data);
	}

	/**
	 * @method private
	 * @name checkQueue
	 * @description Checks and updates file queue
	 * @param data [object] "Instance data"
	 */
	function checkQueue(data) {
		var transfering = 0,
			newQueue = [];

		// remove lingering items from queue
		for (var i in data.queue) {
			if (data.queue.hasOwnProperty(i) && !data.queue[i].complete && !data.queue[i].error) {
				newQueue.push(data.queue[i]);
			}
		}

		data.queue = newQueue;

		for (var j in data.queue) {
			if (data.queue.hasOwnProperty(j)) {
				if (!data.queue[j].started) {
					var formData = new FormData();

					formData.append(data.postKey, data.queue[j].file);

					for (var k in data.postData) {
						if (data.postData.hasOwnProperty(k)) {
							formData.append(k, data.postData[k]);
						}
					}

					uploadFile(data, data.queue[j], formData);
				}

				transfering++;

				if (transfering >= data.maxQueue) {
					return;
				} else {
					i++;
				}
			}
		}

		if (transfering === 0) {
			$(window).off(event_beforeUnload);

			data.uploading = false;

			data.$dropper.trigger(event_complete);
		}
	}

	/**
	 * @method private
	 * @name uploadFile
	 * @description Uploads file
	 * @param data [object] "Instance data"
	 * @param file [object] "Target file"
	 * @param formData [object] "Target form"
	 */
	function uploadFile(data, file, formData) {
		if (file.size >= data.maxSize) {
			file.error = true;
			data.$dropper.trigger(event_fileError, [ file, "Too large" ]);

			checkQueue(data);
		} else {
			file.started = true;
			file.transfer = $.ajax({
				url: data.action,
				data: formData,
				type: "POST",
				contentType:false,
				processData: false,
				cache: false,
				xhr: function() {
					var $xhr = $.ajaxSettings.xhr();

					if ($xhr.upload) {
						$xhr.upload.addEventListener(event_clean_progress, function(e) {
							var percent = 0,
								position = e.loaded || e.position,
								total = e.total;

							if (e.lengthComputable) {
								percent = Math.ceil(position / total * 100);
							}

							data.$dropper.trigger(event_fileProgress, [ file, percent ]);
						}, false);
					}

					return $xhr;
				},
				beforeSend: function(e) {
					data.$dropper.trigger(event_fileStart, [ file ]);
				},
				success: function(response, status, jqXHR) {
					file.complete = true;
					data.$dropper.trigger(event_fileComplete, [ file, response ]);

					checkQueue(data);
				},
				error: function(jqXHR, status, error) {
					file.error = true;
					data.$dropper.trigger(event_fileError, [ file, error ]);

					checkQueue(data);
				}
			});
		}
	}

	/**
	 * @method private
	 * @name classify
	 * @description Create class selector from text
	 * @param text [string] "Text to convert"
	 * @return [string] "New class name"
	 */
	function classify(text) {
		return "." + text;
	}

	$.fn[namespace] = function(method) {
		if (pub[method]) {
			return pub[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return init.apply(this, arguments);
		}
		return this;
	};

	$[namespace] = function(method) {
		if (method === "defaults") {
			pub.defaults.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
})(jQuery, window);
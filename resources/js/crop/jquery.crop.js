(function($) {
	var DIRECTION = {
		N		: 'n',
		NE	: 'ne',
		NW	:	'nw',
		S		: 's',
		SW	: 'sw',
		SE	: 'se',
		W		: 'w',
		E		: 'e'
	};
	
	$.crop = function(img, options) {
    var _options = $.extend({
        allowMove : true,
        allowResize : true,
        allowSelect : true,
        aspectRatio : 0,
        displayPreview : false,
        displaySizeHint : true,
        minSelect : [0, 0],
        minSize : [0, 0],
        maxSize : [0, 0],
        outlineOpacity : 0.5,
        overlayOpacity : 0.5,
        previewBoundary : 90,
        previewFadeOnBlur : 1,
        previewFadeOnFocus : 0.35,
        selectionPosition : [0, 0],
        selectionWidth : 0,
        selectionHeight : 0,

        // Plug-in's event handlers
        onChange : function() {},
        onSelect : function() {}
    	}, options),

    	_image			= new ImageHolder(img),
			_overlay 		= new Overlay(_image.element, 	_image.width, _image.height, _options.overlayOpacity),
			_trigger 		= new Trigger(_overlay.element, _image.width, _image.height),
			_outline 		= new Outline(_trigger.element, _image.width, _image.height, _options.outlineOpacity),
	    _selection 	= new Selection(_image, _outline.element, _options.onChange, _options.onSelect),
	
			_handlers 	= [
				new Handler(_selection.element, DIRECTION.N, 0, -0.5),
				new Handler(_selection.element, DIRECTION.NE, 0.5, -0.5),
				new Handler(_selection.element, DIRECTION.E, 0.5, 0),
				new Handler(_selection.element, DIRECTION.SE, 0.5, 0.5),
				new Handler(_selection.element, DIRECTION.S, 0, 0.5),
				new Handler(_selection.element, DIRECTION.SW, -0.5, 0.5),
				new Handler(_selection.element, DIRECTION.W, -0.5, 0),
				new Handler(_selection.element, DIRECTION.NW, -0.5, -0.5)
			];

	};

	/*
	** ImageHolder
	*/
	var ImageHolder = function (img) {
		this.element 	= $(img);
		this.width 		= this.element.width();
		this.height		= this.element.height();
		this.source		= this.element.attr('src');
		this._offset	= this._getOffset(),
		this._hold();
	};
	
	ImageHolder.prototype = {

		mousePosition: function (event) {
			var x	= event.pageX - this._offset[0],
					y	= event.pageY - this._offset[1];

			x = this._max(this.width, x);
			y = this._max(this.height, y);
			return [x, y];
		},
		
		_getOffset: function () {
			var offset = this.element.offset();
			return [offset.left, offset.top];
		},
		
		_max: function(size, position) {
			return position < 0 ? 0 : Math.min(position, size);
		},
		
		_hold: function () {
			var holder = $('<div />')
				.addClass('image_crop_holder')
        .width(this.width)
        .height(this.height);
	    // Wrap the holder around the image
	    this.element
				.wrap(holder)
	      .addClass('image_crop_abs');
		}
		
	};
	
	/*
	** Overlay 
	*/
	var Overlay = function (jafter, width, height, overlayOpacity) {
		this.element = $('<div />')
			.addClass('image_crop_overlay')
	    .css({
	    	opacity 	: overlayOpacity,
				width			: width,
				height		: height
	    })
	    .insertAfter(jafter);
		this._bind(this);
	};
	
	Overlay.prototype = {
		update: function (selectionExists) {
			this.element.css('display', selectionExists ? 'block' : 'none');
		},
		
		_bind: function (self) {
			$.subscribe('/crop/selection/set', function (selectionExists) {
				self.update(selectionExists);
			});
			$.subscribe('/crop/selection/release', function (selectionExists) {
				self.update(selectionExists);
			});
		}
	};	
		
	/*
	** Trigger 
	*/
	var Trigger = function (after, width, height) {
		this.element = $('<div />')
			.addClass('image_crop_trigger')
      .css({
       opacity 	: 0,
				width		: width,
				height	: height
	    })
	    .insertAfter(after);
		this._bind(this);
	};
	
	Trigger.prototype = {
		update: function () {
			this.element.css('cursor', 'crosshair');
		},
		
		_bind: function (self) {
			this.element.mousedown(function (event) {
				$.publish('/crop/trigger/start', [event]);
			});
		}
	};
	
	/*
	** Outline
	*/
	var Outline = function (after, width, height, outlineOpacity) {
		this.element = $('<div />')
			.addClass('image_crop_outline')
      .css({
       	opacity 	: outlineOpacity,
				width			: width,
				height		: height
      })
      .insertAfter(after);
			this._bind(this);
	};
	Outline.prototype = {
		update: function (show, position, width, height) {
			this.element.css({
				display : show ? 'block' : 'none',
				left 		: position ? position[0] : 0,
				top 		: position ? position[1] : 0,
				width		: width || 0,
				height	: height || 0
			});
		},
		
		_setCursor: function (cursorType) {
			this.element.css('cursor', cursorType);
		},

		_bind: function (self) {
			$.subscribe('/crop/selection/set', function () {
				self.update(false);
				self._setCursor('default');
			});
			
			$.subscribe('/crop/selection/resize', function (selectionExists, position, width, height) {
				self._setCursor('crosshair');
				self.update(selectionExists, position, width + 2, height + 2);
			});
			
			$.subscribe('/crop/selection/move', function (selectionExists, position, width, height) {
				self._setCursor('move');
				self.update(selectionExists, position, width + 2, height + 2);
			});
		}
	};
	
	/*
	** Selection 
	*/
	var Selection = function (imageHolder, outline, onChange, onSelect) {
		this._image 		= imageHolder;
		this._onChange 	= onChange;
		this._onSelect	= onSelect;
		this.element = $('<div />')
			.addClass('image_crop_selection')
			.addClass('image_obj')
			.addClass('image_crop_abs')
      .css('background', 'url(' + this._image.source + ') no-repeat')
      .insertAfter(outline)
		this.reset();
		this._bind(this);
	};
	
	Selection.prototype = {
		
		reset: function () {
			this.width 								= 0;
			this.height 							= 0;
			this.origin								= [0, 0];
			this.centre								= [0, 0];
			this.position							= [0, 0];
			this._offset							= [0, 0];
			this._minSize							= [0, 0];
			this._resizeHorizontally  = true;
			this._resizeVertically		= true;
			this.exists								= false;
		},

		update: function () {
			this.element.css({
				backgroundPosition 	: ( -this.position[0] - 1) + 'px ' + (-this.position[1] - 1) + 'px',
				cursor							: 'move',
				display 						: this.exists ? 'block' : 'none',
				left 								: this.position[0] + 1,
				top 								: this.position[1] + 1,
				width								: this.width,
				height							: this.height
			});
			this._setCentre();
		},
		
		_resize: function (event) {
			this._stopEvent(event);
			var mousePosition = this._image.mousePosition(event),
				height 					= mousePosition[1] - this.origin[1],
				width 					= mousePosition[0] - this.origin[0],
				imageWidth			= this._image.width,
				imageHeight			= this._image.height;
				
		  // TODO check min & max(?) size
		
			// Test selection dosn't exceed image bounds
			if (this.origin[0] + width < 0 || this.origin[0] + width > imageWidth) width = -width;
			if (this.origin[1] + height < 0 || this.origin[1] + height > imageHeight) height = -height;
			
			if (this._resizeHorizontally) this.width = width;
			if (this._resizeVertically)		this.height = height;
			
			if (this.width < 0) {
				this.width = Math.abs(this.width);
				this.position[0] = this.origin[0] - this.width;
			} else
				this.position[0] = this.origin[0];
				
			if (this.height < 0) {
				this.height = Math.abs(this.height);
				this.position[1] = this.origin[1] - this.height;
			} else
				this.position[1] = this.origin[1];
			
			if (this.position[0] + this.width >= imageWidth) this.position[0] -= 2;
			if (this.position[1] + this.height >= imageHeight) this.position[1] -= 2;
				
			this._onChange(this._getCropData());

			this.update();
			this._setCursor('crosshair');
			$.publish('/crop/selection/resize', [this.exists, this.position, this.width, this.height]);
		},
		
		_release: function (event) {
			this._stopEvent(event);
			$(document).unbind('mousemove');
			$(document).unbind('mouseup');
			
			this.origin[0] = this.position[0];
			this.origin[1] = this.position[1];
			
			// Reset
			this._resizeHorizontally = true;
			this._resizeVertically 	 = true;
			
			this.exists = this.width > this._minSize[0] && this.height > this._minSize[1];
			
			this._onSelect(this._getCropData());

			this.update();
			$.publish('/crop/selection/release', [this.exists, this.centre, this.width, this.height]);
		},
		
		_move: function (event) {
			this._stopEvent(event);
			var mousePosition = this._image.mousePosition(event),
				imageWidth			= this._image.width,
				imageHeight			= this._image.height,
				hOffset					= mousePosition[0] - this._offset[0],
				vOffset					= mousePosition[1] - this._offset[1];
				
			if (hOffset > 0)
				this.position[0] = hOffset + this.width < imageWidth ? hOffset : imageWidth - this.width - 2;
			else
				this.position[0] = 0;
				
			if (vOffset > 0)
				this.position[1] = vOffset + this.height < imageHeight ? vOffset : imageHeight - this.height - 2;
			else
				this.position[1] = 0;

			this._onChange(this._getCropData());
			
			this.update();
			$.publish('/crop/selection/move', [this.exists, this.position, this.width, this.height]);
		},
		
		_pick: function (event) {
			var self = this;
			this._stopEvent(event);
			$(document).mousemove(function (event) { self._move(event); });
			$(document).mouseup(	function (event) { self._release(event); });	
					
			var mousePosition = this._image.mousePosition(event);
			this._offset[0] = mousePosition[0] - this.position[0];
			this._offset[1] = mousePosition[1] - this.position[1];
			$.publish('/crop/selection/pick');
		},
		
		_set: function (event) {
			this._stopEvent(event);
			this._bindResize(this);
			this.reset();
			this.exists 			= true;
			this.origin 			= this._image.mousePosition(event);
			this.position[0]	= this.origin[0];
			this.position[1]	= this.origin[1];
			
			this.update();
			$.publish('/crop/selection/set', [true]);
		},
		
		_pickHandler: function (direction) {
			var self = this;
			switch (direction) {
				case DIRECTION.NW :
					$.each([0, 1], function (i) {
						self.position[i] = self.origin[i];
					});
					this.origin[0] += this.width;
					this.origin[1] += this.height;
					break;
				case DIRECTION.N :
					this.position[1] 				 = this.origin[1];
					this.origin[1] 					+= this.height;
					this._resizeHorizontally = false;
					break;
				case DIRECTION.NE :
					this.position[1] = this.origin[1];
					this.origin[1] 	+= this.height;
					break;
				case DIRECTION.W :
					this.position[0] 			 = this.origin[0];
					this.origin[0] 				+= this.width;
					this._resizeVertically = false;
					break;
				case DIRECTION.E :
					this._resizeVertically = false;
					break;
				case DIRECTION.SW :
					this.position[0] = this.origin[0];
					this.origin[0] 	+= this.width;
					break;
				case DIRECTION.S :
					this._resizeHorizontally = false;
					break;
			}
			this._bindResize(this);
		},
		
		_getCropData: function () {
			var self = this;
			return {
				selectionX			: this.position[0],
				selectionY			: this.position[1],
				selectionWidth	:	this.width,
				selectionHeight	: this.height,				
				selectionExists	: function () { return self.exists; }
			};
		},
		
		_setCentre: function () {
			this.centre[0] = this.origin[0] + this.width / 2;
			this.centre[1] = this.origin[1] + this.height / 2;
		},
		
		_setCursor: function (cursorType) {
			this.element.css('cursor', cursorType || 'default');
		},
		
		_bind: function (self) {
			$.subscribe('/crop/trigger/start', function (event) {
				self._set(event);
			});
			$.subscribe('/crop/resize/handler', function (direction) {
				self._pickHandler(direction);
			});
			this.element.mousedown(function (event) {
				self._pick(event);
			});
		},
		
		_bindResize: function (self) {
			$(document).mousemove(function (event) { self._resize(event);	});
			$(document).mouseup(  function (event) { self._release(event); });
		},
		
		_stopEvent: function (event) {
			event.preventDefault();
			event.stopPropagation();
		}
	
	};
	
	var Handler = function (after, direction, left, top) {
		this._direction = direction;
		this.element = $('<div />')
			.attr('id', 'image_crop_' + this._direction + '_resize_handler')
			.addClass('image_crop_resize_handler')
			.addClass('image_crop_resize_handler_' + this._direction)
			.css('opacity', 0.5)
      .insertAfter(after);
		this.left	= left;
		this.top	= top;
		this._bind(this);
	};
	Handler.prototype = {
		handlerSize: 3.5,	
		
		update: function (show, selectionCentre, selectionWidth, selectionHeight) {
			this.element.css({
				display	: show ? 'block' : 'none',
				left		: selectionCentre[0] + Math.round(this.left * selectionWidth) 	- this.handlerSize - 1,
				top			: selectionCentre[1] + Math.round(this.top 	* selectionHeight) 	- this.handlerSize - 1
			});
		},
		
		_pick: function (event) {
			event.preventDefault();
			event.stopPropagation();
			
			this._hide();
			$.publish('/crop/resize/handler', [this._direction]);
		},
		
		_hide: function () {
			this.element.hide();
		},
		
		_bind: function (self) {
			$.each(['set', 'pick', 'resize', 'move'], function (i, topic) {
				$.subscribe('/crop/selection/' + topic, function () {
					self._hide();
				});
			});
			$.subscribe('/crop/selection/release', function (selectionExists, selectionCenter, selectionWidth, selectionHeight) {
				self.update(selectionExists, selectionCenter, selectionWidth, selectionHeight);
			});
			
			this.element.mousedown(function (event) {
				self._pick(event);
			});
		}
	};

	$.fn.crop = function(options) {

		this.each(function() {
			var element = this,
				image = new Image();

			// Attach crop when the object is loaded
			image.onload = function() {
				$.crop(element, options);
			};

			// Reset the src because cached images don't fire load sometimes
			image.src = element.src;
		});

		return this;
	};
}) (jQuery);
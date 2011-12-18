(function($) {
    $.crop = function(object, options) {
        var _options = $.extend({
            allowMove : true,
            allowResize : true,
            allowSelect : true,
            aspectRatio : 0,
            displayPreview : false,
            displaySizeHint : false,
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

        	_jimage 			= $(object),
					_imageWidth		= _jimage.width(),
					_imageHeight	= _jimage.height(),

        	_jholder = $('<div />')
						.addClass('image_crop_holder')
            .width(_imageWidth)
            .height(_imageHeight);

        // Wrap the holder around the image
        _jimage
					.wrap(_jholder)
          .addClass('image_crop_abs');

        var _joverlay = $('<div />')
					.addClass('image_crop_overlay')
					.addClass('image_crop_abs')
		      .css({
		      	opacity 	: _options.overlayOpacity,
						width			: _imageWidth,
						height		: _imageHeight
		      })
		      .insertAfter(_jimage),

        _jtrigger = $('<div />')
					.addClass('image_crop_trigger')
					.addClass('image_crop_abs')
          .css({
	          opacity 	: 0,
						width			: _imageWidth,
						height		: _imageHeight
          })
          .insertAfter(_joverlay),

        _joutline = $('<div />')
					.addClass('image_crop_outline')
					.addClass('image_crop_abs')
          .css({
	          opacity 	: _options.outlineOpacity,
						width			: _imageWidth,
						height		: _imageHeight
          })
          .insertAfter(_jtrigger),

        _jselection = $('<div />')
					.addClass('image_crop_selection')
					.addClass('image_crop_abs')
          .css('background', 'url(' + _jimage.attr('src') + ') no-repeat')
          .insertAfter(_joutline),

        _jsizeHintBackground = $('<div />')
					.addClass('image_crop_size_hint_background')
					.addClass('image_crop_abs')
          .css('opacity', 0.35)
          .insertAfter(_jselection),

        _jsizeHintForeground = $('<div />')
					.addClass('image_crop_size_hint_foreground')
					.addClass('image_crop_abs')
          .insertAfter(_jsizeHintBackground),

				_resizeHandlerHalf 		= 3.5,
				_resizeHandlerWidth 	= 7,
				_resizeHandlerHeight 	= 7,

				// Preview
        _jpreviewHolder = $('<div />')
					.addClass('image_crop_preview_holder')
					.css('opacity', _options.previewFadeOnBlur)
          .insertAfter(_joutline),

        _jpreview = $('<img alt="Crop preview" id="image-crop-preview" />')
					.addClass('image_crop_preview')
          .attr('src', _jimage.attr('src'))
          .appendTo(_jpreviewHolder),

        _selectionExists,
        _resizeHorizontally = true,
        _resizeVertically 	= true,
        _selectionOffset 		= [0, 0],
        _selectionOrigin 		= [0, 0],
				_selectionCentre 		= [0, 0];

				var _handlers = [
					new Handler(_jselection, 'n', 0, -0.5),
					new Handler(_jselection, 'ne', 0.5, -0.5),
					new Handler(_jselection, 'e', 0.5, 0),
					new Handler(_jselection, 'se', 0.5, 0.5),
					new Handler(_jselection, 's', 0, 0.5),
					new Handler(_jselection, 'sw', -0.5, 0.5),
					new Handler(_jselection, 'w', -0.5, 0),
					new Handler(_jselection, 'nw', -0.5, -0.5)
				];
				
        // Verify if the selection size is bigger than the minimum accepted
        // and set the selection existence accordingly
        if (_options.selectionWidth > _options.minSelect[0] &&
            _options.selectionHeight > _options.minSelect[1])
            _selectionExists = true;
        else
            _selectionExists = false;

        // Call the '_updateInterface' function for the first time to
        // initialize the plug-in interface
        _updateInterface();

        if (_options.allowSelect) _jtrigger.mousedown(_setSelection);
        if (_options.allowMove) _jselection.mousedown(pickSelection);
        if (_options.allowResize) $('.image_crop_resize_handler').mousedown(pickResizeHandler);

        function _getElementOffset (object) {
            var offset = $(object).offset();
            return [offset.left, offset.top];
        };

        // Get the current mouse position relative to the image position
        function _getMousePosition (event) {
            var imageOffset = _getElementOffset(_jimage),
            	x 						= event.pageX - imageOffset[0],
              y 						= event.pageY - imageOffset[1];

            x = Math.max(0, (x > _imageWidth) ? _imageWidth : x);
            y = Math.max(0, (y > _imageHeight) ? _imageHeight : y);

            return [x, y];
        };

        // Return an object containing information about the plug-in state
        function _getCropData() {
            return {
                selectionX 			: _options.selectionPosition[0],
                selectionY 			: _options.selectionPosition[1],
                selectionWidth 	: _options.selectionWidth,
                selectionHeight : _options.selectionHeight,
                selectionExists : function() { return _selectionExists; }
            };
        }

        function _updateOverlay() {
        	_joverlay.css('display', _selectionExists ? 'block' : 'none');
        }

        function _updateTrigger() {
        	_jtrigger.css('cursor', _options.allowSelect ? 'crosshair' : 'default');
        }

        // Update the selection
        function _updateSelection() {
            // Update the outline layer
            _joutline.css({
                    cursor : 'default',
                    display : _selectionExists ? 'block' : 'none',
                    left : _options.selectionPosition[0],
                    top : _options.selectionPosition[1]
                })
                .width(_options.selectionWidth)
                .height(_options.selectionHeight);

            // Update the selection layer
            _jselection.css({
                    backgroundPosition : ( - _options.selectionPosition[0] - 1) + 'px ' + ( - _options.selectionPosition[1] - 1) + 'px',
                    cursor : _options.allowMove ? 'move' : 'default',
                    display : _selectionExists ? 'block' : 'none',
                    left : _options.selectionPosition[0] + 1,
                    top : _options.selectionPosition[1] + 1
                })
                .width((_options.selectionWidth - 2 > 0) ? (_options.selectionWidth - 2) : 0)
                .height((_options.selectionHeight - 2 > 0) ? (_options.selectionHeight - 2) : 0);
        };

        // Update the size hint
        function _updateSizeHint(action) {
            switch (action) {
                case 'fade-out' :
                    // Fade out the size hint
                    _jsizeHintBackground.fadeOut('slow');
                    _jsizeHintForeground.fadeOut('slow');

                    break;
                default :
                    var display = (_selectionExists && _options.displaySize) ? 'block' : 'none';

                    // Update the foreground layer
                    _jsizeHintForeground.css({
                            cursor : 'default',
                            display : display,
                            left : _options.selectionPosition[0] + 4,
                            top : _options.selectionPosition[1] + 4
                        })
                        .html(_options.selectionWidth + 'x' + _options.selectionHeight);

                    // Update the background layer
                    _jsizeHintBackground.css({
                            cursor : 'default',
                            display : display,
                            left : _options.selectionPosition[0] + 1,
                            top : _options.selectionPosition[1] + 1
                        })
                        .width(_jsizeHintForeground.width() + 6)
                        .height(_jsizeHintForeground.height() + 6);
            }
        };

				function _setSelectionCentre () {
					_selectionCentre[0] = _selectionOrigin[0] + _options.selectionWidth / 2;
					_selectionCentre[1] = _selectionOrigin[1] + _options.selectionHeight / 2;
				}

        // Update the resize handlers
        function _updateResizeHandlers(action) {
            switch (action) {
                case 'hide-all' :
                    $('.image_crop_resize_handler').hide();
                    break;
                default :
										_setSelectionCentre();
                    var display = (_selectionExists && _options.allowResize) ? 'block' : 'none';											
										$.each(_handlers, function (i, handler) {
											handler.update(display, _selectionCentre, _options.selectionWidth, _options.selectionHeight, _resizeHandlerHalf);
										});
            }
        };

        // Update the preview
        function _updatePreview(action) {
            switch (action) {
                case 'focus' :
                    // Fade in the preview holder layer
                    _jpreviewHolder.stop()
                        .animate({
                            opacity : _options.previewFadeOnFocus
                        });

                    break;
                case 'blur' :
                    // Fade out the preview holder layer
                    _jpreviewHolder.stop()
                        .animate({
                            opacity : _options.previewFadeOnBlur
                        });

                    break;
                case 'hide' :
                    // Hide the preview holder layer
                    _jpreviewHolder.css({
                        display : 'none'
                    });

                    break;
                default :
                    var display = (_selectionExists && _options.displayPreview) ? 'block' : 'none';

                    // Update the preview holder layer
                    _jpreviewHolder.css({
                            display : display,
                            left : _options.selectionPosition[0],
                            top : _options.selectionPosition[1] + _options.selectionHeight + 10
                        });

                    // Update the preview size
                    if (_options.selectionWidth > _options.selectionHeight) {
                        if (_options.selectionWidth && _options.selectionHeight) {
                            // Update the preview image size
                            _jpreview.width(Math.round(_imageWidth * _options.previewBoundary / _options.selectionWidth));
                            _jpreview.height(Math.round(_imageHeight * _jpreview.width() / _imageWidth));

                            // Update the preview holder layer size
                            _jpreviewHolder.width(_options.previewBoundary)
                                .height(Math.round(_options.selectionHeight * _jpreview.height() / _imageHeight));
                        }
                    } else {
                        if (_options.selectionWidth && _options.selectionHeight) {
                            // Update the preview image size
                            _jpreview.height(Math.round(_imageHeight * _options.previewBoundary / _options.selectionHeight));
                            _jpreview.width(Math.round(_imageWidth * _jpreview.height() / _imageHeight));

                            // Update the preview holder layer size
                            _jpreviewHolder.width(Math.round(_options.selectionWidth * _jpreview.width() / _imageWidth))
                                .height(_options.previewBoundary);
                        }
                    }

                    // Update the preview image position
                    _jpreview.css({
                        left : - Math.round(_options.selectionPosition[0] * _jpreview.width() / _imageWidth),
                        top : - Math.round(_options.selectionPosition[1] * _jpreview.height() / _imageHeight)
                    });
            }
        };

        // Update the cursor type
        function updateCursor(cursorType) {
            _jtrigger.css({
                    cursor : cursorType
                });

            _joutline.css({
                    cursor : cursorType
                });

            _jselection.css({
                    cursor : cursorType
                });

            _jsizeHintBackground.css({
                    cursor : cursorType
                });

            _jsizeHintForeground.css({
                    cursor : cursorType
                });
        };

        // Update the plug-in interface
        function _updateInterface(sender) {
            switch (sender) {
                case 'setSelection' :
                    _updateOverlay();
                    _updateSelection();
                    _updateResizeHandlers('hide-all');
                    _updatePreview('hide');

                    break;
                case 'pickSelection' :
                    _updateResizeHandlers('hide-all');

                    break;
                case 'pickResizeHandler' :
                    _updateSizeHint();
                    _updateResizeHandlers('hide-all');

                    break;
                case 'resizeSelection' :
                    _updateSelection();
                    _updateSizeHint();
                    _updateResizeHandlers('hide-all');
                    _updatePreview();
                    updateCursor('crosshair');

                    break;
                case 'moveSelection' :
                    _updateSelection();
                    _updateResizeHandlers('hide-all');
                    _updatePreview();
                    updateCursor('move');

                    break;
                case 'releaseSelection' :
                    _updateTrigger();
                    _updateOverlay();
                    _updateSelection();
                    _updateSizeHint('fade-out');
                    _updateResizeHandlers();
                    _updatePreview();

                    break;
                default :
                    _updateTrigger();
                    _updateOverlay();
                    _updateSelection();
                    _updateResizeHandlers();
                    _updatePreview();
            }
        };

        // Set a new selection
        function _setSelection(event) {
            event.preventDefault();
            event.stopPropagation();
            $(document).mousemove(_resizeSelection);
            $(document).mouseup(_releaseSelection);

            if (_options.displayPreview) {
                _jpreviewHolder.mouseenter(function() { _updatePreview('focus'); });
                _jpreviewHolder.mouseleave(function() { _updatePreview('blur'); });
            }

            _selectionExists = true;
            _options.selectionWidth = 0;
            _options.selectionHeight = 0;
            _selectionOrigin = _getMousePosition(event);

            // And set its position
            _options.selectionPosition[0] = _selectionOrigin[0];
            _options.selectionPosition[1] = _selectionOrigin[1];

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('setSelection');
        };

        // Pick the current selection
        function pickSelection(event) {
            // Prevent the default action of the event
            event.preventDefault();

            // Prevent the event from being notified
            event.stopPropagation();

            // Bind an event handler to the 'mousemove' event
            $(document).mousemove(moveSelection);

            // Bind an event handler to the 'mouseup' event
            $(document).mouseup(_releaseSelection);

            var mousePosition = _getMousePosition(event);

            // Get the selection offset relative to the mouse position
            _selectionOffset[0] = mousePosition[0] - _options.selectionPosition[0];
            _selectionOffset[1] = mousePosition[1] - _options.selectionPosition[1];

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('pickSelection');
        };

        // Pick one of the resize handlers
        function pickResizeHandler(event) {
            // Prevent the default action of the event
            event.preventDefault();

            // Prevent the event from being notified
            event.stopPropagation();

            switch (event.target.id) {
                case 'image_crop_nw_resize_handler' :
                    _selectionOrigin[0] += _options.selectionWidth;
                    _selectionOrigin[1] += _options.selectionHeight;
                    _options.selectionPosition[0] = _selectionOrigin[0] - _options.selectionWidth;
                    _options.selectionPosition[1] = _selectionOrigin[1] - _options.selectionHeight;

                    break;
                case 'image_crop_n_resize_handler' :
                    _selectionOrigin[1] += _options.selectionHeight;
                    _options.selectionPosition[1] = _selectionOrigin[1] - _options.selectionHeight;

                    _resizeHorizontally = false;

                    break;
                case 'image_crop_ne_resize_handler' :
                    _selectionOrigin[1] += _options.selectionHeight;
                    _options.selectionPosition[1] = _selectionOrigin[1] - _options.selectionHeight;

                    break;
                case 'image_crop_w_resize_handler' :
                    _selectionOrigin[0] += _options.selectionWidth;
                    _options.selectionPosition[0] = _selectionOrigin[0] - _options.selectionWidth;

                    _resizeVertically = false;

                    break;
                case 'image_crop_e_resize_handler' :
                    _resizeVertically = false;
                    break;
                case 'image_crop_sw_resize_handler' :
										_options.selectionPosition[0] = _selectionOrigin[0];
                    _selectionOrigin[0] += _options.selectionWidth;
                    break;
                case 'image_crop_s_resize_handler' :
                    _resizeHorizontally = false;

                    break;
            }

            // Bind an event handler to the 'mousemove' event
            $(document).mousemove(_resizeSelection);

            // Bind an event handler to the 'mouseup' event
            $(document).mouseup(_releaseSelection);

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('pickResizeHandler');
        };

        // Resize the current selection
        function _resizeSelection(event) {
            // Prevent the default action of the event
            event.preventDefault();

            // Prevent the event from being notified
            event.stopPropagation();

            var mousePosition = _getMousePosition(event);

            // Get the selection size
            var height = mousePosition[1] - _selectionOrigin[1],
                width = mousePosition[0] - _selectionOrigin[0];

            // If the selection size is smaller than the minimum size set it
            // accordingly
            if (Math.abs(width) < _options.minSize[0])
                width = (width >= 0) ? _options.minSize[0] : - _options.minSize[0];

            if (Math.abs(height) < _options.minSize[1])
                height = (height >= 0) ? _options.minSize[1] : - _options.minSize[1];

            // Test if the selection size exceeds the image bounds
            if (_selectionOrigin[0] + width < 0 || _selectionOrigin[0] + width > _imageWidth)
                width = - width;

            if (_selectionOrigin[1] + height < 0 || _selectionOrigin[1] + height > _imageHeight)
                height = - height;

            if (_options.maxSize[0] > _options.minSize[0] &&
                _options.maxSize[1] > _options.minSize[1]) {
                // Test if the selection size is bigger than the maximum size
                if (Math.abs(width) > _options.maxSize[0])
                    width = (width >= 0) ? _options.maxSize[0] : - _options.maxSize[0];

                if (Math.abs(height) > _options.maxSize[1])
                    height = (height >= 0) ? _options.maxSize[1] : - _options.maxSize[1];
            }

            // Set the selection size
            if (_resizeHorizontally) _options.selectionWidth = width;
            if (_resizeVertically)   _options.selectionHeight = height;

            // If any aspect ratio is specified
            if (_options.aspectRatio) {
                // Calculate the new width and height
                if ((width > 0 && height > 0) || (width < 0 && height < 0))
                    if (_resizeHorizontally)
                        height = Math.round(width / _options.aspectRatio);
                    else
                        width = Math.round(height * _options.aspectRatio);
                else
                    if (_resizeHorizontally)
                        height = - Math.round(width / _options.aspectRatio);
                    else
                        width = - Math.round(height * _options.aspectRatio);

                // Test if the new size exceeds the image bounds
                if (_selectionOrigin[0] + width > _imageWidth) {
                    width = _imageWidth - _selectionOrigin[0];
                    height = (height > 0) ? Math.round(width / _options.aspectRatio) : - Math.round(width / _options.aspectRatio);
                }

                if (_selectionOrigin[1] + height < 0) {
                    height = - _selectionOrigin[1];
                    width = (width > 0) ? - Math.round(height * _options.aspectRatio) : Math.round(height * _options.aspectRatio);
                }

                if (_selectionOrigin[1] + height > _imageHeight) {
                    height = _imageHeight - _selectionOrigin[1];
                    width = (width > 0) ? Math.round(height * _options.aspectRatio) : - Math.round(height * _options.aspectRatio);
                }

                // Set the selection size
                _options.selectionWidth = width;
                _options.selectionHeight = height;
            }

            if (_options.selectionWidth < 0) {
                _options.selectionWidth = Math.abs(_options.selectionWidth);
                _options.selectionPosition[0] = _selectionOrigin[0] - _options.selectionWidth;
            } else
                _options.selectionPosition[0] = _selectionOrigin[0];

            if (_options.selectionHeight < 0) {
                _options.selectionHeight = Math.abs(_options.selectionHeight);
                _options.selectionPosition[1] = _selectionOrigin[1] - _options.selectionHeight;
            } else
                _options.selectionPosition[1] = _selectionOrigin[1];

            // Trigger the 'onChange' event when the selection is changed
            _options.onChange(_getCropData());

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('resizeSelection');
        };

        // Move the current selection
        function moveSelection(event) {
            // Prevent the default action of the event
            event.preventDefault();

            // Prevent the event from being notified
            event.stopPropagation();

            var mousePosition = _getMousePosition(event);

            // Set the selection position on the x-axis relative to the bounds
            // of the image
            if (mousePosition[0] - _selectionOffset[0] > 0)
                if (mousePosition[0] - _selectionOffset[0] + _options.selectionWidth < _imageWidth)
                    _options.selectionPosition[0] = mousePosition[0] - _selectionOffset[0];
                else
                    _options.selectionPosition[0] = _imageWidth - _options.selectionWidth;
            else
                _options.selectionPosition[0] = 0;

            // Set the selection position on the y-axis relative to the bounds
            // of the image
            if (mousePosition[1] - _selectionOffset[1] > 0)
                if (mousePosition[1] - _selectionOffset[1] + _options.selectionHeight < _imageHeight)
                    _options.selectionPosition[1] = mousePosition[1] - _selectionOffset[1];
                else
                    _options.selectionPosition[1] = _imageHeight - _options.selectionHeight;
            else
                _options.selectionPosition[1] = 0;

            // Trigger the 'onChange' event when the selection is changed
            _options.onChange(_getCropData());

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('moveSelection');
        };

        function _releaseSelection(event) {
            event.preventDefault();
            event.stopPropagation();
            $(document).unbind('mousemove');
            $(document).unbind('mouseup');

            // Update the selection origin
            _selectionOrigin[0] = _options.selectionPosition[0];
            _selectionOrigin[1] = _options.selectionPosition[1];

            // Reset the resize constraints
            _resizeHorizontally = true;
            _resizeVertically = true;

            // Verify if the selection size is bigger than the minimum accepted
            // and set the selection existence accordingly
            if (_options.selectionWidth > _options.minSelect[0] &&
                _options.selectionHeight > _options.minSelect[1])
                _selectionExists = true;
            else
                _selectionExists = false;

            // Trigger the 'onSelect' event when the selection is made
            _options.onSelect(_getCropData());

            // If the selection doesn't exist
            if (!_selectionExists) {
                // Unbind the event handler to the 'mouseenter' event of the
                // preview
                _jpreviewHolder.unbind('mouseenter');

                // Unbind the event handler to the 'mouseleave' event of the
                // preview
                _jpreviewHolder.unbind('mouseleave');
            }

            // Update only the needed elements of the plug-in interface
            // by specifying the sender of the current call
            _updateInterface('releaseSelection');
        }

    };

		var Handler = function (selection, direction, left, top) {
			this.element = $('<div />')
				.attr('id', 'image_crop_' + direction + '_resize_handler')
				.addClass('image_crop_resize_handler')
				.addClass('image_crop_resize_handler_' + direction)
				.css('opacity', 0.5)
        .insertAfter(selection);
			this.left	= left;
			this.top	= top;
		};
		Handler.prototype.handlerSize = 3.5;		
		Handler.prototype.update = function (display, selectionCentre, selectionWidth, selectionHeight) {
			this.element.css({
				display	: display,
				left		: selectionCentre[0] + Math.round(this.left * selectionWidth) 	- this.handlerSize - 1,
				top			: selectionCentre[1] + Math.round(this.top 	* selectionHeight) 	- this.handlerSize - 1
			});
		};

    $.fn.crop = function(customOptions) {
        //Iterate over each object
        this.each(function() {
            var currentObject = this,
                image = new Image();

            // And attach imageCrop when the object is loaded
            image.onload = function() {
                $.crop(currentObject, customOptions);
            };

            // Reset the src because cached images don't fire load sometimes
            image.src = currentObject.src;
        });

        return this;
    };
}) (jQuery);
// integer input list item thingy (e.g. curenator/substances.html)
// TODO fix hardcode paths to images..

(function($, undefined) {
	
	var NS = 'intinput'
	, timer = null
	, delay = 500
	, defs = {
		value: null,
		min: 0,
		max: 99,
		label: null,
		color: '#000',
		disabled: '#aaa',
		firstDelay: 750,
		repeatDelay: 125 
	}
	
	, meths = {
		create: function(opts) {
			var thiz = this, d = this.data(NS), l, r;
			if (!d) {
				d = $.extend({}, defs, opts);
				this.data(NS, d);
				d.current = d.value == null ? '?' : d.value;
				
				this.addClass(NS + '-li');
				l = $('<div class="' + NS + '-left">').text(d.label);
				if (d.value == null) {
					l.addClass('ui-disabled');
				}
				r = $('<div class="' + NS + '-right">').on({
					'click dblclick selectstart': false
				});
				
				r.append($('<div id="dec" class="' + NS + '-button">')
				.html('<img src="js/Paige_ui/images/' + NS + '-dec'
						+ (d.value == null || (d.min != null && d.min >= d.current) ? '-disabled' : '')
						+'.png" />')
				.on('vmousedown', function(e) {
					delay = d.firstDelay;
					timer = setTimeout(function() { dec(thiz, d); }, 0);
					$(document).one('vmouseup', function() { done(thiz, d); } );
					return false;
				}));
				
				r.append($('<div id="val" class="' + NS + '-button">')
				.text(d.current)
				.css('color', d.value == null ? d.disabled : d.color)
				.one('vmousedown', function(e) {
					thiz.trigger('intinput', [d.current]);
					return false;
				}));
				
				r.append($('<div id="inc" class="' + NS + '-button">')
				.html('<img src="js/Paige_ui/images/' + NS + '-inc'
						+ (d.max != null && d.max <= d.current ? '-disabled' : '')
						+'.png" />')
				.on('vmousedown', function(e) {
					delay = d.firstDelay;
					timer = setTimeout(function() { inc(thiz, d); }, 0);
					$(document).one('vmouseup', function() { return done(thiz, d); } );
					return false;
				}));
				
				this.append(l).append(r);
			} else {
				// TODO not used (yet?)
				console.log('init');
			}
			return this;
		}
		
	};
	
	$.fn.intinput = function(x) {
		if (!x || typeof x === 'object') {
			return meths.create.call(this, x);
		} else if (meths[x]) {
			// TODO not used (yet?)
			return meths[x].apply(this, Array.prototype.slice(arguments, 1));
		} else {
			$.error(NS + ': no such method "' + x + '"');
		}
	};

	
	//private
	function dec(thiz, d) {
		var t;
		if (d.min == null || d.min < d.current) {
			d.current--;
			thiz.find('#val').text(d.current).css('color', d.color);
			if (d.min != null && d.min >= d.current) {
				t = thiz.find('#dec img');
				t.attr('src', t.attr('src').replace(/.png$/, '-disabled.png'));
			}
			if (d.max != null && d.max > d.current) {
				t = thiz.find('#inc img');
				t.attr('src', t.attr('src').replace(/-disabled.png$/, '.png'));
			}
			timer = setTimeout(function() {dec( thiz, d); }, delay);
			delay = d.repeatDelay;
			thiz.trigger(NS, [d.current]);
		}
	}
	
	function inc(thiz, d) {
		var t;
		if (d.current == '?') {
			d.current = -1;
			thiz.find('.' + NS + '-left.ui-disabled').removeClass('ui-disabled');
		}
		if (d.max == null || d.max > d.current) {
			d.current++;
			thiz.find('#val').text(d.current).css('color', d.color);
			if (d.min != null && d.min < d.current) {
				thiz.find('#dec').css('color', d.color);
				t = thiz.find('#dec img');
				t.attr('src', t.attr('src').replace(/-disabled.png$/, '.png'));
			}
			if (d.max != null && d.max <= d.current) {
				thiz.find('#inc').css('color', d.disabled);
				t = thiz.find('#inc img');
				t.attr('src', t.attr('src').replace(/.png$/, '-disabled.png'));
			}
			timer = setTimeout(function() {inc( thiz, d); }, delay);
			delay = d.repeatDelay;
			thiz.trigger(NS, [d.current]);
		}
	}
	
	function done(thiz, d) {
		clearTimeout(timer);
		return false;
	}
	
})(jQuery);

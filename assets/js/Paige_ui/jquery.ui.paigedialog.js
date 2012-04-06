/* Erik: extends simpledialog2, adds some stuff to it */
(function($, window, undefined) {

$.widget('mobile.paigedialog', $.mobile.simpledialog2, {
	options: {
		placeholder: '',
		textType: 'input',
		zindex: 1001
	}

	, _create: function() {
		var c, i;
		$.mobile.simpledialog2.prototype._create.call(this);
		c = $('div.ui-simpledialog-container');
		i = c.find('input.ui-simpledialog-input');
		i.attr('placeholder', this.options.placeholder);
		if (this.options.textarea) {
			i.replaceWith($('<textarea class="' + i.attr('class')
					+ '" name="' + i.attr('name')
					+ '" placeholder="' + i.attr('placeholder') + '">'));
		}
	}

})
	
})(jQuery, this);

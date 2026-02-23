var winHeight = $(window).innerHeight();
var scrollContent = $('.scroll-content');
var currentContent = 0;

$('html, body').animate({ scrollTop: 0 }, 0);

$(window).on('mousewheel DOMMouseScroll', function(e) {
	var direction = 'down';
	var $th = $(this);
	var currentContentOffset = currentContent * winHeight;

	if (e.originalEvent.WheelDelta > 0 || e.originalEvent.detail < 0) {
		direction = 'up';
	}

	if (direction == 'down' && currentContent <= scrollContent.length - 2) {
		currentContent++;
		scrollContent[currentContent].scrollIntoView();
		if (currentContent >= 1) {
			$("#nav-bar").addClass('o-90');
		}
	} else if (direction == 'up' && currentContent >= 0) {
		currentContent--;
		scrollContent[currentContent].scrollIntoView();
		if (currentContent == 0) {
			$("#nav-bar").removeClass('o-90');
		}
	}

});

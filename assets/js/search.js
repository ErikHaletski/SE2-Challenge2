var searchQuery = param("q").toLowerCase();
var result = new Map();

pages.forEach(function(value, key) {
	if (value == searchQuery) {
		result.set(key, value);
	}
})

result.forEach(function(value, key) {
	$("#search-results").append("<a href=" + encodeURI(key) + " >" + value + " </a>");
})

hide(document.querySelector(".search-loading"));

$("#search-query").attr("placeholder", searchQuery);

// helper
function show(elem) {
    elem.style.display = 'block';
}

function hide(elem) {
    elem.style.display = 'none';
}

function param(parameter) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(parameter);
}

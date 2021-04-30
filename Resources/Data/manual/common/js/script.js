$(document).ready(function() {
	
	$( ".toc-section-trigger, li a" ).click(function() {
	  $(this).parent('li').toggleClass( "open" );
	}); 
	
	data = JSON.parse(atob(blob));

	initialpage = window.location.hash.slice(1);
	if(data[initialpage])
	{
		loadpage(initialpage);
	}
});

PRODUCTION = false;

function loadpage(url)
{
	if(PRODUCTION)
	{
		// Can't use history state with file:// :(
		// Also must be # to not trigger reload :(
		window.location = "#" + url; 
		html 		= $.parseHTML( data[url]['html'] );
		page_class 	= data[url]['class'];
		
		$("#content").html(html);
		$("body").attr("class", page_class );
	}
	else
	{
		window.location = url;
	}
}

$(window).on('hashchange', function() {
	page = window.location.hash.slice(1);

	// Screenshots also use hash so only load pages that exist
	if(data[page])
	{
		loadpage(page);
	}
	else if(page === "")
	{
		$("#content").html("");
	}
});


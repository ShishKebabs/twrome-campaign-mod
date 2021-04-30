"use strict";

startupPostPropertyLoadTasks.push(removePlayOnEnterHandler);

var hasPreviouslyLoaded = false;
var preventRightClickMouseDown = false;
var contextMenuUserID = 0;
var selectedMainTab = "friendsChatTab";
var selectedMainTabContent = "#friendsChatContent";
var theUserID = 0;
var theReconnectIntervalID = 0;
var reconnectSecondsLeft = 0;
var clockTimer = false;
var locale = "en";

function initialiseOverlayHooks()
{
	var thePromises = [];

	if ($("html").hasClass("platformAND"))
	{
		// Special case on Android: We handles our own overlay show/hide on the Java side, and these
		// functions interfere with the overlay visibilities. So we shall hook them up with a blank
		// callback to prevent their execution.
		function blankFunc() { return true; }

		thePromises.push(hookPropertyToFunction("ShowOverlay", "", blankFunc));
		thePromises.push(hookPropertyToFunction("HideOverlay", "", blankFunc));

		// Set the overlay on right away
		$(".generalOverlay").css("display", "block");
	}
	else
	{
		thePromises.push(hookPropertyToFunction("ShowOverlay", "", ShowOverlay));
		thePromises.push(hookPropertyToFunction("HideOverlay", "", HideOverlay));
	}

	thePromises.push(hookPropertyToFunction("FeralNetBrowserLoadURL", "string", BrowserLoadURL));
	thePromises.push(hookPropertyToFunction("ShowOverlayFriends", "", ShowOverlayFriends));
	thePromises.push(hookPropertyToFunction("ShowOverlayAchievements", "", ShowOverlayAchievements));
	thePromises.push(hookPropertyToFunction("UpdateUserProfile", "int,string,string", UpdateUserProfile));
	thePromises.push(hookPropertyToFunction("ReconnectToServer","", emptyFunction));
	thePromises.push(hookPropertyToFunction("ConnectionLost", "bool", onConnectionLost));
    thePromises.push(hookPropertyToFunction("IsUserLoggedIn", "bool", IsUserLoggedIn));
	thePromises.push(hookPropertyToFunction("JSLocale", "string", JSLocale));
	thePromises.push(hookPropertyToFunction("UnblockFriend", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("BlockFriend", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("RemoveFriend", "int", emptyFunction));
	
	setMainJQueryListeners();

	return Promise.allFinish(thePromises);
}

//Add overlay hook initialisation to the startup
startupPostPropertyLoadTasks.push(initialiseOverlayHooks);

function setMainJQueryListeners()
{
	/*************************
	 * Context menu handlers *
	 *************************/
	// Trigger action when the contexmenu is about to be shown
	$("#friendsChatContent").contents().find('#friendsPanel').on('click', '.nickname-container', function (event) 
	{
		// If we're already showing the context menu, let the event propagate so we can hide it
		if(!$(this).hasClass("showingMenu"))
		{
		    // Retrieve the user's ID
		    contextMenuUserID = parseInt($(this).parent().parent().attr("id").substr(15)); // The element's ID is feralNetFriend-<feralID>

		    // Remove the showingMenu class
		    $("#friendsChatContent").contents().find(".showingMenu").removeClass("showingMenu");

		    // Add the showingMenu class to the nickname element
		    $(this).addClass("showingMenu");

			// Show block/unblock as appropriate
			var blocked = isBlocked(contextMenuUserID);
			$(".overlayFrame").contents().find(".contextMenu #block").toggle( ! blocked );
			$(".overlayFrame").contents().find(".contextMenu #unblock").toggle( blocked );

		    // Show contextmenu
		    $(".overlayFrame").contents().find(".contextMenu").finish().fadeIn(100).
		    
		    // In the right position
		    css({
		        top: $(this).offset().top + 4 + "px",
		        left: $(this).offset().left - 1 + "px",
		        width: $(this).width() + 2 + "px"
		    });

		    // Briefly ignore mousedown events. This fixes an issue when enabling the WebKit inspector in-game
		    preventRightClickMouseDown = true;
		    setTimeout(function(){preventRightClickMouseDown = false;}, 100);
		}
	});

	// Don't show the context menu in any other instance. 
	// Comment these two lines for testing purposes
	if(!testerMode)
	{
		$(document).on('contextmenu', function() { return false });
		$(".overlayFrame").contents().find('body').on('contextmenu', function() { return false });
	}

	// If the document is clicked somewhere
	$("#friendsChatContent").contents().find('.feralNetMainFrame').on('click', function (event) 
	{
	    // If the clicked element is not the menu
	   	if ($("#friendsChatContent").contents().find(".contextMenu").is(':visible') &&
	    	!$(event.target).parents("#friendsChatContent").length > 0 &&
	    	!preventRightClickMouseDown)
	    {
	        // Hide it
	        $("#friendsChatContent").contents().find(".contextMenu").fadeOut(100);
	        contextMenuUserID = 0;

	        // Remove the showingMenu class
	        $("#friendsChatContent").contents().find(".showingMenu").removeClass("showingMenu");

	        // Briefly ignore mousedown events. This fixes an issue when enabling the WebKit inspector in-game
	        preventRightClickMouseDown = true;
	        setTimeout(function(){preventRightClickMouseDown = false;}, 100);
	        event.preventDefault();
	    }
	    else if (preventRightClickMouseDown)
	   	{
	   		event.preventDefault();
	   	}
	});

	// If the menu element is clicked
	$("#friendsChatContent").contents().find(".contextMenu li").click(function()
	{
	    // This is the triggered action name
	    switch($(this).attr("id")) 
	    {
	        // A case for each action.
	        case "remove": 
	        	setPropertyValue("RemoveFriend","int",[contextMenuUserID]);
	        	break;
			case "block":
				setPropertyValue("BlockFriend","int",[contextMenuUserID]);
				break;
			case "unblock":
				setPropertyValue("UnblockFriend","int",[contextMenuUserID]);
				break;
	    }
	  
	   // Remove the showingMenu class
	   $("#friendsChatContent").contents().find(".showingMenu").removeClass("showingMenu");

	   // Hide it AFTER the action was triggered
	   $(".overlayFrame").contents().find(".contextMenu").fadeOut(100);

	   contextMenuUserID = 0;
	});

	/*************************
	 *  Upper tabs handlers  *
	 *************************/
	// Switch tabs
	$('.mainTab').click(function()
	{
		var theID = $(this).attr('id');
		var theContentID = $(this).attr('href');

		setActiveIframe(theID, theContentID);
	});
	
	/*************************
	 *  Close overlay button  *
	 *************************/
	$('#backToGameButton').click(function() {
		// We fire the hide overlay event so that the C++ state remains in sync
		setPropertyValue("HideOverlay","",[]);
	});

	/****************************
	 *          Dialogs         *
	 ****************************/
	 $('#reconnectButton').click(function()
	 {
		// Only allow pressing the reconnect button if it's enabled
		if(!$("#reconnectButton").hasClass("disabled"))
		{
			// Fire the callback to reconnect to the server
			setPropertyValue("ReconnectToServer","",[]);
			
			// Reset the timer
			reconnectSecondsLeft = 30;
			$("#reconnectTimer").html(reconnectSecondsLeft);
			
			// And show the button as disabled
			$("#reconnectButton").addClass('disabled');
		}
	 });

	 $('#ConnectionLostDialog').dialog({closeOnEscape: false});
}


function setActiveIframe(theID, theContentID)
{
	// Only start the switch if the tab is a different one and has an equivalent content div
	if(theContentID !== undefined && theID != selectedMainTab)
	{
		var previousIndex = $(selectedMainTabContent).index();
		var newIndex = $(theContentID).index();

		// Switch the highlighted tab
		$('#' + selectedMainTab).removeClass("selected");
		$('#' + theID).addClass("selected");

		// Show the contents of the selected tab
		if(newIndex > previousIndex) // Move to the left
		{
			$(selectedMainTabContent).removeClass('center');
			$(selectedMainTabContent).addClass('left');
			$($(selectedMainTabContent)[0].contentDocument).find("input").attr('tabindex','-1');
				
			$(theContentID).removeClass('right');
			$(theContentID).addClass('center');
			$($(theContentID)[0].contentDocument).find("input").removeAttr('tabindex');
		}
		else // Move to the right
		{
			$(selectedMainTabContent).removeClass('center');
			$(selectedMainTabContent).addClass('right');
			$($(selectedMainTabContent)[0].contentDocument).find("input").attr('tabindex','-1');

			$(theContentID).removeClass('left');
			$(theContentID).addClass('center');
			$($(theContentID)[0].contentDocument).find("input").removeAttr('tabindex');
		}

		selectedMainTab = theID;
		selectedMainTabContent = theContentID;
	}

	// Toggle the contents of the pending invites panel if we're clicking on its button
	if(theID == "pendingInvitesTab" && !$('#pendingInvitesTab').hasClass('disabled'))
	{
		if($("#pendingInvitesContent").is(":visible"))
		{
			$("#pendingInvitesTab").css({"border-bottom": "solid 2px #F05A24", "border-bottom-left-radius" : "5px"});
		}
		else
		{
			$("#pendingInvitesTab").css({"border-bottom": "solid 2px #0071BB", "border-bottom-left-radius" : "0px"});
		}

		$("#pendingInvitesContent").slideToggle( "fast", function()
			{
				if($('#pendingInvitesList').children().length == 0)
				{
					$("#pendingInvitesTab").addClass('disabled');
				}
			});
	}
	else if (theID == "sharedItemsTab")
	{
		sharedItemsModule.onSelect();
	}
}

function setTime()
{
	var currentLocale = "en";
	if (locale != "")
	{
		currentLocale = locale;
	}
	
	var dt = new Date( );
	
	var h = dt.getHours();
	var m = dt.getMinutes();
	var s = dt.getSeconds();
	
	// Left-pad
	if (h < 10) h = "0" + h;
	if (m < 10) m = "0" + m;
	if (s < 10) s = "0" + s;
	
	$("#clockInset>span.time").text( h + ":" + m + ":" + s );
	$("#clockInset>span.date").text( dt.toLocaleDateString( currentLocale, {weekday: "long", year: "numeric", month: "long", day: "numeric"} ) );
}

function setClockRunning(running)
{
	if ( clockTimer ) {
		clearInterval( clockTimer );
		clockTimer = false;
	}
	if ( running ) {
		setTime();
		clockTimer = setInterval( setTime, 1000 );
	}
}

function setOverlayVisible(visible, tabID)
{
	if (visible)
	{
		if (tabID)
		{
			var tabHeaderButton = $('.feralNetHeader').find('#' + tabID);
			if (tabHeaderButton)
			{
				setActiveIframe(tabHeaderButton.attr("id"), tabHeaderButton.attr("href"));
			}
		}
		
		$('.generalOverlay').fadeIn(200);
	}
	else
	{
		$('.generalOverlay').fadeOut(200);
	}
	setClockRunning(visible);
}

function BrowserLoadURL(propertyName, typePattern, propValueArray)
{
	var browserFrame = $('.browserFrame');
	var targetURL = propValueArray[0];

	// TODO: We could pass in a custom title into propValueArray and set it using this.
	//$('#FeralNetBrowser').dialog('option', 'title', 'Custom Title');

	browserFrame.html($('<iframe id="browserFrame"/>').attr('src', targetURL).attr('width', '100%').attr('height', '100%'));

	// Unfocus the close button after a small delay - doing it immediately has no effect.
	setTimeout(function(){$('.ui-dialog-titlebar > button').blur();}, 200);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function ShowOverlay(propertyName, typePattern, propValueArray)
{
	setOverlayVisible(true);

	//Make the scripting interface return something other than undefined
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function HideOverlay(propertyName, typePattern, propValueArray)
{
	setOverlayVisible(false);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function ShowOverlayFriends(propertyName, typePattern, propValueArray)
{
	setOverlayVisible(true, 'friendsChatTab');

	//Make the scripting interface return something other than undefined
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function ShowOverlayAchievements(propertyName, typePattern, propValueArray)
{
	setOverlayVisible(true, 'achievementsTab');

	//Make the scripting interface return something other than undefined
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function UpdateUserProfile(propertyName, typePattern, propValueArray)
{
	var currentTime = new Date().getTime();

	theUserID = propValueArray[0];
	$("#userTab>.name").html(propValueArray[1]);
	if(theUserID != -1)
	{
		$("#userTab>.icon").attr('src', propValueArray[2] + '?' + currentTime);
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}


function IsUserLoggedIn(propertyName, typePattern, propValueArray)
{
    var isLoggedIn = propValueArray[0];
    if(!isLoggedIn)
    {
        setActiveIframe("achievementsTab", "#achievementsContent");
    }

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function JSLocale(propertyName, typePattern, propValueArray)
{
	locale = propValueArray[0];
	
	//Make the scripting interface return something other than undefined
	//since some interfaces can't tell the difference between that and an exception
	return true;
}



function onConnectionLost(propertyName, typePattern, propValueArray)
{
	// See if we've lost connection
	if(propValueArray[0] == true)
	{
		// Don't allow people to click "Reconnect" as soon as it appears
		$("#reconnectButton").addClass('disabled');
		
		reconnectSecondsLeft = 30;
		if(theReconnectIntervalID != 0)
		{
			clearInterval(theReconnectIntervalID);
		}

		// Start the countdown
		theReconnectIntervalID = setInterval(function(){
			$("#reconnectTimer").html(--reconnectSecondsLeft);
			
			// Only allow pressing the reconnect button if we've counted down 5s (to stop spamming)
			if(reconnectSecondsLeft == 25)
			{
				$("#reconnectButton").removeClass('disabled');
			}
			
			if(reconnectSecondsLeft <= 0)
			{
				// Attempt a connection and restart the countdown
				setPropertyValue("ReconnectToServer","",[]);
				reconnectSecondsLeft = 30;
				$("#reconnectTimer").html(reconnectSecondsLeft);
				$("#reconnectButton").addClass('disabled');
			}
		}, 1000);

	}
	else
	{
		// We've reconnected, so stop the countdown
		if(theReconnectIntervalID != 0)
		{
			clearInterval(theReconnectIntervalID);
			theReconnectIntervalID = 0;
			reconnectSecondsLeft = 0;
			
			// We also reset this here so it matches the initial timeout if we disconnect again
			$("#reconnectTimer").html(30);
		}
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

// Called after an iframe loads
function loadIframeProperties(element)
{
	var iframeContents = $(element).contents();
	initialiseGenericElementReplacementsWithinElement(iframeContents);
	initialisePropertiesWithinElement(iframeContents);
	initialiseInputElementHandlersWithinElement(iframeContents);
}

$(window).unload(function()
{
	hasPreviouslyLoaded = true;

	console.log('Handler for unload() called.');

	// TODO: We want to hide as opposed to just toggling, to ensure we always return to the default state.
	setPropertyValue("ToggleOverlayVisibility", "", []);
});

function emptyFunction(propertyName, typePattern, propValueArray)
{
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

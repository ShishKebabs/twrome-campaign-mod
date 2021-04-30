"use strict";


// Constants for received controller states
//
// Matches values hardcoded in GamepadInputHandler.cpp
//
// If you change these, also change that file.
var kLeftPadLeftState = 0;
var kLeftPadRightState = 1;
var kLeftPadUpState = 2;
var kLeftPadDownState = 3;
var kRightPadLeftState = 4;
var kRightPadRightState = 5;
var kRightPadUpState = 6;
var kRightPadDownState = 7;
var kAButtonState = 8;
var kBButtonState = 9;
var kXButtonState = 10;
var kLeftShoulderState = 11;
var kRightShoulderState = 12;
var kStartButtonState = 13;
var kBackButtonState = 14;
var kDpadUpState = 15;
var kDpadDownState = 16;
var kDpadLeftState = 17;
var kDpadRightState = 18;

var kScrollInterval = 100;

var theTabHeaders = [];
var theTabContents = [];
var theTabIndex = 0;

var alertIndex;
var buttons;
var debugNeighbours = 0;
var coloursCached = 0;

var prevColours = {
		this:"",
		up:"",
		down:"",
		left:"",
		right:""};

startupPostPropertyLoadTasks.push(InitialiseGamepadController);

function loadTabs()
{
	// The tabs don't load in position order, so sort them before pushing
	$(".tabSelect[data-tab-position]").sort(function(a,b) {
		return Number(a.getAttribute('data-tab-position')) > Number(b.getAttribute('data-tab-position')) ? 1 : -1;
	}).each(function() {
		var theTabHeader = $(this);
		if(!theTabHeader.hasClass("noDisplay"))
		{
			theTabHeaders.push(theTabHeader);
			theTabContents.push($(document.getElementById(theTabHeader.attr("data-tab-id"))))
		}
	});
}

function findCurrentTabIndex()
{
	// Grab the currently selected tab name, using the selectedTabButton class
	var selectedTabId = $("#tabbar>.selectedTabButton").attr("data-tab-id");

	// Search for the tabs index in the theTabHeaders
	for (var i = 0; i < theTabHeaders.length; i++) {
		if(theTabHeaders[i].attr("data-tab-id") == selectedTabId)
		{
			return i;
		}
	}
	
	return -1;
}

// This wraps some functionality to help when generating the navigation graph
function NavigationHelperGraph()
{
	this.groupByNode = {};
	this.nodesByGroup = {};
	
	this.addLink = function (theLink) {
		if (theLink[0] in this.groupByNode && theLink[1] in this.groupByNode)
		{
			// Both ends part of an existing group, merge if different
			var group0 = this.groupByNode[theLink[0]];
			var group1 = this.groupByNode[theLink[1]];
			if (group0 != group1)
			{
				this.nodesByGroup[group1].forEach(function (groupNode){
					this.groupByNode[groupNode] = group0;
				}.bind(this));
				this.nodesByGroup[group0].push(...(this.nodesByGroup[group1]))
				delete this.nodesByGroup[group1];
			}
		}
		else if (theLink[0] in this.groupByNode)
		{
			// One end is already in a group, use that group for the newly discovered node
			var group = this.groupByNode[theLink[0]];
			this.nodesByGroup[group].push(theLink[1]);
			this.groupByNode[theLink[1]] = group;
		}
		else if (theLink[1] in this.groupByNode)
		{
			// One end is already in a group, use that group for the newly discovered node
			var group = this.groupByNode[theLink[1]];
			this.nodesByGroup[group].push(theLink[0]);
			this.groupByNode[theLink[0]] = group;
		}
		else
		{
			// Both nodes are new - create a new group
			// use the node index as the group ID - this should be unique
			var group = theLink[0];
			this.nodesByGroup[group] = [theLink[0], theLink[1]];
			this.groupByNode[theLink[0]] = group;
			this.groupByNode[theLink[1]] = group;
		}
	};
	
	this.isConnected = function(nodeA, nodeB){
		return nodeA in this.groupByNode &&
			nodeB in this.groupByNode &&
			this.groupByNode[nodeA] == this.groupByNode[nodeB];
	};
}

function generateNavigationGraph(theTab)
{
	// Populate a list of all focusable elements from the tab
	theTab.navigationElements = theTab.find(":focusable");
	
	// Add the elements from the footer as well.
	theTab.navigationElements = $.merge(theTab.navigationElements, $("#footer :focusable"));
	
	// Make a note of the center point of each element
	var boundingBoxes = []
	var centerPoints = []
	theTab.navigationElements.each(function (theIndex, theElement){
		// Using center points for simplicity
		var boundingBox;
		if($(theElement).prop("type") == "checkbox")
		{
			// For checkboxes, we use the parent. This includes the label, which makes more sense from
			// a navigational point of view, even though the focus element is only the checkbox.
			boundingBox = $(theElement).parent().get(0).getBoundingClientRect();
		}
		else
		{
			boundingBox = theElement.getBoundingClientRect();
		}
		var centerPoint = [boundingBox.x + (boundingBox.width / 2), boundingBox.y + (boundingBox.height / 2)];
		
		centerPoints.push(centerPoint);
		boundingBoxes.push(boundingBox);
	});
	
	// Make a note of every link between nodes
	var links = [];
	$(centerPoints).each(function (theIndexA, theCenterPointA){
		var theBoundingBoxA = boundingBoxes[theIndexA];
		var theCenterPointA = centerPoints[theIndexA];
		// Make sure we only see each pair once (i.e. don't do the reverse)
		$(centerPoints).slice(theIndexA + 1).each(function (theOffsetIndexB, theCenterPointB){
			// The index is offset because of the slice
			var theIndexB = theOffsetIndexB + theIndexA + 1;
			var theBoundingBoxB = boundingBoxes[theIndexB];
			var theCenterPointB = centerPoints[theIndexB];
			
			// We split the region around a box like so:
			// ____                            ____ |
			//     \____       Up         ____/     |
			//          \________________/          |
			//     Left  ___|_Button_|___  Right    |
			//      ____/                \____      |
			// ____/          Down            \____ |
			//
			// Note we need the relationship to be symmetric
			// Note that this is skewed so that horizontal input allows less vertical freedom in selection of elements.
			// This helps to keep horizontal navigation "in order", where as we care less about this vertically.
			var isDownRight = false;
			var isDownLeft = false;
			var horizontalRatio = 2;
			
			var right = theBoundingBoxB.x - (theBoundingBoxA.x + theBoundingBoxA.width);
			var left = theBoundingBoxA.x - (theBoundingBoxB.x + theBoundingBoxB.width);
			var up = theBoundingBoxA.y - (theBoundingBoxB.y + theBoundingBoxB.height);
			var down = theBoundingBoxB.y - (theBoundingBoxA.y + theBoundingBoxA.height);
			if (right >= 0)
			{
				// Bounding box is to the completely to the right 
				isDownRight = right > up * horizontalRatio;
				isDownLeft = right < down * horizontalRatio;
			}
			else if (left >= 0)
			{
				// Bounding box is completely to left
				isDownLeft = left > up * horizontalRatio;
				isDownRight = left < down * horizontalRatio;
			}
			else if (down >= 0)
			{
				// Bounding box is completely below, but overlaps horizontally
				isDownRight = true;
				isDownLeft = true;
			}
			else if (up >= 0)
			{
				// Bounding box is completely above, but overlaps horizontally
				isDownRight = false;
				isDownLeft = false;
			}
			else
			{
                //PFI 3-Jul-2019 In case we overlap do the check with respect to the center of the element to fix TR-1559/LDCV-228.
                if (right > -theBoundingBoxA.width/2.0)
                {
                    isDownRight = right > up * horizontalRatio;
                    isDownLeft = right < down * horizontalRatio;
                }
                else if (left > -theBoundingBoxA.width/2.0)
                {
                    isDownLeft = left > up * horizontalRatio;
                    isDownRight = left < down * horizontalRatio;
                }
                else if (down > -theBoundingBoxA.height/2.0)
                {
                    isDownRight = true;
                    isDownLeft = true;
                }
                else if (up > -theBoundingBoxA.height/2.0)
                {
                    isDownRight = false;
                    isDownLeft = false;
                }
                console.log("Overlapping bounding boxes, might cause weird gamepad navigation issues");
			}
			
			// Up: 0
			// Right: 1
			// Down: 3
			// Left: 2
			// Note that the inverse direction is 3 - direction.
			var direction = (isDownRight ? 1 : 0) + (isDownLeft ? 2 : 0);
			
			// Using center points for simplicity
			// Calculate the direction from A->B
			var x = theCenterPointB[0] - theCenterPointA[0];
			var y = theCenterPointB[1] - theCenterPointA[1];
			
			// We use a weighting so that the set of equidistant points looks something like
			//                _/|\_                  |
			//             __/  |  \__               |
			//        ____/     |     \____          |
			//  _____/          |          \_____    |
			// /________________|________________\   |
			// \_____           |           _____/   |
			//       \____      |      ____/         |
			//            \__   |   __/              |
			//               \_ | _/                 |
			//                 \|/                   |
			//
			var distance = x*x + 4*y*y + 16 * Math.abs(x*y);
			
			links.push([theIndexA, theIndexB, direction, distance]);
		});
	});
	
	// Sort these into ascending order for the next step
	links.sort(function (theLinkA, theLinkB){
		return theLinkA[3] - theLinkB[3];
	});
	
	// Starting with the shortest link (to avoid hopping over other nodes), use links that:
	// a) do not conflict with an existing link
	// b) do not form a loop
	// We do this in an attempt to make sure there is definetely a way to visit all nodes
	// We'll add extra connections for ease of navigation later
	var nodeLinkCount = [];
	$(centerPoints).each(function (theIndexA){
		nodeLinkCount.push([0, 0, 0, 0]);
	});
	
	var usedLinks = [];
	var unusedLinks = [];
	
	var graph = new NavigationHelperGraph();
	
	links.forEach(function (theLink)
	{
		var nodeA = theLink[0];
		var nodeB = theLink[1];
		var direction = theLink[2];
		
		if (nodeLinkCount[nodeA][direction] < 1 &&
			nodeLinkCount[nodeB][3-direction] < 1)
		{
			if (!graph.isConnected(nodeA, nodeB))
			{
				// console.log("Linking " + nodeA + " and " + nodeB + " in direction " + direction);
				nodeLinkCount[nodeA][direction]++;
				nodeLinkCount[nodeB][3-direction]++;
				graph.addLink(theLink);
				usedLinks.push(theLink);
				
				return;
			}
		}
		
		// Put this back for later consideration, if possible
		unusedLinks.push(theLink);
	});
	
	// Add back unidirectional links to improve "feel", e.g so down will always get you to the bottom row of elements.
	// Again, shortest first to avoid hopping over other nodes
	var oneWayLinks = [];
	unusedLinks.forEach(function (theLink)
	{
		var nodeA = theLink[0];
		var nodeB = theLink[1];
		var direction = theLink[2];
		
		if (nodeLinkCount[nodeA][direction] < 1)
		{
			// console.log("One way linking " + nodeA + " and " + nodeB + " in direction " + direction);
			nodeLinkCount[nodeA][direction]++;
			oneWayLinks.push([nodeA, nodeB, direction]);
		}
		if (nodeLinkCount[nodeB][3-direction] < 1)
		{
			// console.log("One way linking " + nodeB + " and " + nodeA + " in direction " + (3-direction));
			nodeLinkCount[nodeB][3-direction]++;
			oneWayLinks.push([nodeB, nodeA, 3-direction]);
		}
	});
	
	/*
	console.log("Using the following links")
	usedLinks.forEach(function(theLink){
		console.log("Between " + theLink[0] + "(" + centerPoints[theLink[0]][0] + ", " + centerPoints[theLink[0]][1] + ") and " + theLink[1] + "(" + centerPoints[theLink[1]][0] + ", " + centerPoints[theLink[1]][1] + ") " + " (direction " + theLink[2] + ", distance " + theLink[3] + ")");
	});
	oneWayLinks.forEach(function(theLink){
		console.log("From " + theLink[0] + "(" + centerPoints[theLink[0]][0] + ", " + centerPoints[theLink[0]][1] + ")  to " + theLink[1] + "(" + centerPoints[theLink[1]][0] + ", " + centerPoints[theLink[1]][1] + ")");
	});
	 */
	
	theTab.navigationNeighbours = []
	theTab.navigationElements.each(function (theIndex, theElement){
		theTab.navigationNeighbours.push({
			"leftNeighbour":-1,
			"rightNeighbour":-1,
			"upNeighbour":-1,
			"downNeighbour":-1
		});
	});
	
	usedLinks.forEach(function(theLink){
		var nodeA = theLink[0];
		var nodeB = theLink[1];
		var directionAB;
		var directionBA;
		switch (theLink[2])
		{
			case 0:
				directionAB = "upNeighbour";
				directionBA = "downNeighbour";
				break;
			case 1:
				directionAB = "rightNeighbour";
				directionBA = "leftNeighbour";
				break;
			case 2:
				directionAB = "leftNeighbour";
				directionBA = "rightNeighbour";
				break;
			case 3:
				directionAB = "downNeighbour";
				directionBA = "upNeighbour";
				break;
		}
		
		theTab.navigationNeighbours[nodeA][directionAB] = nodeB;
		theTab.navigationNeighbours[nodeB][directionBA] = nodeA;
	});
	
	oneWayLinks.forEach(function(theLink){
		var nodeA = theLink[0];
		var nodeB = theLink[1];
		var directionAB;
		switch (theLink[2])
		{
			case 0:
				directionAB = "upNeighbour";
				break;
			case 1:
				directionAB = "rightNeighbour";
				break;
			case 2:
				directionAB = "leftNeighbour";
				break;
			case 3:
				directionAB = "downNeighbour";
				break;
		}
		
		theTab.navigationNeighbours[nodeA][directionAB] = nodeB;
	});
	
	// Set the initial position at the first element
	theTab.currentElement = 0;
}

function InitialiseGamepadController()
{
	var enabled;

	// Get gamepad state from the C++ side GamepadInputHandler.cpp
	var thePromise = hookPropertyToFunction("EnableGamepadInPGOW",
                                            "bool",
		function(propertyName, typePattern, propValueArray)
		{

			enabled = propValueArray[0];

		});

	thePromise.then(function()
	{
		if(enabled)
		{
			// Use object so we can pass it around by reference
			var focusElement = {element: undefined};

			// Load the tabs
			loadTabs();
		}

		// Get gamepad state from the C++ side GamepadInputHandler.cpp
		var gamepadPromise = hookPropertyToFunction("InputChange",
                                                    "array<bool>",
			function(propertyName, typePattern, propValueArray)
			{

				// Act on the gamepad state
				if(enabled)
				{
					handleInput(propValueArray, focusElement);
				}

				return true;

			});

		return gamepadPromise;

	});

	return thePromise;
}

function getUpNeighbourIndex(currentTab, currentIndex)
{
	return currentTab.navigationNeighbours[currentIndex].upNeighbour;
}

function getDownNeighbourIndex(currentTab, currentIndex)
{
	return currentTab.navigationNeighbours[currentIndex].downNeighbour;
}

function getLeftNeighbourIndex(currentTab, currentIndex)
{
	return currentTab.navigationNeighbours[currentIndex].leftNeighbour;
}

function getRightNeighbourIndex(currentTab, currentIndex)
{
	return currentTab.navigationNeighbours[currentIndex].rightNeighbour;
}

function handleInput(gamepadStateArray, focusElement)
{
	theTabIndex = findCurrentTabIndex();

	if(testerMode && gamepadStateArray[0][kXButtonState])
	{
		if(!debugNeighbours)
		{
			debugNeighbours = 1;
			if(!$(document.activeElement).is("body"))
			{
				showNeighbours(theTabIndex, false);
				coloursCached = 1;
			}
		}
		else
		{
			debugNeighbours = 0;
			showNeighbours(theTabIndex, true);
		}
	}

	// Check start button
	if(gamepadStateArray[0][kStartButtonState])
	{
		// Reset the focusElement.element in case the launch is cancelled
		focusElement.element = undefined;
		launchGame();
	}

	// Check back button
	if(gamepadStateArray[0][kBackButtonState])
	{
		// Reset the focusElement.element in case quit is cancelled
		focusElement.element = undefined;
		$("#main-quitButton").click();
	}

	// Check shoulder buttons
	if(gamepadStateArray[0][kLeftShoulderState] || gamepadStateArray[0][kRightShoulderState])
	{
		var newPosition = (theTabIndex + (gamepadStateArray[0][kLeftShoulderState] ? (-1) : 1));
		// Ensure that we're selecting a valid tab - loop around once we get to either end
		newPosition = (newPosition + theTabContents.length) % theTabContents.length;
		
		// Also ignore attempts to switch tabs while showing an alert.
		if(!($("#AlertDialog").length && $("#AlertDialog").dialog("isOpen")))
		{
			if(debugNeighbours)
			{
				showNeighbours(theTabIndex, true);
			}
			// Fixing the strange tab switch bug, caused by focussed elements
			if(focusElement.element !== undefined)
			{
				focusElement.element.blur();
				focusElement.element = undefined;
			}
			// Also needed to deal with tab switch animation not working as intended
			// Give it a bit of time to blur
			setTimeout(switchTab, 20, theTabHeaders[newPosition]);
			// Some elements have the autofocus property, and try and focus before
			// the animation is sorted. Causes some weird bugs.
			if(!$(document.activeElement).is("body"))
			{
				$(document.activeElement).blur();
			}
			focusElement.element = undefined;
		}
	}

	// Check A button
	if(gamepadStateArray[0][kAButtonState])
	{
		// If the selectric is open
		if(focusElement.element !== undefined && focusElement.element.hasClass("selectric-input")
				&& focusElement.element.parent(".selectric-wrapper").hasClass("selectric-open"))
		{
			var value = focusElement.element.parent().find(".selected").text();
			var e = $.Event("keydown", { keyCode: 13}); // 13 is enter key
			focusElement.element.trigger(e);
			focusElement.element.parent().find("select").val(value).selectric('refresh');
			focusElement.element.focus();
		}
		// Selectric specific
		else if($(document.activeElement).hasClass("selectric-input"))
		{
			focusElement.element.parent().find("select").selectric('open');
		}
		// Pop up windows
		else if($("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").is(":focus") ||
					$("[data-prevent-close-name='DocumentationDialogPreventClose-openInBrowser']").is(":focus"))
		{
			$(document.activeElement).click();
		}
		else
		{
			$(document.activeElement).click();
			alertIndex = undefined;
			buttons = undefined;
		}
	}

	// Check B button
	if(gamepadStateArray[0][kBButtonState])
	{
		if(focusElement.element !== undefined && focusElement.element.hasClass("selectric-input")
				&& focusElement.element.parent(".selectric-wrapper").hasClass("selectric-open"))
		{
			focusElement.element.parent().find("select").selectric('close');
			focusElement.element.focus();
		}
		// Pop up windows
		else if($("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").is(":focus") ||
					$("[data-prevent-close-name='DocumentationDialogPreventClose-openInBrowser']").is(":focus"))
		{
			$("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").click();
		}
		else if($("[data-inner-string='localise-Startup.Close']").parent().is(":focus"))
		{
			$("[data-inner-string='localise-Startup.Close']").parent().click();
		}
	}

	//Navigation

	//Left pad + Dpad navigation
	var navUpState = gamepadStateArray[0][kLeftPadUpState] || gamepadStateArray[0][kDpadUpState];
	var navDownState = gamepadStateArray[0][kLeftPadDownState] || gamepadStateArray[0][kDpadDownState];
	var navLeftState = gamepadStateArray[0][kLeftPadLeftState] || gamepadStateArray[0][kDpadLeftState];
	var navRightState = gamepadStateArray[0][kLeftPadRightState] || gamepadStateArray[0][kDpadRightState];
	
	if(navUpState || navDownState || navLeftState || navRightState)
	{
		if(focusElement.element !== undefined && focusElement.element.hasClass("selectric-input")
			&& focusElement.element.parent(".selectric-wrapper").hasClass("selectric-open"))
		{
			//focusElement.element.blur();
			handleSelectricNavigation(focusElement,
										navUpState,
										navDownState,
										navLeftState,
										navRightState);
		}
		// Pop ups and web pages
		else if($("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").is(":focus") ||
				$("[data-prevent-close-name='DocumentationDialogPreventClose-openInBrowser']").is(":focus"))
		{
			if(navLeftState || navRightState)
			{
				if($("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").is(":focus"))
				{
					$("[data-prevent-close-name='DocumentationDialogPreventClose-openInBrowser']").focus();
				}
				else
				{
					$("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").focus();
				}
			}
			if(navUpState)
			{
				$("iframe").contents().scrollTop($("iframe").contents().scrollTop() - kScrollInterval);
			}
			if(navDownState)
			{
				$("iframe").contents().scrollTop($("iframe").contents().scrollTop() + kScrollInterval);
			}
		}
		// Alerts
		else if ($("#AlertDialog").length && $("#AlertDialog").dialog("isOpen"))
		{
			if(buttons === undefined)
			{
				buttons = $("#AlertDialog").parent().find("input, button").not(".noDisplay, :hidden");
				alertIndex = undefined;
				if(!$(document.activeElement).is("body"))
				{
					focusElement.element = $(document.activeElement);
				}
			}
			handleAlertNavigation(focusElement,
									navUpState,
									navDownState,
									navLeftState,
									navRightState);
		}
		else if ($("#AlertDialog").length && !$("#AlertDialog").dialog( "isOpen" ) &&
						alertIndex !== undefined)
		{
			alertIndex = undefined;
			buttons = undefined;
			focusElement.element = undefined;
			handleInput(gamepadStateArray, focusElement);
		}
		else
		{
			handleNavigation(focusElement, theTabIndex,
								navUpState,
								navDownState,
								navLeftState,
								navRightState);
		}
	}

	// Right thumb pad
	if(gamepadStateArray[0][kRightPadUpState] || gamepadStateArray[0][kRightPadDownState])
	{
		if($("[data-prevent-close-name='DocumentationDialogPreventClose-ok']").is(":focus") ||
			 $("[data-prevent-close-name='DocumentationDialogPreventClose-openInBrowser']").is(":focus") ||
			 $("#tabContentNews").hasClass("selected"))
		{
			if(gamepadStateArray[0][kRightPadUpState])
			{
				$("iframe").contents().scrollTop($("iframe").contents().scrollTop() - kScrollInterval);
			}
			if(gamepadStateArray[0][kRightPadDownState])
			{
				$("iframe").contents().scrollTop($("iframe").contents().scrollTop() + kScrollInterval);
			}
		}
	}
	if(gamepadStateArray[0][kRightPadLeftState] || gamepadStateArray[0][kRightPadRightState])
	{
		// Sliders
		if(focusElement.element !== undefined && focusElement.element.attr("type") == "range")
		{
			if (gamepadStateArray[0][kRightPadRightState])
			{
				focusElement.element.val(function (i, val){
					return parseInt(val) + parseInt(focusElement.element.attr("step"));
				});
				focusElement.element.trigger("input");
			}
			if (gamepadStateArray[0][kRightPadLeftState])
			{
				focusElement.element.val(function (i, val){
					return parseInt(val) - parseInt(focusElement.element.attr("step"));
				});
				focusElement.element.trigger("input");
			}
		}
	}

	// Get rid of focus on click
	$(document).mousedown(function() {
		if(focusElement.element !== undefined)
		{
			if(!$(document).is(':animated') ) {
				focusElement.element.blur();
				focusElement.element = undefined;
			}
		}
	});
}

function handleNavigation(focusElement, theTabIndex, upPressed, downPressed, leftPressed, rightPressed)
{
	if(debugNeighbours)
	{
		debugNeighbours = 0;
		showNeighbours(theTabIndex, true);
		coloursCached = 0;
	}

	// An object of the json of the current tab
	var currentTab = theTabContents[theTabIndex];
	var newFocus = focusElement.element;
	
	// Generate navigation data if not done so already.
	// This is done lazily to ensure that all elements are in their expected locations
	if (!("navigationElements" in currentTab))
		generateNavigationGraph(currentTab);
	
	// An object of the neighbours and selector of the current element
	var theElement = currentTab.navigationElements[currentTab.currentElement];
	var elementIndex = currentTab.currentElement;

	// If the focusElement object is undefined
    if(focusElement.element === undefined && !$(theElement).prop("disabled"))
    {
        newFocus = $(theElement);
    }
    else
    {
	    // Navigate the elements
		var theNeighbour = -1
	    if (upPressed && theNeighbour == -1)
	    {
			theNeighbour = getUpNeighbourIndex(currentTab, currentTab.currentElement)
	    }
	    if (downPressed && theNeighbour == -1)
	    {
			theNeighbour = getDownNeighbourIndex(currentTab, currentTab.currentElement)
	    }
	    if (leftPressed && theNeighbour == -1)
	    {
			theNeighbour = getLeftNeighbourIndex(currentTab, currentTab.currentElement)
	    }
	    if (rightPressed && theNeighbour == -1)
	    {
			theNeighbour = getRightNeighbourIndex(currentTab, currentTab.currentElement)
	    }
	    
	    if (theNeighbour != -1)
		{
			currentTab.currentElement = theNeighbour;
			theElement = currentTab.navigationElements[currentTab.currentElement];
			newFocus = $(theElement);
		}
    }

	// Update focus
	if(focusElement.element != newFocus)
	{
		if(newFocus.prop("disabled"))
		{
			console.log("Disabled element");
			// Set everything back to its original value
			newFocus = focusElement.element;
			currentTab.currentElement = elementIndex;
		}

		focusElement.element = newFocus;
		focusElement.element.focus();

	}
}

function handleSelectricNavigation(focusElement, upPressed, downPressed, leftPressed, rightPressed)
{
	// Selectric already has support for arrow buttons, so use that
	if(upPressed)
	{
		var e = $.Event("keydown", { keyCode: 38}); // 38 is keyboard up
		focusElement.element.trigger(e);
	}

	if(downPressed)
	{
		var e = $.Event("keydown", { keyCode: 40}); // 40 is keyboard down
		focusElement.element.trigger(e);
	}
}

function handleAlertNavigation(focusElement, upPressed, downPressed, leftPressed, rightPressed)
{
	// Using an index system for alert buttons, seeing as JQuery objects have been filtered down
	// to those appropriate (i.e. no hidden objects)
	if(alertIndex == undefined)
	{
		// Go for the last button
		alertIndex = buttons.length - 1;
	}
	if(leftPressed)
	{
		if(buttons[alertIndex - 1] !== undefined)
		{
			alertIndex = alertIndex - 1;
		}
	}
	if(rightPressed)
	{
		if(buttons[alertIndex + 1] !== undefined)
		{
			alertIndex = alertIndex + 1;
		}
	}
	if(upPressed)
	{
		if($(buttons[0]).is("#alertDialogCheckbox"))
		{
			alertIndex = 0;
		}
	}
	if(downPressed)
	{
		if(alertIndex == 0 && $(buttons[0]).is("#alertDialogCheckbox"))
		{
			alertIndex = 1;
		}
	}

	if(focusElement.element === undefined || focusElement.element != buttons[alertIndex])
	{
		focusElement.element = $(buttons[alertIndex]);
		focusElement.element.focus();
	}
}

function showNeighbours(theTabIndex, hide)
{
	// Function to show the neighbours of an element defined in the .json
	var currentTab = theTabContents[theTabIndex];
	var thisColour = "yellow";
	var upColour = "darkgreen";
	var downColour = "violet";
	var leftColour = "blue";
	var rightColour = "red";

	if(hide)
	{
		// If we're 'hiding' elements and setting them back to usual
		// just change the background to white
		thisColour = prevColours["this"];
		upColour = prevColours["up"];
		downColour = prevColours["down"];
		leftColour = prevColours["left"];
		rightColour = prevColours["right"];
	}

	if(currentTab.currentElement !== undefined)
	{
		// An object of the neighbours and selector of the current element
		var theElement = currentTab.navigationElements[currentTab.currentElement];
		changeColour($(theElement),thisColour,"this",hide);

		var theNeighbour = getUpNeighbourIndex(currentTab, currentTab.currentElement);
		if(theNeighbour != -1)
		{
			var theNeighbourElement = $(currentTab.navigationElements[theNeighbour]);
			changeColour(theNeighbourElement,upColour,"up",hide);
		}
		theNeighbour = getDownNeighbourIndex(currentTab, currentTab.currentElement);
		if(theNeighbour != -1)
		{
			var theNeighbourElement = $(currentTab.navigationElements[theNeighbour]);
			changeColour(theNeighbourElement,downColour,"down",hide);
		}
		theNeighbour = getLeftNeighbourIndex(currentTab, currentTab.currentElement);
		if(theNeighbour != -1)
		{
			var theNeighbourElement = $(currentTab.navigationElements[theNeighbour]);
			changeColour(theNeighbourElement,leftColour,"left",hide);
		}
		theNeighbour = getRightNeighbourIndex(currentTab, currentTab.currentElement);
		if(theNeighbour != -1)
		{
			var theNeighbourElement = $(currentTab.navigationElements[theNeighbour]);
			changeColour(theNeighbourElement,rightColour,"right",hide);
		}
	}
}

function changeColour(element,colour,dir,hide)
{
	// Checkbox's can't change colour, so change their parent
	if(element.prop("type") == "checkbox")
	{
		if(!hide && !coloursCached) prevColours[dir] = element.parent().css("background-color");
		else prevColours[dir] = "";
		element.parent().css("background-color",colour).delay("500");
	}
	// Selectric boxes only change colour from the .selectric class
	else if(element.hasClass("selectric-input"))
	{
		if(!hide && !coloursCached) prevColours[dir] = element.siblings(".selectric").css("background-color");
		else prevColours[dir] = "";
		element.siblings(".selectric").css("background-color",colour).delay("500");
	}
	else
	{
		if(!hide && !coloursCached) prevColours[dir] = element.css("background-color");
		else prevColours[dir] = "";
		element.css("background-color",colour).delay("500");
	}
}

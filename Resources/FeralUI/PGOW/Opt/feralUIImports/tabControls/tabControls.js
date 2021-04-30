"use strict";

function initialiseControlsPanel()
{
	var allThePromises = [];
	
	allThePromises.push(hookPropertyToFunction(	"ControlMappings",
												"array<string,string,bool,bool,bool,bool,string,string,bool>",
												createControlsUIElements));
	
	allThePromises.push(hookPropertyToFunction(	"ControlKeyModifierChordUpdate",
												"string,string,string",
												partialUpdateChordText));
	
	allThePromises.push(hookPropertyToFunction(	"EndListeningForNewMapping",
												"",
												bindingFinished));
	
					
	allThePromises.push(hookPropertyToFunction(	"BeginListeningForNewMapping",
												"",
												bindingStarted));
	allThePromises.push(hookPropertyToFunction(	"EndListeningForNewMapping",
												"",
												bindingFinished));
	
	allThePromises.push(registerWriteOnlyProperty(	"ControlsUnassign",
													"string"));
	
	return Promise.allFinish(allThePromises);
}

// Add controls initialisation to the startup.
startupPostPropertyLoadTasks.push(initialiseControlsPanel);

function hideCursor(hide)
{
	if (hide === true)
	{
		$('#tabContentControls').css('cursor', 'none');
	}
	else
	{
		$('#tabContentControls').css('cursor', '');
	}
}

function beginListeningForNewBinding()
{
	// Avoid running the game if player presses enter.
	removePlayOnEnterHandler();

	// Prevent this function from immediately being called again.
	$('.controlMapping').off('mousedown', handleControlMappingClick);

	hideCursor(true);
	$('.tabView').on('mouseleave', mouseLeaveEvent);
}

function endListeningForNewBinding()
{
	// Restore the play button handler.
	initialisePlayOnEnterHandler();

	// Restore handler for control mappings.
	$('.controlMapping').on('mousedown', handleControlMappingClick);

	hideCursor(false);
	$('.tabView').off('mouseleave', mouseLeaveEvent);
}

function mouseLeaveEvent(event)
{
	endListeningForNewBinding();
}

function handleControlMappingClick(event)
{
	var controlItem = $(event.currentTarget).closest(".controlItem");
	var controlMapping = controlItem.children(".controlMapping").first();

	controlMapping.html('');
	controlMapping.css('background', 'url("images/ajax-loader.gif") no-repeat center center');

	var id = controlMapping.attr("id");

	setPropertyValue("BeginListeningForNewMapping-" + id, "", []);

	return false;
}

function handleUnassignClick(event)
{
	var controlItem = $(event.target).closest('.controlItem');
	var controlTag = controlItem.children('.controlLabel').attr('id');

	controlTag = getSubstrAfterChar(controlTag, "-");
	
	setWriteOnlyPropertyValue("ControlsUnassign", "string", [controlTag]);
	event.stopPropagation();
}

function getSubstrAfterChar(inString, character)
{
	var lastCharPos = inString.lastIndexOf(character);
	return inString.substr(lastCharPos + 1, inString.length);
}

function createValidElementId(controlTag)
{
	// Assuming all tags are in the same form as "BMAA.MoveForward".
	return getSubstrAfterChar(controlTag, ".");
}

function getImageFilenamesForInputValue(languageCode, usesModifiers, isKey, isGamePad, isMouse, modifierName, elementName)
{
	// Returns an array containing modifier + element, or just element.
	var filenames = Array();

	var iterations = (usesModifiers ? 2 : 1);

	for (var i = 0; i < iterations; ++i)
	{
		var filename = "";
		if (usesModifiers === true && i === 1)
		{
			filename = getLocaleSpecificElementFilename(languageCode, true, false, false, modifierName.toLowerCase());
		}
		else
		{
			filename = getLocaleSpecificElementFilename(languageCode, isKey, isGamePad, isMouse, elementName.toLowerCase());
		}

		filenames.push(filename);
	}

	return filenames;
}

function createImgHtmlElement(imageFilename)
{
	var imageDirectory = "../../PGOW/Opt/controls/";

	// Set the height to 32px rather than the width, so non-standard width keys e.g. space bar display correctly.
	return '<img src="' + imageDirectory + imageFilename + '" height="32px" class="controlImage">';
}

function getControlHtml(languageCode, usesModifiers, isKey, isGamePad, isMouse, modifierName, elementName)
{
	var imageFilenames = getImageFilenamesForInputValue(languageCode, usesModifiers, isKey, isGamePad, isMouse, modifierName, elementName);

	var controlImageFilename = imageFilenames[0];

	var modifierImageFilename = "";
	if (imageFilenames.length === 2)
	{
		modifierImageFilename = imageFilenames[1];
	}

	var modifierImgHtmlString = "";
	if (usesModifiers)
	{
		modifierImgHtmlString = createImgHtmlElement(modifierImageFilename);
	}

	var controlImgHtmlString = "";
	if (elementName !== "")
	{
		controlImgHtmlString = createImgHtmlElement(controlImageFilename);
	}

	// Display a horizontal bar (U+2015) if control is unassigned.
	if (modifierImgHtmlString === "" && controlImgHtmlString === "")
	{
		modifierImgHtmlString = '<span class="notAssigned">―</span>';
	}

	var finalControlImgHtml = modifierImgHtmlString + controlImgHtmlString;

	return finalControlImgHtml;
}


function createControlsUIElements(propertyName, typePattern, propValueArray)
{
	if (propValueArray.length > 0)
	{
		var controlTagValues = propValueArray[0];
		
		var controlsListElement = $('#controlsList');

		var tempElement = $("<div></div>");
		
		if (controlTagValues.length > 0)
		{
			var output = "";

			for (var i = 0; i < controlTagValues.length; ++i)
			{
				// Skip control if should be hidden
				if (controlTagValues[i][8])
				{
					continue;
				}
				var controlTag = controlTagValues[i][0];
				var languageCode = controlTagValues[i][1];

				var usesModifiers = controlTagValues[i][2];
				var isKey = controlTagValues[i][3];
				var isGamePad = controlTagValues[i][4];
				var isMouse = controlTagValues[i][5];
				
				var modifierName = controlTagValues[i][6];
				var elementName = controlTagValues[i][7];

				// Get the html markup for button image, or pair of button images in the case that there is a modifier.
				var finalControlImgHtml = getControlHtml(languageCode, usesModifiers, isKey, isGamePad, isMouse, modifierName, elementName);

				var elementId = createValidElementId(controlTag);
				var isColumnTag = controlTag.lastIndexOf("EndColumn", 0) === 0;

				if (i === 0 || isColumnTag)
				{
					if (isColumnTag)
					{
						output += '</div>'; // class="controlColumn"
					}
					output += '<div class="controlColumn">';
				}

				if (!isColumnTag)
				{
					output += '<div class="controlItem">';

					output += '<div id="Label-' + elementId + '" class="controlLabel" data-inner-string="localise-' + controlTag +'">' + controlTag + '</div>';

					output += '<div id="Input-' + elementId + '" class="controlMapping">' + finalControlImgHtml + '</div>';

					output += '<span class="unassign" data-title-string="localise-Startup.UnassignTooltip" title="Click to remove the assigned input. To cancel and retain the previous input, press Escape."></span>';

					output += '</div>';
				}

				if (i === controlTagValues.length-1)
				{
					output += '</div>'; // class="controlColumn"
				}
			};
			tempElement.append(output);
		}

		var promise = Promise.allFinish([
			initialisePropertiesWithinElement(tempElement[0]),
			initialiseInputElementHandlersWithinElement(tempElement[0])]);
		
		
		promise.then(
			function()
			{
				// Clear any existing elements before adding new ones.
				controlsListElement.empty();
				controlsListElement.append(tempElement.children());
				
				// Hook up event handlers for activating control mapping.
				$('.controlItem').on('click', handleControlMappingClick);
				$('.controlLabel').on('click', handleControlMappingClick);
				$('.controlMapping').on('click', handleControlMappingClick);
				$('.controlImage').on('click', handleControlMappingClick);

				// Hook up event handlers for the unassign button.
				$('.controlItem>.unassign').on('click', handleUnassignClick);
			});
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function bindingStarted(propertyName, typePattern, propValueArray)
{
	beginListeningForNewBinding();
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function bindingFinished(propertyName, typePattern, propValueArray)
{
	endListeningForNewBinding();

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function partialUpdateChordText(propertyName, typePattern, propValueArray)
{
	if (propValueArray.length === 3)
	{
		var controlElement = $('#' + propValueArray[0]);
		if (controlElement)
		{
			var controlText = propValueArray[2];
			var modifierImgHtmlString = "";
			if (controlText !== '')
			{
				var languageCode = propValueArray[1];

				modifierImgHtmlString = getControlHtml(	languageCode, 
														true /*usesModifiers*/,
														true /*isKey*/,
														false /*isGamePad*/,
														false /*isMouse*/,
														controlText /*modifierName*/,
														// We expect only a modifier, so send a blank element.
														""/*elementName*/);
				
				// We are displaying a modifier + the waiting gif so move the loader gif to be 32px + 16px over.
				controlElement.css('background-position-x', '48px');
			}
			else
			{
				// We are just displaying the waiting gif, so return it to original position defined in handleControlMappingClick().
				controlElement.css('background-position-x', '8px');
			}

			controlElement.html(modifierImgHtmlString);
		}
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}


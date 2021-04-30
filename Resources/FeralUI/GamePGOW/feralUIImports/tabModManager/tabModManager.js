"use strict";

// These constants match the ones at the top of ModManagerHandler::GetValue().
var kModTypeSteamWorkshop = 1;
var kModTypeLocal = 2;
var kModTypeMyMod = 3;

function initialiseModManagerPanel()
{
	var promise = hookPropertyToFunction(	"ProhibitModManagerPanel",
											"bool",
		function(propertyName, typePattern, propValueArray)
		{
			var modManagerProhibited = propValueArray[0];

			if (modManagerProhibited === false)
			{
				var allOfThePromises = [];

				allOfThePromises.push(
					hookPropertyToFunction("ModManagerAllModListItems",
									   "array<string,string,bool,int,bool,bool>",
									   generateModTitlesList)
				);

				allOfThePromises.push(
					hookPropertyToFunction("ModManagerModDetails",
									   "string,string,string,string,array<string>,bool,bool,bool,bool,string",
									   updateModDetailsPanel)
				);

				allOfThePromises.push(
					hookPropertyToFunction(	"ModManagerActiveMod",
											"string",
											highlightActiveModListItem)
				);

				allOfThePromises.push(
					hookPropertyToFunction(	"ModManagerShowPanel_ModUpload",
											"bool",
											showPanel_ModUpload)
				);

				allOfThePromises.push(
					hookPropertyToFunction( "ModManagerUploadImgPathThumbnailURL",
											"string",
											setUploadFormPreviewImage)
				);

				allOfThePromises.push(
					hookPropertyToFunction( "ModManagerUploadProgressPercent",
											"int",
											setProgressBarPercentage)
				);

				var disableAllModsToggle = $('input#DisableAllModsToggle');
				var disableModManager = function()
				{
					if (disableAllModsToggle.is(':checked'))
					{
						$("#modPaneHeading").addClass('modManagerAllDisabled');
						$("#modPane").addClass('modManagerAllDisabled');
						$("#modManagerLinkButtons").addClass('modManagerAllDisabled');
					}
					else
					{
						$("#modPaneHeading").removeClass('modManagerAllDisabled');
						$("#modPane").removeClass('modManagerAllDisabled');
						$("#modManagerLinkButtons").removeClass('modManagerAllDisabled');
					}

				}

				// Set the initial state, and then hook into the checkbox change event.
				disableModManager();
				disableAllModsToggle.on( "change", disableModManager);

				return Promise.all(allOfThePromises);
			}
			else
			{
				return Promise.resolve();
			}
		}
	);

	return promise;

}

// Add controls initialisation to the startup.
startupPostPropertyLoadTasks.push(initialiseModManagerPanel);

function updateSelectedMod(event)
{
	var currentModItem = $(event.target).closest(".modItem");

	if (!currentModItem.hasClass("selectedModItem"))
	{
		var id = currentModItem.attr("id");

		setPropertyValue("ModManagerActiveMod", "string", [id]);
	}
	// stop clicks from going past this to the deselector
	event.stopPropagation();
}

// A div containing the mod's name and the enable checkbox.
function createModNameHtmlEntry(modData)
{
	var output = "";

	if (modData.length == 6)
	{
		var id = modData[0];

		var title = modData[1];
		if (title === "")
		{
			title = modData[0];
		}

		// We use 1 warning icon to cover all possible problems and give full info in details panel
		var hasWarning = modData[2];
		
		var modType = modData[3];
		
		var isEnabled = modData[4];

		var isDownloading = modData[5];

		var iconClassText = ' ';
		if (modType == kModTypeSteamWorkshop)
		{
			iconClassText += 'steamWorkshop';
		}
		else if (modType === kModTypeLocal)
		{
			iconClassText += 'local';
		}
		else if (modType === kModTypeMyMod)
		{
			iconClassText += 'my';
		}

		if (hasWarning === true)
		{
			iconClassText += 'Warning';
		}

		iconClassText += 'ModIcon';

		output += (	'<div id="' + id + '" class="modItem' + iconClassText + '">' +

						(isEnabled ?
						'<div class="orderControl"><span class="modLoadOrderButtonWrapper modLoadOrderButtonUpWrapper">' +
							'<input class="modLoadOrderButton centered customButton" type="button"' +
							'value=""' +
							'data-property-name="ModManagerChangeLoadOrder-inc-' + id + '" data-property-type="" />' +
						'</span>' +
						
						'<span class="modLoadOrderButtonWrapper modLoadOrderButtonDownWrapper">' +
							'<input class="modLoadOrderButton centered customButton" type="button"' +
							'value=""' +
							'data-property-name="ModManagerChangeLoadOrder-dec-' + id + '" data-property-type="" />' +
						'</span></div>' : " ") +

						'<div class="modTitleWrapper' + (isEnabled ? ' modEnabledTitleWrapper' : '') + '">' + 
							'<span class="modTitle">' + title + '</span>' + 
						'</div>' + 

						// TODO: This could also be used to block enabling mods if there are conflicts or other issues, but I doubt anyone wants this feature...
						(!isDownloading ? 
						'<span class="modEnable">' +
							'<input id="checkbox-' + id + '" type="checkbox" ' +
							'data-property-name="EnableMod-' + id + '" ' +
							'data-property-type="bool" />' +
						'</span>' : "") +
						
					'</div>');
					
			
	}
	else
	{
		console.error(logStrCpp("Expected 6 elements in the array, got " + modData.length + " instead!"));
	}

	return output;
}

function generateModTitlesList(propertyName, typePattern, propValueArray)
{
	if (propValueArray.length > 0)
	{
		var modListElement = $('#modList');

		modListElement.empty();

		if (propValueArray[0].length > 0)
		{
			var modNamesHtml = '';
			for (var i = 0; i < propValueArray[0].length; i++)
			{
				modNamesHtml += createModNameHtmlEntry(propValueArray[0][i]) + "\n" ;
			};
			modNamesHtml += '';

			modListElement.append(modNamesHtml);

			if (modListElement.find(".modEnabledTitleWrapper").length === 1)
			{
				// If only 1 mod is enabled, hide both buttons and ensure they don't leave a space.
				modListElement.find(".modLoadOrderButton").addClass("noDisplay");
				modListElement.find(".modEnabledTitleWrapper").addClass("modEnabledTitleWrapperSolo");
			}
			else
			{
				// Hide increment/decrement load order buttons from the first and last enabled mods respectively.
				modListElement.find(".modLoadOrderButton:first").css("visibility", "hidden");
				modListElement.find(".modLoadOrderButton:last").css("visibility", "hidden");
			}

			$('#modList').css('line-height', 'normal');
			$('#modList').css('text-align', 'initial');
		}
		else
		{
			modListElement.html('<span class="NoModsMessage"><p data-inner-string="localise-Startup.ModManagerModsNotFound">[MISSING] No Mods Found</p></span>');
			$('#modList').css('line-height', '250px');
			$('#modList').css('text-align', 'center');
		}

		initialisePropertiesWithinElement(modListElement[0]);
		initialiseInputElementHandlersWithinElement(modListElement[0]);
	}

	// Initialise event handlers.
	$('.modItem').click(updateSelectedMod);
	$('.modEnable').click(function(event)
	{
		event.stopPropagation();
	});

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function updateModDetailsPanel(propertyName, typePattern, propValueArray)
{
	$("#modDetailsHeading").text(propValueArray[1]);

	var previewImageURL = propValueArray[2];
	
	var backgroundImageUrl = "";
		
	if (previewImageURL != "")
	{
		backgroundImageUrl = 'url("' + previewImageURL + '")';
	}

	$("#modDetailsScreenshot").css("background-image", backgroundImageUrl);
	$("#modDetailsScreenshot").css("background-color", "rgba(0,0,0,0.5");
	$("#modDetailsScreenshot").css("background-size", "contain");
	$("#modDetailsScreenshot").css("background-repeat", "no-repeat");
	$("#modDetailsScreenshot").css("background-position", "center");
	
	var description = propValueArray[3];

	var bbParsedDescription = XBBCODE.process
	({
		text: description,
		removeMisalignedTags: true,
		// Set to false because we already set 'white-space:pre-wrap' in css file.
		// XBBCODE sets it to 'white-space:pre' which breaks word wrapping.
		addInLineBreaks: false
	});

	$("#modDetailsDescription").text(bbParsedDescription.html);

	var theTags = propValueArray[4];
	var modDetailsTagsList = $("#modDetailsTagsList");

	if (theTags.length != 0)
	{
		modDetailsTagsList.text("");
		for (var i = 0; i < theTags.length; ++i)
		{
			modDetailsTagsList.append('<span class="modDetailsTag">' + theTags[i] + '</span>');
		}
	}

	$("#modDetailsFilesize").html(propValueArray[9]);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function highlightActiveModListItem(propertyName, typePattern, propValueArray)
{
	// Clear highlight from all items first
	$(".modItem").removeClass("selectedModItem");

	var id = propValueArray[0];

	if (id !== "")
	{
		var currentModItem = $('#modList').find('#' + id);

		// Add highlight to selected item
		currentModItem.addClass("selectedModItem");
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function showPanel_ModUpload(propertyName, typePattern, propValueArray)
{
	if (propValueArray[0] === true)
	{
		// Hide the tab bar and footer. We don't want people navigating 
		// to other parts of the PGOW from the upload form.
		$("#mainAppTitle").addClass("noDisplay");
		$("#tabbar").addClass("noDisplay");
		$("#playBoxParent").addClass("noDisplay");
		$("#footer").addClass("noDisplay");
		$("#tabView").css("top", "0");
		$("#tabView").css("margin-left", "20px");
		
		$("#tabContentModManager").css("transition", "none");
		$("#tabContentModManager").css("top", "20px");
		$("#tabContentModManager").css("height", "620px");

		$("#modUploadProgressPanel").detach().appendTo("#tabView");

		var theUploadImgTextBox = $('#modUploadImgPathTextBox');
		if (theUploadImgTextBox[0].scrollWidth > theUploadImgTextBox[0].offsetWidth)
		{
			var value = '...' + theUploadImgTextBox.val();
			do
			{
				value = '...' + value.substr(4);
				theUploadImgTextBox.val(value);

			} while (theUploadImgTextBox[0].scrollWidth > theUploadImgTextBox[0].offsetWidth);
		}

		// Avoid running the game if player presses enter.
		removePlayOnEnterHandler();
	}
	else
	{
		// Restore the original UI state.
		$("#mainAppTitle").removeClass("noDisplay");
		$("#tabbar").removeClass("noDisplay");
		$("#playBoxParent").removeClass("noDisplay");
		$("#footer").removeClass("noDisplay");
		$("#tabView").css("top", "");
		$("#tabView").css("margin-left", "");

		$("#tabContentModManager").css("height", "");
		$("#tabContentModManager").css("top", "");
		setTimeout(function() { $("#tabContentModManager").css("transition", ""); }, 500);

		$("#modUploadProgressPanel").detach().appendTo("#modPane");

		// Restore the play button handler.
		initialisePlayOnEnterHandler();
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setUploadFormPreviewImage(propertyName, typePattern, propValueArray)
{
	var previewImageURL = propValueArray[0];
	
	var backgroundImageUrl = "";
		
	if (previewImageURL != "")
	{
		backgroundImageUrl = 'url("' + previewImageURL + '")';
	}

	$("#modUploadModImgDiv").css("background-image", backgroundImageUrl);
	$("#modUploadModImgDiv").css("background-color", "rgba(0,0,0,0.5");
	$("#modUploadModImgDiv").css("background-size", "contain");
	$("#modUploadModImgDiv").css("background-repeat", "no-repeat");
	$("#modUploadModImgDiv").css("background-position", "center");

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setProgressBarPercentage(propertyName, typePattern, propValueArray)
{
	var percent = propValueArray[0];

	$("#modUploadProgressBar").attr("value", percent);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}


"use strict";

var tabDLCImportDoc;

//The polyfill uses _currentScript.
if(document._currentScript !== undefined)
	tabDLCImportDoc = document._currentScript.ownerDocument;
else
	tabDLCImportDoc = document.currentScript.ownerDocument;

function enableCustomDlcPanel()
{
	var thePromises = [];

	// Prohibit the standard and custom DLC panels on MAS and DRM as Alexander is now going
	// to be bundled in with the Gold edition.
	// Doing this instead of removing the dlc .data file from the server as if QA want to
	// test older builds that file needs to still exist.
	if ($('html.deliveryMAS').length > 0 || $('html.deliveryDRM').length > 0 )
	{
		thePromises.push(setPropertyValue("ProhibitCustomDLC",	"bool", [true]	));
		thePromises.push(setPropertyValue("ProhibitDLC",		"bool", [true]	));
	}

	return Promise.allFinish(thePromises);
}

startupPrePropertyLoadTasks.push(enableCustomDlcPanel);



function initialiseDlcPanel()
{
	// If we don't want the DLC panel (or the DLC information isn't available)
	// then don't hook DLCCount.
	return hookPropertyToFunction("ProhibitCustomDLC",
								  "bool",
		function(propertyName, typePattern, propValueArray)
		{
			var isProhibited = propValueArray[0];

			if( !isProhibited )
			{
				var allOfThePromises = [];

				allOfThePromises.push(
					InitProductKeyInput(	$("#RomeDLCKeyEntryDialog .productKeyEntry"), 
											"DLC", 
											$("#RomeDLCKeyEntryDialog #ProductKeySaveActivate")),
					hookPropertyToFunction(	"DLCCount", 
											"int", 
											initialiseDLCTabs)
				);

				return Promise.allFinish(allOfThePromises);
			}
			else
			{
				return Promise.resolve();
			}
		});
}
startupPostPropertyLoadTasks.push(initialiseDlcPanel);

function hookNumericalPropertyToFunction(propertyName, index, type, func)
{
	var stringIDs = ["rometwdlc1"];

	hookPropertyToFunction(	propertyName + index,
							type,
							func);

	hookPropertyToFunction(	propertyName + stringIDs[index],
							type,
							func);
}

// Function to register dummy properties and set up interactive elements for each tab
function initialiseDLCTabs(propertyName, typePattern, propValueArray)
{
	var dlcCount = propValueArray[0];
	for (var i = 0; i < dlcCount; i++)
	{
		//We don't need to register any of the following, but it avoids warnings if C++ attempts to push them to us
		hookNumericalPropertyToFunction("DLCInstanceIsActivated-",
										i,
										"bool",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceIsInstalled-",
										i,
										"bool",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceIsFreeDLC-",
										i,
										"bool",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceInfoKeyPrice-",
										i,
										"string",
										setDLCInstanceProperty);
		
		hookNumericalPropertyToFunction("DLCInstanceInfoKeyPriceSpecialOffer-",
										i,
										"string",
										setDLCInstanceProperty);
		
		hookNumericalPropertyToFunction("DLCInstanceBuyInStoreVisible-",
										i,
										"bool",
										setDLCInstanceProperty);
		
		hookNumericalPropertyToFunction("DLCInstanceActivationMessage-",
										i,
										"string",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceFinalPrice-",
										i,
										"string",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceIconUrl-",
										i,
										"string",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceFinalPriceVisible-",
										i,
										"bool",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceInfoKeyName-",
										i,
										"string",
										setDLCInstanceProperty);

		hookNumericalPropertyToFunction("DLCInstanceIsPurchaseable-",
										i,
										"bool",
										setDLCInstanceProperty);

		// Set up more info interactive label
		var dlcElementStr = "#dlc-rometwdlc" + (i + 1);
		var dlcElement = $( dlcElementStr );

		$( ".dlcDescriptionLong>.dlcMoreInfo", dlcElement ).click(showFeaturesOnClick);
		$( ".dlcDescriptionLong>.dlcfeatures", dlcElement ).on( transitionEndEvent,
																scrollContainerTransitionEndHandler );
	}

	hookPropertyToFunction(	"DLCVisible",
							"bool",
							setDLCInstanceProperty);

	if (dlcCount > 0)
	{
		hookPropertyToFunction(	"DLCEnabled",
								"bool",
								setDLCInstanceProperty);

		hookPropertyToFunction(	"DLCHeaderString",
								"string",
								setDLCInstanceProperty);
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setDLCInstanceProperty(propertyName, typePattern, propValueArray)
{
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}


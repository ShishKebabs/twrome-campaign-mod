"use strict";

var tabExtraImportDoc;

//The polyfill uses _currentScript.
if(document._currentScript !== undefined)
	tabExtraImportDoc = document._currentScript.ownerDocument;
else
	tabExtraImportDoc = document.currentScript.ownerDocument;


function initialiseExtraPanel()
{
	// Don't hook ExtraCount if we want to prohibit the basic Extra panel.
	// The handler may send a count > 0 so make sure the advanced Extra panel gets it.
	return hookPropertyToFunction(	"ExtraContentCount",
									"int",
									setExtraContentCount)
}

//Add Extra tab features+scroll initialisation to the startup
startupPostPropertyLoadTasks.push(initialiseExtraPanel);


function setExtraContentCount(propertyName, typePattern, propValueArray)
{
	var extraCount = propValueArray[0];
	
	var currentCount = $("#tabContentExtra .extraContentItem").length;
	
	for(var i = currentCount ; i < extraCount ; i++)
	{
		insertExtraContentItem(i);
	}

	return true;
}

function insertExtraContentItem(elementNum)
{
	var extraElementTemplate = $("#extraContentItem-POSITION_NUMBER", tabExtraImportDoc);
	
	var extraElementStr = extraElementTemplate[0].outerHTML.replace(/POSITION_NUMBER/g, elementNum);
	
	var extraElement = $(extraElementStr);
	
	$("#tabContentExtras #extrasExtraContentSubSection").append(extraElement);

	// Hook all of the properties in our new element, since these weren't setup at startup
	initialiseGenericElementReplacementsWithinElement(extraElement),
	initialisePropertiesWithinElement(extraElement),
	initialiseInputElementHandlersWithinElement(extraElement)
}



// importDoc references this import's document
var importDoc = document._currentScript.ownerDocument;

// mainDoc references the main document (the page that's importing us)
var mainDoc = document;


function appendPlayOptionToPage(optionID)
{
	var playOption = $(".playOption[data-game-id=\"" + optionID + "\"]", importDoc);
	
	if(playOption !== undefined && playOption.length == 1)
	{
		var newPlayOption = playOption.clone(true);
		
		//Each initailise* function only functions on everything within the given element,
		//not the element itself, so create a temp parent element in case the .playOption has anything interesting on it.
		var parent = document.createElement("div");
		$(parent).append(newPlayOption);
		
		//initialisePropertiesWithinElement is only one likely to be needed here, 
		//but might as well be consistent about doing all 3.
		initialiseGenericElementReplacementsWithinElement(parent);
		initialisePropertiesWithinElement(parent);
		initialiseInputElementHandlersWithinElement(parent);
		
		$("#playBox", mainDoc).append(newPlayOption);
		
		return newPlayOption;
	}
	else
	{
		console.error("Cannot find playOption in game specific file!");
		return undefined;
	}
}

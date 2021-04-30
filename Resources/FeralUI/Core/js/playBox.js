"use strict";

startupPostPropertyLoadTasks.push(initialisePlayBox);

function initialisePlayBox()
{
	var promises = [Promise.resolve()];
	
	if(typeof appendPlayOptionToPage === "function")
	{
		promises = 	[	hookPropertyToFunction(	"gameList",
												"array<string>",
												fillGameList)
					,
						hookPropertyToFunction(	"GameSelected",
												"bool",
												function(){return true;})
					];
	}
	
	return Promise.allFinish(promises);
}

function defaultFocusGame(propertyName, typePattern, propValueArray)
{
	if(	propValueArray !== undefined )
	{
		var playOptions = $("#playBox>.playOption");
		
		playOptions.removeClass("selectedGame");
		
		var position = propValueArray[0];
		
		var selectedPlayOption = $("#playBox>.playOption[data-game-pos=\"" + position + "\"]");
		
		if(selectedPlayOption.length === 1)
		{
			selectedPlayOption.addClass("selectedGame");
			//Make sure the displays canvas uses the right icon
			if(displayPicker && drawDisplayRects)
				drawDisplayRects();
		}
		else
		{
			console.log("Failed to select game " + position + ". Possible that default is unavailable");
			
			//Select first game instead
			$(selectedPlayOption[0]).click();
		}
	}
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function focusGame(event)
{
	var playOption = $(this);
	
	var allPlayOptions = $("#playBox>.playOption");
	
	allPlayOptions.removeClass("selectedGame");
	
	playOption.addClass("selectedGame");
	
	//Make sure the displays canvas uses the right icon
	drawDisplayRects();
	
	var gamePos  = playOption.data("gamePos");
	var gameName = playOption.data("gameId");
	
	var propValueArray = [];

	propValueArray.push(gamePos)
	propValueArray.push(gameName);

	setPropertyValue(	"gameListSelect",
						"int,string",
						propValueArray,
						[defaultFocusGame]);
}

function useMultiGameSelection(numGames)
{
	return typeof enableMultiGameSelection !== "function" ||
		   enableMultiGameSelection(numGames);
}

function fillGameList(propertyName, typePattern, propValueArray)
{
	if(	propValueArray 						!== undefined 	&& 
		propValueArray[0] 					!== undefined 	&& 
		propValueArray[0].length 			> 	0 			&& 
		typeof appendPlayOptionToPage 		=== "function"	&&
	  	useMultiGameSelection(propValueArray[0].length))
	{
		$("#playBox").on("click", ".playOption", focusGame);
		
		$("#playBox").empty();
		var gameList = propValueArray[0];
		
		for(var i = 0 ; i < gameList.length ; i++)
		{
			var newElement = appendPlayOptionToPage(gameList[i]);
			
			if(newElement !== undefined && newElement.length == 1)
			{
				newElement[0].dataset.gamePos = i;
			}
		}
		
		//Currently relying on the promise list within the properties 
		//system to prevent this request from spreading into the next task...
		hookPropertyToFunction(	"gameListSelect",
								"int,string",
								defaultFocusGame);
	}
	else
		console.log("Could not fill the games list, falling back to single game selection");
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}


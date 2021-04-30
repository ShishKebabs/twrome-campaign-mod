"use strict";

const kFMenuBarPositionUnknown = 0;
const kFMenuBarPositionTop = 1;
const kFMenuBarPositionBottom = 2;
const kFMenuBarPositionLeft = 3;
const kFMenuBarPositionRight = 4;

var displayPicker = {};
displayPicker.displayRects = null;
displayPicker.mainDisplay = 0;
displayPicker.selectedDisplay = 0;
Object.seal(displayPicker);

//Add canvas initialisation to the startup
startupPostPropertyLoadTasks.push(initialiseCanvas);

function initialiseCanvas()
{
	var promise = hookPropertyToFunction(	"ProhibitVideo",
											"bool",
		function(propertyName, typePattern, propValueArray)
		{
			var prohibitVideo = propValueArray[0];

			if (prohibitVideo === true)
			{
				return Promise.resolve();
			}
			else
			{

				var allThePromises = [];
				allThePromises.push(
					hookPropertyToFunction(	"displayRectList",
											"array<float,float,float,float,int>,int",
											drawUpdatedDisplayRects));

				allThePromises.push(
					hookPropertyToFunction(	"displaySelect",
											"int",
											drawUpdatedDisplayRects));

				allThePromises.push(
					hookPropertyToFunction(	"VideoTabSelected",
											"bool",
											tabSwitchDrawDisplayRects));
				
				return Promise.allFinish(allThePromises);
			}
		});

	return promise;
}

function tabSwitchDrawDisplayRects(propertyName, typePattern, propValueArray)
{
	// Update the size of the canvas once the parent element is visible.
	// Otherwise, it will draw as if the parent has 0 size.
	if (propValueArray[0] === true)
	{
		drawDisplayRects();
	}
}

function drawUpdatedDisplayRects(propertyName, typePattern, propValueArray)
{
	if(propValueArray[0] !== undefined)
	{
		if(propertyName == "displayRectList")
		{
			displayPicker.displayRects = propValueArray[0];
			displayPicker.mainDisplay = propValueArray[1];
		}
		else if(propertyName == "displaySelect")
		{
			displayPicker.selectedDisplay = propValueArray[0];
		}

		drawDisplayRects();
	}
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function drawDisplayRects()
{
	var displayRects = displayPicker.displayRects;
	var selectedDisplay = displayPicker.selectedDisplay;
	var mainDisplay = displayPicker.mainDisplay;
	
	if(displayRects !== null)
	{
		var canvasElement = $( "#displaysCanvas" );
		var canvas = canvasElement[0];
		var ctx = canvas.getContext("2d");

		// Ensure the canvas is horizontally centered in the parent container.
		canvasElement.css("width", "100%");
		ctx.canvas.width = canvasElement.width();

		// Ensure that canvas rendering updates to use the height set in CSS.
		canvasElement.css("height", "100%");
		ctx.canvas.height = canvasElement.height();

		//cleanup from previous draw
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = "#639DD6";
		ctx.strokeStyle = 'rgba(0,0,0,1)';
		ctx.lineJoin = "miter";
		ctx.lineCap = "butt";
		ctx.lineWidth = 1;

		ctx.save();

		var mainMenuBarPosition = kFMenuBarPositionUnknown;
		var mainMenuBarHeight = 0;

		if (displayRects.length > 0)
		{
			var rectsLeft = Number.MAX_VALUE;
			var rectsTop = Number.MAX_VALUE;
			var rectsRight = 0.0;
			var rectsBottom = 0.0;

			//Find the minimum rect that contains all the displays completely
			for(var i = 0 ; i < displayRects.length ; i++)
			{
				if(rectsLeft    > displayRects[i][0])
					rectsLeft   = displayRects[i][0];

				if(rectsTop     > displayRects[i][1])
					rectsTop    = displayRects[i][1];

				if(rectsRight   < displayRects[i][2] + displayRects[i][0])
					rectsRight  = displayRects[i][2] + displayRects[i][0];

				if(rectsBottom  < displayRects[i][3] + displayRects[i][1])
					rectsBottom = displayRects[i][3] + displayRects[i][1];
			}

			//-10 to give a small gap around the edges.
			var scale = Math.min((canvas.width  - 10) / (rectsRight  - rectsLeft), 
								 (canvas.height - 10) / (rectsBottom - rectsTop ));

			//Center the display rects
			var left = (canvas.width  - (rectsRight  - rectsLeft) * scale) / 2.0;
			var top  = (canvas.height - (rectsBottom - rectsTop)  * scale) / 2.0;

			var transformedDisplayRects = [];

			//calculate the screens as transformed to fit into the canvas and use its coordinate range
			for (var i = 0 ; i < displayRects.length ; i++) 
			{
				transformedDisplayRects[i] = [];
				transformedDisplayRects[i][0] = left + scale * (displayRects[i][0] - rectsLeft);
				transformedDisplayRects[i][1] = top  + scale * (displayRects[i][1] - rectsTop);
				transformedDisplayRects[i][2] = scale * displayRects[i][2];
				transformedDisplayRects[i][3] = scale * displayRects[i][3];
			}

			ctx.beginPath();
			for (var i = 0 ; i < transformedDisplayRects.length ; i++) 
			{
				//Rounding to give clean pixel-width lines
				ctx.rect(	Math.round(transformedDisplayRects[i][0]) + 0.5,
							Math.round(transformedDisplayRects[i][1])  + 0.5,
							Math.round(transformedDisplayRects[i][2]),
							Math.round(transformedDisplayRects[i][3]));
			}

			ctx.fill();
			ctx.stroke();

			mainMenuBarPosition = displayRects[mainDisplay][4];

			// Is this right? i just breifly calculated it based on how my current main screen appears in sys prefs
			// Maybe it should be fixed size of 6px? seems like that would suck a bit if stretched too much
			var mainMenuBarHeight = transformedDisplayRects[mainDisplay][3] / (41/3);

			// Display the menu bar on the main screen
			drawMenuBarRect(ctx, mainMenuBarPosition, mainMenuBarHeight, transformedDisplayRects, mainDisplay);

			// Draw the game icon onto the selected display
			var menuBarHeight = (selectedDisplay == mainDisplay) ? mainMenuBarHeight : 0;
			drawGameIcon(mainMenuBarPosition, menuBarHeight, transformedDisplayRects, selectedDisplay);
		}

		$( "#displaysContainer" ).off("click").on("click",
			function(event)
			{	
				var elementX = event.clientX - this.getBoundingClientRect().left - this.clientLeft + this.scrollLeft;
				var elementY = event.clientY - this.getBoundingClientRect().top - this.clientTop + this.scrollTop;

				for (var i = 0 ; i < displayRects.length ; i++) 
				{
					ctx.beginPath();
					//Rounding to give clean pixel-width lines
					ctx.rect(	Math.round(transformedDisplayRects[i][0]) + 0.5,
								Math.round(transformedDisplayRects[i][1])  + 0.5,
								Math.round(transformedDisplayRects[i][2]),
								Math.round(transformedDisplayRects[i][3]));
					

					if(ctx.isPointInPath(elementX, elementY))
					{
						if(selectedDisplay != i)
						{
							var menuBarHeight = (selectedDisplay == mainDisplay) ? mainMenuBarHeight : 0;
							drawGameIcon(mainMenuBarPosition, menuBarHeight, transformedDisplayRects, selectedDisplay);

							//Clean up previous selectedDisplay (i.e. remove the game icon)
							ctx.beginPath();
							//Rounding to give clean pixel-width lines
							ctx.rect(	Math.round(transformedDisplayRects[selectedDisplay][0]) + 0.5,
										Math.round(transformedDisplayRects[selectedDisplay][1])  + 0.5,
										Math.round(transformedDisplayRects[selectedDisplay][2]),
										Math.round(transformedDisplayRects[selectedDisplay][3]));
							ctx.fill();
							ctx.stroke();

							// Display the menu bar on the main screen
							if (selectedDisplay == mainDisplay)
							{
								drawMenuBarRect(ctx, mainMenuBarPosition, mainMenuBarHeight, transformedDisplayRects, mainDisplay);
							}

							//update the selectedDisplay
							selectedDisplay = i;
							displayPicker.selectedDisplay = selectedDisplay;

							setPropertyValue(	"displaySelect",
													"int",
													[selectedDisplay],
													[drawUpdatedDisplayRects]);

						}
					}
				}
			});
	}
}

function drawMenuBarRect(ctx, mainMenuBarPosition, mainMenuBarHeight, transformedDisplayRects, mainDisplay)
{
	// Assume menu bar is at the top if not specified.
	var mainMenuBarYPos = transformedDisplayRects[mainDisplay][1];
	if (mainMenuBarPosition === kFMenuBarPositionBottom)
	{
		mainMenuBarYPos = (transformedDisplayRects[mainDisplay][1] + transformedDisplayRects[mainDisplay][3]) - (mainMenuBarHeight);
	}

	ctx.save();
	ctx.beginPath();
	ctx.rect(	Math.round(transformedDisplayRects[mainDisplay][0]) + 0.5,
				Math.round(mainMenuBarYPos)  + 0.5,
				Math.round(transformedDisplayRects[mainDisplay][2]),
				Math.round(mainMenuBarHeight)  );
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

function drawGameIcon(mainMenuBarPosition, menuBarHeight, transformedDisplayRects, selectedDisplay)
{
	var canvasIcon = $( "img#displaysImg" )[0];
	var gameIcon = $( "#playBox>.playOption.selectedGame img.gameIconImg" )[0];
			
	var isGameIconOk = false;
	if(gameIcon !== undefined) 
	{
		isGameIconOk = IsImageOk(gameIcon);
		$(gameIcon).on("load", drawDisplayRects);
	}
	else
	{
		console.error("gameIcon is undefined");
	}

	if (isGameIconOk)
	{
		var imgScale = Math.min((transformedDisplayRects[selectedDisplay][2] - 10						) / gameIcon.width, 
								(transformedDisplayRects[selectedDisplay][3] - 10 - menuBarHeight	) / gameIcon.height);

		// Assume menu bar is at the top if not specified.
		var imageYPos = (transformedDisplayRects[selectedDisplay][3] - gameIcon.height * imgScale) + menuBarHeight;
		if (mainMenuBarPosition === kFMenuBarPositionBottom)
		{
			imageYPos = (transformedDisplayRects[selectedDisplay][3] - gameIcon.height * imgScale) - menuBarHeight;
		}

		var imgLeft = (transformedDisplayRects[selectedDisplay][2] - gameIcon.width  * imgScale					 ) / 2.0;
		var imgTop  =  imageYPos / 2.0;

		$(canvasIcon).css({	top:   transformedDisplayRects[selectedDisplay][1] + imgTop, 
		left:  transformedDisplayRects[selectedDisplay][0] + imgLeft, 
		width: gameIcon.width  * imgScale});

		canvasIcon.src = gameIcon.src;
		canvasIcon.srcset = gameIcon.srcset;
		canvasIcon.sizes = Math.floor(gameIcon.width  * imgScale) + "px";

		// ctx.drawImage(	gameIcon, 
		// 				Math.round( transformedDisplayRects[selectedDisplay][0] + imgLeft ) + 0.5,
		// 				Math.round( transformedDisplayRects[selectedDisplay][1] + imgTop  ) + 0.5,
		// 				Math.round( gameIcon.width  *  imgScale ),
		// 				Math.round( gameIcon.width  *  imgScale )  );
	}
}

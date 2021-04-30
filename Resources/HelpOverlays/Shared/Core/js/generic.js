"use strict";

//Works similarly to Promise.all, but on failure, continues waiting until the rest finish
//Still rejects with the first error though.
Promise.allFinish = function(array)
{
	var thePromiseArray = [];
	
	var hasFailed = false;
	var failException = null;
	for(var i = 0 ; i < array.length ; i++)
	{
		if(array[i] === undefined || array[i].then === undefined || array[i].catch === undefined)
			throw new Error(array[i] + " is not a Promise.");
		
		thePromiseArray.push(array[i].catch(
			function(e)
			{
				var stackFirstLine = parseStackForErrorPosition(e.stack);
				
				if(!hasFailed)
				{
					hasFailed = true;
					failException = e;
					
					console.error(logStrCpp("Promise failed with " + e.message + " in: " + stackFirstLine));
				}
				else
				{
					
					console.error(logStrCpp("A Promise failed in the array, but fail state is already set, " +
											"discarding error: " + e.message + " in " + stackFirstLine));
				}
			}));
	}
	
	var thePromise = Promise.all(thePromiseArray).then(
		function()
		{
			if(hasFailed)
			{
				throw failException;
			}
		});
		
	return thePromise;
}


function parseStackForErrorPosition(stack)
{
	var parseStackLine = 
		function(stackLine)
		{
			var miniFilePath = stackLine;
			var splitFilePath = stackLine.split("/");
			
			if(splitFilePath.length >= 2)
			{
				miniFilePath = 	splitFilePath[splitFilePath.length-2] + 
								"/" +
								splitFilePath[splitFilePath.length-1];
			}

			// Android callstack ends the path line with close parenthesis ')', so we
			// need to ignore that, too.
			if (miniFilePath.charAt(miniFilePath.length - 1) == ')')
				miniFilePath = miniFilePath.substring(0, miniFilePath.length - 2);
			
			return miniFilePath;
		};
	
	var splitStack = stack.split("\n");

	// On Android WebView, the first line is actually an error message. And the actual
	// error stack start on the second line, with " at " prefix. The format of the log
	// is also different. So we will use this as the key to determine how to actually
	// phase the log.
	if ((splitStack.length > 1) && (splitStack[1].indexOf(" at ")))
	{
		stackFirstLine = splitStack[1];

		// The first callstack may contains no file path
		if (splitStack[1].indexOf("file://") === -1 && splitStack.length > 2)
		{
			stackFirstLine = splitStack[2];
		}

		// Strip the " at " prefix
		stackFirstLine = parseStackLine(stackFirstLine);
	}
	else if(splitStack.length > 0)
	{
		var stackFirstLine = parseStackLine(splitStack[0]);
		
		if(stackFirstLine.indexOf("[native code]") !== -1 && splitStack.length > 1)
			stackFirstLine += "<-" + parseStackLine(splitStack[1]);
	}
	
	return stackFirstLine;
}


var logToCpp = true;
var logToConsole = true;

var logFunctionsBackup = {};

logFunctionsBackup.log = console.log;
logFunctionsBackup.warn = console.warn;
logFunctionsBackup.error = console.error;
//Just in case we never get to the proper logging initialisation
//(though if that happens, we're in a lot of trouble to begin with)
initialiseLogging();

function initialiseLogging()
{
	if(logToConsole)
	{
		console.log = logFunctionsBackup.log;
		console.warn = logFunctionsBackup.warn;
		console.error = logFunctionsBackup.error;
	}
	else
	{
		console.log = function(){};
		console.warn = function(){};
		console.error = function(){};
	}
}

function logStrCpp() 
{
	if(logToCpp || logToConsole)
	{
		var fileAndLine = "";
		
		if(logToCpp)
		{
			try
			{
				throw Error();
			}
			catch(e)
			{
				fileAndLine = parseStackForErrorPosition(e.stack.substring(e.stack.indexOf("\n")+1));
				fileAndLine = pad(fileAndLine, 30);
			}
		}
	
		var logString = "";
		
		for(var argNum = 0 ; argNum < arguments.length ; argNum++)
		{
			if(argNum === 0)
				logString += arguments[argNum];
			else
				logString += " " + arguments[argNum];
		}
		
		if(logToCpp)
			logToMainConsole(fileAndLine + " - " + logString);
		
		if(logToConsole)
			return logString;
		else
			return;
	}
	else
		return;
}


//Keeps a counter so we can disable things for multiple reasons,
//Updates JQueryUI elements when disabled state changes
//Supports disabling anchor tags (they can be focused, so sometimes we need to be able to "disable" them somehow)
//Updates a "controlDisabled" class on an elements parent label so css can detect it.
function setDisabled(element, shouldDisable)
{
	var changed = false;
	//Default to 0
	var disabledCount = $(element).data("disabledCount");
	
	if(disabledCount === undefined)
	{
		disabledCount = 0;
	}
	
	if(disabledCount === 0 && !shouldDisable)
		console.error(logStrCpp("Attempting to enable an undisabled element:", element));
	
	if(shouldDisable)
	{
		if(++disabledCount > 0)
		{
			if($(element).is("a"))
			{
				//Anchors can be tabbed to (using alt-tab) but don't understand disable
				//Insead, we will rely on the fact that an anchor without a href cannot be tabbed to
				//and store the href elsewhere in the meantime
				var hrefValue = $(element).attr('href');
				
				element.dataset.hrefDisabled = hrefValue;
				
				$(element).removeAttr('href');
			}
			else
				$( element ).prop('disabled', true);
			
			changed = true;
		}
		else
		{
			console.error(logStrCpp("Invalid disabled state for :", element));
		//  throw "NO";
		}
	}
	else
	{
		if(--disabledCount == 0)
		{
			if($(element).is("a"))
			{
				//Anchors can be tabbed to (using alt-tab) but don't understand disable
				//Insead, we will rely on the fact that an anchor without a href cannot be tabbed to
				//and store the href elsewhere in the meantime
				var hrefValue = element.dataset.hrefDisabled;
				
				if(hrefValue !== undefined)
					$(element).attr('href', hrefValue);
				
				delete element.dataset.hrefDisabled;
			}
			else
				$( element ).prop('disabled', false);
			
			changed = true;
		}
		else if(disabledCount < 0)
		{
			console.error(logStrCpp("Invalid disabled state for :", element));
			//throw "NO";
		}
	}
	
	if(changed)
	{
		if($( element ).parent().is("label"))
		{
			//If there are multiple controls in a label, only mark the label disabled if all the controls are disabled
			if(shouldDisable && $(element).siblings("button:enabled,input:enabled,textarea:enabled,select:enabled,a[href]").length == 0)
				$( element ).parent().addClass("controlDisabled");
			else
				$( element ).parent().removeClass("controlDisabled");
		}
		
		if($( element ).is("button,input[type=button]"))
		{
			$( element ).button().button("refresh");
		}

		if($( element ).is(".selectBox"))
		{
			$( element ).selectric('refresh');
		}
		
	}
	
	//Update the disabledCount
	$(element).data("disabledCount", disabledCount);
		
	return changed;
}


var transitionEndEvent = 'webkitTransitionEnd transitionend oTransitionEnd webkitTransitionEnd';

//Based on:
//http://stackoverflow.com/a/1219983/445004
function htmlEncode(str) 
{
		return String(str)	.replace(/&/g, '&amp;')
							.replace(/"/g, '&quot;')
							.replace(/'/g, '&#39;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;');
}

function htmlDecode(str) 
{
		return String(str)	.replace(/&amp;/g,  '&')
							.replace(/&quot;/g, '"')
							.replace(/&#39;/g,  '\'')
							.replace(/&lt;/g,   '<')
							.replace(/&gt;/g,   '>');
}

//Based on:
//http://stackoverflow.com/a/1977898/445004
function IsImageOk(image) 
{
	var result = true;
	
	if (!image.complete || (image.naturalWidth !== undefined && image.naturalWidth === 0))
	{
			result = false;
	}

	return result;
}

function getImportedDocForJS()
{
	// The polyfill uses _currentScript, so fallback to that, if the native implementation doesn't seem to be doing anything.
	if(document._currentScript !== undefined)
		return document._currentScript.ownerDocument;
	else
		return document.currentScript.ownerDocument;
}


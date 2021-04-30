"use strict";



//We delay any pushes during startup, so this can be done whenever as long as it's before startup completes.
startupPostPropertyLoadTasks.push(initialisePushInterfaceFromCpp);

function initialisePushInterfaceFromCpp()
{
	
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				window.cefQuery(
					{
						request: JSON.stringify(["pushInterface"]),
						persistent: true,
						onSuccess: function(response) 
						{
							var theResponse;
							try
							{
								theResponse = JSON.parse(response);
								
								if(typeof theResponse === "string")
								{
									if(theResponse === "")
										throw new Error("Unknown C++ error, build with logging for details.");
									else
										throw new Error(theResponse);
								}
								var propName 		= theResponse[0];
								var propType 		= theResponse[1];
								var propValueJSON 	= theResponse[2];
								var propRecvFunc 	= theResponse[3];
								
								window[propRecvFunc](propName, propType, propValueJSON);
							}
							catch(e)
							{
								console.log("JSON response could not be parsed: \n" + response + "\nbecause:\n" + e.stack);
							}
						},
						onFailure: function(error_code, error_message) 
						{
							throw new Error("push cefQuery cancelled! Don't do this, we lose push forever!");
						}
					});
			}
			else if (!propertyManager.usingWKWebView)
			{
				window.addEventListener("message", function(event)
				{
					try 
					{
						var theResponse = JSON.parse(event.data);

						var propName 		= theResponse[0];
						var propType 		= theResponse[1];
						var propValueJSON 	= theResponse[2];
						var propRecvFunc 	= theResponse[3];
						
						window[propRecvFunc](propName, propType, propValueJSON);
					}
					catch(e)
					{
						console.log("JSON response could not be parsed: \n" + response);
					}
				}, false);
			}
			resolve();
		});
	
	return promise;
}


var propertyManager = {};

propertyManager.propertyMap = new Object();
propertyManager.propertyMessagingPromises = [];
propertyManager.responsesAwaited = {};
propertyManager.nextResponseId = 1; //start at 1 since 0 has a special meaning.
propertyManager.usingWKWebView = 	window.webkit && 
									window.webkit.messageHandlers && 
									window.webkit.messageHandlers.getPropertyValue;





function resetPropertyList()
{
	var thePromise = propertyManager.resetPropertyList();
	
	thePromise.catch(
		function(e)
		{
			console.error(logStrCpp(e.message));
		});
	
	return thePromise;
}

function hookPropertyToElement(propertyName, propertyType, element)
{
	//The ! (not) operator for bools is just to make life easier on the web side,
	//It shouldn't be passed to C++
	if(propertyType.startsWith("bool") && propertyName.startsWith("!"))
	{
		propertyName = propertyName.substring(1);
	}

	var thePromise = propertyManager.registerPropertyWithElement(element,
																 propertyName,
																 propertyType,
																 setJSStateOfProperty);
	
	//Typeless properties have no state, they are more like events, 
	//so requesting their initial value makes no sense
	if(propertyType !== "")
	{
		thePromise = thePromise.then(
			function()
			{
				return requestPropertyValue(propertyName, propertyType);
			});
	}
	
	propertyManager.propertyMessagingPromises.push(thePromise);
	
	return thePromise;
}


function hookPropertyToFunction(propertyName, propertyType, recvFunction)
{
	//The ! (not) operator for bools is just to make life easier on the web side,
	//It shouldn't be passed to C++
	if(propertyType.startsWith("bool") && propertyName.startsWith("!"))
	{
		propertyName = propertyName.substring(1);
	}

	var thePromise = propertyManager.registerPropertyWithElement(null,
																 propertyName,
																 propertyType,
																 recvFunction );
	
	//Typeless properties have no state, they are more like events, 
	//so requesting their initial value makes no sense
	if(propertyType !== "")
	{
		thePromise = thePromise.then(
			function()
			{
				return requestPropertyValue(propertyName, propertyType);
			});
	}
	
	propertyManager.propertyMessagingPromises.push(thePromise);
	
	return thePromise;
}

//Should only be used when a property is write-only
//ie, we send values to C++, but it will never send them to us.
//This prevents us from trying to initialise the property.
//Typeless properties sorta do this too, but that's only because they can't have any state, 
//they can be read & write but still don't need to be initialised
function registerWriteOnlyProperty(propertyName, propertyType)
{
	//The ! (not) operator for bools is just to make life easier on the web side,
	//It shouldn't be passed to C++
	if(propertyType.startsWith("bool") && propertyName.startsWith("!"))
	{
		propertyName = propertyName.substring(1);
	}

	var thePromise = propertyManager.registerPropertyWithElement(null,
																 propertyName,
																 propertyType,
																 null );
	
	propertyManager.propertyMessagingPromises.push(thePromise);
	
	return thePromise;
}

//We will only need to use this (outside of the functions above) if we have a property that can 
//change without C++ updating us. If a property changes *a lot* and we only care about it's value
//rarely, this may be reasonable. If that isn't the case, we shouldn't ever need this function.
function requestPropertyValue(propertyName, propertyType)
{
	var propertyStartValuePromise = propertyManager.getPropertyValue(	propertyName,
				 														propertyType);

	var thePromise = propertyStartValuePromise.then(
		function(propertyStartValue)
		{
			jsPropertyReceiver(	propertyStartValue[0],
								propertyStartValue[1],
								propertyStartValue[2]);
		});
	return thePromise;
}

//if not undefined, optionalFuncsAndElemsToSkip should be an array that contain any number of elements or 
//functions which you do not want to recieve an update about a change in value.
function setPropertyValue(propertyName, propertyType, propValueArray, optionalFuncsAndElemsToSkip)
{
	if(optionalFuncsAndElemsToSkip !== undefined && !Array.isArray(optionalFuncsAndElemsToSkip))
		throw new Error("optionalFuncsAndElemsToSkip is defined as not undefined or an array, ");
	
	var thePromise = setWriteOnlyPropertyValue(propertyName, propertyType, propValueArray);
	
	thePromise = thePromise.then(
		function()
		{
			jsPropertyReceiver(	propertyName, 
								propertyType, 
								JSON.stringify(propValueArray), 
								optionalFuncsAndElemsToSkip);
		})
	
	thePromise = thePromise.catch(
		function(e)
		{
			var stackFirstLine = parseStackForErrorPosition(e.stack);
			
			console.error(logStrCpp("Error setting property '" + propertyName + "': " + 
									e.message + " occured in: " + stackFirstLine));
			if(debugMode) throw e;
		});
	
	return thePromise;
}

//No JS functions/elements will be informed of the change
function setWriteOnlyPropertyValue(propertyName, propertyType, propValueArray)
{
	var thePromise;
	
	thePromise = propertyManager.setPropertyValue(propertyName, propertyType, propValueArray);
	
	thePromise = thePromise.catch(
		function(e)
		{
			var stackFirstLine = parseStackForErrorPosition(e.stack);
			
			console.error(logStrCpp("Error setting write-only property '" + propertyName + "': " + 
									e.message + " occured in: " + stackFirstLine));
			if(debugMode) throw e;
		});
	
	return thePromise;
}

function awaitOutstandingPropertyPromises()
{
	return Promise.allFinish(propertyManager.propertyMessagingPromises);
}

function logToMainConsole(messageToLog)
{
	var thePromise = propertyManager.logToMainConsole(messageToLog);
	
	thePromise.catch(
		function(e)
		{
			//Don't log to C++, since that would infinite-loop ;)
			console.error(e.message);
		});
}











//Internal functions, don't use them.

propertyManager.getPropertyValue = function(propertyName, propertyType)
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				propertyManager.CreateCefQueryForRequest(	"getPropertyValue", 
															[	propertyName,
																propertyType	], 
															resolve, 
															reject)
			}
			else if(propertyManager.usingWKWebView)
			{
				propertyManager.responsesAwaited[propertyManager.nextResponseId] = {resolve:resolve, reject:reject};
				window.webkit.messageHandlers.getPropertyValue.postMessage([propertyName, 
																			propertyType, 
																			propertyManager.nextResponseId]);
				propertyManager.nextResponseId++;
			}
			else
			{
				window.setTimeout(
					function() 
					{
						var propertyArguments = undefined;
				
						try
						{
							propertyArguments = feral.getPropertyValue(	propertyName,
																		propertyType);
						}
						catch(e)
						{
							console.error(logStrCpp("Error getting property '" + propertyName + "': " + e.message));
							
							reject(e);
							return;
						}

						if(propertyArguments === undefined)
						{
							console.warn(logStrCpp(	"feral.getPropertyValue failed for property \"" + 
													propertyName + "\" of type \"" + propertyType + "\""));
							reject(new Error("getPropertyValue failed"));
						}
						else if(typeof propertyArguments === "string")
						{
							resolve(JSON.parse(propertyArguments));
						}
						else
						{
							resolve(propertyArguments);
						}
					}, 0);
			}
		});
		
	propertyManager.propertyMessagingPromises.push(promise);
	
	return promise;
}

propertyManager.setPropertyValue = function(propertyName, propertyType, propValueArray)
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				propertyManager.CreateCefQueryForRequest(	"setPropertyValue", 
															[	propertyName,
																propertyType,
																JSON.stringify(propValueArray)	], 
															resolve, 
															reject)
			}
			else if(propertyManager.usingWKWebView)
			{
				propertyManager.responsesAwaited[propertyManager.nextResponseId] = {resolve:resolve, reject:reject};
				window.webkit.messageHandlers.setPropertyValue.postMessage([propertyName, 
																			propertyType, 
																			JSON.stringify(propValueArray), 
																			propertyManager.nextResponseId]);
				propertyManager.nextResponseId++;
			}
			else
			{
				window.setTimeout(
					function() 
					{
						var functionSucceeded
						
						try
						{
							functionSucceeded = feral.setPropertyValue(	propertyName,
																		propertyType,
																		JSON.stringify(propValueArray));
						}
						catch(e)
						{
							console.error(logStrCpp("Error setting property '" + propertyName + "': " + e.message));
							
							reject(e);
							return;
						}

						if(functionSucceeded === undefined)
						{
							console.warn(logStrCpp(	"feral.setPropertyValue failed for property \"" + propertyName + 
										 			"\" of type \"" + propertyType + 
										 			"\" with propValueArray \"" + JSON.stringify(propValueArray) + "\""));
							
							reject(new Error("setPropertyValue failed"));
						}
						else
						{
							resolve(functionSucceeded);
						}
					}, 0);
			}
		});
	
	propertyManager.propertyMessagingPromises.push(promise);
		
	return promise;
}

propertyManager.resetPropertyList = function()
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				propertyManager.CreateCefQueryForRequest(	"resetPropertyList", 
															[], 
															resolve, 
															reject)
			}
			else if(propertyManager.usingWKWebView)
			{
				propertyManager.responsesAwaited[propertyManager.nextResponseId] = {resolve:resolve, reject:reject};
				window.webkit.messageHandlers.resetPropertyList.postMessage(propertyManager.nextResponseId);
				propertyManager.nextResponseId++;
			}
			else
			{
				window.setTimeout(
					function() 
					{
						var functionSucceeded = feral.resetPropertyList();

						if(functionSucceeded === undefined)
						{
							reject(new Error("resetPropertyList failed"));
						}
						else
						{
							resolve(true);
						}
					}, 0);
			}
		});
		
	return promise;
}

propertyManager.registerProperty = function(propertyName, typePattern, recvFunctionStr) 
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				propertyManager.CreateCefQueryForRequest(	"registerProperty", 
															[	propertyName,
																typePattern,
																recvFunctionStr   ], 
															resolve, 
															reject)
			}
			else if(propertyManager.usingWKWebView)
			{
				propertyManager.responsesAwaited[propertyManager.nextResponseId] = {resolve:resolve, reject:reject};
				window.webkit.messageHandlers.registerProperty.postMessage([propertyName, 
																			typePattern, 
																			recvFunctionStr, 
																			propertyManager.nextResponseId]);
				propertyManager.nextResponseId++;
			}
			else
			{
				window.setTimeout(
					function() 
					{
						var functionSucceeded = feral.registerProperty(	propertyName,
																		typePattern,
																		recvFunctionStr );

						if(functionSucceeded === undefined)
						{
							console.error(logStrCpp("feral.registerProperty failed for property \"" + propertyName + 
													"\" of type \"" + typePattern + 
													"\" with recvFunction \"" + recvFunctionStr + "\""));
							reject(new Error("registerProperty " + propertyName + " failed"));
						}
						else
						{
							resolve(functionSucceeded);
						}
					}, 0);
			}
		});
	
	propertyManager.propertyMessagingPromises.push(promise);
		
	return promise;
}

propertyManager.logToMainConsole = function(messageToLog)
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			if(typeof window.cefQuery !== 'undefined')
			{
				propertyManager.CreateCefQueryForRequest(	"log", 
															[messageToLog], 
															resolve, 
															reject)
			}
			else if(propertyManager.usingWKWebView)
			{
				window.webkit.messageHandlers.log.postMessage(messageToLog);
				window.setTimeout(
					function() 
					{
						resolve(true); //We assume this message succeeds for now.
					}, 0);
			}
			else
			{
				window.setTimeout(
					function() 
					{
						var functionSucceeded = feral.log(messageToLog);
						
						if(functionSucceeded)
							resolve();
						else
							reject(new Error("feral.logToMainConsole failed with message \"" + messageToLog + "\""));
					}, 0);
			}
		});
	
	return promise;
}


propertyManager.registerPropertyWithElement = function(element, propertyName, typePattern, recvFunction)
{
	var thePromise = Promise.resolve();
	
	if(propertyManager.propertyMap[propertyName] === undefined)
	{
		propertyManager.propertyMap[propertyName] = {recvFunctions:[], elements:[], lastType:typePattern};
		
		thePromise = propertyManager.registerProperty(	propertyName,
														typePattern,
														"jsPropertyReceiver" );
	}
	else if(propertyManager.propertyMap[propertyName].lastType !== typePattern)
	{
		//Registering again with the wrong type will get suitably scary and relevant warnings into C++
		thePromise = propertyManager.registerProperty(	propertyName,
														typePattern,
														"jsPropertyReceiver" );
		
		throw new Error("Attempting to register property with differing type patterns!");
	}

	if(recvFunction !== null)
	{
		if(propertyManager.propertyMap[propertyName].recvFunctions.indexOf(recvFunction) === -1)
			propertyManager.propertyMap[propertyName].recvFunctions.push(recvFunction);
	}

	//Null element means this property registration is purely JS, which is fine, 
	//though it needs to cope with pushed values its own way.
	if(element !== null)
	{
		if(propertyManager.propertyMap[propertyName].elements.indexOf(element) === -1)
			propertyManager.propertyMap[propertyName].elements.push(element);
	}
	
	return thePromise;
}

propertyManager.CreateCefQueryForRequest = function(taskName, messageArray, resolve, reject)
{
	var request_id = null;
	var fullMessageArray = messageArray.splice(0);
	fullMessageArray.unshift(taskName);
	
	var theRequest = JSON.stringify(fullMessageArray);
	
	var request_id = window.cefQuery({
		request: theRequest,
		persistent: false,
		onSuccess: function(response) 
		{
			var theResponse;
			try
			{
				theResponse = JSON.parse(response);
			}
			catch(e)
			{
				console.log("JSON response could not be parsed: " +response);
				theResponse = "";
			}
			resolve(theResponse);
		},
		onFailure: function(error_code, error_message) 
		{
			reject(new Error("cefQuery for " + fullMessageArray + " failed with error " + 
							 error_code + ": " + error_message));
		}
	});		
}


//WKWebView api native->js callback methods
propertyManager.WKWebViewPush = function(message)
{
	window[message[3]](message[0], message[1], message[2]);
}

propertyManager.WKWebViewResponse = function(identifier, message)
{
	propertyManager.responsesAwaited[identifier].resolve(message);
	propertyManager.responsesAwaited[identifier] = undefined;
}

propertyManager.WKWebViewError = function(identifier, message)
{
	propertyManager.responsesAwaited[identifier].reject(new Error("native call failed with message \"" + message + "\""));
	propertyManager.responsesAwaited[identifier] = undefined;
}


//This function may be called by C++ or by the functions above.
function jsPropertyReceiver(propertyName, typePattern, propValueJSON, optionalFuncsAndElemsToSkip)
{
	if(optionalFuncsAndElemsToSkip === undefined) 
		optionalFuncsAndElemsToSkip = [];
	
	var result = true;
	
	if(typeof propValueJSON !== "string")
	{
		console.error("Property '"+propertyName+"' of type '"+typePattern+"' has invalid returned value!");
		return undefined;
	}
	
	// Filter out problematic control characters
	// List pulled from http://www.bennadel.com/blog/2576-testing-which-ascii-characters-break-json-javascript-object-notation-parsing.htm
	propValueJSON = propValueJSON.replace(/[\x01-\x07\x0B\x0E-\x1F]/g, "");

	var propValueArray = JSON.parse(propValueJSON);
	
	if(propertyManager.propertyMap[propertyName] !== undefined)
	{
		var recvFunctions = propertyManager.propertyMap[propertyName].recvFunctions;
		
		result = propertyManager.pushPropToRecvFuncs(	propertyName, 
														typePattern, 
														propValueArray, 
														optionalFuncsAndElemsToSkip,
														recvFunctions);
	}
	else
	{
		//If nothing has hooked the full property+parameter name
		//Parametered properties (PropertyName-Parameter) can
		//be responded to by registering without the parameter.
		
		var propertyNameNoParams = propertyName.split("-")[0];
		
		if(	propertyName !== propertyNameNoParams &&
			propertyManager.propertyMap[propertyNameNoParams] !== undefined )
		{
			var recvFunctions = propertyManager.propertyMap[propertyNameNoParams].recvFunctions;
			
			if(recvFunctions === undefined || recvFunctions.indexOf(setJSStateOfProperty) === -1)
			{
				result = propertyManager.pushPropToRecvFuncs(	propertyName.split("-")[0], 
																typePattern, 
																propValueArray, 
																optionalFuncsAndElemsToSkip,
																recvFunctions);
			}
			else
			{
				//Currently cannot work with setJSStateOfProperty/elements, 
				//since I can't be bothered to rewrite them right now.
				console.error(logStrCpp(
					"Property '" + propertyName + "' not registered, and '" + propertyNameNoParams +
					"' is hooked by setJSStateOfProperty, which cannot respond to parametered properties."));
				result = undefined;
			}
		}
		else
		{
			console.error(logStrCpp("Property '" + propertyName + "' not registered in the JS property map"));
			result = undefined;
		}
	}
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return result;
}


propertyManager.pushPropToRecvFuncs = function(	propertyName, 
												typePattern, 
												propValueArray, 
												optionalFuncsAndElemsToSkip,
												recvFunctions)
{
	var result = true;
		
	if(recvFunctions !== undefined && recvFunctions.length > 0)
	{
		for(var i = 0 ; i < recvFunctions.length ; i++ )
		{
			var recvFunction = recvFunctions[i];
			var funcResult = true;
			
			//We don't really care if some are elements, not functions, since they wont be equal
			if(	optionalFuncsAndElemsToSkip.indexOf(recvFunction) === -1)
			{
				if(	recvFunction === setJSStateOfProperty )
					funcResult = setJSStateOfProperty(	propertyName, 
														typePattern, 
														propValueArray, 
														optionalFuncsAndElemsToSkip);
				else
					funcResult = recvFunction(	propertyName, 
												typePattern, 
												propValueArray);
			}
			
			if(result)
				result = funcResult;
		}
	}
	else
	{
		console.error(logStrCpp("No recvFunctions defined for property " + propertyName));
		result = undefined;
	}
	
	return result;
}


"use strict";

var mainScriptStartTime = Date.now();
var docReadyTime;
var htmlImportLoadedTime;
var startupStartedTime;
var startupFinishedTime;

var onReadyDone = false;
var importsLoaded = false;

var startupStarted = false;
var startupDone = false;

var startupPreImportTasks = [];
var startupPrePropertyLoadTasks = [];
var startupPropertyLoadTasks = [];
var startupPostPropertyLoadTasks = [];
var startupCompleteTasks = [];

var preDocumentStartupPromise = null;
var preImportStartupPromise = null;
var allTabImportPromises = [];

var debugMode = false;
var testerMode = false;
var profileMode = false;
var releaseMode = false;
var goldMasterMode = false;

var languageString = "";

$(document).ready(documentReady);
window.addEventListener('HTMLImportsLoaded', importDone);


//Startup functions

//Runs after the original page loads.
function documentReady()
{
	if(!startupStarted)
	{
		docReadyTime = Date.now();
		
		if(preDocumentStartupPromise === null)
			preDocumentStartupPromise = Promise.reject(Error("PredocumentStartup hasn't occured!"));
		
		preImportStartupPromise = preDocumentStartupPromise.catch(startupFailFunc).then(
			function()
			{
				//The time is still measured when documentReady is run, 
				//but only logged now, since we now know if the logging is enabled.
				//Prevents logging this line when we shouldn't (e.g. release builds).
				console.log("$(document).ready event fired, time since script load",docReadyTime - mainScriptStartTime);
				
				return runTasks("Pre-ImportTasks", startupPreImportTasks)
			});
		
		onReadyDone = true;

		if(importsLoaded && !startupStarted)
		{
			startupStarted = true;
				
			beginStartupAfterImports();
		}
	}
}

//Runs after *all* the imports have loaded or failed
function importDone(e) 
{
	if(!importsLoaded)
	{
		importsLoaded = true;

		htmlImportLoadedTime = Date.now();
		console.log("HTMLImportsLoaded event fired, time since $(document).ready:",htmlImportLoadedTime - docReadyTime);
		
		if(onReadyDone && !startupStarted)
		{
			startupStarted = true;
				
			beginStartupAfterImports();
		}
	}
}

//Call this from htmlimports to ensure their js code is run in a sane order.
//Remember to avoid global variables (eg importDoc must be declared in function scope!), 
//otherwise they might change before the function runs!
function runImportJs(funcToRun)
{
	allTabImportPromises.push(Promise.allFinish(allTabImportPromises).then(funcToRun));
}

function beginStartupAfterImports()
{	
	
	try
	{
		var startupAfterTabImports = 
			function()
			{
				return Promise.allFinish(allTabImportPromises).catch(startupFailFunc).then(awaitOutstandingPropertyPromises)
														.catch(startupFailFunc).then(startup);
			};
		
		if(preImportStartupPromise === null)
			preImportStartupPromise = Promise.reject(Error("PreImportStartup hasn't occured!"));
		
		preImportStartupPromise.catch(startupFailFunc).then(startupAfterTabImports);
	}
	catch(e)
	{
		startupFailFunc(e);
	}
}

function startupFailFunc(e)
{
	if(e && e.stack)
	{
		var stackFirstLine = parseStackForErrorPosition(e.stack);
		
		console.error(logStrCpp("Error on startup: " + e.message + " in: " + stackFirstLine));
		
		if(debugMode) throw e;
	}
}

//Run before the property load
function startupPrePropertyLoad()
{
	return runTasks("PrePropertyLoad", startupPrePropertyLoadTasks);
}

//The property load. Any properties defined with data-attributes in html will get registered and "get"ed from C++
function startupPropertyLoad()
{
	return runTasks("PropertyLoad", startupPropertyLoadTasks);
}

//Post property-load startup tasks
function startupPostPropertyLoad()
{
	return runTasks("PostPropertyLoad", startupPostPropertyLoadTasks);
}

function startupComplete()
{
	return runTasks("startupComplete", startupCompleteTasks);
}

function runTasks(taskGroupName, taskGroupArray)
{
	var lastTaskPromise = Promise.resolve();
	
	//Using each to ensure then doesn't get a variable that gets changed/incremented between iterations 
	//(the function creates a fixed copy for it to use).
	$.each(taskGroupArray,
		function(index, taskFunc)
		{
			var failFunction =
				function(e)
				{
					if(e && e.stack)
					{
						var stackFirstLine = parseStackForErrorPosition(e.stack);
						
						var logLine = 	"Error during " + taskFunc.name + " of " + taskGroupName + ": " + e.message + 
										" in: " + stackFirstLine + ". Attempting to continue.";
						
						console.error(logStrCpp(logLine));
						
						if(debugMode) throw e;
					}
				};
			
			if(!(taskFunc instanceof Function))
			{
				throw Error("taskGroupArray[" + index + "] == " + taskFunc);
			}
			
			lastTaskPromise = lastTaskPromise.then(
				function()
				{
					var promiseFromTask;
					
					try
					{
						promiseFromTask = taskFunc();
					}
					catch(e)
					{
						failFunction(e);
					}
					
					if(promiseFromTask !== undefined && promiseFromTask.then instanceof Function)
					{
						promiseFromTask = promiseFromTask.then(
							function()
							{
								return awaitOutstandingPropertyPromises();
							});
						
						promiseFromTask = promiseFromTask.catch(failFunction);
						
						return promiseFromTask;
					}
					else
						failFunction(new Error("Task " + index + " (" + taskFunc.name + ") in " + taskGroupName + " did not return a promise!"));
				});
		});
	
	return lastTaskPromise;
}

function startup()
{
	startupStartedTime = Date.now();

	var startupTimeCounter = Date.now();
	
	var logTimingsAndErrors = 
		function(taskset, promise)
		{
			var printSuccess = 
				function()
				{
					console.log(taskset + ":", 
								Date.now() - startupTimeCounter); 
					startupTimeCounter = Date.now();
				};
			var printFailure = 
				function(e)
				{
					console.error(logStrCpp(taskset + " completed with failure(s). It completed in: " + 
								  (Date.now() - startupTimeCounter)));
					startupTimeCounter = Date.now();
					throw e;
				};
			
			return promise.then(printSuccess, printFailure);
		};
	
	console.log("Startup function starts, time since htmlImportLoadedTime:",startupStartedTime - htmlImportLoadedTime);
	
	var lastTaskset = startupPrePropertyLoad();
	lastTaskset = logTimingsAndErrors("Pre-property loading tasks", lastTaskset);
	
	lastTaskset = lastTaskset.then(function(){return startupPropertyLoad();});
	lastTaskset = logTimingsAndErrors("Main property load", lastTaskset);

	lastTaskset = lastTaskset.then(function(){return startupPostPropertyLoad();});
	lastTaskset = logTimingsAndErrors("Post property loading tasks", lastTaskset);
	
	lastTaskset = lastTaskset.then(function(){return startupComplete();});
	lastTaskset = logTimingsAndErrors("Startup Completion", lastTaskset);

	lastTaskset.then(
		function()
		{
			startupFinishedTime = Date.now();
			console.log("Total time of startup function:", startupFinishedTime - startupStartedTime);
		},
		function(e)
		{
			var stackFirstLine = parseStackForErrorPosition(e.stack);
			console.error(logStrCpp(e.message + " in " + stackFirstLine));
		});
}


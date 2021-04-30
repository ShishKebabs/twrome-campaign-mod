"use strict";

// importDoc references this import's document
var importDoc;

//The polyfill uses _currentScript, so fallback to that, if the native implementation doesn't seem to be doing anything.
if(document._currentScript !== undefined)
	importDoc = document._currentScript.ownerDocument;
else
	importDoc = document.currentScript.ownerDocument;

// mainDoc references the main document (the page that's importing us)
var mainDoc = document;

//Don't bother importing to the main doc if the entire tab is prohibited.
$(".tabSelect", importDoc).each(
	function(index, para) 
	{
		var theImportDoc = importDoc; //Async functions will get confused since importDoc is global and can change
		
		allTabImportPromises.push(Promise.allFinish(allTabImportPromises).then(
			function()
			{
				var promise = undefined;

				if(index > 0)
				{
					console.error(logStrCpp("Cannot cope with more than 1 tab per import file!"));
					return;
				}
				
				//var shouldImport = true;
				
				var importTab =
					function()
					{
						// Grab the first stylesheet from this import, clone it,
						// and append it to the importing document.
						$("#tabbar", mainDoc).append($(para));
						
						$("#tabView", mainDoc).append($("#" + para.dataset.tabId + ".tabbed", theImportDoc));


						var dialogs = $(".dialogsToAdd>*", theImportDoc);

						if(dialogs.length > 0)
							$("#dialogContainer", mainDoc).append(dialogs);
					};
				
				
				if($(para).is("[data-prohibit-name]"))
				{
					if(!$(para).is("[id]"))
						console.error(logStrCpp("prohibited items should always have an id!"));
					
					promise = hookPropertyToFunction(	$( para ).data("prohibitName"),
															"bool",
						function(propertyName, typePattern, propValueArray)
						{
							var shouldImport = ( propValueArray[0] === false );
							
							if(shouldImport)
							{
								importTab();
							}
						});
					
					promise = promise.catch(
						function(e)
						{
							console.error(logStrCpp("Failed to get prohibited status of tab! Error was: " + e.message));
							if (debugMode) throw e;
						});
					
					allTabImportPromises.push(promise);
				}
				else
					importTab();

				// Make sure this promise doesn't complete until we've actually run importTab.
				return promise;
			}));
		
	});


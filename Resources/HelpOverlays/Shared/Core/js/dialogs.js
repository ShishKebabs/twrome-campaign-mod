"use strict";

startupPostPropertyLoadTasks.push(hookHTMLImporter);
startupPostPropertyLoadTasks.push(initialiseAlertIcon);
startupPostPropertyLoadTasks.push(initialiseDialogs);


function initialiseDialogs()
{
	var allTheDialogs = $( ".dialog" );
	
	var allThePromises = [];
	
	allTheDialogs.each(
		function(index, para)
		{
			allThePromises.push(initialiseDialog(para));
		});
	
	return Promise.allFinish(allThePromises);
}


function replaceElementSrcSetWithGameIcon(element)
{
	var gameIcon = $( "#playBox>.playOption.selectedGame img.gameIconImg" );
	
	//Don't attempt to set the attribute to the fallback if the attribute is already set to the fallback,
	//since that means the fallback failed, and we'd get an infinite loop of failure.
	if(element.attr("srcset") !== gameIcon.attr("srcset"))
		element.attr("srcset", gameIcon.attr("srcset"));
}

function initialiseAlertIcon()
{
	$("#AlertDialog").prepend('<img id="AlertIcon"//>');
	var alertIcon = $("#AlertIcon");

	alertIcon.on("error", function(){replaceElementSrcSetWithGameIcon(alertIcon)});

	var promise = hookPropertyToFunction("AlertDialogIconURL","string",
		function(propertyName, typePattern, propValueArray)
		{
			if(propValueArray[0] != "")
			{
				alertIcon.removeAttr("srcset");
				$("#AlertIcon").attr("src", propValueArray[0]);
			}
			else
			{
				replaceElementSrcSetWithGameIcon(alertIcon);
			}
			return true;
		});

	return promise
}

var dialogsLoadedFromImport = [];
var hasDialoghtmlImported = false;
function hookHTMLImporter()
{
	var importDonePromise = hookPropertyToFunction("importDoneProperty","array<string>",function(){return true;});
	
	var promise = hookPropertyToFunction("importHTMLProperty","string",
		function(propertyName, typePattern, propValueArray)
		{
			if(!hasDialoghtmlImported)
			{
				if(propValueArray[0] != "")
				{
					hasDialoghtmlImported = true;
					var theLink = document.createElement('link');
					theLink.rel = 'import';
					theLink.href = propValueArray[0];
					theLink.onload = function(e)
					{
						importDonePromise.then(
							function()
							{
								setPropertyValue(	"importDoneProperty",
													"array<string>",
													[dialogsLoadedFromImport],
													undefined);
							});
					}
					
					theLink.onerror = function(e) {
						importDonePromise.then(
							function()
							{
								setPropertyValue(	"importDoneProperty",
													"array<string>",
													[dialogsLoadedFromImport],
													undefined);

								console.error(logStrCpp("error linking html for custom alerts!"));
							});
					};

					document.head.appendChild(theLink);
				}else
				{
					importDonePromise.then(
							function()
							{
								setPropertyValue(	"importDoneProperty",
													"array<string>",
													[dialogsLoadedFromImport],
													undefined);
							});
				}
			}else
			{
				console.error(logStrCpp("importHTMLProperty called twice!"));
			}
			return true;
		});

	return promise;
}

function importMyCustomDialogs(importDoc)
{
	var pathToImportDoc = importDoc.baseURI.substring(0, importDoc.baseURI.lastIndexOf('/'));
	var magicPath = "[importPath]/";

	var elementsThatNeedNewPath = $("[src^='[importPath]'], [href^='[importPath]']", importDoc);
	if(elementsThatNeedNewPath.length > 0)
	{
		elementsThatNeedNewPath.each(
			function(index, para)
			{
				if($(para).attr("src") !== undefined )
				{
					$(para).attr("src", pathToImportDoc + '/' + $(para).attr("src").substring(magicPath.length));
				}

				if($(para).attr("href") !== undefined )
				{
					$(para).attr("href", pathToImportDoc + '/' + $(para).attr("href").substring(magicPath.length));
				}
			});
	}

	var dialogs = $(".dialogsToAdd>*", importDoc);

	if(dialogs.length > 0)
	{
		dialogs.each(
			function(index, para)
			{
				dialogsLoadedFromImport.push($(para).data("dialogOpenProperty"));
			});

		$("#dialogContainer", document).append(dialogs);
	}

	initialiseDialogs();
}

function initialiseDialog(dialogElement)
{
	var allThePromises = [];
	
	var jDialogElement = $(dialogElement);
	dialogElement = jDialogElement[0];
	
	var minWidth 			= jDialogElement.data("dialogMinWidth");
	var minHeight 			= jDialogElement.data("dialogMinHeight");
	var maxWidth 			= jDialogElement.data("dialogMaxWidth");
	var maxHeight 			= jDialogElement.data("dialogMaxHeight");
	var shouldhideClose 	= jDialogElement.data("dialogHideClose");
	var buttonsEnabledProps = jDialogElement.data("dialogButtonEnabledProperties");
	var buttonsVisibleProps = jDialogElement.data("dialogButtonVisibleProperties");
	var buttonsPreventProps = jDialogElement.data("dialogButtonPreventCloseProperties");
	var buttonsLeftPosProp  = jDialogElement.data("dialogButtonLeft");
	var buttonAutofocusProp = jDialogElement.data("dialogButtonAutofocus");
	var openCloseProperty 	= jDialogElement.data("dialogOpenProperty");
	var responseProperty 	= jDialogElement.data("dialogResponseProperty");

	var dialogSettings =
		{
			autoOpen: false,
			modal: true,
			show: 
			{
				effect: "clip",
				duration: 200
			},
			hide: 
			{
				effect: "clip",
				duration: 200
			},
			closeOnEscape: false,
			focus:function()
			{
				var currentHeight = jDialogElement.height();

				var scrollHeight = dialogElement.scrollHeight;

				var paddingHeight = jDialogElement.innerHeight() - jDialogElement.height();

				var newHeight = scrollHeight - paddingHeight;

				jDialogElement.height( newHeight );

				jDialogElement.dialog( "option", "position", { my: "center", at: "center", of: window } );
			}
		};

	if( minHeight !== undefined )
	{
		dialogSettings.minHeight = minHeight;
	}

	if( minWidth !== undefined )
	{
		dialogSettings.minWidth = minWidth;
	}
	
	if( maxHeight !== undefined )
	{
		dialogSettings.maxHeight = maxHeight;
		
	}

	if( maxWidth !== undefined )
	{
		dialogSettings.maxWidth = maxWidth;
	}
	
	if(	minHeight !== undefined &&
		minWidth !== undefined  &&
		maxHeight === minHeight && 
		minWidth  === maxWidth     )
	{
		dialogSettings.resizable = false;
	}
	
	if( shouldhideClose !== undefined )
	{
		if(dialogSettings.dialogClass === undefined)
		{
			dialogSettings.dialogClass = "";
		}
		
		dialogSettings.dialogClass += "no-close";
	}
	
	
	if(responseProperty === "" && openCloseProperty !== undefined)
	{
		responseProperty = openCloseProperty+"Response";
	}
	



	var buttonsArray = [];


	var buttonIDs = [];
	var buttonStringKeys = [];
	var stringsToGet = [];


	if(jDialogElement.is("[data-dialog-button-ids]"))
		buttonIDs 		 = jDialogElement.data("dialogButtonIds").split(",");

	if(jDialogElement.is("[data-dialog-button-strings]"))
		buttonStringKeys = jDialogElement.data("dialogButtonStrings").split(",");


	for (var i = 0 ; i < buttonIDs.length ; i++) 
	{
		//default to the buttons id if it lacks a string property
		var stringKey = buttonIDs[i];

		if(i < buttonStringKeys.length && buttonStringKeys[i] !== "")
		{
			stringKey = buttonStringKeys[i];
			stringsToGet.push(buttonStringKeys[i]);
		}

		//This is a little bit magical. http://ragle.sanukcode.net/articles/scope-jacking/
		//The buttonID is kept in the handler ready to be called (aka "partial application", wiki it).
		var buttonClickHandlerWithID = function(buttonID, buttonName, canBePrevented)
		{
			var clickHandler = function(event)
				{
					var button = $(this).parent().find("[data-button-id=\"" + buttonName + "\"]");
					
					
					var shouldPrevent = false;
					if(responseProperty !== undefined)
					{
						setDisabled(button[0], true);
						var promise = setWriteOnlyPropertyValue(responseProperty,
																"string",
																[buttonName]);
						
						promise = promise.then(
							function()
							{
								setDisabled(button[0], false);
							});
					}
					
					if(canBePrevented)
					{
						
						if(button[0])
						{
							shouldPrevent = button.data("shouldPreventClose");
							
						}
						else
						{
							console.error(logStrCpp("Can't find button '" + buttonName + "'." +
													" Preventing of close may have failed, closing dialog."));
						}
					}
					
					if(!shouldPrevent)
						$( this ).dialog( "close" );
				};

			return clickHandler;
		};

		//We aren't localising/getting the strings from properties yet,
		//as the string setter will need the dialog beforehand constructed to work.
		buttonsArray.push(
			{
				text: stringKey,
				click:	buttonClickHandlerWithID(	i, 
													buttonIDs[i], 
													(buttonsPreventProps !== undefined && openCloseProperty !== undefined))
			});
	};

	dialogSettings.buttons = buttonsArray;

	
	//Create the dialog
	jDialogElement.dialog(dialogSettings);
	
	dialogElement.dataset.dialogWaitingToReopen = "false";
	dialogElement.dataset.dialogClosing = "false";
	jDialogElement.dialog(
		{
			open: 
				function( event, ui ) 
				{
					//Send the property if it exists, unless we have the
					//propEvent hint, which indicates that the open was
					//requested by a property push from C++, so pushing back
					//will just cause confusion
					if( this.dataset.dialogOpenProperty !== undefined &&
						this.dataset.propEvent !== "true")
					{
						setPropertyValue(	openCloseProperty,
											"bool",
											[true],
											[dialogElement]);
					}
					
					this.dataset.propEvent = "false";
				},
			close: 
				function( event, ui ) 
				{
					//Send the property if it exists, unless we have the
					//propEvent hint, which indicates that the open was
					//requested by a property push from C++, so pushing back
					//will just cause confusion
					if( this.dataset.dialogOpenProperty !== undefined &&
						this.dataset.propEvent !== "true" )
					{
						setPropertyValue(	openCloseProperty,
											"bool",
											[false],
											[dialogElement]);
					}
					if(this.dataset.dialogClosing === "true")
					{
						this.dataset.dialogClosing = "false";
						if(this.dataset.dialogWaitingToReopen === "true") 
						{
							this.dataset.dialogWaitingToReopen = "false"; 
							$( this ).dialog("open");
						}
					}
					else if(this.dataset.dialogWaitingToReopen === "true") 
						console.error(logStrCpp("delayed reopen requested for dialog that isn't mid-closing!"));
					
					this.dataset.propEvent = "false";
				}
		});
	
	jDialogElement.addClass("jQueryUIDialogInitialised");
	
	
	var buttonPane = jDialogElement.parent().find(".ui-dialog-buttonpane");
	
	buttonPane.find("button").each(
		function(buttonIndex, buttonPara)
		{
			//Must be standard dataset access rather than jquery data() access, else it wont be detected by selectors
			buttonPara.dataset.buttonId = buttonIDs[buttonIndex];
			
			if(buttonsLeftPosProp !== undefined && buttonIDs[buttonIndex] === buttonsLeftPosProp)
			{
				$(buttonPara).addClass("dialogButtonOnLeft");
			}
			
			if(buttonIDs[buttonIndex] === buttonAutofocusProp)
			{
				$(buttonPara).prop("autofocus", true);
			}
			else if (buttonAutofocusProp == "none")
			{
				$(buttonPara).prop("tabindex", "-1");
			}
			
			if(buttonsEnabledProps !== undefined && openCloseProperty !== undefined)
			{
				//Must be standard dataset access rather than jquery data() access, else it wont be detected by selectors
				buttonPara.dataset.enabledName = openCloseProperty + "Enabled-" + buttonIDs[buttonIndex];
				
				allThePromises.push(
					hookPropertyToElement(	buttonPara.dataset.enabledName,
											"bool",
											buttonPara));
			}
			
			if(buttonsVisibleProps !== undefined && openCloseProperty !== undefined)
			{
				//Must be standard dataset access rather than jquery data() access, else it wont be detected by selectors
				buttonPara.dataset.visibleName = openCloseProperty + "Visible-" + buttonIDs[buttonIndex];
				
				allThePromises.push(
					hookPropertyToElement(	buttonPara.dataset.visibleName,
											"bool",
											buttonPara));
			}
			
			if(buttonsPreventProps !== undefined && openCloseProperty !== undefined)
			{
				//Must be standard dataset access rather than jquery data() access, else it wont be detected by selectors
				buttonPara.dataset.preventCloseName = openCloseProperty + "PreventClose-" + buttonIDs[buttonIndex];
				
				allThePromises.push(
					hookPropertyToFunction(	buttonPara.dataset.preventCloseName,
											"bool",
						function(propertyName, typePattern, propValueArray)
						{
							$(buttonPara).data("shouldPreventClose", propValueArray[0]);
							return true;
						}));
			}
			
			//Bit of a hack, we're relying on the implementation details of jQuery's dialog
			$(buttonPara).children()[0].dataset.innerString = stringsToGet[buttonIndex];
			
			var typePatternOfString = "string";
			if(stringsToGet[buttonIndex].startsWith("localise-"))
				typePatternOfString = "string,bool"
			allThePromises.push(
				hookPropertyToElement(	stringsToGet[buttonIndex],
										typePatternOfString,
										$(buttonPara).children()[0]));
		});

	

	if(responseProperty !== undefined)
	{
		allThePromises.push(
			registerWriteOnlyProperty(responseProperty, "string"));
	}

	if(openCloseProperty !== undefined)
	{
		allThePromises.push(
			hookPropertyToElement(	openCloseProperty,
									"bool",
									dialogElement));
	}
	
	return Promise.allFinish(allThePromises);
}

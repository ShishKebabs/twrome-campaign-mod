"use strict";

//Must be done first, so we don't try to do anything with prohibited stuff.
startupPrePropertyLoadTasks.push(initialiseAndApplyProhibitProperties);

startupPropertyLoadTasks.push(initialiseProperties);


function initialiseAndApplyProhibitProperties()
{
	var allThePromises = [];
	
	$( "[data-prohibit-name]" ).each(
		function(index, para) 
		{
			allThePromises.push(
				hookPropertyToElement(	$( para ).data("prohibitName"),
										"bool",
										para));
		});
	
	return Promise.allFinish(allThePromises);
}


function initialiseProperties()
{
	return initialisePropertiesWithinElement(document);
}

function initialisePropertiesWithinElement(element, checkRootelements)
{
	var propertiesSearchString =  	"[data-value-string]," +
									"[data-inner-string]," +
									"[data-inner-html]," +
									"[data-title-string]," +
									"[data-class-string]," +
									"[data-src-string]," +
									"[data-srcset-string]," +
									"select[data-list-name]," +
									"[data-property-name]," +
									"select[data-enabled-name]," +
									"input[data-enabled-name]," +
									"textarea[data-enabled-name]," +
									"[data-visible-name]," +
									"[data-href-string]," +
									"[data-placeholder-string]," +
									"[data-dialog-button-autofocus-string]," +
									"[data-range-name]," +
									"[data-multiselect-options]";
	
	var allTheProperties = $( propertiesSearchString, element );
	if(checkRootelements)
		allTheProperties.add($(element).filter(propertiesSearchString));
	
	var registerPropertiesForElement = 
		function(para)
		{
			var jPara = $( para );
			
			var promises = [];
			
			if( jPara.is("[data-value-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("valueString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("valueString"),
											typePatternOfString,
											para));
			}

			if( jPara.is("[data-inner-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("innerString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("innerString"),
											typePatternOfString,
											para));
			}
			
			if( jPara.is("[data-inner-html]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("innerHtml").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("innerHtml"),
											typePatternOfString,
											para));
			}

			if( jPara.is("[data-title-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("titleString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("titleString"),
											typePatternOfString,
											para));
			}

			if( jPara.is("[data-src-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("srcString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("srcString"),
											typePatternOfString,
											para));
			}
			
			if( jPara.is("[data-class-string]") )
			{
				promises.push(
							  hookPropertyToElement(jPara.data("classString"),
													typePatternOfString,
													para));
			}

			if( jPara.is("[data-srcset-string]") )
			{
				promises.push(
					hookPropertyToElement(	jPara.data("srcsetString"),
											"string",
											para));
			}

			//Must be done before data-property-name, so that the correct default can be selected
			if(jPara.is("select[data-list-name]"))
			{
				promises.push(
					hookPropertyToElement(	jPara.data("listName"),
											"array<string>",
											para));
			}

			if(jPara.is("[data-property-name]"))
			{
				promises.push(
					hookPropertyToElement(	jPara.data("propertyName"),
											jPara.data("propertyType"),
											para));
			}

			if(jPara.is("select[data-enabled-name],input[data-enabled-name],textarea[data-enabled-name]"))
			{
				promises.push(
					hookPropertyToElement(	jPara.data("enabledName"),
											"bool",
											para));
			}

			if(jPara.is("[data-visible-name]"))
			{
				promises.push(
					hookPropertyToElement(	jPara.data("visibleName"),
											"bool",
											para));
			}

			if( jPara.is("[data-href-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("hrefString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("hrefString"),
											typePatternOfString,
											para));
			}

			if ( jPara.is("[data-placeholder-string]") )
			{
				var typePatternOfString = "string";
				if(jPara.data("placeholderString").startsWith("localise-"))
					typePatternOfString = "string,bool";
				promises.push(
					hookPropertyToElement(	jPara.data("placeholderString"),
											typePatternOfString,
											para));
			}
			
			if(jPara.is("[data-dialog-button-autofocus-string]"))
			{
				promises.push(
							  hookPropertyToElement(jPara.data("dialogButtonAutofocusString"),
													typePatternOfString,
													para));
			}

			if( jPara.is("[data-range-name]"))
			{
				var dataRangeName = jPara.data("rangeName");

				var typePattern = "int,int";
				if(jPara.is("progress"))
					typePattern = "int" // progress elements don't have a min value
	
				promises.push(
							  hookPropertyToElement(dataRangeName,
													typePattern,
													para));
			}

			if (jPara.is("[data-multiselect-options]"))
			{
				var dataMultiselectOptions = jPara.data("multiselectOptions");
				promises.push(hookPropertyToElement(dataMultiselectOptions,
													"int,bool,string,string",
													para));
			}
			
			return Promise.allFinish(promises);
		};
	
	var allThePromises = [];
	
	allTheProperties.each(
	 	function(index, para) 
		{
			var promise;
			try
			{
				promise = registerPropertiesForElement(para);
			}
			catch(e)
			{
				if(e && e.stack)
				{
					var stackFirstLine = parseStackForErrorPosition(e.stack);
					var logLine = 	"Error during property registration for element: " + e.message + 
									" in: " + stackFirstLine + ". Attempting to continue.";
					
					console.error(logStrCpp(logLine));
				}
				
				if(debugMode) throw e;
			}
			
			promise.catch(
				function(e)
				{
					var stackFirstLine = parseStackForErrorPosition(e.stack);
					
					var logLine = 	"Error during property registration for element " + para.id + ": " + e.message + 
									" in: " + stackFirstLine + ". Attempting to continue.";
					
					console.error(logStrCpp(logLine));
					
					return Promise.reject(e);
				});
			
			allThePromises.push(promise);
		});
	
	return Promise.allFinish(allThePromises);
}

function setJSStateOfProperty(propertyName, typePattern, propValueArray, optionalFuncsAndElemsToSkip)
{
	if(optionalFuncsAndElemsToSkip === undefined)
		optionalFuncsAndElemsToSkip = [];
	
	var originalElements;
	var elementsToUpdate;
	
	if(optionalFuncsAndElemsToSkip.length > 0 && propertyManager.propertyMap[propertyName].elements !== undefined)
	{
		//Keep a reference to the original array
		originalElements = propertyManager.propertyMap[propertyName].elements;
		//Make a clone of the array
		elementsToUpdate = originalElements.slice(0);
		
		for(var i = 0 ; i < optionalFuncsAndElemsToSkip.length ; i++)
		{
			var skippedElementPos = elementsToUpdate.indexOf(optionalFuncsAndElemsToSkip[i]);
			//We don't really care if some of them are functions, not elements, since they won't be equal
			if(skippedElementPos !== -1)
				elementsToUpdate.splice(skippedElementPos, 1);
		}
		
		propertyManager.propertyMap[propertyName].elements = elementsToUpdate;
	} 
	
	if(typePattern === "bool" && propValueArray[0] !== undefined)
	{
		setProhibited(propertyName, typePattern, propValueArray);
		setEnabled(propertyName, typePattern, propValueArray);
		setVisible(propertyName, typePattern, propValueArray);
		setOpen(propertyName, typePattern, propValueArray);
	}
	else if(typePattern === "string,bool" ||
			typePattern === "string") //String property setting can cope with undefined errors itself, and that is preferable.
	{
		setString(propertyName, typePattern, propValueArray);
	}
	else if(typePattern === "array<string>" && propValueArray[0] !== undefined)
	{
		setSelectList(propertyName, typePattern, propValueArray);
	}

	if(typePattern.length == 0 || propValueArray[0] !== undefined)
	{
		setJSStateOfGenericProperty(propertyName, typePattern, propValueArray);
	}
	
	//Return to original elements, if any were removed
	if(originalElements !== undefined)
	{
		propertyManager.propertyMap[propertyName].elements = originalElements;
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function getRawObjectIfJquery(element)
{
	if (element instanceof jQuery)
	{
		return element[0];
	}
	else
	{
		return element;
	}
}

function setJSStateOfGenericProperty(propertyName, typePattern, propValueArray)
{
	for(var i = 0 ; 
		propertyManager.propertyMap[propertyName] !== undefined && 
			i < propertyManager.propertyMap[propertyName].elements.length ; 
		i++)
	{
		var element = propertyManager.propertyMap[propertyName].elements[i];
		element = getRawObjectIfJquery(element);

		if( (								   element.getAttribute("data-property-name") === propertyName) ||
			(typePattern.startsWith("bool") && element.getAttribute("data-property-name") === "!" + propertyName) )
		{
			if(typePattern.startsWith("bool"))
			{
				var boolValue = propValueArray[0];

				if($( element ).data("propertyName").startsWith("!"))
				{
					boolValue = !boolValue;
				}

				if($( element ).is("input") && $( element ).attr('type') === "checkbox")
				{
					$( element ).prop('checked', boolValue > 0);
					if(typePattern === "bool,bool")
					{
						$( element ).prop('indeterminate', !propValueArray[1]);
					}
				}
				else
				{
					console.error(logStrCpp("Don't know how to apply bool property " + propertyName + " to anything except a checkbox"));
				}
			}
			else if(typePattern === "")
			{
				//No state to apply, we probably don't need to do anything here. 
				//Maybe some JS functions will respond to the event, but we don't have to.
			}
			else if(  typePattern === "string" && ( $( element ).is("input[type=text]") || 
													$( element ).is("input[type=email]") || 
													$( element ).is("input[type=password]") || 
													$( element ).is("textarea") )  )
			{
				if($( element ).val() !== propValueArray[0])
					$( element ).val(propValueArray[0]);
			}
			else if(typePattern === "string" && $( element ).is("input[type=color]"))
			{
				if($( element ).val() !== propValueArray[0])
				{
					$( element ).val(propValueArray[0]);
					$( element ).spectrum("set", propValueArray[0]);
				}
			}
			else if(typePattern === "int" || typePattern === "int,string")
			{
				if($( element ).is("select"))
				{
					var optionElements = $(element).find("option");
					var firstAssignedNumericValue = optionElements.data("option-value");

					if (firstAssignedNumericValue != undefined)
					{
						// Find the option-value that matches propValueArray[0], and then pass the index.
						for (var i = 0; i < optionElements.length; i++)
						{
							var optionValue = $(optionElements[i]).data("option-value");
							if (optionValue === propValueArray[0])
							{
								$( element ).prop("selectedIndex", i);
							}
						};
					}
					else
					{
						$( element ).prop("selectedIndex", propValueArray[0]);
					}
					
					if($( element ).is(".selectBox"))
					{
						$( element ).selectric('refresh');
					}
				}
                
                if ($( element ).is( "input[type=range]" ) || $( element ).is( "input[type=number]" ))
                {
	                $( element ).val(propValueArray[0]);
                }

				if($(element).is("#tabbar") &&
					element.getAttribute("data-property-name") === propertyName && 
					typePattern === "int")
				{
					//Special-case for tabbar.
					
					//We currently use an int in C++, but this lacks flexibility, so lets play with the decimal place a little
					var tabPosition = propValueArray[0]/10000.0; 
					
					var tabButton = $("#tabbar>.tabSelect[data-tab-position=\"" + tabPosition + "\"]");
					if(tabButton.length > 0)
					{
						if(!tabButton.hasClass("noDisplay"))
							switchTab(tabButton);
						else
							console.log("Cannot switch to tab position " + tabPosition + " as it isn't visible");
					}
					else
						console.log("Cannot switch to tab position " + tabPosition + " as it doesn't exist");
				}
			}
			else if (typePattern == "array<int,string>")
			{
				var theElement = $(element);

				if (theElement.is("select") && theElement.attr("multiple") && theElement.hasClass("chosen-select"))
				{
					// Clear the selected options, first of all.
					theElement.find("option").attr('selected', false);
					theElement.find("option").prop('selected', false);

					for (var i = 0; i < propValueArray[0].length; i++)
					{
						var theOptions = theElement.find("option").eq(propValueArray[0][i][0]);
						theOptions.attr('selected', 'selected');
						theOptions.prop('selected', true);
					}

					theElement.trigger('chosen:updated');
				}
			}
			else if (typePattern == "array<string>")
			{
				if ($(element).is("ul"))
				{
					$(element).empty();

					for (var i = 0; i < propValueArray[0].length; i++)
					{
						$(element).append("<li>" + propValueArray[0][i] + "</li>");
					}
				}
			}
			else
			{
				console.error(logStrCpp("Property " + propertyName + " with type " + typePattern + " is UNIMPLEMENTED"));
			}
		}
		else if ( element.getAttribute("data-range-name") === propertyName )
        {
        	if ($( element ).is( "input[type=range]" ) || $( element ).is( "input[type=number]" ))
        	{
        		$( element ).attr({"min": propValueArray[0], "max": propValueArray[1]});
        	}
			else if ($( element ).is( "progress" ))
			{
				$( element ).attr("max", propValueArray[0]);
			}
        }
		else if ( element.getAttribute("data-multiselect-options") === propertyName )
		{
			if ($(element).is("select") && $(element).attr("multiple") && $(element).hasClass("chosen-select"))
			{
				// This initialises the multiselect, so right now we're getting lucky that this is called after setSelectList().
				$(element).chosen({
					max_selected_options: propValueArray[0],
					display_selected_options: propValueArray[1],
					placeholder_text_multiple: propValueArray[2],
					no_results_text: propValueArray[3]
				});
			}
			else
			{
				console.error(logStrCpp("Property " + propertyName + " with type " + typePattern + "for element type" + $(element).prop("nodeName") + " is UNIMPLEMENTED"));
			}
        }
	}
}

function setSelectList(propertyName, typePattern, propValueArray)
{
	if(typePattern === "array<string>")
	{
		var array = propValueArray[0];

		if(array instanceof Array)
		{
			for(var elementNum = 0 ; 
				propertyManager.propertyMap[propertyName] !== undefined && 
					elementNum < propertyManager.propertyMap[propertyName].elements.length ; 
				elementNum++)
			{
				var element = propertyManager.propertyMap[propertyName].elements[elementNum];

				if( $( element ).is("select") && 
					element.getAttribute("data-list-name") === propertyName )
				{
					$( element ).html("");

					for(var optionNum = 0 ; optionNum < array.length ; optionNum++)
					{
						var optionText = array[optionNum];
						
						var attrText = "";
						var testText = "option";
						var valueText = "value";
						var styleDisabled = "";
						
						if(optionText === "[SEPARATOR]")
						{
							// <li data-index="3" class=""></li>
							attrText = 'disabled= "disabled" class=" disabled separator selectricDisabled"';
							styleDisabled = "<style>pointer-events: none</style>";
							//Remove the hint
							optionText = "";
						}
						else if(optionText.startsWith("[TITLE]"))
						{
							testText = "optgroup";
							attrText = "data-title ";
							valueText = "label";
							//Remove the hint
							optionText = optionText.substr(7);
						}
						//			eg:		 <option data-seperator label="fart">fart</option>
						$( element ).append('<' + testText + ' ' + attrText + valueText +'="' + optionText + '">' + optionText + '</' + testText + '>' + styleDisabled);
					}

					if($( element ).is(".selectBox"))
					{
						$( element ).selectric('refresh');
					}
					else if ($( element ).is(".chosen-select"))
					{
						// We can't call this, because we need to pass in the options
						// from data-multiselect-options at initialisation of the select.
						// Right now we are getting lucky that data-multiselect-options
						// is called after this, otherwise we'd have nothing in the list.
						//$(element).chosen();
					}
				}
			}
		}
	}
	else
	{
		console.error(logStrCpp("setSelectList cannot cope with any type pattern but \"array<string>\""));
	}
}

function setProhibited(propertyName, typePattern, propValueArray)
{
	if(typePattern === "bool")
	{
		for(var i = 0 ; 
			propertyManager.propertyMap[propertyName] !== undefined && 
				i < propertyManager.propertyMap[propertyName].elements.length ; 
			i++)
		{
			var element = propertyManager.propertyMap[propertyName].elements[i];
			element = getRawObjectIfJquery(element);

			//Lets be helpful and allow "not" to be applied to bool type values
			if(	element.getAttribute("data-prohibit-name") === propertyName ||
				element.getAttribute("data-prohibit-name") === "!" + propertyName )
			{
				var isProhibited = propValueArray[0];
				
				if($( element ).data("prohibitName").startsWith("!"))
					isProhibited = !isProhibited;

				if( isProhibited )
					$( element ).remove();
			}
		}
	}
	else
	{
		console.error(logStrCpp("setProhibited cannot cope with any type pattern but \"bool\""));
	}
}

function setEnabled(propertyName, typePattern, propValueArray)
{
	if(typePattern === "bool")
	{
		for(var i = 0 ; 
			propertyManager.propertyMap[propertyName] !== undefined && 
				i < propertyManager.propertyMap[propertyName].elements.length ; 
			i++)
		{
			var element = propertyManager.propertyMap[propertyName].elements[i];
			element = getRawObjectIfJquery(element);

			//Lets be helpful and allow "not" to be applied to bool type values
			if(	element.getAttribute("data-enabled-name") === propertyName ||
				element.getAttribute("data-enabled-name") === "!" + propertyName )
			{
				var shouldBeDisabled = !propValueArray[0];
				
				if($( element ).data("enabledName").startsWith("!"))
					shouldBeDisabled = !shouldBeDisabled;
				
				var currDisabledforProperty = $(element).data("disabledForProperty");
				
				//Default state is enabled
				if(currDisabledforProperty === undefined)
					currDisabledforProperty = false;
				
				//If disabledForProperty has changed, update the disabled state
				if(currDisabledforProperty !== shouldBeDisabled)
				{
					currDisabledforProperty = shouldBeDisabled;
					setDisabled(element, shouldBeDisabled);
				}
				
				$(element).data("disabledForProperty", currDisabledforProperty);

				// Not sure what this was for...
				// if($( element ).is(""))
				// {
				// 	$( element ).button("refresh");
				// }
			}
		}
	}
	else
	{
		console.error(logStrCpp("setEnabled cannot cope with any type pattern but \"bool\""));
	}
}

function setVisible(propertyName, typePattern, propValueArray)
{
	if(typePattern === "bool")
	{
		for(var i = 0 ; 
			propertyManager.propertyMap[propertyName] !== undefined && 
				i < propertyManager.propertyMap[propertyName].elements.length ; 
			i++)
		{
			var element = propertyManager.propertyMap[propertyName].elements[i];
			element = getRawObjectIfJquery(element);

			//Lets be helpful and allow "not" to be applied to bool type values
			if(	element.getAttribute("data-visible-name") === propertyName || 
				element.getAttribute("data-visible-name") === "!" + propertyName )
			{
				var isVisible = propValueArray[0];

				if($(element).data("visibleName").startsWith("!"))
					isVisible = !isVisible;

				if(isVisible)
				{
					$(element).removeClass("noDisplay");
					
					if($( element ).parent().is(".buttonset"))
					{
						$( element ).parent().buttonset("refresh");
					}
				}
				else
				{
					$(element).addClass("noDisplay");
					
					if($(element).is(":focus"))
					{
						$(element).blur();
					}
					else if($(element).find(":focus"))
					{
						$(element).find(":focus").blur();
					}

					if($( element ).parent().is(".buttonset"))
					{
						$( element ).parent().buttonset("refresh");
					}
				}
			}
		}
	}
	else
	{
		console.error(logStrCpp("setVisible cannot cope with any type pattern but \"bool\""));
	}
}

function setOpen(propertyName, typePattern, propValueArray)
{
	if(typePattern === "bool")
	{
		for(var i = 0 ; 
			propertyManager.propertyMap[propertyName] !== undefined && 
				i < propertyManager.propertyMap[propertyName].elements.length ; 
			i++)
		{
			var element = propertyManager.propertyMap[propertyName].elements[i];
			element = getRawObjectIfJquery(element);

			//Lets be helpful and allow "not" to be applied to bool type values
			if(	element.getAttribute("data-dialog-open-property") === propertyName || 
				element.getAttribute("data-dialog-open-property") === "!" + propertyName )
			{
				var isOpen = propValueArray[0];
				if($(element).data("dialogOpenProperty").startsWith("!"))
					isOpen = !isOpen;

				if(isOpen != $( element ).dialog( "isOpen" ) || 
				   element.dataset.dialogClosing === "true" || 
				   element.dataset.dialogWaitingToReopen === "true")
				{
					if(isOpen)
					{
						if(element.dataset.dialogClosing === "true")
							element.dataset.dialogWaitingToReopen = "true";
						else
						{
							element.dataset.propEvent = "true";
							$( element ).dialog( "open" );
						}
					}
					else
					{
						element.dataset.dialogWaitingToReopen = "false";
						if(element.dataset.dialogClosing !== "true")
						{
							element.dataset.dialogClosing = "true";
							element.dataset.propEvent = "true";
							$( element ).dialog( "close" );
						}
					}
				}
			}
		}
	}
	else
	{
		console.error(logStrCpp("setOpen cannot cope with any type pattern but \"bool\""));
	}
}

function setString(propertyName, typePattern, propValueArray)
{
	if(typePattern === "string" || typePattern === "string,bool")
	{
		var localisedString = "";

		var propertyGetFailed = false;

		try
		{
			localisedString = propValueArray[0];
			
			//Empty strings are not an error, they are a legitimate response.
			if(	localisedString === undefined ||
				(typePattern === "string,bool" && propValueArray[1] !== true))
				propertyGetFailed = true;
			else
			{
				//&apos; is funky in html, so replace it with &#39;
				localisedString = localisedString.replace(/&apos;/g, '&#39;');
				
				//Attempt to avoid punctuation ending on a new line in French-like 
				//languages where it has a space before it.
				localisedString = localisedString.replace(/ ([?:.,!»])/g, '&nbsp;$1');
				localisedString = localisedString.replace(/([«]) /g, '$1&nbsp;');
			}
		}
		catch(e)
		{
			propertyGetFailed = true;
			console.error(logStrCpp("Localisation of " + propertyName + " failed. " + e.message));
		}

		var localiseFailedShortWarning = "[MISSING]";
		var localiseFailedWarning = "[MISSING] ";
		if (testerMode)
			localiseFailedWarning = "[MISSING](" + propertyName + ") ";

		for(var i = 0 ; 
			propertyManager.propertyMap[propertyName] !== undefined && 
				i < propertyManager.propertyMap[propertyName].elements.length ; 
			i++)
		{
			var element = propertyManager.propertyMap[propertyName].elements[i];

			if(element.getAttribute("data-value-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);
				
				//something has gone wrong, lets make that extra clear, since the default values may look ok in english
				if(propertyGetFailed)
				{
					var currentString = $(element).attr("value");
					
					if(!currentString.startsWith(localiseFailedShortWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString;
					else if (!currentString.startsWith(localiseFailedWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString.substr(localiseFailedShortWarning.length);
					else
						localisedStringWithFallback = currentString;
				}
				
				$( element ).attr("value", localisedStringWithFallback);
			}

			if(element.getAttribute("data-inner-string") === propertyName)
			{
				var localisedStringWithFallback = localisedString;
				
				//something has gone wrong, lets make that extra clear, since the default values may look ok in english
				if(propertyGetFailed)
				{
					var currentString = $(element).html();
					
					if(!currentString.startsWith(localiseFailedShortWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString;
					else if (!currentString.startsWith(localiseFailedWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString.substr(localiseFailedShortWarning.length);
					else
						localisedStringWithFallback = currentString;
				}
				else
				{
					//Effect of newlines needs to be simulated
					localisedStringWithFallback = localisedStringWithFallback.replace(/[\n\r]/g, "<br />\n");
				}

				$( element ).html(localisedStringWithFallback);

				if ($(element).is("select.selectBox option"))
				{
					$(element).parent().selectric('refresh');
				}
			}
			
			if(element.getAttribute("data-inner-html") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);
				
				//something has gone wrong, lets make that extra clear, since the default values may look ok in english
				if(propertyGetFailed)
				{
					var currentString = $(element).html();
					
					if(!currentString.startsWith(localiseFailedShortWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString;
					else if (!currentString.startsWith(localiseFailedWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString.substr(localiseFailedShortWarning.length);
					else
						localisedStringWithFallback = currentString;
				}
				
				$( element ).html(localisedStringWithFallback);
				
				if ($(element).is("select.selectBox option"))
				{
					$(element).parent().selectric('refresh');
				}
			}

			if(element.getAttribute("data-title-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);

				//something has gone wrong, lets make that extra clear, since the default values may look ok in english
				if(propertyGetFailed)
				{
					var currentString = $(element).attr("title");
					
					if(!currentString.startsWith(localiseFailedShortWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString;
					else if (!currentString.startsWith(localiseFailedWarning))
						localisedStringWithFallback = localiseFailedWarning + currentString.substr(localiseFailedShortWarning.length);
					else
						localisedStringWithFallback = currentString;
				}
				
				$( element ).attr("title", localisedStringWithFallback);

				if($( element ).is(".jQueryUIDialogInitialised"))
					$( element ).dialog("option", "title", localisedStringWithFallback);
			}

			if(element.getAttribute("data-src-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);

				//something has gone wrong, but this is a url, so nothing we can do visually.
				if(propertyGetFailed)
				{
					localisedStringWithFallback = $(element).attr("src");
				}
				
				$( element ).attr("src", localisedStringWithFallback);

				if($( element ).is(".jQueryUIDialogInitialised"))
					$( element ).dialog("option", "title", localisedStringWithFallback);

				var src = $ ( element ).attr('src');
				if ($( element ).is("iframe") && src != undefined && src.indexOf('#') !== -1 )
				{
					var anchor = src.substr(src.indexOf('#'));
					$( element ).attr('onLoad', 'scrollIframeToAnchor(this, "' + anchor + '")');
				}
				else
				{
					// It would have been better to put this at the end of scrollIframeToAnchor, but webkit attempts to load each page
					// twice, causing weird timing issues. Result is that the anchor is ignored sporadically anytime after the first load.
					$( element ).removeAttr('onLoad');
				}
			}
			
			if(element.getAttribute("data-class-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);
				
				if(localisedStringWithFallback.length > 0)
				{
					// For each class, either add or remove it
					var classes = localisedStringWithFallback.split(' ');
					for (var i in classes)
					{
						var modifier = classes[i].substr(0, 1);
						var classname = classes[i].substr((modifier == '-' || modifier == '+') ? 1 : 0);
						if (modifier == '-')
						{
							$( element ).removeClass(classname);
						} else
						{
							$( element ).addClass(classname);
						}
					}
				}
			}
			
			if(element.getAttribute("data-dialog-button-autofocus-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);
				
				$( element ).attr("data-dialog-button-autofocus", localisedStringWithFallback);
			}

			if(element.getAttribute("data-srcset-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);

				//something has gone wrong, but this is a url, so nothing we can do visually.
				if(propertyGetFailed)
				{
					localisedStringWithFallback = $(element).attr("srcset");
				}

				$( element ).attr("srcset", localisedStringWithFallback);
			}

			if(element.getAttribute("data-href-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);

				//something has gone wrong, but this is a url, so nothing we can do visually.
				if(propertyGetFailed)
				{
					localisedStringWithFallback = $(element).attr("href");
				}
				
				$( element ).attr("href", localisedStringWithFallback);

				if($( element ).is(".jQueryUIDialogInitialised"))
					$( element ).dialog("option", "title", localisedStringWithFallback);
			}

			if(element.getAttribute("data-placeholder-string") === propertyName)
			{
				var localisedStringWithFallback = htmlDecode(localisedString);

				//something has gone wrong, but this is a url, so nothing we can do visually.
				if(propertyGetFailed)
				{
					localisedStringWithFallback = $(element).attr("placeholder");
				}
				
				$( element ).attr("placeholder", localisedStringWithFallback);
			}
		}
	}
	else
	{
		console.error(logStrCpp("setString cannot cope with any type pattern but \"string\" and \"string,bool\""));
	}
}

function scrollIframeToAnchor(iframe, anchor)
{
	// We expect anchor to already have the # prefix. Otherwise we end up stripping it off only to add it again here.
	var anchorElement = $(anchor, iframe.contentWindow.document);
	if (anchorElement.length)
	{
		iframe.contentWindow.scrollTo(anchorElement[0].offsetLeft, anchorElement[0].offsetTop);
	}
}


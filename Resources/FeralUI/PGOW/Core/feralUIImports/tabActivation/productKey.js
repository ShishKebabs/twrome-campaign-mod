"use strict";

function InitProductKeyInputs()
{
	if($("#tabContentActivation .productKeyEntry").length > 0)
	{
		return InitProductKeyInput(	$("#tabContentActivation .productKeyEntry"),
									"Act",
									$("#tabContentActivation #ProductKeySaveActivate"));
	}
	else
		return Promise.resolve();
	
}

//Add product key initialisation to the startup
startupPostPropertyLoadTasks.push(InitProductKeyInputs);

var productKeyPropElemMap = {};

function InitProductKeyInput(parentElement, propertyPrefix, saveButton)
{
	if(!parentElement.is(".productKeyEntry"))
	{
		console.error(logStrCpp("Parent is not productKeyEntry class"));
		return Promise.resolve();
		//return Promise.reject(Error("Parent is not productKeyEntry class"));
	}
	
	if($(".productKeyEntry", parentElement).length > 0)
	{
		console.error(logStrCpp("productKeyEntry stored within productKeyEntry"));
		return Promise.resolve();
		//return Promise.reject(Error("productKeyEntry stored within productKeyEntry"));
	}
	
	var allThePromises = [];
	
	parentElement[0].dataset.propertyPrefix = propertyPrefix;
	parentElement.data("saveButton"    , saveButton);
	
	$( ".productKeyInput", parentElement ).on("input"  , productKeyInputHandler)
										  .on("focus"  , productKeyFocusHandler)
										  .on("blur"   , productKeyBlurHandler)
										  .on("keydown", productKeyKeyDownHandler)
										  .on("paste"  , productKeyPasteHandler)
										  .on("drop"   , productKeyDropHandler);
	
	if(productKeyPropElemMap[propertyPrefix] === undefined)
		productKeyPropElemMap[propertyPrefix] = [];
	
	productKeyPropElemMap[propertyPrefix].push(parentElement);
	
	allThePromises.push(
		hookPropertyToFunction(	propertyPrefix + ".ProductKey",
								"string",
								setProductKey));
	
	allThePromises.push(
		hookPropertyToFunction(	propertyPrefix + ".ProductKeyTextFromClipboard",
								"string",
			function(propertyName, typePattern, propValueArray)
			{
				parentElement.data("lastTextFromClipboard", propValueArray[0]);
				return true;
			}));
	
	allThePromises.push(
		hookPropertyToFunction(	propertyPrefix + ".ProductKeyUseTextFromClipboard",
								"",
			function(propertyName, typePattern, propValueArray)
			{
				var promise = requestPropertyValue(propertyPrefix + ".ProductKeyTextFromClipboard", "string");
				
				promise.then(
					function()
					{
						//If clipboard is empty, we don't send any text
						if(parentElement.data("lastTextFromClipboard") !== "")
							setProductKey(propertyName, typePattern, [parentElement.data("lastTextFromClipboard")]);
					});
				return true;
			}));

	allThePromises.push(
		hookPropertyToFunction(	propertyPrefix + ".ProductKeyReadOnly",
								"bool",
								setProductKeyReadOnly));


	allThePromises.push(
		registerWriteOnlyProperty(	propertyPrefix + ".ProductKeyFocused",
									"bool"));
	
	saveButton.data("focusedFromProductKey", null);
	
	saveButton.on("blur",
		function()
		{
			//this cannot be true anymore
			saveButton.data("focusedFromProductKey", null);
		});
	
	saveButton.on("keydown",
		function(event)
		{
			if( event.keyCode === 9 								&& //Tab key
				saveButton.data("focusedFromProductKey") !== null 	&&
				!event.altKey									) 
			{
				var productKeyParent = saveButton.data("focusedFromProductKey");
				var keyInputs = $( ".productKeyInput", productKeyParent);
				event.preventDefault();
				
				if(event.shiftKey)
				{
					//Select last product key box (tabbing backwards)
					$(keyInputs[keyInputs.length-1]).focus();
				}
				else
				{
					//Select first product key box (tabbing forwards)
					$(keyInputs[0]).focus();
				}
			}
		});
	
	return Promise.allFinish(allThePromises);
}


function setProductKey(propertyName, typePattern, propValueArray)
{	
	var propPrefix = propertyName.split(".")[0];

	if(propValueArray[0] !== undefined)
	{
		for(var i = 0 ; productKeyPropElemMap[propPrefix] !== undefined && 
						i < productKeyPropElemMap[propPrefix].length ; i++)
		{
			var parentElement = $(productKeyPropElemMap[propPrefix][i]);
			
			if(parentElement[0].dataset && 
			   propPrefix === parentElement[0].dataset.propertyPrefix)
			{
				
				setWholeProductKeyInInputs(propValueArray[0], parentElement);

				if(propertyName.endsWith("ProductKeyTextFromClipboard") || propertyName.endsWith("ProductKeyUseTextFromClipboard"))
				{
					var productKey = getWholeProductKeyFromInputs(parentElement);
					setPropertyValue(propPrefix + ".ProductKey", "string", [productKey], [setProductKey]);
				}
			}
		}
	}
	else
	{
		console.error(logStrCpp("Unexpected parameters in setProductKey"));
		return;
	}

	return true;
}

function setProductKeyReadOnly(propertyName, typePattern, propValueArray)
{
	var propPrefix = propertyName.split(".")[0];
	
	if(propValueArray[0] !== undefined)
	{
		for(var i = 0 ; productKeyPropElemMap[propPrefix] !== undefined && 
						i < productKeyPropElemMap[propPrefix].length ; i++)
		{
			var parentElement = $(productKeyPropElemMap[propPrefix][i]);
			
			
			if(parentElement[0].dataset && 
			   propPrefix === parentElement[0].dataset.propertyPrefix)
			{
				var pkReadOnly = propValueArray[0];
				$(".productKeyInput", parentElement).each(
					function(index, para)
					{
						if(pkReadOnly)
						{
							if(!$(para).attr("readonly"))
							{
								$(para).attr("readonly", true);
								//disable too, so we don't get focused when readonly. 
								
								setDisabled(para, true);
							}
						}
						else
						{
							if($(para).attr("readonly"))
							{
								$(para).removeAttr("readonly");
								setDisabled(para, false);
							}
						}
					});
			}
		}
	}
	else
	{
		console.error(logStrCpp("Unexpected parameters in setProductKeyReadOnly"));
		return;
	}
	
	return true;
}

function productKeyInputHandler(event)
{
	if( $(this).is(".productKeyInput") )
	{
		var parentElement = $($(this).parents(".productKeyEntry")[0]);
		var propPrefix = parentElement[0].dataset.propertyPrefix;
		
		
		$(this).data("prevent-tab", false);

		var theStartVal = $(this).val();
		var theVal = theStartVal;
		
		var selectionStartPos = this.selectionStart;
		var selectionEndPos = this.selectionEnd;
		
		console.log("selectionAfterInput", selectionStartPos, selectionEndPos);

		theVal = theVal.replace(/1/g,"I");
		theVal = theVal.replace(/0/g,"O");

		//Must uppercase after regex, since eszett might be "uppercased" to SS, 
		//which could screw up selection and/or max string length.
		var beforeSelection = theVal.substr(0,selectionStartPos).replace(/[^a-zA-Z2-7]/g,"")
									.toUpperCase();
		var inSelection     = theVal.substr(selectionStartPos,selectionEndPos - selectionStartPos)
									.replace(/[^a-zA-Z2-7]/g,"")
									.toUpperCase();
		var afterSelection  = theVal.substr(selectionEndPos)
									.replace(/[^a-zA-Z2-7]/g,"")
									.toUpperCase();


		theVal = beforeSelection + inSelection + afterSelection;
		console.log("cleanup results", beforeSelection, inSelection, afterSelection);

		if(theVal != theStartVal)
		{
			$(this).val(theVal);
			this.selectionStart = beforeSelection.length;
			this.selectionEnd   = beforeSelection.length + inSelection.length;
		}

		var shouldSkipToNextInput = $(this).val().length === 4 && 
									$(this).data("prevVal") !== $(this).val() && 
									this.selectionEnd == 4;
		var originalElement = this;
		var nextInput = false;


		$(".productKeyInput", parentElement).each(
			function(index, para)
			{
				//If we just added the last character, switch to the next input box.
				if( shouldSkipToNextInput )
				{
					if(para === originalElement)
					{
						nextInput = true;
					}
					else if(nextInput)
					{
						$(para).focus();
						$(para).data("prevent-tab", true);
						nextInput = false;
					}
				}
			});

		var totalString = getWholeProductKeyFromInputs(parentElement);

		console.log(totalString);

		$(this).data("prevVal", $(this).val());

		setPropertyValue(propPrefix + ".ProductKey", "string", [totalString], [setProductKey]);
	}
}

function productKeyKeyDownHandler(event)
{
	var parentElement = $($(this).parents(".productKeyEntry")[0]);
	var propPrefix = parentElement[0].dataset.propertyPrefix;
	
	if($(this).data("prevent-tab") && event.keyCode === 9)
	{
		event.preventDefault();
		console.log("prevented tab");
	}

	$(this).data("prevent-tab", false);

	if( event.keyCode       === 37 && //Left arrow key
		this.selectionStart === 0  && 
		this.selectionEnd   === this.selectionStart )
	{
		var jPrevious = $(this).prev().prev(".productKeyInput");
		if(jPrevious.length > 0)
		{
			var previous = jPrevious[0];
			jPrevious.focus();
			previous.selectionStart = jPrevious.val().length;
			previous.selectionEnd   = previous.selectionStart;
			event.preventDefault();
		}
	}
	else if( event.keyCode       === 39 && //Right arrow key
			 this.selectionStart === $(this).val().length && 
			 this.selectionEnd   === this.selectionStart    )
	{
		var jNext = $(this).next().next(".productKeyInput");
		if(jNext.length > 0)
		{
			var next = jNext[0];
			jNext.focus();
			next.selectionStart = 0;
			next.selectionEnd   = 0;
			event.preventDefault();
		}
	}
	else if( event.keyCode       === 9) //Tab key
	{
		var jNext;
		var jLoopNext;
		
		//If using shift, go backwards
		if(event.shiftKey)
		{
			var allProdKeyInputs = $(this).parent().children(".productKeyInput");
			
			jNext = $(this).prev().prev(".productKeyInput");
			jLoopNext = $(allProdKeyInputs[allProdKeyInputs.length - 1]);
		}
		else
		{
			jNext = $(this).next().next(".productKeyInput");
			jLoopNext = $($(this).parent().children(".productKeyInput")[0]);
		}
		
		//Alt key makes tab focus more things, lets let that one go ahead as normal
		if(jNext.length == 0 && !event.altKey)
		{
			var saveButton = parentElement.data("saveButton");
			event.preventDefault();
			
			if(saveButton.length > 0 && !saveButton.prop('disabled'))
			{
				saveButton.data("focusedFromProductKey", $(this).parent());
				saveButton.focus();
			}
			else
			{
				jLoopNext.focus();
			}
		}
	}
	else if( event.keyCode       === 13) //Enter key
	{
		var saveButton = parentElement.data("saveButton");
		if(saveButton.length > 0 && !saveButton.prop('disabled'))
		{
			saveButton.focus();
		}
	}
	else if( !event.metaKey && !event.ctrlKey &&
			 ((event.keyCode >= 65 && event.keyCode <= 90) ||    // alpha
			  (event.keyCode >= 48 && event.keyCode <= 57)   ) ) // numeric
	{
		// JCF 30-Oct-2014 - Currently WebKit's "maxlength" attribute is buggy
		// JCF 30-Oct-2014 - So We'll impose the character limit programmatically
		// JCF 30-Oct-2014 - fbug://PGOW-65
		
		// grab the limit specified in HTML
		var maxlength = $(this).attr("maxlength");

		// Do we already have that many characters in the field?
		if ( $(this).val().length >= maxlength )
		{
			// The field's full - let's ignore this input
			event.preventDefault();
		}
	}
	
}

function productKeyFocusHandler(event)
{
	var parentElement = $($(this).parents(".productKeyEntry")[0]);
	var propPrefix = parentElement[0].dataset.propertyPrefix;
	
	if( $(this).is(".productKeyInput") && $(this).parents("[data-focus-disabled]").length == 0 )
	{
		this.select();
		
		
		setWriteOnlyPropertyValue(propPrefix + ".ProductKeyFocused", "bool", [true]);
	}
}

function productKeyBlurHandler(event)
{
	var parentElement = $($(this).parents(".productKeyEntry")[0]);
	var propPrefix = parentElement[0].dataset.propertyPrefix;
	
	if( $(this).is(".productKeyInput") )
	{
		$(".productKeyInput", parentElement).each(
				function(index, para)
				{
					$(para).data("prevent-tab", false);
				});
		
		setWriteOnlyPropertyValue(propPrefix + ".ProductKeyFocused", "bool", [false]);
	}
}

function productKeyPasteHandler(event)
{
	var parentElement = $($(this).parents(".productKeyEntry")[0]);
	var propPrefix = parentElement[0].dataset.propertyPrefix;
	
	var pastedText = event.originalEvent.clipboardData.getData('text/plain');

	if(pastedText.length > 4)
	{
		setWholeProductKeyInInputs(pastedText, parentElement);

		setPropertyValue(propPrefix + ".ProductKey", "string", [getWholeProductKeyFromInputs(parentElement)], [setProductKey]);
		event.preventDefault();
	}
}

function productKeyDropHandler(event)
{
	var parentElement = $($(this).parents(".productKeyEntry")[0]);
	var propPrefix = parentElement[0].dataset.propertyPrefix;
	
	var droppedText = event.originalEvent.dataTransfer.getData('text/plain');

	if(droppedText.length > 4)
	{
		setWholeProductKeyInInputs(droppedText, parentElement);
		
		setPropertyValue(propPrefix + ".ProductKey", "string", [getWholeProductKeyFromInputs(parentElement)], [setProductKey]);
		event.preventDefault();
	}
}

function getWholeProductKeyFromInputs(parentElement)
{
	var totalString = "";

	$(".productKeyInput", parentElement).each(
		function(index, para)
		{
			totalString += $(para).val();
		});
	return totalString;
}

function setWholeProductKeyInInputs(productKey, parentElement)
{
	//Only clean up the focus if we were focused previously.
	var shouldFocus = $(".productKeyInput:focus", parentElement).length > 0;
	
	productKey = productKey.replace(/1/g,"I");
	productKey = productKey.replace(/0/g,"O");

	//Must uppercase after regex, since eszett(ß) might be "uppercased" to SS, 
	//which could screw up selection and/or max string length.
	productKey = productKey.replace(/[^a-zA-Z2-7]/g,"").toUpperCase();

	var pos = 0;

	var lastInput;

	$(".productKeyInput", parentElement).each(
				function(index, para)
				{
					if(productKey.length > pos)
					{
						var subStr = productKey.substr(pos, 4);
						$(para).val(subStr);
						$(this).data("prevVal", subStr);
						pos += 4;
						lastInput = para;
					}
					else
					{
						$(para).val("");
						$(this).data("prevVal", "");
					}

					//Special case for selecting first input box after clear
					if(productKey.length == 0 && index == 0)
					{
						lastInput = para;
					}
				});

	if(lastInput && shouldFocus)
	{
		$(lastInput).focus();
		lastInput.selectionStart = $(lastInput).val().length;
		lastInput.selectionEnd = lastInput.selectionStart;
	}
}

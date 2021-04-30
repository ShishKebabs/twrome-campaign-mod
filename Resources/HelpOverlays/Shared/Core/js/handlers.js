"use strict";

startupPostPropertyLoadTasks.push(initialiseInputElementHandlers);
startupPostPropertyLoadTasks.push(initialiseScrollContainerHandlers);
startupPostPropertyLoadTasks.push(initialisePlayOnEnterHandler);
startupPostPropertyLoadTasks.push(initialiseLaunchTipHandlers);

function initialiseInputElementHandlers()
{
	return initialiseInputElementHandlersWithinElement(document);
}

function initialiseScrollContainerHandlers()
{
	//Fire it for all scrollable regions now to ensure we have the right state before the user scrolls, 
	//then fire it on any scroll events for that element
	//Also fire if the container or the internals change size, since that can alter whether the top and bottom are reached
	$(".scrollContainer>*").each(scrollContainerScrollHandler).on("scroll", scrollContainerScrollHandler);
	$(window).on('resize', function(){$(".scrollContainer>*").trigger("scroll");});
	
	return Promise.resolve();
}

function initialisePlayOnEnterHandler()
{
	$("body").on("keydown", playOnEnterKeyDownHandler);
	
	return Promise.resolve();
}

function removePlayOnEnterHandler()
{
	// Disable when we want to override key input, e.g. rebinding controls.
	$("body").off("keydown", playOnEnterKeyDownHandler);

	return Promise.resolve();
}

function initialiseLaunchTipHandlers() 
{
	$("span#launchOptionsTip").click(function() {
		$(this).addClass("off"); 
	});
	$("#keepShownButton").click(function() {
		$("span#launchOptionsTip").removeClass("off"); 
	});
	
	return Promise.resolve();
}

function initialiseInputElementHandlersWithinElement(element)
{
	if (element === undefined)
	{
		// This shouldn't be called with undefined as a parameter, it will
		// result in elements recieving multiple callbacks
		return Promise.resolve();
	}

	$("#versionStringList", element).mousedown(
		function(event)
		{
			if(!event.metaKey && !event.altKey && !event.ctrlKey)
				event.preventDefault();
		});

	$( "input[type=button]", element ).click( buttonClickHandler );

	$( "input[type=range]", element ).on( "input", sliderClickHandler );

	//Not all selects want to be selectricated, due to the version string list
	$( ".selectBox", element ).each(
		function(index, para) 
		{
			//This is a workaround for there being a "real" select box and a selectric select box
			$(para).change( {para: para}, selectChangeHandler );
		});

	$( ".chosen-select", element ).each(
		function(index, para)
		{
			$(para).change( {para: para}, selectChangeHandler );
		});

	$( "input[type=checkbox]", element ).click( checkboxClickHandler );

	$( "input[type=color][data-property-name][data-property-type]", element ).change( textChangeHandler );
	
	$(  "input[type=text][data-property-name][data-property-type], " + 
	"input[type=password][data-property-name][data-property-type], " + 
		        "textarea[data-property-name][data-property-type], " + 
      "input[type=number][data-property-name][data-property-type]", element ).on( "input", textChangeHandler );
	
	return Promise.resolve();
}

function buttonClickHandler( event )
{
	var thePromise = Promise.resolve();
	
	var theButton = this;
	
	//Disable until we've finished handling (only significant if we do async work like property setting)
	setDisabled(theButton, true);
	
	if( $(theButton).is( "[data-dialog-name]" ) )
	{
		var dialogName = $(theButton).data("dialogName");

		var dialog = $( "#" + dialogName )[0];
		$( dialog ).dialog( "open" );
	}


	if( $(theButton).is( "[data-property-name][data-property-type=\"\"]" ) )
	{
		thePromise = setPropertyValue(	$( theButton ).data("property-name"),
										$( theButton ).data("property-type"),
										[],
										[theButton]);
	}
	
	thePromise.then(
		function()
		{
			//We finished setting the property.
			setDisabled(theButton, false);
		});
}

function sliderClickHandler( event )
{
	if($(this).is("[data-property-name]"))
	{
		var propertyName = $(this).data("property-name");
		var propertyType = $(this).data("property-type");
		var propValueArray = [ parseInt(this.value, 10) ];	
		setPropertyValue( propertyName,
				  propertyType,
				  propValueArray);
	}
}

function checkboxClickHandler( event ) 
{
	if($(this).is("[data-property-name]"))
	{
		var propValueArray = [];

		var propertyName = $( this ).data("property-name");

		if(propertyName.startsWith("!"))
		{
			propValueArray[0] = !$( this ).is(':checked');
			propertyName = propertyName.substring(1);
		}
		else
		{
			propValueArray[0] = $( this ).is(':checked');
		}

		var propertyType = 	$( this ).data("property-type");
		
		if(propertyType === "bool,bool")
		{
			if(event.altKey)
			{
				propValueArray[1] = false;
				$(this).prop("indeterminate", true);
			}
			else
				propValueArray[1] = true;
		}
		
		setPropertyValue(	propertyName,
							propertyType,
							propValueArray,
							[this]);
	}
}

function selectChangeHandler( event ) 
{
	// Check we are the select box, not the selectric generated div
	if($(event.data.para).is("select[data-property-name][data-property-type]"))
	{
		var propValueArray = [];

		var propertyName = 	$( this ).data("property-name");
		var propertyType = 	$( this ).data("property-type");

		if ($(event.data.para).attr("multiple"))
		{
			if (propertyType === "array<int,string>")
			{
				var theRealSelectId = $(event.data.para).attr("id");
				var theChosenDivId = $(event.data.para).siblings("#" + theRealSelectId + "_chosen");

				var selectedElements = theChosenDivId.find(".search-choice");
				var selectedIndices = selectedElements.map(
				function()
				{
					return $(this).children(".search-choice-close").attr("data-option-array-index");
				}).get();

				var selectValueArray = []

				for (var i = 0; i < selectedIndices.length; i++)
				{
					var currentValueArray = []

					currentValueArray.push(parseInt(selectedIndices[i]));
					currentValueArray.push(this.options[selectedIndices[i]].text);

					selectValueArray.push(currentValueArray);
				}

				if (selectedIndices.length == 0)
				{
					var currentValueArray = []

					currentValueArray.push(-1);
					currentValueArray.push("");

					selectValueArray.push(currentValueArray);
				}

				propValueArray.push(selectValueArray);
			}
			else
			{
				console.error(logStrCpp("Unknown type on multiselect"));
			}
		}
		else
		{
			var selectedIndex = $(event.data.para).prop("selectedIndex");

			if (propertyType === "int,string")
			{
				propValueArray.push(selectedIndex)
				propValueArray.push(this.options[selectedIndex].text);
			}
			else if (propertyType === "int")
			{
				var selectedNumericValue = $(event.data.para).children("option:selected").data("option-value");
				if (selectedNumericValue === undefined)
				{
					propValueArray.push(selectedIndex)
				}
				else
				{
					propValueArray.push(selectedNumericValue);
				}
			}
			else
			{
				console.error(logStrCpp("Unknown type on select"));
			}
		}

		setPropertyValue(	propertyName,
							propertyType,
							propValueArray,
							[event.data.para]);
	}
}

function textChangeHandler(event)
{
	if( $(this).is("[data-property-name]") )
	{
		var propertyName = $( this ).data("property-name");
		var propertyType = 	$( this ).data("property-type");

		var propValueArray = new Array();

		if (propertyType == "string")
		{
			propValueArray[0] = $( this ).val();

			setPropertyValue(	propertyName,
								propertyType,
								propValueArray,
								[this]);
		}
		else if (propertyType == "int")
		{
			var intValue = parseInt($(this).val(), 10);
			intValue = isNaN(intValue) ? 0 : intValue;

			propValueArray[0] = intValue;

			setPropertyValue(	propertyName,
								propertyType,
								propValueArray,
								[this]);
		}
	}
}

function scrollContainerScrollHandler()
{
	// $().scrollTop()//how much has been scrolled
	// $().innerHeight()// inner height of the element
	// DOMElement.scrollHeight//height of the content of the element
	
	var parent = $(this).parent();
	var scrollTop = $(this).scrollTop();
	
	if(scrollTop <= 0) 
	{
		parent.addClass("top");
	}
	else if(parent.hasClass("top"))
	{
		parent.removeClass("top");
	}
	
	
	if(scrollTop + $(this).innerHeight() >= this.scrollHeight) 
	{
		parent.addClass("bottom");
	}
	else if(parent.hasClass("bottom"))
	{
		parent.removeClass("bottom");
	}
}

function playOnEnterKeyDownHandler(event)
{
	//keyCode 13 == enter
	//ensure no dialogs are open which could be the intended target of the keypress
	//ensure nothing is focused, which could be the intended target of the keypress
	if(	event.keyCode === 13 				&& 
		!$(".ui-dialog").is(":visible") &&
		$(":focus").length == 0 			)
	{
		launchGame();
	}
}

function launchGame()
{
	{
		var buttonInPlayOption = $("#playBox>.playOption.selectedGame .main-playButton");
		var allPlayButtons = $(".main-playButton");
		
		if(buttonInPlayOption.length > 0)
			buttonInPlayOption.click();
		else if(allPlayButtons.length == 1)
			allPlayButtons.click();
		else
			console.warn(logStrCpp("Can't identify default/any play button"));
	}
}


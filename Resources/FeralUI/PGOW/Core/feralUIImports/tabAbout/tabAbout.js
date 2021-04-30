"use strict";

function initialiseAboutPanel()
{
	// Allows submitting the form using the return key.
	$("#FeralAccountLoginBox [data-submit-button]").each(
		function(index, para)
		{
			var submitbutton = $("#" + para.dataset.submitButton);
			if(submitbutton.length > 0)
			{
				$(para).on("keydown",
					function(e)
					{
						if(!$(this).prop("disabled") && !$(submitbutton).prop("disabled") && e.keyCode == 13) // 13 == return key
						{
							submitbutton.click();
						}
					});
			}
		});

	// Allows tabbing between the login form elements.
	$('#tabContentAbout').on("keydown", 
		function(e)
		{
			var target = $(e.target);

			if (e.keyCode == 9) // tab key
			{
				var currentTabindex = target.attr('tabindex');
				var inputList = $('#FeralAccountLoginBox').find('input')
				var nextTabIndex = parseInt(currentTabindex);

				if (e.shiftKey)
				{
					--nextTabIndex;
				}
				else
				{
					++nextTabIndex;
				}

				var nextInput = inputList.filter('[tabindex='+ nextTabIndex +']');

				if (nextInput.length == 0 || nextInput.attr('disabled'))
				{
					nextInput = $('#FeralAccountLoginBox').find('input').filter('[tabindex]').filter(
						function()
						{
							return !$(this).attr('disabled');
						});

					if (e.shiftKey)
					{
						nextInput = nextInput.last();
					}
					else
					{
						nextInput = nextInput.first();
					}
				}

				nextInput.focus();
				e.preventDefault();
			}
			else if (e.keyCode == 32 || e.keyCode == 13) // spacebar or return
			{
				// Allow checkbox toggle using keyboard.
				if (target.attr('type') == 'checkbox')
				{
					target.prop('checked', ! target.is(":checked"));
				}
			}
		});
	
	return Promise.resolve();
}

function initialiseFeralLoginUI()
{
	// Check if Feral accounts are supported by the game.
	var feralAccountsSupported = false;
	var thePromise = hookPropertyToFunction("FeralAccountsSupported", 
											"bool", 
		function(propertyName, typePattern, propValueArray)
		{
			feralAccountsSupported = propValueArray[0];
		});

	// Perform CSS and DOM changes if Feral accounts are supported.
	thePromise = thePromise.then(function()
	{
		if (feralAccountsSupported === true)
		{
			var miniSiteButton = $('#minisitebutton');

			$('#docButtonContainer > .flexParent').append(miniSiteButton);

			miniSiteButton.addClass("docsbutton feralAccountEnabled");
			miniSiteButton.removeClass("stretchButton2");

			$('#docButtonContainer').addClass("feralAccountEnabled");
			$('.docsbutton').addClass("feralAccountEnabled");
			$('#aboutExtras').remove();
			$('#feralAccount').removeClass("noDisplay");
		}
		
		return Promise.resolve();
		
	});

	return thePromise;
}

function initialiseMiscPropertyHooks()
{
	var thePromise = hookPropertyToFunction("requiresRelaunch", "bool", function(propertyName, typePattern, propValueArray){});
	return thePromise;
}

//Add dlc tab features+scroll initialisation to the startup
startupPostPropertyLoadTasks.push(initialiseAboutPanel);
startupPostPropertyLoadTasks.push(initialiseFeralLoginUI);
startupPostPropertyLoadTasks.push(initialiseMiscPropertyHooks);

"use strict";

function initialiseAdvancedPanel()
{
	// Hooking into keydowns on the command line and frame-rate text input
	$('#tabContentAdvanced #advanced-commandLine, #tabContentAdvanced #FrameRateLimitInput').on("keydown",
		function(e)
		{
			var target = $(e.target);

			if (e.keyCode == 13) // enter key
			{
				// Defocus the text input
				target.blur();
				// Don't propagate, otherwise we will trigger
				// the Play button immediately.
				e.stopPropagation();
			}
		});

	var WheelRangeSlider = $("#WheelRangeSlider");
	var WheelRangeInput = $("#WheelRangeInput");

	// Allow changes on the slider to trigger instant update on the number input and vice versa.
	WheelRangeSlider.on('input', function()
		{ 
			WheelRangeInput.val(WheelRangeSlider.val());
		});
	
	WheelRangeInput.on('input', function()
		{
			WheelRangeSlider.val(WheelRangeInput.val());
		});

	$("#wheelRangeWarningTip").click(function()
	{
		$(this).addClass("off");
	});

	$("#WheelRange").on("mousedown", function()
	{
		$("#wheelRangeWarningTip").removeClass("off");
	});

	var FrameRateLimitSlider = $("#FrameRateLimitSlider");
	var FrameRateLimitInput = $("#FrameRateLimitInput");

	FrameRateLimitSlider.on('input', function()
	{
		FrameRateLimitInput.val(FrameRateLimitSlider.val());
	});

	FrameRateLimitInput.on('input', function()
	{
		FrameRateLimitSlider.val(FrameRateLimitInput.val());
	});
	
	return Promise.resolve();
}

// Add our stuff to the startup
startupPostPropertyLoadTasks.push(initialiseAdvancedPanel);

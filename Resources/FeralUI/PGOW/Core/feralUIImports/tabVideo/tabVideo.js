"use strict";

startupPostPropertyLoadTasks.push(initialiseDisplayTipHandlers);

function initialiseDisplayTipHandlers() 
{
	$("#resolutionWarningTip").click(function() {
		$(this).addClass("off");
		setTimeout(function() {
			setPropertyValue("ResolutionHasWarning", "bool", [false]);
			$("#resolutionWarningTip").removeClass("off");
		}, 1000);
	});

	return Promise.resolve();
}

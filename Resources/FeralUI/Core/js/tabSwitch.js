"use strict";

startupPostPropertyLoadTasks.push(initialiseTabs);

function initialiseTabs()
{
	$("#tabView>.tabbed").on(transitionEndEvent, onTabSwitchEnded);
	
	$("#tabbar").on("click", ".tabSelect", 
		function(event)
		{
			switchTab($(this));
		});
	
	//Reorder the tab buttons and select a tab if the default/saved tabs aren't available
	var lowestAvailableTabPos = Number.MAX_VALUE;
	var lowestAvailableTab = undefined;

	$("#tabbar>.tabSelect").each(
		function(index, para) 
		{
			var tabPos = $(para).data("tabPosition");
			
			if(tabPos < lowestAvailableTabPos && !$(para).hasClass("noDisplay"))
			{
				lowestAvailableTabPos = tabPos;
				lowestAvailableTab = $(para);
			}
			
			//Order must be an integer, so lets fiddle with the decimal place to make it more flexible
			$(para).css("order", tabPos*10000);
		});
	
	var selectedTab = $("#tabbar>.selectedTabButton");
	
	if(selectedTab.length == 0 || selectedTab.hasClass("noDisplay"))
	{
		switchTab(lowestAvailableTab);
	}
	else
	{
		//Select the already selected default tab on the basis that if it was defined as selected in the html, 
		//we will want to disable any focusable controls programatically
		switchTab(selectedTab);
	}
	
	return Promise.resolve();
}


function onTabSwitchEnded()
{
	//To seperate from a tab marked not visible, since these tabs are only transiently non-visible until they are selected.
	if(!$(this).is(".selected") && $(this).data("willBeSelected") !== true)
		$(this).addClass("noDisplayTransient");
	else
		$(this).removeClass("noDisplayTransient"); //Just in case a weird edge-case hits. Can happen on startup.
	
	$(this).unbind("focusin");
	
	if(this.dataset !== undefined && this.dataset.focusDisabled)
		delete this.dataset.focusDisabled;
}


function onTabSwitchEndWindow()
{
	// Doing the normal tab switch ended on the window doesn't have
	// the desired effect, so we call it on all the tab contents
	// This fixes textboxes being unfocused when tab switching
	// to the same tab.
	var allTabContents = $('#tabView>.tabbed');
	
	allTabContents.each( onTabSwitchEnded );
}


function switchTab(tabButton)
{
	var tabContent = [];
	if(tabButton !== undefined && tabButton.data("tabId"))
		tabContent = $("#" + tabButton.data("tabId"));
	
	if(tabContent.length > 0)
	{
		tabContent.data("willBeSelected", true);
		tabContent.removeClass("noDisplayTransient");
		
		var switchTabFunc = 
			function()
			{
				var tabPosition = tabButton.data("tabPosition");
				
				if(tabPosition !== undefined)
				{
					var allTabButtons = $('#tabbar>.tabSelect');
					var allTabContents = $('#tabView>.tabbed');
					
					var previousContent = allTabContents.filter(".selected");
					
					allTabContents.removeClass("selected").removeClass("left").removeClass("right");
					
					tabContent.addClass("selected");
					tabContent.removeData("willBeSelected");
					
					//Disable focus until transitions complete, since it makes everything jump around
					tabContent.add(previousContent).each(
						function(index, para)
						{
							para.dataset.focusDisabled = "true";
							setTimeout(onTabSwitchEndWindow, 1500); // Any transitions should have ended by this point,
																	// this is the backup in case transitionend never fires.
						})
					.on("focusin", 
						function(event)
						{
							$(event.target).blur();
						});

					for(var i = 0 ; i < allTabButtons.length ; i++)
					{
						var otherTabButton = $(allTabButtons[i]);
						
						var otherTabContent;
						if(otherTabButton.data("tabId"))
							otherTabContent = $("#" + otherTabButton.data("tabId"));
						
						var otherTabPosition = otherTabButton.data("tabPosition");
						
						if(	otherTabButton === undefined 	|| 
							otherTabContent === undefined 	|| 
							otherTabPosition === undefined	  )
						{
							error(logStrCpp("A tab lacks the data attributes needed for tab switching to work."));
						}
						
						else if(otherTabPosition < tabPosition)
						{
							otherTabContent.addClass("left");
						}
						else if(otherTabPosition > tabPosition)
						{
							otherTabContent.addClass("right");
						}
						else if(allTabButtons[i] !== tabButton[0] && otherTabPosition === tabPosition)
						{
							error(logStrCpp("2 tabs share position " + tabPosition + "!, " + otherTabButton.html() + " and " + tabButton.html()));
						}
					}

					$("#tabbar>.selectedTabButton").removeClass("selectedTabButton");

					tabButton.addClass("selectedTabButton");

					setPropertyValue(	"MainSelectTab", 
										"int", 
										[tabPosition * 10000],
										[$("#tabbar[data-property-name=\"MainSelectTab\"]")[0]]);
					
					//Update the scroll containers, since things could have changed 
					//whilst the scroll containers were tabbed out and not updating.
					if(scrollContainerScrollHandler)
					{
						var scrollContainers = $(".scrollContainer>*", tabContent);
						
						//Apparently the above screws up in the case that the parent we're 
						//searching in is part of the selection string, so check manually for that.
						if(tabContent.is(".scrollContainer"))
							scrollContainers = scrollContainers.add(tabContent.children());
						
						scrollContainers.each(scrollContainerScrollHandler);
					}
				}
			};
		
		//during startup, we won't have a chance of letting this complete, and we do some checking later on to see the result. 
		//Plus, the animation doesn't matter during startup, so lets just do it
		if(startupDone)
		{
			setTimeout(switchTabFunc, 20); 	// 10ms timeout is the secret ingredient for disabling/enabling transitions
					 						// chrome only needs 1ms but FF needs ~10ms or it chokes on the first animation for some reason
											// FB - I found 20 to work more reliably.
		}
		else
			switchTabFunc();
	}
}

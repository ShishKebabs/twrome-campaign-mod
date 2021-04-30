"use strict";

var pendingInvitesCount = 0;
var localisedNotificationsStrings = {};

startupPostPropertyLoadTasks.push(initialiseNotificationsManager);

function initialiseNotificationsManager()
{
	var thePromises = [];

	thePromises.push(hookPropertyToFunction("PushNotification", "array<string,string,string,int>", showNotification));
	thePromises.push(hookPropertyToFunction("NotificationFinished", "", emptyFunction));
	thePromises.push(hookPropertyToFunction("AcceptFriendRequest", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("RejectFriendRequest", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("AcceptLobbyInvite", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("RejectLobbyInvite", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("AcceptChatInvite", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("RejectChatInvite", "int", emptyFunction));
	
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.FriendRequestDescription", "string,bool", updateNotificationsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.ChatInviteDescription", "string,bool", updateNotificationsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.HasInvitedYouToPlay", "string,bool", updateNotificationsStringsMap));
	
	return Promise.allFinish(thePromises);
}

function updateNotificationsStringsMap(propertyName, typePattern, propValueArray)
{
	localisedNotificationsStrings[propertyName] = propValueArray[0];

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function showNotification(propertyName, typePattern, propValueArray)
{
	if(propValueArray && propValueArray.length > 0)
	{
		propValueArray[0].forEach(
			function (element, index, array){
				var iconPath = element[0];
				var title = element[1];
				var description = element[2];
				var inviteId = element[3];


				var notification = 
					'<li class="feralNetNotification feralNetPendingNotification">' +
						'<div class="content"">' +
							'<img class="icon" src="file:' + iconPath + '" height="64" width="64"' +
								' onerror="this.onerror=\'\'; this.src=\'images/icon.png\';">' +
							'<span class="title"><b>' + title + '</b></span>' +
							'<span class="description">' + description + '</span>'
						'</div>' +
					'</li>';

				var newNotification = $(notification);
				
				//This function will attempt to use a transitionend event to detect when the fancy animation is done, 
				//but since they're a bit iffy, includes a fallback to a timeout, which should always work.
				function waitForTransition(jQueryElement, callback, timeout) 
				{
					var timeoutID = setTimeout(transitionEnded, timeout);
					jQueryElement.one('transitionend webkitTransitionEnd', transitionEnded);

					function transitionEnded()
					{
						clearTimeout(timeoutID);
						jQueryElement.off('transitionend webkitTransitionEnd', transitionEnded);
						callback();
					}
				}

				function onReadyToSlideIn()
				{
					newNotification.removeClass("feralNetPendingNotification");
					//Transition should take 0.7s currently, 1s seems a good fallback
					waitForTransition(newNotification, onSlideInComplete, 1000);
				}

				function onSlideInComplete()
				{
					//Transition should take 0.7s currently, entire sequence used to take 7s,
					//so 7-(2*0.7s) == 5.6s
					setTimeout(onReadyToSlideOut, 5600);
				}

				function onReadyToSlideOut()
				{
					newNotification.addClass("feralNetEndingNotification");
					//Transition should take 0.7s currently, 1s seems a good fallback
					waitForTransition(newNotification, onSlideOutComplete, 1000);
				}

				function onSlideOutComplete()
				{
					setPropertyValue("NotificationFinished","",[]);
					newNotification.remove();
				}
				
				$('#notificationStack').append(newNotification);

				//Delay 200ms so that the transition will reliably work (internet usually says 100ms, but ive seen that fail. never seen 200 fail)
				//Don't worry if it does fail, we'll only lose the animation, the notification will still appear and disappear as normal.
				setTimeout(onReadyToSlideIn, 200);

				if(inviteId > 0)
				{
					newInviteElement(iconPath, title, description, inviteId);
				}
			}
		);
		
	}
	else
	{
		console.error(logStrCpp("propValueArray for pushNotification is empty"));
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function emptyFunction(propertyName, typePattern, propValueArray)
{
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function newInviteElement(iconPath, title, description, inviteId)
{
	var propertyName;
	var parentElement;

	if (description == localisedNotificationsStrings["localise-FeralNetUI.FriendRequestDescription"])
	{
		propertyName = "FriendRequest";
	}
	else if (description == localisedNotificationsStrings["localise-FeralNetUI.ChatInviteDescription"])
	{
		propertyName = "ChatInvite";
	}
	else
	{
		propertyName = "LobbyInvite";	
	}

	// Check for dupes
	if ($('#pendingInvitesList').find('#invite-' + propertyName + '-' + inviteId).length)
		return true;

	var inviteElement =
		'<li class="feralNetInvite" id="invite-' + propertyName + '-' + inviteId + '">' +
			'<img class="icon" src="' + iconPath + '" height="42" width="42" onerror="this.onerror=\'\'; this.src=\'images/icon.png\';">' +
			'<b><div class="name">' + title + '</div></b>' +
			'<div class="description">' + description + '</div>' +
			'<img class="acceptButton" src="images/accept.svg" height="24" width="24">' +
			'<img class="declineButton" src="images/decline.svg" height="24" width="24">' +
			'<div class="clearBoth"></div>' +
		'</li>';

	$("#pendingInvitesList").append(inviteElement);

	$("#pendingInvitesList").find('#invite-' + propertyName + '-' + inviteId + '>.acceptButton').click(
		function()
		{
			setPropertyValue("Accept"+propertyName,"int",[inviteId]);
			removeInviteElement(inviteId, propertyName);
		}
	);

	$("#pendingInvitesList").find('#invite-' + propertyName + '-' + inviteId + '>.declineButton').click(
		function()
		{
			setPropertyValue("Reject"+propertyName,"int",[inviteId]);
			removeInviteElement(inviteId, propertyName);
		}
	);

	// Update pending invites tab
	if($("#pendingInvitesTab").hasClass("disabled")){
		$("#pendingInvitesTab").removeClass("disabled");
	}

	++pendingInvitesCount;
	$("#pendingInvitesTab>.notificationSquare").html(pendingInvitesCount);

}

function removeInviteElement(inviteId, propertyName)
{
	$('#pendingInvitesList').find('#invite-' + propertyName + '-' + inviteId).remove();
	
	--pendingInvitesCount;
	if(pendingInvitesCount == 0)
	{
		$("#pendingInvitesTab>.notificationSquare").empty();
		$("#pendingInvitesTab").click(); // Simulate a click in order to close the panel
	}
	else
	{
		$("#pendingInvitesTab>.notificationSquare").html(pendingInvitesCount);
	}
}

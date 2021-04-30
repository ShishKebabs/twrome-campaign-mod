"use strict";

var localisedFriendStrings = {};
var friendAddedNickname = ""; // Nickname of a friend added using the Friends panel.
var isChattingMap = {};
var blockedIds = [];

//Add overlay hook initialisation to the startup
startupPropertyLoadTasks.push(initialiseFriendsProperty);
startupPostPropertyLoadTasks.push(initialiseFriendsManager);

function initialiseFriendsProperty()
{
	var thePromises = [];

	// Store the localised version of this string in order to replace #{username}
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.AddFriend.Success", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.ChatButton", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.ChattingButton", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.InviteButton", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SentButton", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.Online", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.Offline", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.AddFriendAlreadyAddedDescription", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.NumberOfFriends", "string,bool", updateFriendsStringsMap));
	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.OneFriend", "string,bool", updateFriendsStringsMap));

	return Promise.allFinish(thePromises);
}

function initialiseFriendsManager()
{
	var thePromises = [];
	
	// Hook up handler properties
	thePromises.push(hookPropertyToFunction("UpdateFriendsList", "int,array<int,string,bool,string,string,string,bool,bool>,bool", updateFriendsList));
	thePromises.push(hookPropertyToFunction("UpdateBlocks", "array<int>", updateBlocks));
	thePromises.push(hookPropertyToFunction("UpdateFriendInfo", "array<int,string,int,string,string,string,bool,int>", updateFriendInfo));
	thePromises.push(hookPropertyToFunction("DisplayFriendsToInvitePanel", "array<int,string,bool,string,string,string,bool,bool>", initialiseFriendsToInvitePanel));
	thePromises.push(hookPropertyToFunction("InviteFriendToLobby", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("AddFriendNickname", "string", emptyFunction));
	thePromises.push(hookPropertyToFunction("AddFriendPanelStatus", "int,int", updateAddFriendPanel));
    thePromises.push(hookPropertyToFunction("IsUserLoggedIn", "bool", emptyFunction));

	setJQueryUIFriendsListeners();

	return Promise.allFinish(thePromises);
}

function updateFriendsStringsMap(propertyName, typePattern, propValueArray)
{
	localisedFriendStrings[propertyName] = propValueArray[0];

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setJQueryUIFriendsListeners()
{
	// Change the plus icon
	$("#friendsChatContent").contents().find("#addFriendInput").on('input paste', function()
	{
		if($(this).val() != "")
		{
			$("#friendsChatContent").contents().find("#addFriendPlusDisabled").addClass("noDisplay");
			$("#friendsChatContent").contents().find("#addFriendPlusEnabled").removeClass("noDisplay");
		}
		else
		{
			$("#friendsChatContent").contents().find("#addFriendPlusDisabled").removeClass("noDisplay");
			$("#friendsChatContent").contents().find("#addFriendPlusEnabled").addClass("noDisplay");
		}
	});

	// Add a new friend from the friends list
	$("#friendsChatContent").contents().find("#addFriendInput").on('keydown', function(event)
	{
		// Add new friend on enter
		if(event.which == 13)
		{
			addNewFriend();
		}
	});
	$("#friendsChatContent").contents().find("#addFriendPlusEnabled").on('click', addNewFriend);

	// Close the dialogs panel
	$("#friendsChatContent").contents().find(".addFriendDialog>.closeButton").on('click', function()
	{
		// Notify the C++ handler that the dialog has been closed (4 == kDialogClosed, 0 == kNoError)
		setPropertyValue("AddFriendPanelStatus", "int,int", [4, 0]);

		// Restore the friends list's height
		if(!$(this).parent().hasClass('noDisplay'))
		{
			$("#friendsChatContent").contents().find("#feralNetFriendsList").css('height', '+=127px');
		}

		// Hide the panel
		$(this).parent().addClass('noDisplay');
	});
}

function friendHTML(userId, nickname, status, avatarPath, gameName, isChatSupported, isFriendsToInvitePanel)
{	
	var onlineClass;
	var currentTime = new Date().getTime();

	if(isChattingMap[userId] === undefined)
	{
		isChattingMap[userId] = false;
	}

	if(status == "Online")
	{
		onlineClass = "online";
	}
	else if (status == "Offline")
	{
		onlineClass = "offline";
	}
	
	var blockedClass = '';
	if (isBlocked(userId))
	{
		blockedClass = ' blocked';
	}

	var newFriend = 
		'<li class="feralNetFriend clear'+blockedClass+'" id="feralNetFriend' + (isFriendsToInvitePanel == true ? 'ToInvite-' : '-') + userId + '">' +
			'<img class="icon" src="file:///' + avatarPath + '?' + currentTime + '" height="44" width="44" onerror="this.onerror=\'\'; this.src=\'../images/icon.png\';">' +
			'<div class="statusBlock">' +
				'<span class="nickname-container' + (isFriendsToInvitePanel == true ? '"' : ' friendsList"') + '>' +
					'<span class="nickname-outer"><span class="nickname">' + nickname + '</span></span>' +
	(!isFriendsToInvitePanel ? '<span class="arrow-down"></span>' : '') +
				'</span>' +
				'<span class="status ' + onlineClass + '">' + localisedFriendStrings['localise-FeralNetUI.' + status] + 
					(gameName != '' && onlineClass == 'online' ? ' - ' + gameName : '') + '</span>' +
			'</div>';
	
	if(isFriendsToInvitePanel)
	{
		newFriend += '<input class="button invite" type="submit" value="' + localisedFriendStrings["localise-FeralNetUI.InviteButton"] + '">';
	} 
	else if(onlineClass != "offline" && isChatSupported)
	{
		newFriend += '<input class="button chat' + (isChattingMap[userId] ? ' disabled' : '') +'" type="submit" value="' + 
			localisedFriendStrings[ (isChattingMap[userId] ? "localise-FeralNetUI.ChattingButton" : "localise-FeralNetUI.ChatButton") ] +'">';
	}
	newFriend += '</li>';

	return newFriend;
}

function updateBlocks(propertyName, typePattern, propValueArray)
{
	blockedIds = propValueArray[0];
	$("#friendsChatContent").contents().find('#feralNetFriendsList .feralNetFriend').each(
		function(i) {
			var idSplit = $(this).attr('id').split('-');
			var userId = idSplit[1];
			if (isBlocked(userId))
			{
				$(this).addClass('blocked');
			}
			else
			{
				$(this).removeClass('blocked');
			}
		}
	);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function isBlocked(userId)
{
	for (var i in blockedIds)
	{
		var id = blockedIds[i];
		if (id == userId)
			return true;
	}
	return false;
}

function updateFriendsList(propertyName, typePattern, propValueArray)
{
	if(propValueArray !== undefined && propValueArray.length == 3)
	{
		console.log("updating friends...");

		var numFriendsString;
		
		if (propValueArray[0] == 1)
		{
			numFriendsString = localisedFriendStrings["localise-FeralNetUI.OneFriend"];
		}
		else
		{
			numFriendsString = localisedFriendStrings["localise-FeralNetUI.NumberOfFriends"];
			numFriendsString = numFriendsString.replace("#{friend_count}", propValueArray[0]);
		}
		
		var friendsDownloaded = propValueArray[2];
		if(friendsDownloaded)
		{
			$("#friendsChatContent").contents().find('#numFriendsMessage').text(numFriendsString);
		}
		else
		{
			$("#friendsChatContent").contents().find('#numFriendsMessage').text(localisedFriendStrings["localise-FeralNetUI.LoadingFriends"]);
		}

		$("#friendsChatContent").contents().find('#feralNetFriendsList').empty();

		propValueArray[1].forEach(
			function (element, index, array){
				var userId = element[0];
				var nickname = element[1];
				var status = element[2] ? 'Online' : 'Offline';
				var avatarPath = element[3];
				var gameName = element[5];
				var isChatSupported = element[6];
					
				var newFriend = friendHTML(userId,nickname,status,avatarPath,gameName,isChatSupported,false);
				$('#friendsChatContent').contents().find('#feralNetFriendsList').append(newFriend);

				// Add a title to the nickname and status spans if they don't fit
				var nicknameElement = $('#friendsChatContent').contents().find("#feralNetFriend-" + userId + ">.statusBlock>.nickname-container .nickname");
				if(nicknameElement[0].offsetWidth < nicknameElement[0].scrollWidth)
				{
					nicknameElement.attr('title', nickname);
				}

				var statusElement = $('#friendsChatContent').contents().find("#feralNetFriend-" + userId + ">.statusBlock>.status");
				if(statusElement[0].offsetWidth < statusElement[0].scrollWidth)
				{
					statusElement.attr('title', gameName);
				}
			}
		);
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function initialiseFriendsToInvitePanel(propertyName, typePattern, propValueArray)
{
	if(propValueArray !== undefined && propValueArray.length == 1 && propValueArray[0].length > 0)
	{
		var isAnyFriendOnline = false;

		$('#friendsToInviteList').empty();

		propValueArray[0].forEach(
			function (element, index, array){
				var isOnline = element[2];
				var gameCode = element[4];
				var gameName = element[5];
				var invitable = element[7];
								  
				if(isOnline && invitable){
					var userId = element[0];
					var nickname = element[1];
					var avatarPath = element[3];
					var isChatSupported = element[6];

					if(!isAnyFriendOnline)
					{
						isAnyFriendOnline = true;
						$('#noFriendsOnlineMsg').addClass('noDisplay');
					}
					
					var newFriend = friendHTML(userId,nickname,"Online",avatarPath,gameName,isChatSupported,true);

					$('#friendsToInviteList').append(newFriend);

					// Add a title to the nickname span if it doesn't fit
					var nicknameElement = $("#feralNetFriendToInvite-" + userId + ">.statusBlock>.nickname-container .nickname");
					if(nicknameElement[0].offsetWidth < nicknameElement[0].scrollWidth)
					{
						nicknameElement.attr('title', nickname);
					}

					// Send an invite after clicking the button
					$('#feralNetFriendToInvite-' + userId + '>.invite').click(function()
						{
							if(!$(this).hasClass("disabled"))
							{
								setPropertyValue("InviteFriendToLobby","int",[userId]);

								$(this).attr("value", localisedFriendStrings["localise-FeralNetUI.SentButton"]);
								$(this).addClass("disabled");
							}
						}
					);
				}
			}
		);

		if(!isAnyFriendOnline)
		{
			$('#noFriendsOnlineMsg').removeClass('noDisplay');
		}
	}
	
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function updateFriendInfo(propertyName, typePattern, propValueArray)
{
	propValueArray[0].forEach(
		function (element, index, array){
			var userId = element[0];
			var nickname = element[1];
			var avatarPath = element[3];

			var currentTime = new Date().getTime();

			// Friends list
			$('#friendsChatContent').contents().find('#feralNetFriend-' + userId + '>.icon').attr('src', avatarPath + '?' + currentTime);
			$('#friendsChatContent').contents().find('#feralNetFriend-' + userId + '>.statusBlock>.nickname-container .nickname').html(nickname);
			
			// Friends to invite list
			$('#friendsChatContent').contents().find('#feralNetFriendToInvite-' + userId + '>.icon').attr('src', avatarPath + '?' + currentTime);
			$('#friendsChatContent').contents().find('#feralNetFriendToInvite-' + userId + '>.statusBlock>.nickname-container .nickname').html(nickname);

			// Chat tabs
			var tabContent = $('#friendsChatContent').contents().find('[href="#chatBox-' + userId + '"]').find('.content');
			tabContent.find('.icon').attr('src', avatarPath + '?' + currentTime);
			tabContent.find('.name').html(nickname);

			// Pending invites
			$('#invite-' + userId + '>.icon').attr('src', avatarPath + '?' + currentTime);
			$('#invite-' + userId + '>b>.name').html(nickname);
		}
	);

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

function addNewFriend()
{
	friendAddedNickname = $("#friendsChatContent").contents().find("#addFriendInput").val();
	
	// First, close the panel.
	if(friendAddedNickname != "")
	{
		$("#friendsChatContent").contents().find(".addFriendDialog>.closeButton").trigger('click');

		$("#friendsChatContent").contents().find("#addFriendInput").val("");
		$("#friendsChatContent").contents().find("#addFriendInput").trigger('input');

		// Finally, perform the action in the C++ handler.
		setPropertyValue("AddFriendNickname","string",[friendAddedNickname]);
	}
}

// Called mainly by feralNetChat.js in order to keep the "chatting" button displayed after an update to the friends list
function updateChattingMap(userID, isChatting)
{
	isChattingMap[userID] = isChatting;

	var friendButton = $("#friendsChatContent").contents().find("#feralNetFriend-" + userID + ">.button");

	if(isChatting)
	{
		friendButton.attr('value',localisedFriendStrings['localise-FeralNetUI.ChattingButton']);
		friendButton.addClass("disabled");
	}
	else
	{
		friendButton.attr('value',localisedFriendStrings['localise-FeralNetUI.ChatButton']);
		friendButton.removeClass("disabled");
	}
}


function updateAddFriendPanel(propertyName, typePattern, propValueArray)
{
	var dialogState = propValueArray[0];

	if(dialogState > 0 && dialogState < 4)
	{
		var failureState = propValueArray[1];

		var headerStringID;
		var descriptionStringID;
		
		switch(dialogState)
		{
			case 1: // kDialogBusy
				headerStringID = 'localise-Startup.Loading';
				descriptionStringID = 'localise-Startup.Loading';
				break;
			case 3: // kDialogFailure
				if (failureState == 1) // kFriendNotFoundError
				{
					headerStringID = 'localise-FeralNetUI.AddFriend.NotFound.Header';
					descriptionStringID = 'localise-FeralNetUI.AddFriend.NotFound.Description';
				}
				else if (failureState == 2) // kFriendAlreadyAddedError
				{
					headerStringID = 'localise-FeralNetUI.AddFriendAlreadyAddedHeader';
					descriptionStringID = '';

					// Replace #{username} with the actual username, in bold
					var successLocalisedString = localisedFriendStrings["localise-FeralNetUI.AddFriendAlreadyAddedDescription"];
					var theActualString = successLocalisedString.replace('#{username}', '<b>' + friendAddedNickname + '</b>');
					$("#friendsChatContent").contents().find(".addFriendDialog>.description>.text").html(theActualString);
				}
				else if (failureState == 3) // kAddingSelfError
				{
					headerStringID = 'localise-FeralNetUI.AddFriendsAddedSelfHeader';
					descriptionStringID = 'localise-FeralNetUI.AddFriendAddedSelfDescription';
				}
			break;
			case 2: // kDialogSuccess
				headerStringID = 'localise-FeralNetUI.AddFriend.MatchFound';
				descriptionStringID = '';

				// Replace #{username} with the actual username, in bold
				var successLocalisedString = localisedFriendStrings["localise-FeralNetUI.AddFriend.Success"];
				var theActualString = successLocalisedString.replace('#{username}', '<b>' + friendAddedNickname + '</b>');
				$("#friendsChatContent").contents().find(".addFriendDialog>.description>.text").html(theActualString);
			break;
		}

		// Apply the translations
		$("#friendsChatContent").contents().find(".addFriendDialog>.header").data('innerString', headerStringID);
		$("#friendsChatContent").contents().find(".addFriendDialog>.header").attr('data-inner-string', headerStringID);
		$("#friendsChatContent").contents().find(".addFriendDialog>.description>.text").data('innerString', descriptionStringID);
		$("#friendsChatContent").contents().find(".addFriendDialog>.description>.text").attr('data-inner-string', descriptionStringID);

		initialisePropertiesWithinElement($("#friendsChatContent").contents().find(".addFriendDialog"));

		// Make room for the panel
		if($("#friendsChatContent").contents().find(".addFriendDialog").hasClass("noDisplay"))
		{
			$("#friendsChatContent").contents().find("#feralNetFriendsList").css('height', '-=127px');

			// Show the panel
			$("#friendsChatContent").contents().find(".addFriendDialog").removeClass("noDisplay");
		}
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

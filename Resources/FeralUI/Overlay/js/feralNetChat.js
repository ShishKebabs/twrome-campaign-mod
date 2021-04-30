"use strict";

var tabCount = 0;
var currentTabID = ''; // = '#chatBox-0'; // Uncomment to test using the default conversations in the feralNetOverlay HTML
var conversationsMap = {}; // Contains the following information for each conversation:
						   // * pendingMsgsCount: Number of unread messages
						   // * lastSender: Name of the last user who sent a message
						   // * input: Contents of the input box before switching to a different tab
var localisedChatStrings = {};


startupPropertyLoadTasks.push(initialiseChatProperty);
startupPostPropertyLoadTasks.push(initialiseChatManager);

function initialiseChatProperty()
{
	var thePromises = [];

	thePromises.push(hookPropertyToFunction("localise-FeralNetUI.You", "string,bool", updateChatStringsMap));

	return Promise.allFinish(thePromises);
}

function initialiseChatManager()
{
	var thePromises = [];

	thePromises.push(hookPropertyToFunction("JoinChat", "int,string,string,bool,bool", newTab));
	thePromises.push(hookPropertyToFunction("LeaveChat", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("UpdateUsersList", "int,array<int,string,int,string>", emptyFunction));
	thePromises.push(hookPropertyToFunction("SendMessage", "int,string", emptyFunction));
	thePromises.push(hookPropertyToFunction("MessagesReceived", "array<int,string,string,bool>", messagesReceived));
	thePromises.push(hookPropertyToFunction("StartChat", "int", emptyFunction));
	thePromises.push(hookPropertyToFunction("ChatVisibility", "bool", onChatVisibility));
	thePromises.push(hookPropertyToFunction("ChatErrorMessage", "int,string", onChatError));

	setJQueryUIChatListeners();
	
	return Promise.allFinish(thePromises);
}

function updateChatStringsMap(propertyName, typePattern, propValueArray)
{
	localisedChatStrings[propertyName] = propValueArray[0];

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setJQueryUIChatListeners()
{
	// Let the user rearrange the tab list
	$("#friendsChatContent").contents().find("#tabList").sortable({ axis: "y", containment: "window"});
	$("#friendsChatContent").contents().find("#tabList").disableSelection();

	// Uncomment to test scrolling
	// bindScrollHandler($("#friendsChatContent").contents().find('#chatBox-0')[0]);
	// bindScrollHandler($("#friendsChatContent").contents().find('#chatBox-1')[0]);

    // Send message
    $("#friendsChatContent").contents().find("#chatInput").keydown(function (event)
    {
		if(event.which == 13) // Send message on enter
		{
			var feralID = parseInt(currentTabID.substr(9)); // currentTabID == "#chatBox-<feralID>", so we want everything after the '-'
			var theMessage = $("#friendsChatContent").contents().find("#chatInput").val();

			// trim any whitespace characters on both sides
		    theMessage = theMessage.replace(/^[\s]+/g, '');
		    theMessage = theMessage.replace(/[\s]+$/g, '');
																   
			setPropertyValue("SendMessage", "int,string", [feralID, theMessage]);
			newMessage(currentTabID, "", theMessage, false, true);
			$("#friendsChatContent").contents().find("#chatInput").val("");

			event.preventDefault();
		}
	});

    // Change tab
	$("#friendsChatContent").contents().find("#tabList").on("click", ".tab", function(event)
	{
		changeTabTo($(this));

		event.preventDefault();
		event.stopPropagation();
	});

	// Close tab
	$("#friendsChatContent").contents().find("#tabList").on("click", ".closeButton", function(event)
	{
		var tab =  $(this).parents(".content").parents(".tab");
		var chatID = tab.attr("href");
		var feralID = parseInt(chatID.substr(9)); // hrefs are "#chatBox-<feralID>", so we want everything after the '-'

   		setPropertyValue("LeaveChat","int",[feralID]);

   		$("#friendsChatContent").contents().find("#chatInput").addClass("noDisplay");

		$(tab).remove();
		$("#friendsChatContent").contents().find(chatID).remove();
		updateChattingMap(feralID, false); // Definition in feralNetFriends.js

		tabCount--;
		delete conversationsMap[feralID]; // Removes the currentTabID key from the map (and its value)
		currentTabID = '';

		event.preventDefault();
		event.stopPropagation();
	});

	// Start new chat with a friend
	$("#friendsChatContent").contents().find("#feralNetFriendsList").on("click", '.button.chat', function(event)
	{
		if(!$(this).hasClass("disabled"))
		{
			var theElementID = $(this).parent().attr('id');
			var feralID = parseInt(theElementID.substr(15)); // theElementID == "feralNetFriend-<feralID>"

			setPropertyValue("StartChat","int",[feralID]);
		}
	});
}

// The scroll event doesn't bubble, so we have to add it to each individual element as they're created
function bindScrollHandler(elem)
{
	$(elem).on("scroll", function()
    {
		if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) 
	    {
	    	var theNotificationSquare = $("#friendsChatContent").contents().find("[href=" + currentTabID + "]>.content>.notificationSquare")

	    	theNotificationSquare.empty();
	    	theNotificationSquare.addClass("noDisplay");
	        
	        conversationsMap[currentTabID]['pendingMsgsCount'] = 0;
	    }
	});
}

function emptyFunction(propertyName, typePattern, propValueArray)
{
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function newMessage(tabID, nickname, message, isServerStatus, isUserMessage)
{
	if(message!= "")
	{
		var chatLog = $("#friendsChatContent").contents().find(tabID);
		var outerClass = isUserMessage ? "sentMessage" : "receivedMessage";
		var theActualNickname = isUserMessage ? localisedChatStrings['localise-FeralNetUI.You'] : nickname;
		var feralID = parseInt(tabID.substr(9)); // tabID == "#chatBox-<feralID>", so we want everything after the '-'
		
		var isScrollBottom = chatLog.is(':visible') && (chatLog[0].scrollTop == chatLog[0].scrollHeight - chatLog.height());

		var theMessage = '<div class="' + outerClass + '">';
		if(isServerStatus)
		{
			theMessage +=	'<span class="status">' + theActualNickname + ' ' + message  + '</span>';
		}
		else
		{
			// Don't show the sender's nickname in consecutive messages.
			if(conversationsMap[feralID]['lastSender'] != theActualNickname)
			{
				theMessage +=	'<span class="status">' + theActualNickname + '</span>' +
								'<span class="message">' + htmlEncode(message) + '</span>';
			}
			else
			{
				theMessage +=	'<span class="message">' + htmlEncode(message) + '</span>';
			}
		}
		theMessage +=	'</div>';

		chatLog.append(theMessage);

		// Save who sent the last message
        conversationsMap[feralID]['lastSender'] = theActualNickname;
 
        // Check if we need to update the notifications square of the tab
		if(isUserMessage || isScrollBottom)
		{
			chatLog.scrollTop();
			chatLog.scrollTop(chatLog[0].scrollHeight);
		}
		else
		{
			var theNotificationSquare = $("#friendsChatContent").contents().find("[href=" + tabID + "]>.content>.notificationSquare");
			if(conversationsMap[feralID]['pendingMsgsCount'] > 0)
			{
				if (conversationsMap[feralID]['pendingMsgsCount'] < 99) {
					theNotificationSquare.html(++conversationsMap[feralID]['pendingMsgsCount']);
				}
				else
				{
					theNotificationSquare.html( "99+" );
				}
			}
			else if (conversationsMap[feralID]['pendingMsgsCount'] <= 0)
			{
				theNotificationSquare.html( "1" );
				conversationsMap[feralID]['pendingMsgsCount'] = 1;
				theNotificationSquare.removeClass("noDisplay");
			}
		}
	}
}

function newTab(propertyName, typePattern, propValueArray)
{
	var feralID = propValueArray[0];
	var tabName = propValueArray[1];
	var tabAvatar = propValueArray[2];
	var isGroupChat = propValueArray[3];
	var isOpenedByUser = propValueArray[4];
	var contentID = "chatBox-" + feralID;

	if(feralID != 0)
	{
	    var li = '<li class="tab" href="#' + contentID + '">' +
	    			'<div class="content">' +
	    				'<image class="icon" src="' + tabAvatar + '" height="22" width="22" onerror="this.onerror=\'\'; this.src=\'../images/icon.png\';">' +
						'<span class="name-outer"><span class="name">' + tabName + '</span></span>' +
						'<div class="notificationSquare noDisplay"></div>' +
						'<img class="closeButton" src="../images/close.svg" height="22" width="22">' +
	    			'</div>' +
	    		'</li>';
	    var tabContentHtml = '<div class="chatBox noDisplay" id="' + contentID + '"></div>'
	 
	    $("#friendsChatContent").contents().find("#tabList").prepend( li );
	    $("#friendsChatContent").contents().find("#chatsContainer").append( tabContentHtml );
	    bindScrollHandler($("#friendsChatContent").contents().find('#' + contentID)[0]);

	    conversationsMap[feralID] = {};
	    conversationsMap[feralID]['pendingMsgsCount'] = 0;
	    conversationsMap[feralID]['lastSender'] = '';
	    conversationsMap[feralID]['input'] = '';

	    if (isOpenedByUser || currentTabID == '')
	    {
	    	changeTabTo($("#friendsChatContent").contents().find("[href=#" + contentID + "]"));
	    }

	    ++tabCount;

	    // Change the chat button to 'chatting'
	    updateChattingMap(feralID, true); // Definition in feralNetFriends.js
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function messagesReceived(propertyName, typePattern, propValueArray)
{
	propValueArray[0].forEach(
		function (element, index, array){
			var tabID = '#chatBox-' + element[0];
			var nickname = element[1];
			var message = element[2];
			var isServerStatus = element[3];

			newMessage(tabID, nickname, message, isServerStatus, false);
		}
	);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function changeTabTo(elem)
{
	var chatID = elem.attr('href');

	if(currentTabID != '' && currentTabID != chatID)
	{
		$("#friendsChatContent").contents().find("#tabList").find("[href=" + currentTabID + "]").removeClass("selectedTab");
		$("#friendsChatContent").contents().find(currentTabID).addClass("noDisplay");
		$("#friendsChatContent").contents().find(chatID).removeClass("noDisplay");

		// Update the contents of the chat input
		var currentFeralID = parseInt(currentTabID.substr(9)); // currentTabID == "#chatBox-<feralID>", so we want everything after the '-'
		var feralID = parseInt(chatID.substr(9));

		if(conversationsMap[currentFeralID] !== undefined)
		{
			conversationsMap[currentFeralID]['input'] = $("#friendsChatContent").contents().find("#chatInput").val();
		}

		$("#friendsChatContent").contents().find("#chatInput").val(conversationsMap[feralID]['input']);
		conversationsMap[feralID]['input'] = '';
	}
	else if (currentTabID == '')
	{
		$("#friendsChatContent").contents().find(chatID).removeClass("noDisplay");
	}

	currentTabID = chatID;
	// Only highlight the selected tab
	elem.addClass("selectedTab");

	// Check if we should remove the notifications square from the tab
	var chatLog = $("#friendsChatContent").contents().find(chatID);
	if(chatLog[0] !== undefined)
	{
		var isScrollBottom = chatLog[0].scrollTop == chatLog[0].scrollHeight - chatLog.height();

		if(isScrollBottom)
		{
			var theNotificationSquare = $("#friendsChatContent").contents().find(
				"[href=" + currentTabID + "]>.content>.notificationSquare");

	    	theNotificationSquare.empty();
	    	theNotificationSquare.addClass("noDisplay");

	    	var currentFeralID = parseInt(currentTabID.substr(9)); // currentTabID == "#chatBox-<feralID>", so we want everything after the '-'
	        conversationsMap[currentFeralID]['pendingMsgsCount'] = 0;

		}
	}

	// Show the chat input box, and give it focus
	var chatInput = $("#friendsChatContent").contents().find("#chatInput");
	chatInput.removeClass("noDisplay");
	chatInput.focus();
}


function onChatVisibility(propertyName, typePattern, propValueArray)
{
	// Focus on the input area when opening a chat for the first time
	$("#friendsChatContent").contents().find("#chatInput").focus();

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;	
}

function onChatError(propertyName, typePattern, propValueArray)
{
	var chatID = propValueArray[0] == 0 ? currentTabID : '#chatBox-' + propValueArray[0];
	var errorMsg = propValueArray[1];

	if(errorMsg != "")
	{
		var errorElement = '<div class="chatError">' + errorMsg + '</div>';

		// Add the error message, and force scroll to the bottom
		var chatBox = $("#friendsChatContent").contents().find(chatID);
		chatBox.append(errorElement);
		chatBox.scrollTop(chatBox[0].scrollHeight);
	}

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;	
}

"use strict";

var sharedItemsModule = (function(){
	var mItems = [];
	var mItemsPerPage = 6;
	var mTotalItems = 0;
	var mOffset = 0;
	var mSingleItemId = -1;
	var mFirstLoad = true;
	var mStrings = {};
	
	startupPropertyLoadTasks.push(initialiseSharedItemsProperty);
	startupPostPropertyLoadTasks.push(initialiseSharedItemsManager);
	
	function initialiseSharedItemsManager()
	{
		var thePromises = [];
						 
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-ItemRange", "string,bool", updateStringsMap));
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-ItemRangeZero", "string,bool", updateStringsMap));
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-NumSubscribers", "string,bool", updateStringsMap));
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-OneSubscriber", "string,bool", updateStringsMap));
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-Subscribe", "string,bool", updateStringsMap));
		thePromises.push(hookPropertyToFunction("localise-FeralNetUI.SharedItems-Unsubscribe", "string,bool", updateStringsMap));
		
		return Promise.allFinish(thePromises);
	}
						 
	function updateStringsMap(propertyName, typePattern, propValueArray)
	{
		mStrings[propertyName] = propValueArray[0];
		return true;
	}
	
	function initialiseSharedItemsProperty()
	{
		var thePromises = [];
		// Storage file is:
		// "int,array<int,string,string,float,int,int,bool,bool,array<string>,int,int>"
		//  0 id
		//  1 title
		//  2 description
		//  3 score
		//  4 user vote
		//  5 num subscribers
		//  6 is user subscribed
		//  7 is user owner
		//  8 tags
		//  9 created time
		// 10 modified time
		// 11 preview image location
		// 12 visiblity
		thePromises.push(hookPropertyToFunction("UpdateSharedItems", "int,int,array<int,string,string,float,int,int,bool,bool,array<string>,int,int,string,string>,bool", itemsReceived));
	 	thePromises.push(hookPropertyToFunction("RequestSharedItems", "int,int,string", function(){return true;}));
	 	thePromises.push(hookPropertyToFunction("SetSharedItemSubscription", "int,bool", function(){return true;}));
	 	thePromises.push(hookPropertyToFunction("SetSharedItemVote", "int,int", function(){return true;}));
	 	thePromises.push(hookPropertyToFunction("SaveSharedItem", "int,string,string,bool", function(){return true;}));
		thePromises.push(hookPropertyToFunction("ShowOverlaySharedItems", "", showOverlaySharedItems));
		thePromises.push(hookPropertyToFunction("UpdateSingleItem", "int,string,string,float,int,int,bool,bool,array<string>,int,int,string,string", showOverlaySingleItem));
	 	
 		var contents = $("#sharedItemsContent").contents();
 		contents.find("#prevButton").click(function() {
 			mOffset -= mItemsPerPage;
 			if (mOffset < 0) mOffset = 0;
			requestSharedItems(mOffset);
 		});
 		contents.find("#nextButton").click(function() {
 			mOffset += mItemsPerPage;
 			if (mOffset >= mTotalItems) {
 				// Start at the last page
 				var numPages = Math.ceil(mTotalItems / mItemsPerPage);
				if (numPages <= 0) numPages = 1;
 				mOffset = (numPages - 1) * mItemsPerPage;
 			}
			requestSharedItems(mOffset);
 		});
 		contents.find("#itemsSortBySelect").change(function() {
 			// Change sort order, and put offset back to 0.
 			mOffset = 0;
			requestSharedItems(mOffset);
 		});
 
		return Promise.allFinish(thePromises);
	}
						 
	function showOverlaySharedItems(propertyName, typePattern, propValueArray)
	{
		setOverlayVisible(true, 'sharedItemsTab');
		return true;
	}
	
	function showOverlaySingleItem(propertyName, typePattern, propValueArray)
	{
		if(propValueArray && propValueArray.length >= 12)
		{
			var item = makeItemObject(propValueArray);
			if (item.id > 0)
			{
				setOverlayVisible(true, 'sharedItemsTab');
				showSingleItem(item);
			}
		}
		return true;
	}
 
	function requestSharedItems(offset)
	{	
		var contents = $("#sharedItemsContent").contents();
		var sort = contents.find("#itemsSortBySelect").val();
		
		setPropertyValue("RequestSharedItems", "int,int,string", [mItemsPerPage, offset, sort]);
		
		contents.find(".sharedItem").remove();
		contents.find("#loading").show();
	}
	
	function setSubscription(itemId, subscribe)
	{
		incNumSubscribers(itemId, subscribe ? +1 : -1);
		setPropertyValue("SetSharedItemSubscription","int,bool",[itemId, subscribe]);
	}
	
	function setVote(itemId, vote)
	{
		setPropertyValue("SetSharedItemVote","int,int",[itemId, vote]);
	}
	
	function saveEdits(itemId, title, desc, isPublic)
	{
		setPropertyValue("SaveSharedItem","int,string,string,bool",[itemId, title, desc, isPublic]);
	}

	function makeItemObject(element)
	{
		return {
			id: element[0],
			title: element[1],
			description: element[2],
			score: element[3],
			userVote: element[4],
			numSubscribers: element[5],
			isSubscribed: element[6],
			isOwner: element[7],
			tags: element[8],
			created: element[9],
			modified: element[10],
			previewURL: element[11],
			visibility: element[12]
		};
	}
 
	function makeTags(list)
	{
		var tags = '';
		for (var i in list) {
			tags += '<span>'+list[i]+'</span> ';
		}
		return tags;
	}
 
	function makeRating(score)
	{
		var scaledScore = score * 5;
		var starElements = [
			'<span class="star empty" height="18"></span>',
			'<span class="star half" height="18"></span>',
			'<span class="star full" height="18"></span>',
		];
		var stars = '';
		for (var i = 0; i < 5; i++)
		{
			var pivot = scaledScore - i;
			if (pivot < 0.35) {
				stars += starElements[0];
			} else if (pivot < 0.85) {
				stars += starElements[1];
			} else {
				stars += starElements[2];
			}
		}
		return stars;
	}
 
 	function makeItemElement(item)
	{
		var subButton = '';
		if (item.isSubscribed)
		{
			subButton = '<a href="#" class="button unsubButton">' + mStrings["localise-FeralNetUI.SharedItems-Unsubscribe"] + '</a>';
		} else {
			subButton = '<a href="#" class="button subButton">' + mStrings["localise-FeralNetUI.SharedItems-Subscribe"] + '</a>';
		}
		var subscribersText;
		if (item.numSubscribers == 1) {
			subscribersText = mStrings["localise-FeralNetUI.SharedItems-OneSubscriber"];
		} else {
			subscribersText = mStrings["localise-FeralNetUI.SharedItems-NumSubscribers"].replace("{n}", item.numSubscribers);
		}
		var item =
			'<div class="sharedItem">' +
			'	<div class="preview">&nbsp;</div>' +
			'	<div class="content">' +
			'		<h2>'+ item.title +'</h2>' +
			'		<div class="rating"> <!-- Rating -->' +
			'          ' + makeRating(item.score) +
			'		</div>' +
			'		<div class="tags"> <!-- Tags -->' +
			'          ' + makeTags(item.tags) +
			'		</div>' +
			'		<div class="subscription"> <!-- Sub button -->' +
			'			<span class="numSubs">'+ subscribersText +'</span> ' + subButton +
			'		</div>' +
			'	</div>' +
			'</div>';
		return item;
	}
	
	function enterEditMode()
	{
		var singleItem = $("#sharedItemsContent").contents().find('#singleItem');
		
		var desc = singleItem.find("#singleItemDescription");
		desc.html('<textarea id="singleItemNewDesc" >' + desc.text() + '</textarea>');
		
		var title = singleItem.find("#singleItemTitle");
		title.html('<input id="singleItemNewTitle" type="text" value="'+title.text()+'">');
		
		singleItem.find("#singleItemVisibility").show();
	}
	
	function showSingleItem(item)
	{
		mSingleItemId = item.id;
		var singleItem = $("#sharedItemsContent").contents().find('#singleItem');
		// Populate singleItem tab with real data.
		singleItem.find("#singleItemTitle").text( item.title );
		singleItem.find("#singleItemDescription").text( item.description );
		singleItem.find("#singleItemTags").html( makeTags(item.tags) );
		singleItem.find("#singleItemRating").html( makeRating(item.score) );
		if (item.previewURL.length > 0) {
			var singleItemPreview = singleItem.find("#singleItemPreview");
			singleItemPreview.removeClass("empty");
			singleItemPreview.css("background-image", "url('"+item.previewURL+"')");
			singleItemPreview.css("width", "auto");
			singleItemPreview.css("background-size", "contain");
			singleItemPreview.css("background-repeat", "no-repeat");
		} else {
			singleItem.find("#singleItemPreview").addClass("empty");
		}
		
		// Owner tools
		var isPrivate = item.visibility == 'private';
		singleItem.find("#singleItemPrivateMessage").css( 'visibility', isPrivate ? 'visible' : 'hidden' );
		var ownerPanel = singleItem.find("#singleItemOwnerPanel");
		ownerPanel.css( 'display', item.isOwner ? 'block' : 'none' );
		var editPanel = singleItem.find("#singleItemEditPanel");
		editPanel.css( 'display', 'none' );
		singleItem.find("#singleItemVisibility").hide();
		singleItem.find("#singleItemVisibilityBox").prop( 'checked', ! isPrivate );
		
		// Subscription buttons
		singleItem.find("#singleItemUnsubButton").css( 'display', item.isSubscribed ? 'inline' : 'none' );
		singleItem.find("#singleItemSubButton").css( 'display', item.isSubscribed ? 'none' : 'inline' );
		singleItem.find("#singleItemUnsubButton").off("click").click(function() {
			$(this).addClass('noclick');
			setSubscription(item.id, false);
		}).removeClass('noclick');
		singleItem.find("#singleItemSubButton").off("click").click(function() {
			$(this).addClass('noclick');
			setSubscription(item.id, true);
		}).removeClass('noclick');
		
		// Like/unlike buttons
		var likeButton = singleItem.find("#singleItemLikeButton");
		var dislikeButton = singleItem.find("#singleItemDislikeButton");
		likeButton.off("click").click(function() {
			if ($(this).hasClass('current')) {
				setVote(item.id, 0);
			} else {
				setVote(item.id, 1);
			}
			$(this).toggleClass('current');
			dislikeButton.removeClass('current');
		}).removeClass('current');
		dislikeButton.off("click").click(function() {
			if ($(this).hasClass('current')) {
				setVote(item.id, 0);
			} else {
				setVote(item.id, -1);
			}
			$(this).toggleClass('current');
			likeButton.removeClass('current');
		}).removeClass('current');
		if (item.userVote == 1) {
			likeButton.addClass('current');
		}
		if (item.userVote == -1) {
			dislikeButton.addClass('current');
		}
		
		// Owner buttons
		singleItem.find("#singleItemEditButton").off("click").click(function() {
			enterEditMode();
			editPanel.show();
			ownerPanel.hide();
		});
		singleItem.find("#singleItemSaveButton").off("click").click(function() {
			var title = singleItem.find("#singleItemNewTitle").val();
			var desc = singleItem.find("#singleItemNewDesc").val();
			var isPublic = singleItem.find("#singleItemVisibilityBox").prop( 'checked' );
			saveEdits(item.id, title, desc, isPublic);
		});
		singleItem.find("#singleItemDiscardButton").off("click").click(function() {
			showSingleItem(item);
		});
		
		// Back button
		singleItem.find("#singleItemBackButton").click(function() {
			hideSingleItem();
		});
		
		singleItem.find("#singleItemCreated").text( new Date(item.created * 1000).toLocaleDateString() );
		singleItem.find("#singleItemModified").text( new Date(item.modified * 1000).toLocaleDateString() );
		
		singleItem.click(function(e) {
			if (e.target == this)
				hideSingleItem();
		});
		
		singleItem.fadeIn(100);
	}
	
	function hideSingleItem() {
		var singleItem = $("#sharedItemsContent").contents().find('#singleItem');
		singleItem.fadeOut(100);
		mSingleItemId = -1;
	}
	
	function incNumSubscribers(itemId, inc) {
		// Change number of subscribers
		for (var i in mItems)
		{
			var item = mItems[i];
			if (item.id == itemId)
			{
				item.numSubscribers = item.numSubscribers + inc;
				break;
			}
		}
	}
		
	function showItems(offset, total)
	{
		var first = offset + 1;
		var last = offset;
		var count = 0;
		var contents = $("#sharedItemsContent").contents();
		contents.find("#loading").hide();
		contents.find(".sharedItem").remove();
		var list = contents.find("#itemsList");
		for (var i in mItems)
		{
			var element = mItems[i];
			var item = makeItemElement(element);
			// Lambda used to avoid all elements referring to the last item
			(function(e) {
				var row = $(item).appendTo(list).click(function() {
					showSingleItem(e);
				});
				if (e.previewURL.length > 0) {
					row.find(".preview").removeClass("empty");
					row.find(".preview").css("background-image", "url('"+e.previewURL+"')");
				} else {
					row.find(".preview").addClass("empty");
				}
				row.find(".subButton").click(function(evt){
					$(this).addClass('noclick');
					setSubscription(e.id, true);
					evt.stopPropagation();
				});
				row.find(".unsubButton").click(function(evt){
					$(this).addClass('noclick');
					setSubscription(e.id, false);
					evt.stopPropagation();
				});
			})(element);
			last++;
			count++;
			if (count == mItemsPerPage)
			{
				break;
			}
		}
		
		var itemsText = "";
		if (total > 0) {
			var template = mStrings["localise-FeralNetUI.SharedItems-ItemRange"];
			itemsText = template
				.replace("{range}", first + " - " + last)
				.replace("{total}", total);
		} else {
			itemsText = mStrings["localise-FeralNetUI.SharedItems-ItemRangeZero"];
		}
		contents.find("#offsetDisplay").text( itemsText );
	} 
 
	function itemsReceived(propertyName, typePattern, propValueArray)
	{
		var offset = 0;
		mTotalItems = 0;
		if(propValueArray && propValueArray.length > 1)
		{
			offset = propValueArray[0];
			mTotalItems = propValueArray[1];
			var items = propValueArray[2];
			var updateNumSubs = propValueArray[3];
			
			var oldItems = mItems;
			mItems = [];
			items.forEach(
				function (element, index, array)
				{
					var item = makeItemObject(element);
					if (! updateNumSubs)
					{
						// Go through previous items and revert to old num subs if the item was here before
						for (var i in oldItems)
						{
							var oldItem = oldItems[i];
							if (oldItem.id == item.id)
							{
								item.numSubscribers = oldItem.numSubscribers;
								break;
							}
						}
					}
					mItems.push(item);
					if (item.id == mSingleItemId)
					{
						showSingleItem(item);
					}
				}
			);
		}
		showItems(offset, mTotalItems);
		//Make the scripting interface return something other than undefined
		//since some interfaces can't tell the difference between that and an exception
		return true;
	}
	
	return {
		onSelect: function() {
			if (mFirstLoad)
			{
				requestSharedItems(0);
				mFirstLoad = false;
			}
		},
	};
	
})();

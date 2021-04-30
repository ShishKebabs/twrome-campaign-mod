"use strict";

var achievements = {};
var isFirstCall = true;
var listSortFunctions = { "lockedSelect": compareProgress, "unlockedSelect" : compareUnlockDatesMostRecent};
var localisedAchievementsStringsMap = {};
var translationsPromise;
 
startupPropertyLoadTasks.push(initialiseAchievementsProperty);
startupPostPropertyLoadTasks.push(initialiseAchievementsManager);

function initialiseAchievementsProperty()
{
	var thePromises = [];

	translationsPromise = Promise.allFinish([
		hookPropertyToFunction("localise-FeralNetUI.UnlockedDate", "string,bool", updateAchievementsStringsMap),
    	hookPropertyToFunction("localise-FeralNetUI.AchievementsSecretAchievementsDescription", "string,bool", updateAchievementsStringsMap),
    	hookPropertyToFunction("localise-FeralNetUI.AchievementsSecretAchievementsName", "string,bool", updateAchievementsStringsMap)
    ]);
    
    thePromises.push(translationsPromise);

	return Promise.allFinish(thePromises);
}

function initialiseAchievementsManager()
{
	var thePromises = [];

	thePromises.push(hookPropertyToFunction("UpdateAchievements", "array<string,string,string,string,bool,int,int,int,bool>", achievementsReceived));

	setJQueryAchievementsListeners();
	
	return Promise.allFinish(thePromises);
}

function updateAchievementsStringsMap(propertyName, typePattern, propValueArray)
{
	localisedAchievementsStringsMap[propertyName] = propValueArray[0];

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function setJQueryAchievementsListeners()
{
	// Make :contains case-insensitive (as seen in https://css-tricks.com/snippets/jquery/make-jquery-contains-case-insensitive/)
	$.expr[":"].contains = $.expr.createPseudo(function(arg) {
	    return function( elem ) {
	        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
	    };
	});

	// Initialise the selectic boxes
	$("#achievementsContent").contents().find(".selectBox").selectric();

	// Change the order of the achievements list
	$("#achievementsContent").contents().find(".selectBox").on('change', function(event)
	{
		var theValue = $(this).val();
		var theSelectID = $(this).attr('id');

		if(theSelectID !== undefined)
		{
			var theList = $("#achievementsContent").contents().find(theSelectID == "lockedSelect" ? "#lockedList>div" : "#unlockedList>div").get();

			if(theValue == "nameAZ")
			{
				listSortFunctions[theSelectID] = compareNamesAZ;
			}
			else if(theValue == "nameZA")
			{
				listSortFunctions[theSelectID] = compareNamesZA;
			}
			else if(theValue == "progress")
			{
				listSortFunctions[theSelectID] = compareProgress;
			}
			else if(theValue == "unlockDateMostRecent")
			{
				listSortFunctions[theSelectID] = compareUnlockDatesMostRecent;
			}
			else if(theValue == "unlockDateLeastRecent")
			{
				listSortFunctions[theSelectID] = compareUnlockDatesLeastRecent;
			}

			sortList(theList, listSortFunctions[theSelectID]);
		}

		event.stopPropagation();
	});

	// Filter the achievements list
	$("#achievementsContent").contents().find("#achievementSearch").on('input paste', function(event)
	{
		var filter = $(this).val();
		if (filter)
		{
			$("#achievementsContent").contents().find(".panelContents").find(".name:not(:contains(" + filter +"))").parent().parent().addClass("noDisplay");
			$("#achievementsContent").contents().find(".panelContents").find(".name:contains(" + filter +")").parent().parent().removeClass("noDisplay");
		}
		else
		{
			$("#achievementsContent").contents().find(".panelContents").find("div").removeClass("noDisplay");
		}
	});
}

function achievementsReceived(propertyName, typePattern, propValueArray)
{
	translationsPromise.then(function(){
		if(propValueArray && propValueArray.length > 0)
		{
			if(isFirstCall)
			{
				$("#achievementsContent").contents().find("#unlockedList").empty();
				$("#achievementsContent").contents().find("#lockedList").empty();
			}
			
			var atLeastOneProgress = false;
			propValueArray[0].forEach(
				function (element, index, array){
					var ach = {
						achID:           element[0],
						name:            element[1],
						description:     element[2],
						iconPath:        element[3],
						iconText:        "",
						isUnlocked:      element[4],
						unlockTime:      element[5] * 1000,
						currentProgress: element[6],
						maxProgress:     element[7],
						isSecret:        element[8]
					};
					achievements[ach.achID] = ach;
					
					if (ach.maxProgress != 0)
					{
						atLeastOneProgress = true;
					}

					if(ach.isUnlocked && ach.maxProgress != 0)
					{
						ach.currentProgress = ach.maxProgress;
					}
									  
					// Only show achievements which are not secret, or which are unlocked
					if(! ach.isSecret || ach.isUnlocked)
					{
						var achievement = makeAchievementElement(ach);

						if(!isFirstCall)
						{
							$("#achievementsContent").contents().find("#achievement-" + ach.achID).remove();
						}

						if(!ach.isUnlocked)
						{
							$("#achievementsContent").contents().find("#lockedList").append(achievement);
						}
						else
						{
							$("#achievementsContent").contents().find("#unlockedList").append(achievement);
						}

						var unlockPercent;

						if(ach.maxProgress != 0 && ach.currentProgress < ach.maxProgress)
						{
							ach.unlockPercent = (ach.currentProgress * 100.0) / (ach.maxProgress * 1.0);
						}
						else if (ach.maxProgress == 0 && !ach.isUnlocked) 
						{
							ach.unlockPercent = 0;
						}
						else
						{
							ach.unlockPercent = 100;
						}

						$("#achievementsContent").contents().find("#achievement-" + ach.achID + ">.progressBar>.unlockedPercent").
							css('width', ach.unlockPercent + '%');

						$("#achievementsContent").contents().find("#achievement-" + ach.achID + ">.progressBar>.lockedPercent").
							css('width', 100 - ach.unlockPercent + '%');

						if(ach.maxProgress != 0 && !ach.isUnlocked && ach.currentProgress < ach.maxProgress)
						{
							$("#achievementsContent").contents().find("#achievement-" + ach.achID + ">.progressBar>.separator").
								css('left', ach.unlockPercent + '%');
						}
					}
			});
			
			// If there are no progress achievements, remove the "sort by progress" option
			if (! atLeastOneProgress && propValueArray[0].length > 0)
			{
				var progressOption = $("#achievementsContent").contents().find("#lockedSelect option[value=progress]");
				if (progressOption.size() > 0)
				{
					progressOption.remove();
					$("#achievementsContent").contents().find("#lockedSelect").selectric('refresh');
					if (listSortFunctions["lockedSelect"] == compareProgress)
					{
						listSortFunctions["lockedSelect"] = compareNamesAZ;
					}
				}
			}

			// Reapply sorting and filters
			sortList($("#achievementsContent").contents().find("#lockedList>div").get(), listSortFunctions["lockedSelect"]);
			sortList($("#achievementsContent").contents().find("#unlockedList>div").get(), listSortFunctions["unlockedSelect"]);
			$("#achievementsContent").contents().find("#achievementSearch").trigger('input');
			
			// Add the secret achievements to the end
			// We always recalculate this as the secret achievements might have changed.
			var numSecretAchievements = 0;
			// Remove secret (should it exist)
			$("#achievementsContent").contents().find("#achievement-feral-secrets").remove();
			for (var k in achievements)
			{
				var a = achievements[k];
				if (a.isSecret && !a.isUnlocked)
				{
					numSecretAchievements ++;
				}
			}
			if (numSecretAchievements > 0)
			{
				var achID = "feral-secrets";
				var description = localisedAchievementsStringsMap["localise-FeralNetUI.AchievementsSecretAchievementsDescription"];
				var name = localisedAchievementsStringsMap["localise-FeralNetUI.AchievementsSecretAchievementsName"]
								.replace("{n}", numSecretAchievements);
				var achievement = makeAchievementElement({
					achID:           achID,
					name:            name,
					description:     description,
					iconPath:        "",
					iconText:        "+"+numSecretAchievements,
					isUnlocked:      false,
					unlockTime:      0,
					currentProgress: 0,
					maxProgress:     0,
					isSecret:        false
				});
				$("#achievementsContent").contents().find("#lockedList").append(achievement);
				$("#achievementsContent").contents().find("#achievement-" + achID + ">.progressBar>.unlockedPercent").
					css('width', '0%');
				$("#achievementsContent").contents().find("#achievement-" + achID + ">.progressBar>.lockedPercent").
					css('width', '100%');
			}

			// Append locked, unlocked and total counts to the section headings.
			var numTotalAchievements = 0;
			var numUnlockedAchievements = 0;
			var numLockedAchievements = 0;
			for (var k in achievements)
			{
				var a = achievements[k];
				numTotalAchievements++;
				if (a.isUnlocked)
				{
					numUnlockedAchievements++;
				}
				else
				{
					numLockedAchievements++;
				}
			}

			$("#achievementsContent").contents().find("#unlockedAchievementCount").text("(" + numUnlockedAchievements + " / " + numTotalAchievements + ")");
			$("#achievementsContent").contents().find("#lockedAchievementCount").text("(" + numLockedAchievements + " / " + numTotalAchievements + ")");

			if(isFirstCall && propValueArray[0].length > 0)
			{
				isFirstCall = false;
			}
		}
	});

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function makeAchievementElement(ach)
{
	var a = '';
	a += '<div class="achievementPanel' + (!ach.isUnlocked ? ' locked' : '') + '" id="achievement-' + ach.achID + '">';
	if (ach.iconPath !== '')
	{
		a += '<img class="icon" src="' + ach.iconPath + '" height="64" width"64" onerror="this.onerror=\'\';">';
	}
	else if (ach.iconText !== '')
	{
		a += '<div class="icon">'+ach.iconText+'</div>';
	}
	a += '<span class="achievementPanelText">';
	if (ach.maxProgress != 0)
	{
		a += '<span class="progressCount">' +
			    '<span class="currentProgress">' + (ach.currentProgress < ach.maxProgress ? ach.currentProgress : ach.maxProgress) + '</span>' + 
			    ' / ' + 
			    '<span class="maxProgress">' + ach.maxProgress + '</span>' +
			 '</span>';
	}
	a += '<span class="name">' + ach.name + '</span>';
	a += '<span class="description">' + ach.description + '</span>';
	a += '</span>';
	if (ach.isUnlocked)
	{
		a += '<span class="unlockBubble" time="' + ach.unlockTime + '">' + localisedAchievementsStringsMap["localise-FeralNetUI.UnlockedDate"] + ' ' + 
					new Date(ach.unlockTime).toString() + '</span>';
	}
	a += '<div class="progressBar">';
	a += '<div class="unlockedPercent"></div>';
	if (ach.maxProgress != 0 && !ach.isUnlocked && ach.currentProgress < ach.maxProgress)
	{
		a += '<div class="separator"></div>';
	}
	a += '<div class="lockedPercent"></div>';
	a += '<div class="base"></div>'
	a += '</div>';
	a += '</div>';
	return a;
}

function sortList(list, compareFunction)
{
	list.sort(compareFunction);

	for (var i = 0; i < list.length; i++) {
	    list[i].parentNode.appendChild(list[i]);
	}
}

function compareNamesAZ(lhs, rhs)
{
	var lhsString = $(lhs).find(".name").html().toLowerCase().replace(/\W/g, '');
	var rhsString = $(rhs).find(".name").html().toLowerCase().replace(/\W/g, '');
	return lhsString.localeCompare(rhsString);
}

function compareNamesZA(lhs, rhs)
{
	return compareNamesAZ(rhs, lhs)
}

function compareProgress(lhs, rhs)
{
	var res = 0;
	var lhsElement = $(lhs).find(".progressCount");
	var rhsElement = $(rhs).find(".progressCount");

	if(lhsElement.length > 0 && rhsElement.length > 0)
	{
		var lhsCurrentProgress = parseInt(lhsElement.find(".currentProgress").html()) * 1.0;
		var lhsMaxProgress = parseInt(lhsElement.find(".maxProgress").html()) * 1.0;
		var rhsCurrentProgress = parseInt(rhsElement.find(".currentProgress").html()) * 1.0;
		var rhsMaxProgress = parseInt(rhsElement.find(".maxProgress").html()) * 1.0;

		// Achievements with more progress percentage should appear first
		res = (rhsCurrentProgress / rhsMaxProgress) - (lhsCurrentProgress / lhsMaxProgress);

		if(res == 0)
		{
			res = compareNamesAZ(lhs, rhs);
		}
	}
	else if(lhsElement.length == 0 && rhsElement.length == 0)
	{
		res = compareNamesAZ(lhs, rhs);
	}
	else if(lhsElement.length > 0 && rhsElement.length == 0)
	{
		res = -1;
	}
	else
	{
		res = 1;
	}

	return res;
}

function compareUnlockDatesMostRecent(lhs, rhs)
{
	// Every achievement in the unlocked list will have an unlocked date 
	var res =  $(rhs).find(".unlockBubble").attr('time') - $(lhs).find(".unlockBubble").attr('time');

	if(res == 0)
	{
		res = compareNamesAZ(lhs, rhs);
	}

	return res;
}

function compareUnlockDatesLeastRecent(lhs, rhs)
{
	return compareUnlockDatesMostRecent(rhs, lhs);
}

"use strict";

//This is important, otherwise variables will be global and overwritten by other imports 
//before any async code is run... but only sometimes!
(function() {
	// importDoc references this import's document
	var importDoc = getImportedDocForJS();

	runImportJs(
		function()
		{	//END OF BOILERPLATE, YOUR CODE STARTS HERE. Use importDoc to reference your imported html.
						
			
			// Test panel check boxes
			var testVideosCheckbox = $("#TestVideos", importDoc);
			var noSoundCheckbox = $("#NoSound", importDoc);
			var noMoviesCheckbox = $("#NoMovies", importDoc);
			var texClientStorageCheckbox = $("#TexClientStorage", importDoc);
			var iOSUICheckbox = $("#EnableFeralUI", importDoc);
			var assetLoggingEnabledCheckbox = $("#AssetLoggingEnabled", importDoc);
			var assetUsageLoggingEnabledCheckbox = $("#AssetUsageLoggingEnabled", importDoc);
			var assetSpritesLoggingEnabledCheckbox = $("#AssetSpritesLoggingEnabled", importDoc); // GGA 20-Feb-2020 UI sprites logging
			var forceManifestGenerationCheckbox = $("#ForceManifestGeneration", importDoc);

			testVideosCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			noSoundCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			noMoviesCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			texClientStorageCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			iOSUICheckbox.appendTo($("#tabContentTesting .checkboxList"));
			assetLoggingEnabledCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			assetUsageLoggingEnabledCheckbox.appendTo($("#tabContentTesting .checkboxList"));
			assetSpritesLoggingEnabledCheckbox.appendTo($("#tabContentTesting .checkboxList")); // GGA 20-Feb-2020 UI sprites logging
			forceManifestGenerationCheckbox.appendTo($("#tabContentTesting .checkboxList"));

			// Advanced panel check boxes
			var romeShellCheckbox = $("#RomeShell", importDoc);
			var unlockFactionsCheckbox = $("#UnlockFactions", importDoc);
			var showModConflictAlert = $("#ShowModConflictAlert", importDoc);
			var disableMinimiseCheckbox = $("#DisableMinimiseOnAltTab", importDoc);

			romeShellCheckbox.appendTo($("#tabContentAdvanced #commandLineAndLanguage"));
			unlockFactionsCheckbox.appendTo($("#tabContentAdvanced #commandLineAndLanguage"));
			if ($(".platformWIN").length > 0)
			{
				disableMinimiseCheckbox.appendTo($("#tabContentAdvanced #commandLineAndLanguage"));
			}
			showModConflictAlert.appendTo($("#tabContentAdvanced #commandLineAndLanguage"));
			
			// Moving the Calico sound checkbox to allow neater arrangement
			$("#InGameNotificationOptions").appendTo("#tabContentAdvanced #commandLineAndLanguage");
			
			// Adding additional text for game identification and switching
			var SelectGame = $("#SelectGame", importDoc);
			var mainAppTitle = $("#mainAppTitle", importDoc);

			SelectGame.prependTo($("#playBoxParent"));
			mainAppTitle.insertAfter($("#tabbar"));
		});	//RETURN OF BOILERPLATE
})();


function setSelectedGame(id)
{
	var gameNames = [ "rome", "rome_bi", "rome_alex" ];
	var gameName  = gameNames[id];
	
	// Pass to C++
	setPropertyValue("gameListSelect", "int,string", [id, gameName]);
	
	// Get the right button
	var selector = '#playBox>.playOption[data-game-pos="' + id + '"]';
	
	// Remove the existing highlight
	var allPlayOptions = $("#playBox>.playOption");
	allPlayOptions.removeClass("selectedGame");
	
	// Add the new highlight
	var playOption = $(selector);
	playOption.addClass("selectedGame");

	// Add CSS to set the PGOW background.
	for (var i = 0; i < gameNames.length; ++i)
	{
		var curName = gameNames[i];
		$('body').removeClass("pgow_skin_" + curName);
	}

	$('body').addClass("pgow_skin_" + gameNames[id]);
}

startupPrePropertyLoadTasks.push(initGameSelectionPrePropertyLoad);
startupPostPropertyLoadTasks.push(initGameSelectionPostPropertyLoad);


var gameSpecificImportDoc = getImportedDocForJS();
function initGameSelectionPrePropertyLoad()
{
	var gameOptionsDialog = $("#GameOptionsDialog", gameSpecificImportDoc);
	$("#dialogContainer").append(gameOptionsDialog);
	
	return Promise.resolve();
}


function initGameSelectionPostPropertyLoad()
{
	$("#playBox>.playOption").on('click', function(event)
	{
		$('.gameOptionBox').removeClass('selectedGameOptionBox');
		$(this).addClass('selectedGameOptionBox');

		var idStr = $(this).attr('data-game-pos');
		var id = parseInt(idStr);
		if (isNaN(id))
		{
			console.err("Attempted to set selected game to an invalid value!");
		}
		else
		{
			setSelectedGame(id);
		}
	});

	var thePromise = hookPropertyToFunction("gameListSelect",
						   "int,string",
						   function(propertyName, typePattern, propValueArray)
		{
			var gameName  = propValueArray[1];

			$('body').addClass("pgow_skin_" + gameName);

			//Make the scripting interface return something other than undefined 
			//since some interfaces can't tell the difference between that and an exception 
			return true;
		});

	return thePromise;
}

function enableMultiGameSelection(numGames)
{
	var enabled = true
	return enabled;
}

// Moving things around a little for new layout

$('.docsbutton.faqsbutton').wrap( '<div class="docsbuttonWrapper faqsbuttonWrapper"></div>' );
$('.docsbutton.readmebutton').wrap( '<div class="docsbuttonWrapper readmebuttonWrapper"></div>' );
$('.docsbutton.manualbutton').wrap( '<div class="docsbuttonWrapper manualbuttonWrapper"></div>' );
$('.docsbutton.creditsbutton').wrap( '<div class="docsbuttonWrapper creditsbuttonWrapper"></div>' );
$('.docsbutton.privacybutton').wrap( '<div class="docsbuttonWrapper privacybuttonWrapper"></div>' );
$('#minisitebutton').wrap( '<div class="docsbuttonWrapper minisitebuttonWrapper"></div>' );
$('#registerfornewsbutton' ).wrap( '<div class="docsbuttonWrapper registerbuttonWrapper"></div>' );

$('.privacybuttonWrapper').prependTo('#aboutExtras');
$('.creditsbuttonWrapper').prependTo('#aboutExtras');

$('.tabSelect img').each(function() {
	var path = $(this).attr('src');
	$(this).attr('src', path.replace("images/navicons/", "../../GamePGOW/images/"));
});

$('.deliveryMAS #tabButtonModManager img').each(function() {
	var path = $(this).attr('src');
	$(this).attr('src', path.replace("/mods", "/modsmas"));
});


$('#supportFAQs .faqsbuttonWrapper').insertAfter('p[data-inner-string="localise-Startup.SupportTip"]');

$('#supportContact').insertAfter('p[data-inner-string="localise-Startup.GenerateReportTip"]');


$('#playBoxParent').hover(
	function(){ $('#tabView').addClass('gameSelectOpen') },
	function(){ $('#tabView').removeClass('gameSelectOpen') }
)

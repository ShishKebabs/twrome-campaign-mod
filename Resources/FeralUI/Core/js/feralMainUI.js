"use strict";

//resetPropertyList isn't strictly needed under normal circumstances, but makes "refresh" work. 
//This makes iterating on the web side for dev easier as well as preventing 
//any problems caused by users right-clicking and hitting refresh for some reason


preDocumentStartupPromise = Promise.allFinish(
	[
		resetPropertyList(),
		initialiseBuildState(), //Should be done before anything else (except the reset) so we know whether to make a fuss about errors.
		StartupStart()
	]);

startupPreImportTasks.push(initialiseLoadingScreen);

startupPreImportTasks.push(initialiseLanguageClasses);

startupPreImportTasks.push(initialiseDeliveryClasses);

startupPreImportTasks.push(initialisePlatformClasses);

startupPreImportTasks.push(initialiseUpdateHtmlImport);

//Must be done before property load, since we assume that elements have been replaced in property code.
startupPrePropertyLoadTasks.push(initialiseGenericElementReplacements);

startupPostPropertyLoadTasks.push(passBodySizeToCpp);

startupPostPropertyLoadTasks.push(retreiveFeralUICalendarBackgroundURL);

//Inform C++/loading screen that startup is truely finished
startupCompleteTasks.push(startupFuncComplete);

// playbackRate can be used to speed up animation.
// Note that the timing values are always in terms of 1x playback, 
// so changing playbackRate won't require tweaking the other values.
var startupVideoParams = {  playbackRate: 1.0,
							startTimestamp: 2900,
							outroPlayTime: 500,
							animated : false,
							loopStart : 2000, //      These three vars are just set to example
							loopEnd : 3850,	//        non-absurd values, which shouldn't
							outroTimestamp : 4900, // matter while 'animated' is false anyway.
							fadeAwayASAP : false };

var VideoPlaybackState =
{
	VIDEO_LOOPING: 1,
	VIDEO_PLAY_TO_END: 2,
	VIDEO_ENDED: 3
};

var theVideoState = VideoPlaybackState.VIDEO_LOOPING;

function initialiseBuildState()
{
	var thePromise;
	
	try
	{
		thePromise = Promise.allFinish(
			[
				hookPropertyToFunction("MainIsDebug",
													"bool",
					function(propertyName, typePattern, propValueArray)
					{
						debugMode = propValueArray[0];
					})
				,
				hookPropertyToFunction("MainIsTesterMode",
													"bool",
					function(propertyName, typePattern, propValueArray)
					{
						testerMode = propValueArray[0];
					})
				,
				hookPropertyToFunction("MainIsProfile",
													"bool",
					function(propertyName, typePattern, propValueArray)
					{
						profileMode = propValueArray[0];
					})
				,
				hookPropertyToFunction("MainIsRelease",
													"bool",
					function(propertyName, typePattern, propValueArray)
					{
						releaseMode = propValueArray[0];
					})
				,
				hookPropertyToFunction("MainIsGoldMaster",
													"bool",
					function(propertyName, typePattern, propValueArray)
					{
						goldMasterMode = propValueArray[0];
					})
			]);
		
		thePromise = thePromise.then(
			function()
			{
				logToConsole = testerMode;

				initialiseLogging();
			});

	}
	catch(e)
	{
		if(feral && feral.log)
			feral.log("We can't even tell if we are a debug/GM build, so we can't log to console!");
		else
			console.error("Failed to detect feral JS extension on startup");
		
		thePromise = Promise.reject(e);
	}
	
	return thePromise;
}

// This function performs the switchover of videos to give the illusion of seamless looping.
function videoTimeUpdateEventHandler()
{
	var startupVideoLoopStartTimestampInSeconds = startupVideoParams.loopStart / 1000;
	var startupVideoLoopEndTimestampInSeconds = startupVideoParams.loopEnd / 1000;

	var currentVideo = $(this);
	var otherVideo = ($(this).attr('id') == "startupVideo") ? $("#startupVideoClone") : $("#startupVideo");

	// Give otherVideo some time to load before we switch to it.
	var kPreRollTime = 0.25;
	var sourceTime = startupVideoLoopEndTimestampInSeconds - kPreRollTime;
	var targetTime = startupVideoLoopStartTimestampInSeconds - kPreRollTime;

	// If the FeralUI is still loading, we keep looping.
	if (theVideoState == VideoPlaybackState.VIDEO_LOOPING)
	{
		if (currentVideo[0].currentTime >= sourceTime)
		{
			// The event isn't fired at precise intervals, so adjust for this delay.
			var difference = currentVideo[0].currentTime - sourceTime;

			// Avoid spurious events as currentVideo continues playing for a bit.
			currentVideo[0].removeEventListener('timeupdate', videoTimeUpdateEventHandler);
			otherVideo[0].addEventListener('timeupdate', videoTimeUpdateEventHandler);
			
			// Start playing otherVideo in sync with the current one, exactly (loopEnd - loopStart) seconds behind.
			otherVideo[0].currentTime = (targetTime + difference);
			otherVideo[0].play();

			// Switch the opacity of both videos once we hit the loop start time.
			setTimeout(function()
			{
				currentVideo.css({opacity: 0, transition: 'opacity 0s'});
				otherVideo.css({opacity: 1, transition: 'opacity 0s'});

				// Finally, stop the original video until the new video reaches the loop end time.
				setTimeout(function()
				{
					currentVideo[0].currentTime = 0;
					currentVideo[0].pause();
				}, 100);

			}, kPreRollTime * 1000);
		}
	}
	// If the FeralUI is done loading, we play to the defined end.
	else if (theVideoState == VideoPlaybackState.VIDEO_PLAY_TO_END)
	{
		var targetEndTimeInSeconds = (startupVideoParams.outroTimestamp + startupVideoParams.outroPlayTime) / 1000;
		
		if (startupVideoParams.fadeAwayASAP ||
			currentVideo[0].currentTime >= targetEndTimeInSeconds ||
			currentVideo[0].currentTime == currentVideo[0].duration)
		{
			currentVideo[0].removeEventListener('timeupdate', videoTimeUpdateEventHandler);
			StartupDone();
			theVideoState = VideoPlaybackState.VIDEO_ENDED;
		}
	}
}

function initialiseLoadingScreen()
{
	var promise = Promise.resolve();
	
	var loadingScreentext = $("#loadingText[data-inner-string]");

	if(loadingScreentext.length > 0)
	{
		loadingScreentext = $(loadingScreentext[0]);
		
		promise = hookPropertyToElement(loadingScreentext.data("innerString"),
										"string",
										loadingScreentext[0]);
		
		promise = promise.then(
			function()
			{
				loadingScreentext.removeClass("loadingTextHidden");
			});
	}

	// Override the video timings if they have been specially set for the current game.
	$.ajax({
		url: '../../GamePGOW/startupVideoParams.json',
		async: false,
		dataType: 'json',
		success: function (response)
		{
			$.extend(startupVideoParams, response);
		},
	});

	// Only finish the PGOW splash video ASAP if we've launched the game before
	// *and* the relevant json flag has been set.
	var seenPGOWBefore = false;
	promise = hookPropertyToFunction(	"regFlag-appRegKey-GameOptionsDialogShown",
										"bool",
										function(propertyName, typePattern, propValueArray){
											seenPGOWBefore = propValueArray[0];
										});

	// Add an extra promise.then to make sure the previous has completed.
	promise = promise.then( function(){ 
		startupVideoParams.fadeAwayASAP = startupVideoParams.fadeAwayASAP && seenPGOWBefore; } );

	// Load a game specific intro video if there is one.

	/* Note: As of version 9.1, Safari doesn't have native WebM support, so
	   we're forced to keep the .mp4 around. Feel free to remove the .mp4 version
	   (here and in feralUI.html) if that's no longer the case */
	var startupVideoStartTimestampInSeconds = startupVideoParams.startTimestamp / 1000;

	var initialiseVideoElementWithFilename = function(videoContainerElement, videoFilename)
	{
		var extension = videoFilename.split(".").pop();

		var videoSources = videoContainerElement.children('source');

		var theVideo = videoSources.filter('[type="video/' + extension + '"]');
		theVideo.attr('src', videoFilename + '#t=' + startupVideoStartTimestampInSeconds);

		videoContainerElement[0].load();
		videoContainerElement[0].playbackRate = startupVideoParams.playbackRate;
	}

	var customVideoInitFunc = function()
	{
		var startupVideo = $("#startupVideo");
		initialiseVideoElementWithFilename(startupVideo, this.url);

		if (startupVideoParams.animated === true)
		{
			// Create a clone of the video as a seamless video workaround.
			var startupVideoClone = startupVideo.clone().prop('id', 'startupVideoClone');
			startupVideoClone.appendTo("#loadingOverlay");
			initialiseVideoElementWithFilename(startupVideoClone, this.url);

			startupVideo[0].addEventListener('timeupdate', videoTimeUpdateEventHandler);
			if(startupVideo.length !== 0 && startupVideo[0].play !== undefined)
			{
				startupVideo[0].muted = true;
				startupVideo[0].play();
			}
		}

		theVideoState = VideoPlaybackState.VIDEO_LOOPING;
	}

	promise = promise.then(
		function()
		{
			var startupVideo = $("#startupVideo");
			var videoSources = startupVideo.children('source');
			if (startupVideo.length && startupVideo[0].canPlayType !== undefined)
			{
				if (startupVideo[0].canPlayType('video/webm; codecs="vp8, vorbis"').length)
				{
					$.get('../../GamePGOW/images/feral.webm' , customVideoInitFunc);
				}
				else
				{
					$.get('../../GamePGOW/images/feral.mp4', customVideoInitFunc);
				}
			}
		});
	
	promise = promise.then(
		function()
		{
			// Fade the video in from the black background.
			setTimeout(
				function()
				{
					$("#startupVideo").css({opacity: 1, transition: 'opacity 1s'});
				}, 200);
		});
	
	return promise;
}

function initialiseLanguageClasses()
{
	var respondToGettingLanguage =
		function(propertyName, typePattern, propValueArray)
		{
			var languageString = propValueArray[0];

			// Remove any previous language classes
			$("html").removeClass(
				function (index, css) {
					return (css.match (/lang\S+/g) || []).join(' ');
				}
			);
			
			$("html").addClass("lang" + languageString);
		};
	
	var promise = hookPropertyToFunction(	"MainLanguageClass",
											"string",
											respondToGettingLanguage);
	
	return promise;
}

function initialiseDeliveryClasses()
{
	var respondToGettingDelivery =
		function(propertyName, typePattern, propValueArray)
		{
			var deliveryString = propValueArray[0];

			$("html").addClass("delivery" + deliveryString);
		}

	var promise = hookPropertyToFunction(	"MainDeliveryClass",
											"string",
											respondToGettingDelivery);

	return promise;
}

function initialisePlatformClasses()
{
	var respondToGettingPlatform =
		function(propertyName, typePattern, propValueArray)
		{
			var platformString = propValueArray[0];

			$("html").addClass("platform" + platformString);
		}

	var promise = hookPropertyToFunction(	"MainPlatformClass",
											"string",
											respondToGettingPlatform);

	return promise;
}

function initialiseUpdateHtmlImport()
{
	var respondToGettingUpdateFile =
		function(propertyName, typePattern, propValueArray)
		{
			var urlString = propValueArray[0];
			
			if(urlString !== "")
			{
				var scriptFile = document.createElement('script');
				scriptFile.setAttribute("type","text/javascript");
				scriptFile.setAttribute("src", urlString);
				
				document.body.appendChild(scriptFile);
			}
		};
	
	var promise = hookPropertyToFunction(	"MainUpdateFileURL",
											"string",
											respondToGettingUpdateFile);
	
	return promise;
}

//Replaces generic form-style elements with jqueryUI custom elements
function initialiseGenericElementReplacements()
{
	return initialiseGenericElementReplacementsWithinElement(document);
}

//Replaces generic form-style elements with jqueryUI custom elements
function initialiseGenericElementReplacementsWithinElement(element)
{
	$( ".buttonset", element ).buttonset({ items: "input[type=button]:not(.noDisplay)" });
	$( "input[type=button]", element ).button();
	
	$( "label>input[type=checkbox]", element ).parent().addClass("checkbox");
	
	//Not all selects want to be selectricated, e.g. the version string list
	$( ".selectBox", element ).selectric();
	
	return Promise.resolve();
}

//Let the c++ know how big the webpage is, so it can size the window appropriately.
function passBodySizeToCpp()
{
	var docHeight = document.body.offsetHeight;
	var docWidth  = document.body.offsetWidth;
	
	var promise = registerWriteOnlyProperty("MainBodyResolution",
											"int,int");
	
	
	promise = promise.then(
		function(response)
		{
			return setWriteOnlyPropertyValue(	"MainBodyResolution",
												"int,int",
												[docWidth, docHeight]);
		});
	
	return promise;
}

function retreiveFeralUICalendarBackgroundURL()
{
	return hookPropertyToFunction(	"regString-appRegKey-FeralUICalendarBackgroundURL",
									"string",
									forwardRequestedFeralUICalendarBackground);
}

function forwardRequestedFeralUICalendarBackground(propertyName, typePattern, propValueArray)
{
	var thePromise = Promise.resolve();
	
	if (propValueArray.length > 0 && propValueArray[0].length > 0)
	{
		var outputPropertyName = "FeralUIFullCalendarBackgroundURL-" + propValueArray[0];

		thePromise = hookPropertyToFunction(outputPropertyName,
											"string",
											applyFeralUICalendarBackground);
	}
	
	return thePromise;
}

function applyFeralUICalendarBackground(propertyName, typePattern, propValueArray)
{
	if (propValueArray.length > 0 && propValueArray[0].length > 0)
	{
		var imagePath = propValueArray[0];
		$( "#tabView" ).prepend('<img src="' + imagePath + '"/>');
	}
}

function StartupStart()
{
	var promise = registerWriteOnlyProperty("mainStartupStart", "");
	
	promise = promise.then(
		function(response)
		{
			return setWriteOnlyPropertyValue("mainStartupStart", "", []);
		});
	
	return promise;
}


function startupFuncComplete()
{
	// Give focus to window so keyboard events are recognised without needing to click the screen
	$(window).focus();

	var promise = registerWriteOnlyProperty("MainPropLoadComplete", "");
	
	promise = promise.then(
		function(response)
		{
			return setWriteOnlyPropertyValue("MainPropLoadComplete", "", []);
		}).then(
		function(response)
		{
			var finishedTimeout = -1;

			theVideoState = VideoPlaybackState.VIDEO_PLAY_TO_END;

			var startupVideo = $("#startupVideo");
			if(startupVideo.length === 0 || startupVideo[0].play === undefined)
			{
				// This isn't the PGOW, but we still want the startup done event to be triggered
				finishedTimeout = 0;
			}
			else if (startupVideoParams.animated === false)
			{
				startupVideo[0].play();

				//Now at 1 second since transitions during startup can last up to that long, 
				//and there have been a number of glitches caused by startup that might be fixed by such a delay
				//1 second was overkill. Knock it down to half a second.
				finishedTimeout = Math.max(startupVideoParams.outroPlayTime, 500);
			}

			if (finishedTimeout >= 0)
			{
				//We aren't done until any knock-on events are fired, so only consider us done when this event can fire
				//As a bonus, this makes the loading div fade away more smoothly
				window.setTimeout(StartupDone, finishedTimeout);
			}
		});
	
	return promise;
}

function StartupDone()
{
	var promise = registerWriteOnlyProperty("mainStartupDone", "");

	if (startupVideoParams.animated === true)
	{
		var startupVideo = $("#startupVideo");
		var startupVideoClone = $("#startupVideoClone");
		if(startupVideo.length !== 0 && startupVideo[0].pause !== undefined)
		{
			startupVideo[0].removeEventListener('timeupdate', videoTimeUpdateEventHandler);
			if( !startupVideoParams.fadeAwayASAP )
			{
				startupVideo[0].pause();
			}
		}
		if(startupVideoClone.length !== 0 && startupVideoClone[0].pause !== undefined)
		{
			startupVideoClone[0].removeEventListener('timeupdate', videoTimeUpdateEventHandler);
			if( !startupVideoParams.fadeAwayASAP )
			{
				startupVideoClone[0].pause();
			}
		}
	}
	
	promise = promise.then(
		function(response)
		{
			return setWriteOnlyPropertyValue("mainStartupDone", "", []);
		}).then(
		function(response)
		{
			$("#loadingOverlay").addClass("loadingFinished");
			
			var postStartEventsDone = Date.now();
			
			console.log("Time of post-startup events/timeouts:", postStartEventsDone - startupFinishedTime);

			console.log("Total time from main script load:", postStartEventsDone - mainScriptStartTime);
			
			$("html").css( "min-width", "0px" );
			$("html").css( "min-height", "0px" );
			
			startupDone = true;
		});
	return promise;
}


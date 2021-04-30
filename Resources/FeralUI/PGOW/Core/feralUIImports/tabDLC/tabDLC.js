"use strict";

var tabDLCImportDoc;

//The polyfill uses _currentScript.
if(document._currentScript !== undefined)
	tabDLCImportDoc = document._currentScript.ownerDocument;
else
	tabDLCImportDoc = document.currentScript.ownerDocument;


function initialiseDlcPanel()
{
	// Don't hook DLCCount if we want to prohibit the basic DLC panel.
	// The handler may send a count > 0 so make sure the advanced DLC panel gets it.
	return hookPropertyToFunction(	"ProhibitDLC",
									"bool",
			function (propertyName, typePattern, propValueArray)
			{
				var prohibit = propValueArray[0];

				if (prohibit === false)
				{
					var allOfThePromises = [];

					allOfThePromises.push(
						InitProductKeyInput($("#DLCKeyEntryDialog .productKeyEntry"),
											"DLC",
											$("#DLCKeyEntryDialog #ProductKeySaveActivate")
						)
						,
						hookPropertyToFunction(	"DLCCount",
									"int",
									setDLCTabCount)
					);

					return Promise.allFinish(allOfThePromises);
				}
				else
				{
					return Promise.resolve();
				}
			});
}

//Add dlc tab features+scroll initialisation to the startup
startupPostPropertyLoadTasks.push(initialiseDlcPanel);


function setDLCTabCount(propertyName, typePattern, propValueArray)
{
	var dlcCount = propValueArray[0];
	
	var currentCount = $("#tabContentDLC .item>.dlcpanel").length;
	
	for(var i = currentCount ; i < dlcCount ; i++)
	{
		insertDLCTab(i);
	}

	hookPropertyToFunction( "ActivationRespDialogVisible", "bool", dummyRecvFunction);

	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function dummyRecvFunction(propertyName, typePattern, propValueArray)
{
	//Make the scripting interface return something other than undefined 
	//since some interfaces can't tell the difference between that and an exception 
	return true;
}

function insertDLCTab(elementNum)
{
	var templateIdStr = "#dlc-";
	templateIdStr += "DLC_POSITION_NUMBER";

	var dlcElementTemplate = $(templateIdStr, tabDLCImportDoc);
	
	var dlcElementStr = dlcElementTemplate[0].outerHTML.replace(/DLC_POSITION_NUMBER/g, elementNum);
	
	var dlcElement = $(dlcElementStr);
	
	$("#tabContentDLC .item").append(dlcElement);
	
	//If user clicks more info, and after any transition events caused by a click, the size of the region may change, so kick off a scroll event
	$( ".dlcDescriptionLong>.dlcMoreInfo", dlcElement).click(showFeaturesOnClick);

	$( ".dlcDescriptionLong>.dlcfeatures", dlcElement ).on( transitionEndEvent,
															scrollContainerTransitionEndHandler );
	
	var allOfThePromises = [];
	
	allOfThePromises.push(
                          initialiseGenericElementReplacementsWithinElement(dlcElement),
                          initialisePropertiesWithinElement(dlcElement),
                          initialiseInputElementHandlersWithinElement(dlcElement));
	
	//We don't need to register any of the following, but it avoids warnings if C++ attempts to push them to us
	
	
	var keyType = function(key, type) { return { key: key, type: type}; }
	
	// DLCInstance stripped from the front for readability
	var arrAllDLCKeyTypes = 
		[
			keyType("IsPurchaseable"            , "bool"  ),
			keyType("IsFreeDLC"                 , "bool"  ),
			keyType("IsActivated"               , "bool"  ),
			keyType("IsInstalled"               , "bool"  ),
			keyType("LongDescriptionVisible"    , "bool"  ),
			keyType("IconUrl"                   , "string"),
			keyType("FinalPrice"                , "string"),
			keyType("FinalPriceVisible"         , "bool"  ),
			keyType("BuyInStore"                , ""      ),
			keyType("BuyInStoreText"            , "string"),
			keyType("BuyInStoreVisible"         , "bool"  ),
			keyType("ActivationMessage"         , "string"),
			keyType("InstallerVisible"          , "bool"  ),
			keyType("InstallerProgress"         , "string"),
			keyType("InstallerProgressStr"      , "string"),
			keyType("InstallerStatus"           , "string"),
			keyType("InstallerDlOrPauseStr"     , "string"),
			keyType("InstallerDlOrPause"        , ""      ),
			keyType("InstallerDlOrPauseEnabled" , "bool"  ),
			keyType("InstallerDlOrPauseVisible" , "bool"  ),
			keyType("InstallerStop"             , ""      ),
			keyType("InstallerStopEnabled"      , "bool"  ),
			keyType("InstallerStopVisible"      , "bool"  ),
			keyType("HasSubProducts"            , "bool"  ),
			keyType("InfoKeyProductIdentifier"  , "string"),
			keyType("InfoKeyIcon"               , "string"),
			keyType("InfoKeyDataPack"           , "string"),
			keyType("InfoKeyFeralStoreDLCCode"  , "string"),
			keyType("InfoKeyRequiredGameVersion", "string"),
			keyType("InfoKeyName"               , "string"),
			keyType("InfoKeyName2"              , "string"),
			keyType("InfoKeyDescription"        , "string"),
			keyType("InfoKeyDescriptionLong"    , "string"),
			keyType("InfoKeyPrice"              , "string"),
			keyType("InfoKeyPriceSpecialOffer"  , "string"),
			keyType("InfoKeyRequiredProducts"   , "string"),
			keyType("InfoKeySteamIDs"           , "string"),
			keyType("InfoKeySubProducts"        , "string"),
			keyType("InfoKeyParentBundles"      , "string"),
			keyType("InfoKeyCategories"         , "string")
		];
	
	for( var keyType of arrAllDLCKeyTypes)
	{
		if(keyType.type !== "")
		{
			allOfThePromises.push(	hookPropertyToFunction(	"DLCInstance" + keyType.key + "-" + elementNum,
									keyType.type,
									dummyRecvFunction));
		}
	}
	allOfThePromises.push(
		hookPropertyToFunction(	"DLCInstanceInfoKeyFeralStoreDLCCode-" + elementNum,
								"string",
								function(propertyName, typePattern, propValueArray)
								{
									var allOfThePromisesNamed = [];
									var dlcCode = propValueArray[0];
									
									for( var keyType of arrAllDLCKeyTypes)
									{
										if(keyType.type !== "")
										{
											allOfThePromisesNamed.push(	hookPropertyToFunction(	"DLCInstance" + keyType.key + "-" + dlcCode,
																		keyType.type,
																		dummyRecvFunction));
										}
									}
									
									return true;
								}));
}

function showFeaturesOnClick()
{
	var featuresContainer = $( this ).parent().children(".dlcfeatures");
	var featuresAndButtonContainer = $( this ).parent();
	var featuresContents = $(featuresContainer.children("div")[0]);
	
	featuresContainer.contentHeight = featuresContainer.outerHeight();

	if(featuresAndButtonContainer.hasClass('show'))
	{
		this.dataset.innerString = "localise-Startup.MoreInfoNoEllipse";
		
		//Possibly re-registering, but no harm done.
		hookPropertyToElement(	this.dataset.innerString,
								"string,bool",
								this);
		
		//Only kill the transitions when we are leaving "fullyShown" state, otherwise there might be transitions ongoing, 
		//and the browser can take them into account and make the change in transition smoother if we don't kill them.
		//We have to kill them from fullyShown, since the max-height is getting shrunk down from 9999px and we don't want that to animate
		if(featuresContainer.hasClass("fullyShown"))
		{
			// disable transitions & set max-height to featuresContainer height
			featuresContainer.addClass('noTransition').css('max-height', featuresContainer.contentHeight);
			
			setTimeout(
				function()
				{
					// enable & start transition
					featuresContainer.removeClass('noTransition').css(
						{
							'max-height': 0
						});
					
					featuresAndButtonContainer.toggleClass( "show" );
					
					featuresContainer.removeClass("fullyShown");
					
				}, 20); // 10ms timeout is the secret ingredient for disabling/enabling transitions
						// chrome only needs 1ms but FF needs ~10ms or it chokes on the first animation for some reason
						// FB - I found 20 to work more reliably.
		}
		else
		{
			featuresAndButtonContainer.toggleClass( "show" )
			featuresContainer.css(
			{
				'max-height': 0
			});
		}

	}
	else
	{  

		featuresContainer.contentHeight += featuresContents.outerHeight(); // if closed, add inner height to featuresContainer height
		featuresContainer.css(
			{
				'max-height': featuresContainer.contentHeight
			});
		featuresAndButtonContainer.toggleClass( "show" );
		
		this.dataset.innerString = "localise-Startup.HideInfo";
		
		//Possibly re-registering, but no harm done.
		hookPropertyToElement(	this.dataset.innerString,
								"string,bool",
								this);
	}
	
	
	var nearestScrollContainer = $(featuresContainer.parents(".scrollContainer")[0]);
	
	if(nearestScrollContainer !== undefined)
		nearestScrollContainer.removeClass("bottom");
}

function scrollContainerTransitionEndHandler()
{
	if($( this ).parent().hasClass('show'))
	{
		$( this ).addClass("fullyShown");
		$( this ).css('max-height', 9999);
	}
	
	//Select the closes scroll parent and trigger a scroll, since this will have changed the size of the scroll region.
	var nearestScroll = $($( this ).parents(".scrollContainer>*")[0]);
	
	if(nearestScroll !== undefined)
		nearestScroll.trigger("scroll");
}


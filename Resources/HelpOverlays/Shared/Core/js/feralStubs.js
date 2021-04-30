"use strict";

var feral;

// To ease testing outside of our environment, 
// lets make sure that JS will not just give up whenever it sees a feral.* function
if( typeof feral                                          === 'undefined' &&  /*Old Webkit/WebView api (and possibly similar future apis?)*/
    typeof window.cefQuery                                === 'undefined' &&  /*CEF (Chromium Embedded Framework) api*/
   (typeof window.webkit                                  === 'undefined' ||  /*v*/
    typeof window.webkit.messageHandlers                  === 'undefined' ||  /*New Webkit/WKWebView api*/
    typeof window.webkit.messageHandlers.getPropertyValue === 'undefined'   ))/*^*/
{
	feral = {};

	console.error("Could not find feral variable or cefQuery! Using debug stubs!");

	feral.log       = 
		function(	strToLog)
		{
			console.log("feral.log : \"" + strToLog + "\"");
		};

	feral.registerProperty  = 
		function(	propertyName,
					typePattern,
					recvFunction)
		{
		};

	feral.getPropertyValue  = 
		function(	propertyName,
					propertyType)
		{
			//Generic empty return.
			return [propertyName, propertyType, JSON.stringify([])];
		};

	feral.setPropertyValue  = 
		function(	)
		{
		};

	feral.resetPropertyList = 
		function(	)
		{
		};
}


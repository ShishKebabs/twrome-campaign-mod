"use strict"

function cloneArray(inArray)
{
	return JSON.parse(JSON.stringify(inArray));
}

var mouseMap = {};
mouseMap["1"] = "1-left";
mouseMap["2"] = "2-right";

// Mappings that should be used by all locales, although they can specifically override these mappings.
var keyMap_GENERAL = {};

// Layout independent keys
keyMap_GENERAL["code-0"] = "f1";
keyMap_GENERAL["code-1"] = "f2";
keyMap_GENERAL["code-2"] = "f3";
keyMap_GENERAL["code-3"] = "f4";
keyMap_GENERAL["code-4"] = "f5";
keyMap_GENERAL["code-5"] = "f6";
keyMap_GENERAL["code-6"] = "f7";
keyMap_GENERAL["code-7"] = "f8";
keyMap_GENERAL["code-8"] = "f9";
keyMap_GENERAL["code-9"] = "f10";
keyMap_GENERAL["code-10"] = "f11";
keyMap_GENERAL["code-11"] = "f12";
keyMap_GENERAL["code-12"] = "f13";
keyMap_GENERAL["code-13"] = "f14";
keyMap_GENERAL["code-14"] = "f15";
keyMap_GENERAL["code-15"] = "f16";
keyMap_GENERAL["code-16"] = "f17";
keyMap_GENERAL["code-17"] = "f18";
keyMap_GENERAL["code-18"] = "f19";
keyMap_GENERAL["code-19"] = "f20";

keyMap_GENERAL["code-20"] = "cursor-down";
keyMap_GENERAL["code-21"] = "cursor-left";
keyMap_GENERAL["code-22"] = "cursor-right";
keyMap_GENERAL["code-23"] = "cursor-up";

keyMap_GENERAL["code-24"] = "bksp-en";
keyMap_GENERAL["code-25"] = "caps";

keyMap_GENERAL["code-26"] = "lcmd";
keyMap_GENERAL["code-27"] = "rcmd";
keyMap_GENERAL["code-28"] = "lctrl";
keyMap_GENERAL["code-29"] = "rctrl";

keyMap_GENERAL["code-30"] = "delete-{cc}";
keyMap_GENERAL["code-31"] = "end";
keyMap_GENERAL["code-32"] = "num-enter";
keyMap_GENERAL["code-33"] = "esc";
keyMap_GENERAL["code-34"] = "fn";
keyMap_GENERAL["code-36"] = "home";
keyMap_GENERAL["code-37"] = "lalt";
keyMap_GENERAL["code-38"] = "ralt";
keyMap_GENERAL["code-39"] = "pgdown";
keyMap_GENERAL["code-40"] = "pgup";

keyMap_GENERAL["code-42"] = "return";
keyMap_GENERAL["code-43"] = "lshift";
keyMap_GENERAL["code-44"] = "rshift";
keyMap_GENERAL["code-45"] = "space-{cc}";
keyMap_GENERAL["code-46"] = "tab";

keyMap_GENERAL["code-89"] = "num-0";
keyMap_GENERAL["code-90"] = "num-1";
keyMap_GENERAL["code-91"] = "num-2";
keyMap_GENERAL["code-92"] = "num-3";
keyMap_GENERAL["code-93"] = "num-4";
keyMap_GENERAL["code-94"] = "num-5";
keyMap_GENERAL["code-95"] = "num-6";
keyMap_GENERAL["code-96"] = "num-7";
keyMap_GENERAL["code-97"] = "num-8";
keyMap_GENERAL["code-98"] = "num-9";
keyMap_GENERAL["code-99"] = "num-clear";
keyMap_GENERAL["code-100"] = "num-point";
keyMap_GENERAL["code-101"] = "num-divide";
keyMap_GENERAL["code-102"] = "num-enter";
keyMap_GENERAL["code-103"] = "num-equals";
keyMap_GENERAL["code-104"] = "num-minus";
keyMap_GENERAL["code-105"] = "num-multiply";
keyMap_GENERAL["code-106"] = "num-plus";

// Modifier keys
keyMap_GENERAL["command"] = "lcmd";
keyMap_GENERAL["control"] = "lctrl";
keyMap_GENERAL["shift"] = "lshift";
keyMap_GENERAL["option"] = "lalt";
keyMap_GENERAL["capslock"] = "caps";

// Unsupported key codes
//keyMap_GENERAL["code-35"] = "help"; // Help
//keyMap_GENERAL["code-42"] = "print screen"; // Print screen
//keyMap_GENERAL["code-48"] = "f11"; // Volume down
//keyMap_GENERAL["code-49"] = "f10"; // Volume mute
//keyMap_GENERAL["code-50"] = "f12"; // Volume up
//keyMap_GENERAL["code-51"] = "pause"; // Pause
//keyMap_GENERAL["code-52"] = "scroll lock"; // Scroll lock
//keyMap_GENERAL["code-53"] = "application"; // Application


// Universal symbols
keyMap_GENERAL["å"] = "aring";
keyMap_GENERAL["]"] = "rbracket";
keyMap_GENERAL["ü"] = "umlaut";
keyMap_GENERAL["æ"] = "ae";
keyMap_GENERAL["ø"] = "oslash";
keyMap_GENERAL["-"] = "hyphen";
keyMap_GENERAL["/"] = "forwardslash";
keyMap_GENERAL["\\"] = "backslash-eu";
keyMap_GENERAL["ż"] = "zdot-pl";
keyMap_GENERAL["§"] = "section-symbol";

// Numbers
keyMap_GENERAL["0"] = "0-{cc}";
keyMap_GENERAL["1"] = "1-{cc}";
keyMap_GENERAL["2"] = "2-{cc}";
keyMap_GENERAL["3"] = "3-{cc}";
keyMap_GENERAL["4"] = "4-{cc}";
keyMap_GENERAL["5"] = "5-{cc}";
keyMap_GENERAL["6"] = "6-{cc}";
keyMap_GENERAL["7"] = "7-{cc}";
keyMap_GENERAL["8"] = "8-{cc}";
keyMap_GENERAL["9"] = "9-{cc}";


// Keys common to several European layouts, not actually a locale code.
var keyMap_EU = {};

keyMap_EU["e"] = "e-eu";
keyMap_EU["."] = "stop-eu";
keyMap_EU[","] = "comma-eu";
keyMap_EU["'"] = "apostrophe-eu";
keyMap_EU["grave"] = "brackets-eu";
keyMap_EU["code-100"] = "num-point-eu";

var keyMap_EN = {};

keyMap_EN["1"] = "1-eu";
keyMap_EN["4"] = "4-eu";
keyMap_EN["'"] = "apostrophe-en";
keyMap_EN[";"] = "semicolon-en";
keyMap_EN[","] = "comma-en";
keyMap_EN["E"] = "e-en";
keyMap_EN["="] = "equals-en";
keyMap_EN["["] = "lbracket-en";
keyMap_EN["."] = "stop-en";
keyMap_EN["`"] = "tilde-en";
keyMap_EN["grave"] = "tilde-en";
keyMap_EN["code-30"] = "delete";


var keyMap_US = cloneArray(keyMap_EN);

keyMap_US["code-45"] = "space-en";
keyMap_US["0"] = "0-en";
keyMap_US["1"] = "1-eu";
keyMap_US["2"] = "2-en";
keyMap_US["3"] = "3-en";
keyMap_US["4"] = "4-eu";
keyMap_US["5"] = "5-en";
keyMap_US["6"] = "6-en";
keyMap_US["7"] = "7-en";
keyMap_US["8"] = "8-en";
keyMap_US["9"] = "9-en";


var keyMap_ES = cloneArray(keyMap_EU);

keyMap_ES["4"] = "4-eu";
keyMap_ES["5"] = "5-eu";
keyMap_ES["7"] = "7-eu";
keyMap_ES["8"] = "8-eu";
keyMap_ES["9"] = "9-eu";
keyMap_ES["0"] = "0-eu";
keyMap_ES["¡"] = "i-es";
keyMap_ES["+"] = "plus-es";
keyMap_ES["`"] = "accent-es";
keyMap_ES["´"] = "accent2-es";
keyMap_ES["ñ"] = "ntilde-es";
keyMap_ES["º"] = "backslash-es";
keyMap_ES["="] = "stop-eu"; // Not sure why we're getting '=' for this key.
keyMap_ES["ç"] = "cedilla-es";
keyMap_ES["code-30"] = "delete"; // Spanish uses English localisation for "delete"

var keyMap_FR = cloneArray(keyMap_EU);

keyMap_FR["ù"] = "uaccent-fr";
keyMap_FR["e"] = "e-en";
keyMap_FR["^"] = "caret-fr";
keyMap_FR["$"] = "dollar-fr";
keyMap_FR["à"] = "0-fr";
keyMap_FR["&"] = "1-fr";
keyMap_FR["é"] = "2-fr";
keyMap_FR["\""] = "3-fr";
keyMap_FR["'"] = "4-fr";
keyMap_FR["("] = "5-fr";
keyMap_FR["§"] = "6-fr";
keyMap_FR["è"] = "7-fr";
keyMap_FR["!"] = "8-fr";
keyMap_FR["ç"] = "9-fr";
keyMap_FR[")"] = "rbracket-fr";
keyMap_FR[":"] = "colon-fr";
keyMap_FR[";"] = "semicolon-fr";
keyMap_FR[","] = "comma-fr";
keyMap_FR["`"] = "accent-fr";
keyMap_FR["="] = "equals-en"; // Uses the same key image for EN '=', but at a different location.

var keyMap_DE = cloneArray(keyMap_EU);

keyMap_DE["0"] = "0-eu";
keyMap_DE["9"] = "9-eu";
keyMap_DE["+"] = "plus-de";
keyMap_DE["ö"] = "oumlaut-de";
keyMap_DE["ä"] = "aumlaut-de";
keyMap_DE["ß"] = "eszett-de";
keyMap_DE["´"] = "accent-de";
keyMap_DE["#"] = "hash-de";
keyMap_DE["l"] = "l-de";

var keyMap_IT = cloneArray(keyMap_EU);

keyMap_IT["0"] = "0-eu";
keyMap_IT["1"] = "1-eu";
keyMap_IT["2"] = "2-eu";
keyMap_IT["4"] = "4-eu";
keyMap_IT["5"] = "5-eu";
keyMap_IT["6"] = "6-eu";
keyMap_IT["7"] = "7-eu";
keyMap_IT["8"] = "8-eu";
keyMap_IT["9"] = "9-eu";
keyMap_IT["à"] = "aaccent-it";
keyMap_IT["è"] = "eaccent-it";
keyMap_IT["ò"] = "oaccent-it";
keyMap_IT["+"] = "plus-it";
keyMap_IT["ì"] = "iaccent-it";
keyMap_IT["ù"] = "uaccent-it";

var keyMap_PL = cloneArray(keyMap_EU);

keyMap_PL["ł"] = "lstroke-pl";
keyMap_PL["^"] = "caret-pl";
keyMap_PL["ó"] = "oaccent-pl";
keyMap_PL["("] = "curvedbrackets-pl";
keyMap_PL["ą"] = "atail-pl";
keyMap_PL[";"] = "semicolon-pl";
keyMap_PL["."] = "stop-pl";
keyMap_PL[","] = "comma-pl";
keyMap_PL["-"] = "hyphen-pl";
keyMap_PL["code-30"] = "delete";
keyMap_PL["["] = "sqbrackets-pl";

var keyMap_RU = {};

keyMap_RU[">"] = "section-symbol-ru";
keyMap_RU["-"] = "hyphen-ru";
keyMap_RU["="] = "equals-ru";
keyMap_RU["й"] = "q-ru";
keyMap_RU["ц"] = "w-ru";
keyMap_RU["у"] = "e-ru";
keyMap_RU["к"] = "r-ru";
keyMap_RU["е"] = "t-ru";
keyMap_RU["н"] = "y-ru";
keyMap_RU["г"] = "u-ru";
keyMap_RU["ш"] = "i-ru";
keyMap_RU["щ"] = "o-ru";
keyMap_RU["з"] = "p-ru";
keyMap_RU["х"] = "lbracket-ru";
keyMap_RU["ъ"] = "rbracket-ru";
keyMap_RU["ф"] = "a-ru";
keyMap_RU["ы"] = "s-ru";
keyMap_RU["в"] = "d-ru";
keyMap_RU["а"] = "f-ru";
keyMap_RU["п"] = "g-ru";
keyMap_RU["р"] = "h-ru";
keyMap_RU["о"] = "j-ru";
keyMap_RU["л"] = "k-ru";
keyMap_RU["д"] = "l-ru";
keyMap_RU["ж"] = "semicolon-ru";
keyMap_RU["э"] = "apostrophe-ru";
keyMap_RU["ё"] = "backslash-ru";
keyMap_RU["]"] = "tilde-ru";
keyMap_RU["я"] = "z-ru";
keyMap_RU["ч"] = "x-ru";
keyMap_RU["с"] = "c-ru";
keyMap_RU["м"] = "v-ru";
keyMap_RU["и"] = "b-ru";
keyMap_RU["т"] = "n-ru";
keyMap_RU["ь"] = "m-ru";
keyMap_RU["б"] = "comma-ru";
keyMap_RU["ю"] = "stop-ru";
keyMap_RU["/"] = "forwardslash-ru";
keyMap_RU["code-100"] = "num-point-ru";
keyMap_RU["code-30"] = "delete";

var keyMap_DA = cloneArray(keyMap_EU);

keyMap_DA["0"] = "0-eu";
keyMap_DA["1"] = "1-eu";
keyMap_DA["2"] = "2-eu";
keyMap_DA["3"] = "3-en";
keyMap_DA["5"] = "5-eu";
keyMap_DA["6"] = "6-eu";
keyMap_DA["7"] = "7-eu";
keyMap_DA["8"] = "8-eu";
keyMap_DA["9"] = "9-eu";
keyMap_DA["e"] = "e-en";
keyMap_DA["$"] = "dollar-da";
keyMap_DA["+"] = "plus-da";
keyMap_DA["´"] = "accent-da";
keyMap_DA["¨"] = "umlaut-da";
keyMap_DA["'"] = "apostrophe-da";

var keyMap_PT = cloneArray(keyMap_EU);

keyMap_PT["0"] = "0-en";
keyMap_PT["1"] = "1-eu";
keyMap_PT["2"] = "2-en";
keyMap_PT["3"] = "3-en";
keyMap_PT["4"] = "4-eu";
keyMap_PT["5"] = "5-eu";
keyMap_PT["6"] = "6-en";
keyMap_PT["7"] = "7-en";
keyMap_PT["8"] = "8-en";
keyMap_PT["9"] = "9-en";
keyMap_PT["]"] = "rbracket-en";
keyMap_PT["'"] = "apostrophe-en";
keyMap_PT[";"] = "semicolon-en";
keyMap_PT["="] = "equals-en";
keyMap_PT["`"] = "tilde-en";
keyMap_PT["code-30"] = "delete";

var keyMap_NL = cloneArray(keyMap_EN);

keyMap_NL["0"] = "0-eu";
keyMap_NL["1"] = "1-eu";
keyMap_NL["2"] = "2-nl";
keyMap_NL["3"] = "2-en";
keyMap_NL["4"] = "4-eu";
keyMap_NL["5"] = "5-eu";
keyMap_NL["6"] = "6-eu";
keyMap_NL["7"] = "7-eu";
keyMap_NL["8"] = "8-eu";
keyMap_NL["9"] = "9-eu";

var keyMap = {};
keyMap["general"] = keyMap_GENERAL;
keyMap["en"] = keyMap_EN;
keyMap["us"] = keyMap_US;
keyMap["es"] = keyMap_ES;
keyMap["fr"] = keyMap_FR;
keyMap["de"] = keyMap_DE;
keyMap["it"] = keyMap_IT;
keyMap["pl"] = keyMap_PL;
keyMap["ru"] = keyMap_RU;
keyMap["da"] = keyMap_DA;
keyMap["pt"] = keyMap_PT;

function getLocaleSpecificElementFilename(languageCode, isKey, isGamePad, isMouse, elementName)
{
	var prefix = "";
	if (isKey === true)
	{
		prefix = "key-";
	}
	else if (isGamePad === true)
	{
		prefix = "pad-";
	}
	else if (isMouse === true)
	{
		prefix = "mouse-button-"
	}

	// Some mappings are simply the elementName, so we fall back to it when it's not specified above.
	var filename = elementName;
	if (isMouse === true)
	{
		if (mouseMap[elementName] !== undefined)
		{
			filename = mouseMap[elementName];
		}
		else if (elementName.startsWith("scroll"))
		{
			prefix = "mouse-wheel-";
		}
	}
	else if (isGamePad)
	{
		// Not required yet.
	}
	else if (isKey)
	{
		if (keyMap[languageCode] === undefined)
		{
			// This language is undefined. Use another map so we don't get [?]s showing
			languageCode = 'en';
		}
		
		if (keyMap[languageCode] !== undefined && keyMap[languageCode][elementName] !== undefined)
		{
			filename = keyMap[languageCode][elementName];
		}
		else if (keyMap["general"] !== undefined && keyMap["general"][elementName] !== undefined)
		{
			filename = keyMap["general"][elementName].replace('{cc}', languageCode);
		}
	}

	return prefix + filename + ".svg";
}

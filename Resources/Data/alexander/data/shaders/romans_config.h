 //
// romans_config.h
// ---------------


#ifndef SECURE_DISABLE
#ifdef DISABLE_SAFEDISC
#define SECURE_DISABLE			0xffffffff
#else
#define SECURE_DISABLE			0x00000000
#endif
#endif


// Libs defines
// TLJF 7-Mar-2018 #include "libs_config.h"

// Rome-specific libs defines should be included in libs_user_config.h for the libs build used - 
// which for the scripted build is kept in Sourcesafe under $/romans/code/config/libs.


// This file contains the defines for features that have been
// enabled for use by the rest of the team and for testing
// by QA. Once the feature has passed QA it, the define should
// be removed from this file and stripped from the rest of
// the project.
//
// The format of the #define declarations should be as follows:
//
// //
// // <programmer's name> : <date>
// // <text description>
// //
// #define __FEATURE_NAME
// 

//////////////////////////////////////////////////////////////////////////////
//																			//
// TO BE REMOVED															//
// -------------															//
//																			//
// ifdef's listed in this section have been enabled for more than 2 weeks	//
// and are not know to cause adverse side effects. They should be removed	//
// by the programmer(s) who created them.									//
//																			//
//////////////////////////////////////////////////////////////////////////////

//
// Chris: 22-Sep-03
// Task stack and action info display for debugging in profile and release
//
#if !defined FINAL_RELEASE
#define __DEBUG_TASK_STACK		// unit task stack info 
#define __DEBUG_UNIT_INFO		// unit debug info
#define __DEBUG_SOLDIER_INFO	// soldier and soldier action debug info
#define __DEBUG_BREAK_CHECK		// unit and soldier update and advance breakpoints
#endif//FINAL_RELEASE

//////////////////////////////////////////////////////////////////////////////
//																			//
// TEMPORARY / WORK IN PROGRESS												//
// ----------------------------												//
//																			//
// These ifdefs have been enabled temporarily for the whole project and		//
// should be disabled/removed when no longer needed							//
//																			//
//////////////////////////////////////////////////////////////////////////////

// Alan: 14/01/03
// New UI, ready for US demo build
#define NEW_UI


//
// Chris: 30/06/03
// Temporary scaling of the hand bone to create large pikes
// collision detection and combat modified for phalanx formation
//
#define __LONG_PIKE_PHALANX

//
// Ken: 7/7/03
// Force every river battle to have a bridge, based on the command line
// option,
//
// -bridge_type:c		where c is 'A' or 'B'
//
// This also adds a road which is perpendicular to the river so that
// the rest of the game does not complain. The road is added of the same
// type as the river.
//
//#define __HACK_FORCE_BRIDGES_ON_RIVERS

//
// Tom 15/7/03
// Stuff that is only in the game for the TV show
//
#define __MADE_FOR_TV

// Alan  20/7/03
// Cheating allowed.  Solely a TV thing at present, but could be a generally useful thing to have for debugging - forcing units
// to behave in a way you want that is replayable.
#ifdef __MADE_FOR_TV
#define ROME_CHEATING_PERMITTED
#endif

// Tom 28/8/03
// Enable function logging in the editors (currently only some functions in battle editor)
// This will write out a log (called editor_log.txt) of all the functions that have been performed in the editor into the directory
// the battle/campaign is saved into
#define EDITOR_LOGGING

//
// Artem: 22/01/04
// sound performance testing code
//
#define __SND_ROME_TMP_PROFILE_REPLAY

//
// Charlie: 12/05/04
// Network friendly game tweaks
//
#define __ROME_GAME_TWEAKS

//////////////////////////////////////////////////////////////////////////////
//																			//
// OZ STUDIO TEMPORARY / WORK IN PROGRESS									//
// --------------------------------------                                   //										
//																			//
// These ifdefs have been enabled temporarily for the whole oz studio and	//
// should be disabled/removed when no longer needed							//
//																			//
//////////////////////////////////////////////////////////////////////////////
#ifdef OZ_BUILD

//
// Martin: 01-05-03
// MMX extenstions to speed up sprite rendering
//
///#define __OPTIMIZE_SPRITES_MMX

#ifndef FINAL_RELEASE
//
// Artem: 31/7/03
// Sound debug aid. Activated by "snd_lines" command line switch.
//
#define DEBUG_SOUND_LINES

//
// Artem: 31/7/03
// Sound page in debug otput window. Activated by "snd_eow" command line switch.
//
#define USE_EOW
#define DEBUG_SOUND_EOW

#endif // !FINAL_RELEASE

//
// MartinS, ScottV 18/02/05
// Phase 2 of the new dynamic lighting system and
// night battles.
#define __DYNAMIC_LIGHTING_PHASE_2

//
// Scott: 03/03/05
// Fix for enabling event triggers for units near camera but not visible
//
#define __SOUND_EVENT_CULLING

#endif // OZ_BUILD



//////////////////////////////////////////////////////////////////////////////
//																			//
// ADD NEW DEFINES HERE														//
// --------------------														//
//																			//
// Any recently enabled defines should be added here.						//
//																			//
//////////////////////////////////////////////////////////////////////////////

//
// Charlie: 30/06/03
// Lightmap added to landscape background to increase lighting detail 
// to the same resolution as colour detail
//
#define __LANDSCAPE_BACKGROUND_LIGHTMAP

//Lee 22/9/03
//this define will remove the black shroud and replace it with the fog
#define TURN_OFF_SHROUD

//
// Guy 25/09/03
// US Demo - sample senate mission, take pyramids
//
#define TAKE_AUTOMALAX_ON_TURN_TWO
//#define PLAY_PYRAMID_RTM
#define TRIGGER_VOLCANO

//
// Guy: 07/10/03
// Some systems have automatic documentation generation.  As of today, those
// systems are the triggers, events and script commands (used in the scripting
// areas of the game such as VnVs, advice and the tutorials).  Disable this
// define at shipping time to prevent users being able to script their own
// campaigns, vices, advice &c.
//
#if !defined FINAL_RELEASE
#define DOCUDEMON
#endif//FINAL_RELEASE

//
// Dan G: 10/10/2003
// auto link up - units link to form structured groups
//
#define __AUTO_LINK_UP

//
// Ken: 10/10/03
// Show construction levels for buildings in cities on the battle map
//
#define __BUILDING_CONSTRUCTION_PROGRESS

//
// Ken: 15/10/03
// allow for faction specific banners on buildings
//
#define __BUILDING_ADORNMENTS

//
// Ken: 15/10/03
// As per spec for AI helpers ...
//
#define __UNITS_MOVING_THROUGH

//
// Charlie 15/10/03
// Framework for creating battlefield features through analysis of surrounding strategy map tiles.
// Includes rough passes of valleys, forests and hills.	
//
#define __NEW_BATTLEFIELD_GENERATION

//
// Guy 17/10/03
// For debug purposes, scripting lanugages may need their tokens outputting...
//
#if !defined FINAL_RELEASE
#define OUTPUT_COMMANDS
#endif//FINAL_RELEASE

//
// Charlie 23/10/03
// Increased resolution of the aerial map ground texture.
// From 30 texels per game tile to 46 texel per game tile
//
//#define __AERIAL_MAP_HI_RES_GROUND_TEXTURE

//
// Ken & Dan G: 09/03/2004
//
#define __BATTLEFIELD
#define __BATTLEFIELD_GROUND_MODELS
#define __BATTLEFIELD_GROUND_TILES
#define __BATTLEFIELD_GRASS
#define __BATTLEFIELD_TEXTURE_BLEND
#define __BATTLEFIELD_EDITOR_HEIGHTS
#define __BATTLEFIELD_EDITOR_TERRAIN_TYPES
#define __RENDER_SYS_BUFFER_SUB_RANGE
#define __BATTLEFIELD_EDITOR_SAVE_LOAD
#define __BATTLEFIELD_LOW_SPEC
#define __BATTLEFIELD_ROADS
#define __BATTLEFIELD_MODELS_SAVE_LOAD

//#ifdef __DM_TEXTURE_NEW_LIBS
//#define __DM_TEXTURE_NEW
//#endif

//
// Scott: 4/5/2004
// To allow easy testing, and for Ian's E3 stuff
//
#define __AI_HIERARCHICAL_DEBUGGER_ACTIVE

//
// Guy: 31/05/2004
// Diagnostics for the triggers, to see if all traits and ancillaries are being chosen
//
#if !defined (ROME_DEMO) && ! defined(FINAL_RELEASE)
#define __TRIGGER_DIAGNOSTICS
#endif // #ifdef ROME_DEMO

//
// Guy: 17/06/04
// The subterfuge AI needs profiling on a large scale.  See ai_subterfuge_controller.cpp for details
//
#if !defined(ROME_DEMO) && !defined(FINAL_RELEASE)
#define __SUBTERFUGE_AI_LOGGING
#endif // #ifdef ROME_DEMO

//
// Artem: 16/5/04
// Unit orders of AI controlled factions
//
#define __SND_ROME_AI_UNITS_SPEECH

//
// DanG: 5/7/04
// Reduced wfc file size
//
#define __BATTLEFIELD_FILE_SIZE_OPTIMISATION


//
// Artem: 7/7/04
// Buildings memory footprint optimisation
//
#define __BUILDINGS_MEMORY_OPTIMISATION

// Lee : 14/10/04 inexplicably missing from the release
// adds off map settlements, navies and wonders to the battlefield

#define __BATTLEFIELD_OFFMAP_FEATURE

//
// Charlie:24/11/04
// Fix for soldiers doubling back on themselves when in the unit task 'path follow individual'
//
#define __PATH_FOLLOW_INDIVIDUAL_DOUBLE_BACK_FIX

//
// Guy: 25/11/04
// The subterfuge AI needs profiling on a large scale.  See ai_subterfuge_controller.cpp for details
//
#if !defined(ROME_DEMO) && !defined(FINAL_RELEASE)
#define __ASSASSIN_DETAIL
#endif // #ifdef ROME_DEMO

//
// Guy: 26/11/04
// The campaign AI needs profiling - it has slowed down a lot since the release
//
#if !defined(ROME_DEMO) && !defined(FINAL_RELEASE)
#define __AI_PROFILE
#endif

//
// Charlie:13/12/04
// Modifications to make javelins more powerful against elephants and shield more use against missiles
// Also, missiles are no longer more effective in multiplayer
//
#define __RULES_PATCH_MODS

//
// Tom 21/12/04
// Modifications made for barbarian invasion expansion pack
#define BARB_INV

//
// Chris 07/02/05
// Validate all battlefield unit skeletons with unit weapon data
#define VALIDATE_SKELETONS


//
// MartinS, MartinV, ScottL  08/02/05
// Dynamic lighting support for night battles
#define __DYNAMIC_LIGHTING

// 
// All these defines are predicated only on dynamic lighting so in the
// event of problems just disable __DYNAMIC_LIGHTING above
#ifdef __DYNAMIC_LIGHTING
//
// MartinV: 12/01/05
// Support for more lights in vertex shaders
//
#define __ADDITIONAL_LIGHTS_FLEXI_SHADER

//
// Dan: 14/1/05
// And incorrectly named define for night time rendering
//
#define __BARB_INV_ILLUMINATION_MGR

// 
// Scott: 14/1/05
// Support for torch spot fx on buildings / gates
//
#define __SLOWTHER_TORCH_ADD

//
// MartinS, ScottV 18/02/05
// Phase 2 of the new dynamic lighting system and
// night battles.
#define __DYNAMIC_LIGHTING_PHASE_2

//
// MartinS 07/02/05
// Optimisations to the dynamic lighting
#define __DYNAMIC_LIGHTING_OPT

#endif // __DYNAMIC_LIGHTING

// Tom 06/04/05
// Pathfinding optimisations.  Let's hope for the best eh!
#define PATHFINDING_CHANGES

//
// Charlie 29/04/05
// Changes to night battles
//
#ifdef __BARB_INV_ILLUMINATION_MGR
#define __NIGHT_BATTLE_CHANGES
#endif // __BARB_INV_ILLUMINATION_MGR

//
// Charlie 26/05/05
// Improved spread of battle start times for campaign battles
// Since sun no longer moves across the sky this will give more variety in battle lighting
//
#define __NEW_BATTLE_START_TIME_DISTRIBUTION

//
// Charlie 28/06/05
// Improvement for pathfinsing escaping from obstacles from which it starts inside
//
#define __PATHFINDING_ESCAPE_IMPROVEMENT

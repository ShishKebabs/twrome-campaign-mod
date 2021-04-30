#include "fleximesh.h"
#include "fragments/fleximesh0_decls.vsh"

// Compensate for lack of UBYTE4 on Geforce3
mul 		TEMP0,				v2.zyxw, 		c[CONST_CONSTS].wwww

//Set 1
mov 		ADDR.x,					TEMP0.x
dp4			POSITION_MODEL.x,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 0]
dp4			POSITION_MODEL.y,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 1]
dp4			POSITION_MODEL.z,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 2]
mov 		POSITION_MODEL.w,   	ONE

dp3 		NORMAL_MODEL.x,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3 		NORMAL_MODEL.y,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3 		NORMAL_MODEL.z,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 2]
mov			NORMAL_MODEL.w, 		ZERO

//compute position
m4x4 		POSITION_CLIP,				POSITION_MODEL, 			c[CONST_MAT_MVP]
mov 		oPos, 						POSITION_CLIP

#include "light_addlight3_diffuse_dir.vsh"

min 		oD0,    		DIFFUSE_CLR, 			ONE     			; clamp if > 1
mov 		oD1, 			ALL_ZERO     						; output specular

; Copy texture coordinate
mov 		oT0, 			v4

mov			oFog, 			FOG

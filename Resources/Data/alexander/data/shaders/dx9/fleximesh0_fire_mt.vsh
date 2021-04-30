#include "flexi_fire.h"
#include "fragments/fleximesh0_decls.vsh"

// Compensate for lack of UBYTE4 on Geforce3
mul 		TEMP0,			IN_BLENDINDICES.zyxw, 		c[CONST_CONSTS].wwww
mov 		ADDR.x,			TEMP0.x

dp4 		POSITION_MODEL.x, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 0]
dp4 		POSITION_MODEL.y, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 1]
dp4 		POSITION_MODEL.z, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 2]
mov 		POSITION_MODEL.w, ONE

#include "emit_pos.vsh"

mov 		oD0,    		c[14]     		
mov 		oD1, 			ALL_ZERO     	
mov			oFog,			ZERO
mov			oT0,					IN_TEXCOORD0
m3x4 		oT1,					IN_TEXCOORD0,		c[CONST_TEX_X1]


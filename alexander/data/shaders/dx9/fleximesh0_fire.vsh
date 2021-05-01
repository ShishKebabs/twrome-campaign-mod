#include "flexi_fire.h"
#include "fragments/fleximesh0_decls.vsh"

// Compensate for lack of UBYTE4 on Geforce3
mul 		TEMP0,			IN_BLENDINDICES.zyxw, 		c[CONST_CONSTS].wwww
mov 		ADDR.x,			TEMP0.x

dp4 		POSITION_MODEL.x, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 0]
dp4 		POSITION_MODEL.y, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 1]
dp4 		POSITION_MODEL.z, IN_POSITION, c[ADDR.x + CONST_MAT_PALETTE + 2]
mov 		POSITION_MODEL.w, ONE

dp3 		NORMAL_MODEL.x, IN_NORMAL, c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3 		NORMAL_MODEL.y, IN_NORMAL, c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3 		NORMAL_MODEL.z, IN_NORMAL, c[ADDR.x + CONST_MAT_PALETTE + 2]
mov 		NORMAL_MODEL.w, ZERO

#include "burning_man.vsh"
#include "emit_pos.vsh"

mov 		oD0,    		ONE     		
mov 		oD1, 			ALL_ZERO     	
mov			oFog,			ZERO


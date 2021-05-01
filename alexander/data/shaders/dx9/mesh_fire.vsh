#include "flexi_fire.h"
#include "fragments/fleximesh0_decls.vsh"


mov 		POSITION_MODEL, 		IN_POSITION     ; position
mov			NORMAL_MODEL,			IN_NORMAL		; normal

mov 		POSITION_MODEL.w, ONE
mov			NORMAL_MODEL.w,   ZERO

#include "burning_man.vsh"
#include "emit_pos.vsh"

// fog
mul			r8.x, 			-FOG,  			POSITION_CLIP.z		; -(fog_exp_density * z_dist)
exp			oFog, 			r8.x								; evaluate exponential function (2^(-fog_exp_density * z_dist))

// colour
mov 		oD0,    		ONE     		
mov 		oD1, 			ALL_ZERO     	
mov 		oFog,			ZERO

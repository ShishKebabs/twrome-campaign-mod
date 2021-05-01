
;------------------------------------------------------------------------------
; v0 = position
; v1 = blend weights
; v2 = blend indices
; v3 = normal
; v4 = texture coordinates
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; r1 = Blend indices
; r4 = Blended position in camera space
;------------------------------------------------------------------------------
#include "fleximesh.h"
#include "fragments/fleximesh0_decls.vsh"


// Compensate for lack of UBYTE4 on Geforce3
mul 		r1,				v2.zyxw, 		c[CONST_CONSTS].wwww

//Set 1
mov 		a0.x,			r1.x
m4x3 		r4,				v0,				c[a0.x + CONST_MAT_PALETTE]

//compute position
mov 		r4.w,   		ONE
m4x4 		r6,				r4, 			c[CONST_MAT_MVP]
mov 		oPos, 			r6

mov 		oD0,			FOG
mov			oD1, 			ALL_ZERO
mov			oFog, 			ZERO



;-----------------------------------------------------------------------------
; Single boned flexi mesh renderer used for rendering them into the
; shadow map.
;-----------------------------------------------------------------------------

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

;------------------------------------------------------------------------------
; Constants specified by the app;
;
; c0     = constants
; c1-4   = World matrix
; c5-8   = World * View * Projection
; c9     = (fade_start, 1 / (fade_end - fade_start))
; c13-   = Matrix palette
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
;------------------------------------------------------------------------------
#include "fragments/fleximesh0_decls.vsh"

// Compensate for lack of UBYTE4 on Geforce3
mul 		r1,			v2.zyxw,			c0.wwww


//Set 1
mov 		a0.x,		r1.x
m4x3 		r4,			v0,					c[a0.x + 5]

//compute position
mov  		r4.w,		c0.x
m4x4 		r6,			r4,					c1 
mov  		oPos, 		r6
			
mov 		oD0,  		c0.yyyx
mov 		oFog, 		c0.z
mov 		oT0,  		v4

#include "fleximesh1_addlight4_gloss.vsh"

; Relies on world space position being in r4
mov		   	oT3,			IN_TEXCOORD0
m4x3 		oT4, 			r4, 			c[CONST_TEX_X1] 		; generate world space coordinate.

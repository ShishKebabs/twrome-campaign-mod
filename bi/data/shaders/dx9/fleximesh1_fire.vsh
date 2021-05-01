#include "flexi_fire.h"
#include "fragments/fleximesh1_decls.vsh"

;------------------------------------------------------------------------------
; v0 = position
; v1 = blend weights
; v2 = blend indices
; v3 = normal
; v4 = texture coordinates
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; r0.w = Last blend weight
; r1 = Blend indices
; r2 = Temp position
; r3 = Temp normal
; r4 = Blended position in camera space
; r5 = Blended normal in camera space
; r6 = view space vertex position
; r8.x = fog exponent
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
; oD0	  = Diffuse
; oD1	  = Specular
; oT0	  = texture coordinates
;------------------------------------------------------------------------------

// Compensate for lack of UBYTE4 on Geforce3
mul 		r1,			v2.zyxw,			c[CONST_CONSTS].wwww


//first compute the last blending weight
dp3 		r0.w,		v1.xyz,				c[CONST_CONSTS].xzz; 
add 		r0.w,		-r0.w, 				c[CONST_CONSTS].x

//Set 1
mov 		a0.x,		r1.x
m3x3 		r4,			v0,					c[a0.x + CONST_MAT_PALETTE]
m3x3 		r5,			v3,					c[a0.x + CONST_MAT_PALETTE]
	 
//blend them
mul 		r4,			r4,					v1.xxxx
mul 		r5,			r5,					v1.xxxx

// store translation
// we have too many bones to be able to send this in as a constant
mov 		r11.x, 		c[a0.x + CONST_MAT_PALETTE + 0].w
mov 		r11.y, 		c[a0.x + CONST_MAT_PALETTE + 1].w
mov 		r11.z, 		c[a0.x + CONST_MAT_PALETTE + 2].w
mov 		r11.w, 		c0.x

//Set 2
mov 		a0.x,		r1.y
m3x3 		r2,			v0,				c[a0.x + CONST_MAT_PALETTE]
m3x3 		r3,			v3,				c[a0.x + CONST_MAT_PALETTE]

//add them in
mad 		r4,			r2,				r0.wwww,					r4
mad 		r5,			r3,				r0.wwww,					r5

// add translation
add 		r4, 		r4, 			r11

// push the vertex out some along its normal
mad  		r4 , 		r5, 			INFLATE, 	r4

//compute position
mov 		r4.w, 		ONE
m4x4 		r6,			r4, 			c[CONST_MAT_MVP]
mov			oPos, 		r6


mov 		oD0,    	ONE 		
mov 		oD1,    	ALL_ZERO   

;mov oD0.y, c0.z
; Copy texture coordinate
mov 		oT0, 		v4


; Calculate the fog using D3DFOG_EXP
;mul			r8.x, 		-FOG, 			r6.z				; -(fog_exp_density * z_dist)
;exp			oFog, 		r8.x								; evaluate exponential function (2^(-fog_exp_density * z_dist))

mov oFog, ZERO


#include "fleximesh.h"
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
mul 		TEMP1,		IN_BLENDINDICES.zyxw,			c[CONST_CONSTS].wwww


//first compute the last blending weight
dp3 		TEMP0.w,		IN_BLENDWEIGHTS.xyz,	c[CONST_CONSTS].xzz; 
add 		TEMP0.w,		-TEMP0.w, 				c[CONST_CONSTS].x

//Set 1
mov 		ADDR.x,					TEMP1.x
dp3			POSITION_MODEL.x,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3			POSITION_MODEL.y,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3			POSITION_MODEL.z,		IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 2]
mov 		POSITION_MODEL.w,   	ONE

dp3 		NORMAL_MODEL.x,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3 		NORMAL_MODEL.y,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3 		NORMAL_MODEL.z,			IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 2]
mov			NORMAL_MODEL.w, 		ZERO

	 
//blend them
mul 		POSITION_MODEL,			POSITION_MODEL,			IN_BLENDWEIGHTS.xxxx
mul 		NORMAL_MODEL,			NORMAL_MODEL,			IN_BLENDWEIGHTS.xxxx

// store translation
mov 		TEMP4.x, 		c[ADDR.x + CONST_MAT_PALETTE + 0].w
mov 		TEMP4.y, 		c[ADDR.x + CONST_MAT_PALETTE + 1].w
mov 		TEMP4.z, 		c[ADDR.x + CONST_MAT_PALETTE + 2].w
mov 		TEMP4.w, 		ZERO

//Set 2
mov 		ADDR.x,					TEMP1.y
dp3 		TEMP2.x,				IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3 		TEMP2.y,				IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3 		TEMP2.z,				IN_POSITION,			c[ADDR.x + CONST_MAT_PALETTE + 2]
mov			TEMP2.w, 				ONE

dp3 		TEMP3.x,				IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 0]
dp3 		TEMP3.y,				IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 1]
dp3 		TEMP3.z,				IN_NORMAL,				c[ADDR.x + CONST_MAT_PALETTE + 2]
mov			TEMP3.w, 				ZERO

//add them in
mad 		POSITION_MODEL,			TEMP2,					TEMP0.wwww,		POSITION_MODEL
mad 		NORMAL_MODEL,			TEMP3,					TEMP0.wwww,		NORMAL_MODEL

// add translation
add 		POSITION_MODEL, 		POSITION_MODEL, 		TEMP4

//compute position
m4x4 		POSITION_CLIP,			POSITION_MODEL, 		c[CONST_MAT_MVP]
mov			oPos, 					POSITION_CLIP

#include "light_addlight4_diffuse_dir.vsh"

min 		oD0,    	DIFFUSE_CLR,     ONE 				; clamp if > 1 and output
mov 		oD1,    	ALL_ZERO       						; output specular

; Copy texture coordinate
mov 		oT0, 		IN_TEXCOORD0
mov			oFog,		FOG

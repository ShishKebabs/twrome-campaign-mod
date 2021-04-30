#include "fleximesh.h"
#include "fragments/fleximesh1_decls.vsh"

// Compensate for lack of UBYTE4 on Geforce3
mul 		r1,			v2.zyxw,			c[CONST_CONSTS].wwww


//first compute the last blending weight
dp3 		r0.w,		v1.xyz,				c[CONST_CONSTS].xzz; 
add 		r0.w,		-r0.w, 				c[CONST_CONSTS].x

//Set 1
mov 		a0.x,		r1.x
m3x3 		r4,			v0,					c[a0.x + CONST_MAT_PALETTE]
	 
//blend them
mov			r4,			ZERO
mul 		r4,			r4,					v1.xxxx

// store translation
// we have too many bones to be able to send this in as a constant
mov 		r11.x, 		c[a0.x + CONST_MAT_PALETTE + 0].w
mov 		r11.y, 		c[a0.x + CONST_MAT_PALETTE + 1].w
mov 		r11.z, 		c[a0.x + CONST_MAT_PALETTE + 2].w
mov 		r11.w, 		c0.x

//Set 2
mov 		a0.x,		r1.y
mov			r2.w,		ZERO
m3x3 		r2,			v0,				c[a0.x + CONST_MAT_PALETTE]

//add them in
mad 		r4,			r2,				r0.wwww,					r4

// add translation
add 		r4, 		r4, 			r11

//compute position
mov 		r4.w, 		ONE
m4x4 		r6,			r4, 			c[CONST_MAT_MVP]
mov			oPos, 		r6

mov 		oD0, 		FOG
mov			oD1, 			ALL_ZERO
mov			oFog, 			ZERO

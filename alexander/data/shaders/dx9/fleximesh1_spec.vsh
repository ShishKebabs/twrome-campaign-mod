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
; Constants specified by the app;
;
; c0     = constants
; c1     = light_dir
; c2-5   = World * View * Projection
; c6     = Light diffuse colour
; c7     = Light ambient colour
; c8-11  = World matrix
; c12    = Specular color 
; c13    = Camera look vector
; c14    = Material diffuse colour
; c15-18 = Tex transform matrix 1
; c19-22 = Tex transform matrix 2
; c23-95 = Matrix palette
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
; oD0	  = Diffuse
; oD1	  = Specular
; oT0	  = texture coordinates
;------------------------------------------------------------------------------

// Compensate for lack of UBYTE4 on Geforce3
mul 		r1,			v2.zyxw,	c[CONST_CONSTS].wwww


//first compute the last blending weight
dp3 		r0.w,		v1.xyz,		c[CONST_CONSTS].xzz; 
add 		r0.w,		-r0.w,		c[CONST_CONSTS].x

//Set 1
mov 		a0.x,		r1.x
m3x3 		r4,			v0,			c[a0.x + CONST_MAT_PALETTE]
m3x3 		r5,			v3,			c[a0.x + CONST_MAT_PALETTE]
	 
//blend them
mov			r4.w,		ZERO
mov			r5.w,		ZERO
mul 		r4,			r4,			v1.xxxx
mul 		r5,			r5,			v1.xxxx

// store translation
// we have too many bones to be able to send this in as a constant
mov 		r11.x, 		c[a0.x + CONST_MAT_PALETTE + 0].w
mov 		r11.y, 		c[a0.x + CONST_MAT_PALETTE + 1].w
mov 		r11.z, 		c[a0.x + CONST_MAT_PALETTE + 2].w
mov 		r11.w, 		ONE

//Set 2
mov 		a0.x,		r1.y
m3x3 		r2,			v0,			c[a0.x + CONST_MAT_PALETTE]
m3x3 		r3,			v3,			c[a0.x + CONST_MAT_PALETTE]

//add them in
mov			r2.w,		ZERO
mov			r3.w,		ZERO
mad 		r4,			r2,			r0.wwww,		r4
mad 		r5,			r3,			r0.wwww,		r5

// add translation
add 		r4, 		r4, 		r11

//compute position
mov 		r4.w,		ONE
m4x4 		r6,			r4,			c[CONST_MAT_MVP]
mov 		oPos,		r6

; Calculate the fog using D3DFOG_EXP
;mul		r8.x, -c0.y, r6.z			; -(fog_exp_density * z_dist)
;exp		r8.x, r8.x					; evaluate exponential function

mov			r8.x, 		ONE						; HACK - just set it to 1 for now while investigating flashing characters on the strat map
mov			oFog, 		r8.x

; Do the lighting calculation
dp3 		r1.x, 		r5, 			-c[CONST_LDIR] 		; normal dot light
mul 		r0, 		r1.x, 			c[CONST_LDIF_CLR]  ; scale by light diffuse
mov 		r0.w, 		ONE	  								; set alpha to one

max 		r0, 		r0, 			ZERO				; clamp if < 0
add 		r10, 		r0, 			c[CONST_LAMB_CLR]   ; Add in ambient

// Calc specular lighting
m4x3 		r0,			r4,				c[CONST_MAT_WORLD]  ; Transform point to world space    	    
add 		r0,			-r0,			c[CONST_CAM_LOOK]   ; Get a vector toward the camera position. This is the negative of the camera direction 

// Normalize
dp3 		r11.x,		r0.xyz,			r0.xyz   			; Load the square into r11
rsq 		r11.xyz,	r11.x         						; Get the inverse of the square
mul 		r0.xyz,		r0.xyz,			r11.xyz 			; Multiply, r0 = -(camera vector)

mov 		r7, 		-c[CONST_LDIR]
m3x3 		r9, 		r7, 			c[CONST_MAT_WORLD]	; Transform light dir into world space
add 		r2.xyz,		r0.xyz,			r9     				;  Get half angle
	
// Normalize
dp3 		r11.x,		r2.xyz,			r2.xyz   			; Load the square into r1
rsq 		r11.xyz,	r11.x         						; Get the inverse of the square
mul 		r2.xyz,		r2.xyz,			r11.xyz 			; Multiply, r2 = HalfAngle
m3x3 		r1,			r5,				c[CONST_MAT_WORLD]  ; Transform normal to world space, put in r1
        
// r2 = half angle, r1 = normal, r3 (output) = intensity
dp3  		r3.xyzw,	r1,				r2

// Now raise it several times
;max 		r3, 		r3, 			ALL_ZERO
mul 		r3,			r3,				r3 					;  2nd
mul 		r3,			r3,				r3		 			;  4th
mul 		r3,			r3,				r3 					;  8th
mul 		r3,			r3,				r3 					;  16th

mul 		r3,		 	r3, 			r8.xxxx				; reduce specular by the fog factor
mul 		r3, 		r3, 			c[CONST_LSPEC_CLR]	; modulate by specular colour

;add r0, r10, r3		; add to diffuse and ambient
mov 		r10.w,		c[6].w								; add alpha
min 		oD0, 		r10, 			ONE					; clamp if > 1 and output
mov 		oD1, 		r3									; output specular

; Copy texture coordinate
mov 		oT0, 		v4


#include "fleximesh.h"
#include "fleximesh0_decls.vsh"

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
mul 	r1,			v2.zyxw,	c0.wwww

//Set 1
mov 	a0.x,		r1.x
m4x3 	r4,			v0,			c[a0.x + CONST_MAT_PALETTE]
m3x3 	r5,			v3,			c[a0.x + CONST_MAT_PALETTE]

//compute position
mov 	r4.w,		ONE
m4x4 	r6,			r4,			c[CONST_MAT_MVP]
mov 	oPos,		r6

;
; Calculate the fog using D3DFOG_EXP
;

;mul		r8.x, -c0.y, r6.z			; -(fog_exp_density * z_dist)
;exp		r8.x, r8.x					; evaluate exponential function

mov		r8.x,		 ONE						; HACK - just set it to 1 for now while investigating
										;		 flashing characters on the strat map
mov		oFog, 		 r8.x

; Do the lighting calculation
dp3 	r1.x, 		r5, 		-c[CONST_LDIR]    		; normal dot light
mul 	r0, 		r1.x, 		c[CONST_LDIF_CLR]      ; multiply with light diffuse
mov 	r0.w, 		ONE		 						; set alpha to one


max 	r0, 		r0,			ZERO
add 	r10, 		r0, 		c[CONST_LAMB_CLR]      ; Add in ambient

// Calc specular lighting
m4x3 	r0,			v0,			c[CONST_MAT_WORLD]     ; Transform point to world space    	    
add 	r0,			-r0,		c[CONST_CAM_LOOK]      ; Get a vector toward the camera position
                   									; This is the negative of the camera direction 

// Normalize
dp3 	r11.x,		r0.xyz,		r0.xyz   		; Load the square into r1
rsq 	r11.xyz,	r11.x         		 		; Get the inverse of the square
mul 	r0.xyz,		r0.xyz,		r11.xyz  		; Multiply, r0 = -(camera vector)
mov 	r7, 		-c[CONST_LDIR]
m3x3 	r9, 		r7, 		c[CONST_MAT_WORLD]
add		r2.xyz,		r0.xyz,		r9     			; Get half angle
	
// Normalize
dp3 	r11.x,		r2.xyz,		r2.xyz   		; Load the square into r1
rsq 	r11.xyz,	r11.x         				; Get the inverse of the square
mul 	r2.xyz,		r2.xyz,		r11.xyz 		; Multiply, r2 = HalfAngle
m3x3 	r1,			r5,			c[CONST_MAT_WORLD] ; Transform normal to world space, put in r1
        
// r2 = half angle, r1 = normal, r3 (output) = intensity
dp3  	r3.xyzw,	r1,			r2

// Now raise it several times
;max 	r3, 		r3, 		ALL_ONE
mul 	r3,			r3,			r3 //  2nd
mul 	r3,			r3,			r3 //  4th
mul 	r3,			r3,			r3 //  8th
mul 	r3,			r3,			r3 // 16th

mul 	r3, 		r3, 		r8.xxxx				; reduce specular by the fog factor
mul 	r3, 		r3, 		c[CONST_LSPEC_CLR]	; modulate by specular colour

mov 	r10.w, 		c[6].w				; set alpha
min 	oD0, 		r10, 		ONE		; clamp if > 1 and output
mov 	oD1, 		r3					; output specular

; Copy texture coordinate
mov 	oT0, 	v4


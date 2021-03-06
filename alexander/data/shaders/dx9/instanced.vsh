vs.1.1

;------------------------------------------------------------------------------
; v0 = position
; v1 = matrix index
; v2 = normal
; v3 = texture coordinates
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; r0		= view space vertex position
; r1		= diffuse lighting component
; r2		= fog calculation
; r3        = temp for index unpacking on GeForce3
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; Constants specified by the app;
;
; c0		= constants 1 (1, 0, some shit, fog_exp_density) 
; c1        = constants 2 (alpha, x, x, x)
; c2		= Light direction
; c3		= Light diffuse colour
; c4		= Light ambient colour
; c5-c8     = View * Projection
; c9-c96	= 29 Object -> World Transforms
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
; oD0	  = Diffuse
; oT0	  = Texture coordinates
;------------------------------------------------------------------------------


;
; Calculate the world position of the vertex
;

mul     r3,   v1.zyxw, c0.zzzz      ; get the index back out of the colour
mov 	a0.x, r3.x				    ; matrix index stored in red field
m4x3	r4,   v0, c[a0.x+9]			; world position of vertex
mov     r4.w, c0.x

; 
; Calculate the clip space position of the vertex
; 
m4x4	r0,   r4,   c5

;
; Do the diffuse lighting calculation
;

m3x3	r1,   v2,   c[a0.x+9]	    ; transform the normal into world space 
dp3	    r1.x, r1,  -c2				; normal dot light
mul	    r1,   r1.x, c3				; scale by light diffuse
max	    r1,   r1,   c0.y			; clamp if < 0
add	    r1,   r1,   c4				; Add in ambient
mov     r1.w, c1.x

;
; Store the vertex position
;

mov	    oPos, r0

;
; Store the lighting components 
;
mov	    oD0, r1	                    ; set the diffuse colour
mov	    oD1, c0.yyyy				; set the specular to zero


;
; Pass through the texture coordinates
;

mov	oT0, v3

;
; Calculate the fog using D3DFOG_EXP
;

mul	    r2.x, -c0.w, r0.z			; -(fog_exp_density * z_dist)
exp	    oFog, r2.x				    ; evaluate exponential function

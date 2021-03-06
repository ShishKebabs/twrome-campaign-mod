
vs_1_1

dcl_position0 		v0
dcl_normal0			v1
dcl_color0			v2
dcl_texcoord0		v3

;------------------------------------------------------------------------------
; v0 = position
; v1 = normal
; v2 = colour
; v3 = texture coordinates (0)
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; r0		= camera space vertex position
; r1		= diffuse lighting component
; r8.x		= fog exponent
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; Constants specified by the app;
;
; c0		= constants (1, 0, threshold, ?) 
; c1		= alpha factors (min_alpha, max_alpha, ?, specular_power)
; c2-c5		= World * View transform * Projection
; c6-c9		= Texture transform matrix
; c10		= Light direction
; c11		= Light diffuse colour
; c12		= Light ambient colour
; c13		= Light specular colour
; c14		= Camera position in world space
; c15		= (water_colour.r, water_colour.r, water_colour.r, water_factor)
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
; oD0	  = Diffuse
; oD1	  = Specular
; oT0	  = texture coordinates
;------------------------------------------------------------------------------

;
; Transform the vertex position
;

m4x4	r0,   v0, c2				; transform into view space
mov		oPos, r0					; output the view space position

;
; Do the diffuse lighting calculation
;

dp3		r1.x, v1,  -c10				; normal dot light
mul		r1,   r1.x, c11				; scale by light diffuse
max		r1,   r1,   c0.y			; clamp if < 0
add		r1,   r1,   c12				; Add in ambient

mov		r1.w,	v2.w				; set the diffuse alpha to the vertex alpha
mul		r1.xyz, r1.xyz, v2.xyz		; modulate the light colour by the vertex colour

;
; Store the lighting components 
;

mov		oD0, r1						; set the diffuse colour
mov		oD1, c0.yyyy				; set the specular to zero


;
; Pass through the texture coordinates
;

mov		oT0, v3

;
; Calculate the fog using D3DFOG_EXP
;

mul		r8.x, -c0.w, r0.z			; -(fog_exp_density * z_dist)
exp		oFog,  r8.x					; evaluate exponential function


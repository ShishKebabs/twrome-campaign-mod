
vs_1_1

dcl_position0 		v0
dcl_texcoord0		v1


;------------------------------------------------------------------------------
; v0 = position
; v1 = texture
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; Constants specified by the app;
; 
; c6	  = shadow colour
; c5	  = camera right vector
; c1-c4   = projection matrix
; c0	  = {1, 0, 0, light_offset}
;------------------------------------------------------------------------------

;------------------------------------------------------------------------------
; oPos	  = Output position
; oD0	  = Diffuse
; oD1	  = Specular
; oT0	  = texture coordinates
;------------------------------------------------------------------------------

// Billboard 
mad r0.xyz, c5, v0.w, v0

// Transform to clip space
mov  r0.w, c0.x
m4x4 oPos, r0, c1

// Output shadow colour
mov oD0, c6
mov oT0, v1


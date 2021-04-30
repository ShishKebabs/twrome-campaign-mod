;
; Cubemap tex gen shader. Assumes model space vert in r4 and model space normal in r5.
;

#define R_EYE_VERTEX r0
#define R_EYE_NORMAL r1
#define R_EYE_VECTOR r3
#define R_DOT2		 r11


m4x3 	R_EYE_VERTEX, 		r4, 			c[CONST_MAT_WORLD]
m3x3 	R_EYE_NORMAL.xyz, 	r5, 			c[CONST_MAT_WORLD]

; Create R_EYE_VECTOR, the normalized vector from the eye to the vertex
dp3 	R_EYE_VECTOR.w, 	R_EYE_VERTEX, 	R_EYE_VERTEX
rsq 	R_EYE_VECTOR.w, 	R_EYE_VECTOR.w		
mul 	R_EYE_VECTOR, 		R_EYE_VERTEX, 	R_EYE_VECTOR.w

; Need to re-normalize normal
dp3 	R_EYE_NORMAL.w, 	R_EYE_NORMAL, 	R_EYE_NORMAL
rsq 	R_EYE_NORMAL.w, 	R_EYE_NORMAL.w
mul 	R_EYE_NORMAL, 		R_EYE_NORMAL, 	R_EYE_NORMAL.w

; Calculate E - 2*(E dot N)*N
dp3 	R_DOT2, 			R_EYE_VECTOR, 	R_EYE_NORMAL
add 	R_DOT2, 			R_DOT2, 		R_DOT2
mul 	R_EYE_NORMAL, 		R_EYE_NORMAL, 	R_DOT2
add 	SPHEREMAP_OUT_REG, 	R_EYE_VECTOR, 	-R_EYE_NORMAL
mov 	SPHEREMAP_OUT_REG.w, ONE

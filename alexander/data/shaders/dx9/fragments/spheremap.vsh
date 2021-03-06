;
; calc sphere map texture coords
;

; trsnform normal into world space
m4x4 	r0, 		r4, 		c[CONST_MAT_WORLD]
m3x3 	r1.xyz, 	r5, 		c[CONST_MAT_WORLD]

dp3 	r1.w, 		r1, 		r1
rsq 	r1.w, 		r1.w
mul 	r1, 		r1, 		r1.w

// Compute normalized view vector	
add 	r2, 		c[24], 		-r0  
dp3 	r3, 		r2,  		r2
rsq 	r3, 		r3.w
mul 	r2, 		r2,  		r3

// Compute camera-space reflection vector
dp3 	r3, 		r1, 		r2
mul 	r1,			r1, 		r3
add 	r1, 		r1, 		r1
add 	r3, 		r1, 		-r2

// Compute sphere-map texture coords
mad 	r4.w, 		-r3.z, 		c[CONST_GMAP_CONSTS].y, c[CONST_GMAP_CONSTS].y
rsq 	r4, 		r4.w
mul 	r4, 		r3, 		r4
mad 	r4, 		r4, 		c[CONST_GMAP_CONSTS].x, c[CONST_GMAP_CONSTS].y

; output sphere map tex coords
mul 	SPHEREMAP_OUT_REG.xy, 	r4.xy, 		c[CONST_GMAP_CONSTS].zw
mov 	SPHEREMAP_OUT_REG.zw, 	c[CONST_GMAP_CONSTS].z

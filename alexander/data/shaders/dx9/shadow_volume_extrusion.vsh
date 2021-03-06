vs_1_1

dcl_position0 		v0
dcl_normal0			v1

;	v0 		= position
;	v1		= normal

;	c0		= constants [0, 1, 0, 0]
;	c1 - c4	= world-view-projection matrix
;	c5		= extrusion vector in object space

;	r0.x	= dot product result
;	r1		= extrusion vector co-efficient
;	r2		= modified extrusion vector
;	r3		= new position in object space

dp3		r0,		v1,		c5 ; dot product of normal and extrusion vector 

sge		r1,		r0,		c0.x	; if dot product >= 0
								; ie the normal is in the same halfspace as the extrusion vector
								; then set the extrusion vector co-efficient to 1 otherwise 0	

mul		r2,		c5,		r1		; multiply the extrusion vector by it's co-efficient

add		r3,		v0,		r2		; add the modified extrusion vector on to the original position
mov		r3.w,	c0.y			; reset w component of new position vector to 1

m4x4	oPos,	r3,		c1		; transform the new position into homogenous clip space and output


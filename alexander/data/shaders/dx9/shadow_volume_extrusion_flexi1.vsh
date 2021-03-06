#include "fragments/fleximesh0_decls.vsh"

;	v0			= position
;	v1			= blend weights
;	v2			= blend indices
;	v3			= normal
;	v4			= texture coordinates

;	c0			= constants [0, 1, -inset distance, 765.01]
;	c1 - c4		= world-view-projection matrix
;	c5			= extrusion vector in object space
;	c6 - c95	= matrix palette

;	r0.x		= dot product result
;	r1			= extrusion vector co-efficient
;	r2			= modified extrusion vector
;	r3			= new position in object space
;	r4			= blend indices intermediate
;	r5			= transformed position
;	r6			= transformed normal

; compensate for lack of UBYTE4 on Geforce3

mul		r4,		v2.zyxw,	c0.wwww
; mul	r4,		v2,			c0.wwww			- the way if have ubyte4

mov		a0.x,	r4.x						
m4x3	r5,		v0,			c[a0.x + 6]		; transform position
m3x3	r6,		v3,			c[a0.x + 6]		; transform normal
mov		r6.w,   c0.x
mov		r5.w,   c0.x

dp3		r0,		r6,			c5				; dot product of transformed normal and extrusion vector 

sge		r1,		r0,			c0.x			; if dot product >= 0
											; ie the normal is in the same halfspace as the extrusion vector
											; then set the extrusion vector co-efficient to 1 otherwise 0	

mul		r2,		r1,			c5				; multiply the extrusion vector by it's co-efficient

mad		r5,		r6,			c0.zzzx,	r5	; inset the transformed position along the transformed normal

add		r3,		r5,			r2				; add the modified extrusion vector on to the transformed position
mov		r3.w,	c0.y						; reset the w component of the transformed position to 1

m4x4	oPos,	r3,			c1				; transform the new position into homogenous clip space and output


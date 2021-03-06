vs_1_1
dcl_position0     v0
dcl_blendindices0 v1
dcl_normal0		  v2
dcl_texcoord0     v3

;	v0			= position
;	v1			= index
;	v2			= normal
;	v3			= texture coordinates

;	c0			= constants [0, 1, -inset distance, 255.01]
;	c1 - c4		= view-projection matrix
;	c5			= extrusion vector in world space
;	c6			= not used
;	c7			= not used
;	c8			= not used
;	c9-c95		= indexed data

;	r0			= index intermediate
;	r1			= indexed data cache (xyz = position, w = x sheer)
;	r2			= world position
;	r3.x		= dot product result
;	r4			= extrusion vector co-efficient
;	r5			= modified extrusion vector


; compensate for lack of UBYTE4 on Geforce3

mul		r0,		v1.zyxw,	c0.wwww
; mul	r0,		v1,			c0.wwww			- the way if have ubyte4

mov		a0.x,	r0.x						; put index into address register
mov		r1,		c[a0.x + 9]					; move index data into register

mul		r1.w,	v0.y,		r1.w			; calculate x sheer using position y component and index data w component  
add		r2,		v0,			r1				; add world position to model position 
add		r2.x,	r2.x,		r1.w			; add in x sheer


dp3		r3,		v2,			c5				; dot product of normal and extrusion vector 

sge		r4,		r3,			c0.x			; if dot product >= 0
											; ie the normal is in the same halfspace as the extrusion vector
											; then set the extrusion vector co-efficient to 1 otherwise 0	

mul		r5,		r4,			c5				; multiply the extrusion vector by it's co-efficient

mad		r2,		v2,			c0.zzzx,	r2	; inset position along normal

add		r2,		r2,			r5				; add the modified extrusion vector on to the position


mov		r2.w,	c0.y						; set world position w component to 1		

m4x4	oPos,	r2,			c1				; transform the world position into homogenous clip space and output


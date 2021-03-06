vs_1_1
dcl_position0     v0
dcl_blendindices0 v1
dcl_normal0		  v2
dcl_texcoord0     v3

;	v0			= position
;	v1			= index
;	v2			= normal
;	v3			= texture coordinates

;	c0			= constants [0, 1, 0, 255.01]
;	c1 - c4		= view-projection matrix
;	c5			= light direction
;	c6			= ambient colour
;	c7			= diffuse colour
;	c8			= texture1 transform (x = scale, y = x_offset, z = z_offset) 
;	c9-c95		= indexed data

;	r0			= index intermediate
;	r1			= indexed data cache (xyz = position, w = x sheer)
;	r2			= world position
;	r6			= lighting
;	r4			= sheers (x = position x, y = normal x)
;	r5			= transformed normal
;	r6			= offset texture1 cordinates

; compensate for lack of UBYTE4 on Geforce3

mul		r0,		v1.zyxw,	c0.wwww
; mul	r0,		v1,			c0.wwww	- the way if have ubyte4

mov		a0.x,	r0.x				; put index into address register
mov		r1,		c[a0.x + 9]			; move index data into register

mul		r4.x,	v0.y,		r1.w	; calculate position x sheer using y component and index data w component  
mul		r4.y,	v2.y,		r1.w	; calculate normal x sheer using y component and index data w component  

add		r2,		v0,			r1		; add world position to model position 
add		r2.x,	r2.x,		r4.x	; add in x sheer

mov		r2.w,	c0.y				; set world position w component to 1		

m4x4	oPos,	r2,			c1		; transform the world position into homogenous clip space and output

mov		r5,		v2					; move normal into register
add		r5.x,	r5.x,		r4.y	; add in x sheer	

dp3		r3.x,	r5,			-c5		; normal dot light direction
mul		r3,		r3.x,		c7		; modulate diffuse colour
max		r3,		r3,			c0.x	; clamp if < 0
add		r3,		r3,			c6		; add in ambient colour

min		oD0,	r3,			c0.y	; clamp if > 1

mov  	oT0, 	v3					; pass through the texture coordinates

add		r6,		r2.xz,		c8.yz	; add offsets to world position xz and place in register xy
mul		oT1,	r6,			c8.x	; scale and output the texture coordinates

add		r6.xy,	r2.xz,		c8.yz	; add offsets to world position xz and place in register xy
mul		r6.xy,	r6.xy,		c8.xx	; scale coordinates
mov		r6.zw,	c0.yy				; reset zw components to 1
mov		oT1,	r6					; output texture coordinates


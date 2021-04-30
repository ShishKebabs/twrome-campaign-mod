
	; normal dot light1
	dp3		TEMP0.x,		NORMAL_MODEL,   -c[CONST_LDIR]

	; normal dot light2
	dp3		TEMP0.y,		NORMAL_MODEL,   -c[CONST_L1_DIR]

	; normal dot light2
	dp3		TEMP0.z,		NORMAL_MODEL,   -c[CONST_L2_DIR]

	; normal dot light3
	dp3		TEMP0.w,		NORMAL_MODEL,   -c[CONST_L3_DIR]


	; clamp them all to 0
	max		TEMP0.xyzw,		TEMP0.xyzw,		ZERO

	; start with ambient
	mov		DIFFUSE_CLR,	c[CONST_LAMB_CLR]


	; add light1 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.x,		c[CONST_LDIF_CLR],		DIFFUSE_CLR

	; add light2 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.y,		c[CONST_L1_CLR],		DIFFUSE_CLR

	; add light3 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.z,		c[CONST_L2_CLR],		DIFFUSE_CLR

	; add light4 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.w,		c[CONST_L3_CLR],		DIFFUSE_CLR


	; last light
	dp3		TEMP0.x,		NORMAL_MODEL,   -c[CONST_L4_DIR]
	max		TEMP0.x,		TEMP0.x,		ZERO

	; unpack colour from 3 registers, and add it to diffuse lighting
	mad		DIFFUSE_CLR.x,	TEMP0.x,		c[CONST_L4_CLR_r].w,	DIFFUSE_CLR.x
	mad		DIFFUSE_CLR.y,	TEMP0.x,		c[CONST_L4_CLR_g].w,	DIFFUSE_CLR.y
	mad		DIFFUSE_CLR.z,	TEMP0.x,		c[CONST_L4_CLR_b].w,	DIFFUSE_CLR.z
	

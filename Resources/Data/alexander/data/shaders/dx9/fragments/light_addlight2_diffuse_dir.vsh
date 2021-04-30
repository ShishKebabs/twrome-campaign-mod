
	; normal dot light1
	dp3		TEMP0.x,		NORMAL_MODEL,   -c[CONST_LDIR]

	; normal dot light2
	dp3		TEMP0.y,		NORMAL_MODEL,   -c[CONST_L1_DIR]

	; normal dot light2
	dp3		TEMP0.z,		NORMAL_MODEL,   -c[CONST_L2_DIR]


	; clamp both it to 0
	max		TEMP0.xyz,		TEMP0.xyz,		ZERO

	; start with ambient
	mov		DIFFUSE_CLR,	c[CONST_LAMB_CLR]


	; add light1 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.x,		c[CONST_LDIF_CLR],		DIFFUSE_CLR

	; add light2 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.y,		c[CONST_L1_CLR],		DIFFUSE_CLR

	; add light3 colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.z,		c[CONST_L2_CLR],		DIFFUSE_CLR



	; normal dot light
	dp3		TEMP0.x,		NORMAL_MODEL,   -c[CONST_LDIR]

	; clamp it to 0
	max		TEMP0.x,		TEMP0.x,		ZERO

	; start with ambient
	mov		DIFFUSE_CLR,	c[CONST_LAMB_CLR]

	; add light colour * intensity
	mad		DIFFUSE_CLR.xyz,	TEMP0.x,		c[CONST_LDIF_CLR],		DIFFUSE_CLR

#include "ffp.h"

#include "simple_transform.vsh"
#include "light_diffuse_dir.vsh"
#include "def_spec.vsh"
#include "emit_tex0.vsh"
#include "emit_pos.vsh"
#include "emit_clr.vsh"
#include "exp_fog.vsh"

mov 	oT1,	IN_TEXCOORD0 

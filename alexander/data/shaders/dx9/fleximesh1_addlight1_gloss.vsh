#include "fleximesh1_addlight1.vsh"

#define SPHEREMAP_OUT_REG oT1
#include "cubemap.vsh"

; Output tex corrd for glossmap 
mov			oT2, 			v4

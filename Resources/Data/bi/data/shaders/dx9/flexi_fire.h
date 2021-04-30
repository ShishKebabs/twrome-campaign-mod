#ifndef FLEXIFIRE_H
#define FLEXIFIRE_H

#include "../romans_config.h"
#include "../config/user_config.h"

#include "register_map.h"

#define CONST_CONSTS      0
#define CONST_MAT_MVP     1
#define CONST_TEX_X1      8
#define CONST_MAT_PALETTE 15

#define ONE      c[CONST_CONSTS].x
#define ZERO     c[CONST_CONSTS].y
#define INFLATE  c[CONST_CONSTS].z
#define FOG      c[CONST_CONSTS].w

#define ALL_ZERO c[CONST_CONSTS].yyyy


#endif // FLEXIFIRE_H

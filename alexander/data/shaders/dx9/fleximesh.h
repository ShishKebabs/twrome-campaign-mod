
#ifndef FLEXIMESH_H
#define FLEXIMESH_H

#include "../romans_config.h"
#include "../config/user_config.h"
#include "register_map.h"

#define CONST_CONSTS       0
#define CONST_LDIR         1 
#define CONST_MAT_MVP      2
#define CONST_LDIF_CLR     6
#define CONST_LAMB_CLR     7
#define CONST_MAT_WORLD    8

// These overlap with with the first texture transform matrix. This is ok
// as the specular is only used on the strat map and never with texture
// transforms
#define CONST_LSPEC_CLR    11
#define CONST_CAM_LOOK     12

#define CONST_TEX_X1       11
#define CONST_TEX_X2       14
#define CONST_TEX_X3       17

    // additional lights
    #define CONST_L1_DIR       20
    #define CONST_L1_CLR       21
    #define CONST_L2_DIR       22
    #define CONST_L2_CLR       23

    // this overlaps with tex-x3
    #define CONST_L3_DIR       17
    #define CONST_L3_CLR       18
    #define CONST_L4_DIR       19

    // colour of light 4 is stored in 3 registers - w components
    // if you change these numbers, you need to update SHADER::upload_lights to match that
    #define CONST_L4_CLR_r     21
    #define CONST_L4_CLR_g     23
    #define CONST_L4_CLR_b     18

    // matrices for skinning
    #define CONST_MAT_PALETTE  24

#define ALL_ZERO c[CONST_CONSTS].zzzz
#define ONE      c[CONST_CONSTS].x
#define ZERO     c[CONST_CONSTS].z
#define FOG      c[CONST_CONSTS].y

#endif // FLEXIMESH_H

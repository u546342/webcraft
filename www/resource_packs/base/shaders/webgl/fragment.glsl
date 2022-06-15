#include<header>
#include<constants>

#include<global_uniforms>
#include<global_uniforms_frag>

#include<terrain_attrs_frag>

#include<crosshair_define_func>

#include<vignetting_define_func>

#include<manual_mip_define_func>

vec3 gamma(vec3 color){
    return pow(color, vec3(1.0/2.0));
}

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 sampleAtlassTexture (vec4 mipData, vec2 texClamped, vec2 biomPos) {
    vec2 texc = texClamped;

    vec4 color = texture(u_texture, texc * mipData.zw + mipData.xy);

    if (v_color.r >= 0.0) {
        vec4 color_mask = texture(u_texture, vec2(texc.x + u_blockSize * max(v_color.b, 1.), texc.y) * mipData.zw + mipData.xy);
        vec4 color_mult = texture(u_texture, biomPos);
        color.rgb += color_mask.rgb * color_mult.rgb;
    }

    return color;
}

void main() {

    vec2 texClamped = clamp(v_texcoord0, v_texClamp0.xy, v_texClamp0.zw);
    vec4 mipData = manual_mip (v_texcoord0, vec2(textureSize(u_texture, 0)));

    vec2 biome = v_color.rg * (1. - 0.5 * step(0.5, u_mipmap));

    float light = 1.0;
    float local_light = 0.0;
    float aoValue = 0.0;
    float caveSample = 0.0;
    float daySample = 0.0;
    float sun_light = 1.0;
    float aoSample = 0.0;

    // Game
    if(u_fogOn) {

        // Read texture
        vec4 color = sampleAtlassTexture (mipData, texClamped, biome);

        if (v_animInterp > 0.0) {
            color = mix(
                color,
                sampleAtlassTexture (mipData, texClamped + v_texcoord1_diff, biome),
                v_animInterp
            );
        }

        if(color.a < 0.1) discard;
        if (u_opaqueThreshold > 0.1) {
            if (color.a < u_opaqueThreshold) {
                discard;
            } else {
                color.a = 1.0;
            }
        }

        if(v_noCanTakeAO == 0.) {

            #include<local_light_pass>
            #include<ao_light_pass>
            #include<sun_light_pass>

            // available variables for light calculate
            // aoValue, aoSample, local_light, caveSample, daySample, sun_light, u_brightness
            // light = daySample * aoValue * (u_brightness * sun_light);
            // vec3 color_light = vec3(1., 1., 1.);

            // local
            light = local_light;

            // ao
            float totalAO = caveSample + daySample * u_brightness;
            totalAO = max(light, totalAO);
            totalAO = min(totalAO, 1.0 - aoSample);
            totalAO = max(totalAO, 0.075 * (1.0 - aoSample));
            light = mix(totalAO, light, u_aoDisaturateFactor);

            // sun
            light = light * sun_light;

            // Apply light
            // color.rgb *= light;
            vec3 color_light = vec3(light, light, light);
            color.rgb *= color_light;


        }

        outColor = color;

        #include<fog_frag>
        if(u_crosshairOn) {
            #include<crosshair_call_func>
        }
        #include<vignetting_call_func>

    } else {
        outColor = texture(u_texture, texClamped);
        if(outColor.a < 0.1) discard;
        outColor *= v_color;
    }

}
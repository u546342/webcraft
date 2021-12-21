precision highp float;

const float PI = 3.14;
// vignetting
const float outerRadius = .65, innerRadius = .4, intensity = .1;
const vec3 vignetteColor = vec3(0.0, 0.0, 0.0); //red
const vec3 sunColor = vec3(1., 0.93, 0.59);
const vec3 moonColor = vec3(0.22);

//
uniform samplerCube u_texture;
uniform float u_brightness;
uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_textureOn;
uniform vec4 u_fog;
uniform vec3 u_sunDir;

varying vec3 v_texCoord;
varying vec4 crosshair;

void drawCrosshair() {
    float w = u_resolution.x;
    float h = u_resolution.y;
    float x = gl_FragCoord.x;
    float y = gl_FragCoord.y;
    if((x > w / 2.0 - crosshair.w && x < w / 2.0 + crosshair.w &&
        y > h / 2.0 - crosshair.z && y < h / 2.0 + crosshair.z) || 
        (x > w / 2.0 - crosshair.z && x < w / 2.0 + crosshair.z &&
        y > h / 2.0 - crosshair.w && y < h / 2.0 + crosshair.w)
        ) {
            gl_FragColor.r = 1.0 - gl_FragColor.r;
            gl_FragColor.g = 1.0 - gl_FragColor.g;
            gl_FragColor.b = 1.0 - gl_FragColor.b;
            gl_FragColor.a = 1.0;
    }
}

void drawVignetting() {
    vec2 relativePosition = gl_FragCoord.xy / u_resolution - .5;
    relativePosition.y *= u_resolution.x / u_resolution.y;
    float len = length(relativePosition);
    float vignette = smoothstep(outerRadius, innerRadius, len);
    float vignetteOpacity = smoothstep(innerRadius, outerRadius, len) * intensity; // note inner and outer swapped to switch darkness to opacity
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vignetteColor, vignetteOpacity);
}

float circle(vec3 w, vec3 d, float s, float f) {
    float dist = distance(w, d) - s;

    return smoothstep(f, 1., 1. - dist);
}

void main() {
    vec4 out_color;
    vec3 norm = normalize(v_texCoord);
    vec3 sun = normalize(u_sunDir);

    float fogFade = smoothstep(0., 0.5, max(0., norm.y));
    float b = pow(u_brightness,  1. / 3.);

    //if(u_textureOn) {
    vec4 color = textureCube(u_texture, norm);
    out_color =  mix(u_fog, vec4(color.rgb * b, color.a), fogFade);

    //sun
    out_color = mix(out_color,  1.2 * vec4(sunColor, 1.), circle(norm, sun, 0.05, 0.95) * pow(fogFade, 1./ 2.));
    
    //moon
    vec3 moonPos = normalize(vec3(sun.z, -sun.y, 2.));
    out_color = mix(out_color,  vec4(moonColor, 1.), circle(norm, moonPos, 0.02, 0.99) * pow(fogFade, 1./ 2.));

    gl_FragColor = out_color;

    drawCrosshair();

    // vignetting
    drawVignetting();
}
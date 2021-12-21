precision highp float;

const float PI = 3.14;
// vignetting
const float outerRadius = .65, innerRadius = .4, intensity = .1;
const vec3 vignetteColor = vec3(0.0, 0.0, 0.0); //red
const vec3 sunColor = vec3(1., 0.93, 0.59);
const vec3 moonColor = vec3(0.9);

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

/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));
	 
	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
	 	
	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;
	 
	 /* 2. find four surflets and store them in d */
	 vec4 w, d;
	 
	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);
	 
	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);
	 
	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;
	 
	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}

float starLayer (vec3 w, float scale) {
    vec3 nn = -1. + 2. * fract(w * scale);
    float m =  1. - length(nn.xy);
    m = max(m, 1. - length(nn.xz));
    m = max(m, 1. - length(nn.zy));
    m = step(0.5, m);

    vec3 fuv = floor(scale * w) / scale;
    float f = simplex3d(vec3(scale) + fuv * 25.) * 0.5 + 0.5;

    return smoothstep(0.8, 0.85, f) * m;
}

vec4 stars (vec3 w) {
    float f = starLayer(w, 50.) + starLayer(w, 100.);
    float m = simplex3d(w * 10. + 5. * vec3(0., 0., u_time / 10000.)) * 0.5 + 0.5;

    m = smoothstep(0.4, 1., m);
    f *= m;
    f *= 2.;

    return vec4(f);
}

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
    vec4 overlay;

    vec3 norm = normalize(v_texCoord);
    vec3 sun = normalize(u_sunDir);

    float fogFade = smoothstep(0., 0.5, max(0., norm.y));
    float fogFade2  = sqrt(fogFade);

    float b = pow(u_brightness,  1. / 3.);

    float sunDisk = circle(norm, sun, 0.05, 0.95);
    //sun
    overlay = vec4(sunColor, sunDisk * fogFade2);

    //moon
    vec3 moonPos = normalize(vec3(sun.z, -sun.y, 2.));
    float moonDisk = circle(norm, moonPos, 0.02, 0.99);
    float moodGlow = circle(norm, moonPos, 0.05, 0.7) * 0.15;
 
    overlay += vec4(moonColor, moonDisk * fogFade2);
    overlay += stars(v_texCoord) * (1. - u_brightness) * fogFade2;

    vec4 color = textureCube(u_texture, norm);

    // fog
    out_color =  mix(u_fog, vec4(color.rgb * max(b, moodGlow), color.a), fogFade);

    // apply overlay
    out_color = mix(out_color, vec4(overlay.rgb * 0.5, 1.), overlay.a);

    gl_FragColor = out_color;

    drawCrosshair();

    // vignetting
    drawVignetting();
}
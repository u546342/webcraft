import { Resources } from "./resources.js";

const SETTINGS = {
    skyColor:               [0, 0, 0.8],
    fogColor:               [118 / 255, 194 / 255, 255 / 255, 1], // [185 / 255, 210 / 255, 255 / 255, 1],
    // fogColor:               [192 / 255, 216 / 255, 255 / 255, 1],
    fogUnderWaterColor:     [55 / 255, 100 / 255, 230 / 255, 1],
    fogAddColor:            [0, 0, 0, 0],
    fogUnderWaterAddColor:  [55 / 255, 100 / 255, 230 / 255, 0.45],
    fogDensity:             2.52 / 320,
    fogDensityUnderWater:   0.1,
    chunkBlockDist:         8,
};

const ENV_GRAD_COLORS = {
    [0]: 0x000000,
    [25]: 0x250a07,
    [36]: 0x963b25,
    [45]: 0xe3ad59,
    [55]: 0x13c5e9,
    [100]: 0x00d4ff,
}

function luminance (color) {
    const r = (color << 16 & 0xff) / 0xff;
    const g = (color << 8 & 0xff) / 0xff;
    const b = (color & 0xff) / 0xff;

    return  Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b );
}

function interpolateColor (a = 0, b = 0, factor = 0) {
    factor = Math.min(1, Math.max(0, factor));

    const ar = (a >> 16 & 0xff);
    const ag = (a >> 8 & 0xff);
    const ab = (a >> 0 & 0xff);

    const br = (b >> 16 & 0xff);
    const bg = (b >> 8 & 0xff);
    const bb = (b >> 0 & 0xff);
    
    return (
        (ar * (1 - factor) + br * factor) << 16 |
        (ag * (1 - factor) + bg * factor) << 8 |
        (ab * (1 - factor) + bb * factor) << 0
    );
}

function interpolateGrad (pattern, factor = 0) {
    const int = Math.min (100, Math.max(0,  (factor * 100) | 0));

    if (int in pattern) {
        return pattern[int];
    }

    let rightKey = 0;
    let leftKey = 0;

    for(const k in pattern) {
        rightKey = +k;

        if (rightKey >= int) {
            break;
        }

        leftKey = +k;
    }

    const relative = (int - leftKey) / (rightKey - leftKey);

    return interpolateColor(pattern[leftKey], pattern[rightKey], relative);
}

export class Environment {
    constructor() {
        this.fogColor = [...SETTINGS.fogColor];
        this.fogColorBrigtness = [...this.fogColor];
        this.fogAddColor = [...SETTINGS.fogAddColor];
        this.skyColor = [...SETTINGS.skyColor];
        this.fogDensity = SETTINGS.fogDensity;
        this.chunkBlockDist = SETTINGS.chunkBlockDist;
        this.sunDir = [0.9593, 1.0293, 0.6293];

        this.underwater = false;
        this.brightness = 1.;

        this.skyBox = null;
    }

    get time() {
        return performance.now();
    }

    /**
     * 
     * @param {Renderer} render 
     */
    init (render) {
        const  {
            renderBackend
        }  = render;

        this.skyBox = renderBackend.createCubeMap({
            code: Resources.codeSky,
            uniforms: {
                u_brightness: 1.0,
                u_textureOn: true
            },
            sides: [
                Resources.sky.posx,
                Resources.sky.negx,
                Resources.sky.posy,
                Resources.sky.negy,
                Resources.sky.posz,
                Resources.sky.negz
            ]
        });
    }

    initSky() {
        return this.skyBox = this.renderBackend.createCubeMap({
            code: Resources.codeSky,
            uniforms: {
                u_brightness: 1.0,
                u_textureOn: true
            },
            sides: [
                Resources.sky.posx,
                Resources.sky.negx,
                Resources.sky.posy,
                Resources.sky.negy,
                Resources.sky.posz,
                Resources.sky.negz
            ]
        });
    }

    setBrightness(value) {
        const mult = Math.min(1, value * 2)

        this.brightness = value;
        this.fogColorBrigtness = [
            this.fogColor[0] * (value * mult),
            this.fogColor[1] * (value * mult),
            this.fogColor[2] * (value * mult),
            this.fogColor[3]
        ];
    }

    computeFogRelativeSun() {
        this.sunDir = [
            0, Math.cos(this.time / 10000), -Math.sin(this.time / 10000)
        ];

        const sun = this.sunDir;
        const len = Math.sqrt(sun[0] * sun[0] + sun[1] * sun[1] + sun[2] * sun[2]);
        const dir = [sun[0] / len, sun[1] / len, sun[2] / len];

        // up vector only is Y
        const factor = Math.max(0, dir[1]);
        const color = interpolateGrad(ENV_GRAD_COLORS, factor);

        this.fogColor = [
            ((color >> 16) & 0xff) / 0xff,
            ((color >> 8) & 0xff) / 0xff,
            ((color >> 0) & 0xff) / 0xff,
            1
        ];

        const lum = luminance(color) / luminance(ENV_GRAD_COLORS[100]);
        this.fogColorBrigtness = this.fogColor;
        this.brightness = lum * lum;
    }

    setEnvState ({
        underwater = this.underwater,
        fogDensity = this.fogColor,
        fogColor = this.fogColor,
        fogAddColor = this.fogAddColor,
        chunkBlockDist = this.chunkBlockDist,
    }) {
        this.underwater = underwater;
        this.fogDensity = fogDensity;
        this.fogColor = [...fogColor];
        this.fogAddColor = [...fogAddColor];
        this.chunkBlockDist = chunkBlockDist;

        this.setBrightness(this.brightness);
    }

    /**
     * Sync environment state with uniforms
     * @param {Renderer} render 
     */
    sync (render) {
        const gu                 = render.globalUniforms;
        const { width, height }  = render.renderBackend;

        gu.chunkBlockDist       = this.chunkBlockDist;

        gu.fogAddColor          = this.underwater ? SETTINGS.fogUnderWaterAddColor : this.fogAddColor;
        gu.fogColor             = this.underwater ? SETTINGS.fogUnderWaterColor : this.fogColorBrigtness;
        gu.brightness           = this.brightness;
        //
        gu.time                 = this.time;
        gu.fogDensity           = this.fogDensity;
        gu.resolution           = [width, height];
        gu.testLightOn          = this.testLightOn;
        gu.sunDir               = this.sunDir;
        
        gu.update();
    }

    /**
     * 
     * @param {Renderer} render 
     */
    draw (render) {
        if (!this.skyBox) {
            return;
        }
 
        const { width, height }  = render.renderBackend;

        if(this.skyBox.shader.uniforms) {
            this.skyBox.shader.uniforms.u_textureOn.value = this.brightness == 1 && !this.underwater;
            this.skyBox.shader.uniforms.u_brightness.value = this.brightness;
        } else {
            this.skyBox.shader.brightness = this.brightness;
        }
        this.skyBox.draw(render.viewMatrix, render.projMatrix, width, height);
    }
}
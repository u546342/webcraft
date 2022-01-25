//@ts-check
import BaseRenderer, {BaseCubeGeometry, BaseCubeShader, BaseTexture, CubeMesh} from "../BaseRenderer.js";
import {WebGLMaterial} from "./WebGLMaterial.js";
import {WebGLTerrainShader} from "./WebGLTerrainShader.js";
import {WebGLBuffer} from "./WebGLBuffer.js";
import {Helpers, Mth} from "../../helpers.js";
import {Resources} from "../../resources.js";
import {WebGLTexture3D} from "./WebGLTexture3D.js";
import {WebGLRenderTarget} from "./WebGLRenderTarget.js";
import { WebGLUniversalShader } from "./WebGLUniversalShader.js";

/**
 * Shader interface
 * @typedef {Object} IWebGLShader
 * @property {WebGLProgram} program
 * @property {number} boundID
 * @property {Function} unbind
 */

const TEXTURE_TYPE_FORMAT = {
    'rgba8u': {
        format: 'RGBA', type : 'UNSIGNED_BYTE'
    },
    'depth24stencil8': {
        format: 'DEPTH_STENCIL', internal: 'DEPTH24_STENCIL8' , type : 'UNSIGNED_INT_24_8'
    }
}

const TEXTURE_FILTER_GL = {
    'linear': 'LINEAR',
    'nearest': 'NEAREST'
}

const TEXTURE_MODE = {
    '2d': 'TEXTURE_2D',
    'cube': 'TEXTURE_CUBE_MAP',
    '3d': 'TEXTURE_3D',
}

export class WebGLCubeShader extends WebGLUniversalShader {

    constructor(context, options) {
        super(context, options);

        /**
         *
         * @type {WebGLTexture}
         */
        this.texture = context.createTexture({
            source: options.sides
        });

        this.texture.bind();
        // we already can use uniforms
        // make only set default values
        this._makeUniforms({
            'u_texture': this.texture, // load default texture to 0 slot
            'u_viewMatrix': new Float32Array(16),
            'u_projMatrix': new Float32Array(16),
            'u_resolution': [1, 1],
        });

    }

    set resolution(v) {
        this.uniforms['u_resolution'].value = v;
    }

    get resolution() {
        return this.uniforms['u_resolution'];
    }

    /**
     * @deprecated
     */
    get lookAt() {
        return this.uniforms['u_viewMatrix'].value;
    }

    /**
     * @deprecated
     */
    get proj() {
        return this.uniforms['u_projMatrix'].value;
    }

    bind(force = false) {
        //this.texture.bind(0);

        super.bind(force);
    }

}

export class WebGLCubeGeometry extends BaseCubeGeometry {
    constructor(context, options) {
        super(context, options);

        this.vao = null;
    }

    bind(shader) {
        const { gl } = this.context;

        if (this.vao) {
            this.context.gl.bindVertexArray(this.vao);
            return;
        }

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertex.bind();
        this.index.bind();

        gl.vertexAttribPointer(shader.attrs['a_vertex'].location, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attrs['a_vertex'].location);
    }

    unbind() {
        this.context.gl.bindVertexArray(null);
    }

}

export class WebGLTexture extends BaseTexture {
    constructor (context, options) {
        super(context, options);

        this.bindID = -1;
    }

    _applyStyle() {
        const {
            gl
        } = this.context;

        const type = gl[TEXTURE_MODE[this.mode]] || gl.TEXTURE_2D;

        // texture can be not bound if location is same
        // force it
        let bounded = false;

        if (this.minFilter !== this._lastMinFilter) {
            this._lastMinFilter = this.minFilter;

            gl.bindTexture(gl[TEXTURE_MODE[this.mode]], this.texture);

            bounded = true;

            gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl[TEXTURE_FILTER_GL[this.minFilter]] || gl.LINEAR);
        }

        if (this.magFilter !== this._lastMagFilter) {
            this._lastMagFilter = this.magFilter;

            if (!bounded) {
                gl.bindTexture(gl[TEXTURE_MODE[this.mode]], this.texture);
            }

            gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl[TEXTURE_FILTER_GL[this.magFilter]] || gl.LINEAR);
        }
    }

    /**
     * Bind texture to location
     * @param {number} [location] location where it was bound
     * @returns {number} actual slot id
     */
    bind(location = -1) {
        /**
         * @type {WebGLRenderer}
         */
        const context = this.context;

        location = context.bindTextureToSlot(this, location);

        if (this.dirty) {
            this.upload();

            return location;
        }

        this._applyStyle();

        return location;
    }

    upload() {
        /**
         * @type {WebGL2RenderingContext}
         */
        const gl = this.context.gl;
        const mode = Array.isArray(this.source) ? 'cube' : '2d';

        this.mode = mode;

        const t = this.texture = this.texture || gl.createTexture();
        const type = gl[TEXTURE_MODE[mode]] || gl.TEXTURE_2D;
        const formats = TEXTURE_TYPE_FORMAT[this.type] || TEXTURE_TYPE_FORMAT.rgba8u;

        gl.bindTexture(type, t);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        if (mode === '2d') {
            if (this.source) {
                gl.texImage2D(
                    type,
                    0,
                    gl[formats.internal || formats.format],
                    gl[formats.format],
                    gl[formats.type],
                    this.source
                );
            } else {
                gl.texImage2D(
                    type,
                    0,
                    gl[formats.internal || formats.format],
                    this.width,
                    this.height,
                    0,
                    gl[formats.format],
                    gl[formats.type],
                    null
                );
            }

            this._applyStyle();
            super.upload();
            return;
        }

        // cube is only RGBA
        for(let i = 0; i < 6; i ++) {
            const start = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            if (this.source) {
                gl.texImage2D(start + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source[i]);
            } else {
                gl.texImage2D(start + i, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
        }

        gl.generateMipmap(type);
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        super.upload();
    }

    destroy() {
        if (!this.texture) {
            return;
        }

        // not destroy shared texture that used
        if(this.isUsed) {
            return;
        }

        super.destroy();

        this.context.freeTextureSlots(this);

        const  { gl } = this.context;

        gl.deleteTexture(this.texture);

        this.texture = null;
        this.source = null;
        this.width = this.height = 0;
    }

}

export default class WebGLRenderer extends BaseRenderer {

    constructor(view, options) {
        super(view, options);
        /**
         *
         * @type {WebGL2RenderingContext}
         */
        this.gl = null;

        /**
         * How many slots we can accupant as active textures
         */
        this.maxActiveTextures = 0;

        /**
         * id => Texture binding
         * @type {Array<WebGLTexture>}}
         */
        this._activeTextures = [];

        this._textureBindId = -1;

        /**
         * @type {IWebGLShader}
         */
        this._shader = null;

        // test only
        /**
         * @type {WebGLRenderTarget}
         */
        this._mainFrame = null;

        this.depthState = {
            write: true,
            test: true,
        }
    }

    async init(args) {
        super.init(args);

        /**
         * @type {WebGL2RenderingContext}
         */
        const gl = this.view.getContext('webgl2', {...this.options, stencil: true});;

        this.gl = gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        this.maxActiveTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        this._emptyTex3D.bind();

        return Promise.resolve(this);
    }

    resize(w, h) {
        if (this.size.width === w && this.size.height === h) {
            return;
        }
        super.resize(w, h);
        this.view.width = w;
        this.view.height = h;
        this.resolution = [w, h];
    }

    _configure() {
        super._configure();

        /*
        if (this._mainFrame) {
            this._mainFrame.destroy();
        }

        this._mainFrame = this.createRenderTarget({
            width: this.size.width,
            height: this.size.height,
            depth: true,
        });
        */
    }

    /**
     * 
     * @param {WebGLTexture} texture 
     * @param {number} [slot]
     * @returns {number} actual bounded slot
     */
    bindTextureToSlot(texture, slot) {
        if (!texture) {
            return -1;
        }

        const {
            gl, _activeTextures
        } = this;

        let targetSlot = -1;
        let activate = true;

        // check that we can bind to queried slot
        if (slot >= 0) {
            const old = _activeTextures[slot];
            
            targetSlot = slot;

            // we can bound texture to same slot
            // not require to activate it
            if (old == texture) {
                activate = false;

            }

        // select slot automaticly 
        } else {
            targetSlot = _activeTextures.indexOf(texture)

            // our slot already activated to same texture
            if (targetSlot >= 0) {
                activate = false;

            // there was not bounds before
            } else {
                // store to empty slot if exist
                if (_activeTextures.length < this.maxActiveTextures) {
                    targetSlot = _activeTextures.push(texture) - 1;
                // find older texture on slots
                } else {
                    let id = Infinity;
                    let slot = -1;

                    for(let i = 0; i < _activeTextures.length; i++) {
                        let t = _activeTextures[i];

                        // empty slot
                        // bind to it
                        if (!t) {
                            slot = i;
                            break;
                        }

                        if (t.bindID < id && t.bindID < this._textureBindId) {
                            slot = i;
                            id = t.bindID;
                        }
                    }

                    if (slot === -1) {
                        throw new Error('[Texture error] Empty slots not exist for pass ' + this.passID)
                        return - 1;
                    }

                    targetSlot = slot;
                }
            }
        }

        this._activeTextures[targetSlot] = texture;

        texture.bindID = this._textureBindId ++;

        if (activate) {
            gl.activeTexture(gl.TEXTURE0 + targetSlot);
            gl.bindTexture(gl[TEXTURE_MODE[texture.mode]] || gl.TEXTURE_2D, texture.texture);
        }

        return targetSlot;
    }

    /**
     * Remove texture slot referencing
     * @param {WebGLTexture} texture 
     */
    freeTextureSlots(texture) {
        for(let i = 0; i < this._activeTextures.length; i ++) {
            if (this._activeTextures[i] === texture) {
                this._activeTextures[i] = null;
            }
        }

        // shrink size
        // pop while older slots is empty
        while(this._activeTextures.length) {
            if (this._activeTextures[this._activeTextures.length - 1]) {
                break;
            }

            this._activeTextures.pop();
        } 
    }

    clear({clearDepth = true, clearColor = true} = {}) 
    {
        const {
            gl, _clearColor
        } = this;

        const mask = (~~clearDepth * (gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)) | (~~clearColor * gl.COLOR_BUFFER_BIT);

        mask && gl.clearColor(
            _clearColor[0],
            _clearColor[1],
            _clearColor[2],
            _clearColor[3]
        );

        mask && gl.clear(mask);        
    }

    createRenderTarget(options) {
        return new WebGLRenderTarget(this, options);
    }

    createMaterial(options) {
        return new WebGLMaterial(this, options);
    }

    createTexture(options) {
        let texture;

        if (options.shared) {
            // can use exist texture
            texture = this._textures.find(t => t && t.isSimilar && t.isSimilar(options));
        }

        if (!texture) {
            texture = new WebGLTexture(this, options);
        }

        texture.usage ++;

        return texture;
    }

    createProgram({vertex, fragment}, preprocessArgs = {}) {
        return Helpers.createGLProgram(this.gl, {
            vertex: this.preprocess(vertex, preprocessArgs),
            fragment: this.preprocess(fragment, preprocessArgs)
        });
    }

    createTexture3D(options) {
        return new WebGLTexture3D(this, options);
    }

    createShader(options) {
        return new WebGLTerrainShader(this, options);
    }

    async createResourcePackShader(options) {
        let shaderCode = await Resources.loadWebGLShaders(options.vertex, options.fragment);
        return this.createShader(shaderCode);
    }

    createBuffer(options) {
        return new WebGLBuffer(this, options);
    }

    drawMesh(geom, material, a_pos = null, modelMatrix = null, draw_type) {
        if (geom.size === 0) {
            return;
        }
        let gl = this.gl;
        if(!draw_type) {
            draw_type = 'triangles';
        }
        switch(draw_type) {
            case 'triangles': {
                draw_type = gl.TRIANGLES;
                break;
            }
            case 'line_loop': {
                draw_type = gl.LINE_LOOP;
                break;
            }
        }
        material.bind();
        geom.bind(material.shader);
        material.shader.updatePos(a_pos, modelMatrix);
        gl.drawArraysInstanced(draw_type, 0, 6, geom.size);
        // stat
        this.stat.drawquads += geom.size;
        this.stat.drawcalls++;
    }

    /**
     *
     * @param {import("../BaseRenderer.js").PassOptions} options
     */
    beginPass(options = {}) {
        super.beginPass(options);

        const {
            gl, _target, _viewport
        } = this;

        gl.bindFramebuffer(
            gl.FRAMEBUFFER,
            _target ? _target.framebuffer : null
        );

        gl.viewport(..._viewport);
 
        this.clear(options);
    }

    /**
     * @deprecated
     * @param {} fogColor 
     */
    beginFrame(fogColor) {
        this.beginPass({fogColor})
    }

    /**
     * @deprecated
     */
    endFrame() {
        // this.blitRenderTarget();
        // reset framebufer
    }

    /**
     * Blit color from current attached framebuffer to specific area of canvas
     * @param {{x?: number, y?: number, w?: number, h?: number}} param0
     * @returns
     */
    blitRenderTarget({x = 0, y = 0, w = null, h = null} = {}) {
        /**
         * @type {WebGLRenderTarget}
         */
        const target = this._target;
        if (!target) {
            return;
        }

        const gl = this.gl;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.blitFramebuffer(
            0, 0, target.width, target.height,
            x, y, (w || this.size.width) + x, (h || this.size.height) + y,
            gl.COLOR_BUFFER_BIT, gl.LINEAR
        );

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    }

    /**
     * Blit one render target to another size-to-size
     * @param {WebGLRenderTarget} fromTarget
     * @param {WebGLRenderTarget} toTarget
    */
    blit(fromTarget = null, toTarget = null) {
        fromTarget = fromTarget || null;
        toTarget = toTarget || null;

        if (fromTarget === toTarget) {
            throw new TypeError('fromTarget and toTarget should be different');
        }

        /**
         * @type {WebGLRenderTarget}
         */
        const target = this._target;
        const gl = this.gl;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fromTarget ? fromTarget.framebuffer : null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, toTarget ? toTarget.framebuffer : null);

        const fromSize = fromTarget ? fromTarget : this.size;
        const toSize = toTarget ? toTarget : this.size;
        const fromDepth = fromTarget ? fromTarget.options.depth : true;
        const toDepth = toTarget ? toTarget.options.depth : true;
        const bits = (toDepth && fromDepth)
            ? (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
            : gl.COLOR_BUFFER_BIT;


        gl.blitFramebuffer(
            0, 0, fromSize.width, fromSize.height,
            0, 0, toSize.width, toSize.height,
            bits, gl.LINEAR
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    }

    createCubeMap(options) {
        return new CubeMesh(new WebGLCubeShader(this, options), new WebGLCubeGeometry(this, options));
    }

    drawCube(cube) {
        if (this._mat) {
            this._mat.unbind();
            this._mat = null;
        }
        cube.shader.bind();
        cube.geom.bind(cube.shader);

        const  {
            gl
        } = this;

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        // stat
        this.stat.drawquads += 6;
        this.stat.drawcalls++;
    }

    /**
     * Read pixels from framebuffer
     * @returns {Uint8Array}
     */
    toRawPixels() {
        const buffer = new Uint8Array(this.view.width * this.view.height * 4);
        this.gl.readPixels(0,0, this.view.width, this.view.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, buffer);
        return buffer;
    }

    /**
     * Push shader to active slot
     * @internal
     * @param { IWebGLShader } shader
     * @param {boolean} [force] force rebound 
     * @returns {boolean} true when shader bounded firstly
     */
    useShader(shader, force) {
        if (shader == this._shader && !force) {
            return false;
        }

        if (this._shader && this._shader.unbind) {
            this._shader.unbind();
        }

        this._shader = shader;
        this._shader.boundID = this._shader.boundID | 0 + 1;
        this.gl.useProgram(shader.program);

        return true;
    }

    async screenshot() {
        const buffer = this.toRawPixels();
        let width = this.view.width;
        let height = this.view.height;
        for (let i = 0; i < buffer.length; i += 4) {
            const a = buffer[i + 3] / 0xff;
            if (!a) {
                continue;
            }
            buffer[i + 0] = Math.round(buffer[i + 0] / a);
            buffer[i + 1] = Math.round(buffer[i + 1] / a);
            buffer[i + 2] = Math.round(buffer[i + 2] / a);
        }
        const data = new ImageData(width, height);
        for(let i = 0; i < height; i ++) {
            const invi = height - i - 1;
            data.data.set(
                buffer.subarray(invi * width * 4, (invi + 1) * width * 4),
                i * width * 4);
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        ctx.putImageData(data, 0, 0);
        ctx.canvas.toBlob(function(blob) {
            ctx.canvas.width = ctx.canvas.height = 0;
            // let filefromblob = new File([blob], 'image.png', {type: 'image/png'});
            Helpers.downloadBlobPNG(blob, 'screenshot.png'); // filefromblob);
        }, 'image/png');
    }

}

/**
 *
 * @param {HTMLCanvasElement} view
 */
WebGLRenderer.test = function(view, options = {}) {
    /**
     * @type {*}
     */
    const context = view.getContext('webgl2', options);
    return !!context;
}

WebGLRenderer.kind = 'webgl';

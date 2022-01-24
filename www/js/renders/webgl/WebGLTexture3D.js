import {BaseTexture3D} from "../BaseRenderer.js";

const TEXTURE_FILTER_GL = {
    'linear': 'LINEAR',
    'nearest': 'NEAREST'
}

const FORMATS = {
    'rgba8unorm': 'RGBA',
    'u8': 'ALPHA',
    'u4_4_4_4': 'RGBA',
}

const TYPES = {
    'rgba8unorm': 'UNSIGNED_BYTE',
    'u8': 'UNSIGNED_BYTE',
    'u4_4_4_4': 'UNSIGNED_SHORT_4_4_4_4',
}

export class WebGLTexture3D extends BaseTexture3D {
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

        return location;
    }

    upload() {
        const { gl } = this.context;
        const { data } = this;
        /**
         * @type {WebGLTexture}
         */
        this.texture = this.texture || gl.createTexture();
        const target = gl.TEXTURE_3D;
        gl.bindTexture(target, this.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (this.prevLength !== data.length) {
            this.prevLength = data.length;
            gl.texImage3D(target, 0, gl[FORMATS[this.type]],
                this.width, this.height, this.depth,
                0, gl[FORMATS[this.type]], gl[TYPES[this.type]], data);
        } else {
            gl.texSubImage3D(target, 0, 0, 0, 0,
                this.width, this.height, this.depth,
                gl[FORMATS[this.type]], gl[TYPES[this.type]], data);
        }
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl[TEXTURE_FILTER_GL[this.minFilter]] || gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl[TEXTURE_FILTER_GL[this.magFilter]] || gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        super.upload();
    }

    destroy() {
        if (!this.texture) {
            return;
        }
        const  { gl } = this.context;

        gl.deleteTexture(this.texture);

        this.context.freeTextureSlots(this);

        this.texture = null;
        this.source = null;
        this.width = this.height = this.depth = 0;
        super.destroy();
    }
}

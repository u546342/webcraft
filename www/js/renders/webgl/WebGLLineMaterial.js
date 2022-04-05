import {BLEND_MODES} from "../BaseRenderer.js";
import {TerrainTextureUniforms} from "../common.js";
import {BaseLineMaterial} from "../BaseLine";

export class WebGLLineMaterial extends BaseLineMaterial {
    constructor(context, options) {
        super(context, options);

        this._dirty = true;
    }

    bind() {
        const { gl } = this.context;
        const { shader } = this;

        this.shader.bind();

        const prevMat = this.shader._material;
        if (prevMat === this && !this._dirty)
        {
            return;
        }
        if (prevMat)
        {
            prevMat.unbind();
        }

        this.shader._material = this;
        if (this.ignoreDepth) {
            gl.disable(gl.DEPTH_TEST);
        }

        const tex = this.texture || this.shader.texture;
        if (this.blendMode !== BLEND_MODES.NORMAL) {
            switch (this.blendMode) {
                case BLEND_MODES.ADD:
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE); break;
                case BLEND_MODES.MULTIPLY:
                    gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); break;
                case BLEND_MODES.SCREEN:
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); break;
                case BLEND_MODES.INVERT:
                    gl.blendFuncSeparate(gl.ONE_MINUS_DST_COLOR, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); break;
            }
        }

        this._dirty = false;
    }

    unbind() {
        const { gl } = this.context;
        if (this.ignoreDepth) {
            gl.enable(gl.DEPTH_TEST);
        }
        if (this.blendMode !== BLEND_MODES.NORMAL) {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
    }

    updatePos(addPos, modelMatrix = null) {
        const { gl } = this.context;
        const { camPos } = this.shader;

        if (addPos) {
            gl.uniform3f(this.u_add_pos, pos.x - camPos.x, pos.y - camPos.y, pos.z - camPos.z);
        } else {
            gl.uniform3f(this.u_add_pos, -camPos.x,  -camPos.y, -camPos.z);
        }

        gl.uniform3f(this.u_add_pos, -camPos.x,  -camPos.y, -camPos.z);

        if (modelMatrix) {
            gl.uniformMatrix4fv(this.uModelMatrix, false, modelMatrix);
        }
    }
}

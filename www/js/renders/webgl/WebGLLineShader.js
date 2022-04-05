import {BaseLineShader} from "../BaseLine.js";

const lineVert = `
`;
const lineFrag = `
`;


export class WebGLLineShader extends BaseLineShader {
    /**
     *
     * @param {WebGLRenderer} context
     * @param {*} options
     */
    constructor(context, options) {
        super(context, options);

        const { gl } = context;
        const program  = context.createProgram(options.code, {
        });

        this.uProjMat           = gl.getUniformLocation(program, 'uProjMatrix');
        this.uModelMatrix       = gl.getUniformLocation(program, 'u_worldView');
        this.uModelMat          = gl.getUniformLocation(program, 'uModelMatrix');

        this.u_add_pos          = gl.getUniformLocation(program, 'u_add_pos');
        this.u_camera_pos       = gl.getUniformLocation(program, 'u_camera_pos');
        this.u_resolution       = gl.getUniformLocation(program, 'u_resolution');

        this.a_position         = gl.getAttribLocation(program, 'a_position');
        this.a_lineWidth        = gl.getAttribLocation(program, 'a_uvCenter');
        this.a_color            = gl.getAttribLocation(program, 'a_color');

        this.hasModelMatrix = false;

        this._material = null;

        this.globalID = -1;
        this.program = program;
    }

    bind(force = false) {
        const {gl} = this.context;
        const prevShader = this.context._shader;
        if (prevShader === this && !force)
        {
            this.update();
            return;
        }
        if (prevShader) {
            prevShader.unbind();
        }
        this.context._shader = this;
        gl.useProgram(this.program);
        this.update();
    }

    unbind() {
        if (this._material)
        {
            this._material.unbind();
            this._material = null;
        }
        this.context._shader = null;
    }

    update() {
        const { gl } = this.context;
        const gu = this.globalUniforms;
        if (this.globalID === gu.updateID) {
            return;
        }
        this.globalID = gu.updateID;

        gl.uniformMatrix4fv(this.uModelMatrix, false, gu.viewMatrix);
        gl.uniformMatrix4fv(this.uProjMat, false, gu.projMatrix);
        gl.uniformMatrix4fv(this.uModelMat, false, this.modelMatrix);
        this.hasModelMatrix = false;
        // gl.uniform1f(this.u_fogDensity, this.fogDensity);
        gl.uniform3f(this.u_camera_pos, gu.camPos.x, gu.camPos.z, gu.camPos.y);
        gl.uniform2fv(this.u_resolution, gu.resolution);

    }

    updatePos(pos, modelMatrix) {
        const { gl } = this.context;
        const {camPos} = this.globalUniforms;
        if (pos) {
            gl.uniform3f(this.u_add_pos, pos.x - camPos.x, pos.z - camPos.z, pos.y - camPos.y);
        } else {
            gl.uniform3f(this.u_add_pos, -camPos.x, -camPos.z, -camPos.y);
        }
        if (modelMatrix) {
            gl.uniformMatrix4fv(this.uModelMat, false, modelMatrix);
            this.hasModelMatrix = true;
        } else {
            if (this.hasModelMatrix) {
                gl.uniformMatrix4fv(this.uModelMat, false, this.modelMatrix);
            }
            this.hasModelMatrix = false;
        }
    }

}

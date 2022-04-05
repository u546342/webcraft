import {BaseShader, BLEND_MODES} from "./BaseRenderer";
import {Color} from "../helpers";
import glMatrix from "../../vendors/gl-matrix-3.3.min";

const {mat4} = glMatrix;

export class BaseLineShader extends BaseShader {
    constructor(context, options) {
        super(context, options);
        this.globalUniforms = context.globalUniforms;
        this.modelMatrix = mat4.create();
        this.addPos = [0,0,0];
        this.modelMatrix = mat4.create();
    }

    bind() {
    }

    unbind() {

    }

    update() {
    }
}

export class BaseLineMaterial {
    constructor(context, options) {
        this.context = context;
        this.options = options;
        this.shader = options.shader;
        this.ignoreDepth = options.ignoreDepth || false;
        this.blendMode = options.blendMode || BLEND_MODES.NORMAL;
    }

    destroy() {
        this.shader = null;
        this.context = null;
        this.options = null;
    }
}
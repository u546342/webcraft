[[block]] struct Uniforms {
  lookAt : mat4x4<f32>;
  proj : mat4x4<f32>;
  brightness: f32;
};

struct GBufferOutput {
  [[location(0)]] color : vec4<f32>;
};

[[group(0), binding(0)]] var<uniform> ubo : Uniforms;
[[group(0), binding(1)]] var u_sampler: sampler;
[[group(0), binding(2)]] var u_texture: texture_cube<f32>;

struct VertexOutput {
  [[builtin(position)]] pos : vec4<f32>;
  [[location(0)]] uv : vec3<f32>;
};

[[stage(vertex)]]
fn main_vert([[location(0)]] position : vec3<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.pos = ubo.proj * ubo.lookAt * vec4<f32>(position, 1.0);
    output.uv = position;

    return output;
}

[[stage(fragment)]]
fn main_frag([[location(0)]] uv: vec3<f32>) -> GBufferOutput {
    var color: vec4<f32> = textureSample(u_texture, u_sampler, uv);

    var out: GBufferOutput;
    out.color = vec4<f32>(color.rgb * ubo.brightness, color.a);

    return out;
}

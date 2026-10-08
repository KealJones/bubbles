import { resolveParams } from 'amazing-glass/core';
import { MAX_SHAPES, type FilmShape } from './BubblePhysics';

/*
 * The smooth distance-field union and refractive rim profile are adapted from
 * Amazing Glass, Copyright (c) 2026 Ivan Tomac (MIT).
 * Full license: public/amazing-glass-LICENSE.txt.
 * Pavel Dobryakov's live fluid simulation supplies the advected film thickness.
 * This renderer adds soap-film interference, surface tension and clear centers.
 */
const MATERIAL = resolveParams('lens', {
  blur: 0, bezel: 0.6, depth: 2.4, dispersion: 0.4, maxBezel: 60, rimWidth: 2.4,
});

const VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0., 1.); }
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D fluid;
uniform vec2 size;
uniform float pixelRatio;
uniform float time;
uniform vec4 optics;
uniform float rimWidth;
uniform int count;
uniform vec4 shapes[24];
uniform vec4 motion[24];
out vec4 outColor;
const float PI = 3.14159265359;

float bubbleDistance(vec2 p, int i) {
  vec2 q = (p - shapes[i].xy) / shapes[i].zw;
  float angle = atan(q.y, q.x);
  float wave = sin(angle * 3. + time * 1.4 + motion[i].x) * .65
             + sin(angle * 5. - time * .9 + motion[i].x * 1.7) * .35;
  return (length(q) - 1. - wave * motion[i].y) * min(shapes[i].z, shapes[i].w);
}
float smoothUnion(float a, float b, float k) {
  k = max(k, .001);
  float h = max(k - abs(a - b), 0.) / k;
  return min(a, b) - h * h * k * .25;
}
float field(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 24; i++) {
    if (i >= count) break;
    d = smoothUnion(d, bubbleDistance(p, i), motion[i].z);
  }
  return d;
}
float rimHeight(float t) { return pow(1. - pow(1. - t, 4.), .25); }
float refraction(float t, float bezel) {
  if (t >= 1.) return 0.;
  float t0 = max(t, .001);
  float slope = (rimHeight(min(t0 + .001, 1.)) - rimHeight(t0)) * optics.y * 1000.;
  float incidence = atan(slope);
  return bezel * optics.y * tan(incidence - asin(sin(incidence) / 1.45));
}
// A soap-film palette, indexed by the transported liquid rather than a circle gradient.
vec3 interference(float thickness) {
  float t = fract(thickness) * 6.;
  vec3 a, b;
  if (t < 1.) { a=vec3(.06,.72,.92); b=vec3(.16,.19,.85); }
  else if (t < 2.) { a=vec3(.16,.19,.85); b=vec3(.78,.13,.78); }
  else if (t < 3.) { a=vec3(.78,.13,.78); b=vec3(1.,.35,.55); }
  else if (t < 4.) { a=vec3(1.,.35,.55); b=vec3(1.,.83,.26); }
  else if (t < 5.) { a=vec3(1.,.83,.26); b=vec3(.30,.90,.57); }
  else { a=vec3(.30,.90,.57); b=vec3(.06,.72,.92); }
  return mix(a, b, smoothstep(0., 1., fract(t)));
}
vec3 readFluid(vec2 p) {
  vec2 uv = clamp(p / size, vec2(.003), vec2(.997));
  return texture(fluid, vec2(uv.x, 1. - uv.y)).rgb;
}
void main() {
  if (count == 0) { outColor = vec4(0.); return; }
  vec2 p = vec2(gl_FragCoord.x, size.y * pixelRatio - gl_FragCoord.y) / pixelRatio;
  float d = field(p);
  if (d > 1.5) { outColor = vec4(0.); return; }
  float nearest = 1e5, second = 1e5;
  float radius = 80.;
  vec2 center = vec2(0.);
  for (int i = 0; i < 24; i++) {
    if (i >= count) break;
    float v = bubbleDistance(p, i);
    if (v < nearest) {
      second = nearest; nearest = v;
      radius = min(shapes[i].z, shapes[i].w);
      center = shapes[i].xy;
    } else { second = min(second, v); }
  }
  vec2 grad = vec2(field(p + vec2(.65,0.)) - field(p - vec2(.65,0.)),
                   field(p + vec2(0.,.65)) - field(p - vec2(0.,.65)));
  vec2 normal = grad / max(length(grad), .0001);
  float depth = max(0., -d);
  float bezel = min(radius * 2. * optics.x, optics.w);
  float bend = refraction(clamp(depth / bezel, 0., 1.), bezel);
  vec2 bent = p - normal * bend;
  // Dispersion is applied to the flowing film itself, including the shared neck.
  vec3 liquid = vec3(readFluid(p - normal * bend * (1. + optics.z)).r,
                     readFluid(bent).g, readFluid(p - normal * bend * (1. - optics.z)).b);
  vec3 neighbor = readFluid(bent + vec2(2.4, 1.8));
  float variation = length(liquid - neighbor);
  float film = dot(liquid, vec3(1.9, 1.3, -1.4));
  float thickness = .16 + film * 5.5 + liquid.b * liquid.g * 7.;
  vec3 color = interference(thickness);
  float contour = .72 + .28 * smoothstep(-.8, .8, sin(thickness * PI * 12.));
  float fresnel = pow(clamp(1. - depth / max(radius, 1.), 0., 1.), 1.7);
  float neck = exp(-abs(nearest - second) / 16.) * exp(-abs(second) / 27.);
  // Thin reflections leave broad black/clear windows through the bubble.
  float filmPatch = smoothstep(.025, .24, length(liquid)) * (.55 + .45 * sin(film * 10. + .8));
  float reflection = .065 + fresnel * .66 + filmPatch * .22 + neck * .45;
  reflection += min(.16, variation * 2.);
  color *= clamp(reflection, .04, .96) * contour;
  color = mix(color, interference(thickness + .18) * .9, neck * .48);

  // Colored prismatic rim, with just two small light reflections, never a white disk.
  float rim = exp(-depth / rimWidth);
  color += interference(thickness + depth * .065) * rim * .46;
  float topLight = pow(max(dot(normal, normalize(vec2(-.65,-.76))), 0.), 38.);
  float bottomLight = pow(max(dot(normal, normalize(vec2(.65,.76))), 0.), 48.) * .4;
  float highlight = (topLight + bottomLight) * exp(-pow((depth - 1.4) / 1.45, 2.));
  color += vec3(.87,.96,1.) * highlight * .62;
  // A narrow curved reflection catches the upper side of the film.
  vec2 local = (p - center) / max(radius, 1.);
  float arc = exp(-pow((length(local - vec2(.04,.13)) - .9) / .016, 2.));
  arc *= smoothstep(.25,.72,-local.y) * (1. - smoothstep(-.35,.6,local.x));
  color += vec3(.62,.85,.96) * arc * .12;
  float cover = 1. - smoothstep(-.7 / pixelRatio, .7 / pixelRatio, d);
  outColor = vec4(clamp(color, 0., 1.) * cover, cover);
}
`;

export class SoapFilmRenderer {
  private gl: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private buffer!: WebGLBuffer;
  private texture!: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private shapes = new Float32Array(MAX_SHAPES * 4);
  private motion = new Float32Array(MAX_SHAPES * 4);
  private lost = false;
  private handleLost = (event: Event) => { event.preventDefault(); this.lost = true; };
  private handleRestored = () => { this.initialize(); this.lost = false; };

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.initialize();
    canvas.addEventListener('webglcontextlost', this.handleLost);
    canvas.addEventListener('webglcontextrestored', this.handleRestored);
  }

  private initialize() {
    const gl = this.gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error ?? 'Bubble shader failed');
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment);
    gl.linkProgram(this.program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program) ?? 'Bubble shader failed');
    gl.useProgram(this.program);
    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    for (const name of ['fluid','size','pixelRatio','time','count','shapes','motion','optics','rimWidth']) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  draw(source: HTMLCanvasElement, shapes: FilmShape[], time: number, width: number, height: number) {
    if (this.lost || !source.width || !source.height) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (width * height)));
    const w = Math.round(width * dpr), h = Math.round(height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!shapes.length) return;
    const count = Math.min(shapes.length, MAX_SHAPES);
    for (let i = 0; i < count; i++) {
      const b = shapes[i];
      this.shapes.set([b.x, b.y, b.rx, b.ry], i * 4);
      this.motion.set([b.phase, b.wobble, b.blend, 0], i * 4);
    }
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    const u = this.uniforms;
    gl.uniform1i(u.fluid, 0); gl.uniform1i(u.count, count);
    gl.uniform2f(u.size, width, height);
    gl.uniform1f(u.pixelRatio, dpr); gl.uniform1f(u.time, time);
    gl.uniform4f(u.optics, MATERIAL.bezel, MATERIAL.depth, MATERIAL.dispersion, MATERIAL.maxBezel);
    gl.uniform1f(u.rimWidth, MATERIAL.rimWidth);
    gl.uniform4fv(u.shapes, this.shapes); gl.uniform4fv(u.motion, this.motion);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleRestored);
    this.gl.deleteTexture(this.texture);
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}

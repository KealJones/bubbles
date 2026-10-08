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
uniform sampler2D backdrop;
uniform bool refractBackground;
uniform bool paintBackground;
uniform vec2 size;
uniform vec4 fluidBounds;
uniform float pixelRatio;
uniform float time;
uniform vec4 optics;
uniform float rimWidth;
uniform float transparency;
uniform float lightBending;
uniform float layerOpacity;
uniform int count;
uniform vec4 shapes[${MAX_SHAPES}];
uniform vec4 tears[${MAX_SHAPES}];
uniform vec4 motion[${MAX_SHAPES}];
out vec4 outColor;
const float PI = 3.14159265359;

float surfaceDistance(vec2 p, int i) {
  vec2 q = (p - shapes[i].xy) / shapes[i].zw;
  float angle = atan(q.y, q.x);
  float wave = sin(angle * 3. + time * 1.4 + motion[i].x) * .65
             + sin(angle * 5. - time * .9 + motion[i].x * 1.7) * .35;
  float surface = (length(q) - 1. - wave * motion[i].y) * min(shapes[i].z, shapes[i].w);
  return surface;
}
float bubbleDistance(vec2 p, int i) {
  float surface = surfaceDistance(p, i);
  return tears[i].w > .5 ? max(surface, tears[i].z - length(p - tears[i].xy)) : surface;
}
float smoothUnion(float a, float b, float k) {
  k = max(k, .001);
  float h = max(k - abs(a - b), 0.) / k;
  return min(a, b) - h * h * k * .25;
}
float field(vec2 p, bool intact) {
  float d = 1e5;
  float previousBlend = 36.;
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    if (i >= count) break;
    float nextDistance = intact ? surfaceDistance(p, i) : bubbleDistance(p, i);
    float nextBlend = motion[i].z;
    float blended = smoothUnion(d, nextDistance, min(previousBlend, nextBlend));
    if (nextDistance < d) previousBlend = nextBlend;
    d = blended;
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
  vec2 uv = clamp((p + fluidBounds.xy) / fluidBounds.zw, vec2(.003), vec2(.997));
  return texture(fluid, vec2(uv.x, 1. - uv.y)).rgb;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, size.y * pixelRatio - gl_FragCoord.y) / pixelRatio;
  if (paintBackground) {
    float tile = mod(floor(p.x / 48.) + floor(p.y / 48.), 2.);
    outColor = vec4(mix(vec3(41.,59.,72.), vec3(131.,148.,156.), tile) / 255., 1.);
    return;
  }
  if (count == 0) { outColor = vec4(0.); return; }
  // The tear cuts visibility only; it must not create a new glass rim or reflection.
  float coverageDistance = field(p, false);
  float d = field(p, true);
  if (coverageDistance > 1.5) { outColor = vec4(0.); return; }
  float nearest = 1e5, second = 1e5;
  float nearestBlend = 0., secondBlend = 0.;
  float radius = 80.;
  vec2 center = vec2(0.);
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    if (i >= count) break;
    float v = surfaceDistance(p, i);
    if (v < nearest) {
      second = nearest; secondBlend = nearestBlend; nearest = v; nearestBlend = motion[i].z;
      radius = min(shapes[i].z, shapes[i].w);
      center = shapes[i].xy;
    } else if (v < second) { second = v; secondBlend = motion[i].z; }
  }
  vec2 grad = vec2(field(p + vec2(.65,0.), true) - field(p - vec2(.65,0.), true),
                   field(p + vec2(0.,.65), true) - field(p - vec2(0.,.65), true));
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
  neck *= smoothstep(0., 16., min(nearestBlend, secondBlend));
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
  float cover = 1. - smoothstep(-.7 / pixelRatio, .7 / pixelRatio, coverageDistance);
  vec3 reflected = clamp(color, 0., 1.);
  // Preserve the approved reflections on black while transmitting the real backdrop.
  // This is premultiplied alpha: no black paint or color-key transparency.
  float reflectance = max(reflected.r, max(reflected.g, reflected.b));
  float alpha = mix(1., max(.055, reflectance), transparency);
  if (refractBackground) {
    // Sample the actual scene behind this depth plane, including farther bubbles.
    // Keep the lens displacement continuous through merged necks and opening tears.
    vec2 refractedPoint = p - normal * bend * lightBending;
    vec2 uv = vec2(refractedPoint.x / size.x, 1. - refractedPoint.y / size.y);
    vec2 offset = vec2(normal.x, -normal.y) * bend * lightBending * optics.z / size;
    vec3 transmitted = vec3(texture(backdrop, clamp(uv - offset, vec2(0.), vec2(1.))).r,
                            texture(backdrop, clamp(uv, vec2(0.), vec2(1.))).g,
                            texture(backdrop, clamp(uv + offset, vec2(0.), vec2(1.))).b);
    outColor = vec4((reflected * layerOpacity + transmitted * (1. - alpha * layerOpacity)) * cover, cover);
  } else {
    outColor = vec4(reflected * cover, alpha * cover) * layerOpacity;
  }
}
`;

export class SoapFilmRenderer {
  private gl: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private buffer!: WebGLBuffer;
  private backdropTexture!: WebGLTexture;
  private texture!: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private shapes = new Float32Array(MAX_SHAPES * 4);
  private tears = new Float32Array(MAX_SHAPES * 4);
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
    for (const name of ['backdrop','refractBackground','paintBackground','fluid','fluidBounds','size','pixelRatio','time','count','shapes','motion','tears','optics','rimWidth','transparency','lightBending','layerOpacity']) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE1);
    this.backdropTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.backdropTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.activeTexture(gl.TEXTURE0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  draw(source: HTMLCanvasElement, shapes: FilmShape[], time: number, width: number, height: number, transparency = 0.8, background = 'black', lightBending = 1, fluidBounds = { x: 0, y: 0, width, height }) {
    if (this.lost || !source.width || !source.height) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (width * height)));
    const w = Math.round(width * dpr), h = Math.round(height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (!shapes.length && background === 'black') return;
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    const u = this.uniforms;
    gl.uniform1i(u.fluid, 0);
    gl.uniform1i(u.backdrop, 1);
    gl.uniform1i(u.refractBackground, background === 'grid' ? 1 : 0);
    gl.uniform1i(u.paintBackground, 0);
    gl.uniform2f(u.size, width, height);
    gl.uniform4f(u.fluidBounds, fluidBounds.x, fluidBounds.y, fluidBounds.width, fluidBounds.height);
    gl.uniform1f(u.pixelRatio, dpr); gl.uniform1f(u.time, time);
    gl.uniform4f(u.optics, MATERIAL.bezel, MATERIAL.depth, MATERIAL.dispersion, MATERIAL.maxBezel);
    gl.uniform1f(u.rimWidth, MATERIAL.rimWidth);
    gl.uniform1f(u.lightBending, Math.max(0, Math.min(3, lightBending)));
    gl.uniform1f(u.transparency, Math.max(0, Math.min(1, transparency)));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (background === 'grid') {
      gl.uniform1i(u.paintBackground, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.uniform1i(u.paintBackground, 0);
    }
    // Separate distance fields prevent bubbles on different planes from forming necks.
    // Draw far to near so clear windows also reveal the bubbles behind them.
    for (let layer = 0; layer < 3; layer++) {
      const group = shapes.filter((shape) => shape.depth === layer);
      const count = Math.min(group.length, MAX_SHAPES);
      if (!count) continue;
      for (let i = 0; i < count; i++) {
        const b = group[i];
        this.shapes.set([b.x, b.y, b.rx, b.ry], i * 4);
        this.tears.set(b.tear ? [b.tear.x, b.tear.y, b.tear.radius, 1] : [0,0,0,0], i * 4);
        this.motion.set([b.phase, b.wobble, b.blend, 0], i * 4);
      }
      gl.uniform1i(u.count, count);
      gl.uniform1f(u.layerOpacity, [0.72, 0.88, 1][layer]);
      gl.uniform4fv(u.tears, this.tears); gl.uniform4fv(u.shapes, this.shapes); gl.uniform4fv(u.motion, this.motion);
      if (background === 'grid') {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.backdropTexture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleRestored);
    this.gl.deleteTexture(this.texture);
    this.gl.deleteTexture(this.backdropTexture);
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}

import { Wall, Light } from "@/vtt/types/mapData/MapData";
import { hexToRgb } from "@/util/hexToRgb";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Resolution of the 1D shadow map (pixels = angle slices from -π to +π) */
const SHADOW_MAP_SIZE = 1024;

// ─── Shader Sources ──────────────────────────────────────────────────────────

/**
 * Shadow map vertex shader.
 *
 * Each wall segment is rendered as a gl.LINES primitive with 2 vertices.
 * Both vertices carry the same wall endpoint coords (a, b) but different
 * NDC x-positions (-1 and +1) so the line spans the full 1D texture width.
 *
 * The interpolated v_angle goes from -π to +π across the line, giving
 * each fragment its angular position in the circular shadow map.
 * Wall coords (a, b) use `flat` so they are NOT interpolated.
 */
const shadowMapVertexShader = `#version 300 es
precision highp float;

in float a_ndc;
in vec2 a_wallA;
in vec2 a_wallB;

flat out vec2 v_wallA;
flat out vec2 v_wallB;
out float v_angle;

const float PI = 3.14159265359;

void main() {
    gl_Position = vec4(a_ndc, 0.0, 0.0, 1.0);
    v_angle = a_ndc * PI; // Interpolated: -PI at ndc=-1, +PI at ndc=+1
    v_wallA = a_wallA;
    v_wallB = a_wallB;
}
`;

/**
 * Shadow map fragment shader.
 *
 * For each angle α (fragment position in the 1D buffer), compute the
 * ray-line intersection distance between a ray from the origin at angle α
 * and the wall segment from a to b.
 *
 * Uses the csantosbh formula:
 *   d * [cos(α), sin(α)] = l*(b - a) + a
 *   Solve for l (interpolation 0..1) and d (distance > 0)
 *
 * Outputs normalized distance d/maxDist to the R channel.
 * Uses MIN blending to keep only the nearest wall.
 */
const shadowMapFragmentShader = `#version 300 es
precision highp float;

flat in vec2 v_wallA;
flat in vec2 v_wallB;
in float v_angle;

uniform float u_maxDistance;

out vec4 fragColor;

void main() {
    float sinA = sin(v_angle);
    float cosA = cos(v_angle);

    vec2 a = v_wallA;
    vec2 b = v_wallB;

    float l, d;

    // Use the numerically stable branch depending on which trig value is larger
    if (abs(sinA) > abs(cosA)) {
        // sin(α) is dominant — use the first form
        float secA = 1.0 / cosA;
        float denom = secA * (b.y - a.y) + a.x - b.x;
        if (abs(denom) < 1e-6) {
            discard;
        }
        l = (a.x - secA * a.y) / denom;
        d = (l * (b.y - a.y) + a.y) / sinA;
    } else {
        // cos(α) is dominant — use the second form
        float tanA = sinA / cosA;
        float denom = tanA * (b.x - a.x) + a.y - b.y;
        if (abs(denom) < 1e-6) {
            discard;
        }
        l = (a.y - tanA * a.x) / denom;
        d = (l * (b.x - a.x) + a.x) / cosA;
    }

    // Discard if no valid intersection
    if (d <= 0.001 || l < 0.0 || l > 1.0) {
        discard;
    }

    // Output normalized distance
    fragColor = vec4(d / u_maxDistance, 0.0, 0.0, 1.0);
}
`;

/**
 * Light vertex shader: transforms pixel coords to clip space.
 */
const lightVertexShader = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;

void main() {
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`;

/**
 * Light fragment shader with shadow map sampling.
 *
 * Draws a radial gradient for a point light, but discards fragments
 * that are in shadow (behind a wall according to the 1D shadow map).
 */
const lightFragmentShader = `#version 300 es
precision highp float;

uniform vec2 u_lightPosition;  // In WebGL coords (Y flipped)
uniform float u_brightRange;
uniform float u_dimRange;
uniform vec3 u_tintColor;
uniform float u_tintAlpha;
uniform sampler2D u_shadowMap;
uniform float u_maxDistance;

out vec4 fragColor;

const float PI = 3.14159265359;

void main() {
    vec2 fragPos = gl_FragCoord.xy - u_lightPosition;
    float dist = length(fragPos);
    float radius = max(u_brightRange, u_dimRange);

    if (dist > radius) {
        discard;
    }

    // Shadow test: compute angle from light to this fragment
    float angle = atan(fragPos.y, fragPos.x); // -PI to PI
    // Map to [0, 1] UV for shadow map sampling
    float u = (angle + PI) / (2.0 * PI);
    float shadowDist = texture(u_shadowMap, vec2(u, 0.5)).r * u_maxDistance;

    // Fragment is in shadow if it's farther than the nearest wall
    // Small bias (2.0 px) to avoid self-shadowing artifacts at wall edges
    if (dist > shadowDist + 2.0) {
        discard;
    }

    // Radial falloff
    float intensity;
    if (dist <= u_brightRange) {
        intensity = 1.0;
    } else {
        float t = (dist - u_brightRange) / (radius - u_brightRange);
        intensity = mix(0.5, 0.0, smoothstep(0.0, 1.0, t));
    }

    vec3 lightColor = mix(vec3(1.0), u_tintColor, u_tintAlpha);
    fragColor = vec4(lightColor * intensity, intensity);
}
`;

/** Final composite vertex shader */
const compositeVertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) * 0.5;
}
`;

/** Final composite fragment shader */
const compositeFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D u_lightTexture;
uniform float u_ambientLight;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec4 light = texture(u_lightTexture, v_texCoord);
    vec3 color = max(light.rgb, vec3(u_ambientLight));
    fragColor = vec4(color, 1.0);
}
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  attributes: Record<string, number>;
}

export interface LightingState {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  lightProgram: ShaderProgram;
  shadowMapProgram: ShaderProgram;
  compositeProgram: ShaderProgram;
  perLightFBO: { framebuffer: WebGLFramebuffer; texture: WebGLTexture };
  accumulationFBO: { framebuffer: WebGLFramebuffer; texture: WebGLTexture };
  shadowMapFBO: { framebuffer: WebGLFramebuffer; texture: WebGLTexture };
  quadBuffer: WebGLBuffer;
  fullscreenQuadBuffer: WebGLBuffer;
  wallBuffer: WebGLBuffer;
  supportsFloatBlend: boolean;
}

// ─── GL Helpers ──────────────────────────────────────────────────────────────

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string,
  uniformNames: string[],
  attributeNames: string[]
): ShaderProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `Program link error: ${gl.getProgramInfoLog(program)}`
    );
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  const attributes: Record<string, number> = {};
  for (const name of attributeNames) {
    attributes[name] = gl.getAttribLocation(program, name);
  }

  return { program, uniforms, attributes };
}

function createFBO(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();
  if (!framebuffer || !texture) {
    throw new Error("Failed to create framebuffer or texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { framebuffer, texture };
}

/**
 * Create a 1D shadow map FBO with R32F texture for storing distances.
 * Uses NEAREST filtering to avoid bleeding between angle samples.
 */
function createShadowMapFBO(
  gl: WebGL2RenderingContext,
  width: number
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();
  if (!framebuffer || !texture) {
    throw new Error("Failed to create shadow map FBO");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R32F,
    width,
    1,
    0,
    gl.RED,
    gl.FLOAT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { framebuffer, texture };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the WebGL lighting system. Call once when the canvas is ready.
 */
export function initLighting(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement
): LightingState {
  // Required for rendering to R32F textures
  gl.getExtension("EXT_color_buffer_float");

  // Check for EXT_float_blend (needed for MIN blending on float textures)
  const floatBlendExt = gl.getExtension("EXT_float_blend");
  const supportsFloatBlend = floatBlendExt !== null;

  // Shadow map program (generates 1D shadow maps)
  const shadowMapProgram = createProgram(
    gl,
    shadowMapVertexShader,
    shadowMapFragmentShader,
    ["u_maxDistance"],
    ["a_ndc", "a_wallA", "a_wallB"]
  );

  // Light program (renders light gradient with shadow map sampling)
  const lightProgram = createProgram(
    gl,
    lightVertexShader,
    lightFragmentShader,
    [
      "u_resolution",
      "u_lightPosition",
      "u_brightRange",
      "u_dimRange",
      "u_tintColor",
      "u_tintAlpha",
      "u_shadowMap",
      "u_maxDistance",
    ],
    ["a_position"]
  );

  // Composite program (renders accumulated light to screen)
  const compositeProgram = createProgram(
    gl,
    compositeVertexShader,
    compositeFragmentShader,
    ["u_lightTexture", "u_ambientLight"],
    ["a_position"]
  );

  // Framebuffers
  const perLightFBO = createFBO(gl, canvas.width, canvas.height);
  const accumulationFBO = createFBO(gl, canvas.width, canvas.height);
  const shadowMapFBO = createShadowMapFBO(gl, SHADOW_MAP_SIZE);

  // Quad buffer (updated per-light)
  const quadBuffer = gl.createBuffer();
  if (!quadBuffer) throw new Error("Failed to create quad buffer");

  // Fullscreen quad for composite pass
  const fullscreenQuadBuffer = gl.createBuffer();
  if (!fullscreenQuadBuffer) {
    throw new Error("Failed to create fullscreen quad buffer");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
  // prettier-ignore
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
     1, -1,  1,  1,  -1, 1,
  ]), gl.STATIC_DRAW);

  // Wall buffer for shadow map generation (dynamic)
  const wallBuffer = gl.createBuffer();
  if (!wallBuffer) throw new Error("Failed to create wall buffer");

  return {
    gl,
    canvas,
    lightProgram,
    shadowMapProgram,
    compositeProgram,
    perLightFBO,
    accumulationFBO,
    shadowMapFBO,
    quadBuffer,
    fullscreenQuadBuffer,
    wallBuffer,
    supportsFloatBlend,
  };
}

/**
 * Resize the lighting FBOs. Call when the canvas size changes.
 * Note: shadow map FBO is always SHADOW_MAP_SIZE×1, no resize needed.
 */
export function resizeLighting(state: LightingState): void {
  const { gl, canvas } = state;
  const w = canvas.width;
  const h = canvas.height;

  for (const fbo of [state.perLightFBO, state.accumulationFBO]) {
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Build the wall VBO data for shadow map generation.
 *
 * Each wall segment becomes 2 vertices (a gl.LINES primitive):
 *   vertex 1: [ndc=-1, a.x, a.y, b.x, b.y]
 *   vertex 2: [ndc=+1, a.x, a.y, b.x, b.y]
 *
 * Wall coordinates are relative to the light position, with Y flipped
 * to match WebGL's Y-up coordinate system.
 */
function buildWallVBO(
  walls: Wall[],
  lightX: number,
  lightY: number
): Float32Array {
  const floatsPerVertex = 5; // ndc, ax, ay, bx, by
  const verticesPerWall = 2;
  const data = new Float32Array(
    walls.length * verticesPerWall * floatsPerVertex
  );

  let offset = 0;
  for (const wall of walls) {
    // Relative to light, Y flipped for WebGL coords
    const ax = wall.start.x - lightX;
    const ay = -(wall.start.y - lightY); // Flip Y
    const bx = wall.end.x - lightX;
    const by = -(wall.end.y - lightY); // Flip Y

    // Vertex 1: ndc = -1
    data[offset++] = -1;
    data[offset++] = ax;
    data[offset++] = ay;
    data[offset++] = bx;
    data[offset++] = by;

    // Vertex 2: ndc = +1
    data[offset++] = 1;
    data[offset++] = ax;
    data[offset++] = ay;
    data[offset++] = bx;
    data[offset++] = by;
  }

  return data;
}

/**
 * Render the full lighting pass. Call each frame.
 *
 * Pipeline:
 * 1. Clear accumulation buffer to black
 * 2. For each light:
 *    a. Generate 1D shadow map from wall segments
 *    b. Render light gradient with shadow map sampling into per-light FBO
 *    c. Additive-blend per-light FBO into accumulation FBO
 * 3. Composite accumulation texture onto the main canvas (multiply blend)
 */
export function renderLighting(
  state: LightingState,
  walls: Wall[],
  lights: Light[],
  ambientLight: number = 0.0
): void {
  const { gl, canvas } = state;
  const w = canvas.width;
  const h = canvas.height;

  // Filter to vision-blocking walls only
  const visionWalls = walls.filter((wall) => wall.blocksVision);

  // ── Step 1: Clear accumulation FBO ──
  gl.bindFramebuffer(gl.FRAMEBUFFER, state.accumulationFBO.framebuffer);
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // ── Step 2: Per-light pass ──
  for (const light of lights) {
    const radius = Math.max(light.bright, light.dim);
    if (radius <= 0) continue;

    // ── 2a: Generate 1D shadow map ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.shadowMapFBO.framebuffer);
    gl.viewport(0, 0, SHADOW_MAP_SIZE, 1);

    // Clear to 1.0 (= max distance, no wall)
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (visionWalls.length > 0) {
      // Build wall VBO relative to this light
      const wallData = buildWallVBO(
        visionWalls,
        light.position.x,
        light.position.y
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, state.wallBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, wallData, gl.DYNAMIC_DRAW);

      gl.useProgram(state.shadowMapProgram.program);
      gl.uniform1f(
        state.shadowMapProgram.uniforms["u_maxDistance"]!,
        radius
      );

      // Set up vertex attributes: [ndc(1), wallA(2), wallB(2)] = stride 20 bytes
      const stride = 5 * 4; // 5 floats × 4 bytes

      // a_ndc: offset 0, 1 float
      const ndcLoc = state.shadowMapProgram.attributes["a_ndc"];
      gl.enableVertexAttribArray(ndcLoc);
      gl.vertexAttribPointer(ndcLoc, 1, gl.FLOAT, false, stride, 0);

      // a_wallA: offset 4, 2 floats
      const wallALoc = state.shadowMapProgram.attributes["a_wallA"];
      gl.enableVertexAttribArray(wallALoc);
      gl.vertexAttribPointer(wallALoc, 2, gl.FLOAT, false, stride, 4);

      // a_wallB: offset 12, 2 floats
      const wallBLoc = state.shadowMapProgram.attributes["a_wallB"];
      gl.enableVertexAttribArray(wallBLoc);
      gl.vertexAttribPointer(wallBLoc, 2, gl.FLOAT, false, stride, 12);

      // Use MIN blending to keep only nearest wall distance
      if (state.supportsFloatBlend) {
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MIN);
        gl.blendFunc(gl.ONE, gl.ONE);
      } else {
        // Without float blend, walls overwrite each other.
        // This is a fallback — most WebGL2 implementations support EXT_float_blend.
        gl.disable(gl.BLEND);
      }

      gl.drawArrays(gl.LINES, 0, visionWalls.length * 2);

      // Reset blend state
      gl.blendEquation(gl.FUNC_ADD);
      gl.disable(gl.BLEND);

      gl.disableVertexAttribArray(ndcLoc);
      gl.disableVertexAttribArray(wallALoc);
      gl.disableVertexAttribArray(wallBLoc);
    }

    // ── 2b: Render light with shadow map into per-light FBO ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.perLightFBO.framebuffer);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);

    // Build quad covering the light's bounding box (pixel coords)
    const x0 = light.position.x - radius;
    const y0 = light.position.y - radius;
    const x1 = light.position.x + radius;
    const y1 = light.position.y + radius;

    // prettier-ignore
    const quadVerts = new Float32Array([
      x0, y0,  x1, y0,  x0, y1,
      x1, y0,  x1, y1,  x0, y1,
    ]);

    gl.useProgram(state.lightProgram.program);
    gl.uniform2f(state.lightProgram.uniforms["u_resolution"]!, w, h);

    // gl_FragCoord has Y=0 at bottom, so flip lightPosition.y
    gl.uniform2f(
      state.lightProgram.uniforms["u_lightPosition"]!,
      light.position.x,
      h - light.position.y
    );
    gl.uniform1f(
      state.lightProgram.uniforms["u_brightRange"]!,
      light.bright
    );
    gl.uniform1f(state.lightProgram.uniforms["u_dimRange"]!, light.dim);
    gl.uniform1f(
      state.lightProgram.uniforms["u_maxDistance"]!,
      radius
    );

    // Parse tint color
    const tint = hexToRgb(light.tintColor);
    gl.uniform3f(
      state.lightProgram.uniforms["u_tintColor"]!,
      tint.r / 255,
      tint.g / 255,
      tint.b / 255
    );
    gl.uniform1f(
      state.lightProgram.uniforms["u_tintAlpha"]!,
      light.tintAlpha
    );

    // Bind shadow map texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.shadowMapFBO.texture);
    gl.uniform1i(state.lightProgram.uniforms["u_shadowMap"]!, 0);

    // Draw the light quad
    gl.bindBuffer(gl.ARRAY_BUFFER, state.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(state.lightProgram.attributes["a_position"]);
    gl.vertexAttribPointer(
      state.lightProgram.attributes["a_position"],
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ── 2c: Additive-blend per-light FBO into accumulation FBO ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.accumulationFBO.framebuffer);
    gl.viewport(0, 0, w, h);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE); // Additive

    gl.useProgram(state.compositeProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.perLightFBO.texture);
    gl.uniform1i(state.compositeProgram.uniforms["u_lightTexture"]!, 0);
    gl.uniform1f(
      state.compositeProgram.uniforms["u_ambientLight"]!,
      0.0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, state.fullscreenQuadBuffer);
    gl.enableVertexAttribArray(
      state.compositeProgram.attributes["a_position"]
    );
    gl.vertexAttribPointer(
      state.compositeProgram.attributes["a_position"],
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // ── Step 3: Composite to screen ──
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.DST_COLOR, gl.ZERO); // Multiply blend

  gl.useProgram(state.compositeProgram.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.accumulationFBO.texture);
  gl.uniform1i(state.compositeProgram.uniforms["u_lightTexture"]!, 0);
  gl.uniform1f(
    state.compositeProgram.uniforms["u_ambientLight"]!,
    ambientLight
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, state.fullscreenQuadBuffer);
  gl.enableVertexAttribArray(
    state.compositeProgram.attributes["a_position"]
  );
  gl.vertexAttribPointer(
    state.compositeProgram.attributes["a_position"],
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.disable(gl.BLEND);
}

/**
 * Clean up all WebGL resources.
 */
export function destroyLighting(state: LightingState): void {
  const { gl } = state;
  gl.deleteProgram(state.lightProgram.program);
  gl.deleteProgram(state.shadowMapProgram.program);
  gl.deleteProgram(state.compositeProgram.program);
  gl.deleteFramebuffer(state.perLightFBO.framebuffer);
  gl.deleteTexture(state.perLightFBO.texture);
  gl.deleteFramebuffer(state.accumulationFBO.framebuffer);
  gl.deleteTexture(state.accumulationFBO.texture);
  gl.deleteFramebuffer(state.shadowMapFBO.framebuffer);
  gl.deleteTexture(state.shadowMapFBO.texture);
  gl.deleteBuffer(state.quadBuffer);
  gl.deleteBuffer(state.fullscreenQuadBuffer);
  gl.deleteBuffer(state.wallBuffer);
}

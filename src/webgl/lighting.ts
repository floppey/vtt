import { Wall, Light } from "@/vtt/types/mapData/MapData";
import { Coordinates } from "@/vtt/types/types";
import { hexToRgb } from "@/util/hexToRgb";

// ─── Shader Sources ──────────────────────────────────────────────────────────

/** Simple vertex shader: transforms pixel coords to clip space */
const quadVertexShader = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;

void main() {
    // Convert pixel coords to 0..1, then to clip space -1..1
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    // Flip Y so pixel (0,0) is top-left like canvas
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`;

/**
 * Light fragment shader: draws a radial gradient for a point light.
 * Outputs white in the center, fading to black at the edge.
 * bright/dim control the falloff curve.
 */
const lightFragmentShader = `#version 300 es
precision mediump float;

uniform vec2 u_lightPosition;
uniform float u_brightRange;
uniform float u_dimRange;
uniform vec3 u_tintColor;
uniform float u_tintAlpha;

out vec4 fragColor;

void main() {
    float dist = length(gl_FragCoord.xy - u_lightPosition);
    float radius = max(u_brightRange, u_dimRange);

    if (dist > radius) {
        discard;
    }

    // Base white light intensity
    float intensity;
    float brightRatio = u_brightRange / radius;

    if (dist <= u_brightRange) {
        intensity = 1.0;
    } else {
        // Smooth falloff from bright edge to dim edge
        float t = (dist - u_brightRange) / (radius - u_brightRange);
        intensity = mix(0.5, 0.0, smoothstep(0.0, 1.0, t));
    }

    // Mix white light with tint color
    vec3 lightColor = mix(vec3(1.0), u_tintColor, u_tintAlpha);
    fragColor = vec4(lightColor * intensity, intensity);
}
`;

/** Shadow fragment shader: just outputs solid black */
const shadowFragmentShader = `#version 300 es
precision mediump float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

/** Final composite: draws the accumulated light texture onto the scene */
const compositeVertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) * 0.5;
}
`;

const compositeFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D u_lightTexture;
uniform float u_ambientLight;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec4 light = texture(u_lightTexture, v_texCoord);
    // Add ambient so unlit areas aren't pure black
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
  shadowProgram: ShaderProgram;
  compositeProgram: ShaderProgram;
  perLightFBO: { framebuffer: WebGLFramebuffer; texture: WebGLTexture };
  accumulationFBO: { framebuffer: WebGLFramebuffer; texture: WebGLTexture };
  quadBuffer: WebGLBuffer;
  fullscreenQuadBuffer: WebGLBuffer;
  shadowBuffer: WebGLBuffer;
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

  // Clean up shaders after linking
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

// ─── Shadow Geometry ─────────────────────────────────────────────────────────

/**
 * For a given light and wall, compute the shadow volume quad.
 * Projects the two wall endpoints away from the light to create a trapezoid.
 * Returns 6 vertices (2 triangles) in pixel coordinates.
 */
function computeShadowQuad(
  light: Light,
  wall: { start: Coordinates; end: Coordinates },
  shadowLength: number
): Float32Array {
  const lx = light.position.x;
  const ly = light.position.y;

  // Wall endpoints
  const ax = wall.start.x;
  const ay = wall.start.y;
  const bx = wall.end.x;
  const by = wall.end.y;

  // Project wall endpoints away from light
  const dax = ax - lx;
  const day = ay - ly;
  const daLen = Math.sqrt(dax * dax + day * day);
  const fax = ax + (dax / daLen) * shadowLength;
  const fay = ay + (day / daLen) * shadowLength;

  const dbx = bx - lx;
  const dby = by - ly;
  const dbLen = Math.sqrt(dbx * dbx + dby * dby);
  const fbx = bx + (dbx / dbLen) * shadowLength;
  const fby = by + (dby / dbLen) * shadowLength;

  // Two triangles forming the shadow trapezoid: A, B, FA, and B, FA, FB
  // prettier-ignore
  return new Float32Array([
    ax, ay,
    bx, by,
    fax, fay,
    bx, by,
    fax, fay,
    fbx, fby,
  ]);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the WebGL lighting system. Call once when the canvas is ready.
 * Returns a LightingState that can be reused across frames.
 */
export function initLighting(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement
): LightingState {
  // Light shader (draws radial gradient for a point light)
  const lightProgram = createProgram(
    gl,
    quadVertexShader,
    lightFragmentShader,
    [
      "u_resolution",
      "u_lightPosition",
      "u_brightRange",
      "u_dimRange",
      "u_tintColor",
      "u_tintAlpha",
    ],
    ["a_position"]
  );

  // Shadow shader (draws solid black shadow geometry)
  const shadowProgram = createProgram(
    gl,
    quadVertexShader,
    shadowFragmentShader,
    ["u_resolution"],
    ["a_position"]
  );

  // Composite shader (renders accumulated light texture to screen)
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

  // Quad buffer (will be updated per-light with the light's bounding quad)
  const quadBuffer = gl.createBuffer();
  if (!quadBuffer) throw new Error("Failed to create quad buffer");

  // Fullscreen quad for composite pass (clip space -1..1)
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

  // Shadow geometry buffer (dynamic)
  const shadowBuffer = gl.createBuffer();
  if (!shadowBuffer) throw new Error("Failed to create shadow buffer");

  return {
    gl,
    canvas,
    lightProgram,
    shadowProgram,
    compositeProgram,
    perLightFBO,
    accumulationFBO,
    quadBuffer,
    fullscreenQuadBuffer,
    shadowBuffer,
  };
}

/**
 * Resize the lighting FBOs. Call when the canvas size changes.
 */
export function resizeLighting(state: LightingState): void {
  const { gl, canvas } = state;
  const w = canvas.width;
  const h = canvas.height;

  // Recreate FBO textures at new size
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
 * Render the full lighting pass. Call each frame (or when lighting changes).
 *
 * Pipeline:
 * 1. Clear accumulation buffer to black
 * 2. For each light:
 *    a. Draw light gradient into per-light FBO
 *    b. Draw shadow geometry (black) on top, cutting shadows from the light
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

    // 2a: Draw light gradient into per-light FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.perLightFBO.framebuffer);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);

    // Build a quad covering the light's bounding box (pixel coords)
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

    // 2b: Draw shadow geometry on top of the light (cuts out shadows)
    // Collect shadow quads for all walls near this light
    const shadowVerts: number[] = [];
    const shadowLength = radius * 2; // Project far enough to cover the light

    for (const wall of visionWalls) {
      // Quick bounding check: skip walls too far from light
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      const wallHalfLen =
        Math.sqrt(
          (wall.end.x - wall.start.x) ** 2 +
            (wall.end.y - wall.start.y) ** 2
        ) / 2;
      const distToLight = Math.sqrt(
        (midX - light.position.x) ** 2 + (midY - light.position.y) ** 2
      );

      if (distToLight > radius + wallHalfLen + 10) continue;

      const quad = computeShadowQuad(light, wall, shadowLength);
      for (let i = 0; i < quad.length; i++) {
        shadowVerts.push(quad[i]);
      }
    }

    if (shadowVerts.length > 0) {
      gl.useProgram(state.shadowProgram.program);
      gl.uniform2f(state.shadowProgram.uniforms["u_resolution"]!, w, h);

      gl.bindBuffer(gl.ARRAY_BUFFER, state.shadowBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(shadowVerts),
        gl.DYNAMIC_DRAW
      );
      gl.enableVertexAttribArray(
        state.shadowProgram.attributes["a_position"]
      );
      gl.vertexAttribPointer(
        state.shadowProgram.attributes["a_position"],
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.drawArrays(gl.TRIANGLES, 0, shadowVerts.length / 2);
    }

    // 2c: Additive-blend per-light FBO into accumulation FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.accumulationFBO.framebuffer);
    gl.viewport(0, 0, w, h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // Additive

    gl.useProgram(state.compositeProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.perLightFBO.texture);
    gl.uniform1i(state.compositeProgram.uniforms["u_lightTexture"]!, 0);
    gl.uniform1f(
      state.compositeProgram.uniforms["u_ambientLight"]!,
      0.0
    ); // No ambient during accumulation

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
  gl.deleteProgram(state.shadowProgram.program);
  gl.deleteProgram(state.compositeProgram.program);
  gl.deleteFramebuffer(state.perLightFBO.framebuffer);
  gl.deleteTexture(state.perLightFBO.texture);
  gl.deleteFramebuffer(state.accumulationFBO.framebuffer);
  gl.deleteTexture(state.accumulationFBO.texture);
  gl.deleteBuffer(state.quadBuffer);
  gl.deleteBuffer(state.fullscreenQuadBuffer);
  gl.deleteBuffer(state.shadowBuffer);
}

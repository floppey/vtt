import { Wall, Light } from "@/vtt/types/mapData/MapData";

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

// Wall vertex shader to handle wall rendering
const wallVertexShader = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const wallFragmentShader = `
precision mediump float;

void main() {
    gl_FragColor = vec4(0.8, 0.2, 0.2, 1.0); 
}`;

const shadowMaskFragmentShader = `
precision mediump float;
uniform vec2 lightPosition;
uniform vec2 wallStart;
uniform vec2 wallEnd;

void main() {
    vec2 pixel = gl_FragCoord.xy;
    
    // Vector from light to current pixel
    vec2 lightToPixel = pixel - lightPosition;
    
    // Vector representing the wall
    vec2 wallVector = wallEnd - wallStart;
    
    // Vector from wall start to current pixel
    vec2 wallStartToPixel = pixel - wallStart;
    
    // Calculate if point is in shadow using cross product
    float cross1 = wallVector.x * wallStartToPixel.y - wallVector.y * wallStartToPixel.x;
    float cross2 = wallVector.x * lightToPixel.y - wallVector.y * lightToPixel.x;
    
    // If both cross products are negative, pixel is in shadow
    if (cross1 < 0.0 && cross2 > 0.0) {  
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}`;

const lightFragmentShader = `
precision mediump float;
uniform vec2 lightPosition;
uniform vec2 resolution;
uniform sampler2D shadowMask;
uniform float brightRange;
uniform float dimRange;

void main() {
    vec2 pixel = gl_FragCoord.xy;
    
    // Calculate distance from light
    float distance = length(pixel - lightPosition);
    
    // Calculate intensity based on bright and dim ranges
    float intensity = 0.0;
    if (distance <= brightRange) {
        intensity = 1.0;  // 100% intensity within bright range
    } else if (distance <= dimRange) {
        intensity = 0.5;  // 50% intensity within dim range
    }
    
    // Sample the shadow mask
    vec4 mask = texture2D(shadowMask, pixel / resolution);
    
    // If pixel is in shadow (red), don't render light
    if (mask.r > 0.5) {
        intensity = 0.0;
    }
    
    gl_FragColor = vec4(1.0, 1.0, 0.8, intensity);
}`;

function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) {
    throw new Error("Failed to create shaders");
  }

  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        program
      )}`
    );
  }

  return program;
}

interface FramebufferResult {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

function createFramebuffer(
  gl: WebGLRenderingContext,
  width: number,
  height: number
): FramebufferResult {
  const framebuffer = gl.createFramebuffer();
  const texture = gl.createTexture();

  if (!framebuffer || !texture) {
    throw new Error("Failed to create framebuffer or texture");
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  return { framebuffer, texture };
}

function initBuffers(gl: WebGLRenderingContext): WebGLBuffer {
  const positions = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
  ]);

  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    throw new Error("Failed to create buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  return positionBuffer;
}

function renderWalls(gl: WebGLRenderingContext, walls: Wall[]): void {
  const wallProgram = initShaderProgram(
    gl,
    wallVertexShader,
    wallFragmentShader
  );

  gl.useProgram(wallProgram);

  const lineVertices = new Float32Array(
    walls.flatMap((wall) => [
      wall.start.x,
      wall.start.y,
      wall.end.x,
      wall.end.y,
    ])
  );

  const lineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, lineVertices, gl.STATIC_DRAW);

  const linePosition = gl.getAttribLocation(wallProgram, "position");
  gl.enableVertexAttribArray(linePosition);
  gl.vertexAttribPointer(linePosition, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINES, 0, lineVertices.length / 2);
}

export function render(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  walls: Wall[],
  lights: Light[]
): void {
  // Clear the canvas
  // gl.clearColor(0.1, 0.1, 0.1, 1.0); // Dark background
  gl.clear(gl.COLOR_BUFFER_BIT);

  const shadowProgram = initShaderProgram(
    gl,
    vertexShaderSource,
    shadowMaskFragmentShader
  );
  const lightProgram = initShaderProgram(
    gl,
    vertexShaderSource,
    lightFragmentShader
  );

  const positionBuffer = initBuffers(gl);
  const { framebuffer, texture } = createFramebuffer(
    gl,
    canvas.width,
    canvas.height
  );

  lights.forEach((light) => {
    // Shadow mask pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shadowProgram);

    const positionLocation = gl.getAttribLocation(shadowProgram, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    walls.forEach((wall) => {
      gl.uniform2f(
        gl.getUniformLocation(shadowProgram, "lightPosition"),
        light.position.x,
        light.position.y
      );
      gl.uniform2f(
        gl.getUniformLocation(shadowProgram, "wallStart"),
        wall.start.x,
        wall.start.y
      );
      gl.uniform2f(
        gl.getUniformLocation(shadowProgram, "wallEnd"),
        wall.end.x,
        wall.end.y
      );

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });

    // Light pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(lightProgram);

    const lightPosLocation = gl.getAttribLocation(lightProgram, "position");
    gl.enableVertexAttribArray(lightPosLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(lightPosLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform2f(
      gl.getUniformLocation(lightProgram, "lightPosition"),
      light.position.x,
      light.position.y
    );
    gl.uniform2f(
      gl.getUniformLocation(lightProgram, "resolution"),
      canvas.width,
      canvas.height
    );
    gl.uniform1f(
      gl.getUniformLocation(lightProgram, "brightRange"),
      light.bright
    );
    gl.uniform1f(gl.getUniformLocation(lightProgram, "dimRange"), light.dim);
    gl.uniform1i(gl.getUniformLocation(lightProgram, "shadowMask"), 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Blend lights together

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  // Disable blending at the end (if necessary)
  gl.disable(gl.BLEND);

  // Render the walls
  renderWalls(gl, walls);
}

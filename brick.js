const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw console.error('Webgl 2 is not supported by your browser');
}

const brickGrid = [
    -0.83, 0.8, 0,
    -0.83, 0.7, 0,
    -0.63, 0.7, 0,
    -0.63, 0.8, 0,
];

const ball = [0, 0, 0,]

const paddle = [
    -0.25, -0.9, 0,
    0.25, -0.9, 0,
]

var brickGridBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, brickGridBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brickGrid), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var ballBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, ballBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ball), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var paddleBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, paddleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(paddle), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null)


var vertexCode = `
attribute vec3 positions;
uniform mat4 p;
uniform mat4 v;
uniform mat4 m;
void main(void) { gl_Position = m*vec4(positions, 1.0);
  gl_PointSize = 15.0;
}
`;

var vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexCode);
gl.compileShader(vertexShader);

if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader));
}

var FragmentCode = `
precision mediump float;
uniform float r;
uniform float b;
uniform float g;
void main(void) {gl_FragColor = vec4(r, b, g, 1);
}
`;

var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, FragmentCode);
gl.compileShader(fragmentShader);

if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fragmentShader));
}

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

var px = 0
var bx = 0
var by = -0.5
var signx = 1
var signy = 1
var incx = Number((Math.random() * (0.03 - 0.01) + 0.01).toFixed(5)) * (Math.random() < 0.5 ? -1 : 1)
var incy = Math.random() * (0.03 - 0.01) + 0.01
var brickState = []

for (let i = 0; i < 8; i++) {
    brickState.push([])
    for (let j = 0; j < 8 - i; j++) {
        const x = 0.21 * j + 0.1 * i
        const y = -0.12 * i
        brickState[i].push([
            -0.83 + x, 0.8 + y, 1,
            -0.83 + x, 0.7 + y, 0,
            -0.63 + x, 0.7 + y, 0,
            -0.63 + x, 0.8 + y, 0
        ])
    }
}

var r = Math.random()
var g = Math.random()
var b = Math.random()

draw();
function draw() {

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'r'), r)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'g'), g)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'b'), b)
    binder(brickGridBuffer)

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8 - i; j++) {
            const x = 0.21 * j + 0.1 * i
            const y = -0.12 * i
            if (brickState[i][j][2] && (bx < brickState[i][j][6]) && (bx > brickState[i][j][0]) && (by <= brickState[i][j][1]) && (by >= brickState[i][j][4])) {
                signx *= -1
                signy *= -1
                incx = Number((Math.random() * (0.03 - 0.01) + 0.01).toFixed(5))
                incy = Number((Math.random() * (0.03 - 0.01) + 0.01).toFixed(5))
                brickState[i][j][2] = 0
                r = Math.random()
                g = Math.random()
                b = Math.random()
            }
            if (brickState[i][j][2]) {
                gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'm'), false, mat4.translate(mat4.create(), mat4.create(), [x, y, 0]))
                gl.drawArrays(gl.TRIANGLE_FAN, 0, brickGrid.length / 3)
            }
        }
    }

    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'r'), 1)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'g'), 0)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'b'), 1)
    binder(ballBuffer)

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'm'), false, mat4.translate(mat4.create(), mat4.create(), [bx, by, 0]))
    gl.drawArrays(gl.POINTS, 0, ball.length / 3)

    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'r'), 0)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'g'), 0)
    gl.uniform1f(gl.getUniformLocation(shaderProgram, 'b'), 1)
    binder(paddleBuffer)

    if ((bx > 1) || (bx < -1)) {
        signx *= -1
    }
    if ((by > 1) || (by < -1)) {
        signy *= -1
    }
    if ((bx < paddle[3]) && (bx > paddle[0]) && (by <= -0.85)) {
        signy *= -1
        incy = 0.0268
    }

    if (by > -0.95) {
        bx += signx * incx
        by += signy * incy
    }

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'm'), false, mat4.translate(mat4.create(), mat4.create(), [px, 0, 0]))
    gl.lineWidth(10)
    gl.drawArrays(gl.LINES, 0, paddle.length / 3)

    requestAnimationFrame(draw);
}

function binder(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var pos = gl.getAttribLocation(shaderProgram, 'positions');
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pos);
}


document.addEventListener('keydown', (e) => {
    var m
    switch (e.code) {
        case "ArrowRight":
            m = 0.2 * (px < 1 - 0.25)
            px += m
            paddle[0] += m
            paddle[3] += m
            break;
        case "ArrowLeft":
            m = 0.2 * (px > 0.25 - 1)
            px -= m
            paddle[0] -= m
            paddle[3] -= m
            break;
    }
})
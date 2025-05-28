const canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const context = canvas.getContext('2d');

function clearScreen() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

class Vector3D {
    constructor(x = null, y = null ,z = null) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Triangle {
    constructor(v1, v2, v3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }
}

class Mesh {
    triangle_list = []
}

class Mat4x4 {
    matrix = []
}

const toRadians = x => x * Math.PI/180

// Projection matrix setup
let aspect_ratio = window.innerHeight/window.innerWidth;
let fov = 90;
let fov_scale = 1 / Math.tan((toRadians(fov/2)));

let z_near = 1;
let z_far = 1000;

const projection_matrix = new Mat4x4();
projection_matrix.matrix = [
    [aspect_ratio * fov_scale, 0.0, 0.0, 0.0],
    [0.0, fov_scale, 0.0, 0.0],
    [0.0, 0.0, z_far/(z_far - z_near), 1.0],
    [0.0, 0.0, (-z_far/(z_far - z_near)) * z_near, 0.0],
];

// Z rotation matrix setup

let theta = 0

const zRotation_matrix = new Mat4x4();
const xRotation_matrix = new Mat4x4();

const zOffset_matrix = new Mat4x4();
zOffset_matrix.matrix = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 3.0, 1.0]
]

const cube = new Mesh()

cube.triangle_list = [
    // SOUTH
    new Triangle(new Vector3D(0.0, 0.0, 0.0), new Vector3D(0.0, 1.0, 0.0), new Vector3D(1.0, 1.0, 0.0)),
    new Triangle(new Vector3D(0.0, 0.0, 0.0), new Vector3D(1.0, 1.0, 0.0), new Vector3D(1.0, 0.0, 0.0)),

    // EAST
    new Triangle(new Vector3D(1.0, 0.0, 0.0), new Vector3D(1.0, 1.0, 0.0), new Vector3D(1.0, 1.0, 1.0)),
    new Triangle(new Vector3D(1.0, 0.0, 0.0), new Vector3D(1.0, 1.0, 1.0), new Vector3D(1.0, 0.0, 1.0)),

    // NORTH
    new Triangle(new Vector3D(1.0, 0.0, 1.0), new Vector3D(1.0, 1.0, 1.0), new Vector3D(0.0, 1.0, 1.0)),
    new Triangle(new Vector3D(1.0, 0.0, 1.0), new Vector3D(0.0, 1.0, 1.0), new Vector3D(0.0, 0.0, 1.0)),

    // WEST
    new Triangle(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 1.0, 1.0), new Vector3D(0.0, 1.0, 0.0)),
    new Triangle(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 1.0, 0.0), new Vector3D(0.0, 0.0, 0.0)),

    // TOP
    new Triangle(new Vector3D(0.0, 1.0, 0.0), new Vector3D(0.0, 1.0, 1.0), new Vector3D(1.0, 1.0, 1.0)),
    new Triangle(new Vector3D(0.0, 1.0, 0.0), new Vector3D(1.0, 1.0, 1.0), new Vector3D(1.0, 1.0, 0.0)),

    // BOTTOM
    new Triangle(new Vector3D(1.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0)),
    new Triangle(new Vector3D(1.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), new Vector3D(1.0, 0.0, 0.0))

]

function matrixMultiply(matrix, input_vertex) {
    let output_vertex = new Vector3D();

    output_vertex.x = input_vertex.x * matrix.matrix[0][0] + input_vertex.y * matrix.matrix[1][0] + input_vertex.z * matrix.matrix[2][0] + matrix.matrix[3][0];
    output_vertex.y = input_vertex.x * matrix.matrix[0][1] + input_vertex.y * matrix.matrix[1][1] + input_vertex.z * matrix.matrix[2][1] + matrix.matrix[3][1];
    output_vertex.z = input_vertex.x * matrix.matrix[0][2] + input_vertex.y * matrix.matrix[1][2] + input_vertex.z * matrix.matrix[2][2] + matrix.matrix[3][2];

    let w = input_vertex.x * matrix.matrix[0][3] + input_vertex.y * matrix.matrix[1][3] + input_vertex.z * matrix.matrix[2][3] + matrix.matrix[3][3];

    if (w != 0) {
        output_vertex.x /= w;
        output_vertex.y /= w;
        output_vertex.z /= w;
    }
    return output_vertex;
}

function transformMesh(input_mesh, matrix) {
    const output_mesh = new Mesh();
    for (const triangle of input_mesh.triangle_list) {
        
        const output_v1 = matrixMultiply(matrix, triangle.v1)
        const output_v2 = matrixMultiply(matrix, triangle.v2)
        const output_v3 = matrixMultiply(matrix, triangle.v3)
        
        output_mesh.triangle_list.push(new Triangle(output_v1, output_v2, output_v3))
    }
    return output_mesh;
}

function drawMesh(input_mesh) {
    for (const triangle of input_mesh.triangle_list) {
        context.beginPath();
        context.moveTo(triangle.v1.x, triangle.v1.y);
        context.lineTo(triangle.v2.x, triangle.v2.y);
        context.lineTo(triangle.v3.x, triangle.v3.y);
        context.closePath();

        // Add stroke color here (random color example)
        context.strokeStyle = 'white';
        context.stroke();
    }
}

function normalizeMesh(input_mesh) {
    for (const triangle of input_mesh.triangle_list) {
        triangle.v1.x = (triangle.v1.x + 1) * window.innerWidth / 2;
        triangle.v1.y = (1 - triangle.v1.y) * window.innerHeight / 2;

        triangle.v2.x = (triangle.v2.x + 1) * window.innerWidth / 2;
        triangle.v2.y = (1 - triangle.v2.y) * window.innerHeight / 2;

        triangle.v3.x = (triangle.v3.x + 1) * window.innerWidth / 2;
        triangle.v3.y = (1 - triangle.v3.y) * window.innerHeight / 2;
    }
    return input_mesh; 
}

function loop() {
    clearScreen();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    zRotation_matrix.matrix = [
    [Math.cos(toRadians(theta)), Math.sin(toRadians(theta)), 0.0, 0.0],
    [-Math.sin(toRadians(theta)), Math.cos(toRadians(theta)), 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
    ]

    xRotation_matrix.matrix = [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, Math.cos(toRadians(theta) * 0.5), Math.sin(toRadians(theta) * 0.5), 0.0],
        [0.0, -Math.sin(toRadians(theta) * 0.5), Math.cos(toRadians(theta) * 0.5), 0.0],
        [0.0, 0.0, 0.0, .0]
    ]

    theta++;

    const Zrotated_cube = transformMesh(cube, zRotation_matrix);
    const ZXrotated_cube = transformMesh(Zrotated_cube, xRotation_matrix);
    const zOffset_cube = transformMesh(ZXrotated_cube, zOffset_matrix);
    const projected_cube = transformMesh(zOffset_cube, projection_matrix);
    normalizeMesh(projected_cube);
    drawMesh(projected_cube);

    requestAnimationFrame(loop);
    
}

loop();

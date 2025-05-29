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

const toRadians = x => x * Math.PI / 180

let aspect_ratio = window.innerHeight / window.innerWidth;
let fov = 90;
let fov_scale = 1 / Math.tan((toRadians(fov / 2)));

let z_near = 1;
let z_far = 1000;

const projection_matrix = new Mat4x4();
projection_matrix.matrix = [
    [aspect_ratio * fov_scale, 0.0, 0.0, 0.0],
    [0.0, fov_scale, 0.0, 0.0],
    [0.0, 0.0, z_far / (z_far - z_near), 1.0],
    [0.0, 0.0, (-z_far / (z_far - z_near)) * z_near, 0.0],
];

let theta = 0;

const zRotation_matrix = new Mat4x4();
const xRotation_matrix = new Mat4x4();

const zOffset_matrix = new Mat4x4();
zOffset_matrix.matrix = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 3.0, 1.0]
];

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

function drawTriangle(triangle, r, g, b) {
    context.beginPath();
    context.moveTo(triangle.v1.x, triangle.v1.y);
    context.lineTo(triangle.v2.x, triangle.v2.y);
    context.lineTo(triangle.v3.x, triangle.v3.y);
    context.closePath();

    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    context.fill();
}

const light = new Vector3D(1, 1, -1);
const camera = new Vector3D(0, 0, 0);

function drawMesh(input_mesh) {
    for (const triangle of input_mesh.triangle_list) {
        const normal = getTriangleNormal(triangle);
        const normal_length = Math.sqrt(
            normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
        );

        const normalized_normal = new Vector3D(
            normal.x / normal_length, normal.y / normal_length, normal.z / normal_length
        );

        const dot_product = normalized_normal.x * (triangle.v1.x - light.x) +
                            normalized_normal.y * (triangle.v1.y - light.y) +
                            normalized_normal.z * (triangle.v1.z - light.z);

        const brightness = Math.max(0.3, dot_product);
        const triangle_shade = brightness * 100;

        drawTriangle(triangle, triangle_shade, triangle_shade, triangle_shade);
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

function getTriangleNormal(triangle) {
    const l1_x = triangle.v2.x - triangle.v1.x;
    const l1_y = triangle.v2.y - triangle.v1.y;
    const l1_z = triangle.v2.z - triangle.v1.z;

    const l2_x = triangle.v3.x - triangle.v1.x;
    const l2_y = triangle.v3.y - triangle.v1.y;
    const l2_z = triangle.v3.z - triangle.v1.z;

    const normal_x = l1_y * l2_z - l1_z * l2_y;
    const normal_y = l1_z * l2_x - l1_x * l2_z;
    const normal_z = l1_x * l2_y - l1_y * l2_x;

    const length = Math.sqrt(normal_x * normal_x + normal_y * normal_y + normal_z * normal_z);
    return new Vector3D(normal_x / length, normal_y / length, normal_z / length);
}

function projectMesh(input_mesh, matrix) {
    const output_mesh = new Mesh();
    for (const triangle of input_mesh.triangle_list) {
        const normal = getTriangleNormal(triangle);
        if (
            normal.x * (triangle.v1.x - camera.x) +
            normal.y * (triangle.v1.y - camera.y) +
            normal.z * (triangle.v1.z - camera.z) < 0
        ) {
            const output_v1 = matrixMultiply(matrix, triangle.v1);
            const output_v2 = matrixMultiply(matrix, triangle.v2);
            const output_v3 = matrixMultiply(matrix, triangle.v3);
            output_mesh.triangle_list.push(new Triangle(output_v1, output_v2, output_v3));
        }
    }
    return output_mesh;
}

function loadObj(filename) {
    return fetch(filename)
        .then(res => res.text())
        .then(objText => {
            const lines = objText.split('\n');
            const vertices = [];
            const output_mesh = new Mesh();

            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts[0] === 'v') {
                    vertices.push(new Vector3D(Number(parts[1]), Number(parts[2]), Number(parts[3])));
                } else if (parts[0] === 'f') {
                    const vi1 = parseInt(parts[1].split('/')[0]) - 1;
                    const vi2 = parseInt(parts[2].split('/')[0]) - 1;
                    const vi3 = parseInt(parts[3].split('/')[0]) - 1;

                    output_mesh.triangle_list.push(new Triangle(
                        vertices[vi1],
                        vertices[vi2],
                        vertices[vi3]
                    ));
                }
            }
            return output_mesh;
        });
}

const mesh_list = [];

let cube = null;
loadObj("./cube.obj").then(loadedMesh => {
    cube = loadedMesh;
    mesh_list.push(cube);
});




function MeshRender(input_mesh) {
    const Zrotated_input_mesh = transformMesh(input_mesh, zRotation_matrix);
    const ZXrotated_input_mesh = transformMesh(Zrotated_input_mesh, xRotation_matrix);
    const zOffset_input_mesh = transformMesh(ZXrotated_input_mesh, zOffset_matrix);
    const projected_cube = projectMesh(zOffset_input_mesh, projection_matrix);
    normalizeMesh(projected_cube);
    drawMesh(projected_cube);
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
    ];

    xRotation_matrix.matrix = [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, Math.cos(toRadians(theta) * 0.5), Math.sin(toRadians(theta) * 0.5), 0.0],
        [0.0, -Math.sin(toRadians(theta) * 0.5), Math.cos(toRadians(theta) * 0.5), 0.0],
        [0.0, 0.0, 0.0, 1.0]
    ];

    theta += 0.5;

    for (const mesh of mesh_list) {
        if (mesh != null) {
        MeshRender(cube);
        }
    }
    

    requestAnimationFrame(loop);
}

loop();

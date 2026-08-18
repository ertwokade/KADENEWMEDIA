import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import * as THREE from 'three';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontPath = '/System/Library/Fonts/Supplemental/Brush Script.ttf';

if (!fs.existsSync(fontPath)) throw new Error(`Required local font was not found: ${fontPath}`);

const fontBuffer = fs.readFileSync(fontPath);
const fontArrayBuffer = fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
const font = opentype.parse(fontArrayBuffer);

const outline = font.getPath('merhaba', 0, 0, 100);
const shapePath = new THREE.ShapePath();

for (const command of outline.commands) {
  if (command.type === 'M') shapePath.moveTo(command.x, -command.y);
  else if (command.type === 'L') shapePath.lineTo(command.x, -command.y);
  else if (command.type === 'C') shapePath.bezierCurveTo(command.x1, -command.y1, command.x2, -command.y2, command.x, -command.y);
  else if (command.type === 'Q') shapePath.quadraticCurveTo(command.x1, -command.y1, command.x, -command.y);
  else if (command.type === 'Z' && shapePath.currentPath) shapePath.currentPath.closePath();
}

const shapes = shapePath.toShapes(false);
if (!shapes.length) throw new Error('The Merhaba outline did not produce any shapes.');

let geometry = new THREE.ExtrudeGeometry(shapes, {
  depth: 9,
  steps: 1,
  curveSegments: 8,
  bevelEnabled: true,
  bevelThickness: 2.2,
  bevelSize: 1.7,
  bevelOffset: 0,
  bevelSegments: 3,
});

geometry.computeBoundingBox();
const initialSize = new THREE.Vector3();
geometry.boundingBox.getSize(initialSize);
const uniformScale = 90 / initialSize.x;
geometry.scale(uniformScale, uniformScale, uniformScale);
geometry.computeBoundingBox();
const center = new THREE.Vector3();
geometry.boundingBox.getCenter(center);
geometry.translate(-center.x, -center.y, -center.z);
geometry.rotateX(-0.08);
geometry.computeVertexNormals();
if (geometry.index) geometry = geometry.toNonIndexed();

const position = geometry.getAttribute('position');
const normal = geometry.getAttribute('normal');
const uv = geometry.getAttribute('uv');
const positions = new Float32Array(position.array);
const normals = new Float32Array(normal.array);
const uvs = uv ? new Float32Array(uv.array) : new Float32Array(position.count * 2);

const align4 = (value) => (value + 3) & ~3;
const chunks = [];
const bufferViews = [];
let byteOffset = 0;

function appendTyped(typed, target) {
  const source = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const padded = Buffer.alloc(align4(source.length));
  source.copy(padded);
  chunks.push(padded);
  bufferViews.push({ buffer: 0, byteOffset, byteLength: source.length, target });
  byteOffset += padded.length;
  return bufferViews.length - 1;
}

const positionView = appendTyped(positions, 34962);
const normalView = appendTyped(normals, 34962);
const uvView = appendTyped(uvs, 34962);
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];

for (let index = 0; index < positions.length; index += 3) {
  for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], positions[index + axis]);
    max[axis] = Math.max(max[axis], positions[index + axis]);
  }
}

const gltf = {
  asset: { version: '2.0', generator: 'Kade New Media opentype glass word generator' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ children: [1], matrix: [0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 1] }, { name: 'Merhaba', mesh: 0 }],
  buffers: [{ byteLength: byteOffset, uri: 'merhaba.bin' }],
  bufferViews,
  accessors: [
    { bufferView: positionView, componentType: 5126, count: position.count, type: 'VEC3', min, max },
    { bufferView: normalView, componentType: 5126, count: normal.count, type: 'VEC3', min: [-1, -1, -1], max: [1, 1, 1] },
    { bufferView: uvView, componentType: 5126, count: position.count, type: 'VEC2', min: [0, 0], max: [1, 1] },
  ],
  meshes: [{ name: 'Merhaba glass word', primitives: [{ mode: 4, attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 } }] }],
};

fs.writeFileSync(path.join(root, 'model/merhaba.bin'), Buffer.concat(chunks));
fs.writeFileSync(path.join(root, 'model/merhaba.gltf'), JSON.stringify(gltf));
console.log(`Generated model/merhaba.gltf (${position.count} vertices, ${Math.round(position.count / 3)} triangles)`);

import { stat } from 'fs/promises';
import { NodeIO } from '@gltf-transform/core';

const filepath = './public/assets/models/players/model4.glb';

// File size
const s = await stat(filepath);
console.log(`\n=== FILE INFO ===`);
console.log(`File: ${filepath}`);
console.log(`Size: ${(s.size / 1024 / 1024).toFixed(2)} MB (${s.size} bytes)`);

const io = new NodeIO();
const doc = await io.read(filepath);
const root = doc.getRoot();

// Nodes
const nodes = root.listNodes();
console.log(`\n=== SCENE GRAPH ===`);
console.log(`Nodes: ${nodes.length}`);
for (const n of nodes) {
  const mesh = n.getMesh();
  const skin = n.getSkin();
  console.log(`  - "${n.getName() || '(unnamed)'}"${mesh ? ' [has mesh]' : ''}${skin ? ' [has skin]' : ''}`);
}

// Meshes
const meshes = root.listMeshes();
console.log(`\n=== MESHES ===`);
console.log(`Meshes: ${meshes.length}`);
for (const m of meshes) {
  const prims = m.listPrimitives();
  console.log(`  - "${m.getName() || '(unnamed)'}" primitives: ${prims.length}`);
}

// Materials
const materials = root.listMaterials();
console.log(`\n=== MATERIALS ===`);
console.log(`Materials: ${materials.length}`);
for (const mat of materials) {
  console.log(`  - "${mat.getName() || '(unnamed)'}" alpha: ${mat.getAlphaMode()}`);
}

// Animations
const animations = root.listAnimations();
console.log(`\n=== ANIMATIONS ===`);
console.log(`Animations: ${animations.length}`);
for (const anim of animations) {
  const channels = anim.listChannels();
  const samplers = anim.listSamplers();
  let maxTime = 0;
  for (const sampler of samplers) {
    const input = sampler.getInput();
    if (input) {
      const arr = input.getArray();
      if (arr && arr.length > 0) {
        maxTime = Math.max(maxTime, arr[arr.length - 1]);
      }
    }
  }
  console.log(`  - "${anim.getName() || '(unnamed)'}" channels: ${channels.length}, duration: ${maxTime.toFixed(3)}s`);
}

// Skins
const skins = root.listSkins();
console.log(`\n=== SKINS (Skeletons) ===`);
console.log(`Skins: ${skins.length}`);
for (const skin of skins) {
  const joints = skin.listJoints();
  const skeleton = skin.getSkeleton();
  console.log(`  - "${skin.getName() || '(unnamed)'}" joints: ${joints.length}, skeleton root: "${skeleton?.getName() || 'none'}"`);
  for (const j of joints) {
    console.log(`      joint: "${j.getName() || '(unnamed)'}"`);
  }
}

// Bounding box
console.log(`\n=== BOUNDING BOX ===`);
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

for (const mesh of meshes) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    if (pos) {
      const count = pos.getCount();
      for (let i = 0; i < count; i++) {
        const v = pos.getElement(i, [0, 0, 0]);
        minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
        minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
        minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
      }
    }
  }
}

if (minX !== Infinity) {
  console.log(`Min: (${minX.toFixed(4)}, ${minY.toFixed(4)}, ${minZ.toFixed(4)})`);
  console.log(`Max: (${maxX.toFixed(4)}, ${maxY.toFixed(4)}, ${maxZ.toFixed(4)})`);
  console.log(`Size: (${(maxX-minX).toFixed(4)}, ${(maxY-minY).toFixed(4)}, ${(maxZ-minZ).toFixed(4)})`);
  console.log(`Height (Y): ${(maxY - minY).toFixed(4)}`);
} else {
  console.log('No position data found');
}

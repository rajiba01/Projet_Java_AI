/* Custom typings for three.js example modules not covered by @types/three
   This file provides simple `any`-based declarations so TypeScript stops
   complaining about imports like:
     import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
     import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

   If you later want stronger typings, remove these declarations and
   rely on the actual types from three/@types or hand-write precise d.ts.
*/

declare module 'three/examples/jsm/controls/OrbitControls' {
  const OrbitControls: any;
  export { OrbitControls };
  export default OrbitControls;
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  const GLTFLoader: any;
  export { GLTFLoader };
  export default GLTFLoader;
}

declare module 'three/examples/jsm/loaders/DRACOLoader' {
  const DRACOLoader: any;
  export { DRACOLoader };
  export default DRACOLoader;
}

declare module 'three/examples/jsm/loaders/OBJLoader' {
  const OBJLoader: any;
  export { OBJLoader };
  export default OBJLoader;
}

declare module 'three/examples/jsm/loaders/MTLLoader' {
  const MTLLoader: any;
  export { MTLLoader };
  export default MTLLoader;
}

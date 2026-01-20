import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { VirtualizeService } from '../../services/virtualize.service';
import { ProduitsTypesService } from '../../services/produits-type.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-virtualize-material',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule,
    MatToolbarModule, MatButtonModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './virtualize.component.html',
  styleUrls: ['./virtualize.component.css']
})
export class VirtualizeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  // UI / form
  types: string[] = [];
  selectedType = '';
  areaHa = 1.0;
  days = 30;
  budget = 0;

  running = false;
  result: any = null;
  error: string | null = null;

  // three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
private controls!: InstanceType<typeof OrbitControls>;
  private animationId: any;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  // simple planted map (r_c -> mesh)
  planted = new Map<string, THREE.Object3D>();

  // workers list
  workers: { mesh: THREE.Object3D, target?: THREE.Vector3, speed: number }[] = [];

  private subs: Subscription[] = [];

  constructor(private virtSrv: VirtualizeService, private typesSrv: ProduitsTypesService) {}

  ngOnInit(): void {
    const s$ = this.typesSrv.getTypes().subscribe({
      next: (t: string[]) => { this.types = t; this.selectedType = t[0] || ''; },
      error: (e) => { console.warn('types load failed', e); this.types = ['Tomato','Olive','Banana']; this.selectedType = this.types[0]; }
    });
    this.subs.push(s$);
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.spawnWorkers(2);
    this.animate();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.subs.forEach(s => s.unsubscribe());
    cancelAnimationFrame(this.animationId);
    try { this.renderer?.dispose(); } catch {}
  }

  /* ------------------- Three.js init & loop ------------------- */
  private initThree() {
    const container = this.canvasContainer.nativeElement;
    const w = container.clientWidth || 900;
    const h = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeaf6e9);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(12, 10, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.9);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    this.scene.add(dir);

    // Ground
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xcfeacc });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // grid helper
    const grid = new THREE.GridHelper(24, 12, 0x9db79f, 0xdfefe0);
    this.scene.add(grid);

    // camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // raycast click binding
    this.renderer.domElement.addEventListener('pointerdown', (ev) => this.onCanvasPointer(ev as PointerEvent));
  }

  private animate = () => {
    // move workers towards targets
    for (const w of this.workers) {
      if (!w.target) this.assignWorkerTarget(w);
      const pos = w.mesh.position;
      const dir = new THREE.Vector3().subVectors(w.target!, pos);
      const d = dir.length();
      if (d > 0.1) {
        dir.normalize();
        w.mesh.position.addScaledVector(dir, w.speed * 0.03);
        w.mesh.lookAt(w.target!.x, w.mesh.position.y, w.target!.z);
      } else {
        this.assignWorkerTarget(w);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  }

  private onResize = () => {
    const c = this.canvasContainer.nativeElement;
    const w = c.clientWidth;
    const h = c.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /* ------------------- Interactions ------------------- */
  private onCanvasPointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // intersect with ground plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, pt);
    if (!pt) return;

    // quantize to grid (2 units cell)
    const cellX = Math.round(pt.x / 2) * 2;
    const cellZ = Math.round(pt.z / 2) * 2;
    const key = `${cellX}_${cellZ}`;
    if (this.planted.has(key)) return; // already planted
    this.plantAt(cellX, cellZ);
  }

  private plantAt(x: number, z: number) {
    // small plant (cone)
    const geom = new THREE.ConeGeometry(0.45, 1.0, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.1, roughness: 0.7 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, 0.5, z);
    mesh.castShadow = true;
    mesh.scale.setScalar(0.01); // start tiny
    this.scene.add(mesh);
    this.planted.set(`${x}_${z}`, mesh);
  }

  /* ------------------- Workers ------------------- */
  private spawnWorkers(count = 2) {
    for (let i=0;i<count;i++) {
      const geom = new THREE.BoxGeometry(0.9, 1.8, 0.6);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${(i*80)%360} 60% 45%)`) });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((Math.random()-0.5)*10, 0.9, (Math.random()-0.5)*8);
      mesh.castShadow = true;
      this.scene.add(mesh);
      const w = { mesh, speed: 1 + Math.random()*0.7 } as any;
      this.workers.push(w);
      this.assignWorkerTarget(w);
    }
    // attempt to load a nicer avatar (optional)
    this.loadWorkerModelIfExists();
  }

  private assignWorkerTarget(workerItem: any) {
    // choose random planted cell if any, otherwise random spot
    const keys = Array.from(this.planted.keys());
    if (keys.length) {
      const k = keys[Math.floor(Math.random()*keys.length)];
      const [xStr, zStr] = k.split('_');
      workerItem.target = new THREE.Vector3(Number(xStr), 0.9, Number(zStr));
    } else {
      workerItem.target = new THREE.Vector3((Math.random()-0.5)*12, 0.9, (Math.random()-0.5)*10);
    }
  }

  private loadWorkerModelIfExists() {
    const loader = new GLTFLoader();
    const path = 'assets/models/worker.glb';
    loader.load(path, (gltf: any) => {
      // replace worker boxes with GLTF clones
      this.workers.forEach(w => {
        const clone = gltf.scene.clone(true);
        clone.scale.setScalar(1.0);
        clone.position.copy(w.mesh.position);
        this.scene.remove(w.mesh);
        this.scene.add(clone);
        w.mesh = clone;
        // TODO: setup AnimationMixer if model has animations
      });
    },);
  }

  /* ------------------- Simulation call ------------------- */
  runSimulation() {
    if (!this.selectedType) { this.error = 'Sélectionner un type de produit'; return; }
    this.running = true;
    this.result = null;
    this.error = null;

    const payload = { product_id: this.selectedType, area_ha: this.areaHa, days: this.days, budget: this.budget };
    const sub = this.virtSrv.virtualize(payload).subscribe({
      next: (res) => {
        this.result = res;
        this.running = false;
        if (res && res.timeline) this.applyTimelineToPlants(res.timeline);
      },
      error: (e) => {
        console.error(e);
        this.running = false;
        this.error = 'Erreur simulation';
      }
    });
    this.subs.push(sub);
  }

  private applyTimelineToPlants(timeline: any[]) {
    // simple animation: scale plants according to timeline steps
    let step = 0;
    const maxSteps = Math.min(timeline.length, 40);
    const iv = setInterval(() => {
      const item = timeline[Math.min(step, timeline.length-1)];
      const growth = item ? item.growth : 100;
      this.planted.forEach(mesh => {
        const s = 0.01 + (growth / 100) * 1.0;
        mesh.scale.setScalar(s);
      });
      // move workers towards planted cells to show "work"
      this.workers.forEach(w => this.assignWorkerTarget(w));
      step++;
      if (step >= maxSteps) clearInterval(iv);
    }, 300);
  }
}

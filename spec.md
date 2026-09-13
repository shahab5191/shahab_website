Here is the comprehensive technical specification. It is structured to serve as a master architectural document that you can feed directly into your ticket-generation tools or LLM coding assistants to establish context, guardrails, and data contracts.

# Technical Specification: WebGL CRT Terminal Portfolio

## 1. System Overview

A hybrid web application that acts as a virtual operating system and rendering engine. It bridges standard DOM events, a custom JavaScript state machine (the "OS Kernel"), a 2D off-screen HTML5 Canvas ("VRAM"), and a WebGL/Three.js rendering pipeline ("CRT Monitor") with GLSL shaders. The system supports a seamless transition to a standard DOM-based modern UI overlay.

---

## 2. Architecture & Data Flow

The system strictly adheres to a unidirectional data flow to maintain 60FPS performance and decouple logic from presentation.

1. **Input Layer:** Global DOM `keydown` events are intercepted and sanitized.
2. **State Machine (OS Kernel):** Routes input to either the internal shell buffer or an active `Process`.
3. **Graphics API (VRAM):** The active process executes its logic and calls drawing primitives (`drawText`, `drawRect`) on an off-screen `CanvasRenderingContext2D`.
4. **Render Flagging:** Mutating the VRAM sets `isDirty = true`.
5. **WebGL Renderer (GPU):** On the next `requestAnimationFrame`, if `isDirty` is true, the `CanvasTexture` is uploaded to the GPU. GLSL shaders apply curvature, scanlines, and bloom.

---

## 3. Core Subsystems & Interfaces

### 3.1. The Process Interface

Every executable command or interactive application (e.g., a grid-based tower defense mini-game, an AI chat client) must implement the `Process` interface. This allows the OS to blindly route input and lifecycle events.

```javascript
class Process {
    // Called when the process is spawned by the shell
    init(graphicsHandle, systemArgs) {}
    
    // Receives raw keystrokes from the OS
    handleInput(key, modifiers) {}
    
    // Optional: Called per frame for physics/animations in games
    update(deltaTime) {}
    
    // Called when the process exits or is killed by the OS
    cleanup() {}
}

```

### 3.2. Terminal Graphics API (VRAM)

The `TerminalGraphics` class encapsulates the off-screen canvas. Anti-aliasing is strictly disabled (`imageSmoothingEnabled = false`) to ensure pixel-perfect retro aesthetics before shader distortion.

| Method Signature | Description |
| --- | --- |
| `drawText(col, row, text, hexColor)` | Renders monospace text to a specific grid coordinate. |
| `drawRect(x, y, w, h, hexColor)` | Draws a solid rectangle. |
| `drawCircle(x, y, radius, hexColor)` | Draws an unfilled circle for UI elements. |
| `setPixel(x, y, hexColor)` | Writes a single 1x1 pixel for demoscene effects or particle systems. |
| `clearScreen(hexColor)` | Flushes the buffer. |
| `markDirty()` | Internal flag. Must be called after any draw operation to trigger GPU upload. |

### 3.3. Input Routing & Shell Logic

* **Keybindings:** Standard ASCII character keys append to the shell buffer. `Backspace` slices the buffer. `Enter` flushes and parses the buffer.
* **Navigation:** Up/Down arrows traverse a `commandHistory` array.
* **Editor Modifiers:** Support basic Neovim/Vim style traversal (e.g., `Ctrl+W` to delete a word) in the shell input to accommodate developer muscle memory.

---

## 4. The WebGL & Shader Pipeline

The 3D scene consists of a low-poly CRT monitor `.glb` asset with a custom `ShaderMaterial` applied specifically to the screen mesh.

### 4.1. Texture Management

* **Source:** `THREE.CanvasTexture` utilizing the VRAM canvas.
* **Filtering:** `THREE.NearestFilter` for both `minFilter` and `magFilter` to prevent WebGL from blurring the sharp 2D text.

### 4.2. Fragment Shader (GLSL) Specifications

The custom fragment shader must execute the following operations in order:

1. **Coordinate Mapping:** Normalize `vUv` coordinates from `[0.0, 1.0]` to `[-1.0, 1.0]`.
2. **Barrel Distortion:** Apply a cubic distortion formula to push the center outward and compress the edges, simulating convex CRT glass.
3. **Chromatic Aberration:** Sample `tDiffuse` three times using slightly offset UV coordinates (scaled by distance from the center) to isolate and shift the R, G, and B channels.
4. **Scanlines:** Multiply the resulting color by `sin(vUv.y * scanlineDensity + u_time)` to create rolling horizontal lines.
5. **Vignette:** Darken the edges based on the distance from the UV center `vec2(0.5)`.

### 4.3. Post-Processing

* Use `THREE.EffectComposer`.
* Apply `UnrealBloomPass` with a low threshold and moderate strength to simulate phosphor glow.

---

## 5. UI Transitions & Context Switching

The transition from terminal to the modern UI must be seamless and resource-efficient.

* **Trigger:** A raycast collision on a 3D button mesh, or execution of the `ui` terminal command.
* **Animation:** A GSAP timeline animates the Three.js `camera.position` and `camera.fov` to push the camera directly into the center of the CRT screen.
* **Resource Throttling:** Once the camera animation completes:
1. The modern DOM `div` overlay fades in (`opacity: 1`, `pointer-events: auto`).
2. The Three.js `requestAnimationFrame` loop is intentionally halted to free up CPU/GPU cycles.
3. The global DOM `keydown` listener is suppressed.



---

## 6. Cloud Backend Integration (Future-Proofing)

While the frontend is statically hosted, the terminal acts as an interface for external APIs.

* **Infrastructure as Code:** Provision AWS infrastructure via OpenTofu/Terraform.
* **Hosting:** Deploy the static Vite build to an AWS S3 bucket distributed via CloudFront.
* **Backend Hooks:** Terminal commands (e.g., `fetch_jobs`, `ask_ai`) can execute asynchronous `fetch()` requests against an API Gateway.
* **Compute:** API Gateway routes to AWS Bedrock for AI responses, or to Go/Python microservices running on ECS Fargate Spot for heavier background processing or hybrid search/vector database queries (pgvector). The terminal displays a loading state (e.g., a spinning ASCII cursor) while awaiting the HTTP response.

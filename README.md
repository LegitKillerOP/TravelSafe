# **TravelSafe™ Node — Multi-Session Daemon Router**

TravelSafe™ is a high-fidelity, localized peer-to-peer telemetry and tactical intercept grid engineered for real-time transit security. Built using React, TypeScript, and Tailwind CSS, the application establishes an encrypted mesh network environment that bridges civilians, localized guardians, and central law enforcement vectors during emergency SOS contingencies.

Developed by **Team AceCoders**.

---

## **🛰️ Core System Architecture**

The application functions as an asynchronous decentralized node matrix where every logged-in user represents a network node with strict role-based capability matrices:

*   **Civilian (`user` mode):** Houses the mobile telemetry stream interface. Features live duration trackers, zero-latency SOS triggers, and verification hooks.
*   **Guardian (`guardian` mode):** Operates the **AURA™ Tactical Interceptor** view. Grants localized supervisors access to real-time radial radar map overlays, telemetry vectors, and corridor locking utilities.
*   **Law Enforcement (`police` mode):** Boots into the **Police Vault Dashboard** for high-priority emergency containment, historical cryptographic ledger validation, and administrative oversight.

---

## **⚙️ Key Technical Features**

### 1. Contextual State Routing
Powered by a consolidated global `AppProvider` context, state transitions react instantly to active security events. If an emergency signal triggers, the global context updates the interface dynamically, morphing theme elements from an inactive slate setup to high-intensity warning tones.

### 2. Multi-Tiered SOS Overlay Layer (`SOSOverlay`)
A global toast layer decoupled from layout flows that handles layout adjustments based on node classification:
*   **Civilians** view an inline, top-anchored HUD flashing stream progression metrics.
*   **Guardians/Police** interface with an off-center, top-right absolute widget with tracking locks and dismiss mechanisms that sit safely away from primary central interactive grids.

### 3. Verification Protocols
Integrates validation keys checking core properties (such as basic biographical details, positional coordinates, and third-party compliance data) to prevent false alerts or identity spoofing across the mesh array.

---

## **🚀 Installation & Local Environment Setup**

### **Prerequisites**
*   **Node.js** (v18.0 or higher recommended)
*   **npm** or **yarn** package manager

### **Execution Protocol**

1. **Clone & Navigate to Repository**
```bash
git clone https://github.com/LegitKillerOP/TravelSafe.git
cd TravelSafe
```

2. Install Project Dependencies
```Bash
npm install
```
or
```bash
yarn install
```
3. Spin Up Local Mesh Development Server
```Bash
npm run dev
```
or
```bash
yarn dev
```

## **4. Build Production Distribution Artifacts**
```Bash
npm run build
```
---

## **🎨 Design Language & Component Stack**

*   **Framework Architecture:** React 18+ with TypeScript structural contracts.
*   **Styling Engine:** Tailwind CSS utilizing dark-mode typography frameworks (`bg-slate-950`, `text-slate-100`).
*   **Iconography:** `lucide-react` (Provides standard diagnostic glyphs such as `Shield`, `AlertOctagon`, `Radio`, and `MapPin`).
*   **Animations:** Specialized CSS keyframe vectors for radial sweeps, pulse indicators, and fluid canvas layouts.
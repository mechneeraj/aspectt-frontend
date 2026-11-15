# Aspectt OTT — Developer Asset & Design System Specification

> **Version:** 1.0.0  
> **Platform:** Aspectt OTT (Independent Cinema Streaming)  
> **Target Audience:** Frontend Developers, UI/UX Designers, Content & Ingestion Teams

---

## 1. Theme Color Palette & Color Codes

Aspectt strictly adheres to a **Deep Ash Gray Matte** aesthetic with **Matte Purple** interactive accents. Glows, glossy gradients, glassmorphism, and neon highlights are prohibited.

### Surface & Background Tokens
| Token Name | Hex Code | RGB | Tailwind Class / Usage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `#1E2024` | `rgb(30, 32, 36)` | `bg-[#1E2024]` | Global application background (min-h-screen) |
| **Card / Elevated Surface** | `#282B30` | `rgb(40, 43, 48)` | `bg-[#282B30]` | Movie cards, panels, modals, hero decks |
| **Deep Surface / Inputs** | `#222428` | `rgb(34, 36, 40)` | `bg-[#222428]` | Nested panels, modal headers, search inputs |
| **Flat Border** | `#353941` | `rgb(53, 57, 65)` | `border-[#353941]` | Universal card, divider, and container border (`1px solid`) |
| **Border Hover** | `#4E535E` | `rgb(78, 83, 94)` | `hover:border-[#4E535E]` | Subtle card and button hover outline |

### Interactive & Brand Accent Tokens
| Token Name | Hex Code | RGB | Tailwind Class / Usage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Matte Purple (Primary)** | `#7E57C2` | `rgb(126, 87, 194)` | `bg-[#7E57C2]`, `text-[#7E57C2]` | Primary buttons, active tabs, duration highlights |
| **Purple Hover** | `#673AB7` | `rgb(103, 58, 183)` | `hover:bg-[#673AB7]` | Button hover state |
| **Purple Active / Press** | `#512DA8` | `rgb(81, 45, 168)` | `active:bg-[#512DA8]` | Button pressed state |
| **Purple Light Tint** | `#9575CD` | `rgb(149, 117, 205)` | `text-[#9575CD]` | Subtle icon or secondary badge highlight |
| **Focus / Selection Ring** | `rgba(126, 87, 194, 0.4)` | — | `focus:border-[#7E57C2]` | Selected avatar and form input glow ring |

### Typography & Content Tokens
| Token Name | Hex Code | RGB | Tailwind Class / Usage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Primary White** | `#FFFFFF` | `rgb(255, 255, 255)` | `text-white` | Movie titles, headings, active labels |
| **Secondary Text** | `#B8BCC4` | `rgb(184, 188, 196)` | `text-[#B8BCC4]` | Director credits, subheadings, synopsis |
| **Subtle / Metadata** | `#8A8F99` | `rgb(138, 143, 153)` | `text-[#8A8F99]` | Year, duration, footer labels, placeholders |
| **Danger / Destructive** | `#E57373` | `rgb(229, 115, 115)` | `text-[#E57373]`, `bg-[#24171A]` | Logout action, error states, warnings |

---

## 2. Typography Guidelines

* **Primary Font Family:** `'Inter', 'Roboto', system-ui, sans-serif`
* **Monospace Font:** Standard browser monospace (`font-mono`) for timestamps, durations (`3m 42s`), release years, and step counts.
* **Weights:**
  * **Brand Wordmark:** `font-extrabold` (800)
  * **Page & Section Headings:** `font-bold` (700) or `font-extrabold` (800)
  * **Buttons & Badges:** `font-semibold` (600)
  * **Card Labels / Director Names:** `font-medium` (500)
  * **Body Copy & Metadata:** `font-normal` (400)

---

## 3. Brand Logo & Favicon Specifications

### Navbar Wordmark Logo ("ASPECTT")
* **Render Mode:** Custom SVG Component (`src/components/AspectLogo.jsx`).
* **Interactivity:** Non-clickable (`pointer-events-none`, `select-none`, `cursor-default`), no reload, no navigation.
* **Finish:** Strictly flat matte (zero drop shadows, zero gradients, zero glow effects).
* **Wordmark Construction:**
  1. **Custom Letter "A":**
     * **Left Ascending Diagonal Stroke (`/`):** ~2.5x thicker (extra bold, ~6.5px perpendicular) in **Matte Purple (`#7E57C2`)**.
     * **Right Descending Diagonal Stroke (`\`) & Horizontal Crossbar (`-`):** Standard bold (~2.6px) in **crisp White (`#FFFFFF`)**.
  2. **Letters "SPECT":**
     * Rendered in bold geometric sans-serif **crisp White (`#FFFFFF`)** matching the exact cap-height (18px) and baseline.
  3. **Final Letter "T":**
     * Rendered in **Matte Purple (`#7E57C2`)** to create visual harmony balancing the purple opening stroke of the "A".
* **Dimensions:**
  * Height: `24px` on mobile (`h-6`), `28px` on tablet & PC (`sm:h-7`).
  * Width: Proportional auto (`w-auto`, viewBox `0 0 134 28`).

### Graphic Logo File (When uploading vector or raster files)
| Property | Specification |
| :--- | :--- |
| **Aspect Ratio** | `4.8:1` landscape (`134 × 28` viewBox) |
| **Recommended Canvas Size** | `670 × 140 px` or `1340 × 280 px` (Retina 2x/4x ready) |
| **Display Dimensions** | `115 × 24 px` (Mobile) to `134 × 28 px` (PC/Tablet) |
| **File Format** | SVG (preferred with transparent background) or PNG-24 with alpha |
| **Foreground Colors** | `#FFFFFF` (Letters "SPECT" and right leg/crossbar of "A"), `#7E57C2` (Left leg of "A" & final "T") |

### App Favicon
| Property | Specification |
| :--- | :--- |
| **Aspect Ratio** | `1:1` (Square) |
| **Recommended Canvas Size** | `512 × 512 px` (master), exported to `192 × 192 px` and `32 × 32 px` |
| **File Format** | SVG or PNG |
| **Design Style** | `#7E57C2` background with `20%` corner radius squircle and a bold white uppercase **"A"** centered |

---

## 4. Master Image Aspect Ratio & Dimension Matrix

| Component | Target Platform | Orientation | Aspect Ratio | Recommended Size (px) | Minimum Size (px) | Accepted Formats | Corner Radius |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Movie Catalog Grid** | **Mobile** (`< 640px`) | Portrait (Vertical) | **`2:3`** (`aspect-poster`) | **`600 × 900`** | `400 × 600` | WebP, JPEG, PNG | `rounded-lg` (`8px`) |
| **Movie Catalog Grid** | **PC & Tablet** (`≥ 640px`) | Landscape (Horizontal) | **`16:9`** (`aspect-video`) | **`1280 × 720`** | `640 × 360` | WebP, JPEG, AVIF | `rounded-xl` (`12px`) |
| **Hero Deck Cards** | **Mobile** (`< 768px`) | Portrait (Vertical) | **`2:3`** or **`9:16`** | **`1080 × 1620`** | `720 × 1080` | WebP, JPEG | `rounded-xl` (`12px`) |
| **Hero Deck Cards** | **PC & Tablet** (`≥ 768px`) | Landscape (Cinematic) | **`16:9`** | **`1920 × 1080`** | `1280 × 720` | WebP, JPEG | `rounded-xl` (`12px`) |
| **Behind the Lens Clips** | **All Platforms** (PC, Tab, Mob) | Landscape (Video) | **`16:9`** (`aspect-video`) | **`1280 × 720`** | `800 × 450` | WebP, JPEG | `rounded-xl` (`12px`) |
| **Movie Details Main Poster** | **All Platforms** | Portrait (Key Art) | **`2:3`** (`aspect-poster`) | **`1000 × 1500`** | `600 × 900` | WebP, JPEG | `rounded-xl` / `rounded-2xl` (`16px`) |
| **Movie Details Backdrop Still** | **All Platforms** | Landscape (Backdrop) | **`16:9`** | **`1920 × 1080`** | `1280 × 720` | WebP, JPEG | `rounded-none` / Full bleed |
| **User Profile Avatars** | **All Platforms** | Square | **`1:1`** (Circular/Squircle) | **`256 × 256`** | `128 × 128` | SVG, PNG, WebP | `50%` (Circle) or `14px` |

---

## 5. Detailed Component Specifications

### 5.1 Movie Catalog Cards (`MovieCard.jsx`)

#### Mobile View (`< sm` / `< 640px`)
* **Grid Layout:** 3 columns per row (`grid-cols-3 gap-2`).
* **Image Orientation:** Vertical Portrait Poster.
* **Aspect Ratio:** **`2:3`** (`aspect-poster`).
* **Ideal Upload Dimensions:** `600 × 900 px` (at 72–150 DPI).
* **Corner Radius:** `rounded-lg` (`8px`).
* **Border:** `1px solid #353941`.
* **Hover State:** Border transitions to `#4E535E` with subtle image scale `scale-[1.03]`.

#### PC & Tablet View (`sm:` and above / `≥ 640px`)
* **Grid Layout:**
  * Tablet (`640px–768px`): 3 columns (`sm:grid-cols-3 gap-4`).
  * Small PC / Medium (`768px–1024px`): 4 columns (`md:grid-cols-4 gap-4`).
  * Standard PC (`1024px–1280px`): 5 columns (`lg:grid-cols-5 gap-4.5`).
  * Large PC / Wide (`≥ 1280px`): 6 columns (`xl:grid-cols-6 gap-4.5`).
* **Image Orientation:** Horizontal Landscape Backdrop.
* **Aspect Ratio:** **`16:9`** (`aspect-video`).
* **Ideal Upload Dimensions:** `1280 × 720 px` or `1920 × 1080 px` (Full HD).
* **Corner Radius:** `rounded-xl` (`12px`).
* **Border:** `1px solid #353941`.

---

### 5.2 Hero Stacked Card Deck (`HeroSlider.jsx`)

The Hero Slider features a **75% / 25% horizontal tiered stack ratio** on all devices:
* **Top Front Card:** Covers **75%** of the container width (`w-[75%]`, `left: 0%`).
* **Revealing Below Cards:** Take up the remaining **25%** of the container width:
  * Card 1: `left: 8.33%` (Reveals strip from 75% to 83.33%).
  * Card 2: `left: 16.67%` (Reveals strip from 83.33% to 91.67%).
  * Card 3: `left: 25%` (Reveals strip from 91.67% to 100%, flush with right edge).

#### Artwork Asset Requirements:
1. **Desktop / Tablet (`hidden md:block`):**
   * **Format:** Landscape Key Art / Backdrop.
   * **Aspect Ratio:** `16:9` (1.78:1).
   * **Dimensions:** `1920 × 1080 px` (master) or `2560 × 1440 px` (2K QHD).
   * **Safe Area:** Keep subject art and title in the upper and right portions; lower-left 40% will be overlaid by title, metadata, and buttons.
2. **Mobile (`block md:hidden`):**
   * **Format:** Portrait Key Art / Poster.
   * **Aspect Ratio:** `2:3` or `9:16` vertical.
   * **Dimensions:** `1080 × 1620 px` or `1080 × 1920 px`.
   * **Safe Area:** Lower 35% is covered by gradient and action controls.

---

### 5.3 Behind the Lens Footage Showcase

Applied across `Home.jsx` (`FootageStackSlider.jsx`) and `/behind-the-lens` (`BehindTheLens.jsx`).

* **Image Orientation:** Horizontal Production Stills / Video Frames.
* **Aspect Ratio:** **`16:9`** (`aspect-video`).
* **Ideal Upload Dimensions:** `1280 × 720 px` (720p HD) or `1920 × 1080 px` (1080p Full HD).
* **Layout Modes:**
  * **PC & Tablet (`Home.jsx`):** Single row of 4 columns (`sm:grid-cols-4 gap-4`).
  * **Mobile (`Home.jsx`):** 75% front card + 25% revealing below cards horizontal swipe deck.
  * **All Clips Archive (`/behind-the-lens`):** Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5`).
* **Overlay Elements:** Duration badge pinned bottom-right (`bottom-2 right-2`), play icon watermark centered on hover.

---

### 5.4 Movie Details Page (`MovieDetails.jsx`)

1. **Feature Film Poster:**
   * **Aspect Ratio:** **`2:3`** (`aspect-poster`).
   * **Container Max Width:** `max-w-xs` (`320px`).
   * **Ideal Upload Dimensions:** `1000 × 1500 px` (High Res).
   * **Corner Radius:** `rounded-xl sm:rounded-2xl` (`16px`).
   * **Border:** `1px solid #353941`.
2. **Video Player Modal Canvas (`PlayerModal.jsx`):**
   * **Aspect Ratio:** **`16:9`** (`aspect-video`).
   * **Ideal Upload Dimensions:** `1920 × 1080 px` (Full HD still) or direct video stream.

---

### 5.5 DiceBear User Avatars (`src/data/avatars.js`)

* **Integration Engine:** DiceBear API v10.x.
* **Styles Used:**
  1. `lorelei` (`https://api.dicebear.com/10.x/lorelei/svg`)
  2. `micah` (`https://api.dicebear.com/10.x/micah/svg`)
* **Background Color Palette:**
  * `#7E57C2` (Matte Purple: `backgroundColor=7E57C2`)
  * `#282B30` (Deep Ash Gray Surface: `backgroundColor=282B30`)
* **Display Sizes & Shapes:**
  * **Navbar:** `34 × 34 px` with `borderRadius: '50%'` (perfect circle).
  * **Profile Header:** `80 × 80 px` with `borderRadius: '14px'` (squircle).
  * **Edit Profile Selector:** `54 × 54 px` with `borderRadius: '50%'` (circle).
* **Storage Key:** Synchronized with `localStorage.getItem('aspectt_user_avatar')` (with backward-compatible fallback to `aspect_user_avatar`).
* **Default Avatar:**  
  `https://api.dicebear.com/10.x/micah/svg?seed=Alex&backgroundColor=7E57C2`

---

## 7. Logo Specifications ("ASPECTT" Wordmark)

The primary wordmark is rendered as a clean, sharp, flat-matte SVG component (`AspectLogo.jsx`).

* **Wordmark Text:** **`ASPECTT`**
* **Typography:** Bold uppercase geometric sans-serif (`Montserrat`, `Inter`, `Arial Black`, `sans-serif`), weight `800`, letter-spacing `-0.01em`.
* **Letter "A" Geometry:**
  * **Left Ascending Leg:** Solid, extra-wide slanted parallelogram (`/`) in **Matte Purple (`#7E57C2`)** running from cap-height ($y=5$) down to baseline ($y=23$).
  * **Right Descending Leg & Crossbar:** Precision geometric path in crisp **White (`#FFFFFF`)**.
* **Remaining Letters:**
  * **"SPECT":** Crisp **White (`#FFFFFF`)**.
  * **Final "T":** **Matte Purple (`#7E57C2`)**, balancing the purple left stroke of the "A".
* **Dimensions & Ratios:**
  * **SVG ViewBox:** `0 0 126 28` (aspect ratio ~ `4.5:1`).
  * **Navbar Display Height:** `h-6` (`24px`) on mobile, `sm:h-7` (`28px`) on tablet/desktop with `w-auto`.
  * **Favicon / App Icon Alternative:** Minimum `64 × 64 px`, recommended `512 × 512 px` (PNG / SVG).
* **Finish & Interaction:**
  * Flat matte (no drop shadows, glow, or gradients).
  * Non-clickable (`select-none cursor-default pointer-events-none`).

---

## 8. Full-Stack Project Architecture

The **Aspectt** platform is cleanly decoupled into two dedicated sibling directories:

```text
Downloads/
├── OTT/                # React 18 + Vite Frontend Application
└── OTT-backend/        # Node.js + Express + Prisma + PostgreSQL Server
    ├── prisma/
    │   └── schema.prisma    # 5 PostgreSQL Models (User, Movie, Watchlist, BehindTheLens, FilmSubmission)
    ├── src/
    │   ├── index.js         # Express app, CORS, JSON parser, and GET /api/health
    │   └── prisma.js        # Global PrismaClient singleton
    ├── .env.example         # Environment configuration template
    ├── .env                 # Local configuration (PORT=5000, PostgreSQL URL, JWT)
    ├── .gitignore           # Ignored dependencies and secrets
    └── package.json         # Server scripts and dependencies
```




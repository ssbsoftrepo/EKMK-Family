# Erode KMK Family Heritage Platform • Full-Stack Architecture

A modern Tamil family heritage and interactive genealogy platform designed to preserve roots, connect generations, and celebrate the legacy of the **Erode KMK Kudumbam** across multiple generations (from founding couple in 1912 to 80+ dynamic relatives across 5 generations).

---

## 🏛️ Project Directory Structure

```text
Family-Tree-EKMK/
├── frontend/                     # Public Heritage & Genealogy Website (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/familyApi.ts      # REST API client connecting to Spring Boot backend
│   │   ├── context/              # FamilyContext (Real-time dynamic state from PostgreSQL)
│   │   ├── components/           # Home, Interactive Tree, Profile, and Common components
│   │   └── types/family.ts       # Domain types (ViewTab: 'home' | 'tree')
│   ├── package.json
│   └── vite.config.ts            # Port 5173, Proxy /api -> http://localhost:8081
│
├── admin/                        # Dedicated Executive Admin Website (Standalone Web App)
│   ├── src/
│   │   ├── api/familyApi.ts      # Full CRUD API client
│   │   ├── context/              # AdminContext (Add, Edit, Delete, Seed Reset, Live Sync)
│   │   ├── components/Admin/     # AdminDashboard, AddMemberModal, EditMemberModal
│   │   └── types/family.ts       # Domain types
│   ├── package.json
│   └── vite.config.ts            # Port 5174, Proxy /api -> http://localhost:8081
│
└── backend/                      # Spring Boot 4.1.2 + Java 21 + Gradle + PostgreSQL
    ├── src/main/java/com/ekmk/familytree/
    │   ├── model/                # JPA Entities (FamilyMember, FamilyBranch)
    │   ├── repository/           # Spring Data JPA Repositories
    │   ├── service/              # FamilyMemberService, FamilyBranchService (CRUD + stats)
    │   ├── controller/           # REST Controllers (/api/members, /api/branches, /api/stats, /api/admin)
    │   └── config/               # CorsConfig
    ├── src/main/resources/
    │   └── application.properties # PostgreSQL Database: kmk-family & Server Port 8081
    ├── build.gradle              # Gradle build targeting Java 21 with PostgreSQL JDBC driver
    └── gradlew                   # Gradle wrapper script
```

---

## 🚀 Running the System

### 1. Backend (Spring Boot + Java 21 + Gradle + PostgreSQL)

PostgreSQL database is configured with database name `"kmk-family"` on port 5432.

```bash
cd backend
./gradlew bootRun
```
- **Backend Port**: `http://localhost:8081`
- **PostgreSQL Database**: `kmk-family` (PostgreSQL 16)
- **Health Check**: `http://localhost:8081/api/admin/health`
- **Dynamic Stats API**: `http://localhost:8081/api/stats`

### 2. Public Family Website (Heritage & Interactive Tree)

```bash
cd frontend
npm run dev
```
- **Public Website URL**: `http://localhost:5173/`
- Displays public ancestral lineage, founding couple spotlight, interactive canvas tree, and person profiles.

### 3. Executive Admin Website (Standalone Admin Portal)

```bash
cd admin
npm run dev
```
- **Admin Website URL**: `http://localhost:5174/`
- Provides member registration wizard (auto parent-child linking, generation calculation), record editor, deletion, search/filter, and database seed reset tools.

---

## 🌐 Dynamic REST API Endpoints

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/members` | All family members for the public website (no addresses, emails or form notes; phone numbers stay for the Call / WhatsApp buttons) |
| `GET` | `/api/admin/members` | All family members with every detail, for the admin site (also `/api/admin/members/search`, `/api/admin/members/{id}`) |
| `GET` | `/api/members/{id}` | Retrieve specific member with relationship hierarchy |
| `POST` | `/api/members` | Insert new family member (updates parents' `childIds` and spouse link) |
| `PUT` | `/api/members/{id}` | Update member profile and reciprocal relations |
| `DELETE` | `/api/members/{id}` | Delete member and clean up reciprocal relationship references |
| `GET` | `/api/branches` | Retrieve all 11 family branches |
| `GET` | `/api/stats` | Dynamic PostgreSQL stats (total members, generations, living, deceased) |
| `GET` | `/api/admin/health` | Backend and runtime health check |
| `POST` | `/api/admin/import` | Upload the Google Form responses (`.xlsx` / `.csv`, field `file`). Tidies phones, names, places and jobs; safe to repeat (only new people are added) |
| `GET` | `/api/settings` | Website link and the WhatsApp message templates (`{name}`, `{site}`) |
| `PUT` | `/api/settings` | Change any of those settings (unknown keys are ignored) |

---

## 📸 The family website ("family album" look)

A photo album, phone first, bilingual labels (English + Tamil), big buttons, no login screens yet:

| Page | Address | What it shows |
|---|---|---|
| Home | `#/` | Family photo (admin → Share → Home page photo), welcome, today's birthdays with a WhatsApp wish, big buttons, coming birthdays (day and month only), some family faces |
| Find a relative | `#/find` | Search by name, town or job; one chip per branch ("Ravi's family"); photo grid |
| One person | `#/person/<id>` | Big photo, who they are, "in their words", close family as photos, Call / WhatsApp, "How is … related to me?" |
| One family | `#/family/<id>` | A couple's photos and their children; tap to go one step down, "Up to …" to go back up |
| Whole tree | `#/tree` | Elders on top, one colour per branch, **Bigger / Smaller** buttons and **Find a name** |
| How are we related? | `#/related/<id>` | Tap your own photo once (remembered on that phone only), then anyone: the Tamil name (சித்தப்பா, Chithappa), a plain explanation ("your appa's younger brother") and the chain of photos between you |

The relation names live in `frontend/src/album/kinship.ts`; `npm run check:kinship` (in `frontend/`) checks them against a made-up family.

---

## 🧭 Admin in 3 steps

The admin site opens on three simple steps, plus **All members**:

1. **Add people**: upload the Google Form file. The site tidies it and only asks what it cannot guess (man or woman, possible duplicates). Upload again whenever new answers arrive.
2. **Build the tree**: one question at a time ("Who are the children of …?", "Who is … married to?"), answered by tapping photos. Likely answers come first with a clue (same address, same phone, the form's father/mother/spouse names). Only parent → child and husband ↔ wife links are ever set. A **Still to do** list shows everyone not on the tree yet and every unanswered question, so nobody is left out. Every answer is saved at once; **Undo last** reverses the latest one.
3. **Share the link**: the website address, the home page photo and the editable WhatsApp messages.

**All members** shows everyone as photos (search, and filters such as "No photo yet" and "Not on the tree yet"). Tapping a person opens one page with every detail, a big **Change photo** button, "Has passed away", their family links (father, mother, husband or wife, children; each changed by tapping a photo) and **Delete**, which asks first. Every change saves on its own.

**WhatsApp needs no setup.** The buttons are plain `https://wa.me/<number>?text=…` links: they open WhatsApp on the visitor's phone with the message ready, and the visitor presses send. No WhatsApp API, account or approval is involved. The public site shows **Call** and **WhatsApp** buttons on a person's profile (only when they gave a phone number) and a **Birthday today** section with a one-tap wish.

> There is no login for now. The public `/api/members` therefore leaves out addresses, emails and the admin's form notes (`PublicMembers`); phone numbers stay public for the Call and WhatsApp buttons. The full records are only on `/api/admin/members`.

**Tip for the Google Form:** questions named "Man / Woman" (or "Gender") and "Father's name", "Mother's name", "Spouse's name" are picked up automatically and make step 2 almost one-tap.

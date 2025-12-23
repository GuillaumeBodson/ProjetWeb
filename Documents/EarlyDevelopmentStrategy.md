# Early Development Strategy

## Overview
This document outlines the initial development approach for the Paddle Sites Management application. The strategy prioritizes frontend development using Angular to establish the user interface, data structures, and feature priorities before backend implementation.

## Strategic Approach

### Frontend-First Development
The initial development phase will focus on **Angular frontend development** to: 
- Visualize and validate user workflows
- Define and prioritize features based on UI requirements
- Identify the underlying data structures needed
- Establish data formats and interfaces early
- Create a foundation for backend API specifications

This approach ensures that: 
1. UI/UX can be tested and refined early
2. Data requirements are clearly defined before backend development
3. API contracts are established through TypeScript interfaces
4. Backend development can follow TDD with clear requirements

## Phase 1: Foundation

### 1.1 Classic Page Layout
Create the base application structure with standard layout components:

#### Components to Develop
```
src/app/
├── layout/
│   ├── header/
│   │   ├── header.component. ts
│   │   ├── header.component.html
│   │   └── header.component.css
│   ├── menu/
│   │   ├── menu.component.ts
│   │   ├── menu.component.html
│   │   └── menu.component.css
│   ├── footer/
│   │   ├── footer.component.ts
│   │   ├── footer. component.html
│   │   └── footer.component.css
│   └── main-layout/
│       ├── main-layout.component.ts
│       ├── main-layout. component.html
│       └── main-layout.component.css
```

#### Layout Structure
```html
<app-header></app-header>
<app-menu></app-menu>
<main class="content">
  <router-outlet></router-outlet>
</main>
<app-footer></app-footer>
```

#### Header Component
**Purpose**: Application branding, user info, notifications
- Logo and application title
- User profile button (if authenticated)
- Notifications icon
- Quick actions menu

#### Menu Component
**Purpose**:  Main navigation
- Admin section: 
  - Sites list
  - Site management
  - Statistics
- User section (for future development):
  - Public matches
  - My reservations
  - Match history
  - Profile
  - Rankings

#### Content Area
**Purpose**: Dynamic page content via routing
- Main content area for routed components
- Breadcrumb navigation
- Page title and actions

#### Footer Component
**Purpose**: Secondary information and links
- Copyright information
- Links to terms and privacy
- Version information
- Contact details

### 1.2 Data Models Definition
Define TypeScript interfaces based on `analyse.md`:

```typescript
// models/site.model.ts
export interface Site {
  id: int;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  closedDays: DayOfWeek[];
  openHour: string;  // Format: "HH:mm"
  closeHour: string; // Format: "HH:mm"
  courts: Court[];
}

// models/court.model.ts
export interface Court {
  id:  string;
  number: number;
  siteId: string;
}
```

## Phase 2: Admin Features

### 2.1 First Page - Admin Sites List
**Priority**: HIGH  
**Component**: `admin/sites-list`

#### Purpose
Display an overview of all paddle sites in the system for administrators.

#### Features
- Display all sites in a table/grid format
- Search and filter capabilities
- Sort by name, number of courts, status
- Quick actions:  View, Delete
- "Add New Site" button (for futur dev)

#### UI Elements
```
┌─────────────────────────────────────────────────┐
│ Sites Management                    [+ Add Site]│
├─────────────────────────────────────────────────┤
│ Search:  [____________]  Filter: [All ▼]         │
├──────┬─────────────┬────────┬──────────┬────────┤
│ Name │ Courts      │ Hours  │ Status   │ Actions│
├──────┼─────────────┼────────┼──────────┼────────┤
│ Site1│ 4 courts    │ 8-22   │ Active   │ [⋮]    │
│ Site2│ 6 courts    │ 9-23   │ Active   │ [⋮]    │
│ Site3│ 3 courts    │ 10-20  │ Inactive │ [⋮]    │
└──────┴─────────────┴────────┴──────────┴────────┘
```

### 2.2 Second Page - Site Management
**Priority**: HIGH  
**Component**:  `admin/site-management`

#### Purpose
Create, view, and edit detailed information about a paddle site.

#### Features
- **View Mode**: Display all site information
- **Edit Mode**: Modify site details
- (**Create Mode**: Add a new site)
- Court management (add, edit, remove courts)
- Operating hours configuration
- Closed dates selection
- Site branding (colors)

#### UI Layout
```
┌─────────────────────────────────────────────────┐
│ ← Back to Sites    Site Management   [Save][×] │
├─────────────────────────────────────────────────┤
│ Basic Information                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Site Name: [_____________________________]  │ │
│ │ Primary Color: [#______] [🎨]               │ │
│ │ Secondary Color: [#______] [🎨]             │ │
│ └─────────────────────────────────────────────┘ │

│                                                 │
│ Courts Management              [+ Add Court]    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Court 1  [Edit] [Delete]                    │ │
│ │ Court 2  [Edit] [Delete]                    │ │
│ │ Court 3  [Edit] [Delete]                    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```
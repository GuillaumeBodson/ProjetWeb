# Frontend Architecture

The technology used to devolop the user interface is Angular(v21.x).

The Angular framework goes with the implementation of the MVVM pattern. The details of this pattern will not be discussed here. 

## Folder structure

The folder structure will match the pages of the application and so will look like this: 

```
src/app/
├── views 
|   ├── pages/
│   |   ├── home/
│   │   |   ├── components/
│   │   |   ├── services/
│   │   |   └── models/
│   |   ├── dashboard/
│   |   └── ...
│   |
|   └── shared/
│       ├── components/│          
│       ├── services/ (generic utilities only)
│       └── models/
│
├── assets/
└── app.routes.ts 
```

the services will be located at the closest of the component/page that use it. If a service is used across mutiple pages, the service will be placed in the shared directory in the root of the page directory.


## Service Organization Guidelines


1. **Page-Level Services** (`src/app/views/pages/services/`)
   - Services used by multiple components within the same page
   - **Example**: `user-list.service.ts` shared between `user-list` and `user-detail` components

2. **Component-Level Services** (alongside component)
   - Services used by a single component only
   - **File location**: Same folder as the component
   - **Example**: `src/app/views/pages/home/home.service.ts`

3. **Standalone Services** (`src/app/views/standalone/[feature]/services/`)
   - Services specific to standalone pages/features
   - Isolated from the main page structure

## Model Organization Guidelines

The service's rules are applied to models.

## Shared directory

- **Shared**: Reusable UI components, pipes, directives used across multiple features
  - Examples: buttons, modals, form inputs, pagination
  - Located in `src/app/views/shared/`


## Libraries 

The followed librairies will be used accross the whole applications:
  - **Angular Material** — UI components following Material Design.
  - **Tailwind CSS** — utility-first styling.
  - **RxJS** — reactive utilities (bundled with Angular).
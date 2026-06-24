# Foodeez Admin Panel Agent Notes

## Project Overview

This repository is the Foodeez admin panel for managing restaurants and their product/menu catalog. It is a Next.js App Router application using TypeScript, Prisma, MySQL/MariaDB, NextAuth credentials login, Tailwind CSS, Radix UI primitives, and a local shadcn-style component library.

Primary stack:

- Next.js App Router with React client components where interactive state is needed.
- TypeScript throughout the app and component layers.
- Prisma v7 with a generated client in `prisma/generated/prisma`.
- MySQL/MariaDB through `@prisma/adapter-mariadb`.
- NextAuth credentials authentication.
- Tailwind CSS v4 with Foodeez theme tokens in `src/app/globals.css`.
- Radix UI primitives, `class-variance-authority`, `tailwind-merge`, and `lucide-react`.
- S3-compatible media upload/storage through `src/lib/s3-storage.ts`.

Important folders:

- `src/app`: App Router pages, layouts, and API route handlers.
- `src/app/dashboard`: root business selector dashboard.
- `src/app/dashboard/[businessId]`: selected-business dashboard layout and pages.
- `src/app/api`: route handlers for auth, upload, products, categories, and tags.
- `src/components/ui`: shared shadcn-style UI primitives.
- `src/components/admin`: Shopify-inspired selected-business admin shell, sidebar, mobile drawer, and header.
- `src/components/core`: shared app chrome such as navbars, footers, breadcrumb, profile, loading.
- `src/components/dashboard`: selected-business dashboard cards.
- `src/components/orders`: selected-business Orders management client UI.
- `src/components/products`: product, category, tag tables/forms/actions.
- `src/components/providers`: app-wide React providers for auth and selected business context.
- `src/lib`: Prisma, auth, media, upload, S3, and utility helpers.
- `src/services`: server helpers for dashboard/business/menu/order/settings data. `src/services/admin-data.ts` owns root dashboard data, selected-business dashboard data, and the current products server actions. `src/services/menu-management.ts` owns the dashboard-scoped Product, Category, and Tag API logic, including ownership checks, relationship shaping, counts, filtering, pagination, and soft deletes. `src/services/orders-management.ts` owns Orders management filtering, KPI aggregation, detail shaping, ownership checks, and status transitions. `src/services/settings-management.ts` owns business settings reads/upserts.
- `prisma`: Prisma schema, generated Prisma client output, and SQL view files.
- `public`: logos, SVGs, and static images.

## Database Schema

Schema details are intentionally not duplicated here. Use `prisma/schema.prisma` as the source of truth for database models, views, fields, attributes, and relations.

## Route Map

Existing pages:

- `/`: public root page from `src/app/page.tsx`.
- `/auth/signin`: credentials sign-in page.
- `/auth/forgot-password`: forgot-password page.
- `/auth/reset-password`: reset-password page.
- `/dashboard`: authenticated business-owner landing page. It is now a server-rendered Shopify-style business selector that resolves owned businesses and shows business cards with logo/avatar, status badge, and a "Go to Dashboard" link.
- `/dashboard/[businessId]`: selected-business overview page inside `AdminShell`. It is server-rendered and shows KPI cards for total orders, total revenue, pending orders, and active products, followed by a recent-orders table.
- `/dashboard/[businessId]` and nested selected-business routes are wrapped by `src/app/dashboard/[businessId]/layout.tsx`, which now renders the shared admin shell instead of the older public navbar/footer chrome.
- `/dashboard/[businessId]/orders`: selected-business Orders management page. It renders KPI cards, status/date/search filters, a paginated orders table, row actions, and an order detail modal through `AdminOrdersPage`.
- `/dashboard/[businessId]/menu`: selected-business Menu hub / menu cards landing page.
- `/dashboard/[businessId]/menu/products`: selected-business product catalog workspace. It server-fetches products/categories and hydrates `AdminProductsTable` for search, category filtering, sortable table columns, add/edit modal, active/inactive toggle, delete, empty state, and loading skeleton.
- `/dashboard/[businessId]/menu/products/new`: add product form.
- `/dashboard/[businessId]/menu/products/[productId]/edit`: edit product form.
- `/dashboard/[businessId]/menu/categories`: selected-business category management workspace. It server-fetches categories through `menu-management.ts` and hydrates `CategoryTable` for add/edit modal, tag assignment, product counts, status badges, soft delete, and empty state.
- `/dashboard/[businessId]/menu/categories/new`: add category form.
- `/dashboard/[businessId]/menu/categories/[categoryId]/edit`: edit category form.
- `/dashboard/[businessId]/menu/tags`: selected-business tag management workspace. It server-fetches tags through `menu-management.ts` and hydrates `TagsTable` for add/edit modal, product/category counts, status badges, soft delete, and empty state.
- `/dashboard/[businessId]/settings`: selected-business settings workspace. It server-fetches business info and delivery-area settings, then hydrates `AdminSettingsForm` for editing comma-separated delivery areas with live badge preview.
- Legacy standalone product/category route files were removed after moving menu functionality into the `/menu/...` structure.

Existing API routes:

- `/api/auth/[...nextauth]`: NextAuth route.
- `/api/auth/forgot-password`: forgot-password handler.
- `/api/auth/reset-password`: reset-password handler.
- `/api/upload`: authenticated image upload route.
- `/api/products`: legacy product CRUD route with business-owner authorization. Current selected-business menu UI should prefer the dashboard-scoped product routes below.
- `/api/categories`: legacy category CRUD route with business-owner authorization. Current selected-business menu UI should prefer the dashboard-scoped category routes below.
- `/api/tags`: legacy tag CRUD route with business-owner authorization. Current selected-business menu UI should prefer the dashboard-scoped tag routes below.
- `/api/dashboard/[businessId]/products`: authenticated selected-business Product list/create route. Supports search, category, status, page, and pageSize filters. Returns paginated product rows with tag/category shaping.
- `/api/dashboard/[businessId]/products/[id]`: authenticated selected-business Product update/delete route. `PATCH` updates full product data or status-only payloads; `DELETE` soft-deletes by status.
- `/api/dashboard/[businessId]/categories`: authenticated selected-business Category list/create route. Returns category rows with tags and inferred product counts.
- `/api/dashboard/[businessId]/categories/[id]`: authenticated selected-business Category update/delete route. Maintains `business_product_category_2_tag` assignments and soft-deletes by status.
- `/api/dashboard/[businessId]/tags`: authenticated selected-business Tag list/create route. Returns tag rows with product/category counts.
- `/api/dashboard/[businessId]/tags/[id]`: authenticated selected-business Tag update/delete route. `DELETE` soft-deletes the tag and removes bridge-table assignments.
- `/api/dashboard/[businessId]/orders`: authenticated selected-business Orders list route. Supports status, date range, search, and page filters and returns KPI data plus paginated order rows.
- `/api/dashboard/[businessId]/orders/[orderId]/status`: authenticated selected-business order status update route. Accepts `{ status: "preparing" | "ready" | "delivered" | "rejected" }` and validates forward-only transitions.
- `/api/dashboard/[businessId]/settings`: authenticated selected-business settings route. `GET` returns delivery-area settings; `POST` upserts normalized delivery areas.

Planned or visible-coming-soon areas:

- Product inventory management appears to be planned beyond the current form fields.

## Coding Conventions

General:

- Use App Router file conventions: `page.tsx`, `layout.tsx`, and `route.ts`.
- Use absolute imports through the `@/` alias.
- Keep route-specific UI in `src/app/...`; reusable UI belongs under `src/components/...`.
- Prefer existing UI primitives from `src/components/ui` before adding new component styles.
- Interactive pages and components use `"use client"` at the top.
- Server helper functions live in `src/services/HelperFunctions.ts` and use `"use server"`.
- Shared utilities live in `src/lib`.

Data and API patterns:

- Import Prisma from `@/lib/prisma`.
- Prefer server components and server-side data fetching for dashboard/admin pages where possible.
- `src/services/admin-data.ts` contains selected-business ownership checks, root business selector data, dashboard KPI/recent-order data, product catalog data, and product server actions with `revalidatePath`.
- `src/services/menu-management.ts` contains dashboard-scoped Product, Category, and Tag list/create/update/delete behavior shared by the menu API routes and server pages.
- `src/services/orders-management.ts` centralizes Orders management logic, including business-owner authorization, status mapping, list filtering, KPI calculation, order detail rows, and status transition validation.
- `src/services/settings-management.ts` centralizes business info and delivery-area settings reads/upserts.
- Route handlers return `NextResponse.json(...)`.
- API routes validate required fields and return `{ error: string }` with appropriate status codes.
- Authenticated API routes call `getServerSession(authOptions)`.
- Business-scoped mutations verify that the current visitor account maps to a business owner and that the owner has access to the target business.
- Multi-table writes and association updates use `prisma.$transaction`.
- Product and category tag associations are updated transactionally.
- Categories are related to tags through `business_product_category_2_tag`; products are related to tags through `business_product_2_tag`.
- Product/category/tag deletes in the dashboard-scoped menu APIs are soft deletes through status values. Current menu queries exclude status `-1`; active/inactive use status `1`/`0`.
- Image replacement/deletion paths clean up old S3 objects through `S3Storage`.
- Client forms call API routes with `fetch`, JSON bodies, and local loading/error state.
- Product catalog interactions in `AdminProductsTable` use server actions from `admin-data.ts` for save, toggle status, and soft delete. Category and tag tables use the dashboard-scoped menu API routes.
- Orders management uses API routes from the `AdminOrdersPage` client island because it needs filter/search pagination and modal-driven status updates.
- Current order status mapping is `rejected = 0`, `new = 1`, `preparing = 2`, `ready = 3`, and `delivered = 4`. Valid forward transitions are `new -> preparing`, `new -> rejected`, `preparing -> ready`, and `ready -> delivered`.

Naming:

- React components use PascalCase file and function names.
- Hooks use `use...` naming, for example `useBusinessId`, `useSetBusinessId`, and `useClearBusinessId`.
- Client-facing form payloads commonly use lower camel/snake names such as `businessId`, `product_price`, `tag_ids`, and `updateImageOnly`, then map to database fields in route handlers.

Styling:

- Use Tailwind utility classes.
- Reuse Foodeez brand tokens such as `foodeez-primary`, `foodeez-secondary`, and `foodeez-accent`.
- UI components use `cn` from `src/lib/utils.ts` for class composition.
- Variant-based primitives use `class-variance-authority`, as in `src/components/ui/button.tsx`.
- Responsive layouts commonly use mobile card views and desktop tables.

State and context:

- `AuthProvider` and `BusinessProvider` wrap the app in `src/app/layout.tsx`.
- Selected business state is managed by `BusinessProvider` and persisted under `foodeez_business_id` in localStorage.
- Dashboard pages read selected business state with `useBusinessId`.
- Root dashboard sets selected business state when a user clicks a business card.
- `AdminShell` receives the route `businessId` from `src/app/dashboard/[businessId]/layout.tsx` and syncs it into `BusinessProvider`, so nested selected-business pages can continue reading `useBusinessId`.

## Component Patterns

Shared UI components:

- `src/components/ui` contains reusable primitives built around Radix UI and local Tailwind styling.
- Components expose typed props and forward standard HTML props where practical.
- Common primitives include buttons, cards, tables, dialogs, dropdowns, tabs, inputs, labels, textarea, badges, avatar, skeleton, alerts, sheets, selects, switches, and upload fields.
- `ImageUploadField` is the shared image picker/preview control used by product/category forms.

Core layout components:

- `AdminShell` is the shared selected-business dashboard wrapper. It composes the fixed desktop sidebar, mobile drawer trigger, sticky admin header, and padded scrollable content area.
- `AdminSidebar` renders the selected business identity at the top, including logo/initials avatar, business name, status label when available, and a full-width Switch Business link to `/dashboard`.
- `AdminSidebar` navigation order is Dashboard, Orders, collapsible Menu group, then Settings. The Menu group auto-expands on `/menu` routes and contains Menu Cards, Products, Categories, and Tags with indented child links and a left accent border.
- `AdminSidebar` footer renders the authenticated owner from NextAuth session data, including profile image when available or an initials avatar, truncated owner name, and logout action.
- `AdminMobileDrawer` provides the hamburger-triggered slide-in navigation on small screens, reusing the sidebar nav items with visible labels and closing on outside click or Escape. The mobile drawer uses a fixed full-height panel and fixed backdrop.
- `AdminHeader` auto-generates breadcrumbs and the page title from route segments. It includes a static notification button and a Quick Actions dropdown linking to new product, new category, and orders routes.
- `Navbar` and `Footer` are no longer used by the selected-business layout; they may still be used by public or other non-admin surfaces.
- `DashboardNavbar`, `DashboardFooter`, and `DashboardBreadcrumb` are used by the root dashboard.
- `LoadingSpinner` and skeletons provide loading states.

Dashboard components:

- `BusinessInfoCard` renders selected business details.
- `StatsCard` renders linked dashboard metric cards.
- The selected-business dashboard page now renders KPI cards and recent orders directly as a server component rather than using client-side dashboard data loading.

Product-management components:

- `AdminProductsTable` is the current Shopify-style product catalog UI for `/dashboard/[businessId]/menu/products`. It receives server-fetched rows and category options, then handles search, category filter, sorting, add/edit modal, status toggle, and delete as a client island.
- Product category display/filtering in `AdminProductsTable` is inferred from overlapping product tags and category tags because `business_product` does not have a direct category foreign key.
- `CategoryTable` and `TagsTable` are current selected-business client islands for category/tag management and expect server-provided rows from `menu-management.ts`.
- `ProductTable`, `DeleteProductModal`, and the legacy root `/api/products` flows remain older product-management surfaces; prefer `AdminProductsTable` and dashboard-scoped APIs for current selected-business work.
- `ProductForm` and `CategoryForm` are reusable add/edit forms controlled by a `mode` prop and `initialValues`.
- `ProductForm` can receive `categoryOptions`; category assignment is implemented by adding the selected category's tags to the product's tag assignments.
- `TagSelect` is used by product/category forms to attach tags and loads tags from `/api/dashboard/[businessId]/tags`.
- `TagFilter` filters product lists by selected tags.
- Add/edit pages are thin wrappers around the reusable forms and API calls.

Settings components:

- `AdminSettingsForm` is the selected-business settings client island. It edits comma-separated delivery areas, shows a live badge preview, saves through `/api/dashboard/[businessId]/settings`, and renders read-only business name/email fields.

Orders-management components:

- `AdminOrdersPage` is the Shopify-style Orders UI for `/dashboard/[businessId]/orders`. It owns client-side filter state, pagination state, row action dropdowns, and the order detail modal.
- Orders list and status changes are fetched through `/api/dashboard/[businessId]/orders` and `/api/dashboard/[businessId]/orders/[orderId]/status`.
- Orders list defaults to all dates so the table matches the all-time KPI counts; users can still filter to Today, Last 7 days, or Custom.
- Order detail modal displays order ID, ordered date, status, customer name/phone/address, item rows, delivery fee, order total, and available status action buttons.

## Practical Guidance For Future Agents

- Read the relevant page, component, route handler, and helper before editing; patterns are split across app routes, products components, services, and lib helpers.
- Keep business-scoped API changes consistent with the existing owner-access authorization flow.
- Do not introduce a second Prisma client import path.
- Do not duplicate database schema details here; check `prisma/schema.prisma`.
- Preserve existing Foodeez styling tokens and component library usage.
- For selected-business admin chrome changes, prefer extending `src/components/admin` and keep `src/app/dashboard/[businessId]/layout.tsx` as a thin wrapper around `AdminShell`.
- For root dashboard, selected-business dashboard, and selected-business Menu/product catalog changes, prefer extending `src/services/admin-data.ts` and the relevant server page before adding client-side fetching.
- For selected-business Product/Category/Tag API behavior, prefer extending `src/services/menu-management.ts` so ownership, soft delete behavior, tag/category relationship shaping, and counts stay consistent.
- For selected-business Settings behavior, prefer extending `src/services/settings-management.ts` and `AdminSettingsForm`.
- For Orders management changes, prefer extending `src/services/orders-management.ts` so the page UI and API routes share the same status mapping, filtering, authorization, and transition rules.
- When adding product category behavior, remember that categories are not directly linked from `business_product`; check `prisma/schema.prisma` and the current tag-inference approach before changing assumptions.
- For media changes, use the existing upload utilities and S3 storage helpers.
- For new dashboard sections, follow the selected-business route structure under `src/app/dashboard/[businessId]`.

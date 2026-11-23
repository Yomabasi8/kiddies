<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Visual direction (supersedes Section 3 below)

The owner supplies the visual direction directly. **Ignore the "Design
direction and visual identity" guidance in Section 3** (its suggested
palette, typography and look). Everything else in this file still applies.
Use this instead:

- **Brand colour:** `#086F54` (deep green). Defined as the `brand` token in `app/globals.css`.
- **Headings:** Fredoka One. Google has replaced Fredoka One with the variable
  `Fredoka` family, so we use `Fredoka` at weight 600, which matches it.
- **Body text:** Nunito.
- **Logo and imagery:** `public/images/` (`logo.png`, `kids-playing.png`, `siblings.png`).
- **Hero section:** follow the owner's reference screenshot exactly. It has a
  green background, a white pill-shaped navigation bar, a centred white Fredoka
  headline, a coral "Shop Now" button with a dark offset shadow, an outlined
  "Explore Categories" button, three photo cards fanned out, hand-drawn doodles
  (light bulb, paper plane, swirl arrow, sparks) and a white cloud edge at the bottom.
- **Motion:** rich, playful animation using `motion` (`motion/react`) and Lenis
  smooth scrolling. Always honour `prefers-reduced-motion`.
- For any visual decision not covered here, ask the owner rather than falling back to Section 3.

---

# Agent Instructions: Kids' Accessories & Essentials E-commerce Platform

> This file defines the product, design, engineering, security, and
> delivery requirements for building the platform. Follow it as the
> project's persistent agent guidance.

MASTER BUILD PROMPT: KIDS' ACCESSORIES & ESSENTIALS E-COMMERCE PLATFORM
ROLE AND EXPECTATIONS Act as a Senior Product Design Engineer, Senior
UI/UX Designer, Full-Stack Engineer and Software Architect with at least
10 years of experience building scalable, production-ready e-commerce
platforms. You are responsible for transforming this business idea into
a complete, functional, visually polished and responsive e-commerce
product. Do not approach this as a simple website or landing page
project. Approach it as a complete digital commerce platform consisting
of two connected experiences:

A customer-facing e-commerce storefront.

A secure administrative dashboard for managing the entire business. You
must think critically about product strategy, user experience,
information architecture, interface design, database architecture,
business logic, security, performance and scalability. Your goal is to
build a product that is beautiful, intuitive, reliable and ready for
real-world business operations. 1. PROJECT OVERVIEW Product description
Build a modern e-commerce website focused on practical baby and children's accessories and everyday essentials. The core product range includes:

Feeding essentials: plates, bowls, spoons, forks and cutlery sets.

Bottles and drinkware: feeding bottles, sippy cups, straw cups and water bottles.

Mealtime accessories: bibs, lunch boxes and food containers.

Toys: educational toys, puzzles, games and age-appropriate play items.

Other kids' accessories: practical everyday baby and children's essentials. The platform should enable customers to
discover products, explore categories, compare prices, add items to
their shopping carts, check out and make payments online. The business
owner should have a dedicated administrative interface to manage
products, inventory, orders, customers, promotions and store
performance. Product vision Create a trusted and enjoyable online
shopping destination where parents, guardians, relatives and gift
shoppers can conveniently discover and purchase quality products for
children. Business model Business-to-Consumer (B2C) e-commerce. Initial
target market Nigeria. Design the system so it can accommodate
additional geographical markets in the future. Domain architecture Use
one domain for both experiences. Example: Customer storefront:

https://yourdomain.com

https://yourdomain.com/shop

https://yourdomain.com/cart

https://yourdomain.com/checkout Administrative platform:

https://yourdomain.com/admin/login

https://yourdomain.com/admin/dashboard

https://yourdomain.com/admin/products

https://yourdomain.com/admin/orders Do not create a separate domain or
subdomain for the admin dashboard. 2. PRODUCT USERS AND ACCESS LEVELS
The platform has two primary user groups. A. Customers Customers are
primarily adults purchasing products for children. They should be able
to:

Visit the website without registering.

Browse available products.

Search for products.

Filter and sort products.

View product details.

Add products to their shopping cart.

Update product quantities.

Check out as guests.

Make online payments.

Receive order confirmations.

Track orders using an order reference and appropriate verification.

Optionally create an account.

Log in to an existing account.

View their order history.

Manage their account information. IMPORTANT: Customer account
registration must be optional. Implement guest checkout as a core
feature, not as an afterthought. Do not force customers to register
before making purchases. B. Administrator The administrator is the
business owner or an authorized member of staff. The administrator must
authenticate before accessing the admin dashboard. The administrator
should be able to:

View business performance.

Add, edit and delete products.

Manage product categories.

Upload product images.

Manage inventory.

View customer orders.

Update order statuses.

Verify payment statuses.

View customer information.

Create promotional discounts.

Configure delivery options.

View sales reports.

Configure store information. Admin access must be protected using
authentication and server-side authorization. Do not expose admin
functionality to ordinary customers. 3. DESIGN DIRECTION AND VISUAL
IDENTITY Create a modern, playful, welcoming and premium children's
retail shopping experience. The website should feel colourful and
engaging without looking childish, cluttered or visually overwhelming.
The target buyers are adults, so the interface must balance playful
aesthetics with professional e-commerce usability. Visual direction Use:

A warm and inviting colour palette.

Soft pastel accents.

Carefully selected vibrant colours for important elements.

Rounded cards and subtle corner radii.

Clean layouts.

Generous white space.

High-quality product photography.

Clear visual hierarchy.

Consistent spacing.

Subtle animations and hover effects.

Modern typography. Suggested colour direction:

Warm cream or off-white as the primary background.

Deep navy or charcoal for primary text.

Coral, orange or warm pink for primary accents.

Soft yellow for highlights.

Pastel blue and mint green for secondary accents. These are starting
suggestions. Establish a cohesive design system rather than using all
colours indiscriminately. Typography Choose modern, highly readable
typography. Use a maximum of two complementary font families. Create
consistent typography styles for:

Display headings.

Section headings.

Body text.

Product names.

Prices.

Buttons.

Form labels.

Supporting information. Design principles

Prioritize usability over decoration.

Maintain consistency across the storefront and admin dashboard.

Make product photography the visual focus.

Avoid overcrowded layouts.

Use clear calls to action.

Ensure accessibility and readable contrast.

Use consistent components throughout the application. Important design
requirement The storefront and admin dashboard should have different
visual layouts. The storefront should feel inviting, commercial and
customer-oriented. The admin dashboard should feel professional,
organized, data-oriented and operationally efficient. Both should share
the underlying brand identity. Do not make the admin dashboard look like
a continuation of the public homepage. 4. CUSTOMER-FACING STOREFRONT
Develop the following pages and functionalities. 4.1 Homepage The
homepage should immediately communicate what the business sells and make
it easy to start shopping. Required sections: A. Announcement bar

Promotional messages.

Delivery announcements.

Seasonal offers. B. Navigation header

Business logo.

Home.

Shop.

Categories.

About Us.

Contact.

Search.

Customer account icon.

Shopping cart icon with item count. The navigation must be responsive
and optimized for mobile. C. Hero section Create a visually appealing
hero section with:

A compelling headline.

Supporting description.

High-quality children's product imagery.

Primary CTA: Shop Now.

Optional secondary CTA: Explore Categories. Avoid generic filler text.
D. Shop by category Display visually engaging category cards. Suggested
categories:

Feeding Plates & Bowls.

Spoons, Forks & Cutlery Sets.

Feeding Bottles.

Sippy Cups, Straw Cups & Water Bottles.

Bibs & Mealtime Accessories.

Lunch Boxes & Food Containers.

Educational Toys.

Puzzles & Games.

Other Kids' Accessories. Categories must be manageable through the admin
dashboard. E. Featured products Display selected products with:

Product images.

Product names.

Prices.

Discount prices where applicable.

Stock availability.

Add to Cart action. F. Bestsellers Show popular products based on actual
sales data. G. New arrivals Display recently added products. H.
Promotional section Highlight discounts, seasonal campaigns and special
offers. I. Trust section Communicate relevant business benefits, such
as:

Secure payments.

Reliable delivery.

Quality products.

Customer support. Only display claims that the business can
substantiate. J. Customer testimonials Display genuine customer reviews
when available. Do not fabricate testimonials. K. Newsletter
subscription Allow customers to voluntarily subscribe to promotional
updates. L. Footer Include:

Business information.

Quick navigation.

Contact information.

Social media links.

Shipping policy.

Returns policy.

Privacy policy.

Terms and conditions. 4.2 Shop / Product Listing Page Build a
comprehensive product catalogue. Required functionality:

Display all active products.

Product category navigation.

Search products.

Filter by category.

Filter by price range.

Filter by age suitability.

Filter by material where product data is available.

Filter by availability.

Sort by price (low to high).

Sort by price (high to low).

Sort by newest.

Sort by popularity.

Pagination or efficient load-more functionality. Each product card
should contain:

Product image.

Product name.

Price.

Discounted price where applicable.

Discount indicator where applicable.

Availability indicator.

Add-to-cart action.

Product details link. Provide appropriate loading, empty and error
states. Products marked as drafts or inactive must not appear publicly.
4.3 Product Details Page Each product should have an individual product
page. Display:

Product image gallery.

Product name.

Product price.

Discount price.

Product description.

Product category.

Age suitability.

Product material.

Bottle capacity where applicable.

Plate and bowl dimensions where applicable.

Number of pieces where applicable.

Cleaning and care instructions.

Other relevant product specifications.

Available variations.

SKU where appropriate.

Stock availability.

Quantity selector.

Add to Cart button.

Related products. Ensure that product variations, where supported, have
their own inventory and availability. Prevent customers from adding more
units to the cart than are available. 4.4 Shopping Cart Build a fully
functional shopping cart. Features:

Display selected products.

Product images.

Product names.

Unit prices.

Selected quantities.

Quantity adjustment.

Remove product.

Subtotal calculation.

Discount calculation where applicable.

Estimated delivery fee where available.

Order total.

Proceed to Checkout CTA. The cart should persist across page navigation.
For guest customers, preserve cart contents appropriately across browser
sessions. Revalidate prices and stock on the server before checkout. 4.5
Checkout Build a streamlined checkout experience. IMPORTANT: Customers
must be able to check out without creating an account. Provide two
possible experiences:

Continue as Guest.

Sign in to an Existing Account. Guest checkout fields

Full name.

Email address.

Phone number.

Delivery address.

State.

City or local government area.

Delivery instructions (optional). Checkout sections Contact information

Customer details. Delivery information

Delivery address.

Delivery method.

Delivery fee. Order summary

Selected products.

Quantities.

Subtotal.

Discounts.

Delivery fee.

Final total. Payment

Available payment methods.

Secure payment initiation. Order confirmation

Order reference.

Payment status.

Order summary.

Next steps. Do not collect unnecessary customer information. Do not
store raw card details. 4.6 Payment Integration Prepare the application
for Nigerian payment providers. Recommended providers:

Paystack.

Flutterwave. Implement one provider first, based on the client's account
and business requirements. Keep the payment architecture modular so
another provider can be added later. Requirements:

Secure payment initialization.

Server-side payment verification.

Payment reference generation.

Webhook handling.

Duplicate webhook protection.

Payment status updates.

Failed payment handling.

Successful payment confirmation.

Refund status support. Never assume that a payment succeeded merely
because the customer was redirected to a success page. The backend must
verify payment with the provider or validate an authenticated webhook
before marking an order as paid. Use environment variables for secret
keys. Never expose payment secrets in frontend code. 4.7 Order Tracking
Allow customers to check their order status using:

Order reference.

A verified email address or phone number, as appropriate. Display an
order timeline:

Order placed.

Payment confirmed.

Processing.

Dispatched.

Delivered. Also support cancelled and refunded states. Do not expose
another customer's order details through predictable order IDs. 4.8
Optional Customer Accounts Customer accounts are optional. Implement:

Registration.

Login.

Logout.

Password recovery.

Profile management.

Order history.

Saved addresses. Do not force guest customers to create accounts after
purchasing. You may offer an optional account creation action on the
order confirmation page. 5. ADMIN DASHBOARD Build a complete, secure
administrative platform. ADMIN ROUTE: /admin/login The admin dashboard
must have a dedicated authentication flow. Do not place an admin login
button in the public website navigation. After successful
authentication, redirect the administrator to: /admin/dashboard
Unauthenticated visitors attempting to access protected admin pages must
be redirected to /admin/login. Use role-based authorization, secure
sessions and server-side permission checks. 5.1 Admin Layout Use a
professional dashboard layout. Sidebar navigation:

Dashboard.

Products.

Categories.

Orders.

Inventory.

Customers.

Promotions.

Analytics & Reports.

Store Settings. Include:

Brand logo.

Admin profile.

Notification indicator.

Search where useful.

Logout.

Responsive mobile navigation. The sidebar should remain consistent
throughout the admin experience. 5.2 Dashboard Overview Create an
analytics-oriented dashboard. Display summary cards for:

Total Revenue.

Total Orders.

Pending Orders.

Total Products.

Low Stock Products. Include: Sales overview

Revenue chart.

Date range selection.

Daily, weekly and monthly views. Recent orders

Order ID.

Customer.

Date.

Amount.

Payment status.

Fulfilment status. Top-selling products

Product image.

Product name.

Units sold.

Revenue generated. Low-stock alerts

Product name.

Available quantity.

Stock warning. Quick actions

Add Product.

View Orders.

Manage Inventory. All dashboard statistics must come from actual
database records. Do not use fabricated sales figures or hardcoded
analytics. For a new store with no transactions, display appropriate
empty states. 5.3 Product Management Create a product management
interface. Product listing Display a table containing:

Product image.

Product name.

SKU.

Category.

Price.

Stock quantity.

Product status.

Date created.

Actions. Include:

Search.

Category filters.

Status filters.

Sorting.

Pagination. Add Product Create a well-organized product creation form.
Organize the form into sections: Basic information

Product name.

Product description.

Category.

SKU.

Product type (e.g. plate, bowl, cutlery set, feeding bottle, cup, bib, lunch box, toy).

Age suitability.

Material.

Bottle capacity where applicable.

Plate/bowl dimensions where applicable.

Number of pieces where applicable.

Cleaning and care instructions.

Colour and variation options. Product media

Upload multiple images.

Select a primary image.

Preview images.

Remove images. Pricing

Selling price.

Discount price.

Currency. Inventory

Stock quantity.

Low-stock threshold.

SKU.

Stock management toggle. Additional information

Age suitability.

Product material.

Bottle capacity (for bottles and drinkware).

Plate/bowl dimensions (for relevant feeding products).

Number of pieces (for sets and multi-piece products).

Colour and other product variations.

Cleaning and care instructions.

Other product-specific specifications. Publishing

Save as Draft.

Publish Product.

Mark as Featured. Implement proper validation. Product attributes must be conditional on product type: show bottle capacity for bottles and drinkware; plate/bowl dimensions for plates and bowls; number of pieces for sets; and material, age suitability, colour/variation, and cleaning instructions wherever relevant. Do not force irrelevant fields on every product. Allow administrators to leave genuinely inapplicable attributes blank. Edit Product Allow
administrators to:

Edit existing product information.

Replace images.

Change prices.

Update stock.

Change category.

Update publication status. Delete Product Provide a confirmation dialog
before deletion. Use safe deletion or archival where historical order
records depend on product data. 5.4 Category Management Allow the
administrator to:

Create categories.

Edit categories.

Delete or archive categories.

Upload category images.

Set category descriptions.

Control category visibility. Products should be linked to valid
categories. Prevent destructive deletion of categories containing
products without an appropriate reassignment or archival workflow. 5.5
Order Management Create a comprehensive order management system. Order
listing Display:

Order reference.

Customer name.

Order date.

Number of items.

Order total.

Payment status.

Order status. Provide filters for:

All orders.

Pending.

Processing.

Dispatched.

Delivered.

Cancelled.

Refunded. Allow administrators to search by order reference or customer
information. Order details When an administrator opens an order,
display: Customer information

Full name.

Email.

Phone.

Delivery address. Order items

Product image.

Product name.

Quantity.

Unit price.

Subtotal. Payment information

Payment provider.

Payment reference.

Payment status.

Payment date where available. Order summary

Subtotal.

Discount.

Delivery fee.

Total amount. Order timeline

Order created.

Payment confirmed.

Processing.

Dispatched.

Delivered. Order actions Allow the administrator to:

Confirm and process paid orders.

Update fulfilment status.

Add delivery tracking information.

Cancel eligible orders.

Initiate or record refunds through the appropriate payment workflow.

Add internal order notes. Maintain an audit trail of important status
changes. Never allow an admin to manually mark an unverified transaction
as paid without an authorized reconciliation process. 5.6 Inventory
Management Build an inventory module connected to products and orders.
Display:

Product.

SKU.

Available stock.

Stock threshold.

Stock status.

Last updated. Stock states:

In Stock.

Low Stock.

Out of Stock. Functionalities:

Update stock.

Adjust stock quantities.

Configure low-stock thresholds.

Receive low-stock alerts.

View stock movement history. Inventory should update automatically when
a paid order is confirmed, using safe database transactions and
protection against overselling. Handle cancellations and refunds with
appropriate stock restoration rules. Prevent negative stock unless the
business explicitly supports backorders. 5.7 Customer Management Create
a customer management interface. Display:

Customer name.

Email.

Phone.

Registration date, where applicable.

Total orders.

Total purchase value. Allow administrators to:

Search customers.

View customer details.

View customer order history. Guest purchasers should also be represented
in order records, even if they have not created accounts. Do not expose
sensitive payment information. 5.8 Promotions and Discounts Allow
administrators to:

Create coupon codes.

Set percentage discounts.

Set fixed-value discounts.

Define start and expiration dates.

Set minimum purchase amounts.

Restrict discounts to selected products or categories.

Set usage limits.

Activate or deactivate campaigns. Validate coupon eligibility on the
backend during checkout. 5.9 Analytics and Reports Provide business
performance insights. Include:

Total revenue.

Total orders.

Average order value.

Sales over time.

Bestselling products.

Bestselling categories.

Inventory performance.

Customer purchase trends. Provide date range filters. Ensure all
calculations use verified and appropriate order/payment data. 5.10 Store
Settings Create settings for: Business information

Store name.

Logo.

Business email.

Phone number.

Business address.

Social media links. Payment settings

Payment provider configuration.

Supported payment methods.

Payment status information. Delivery settings

Delivery zones.

Delivery fees.

Estimated delivery times.

Pickup options where supported. Notifications

New order notifications.

Payment notifications.

Low-stock alerts.

Order status notifications. Account settings

Admin profile.

Password changes.

Logout.

Session management. 6. COMPLETE USER JOURNEYS Implement and test both
primary journeys. Customer journey Homepage → Browse Products → Product
Details → Add to Cart → Shopping Cart → Checkout → Guest Checkout or
Sign In → Delivery Details → Payment → Payment Verification → Order
Confirmation → Order Tracking. Admin journey Admin Login → Dashboard
Overview → Review Orders → Open Order Details → Verify Payment Status →
Process Order → Update Fulfilment Status → Manage Inventory → Review
Sales. Also support the following admin journey: Admin Login → Products
→ Add Product → Upload Images → Set Price → Set Stock → Publish →
Product Appears in Storefront. Ensure the two experiences are connected
through the same backend and database. 7. TECHNICAL ARCHITECTURE Use a
modern, maintainable full-stack architecture. Recommended technology
stack Frontend

Next.js.

React.

TypeScript.

Tailwind CSS. UI components

Accessible reusable component library.

Lucide icons.

Custom components where necessary. Backend

Next.js server-side functionality.

Secure API routes or server actions.

Server-side validation. Database

Supabase PostgreSQL. Authentication

Supabase Auth or an equivalent secure authentication solution. Storage

Supabase Storage for product images. Payment

Paystack or Flutterwave. Deployment

Vercel. Use stable, compatible versions of the chosen dependencies. Do
not introduce unnecessary technologies or duplicate functionality.
Database architecture Design a normalized database with appropriate
relationships. Suggested tables:

users / profiles.

roles.

categories.

products.

product_images.

product_variants.

product_attributes (or an equivalent structured product-specification model for material, capacity, dimensions, piece count, age suitability and care instructions).

inventory.

inventory_movements.

carts.

cart_items.

orders.

order_items.

payments.

addresses.

coupons.

coupon_redemptions.

notifications.

store_settings.

audit_logs. Adapt the schema where needed. Important database
considerations:

Every product should have a stable unique identifier.

Order items should preserve product names and prices at the time of
purchase.

Prices should use appropriate decimal-safe or integer minor-unit
representations.

Payment references must be unique.

Inventory changes must be transactional.

Orders must not disappear when a product is archived.

Guest checkout must be supported.

Customer accounts and admin accounts must have appropriate permissions.
Implement appropriate database indexes and constraints. Security
Security is a non-negotiable requirement. Implement:

Secure authentication.

Role-based access control.

Server-side authorization.

Protected admin routes.

Supabase Row Level Security where appropriate.

Input validation.

Output sanitization.

Secure password handling.

CSRF protection where applicable.

Rate limiting for sensitive endpoints.

Secure environment variable management.

Payment webhook verification.

Protection against unauthorized data access.

Secure image upload validation. Never expose service-role keys, payment
secret keys or database credentials in client-side code. Do not rely
solely on hiding UI elements to enforce permissions. 8. RESPONSIVE
DESIGN The entire product must be mobile-first and responsive. Support:

Mobile phones.

Tablets.

Desktop computers.

Larger screens. Storefront mobile experience Ensure:

Easy-to-use navigation.

Responsive product grids.

Readable product information.

Accessible shopping cart.

Simple checkout forms.

Touch-friendly buttons.

Optimized images. Admin mobile experience Ensure:

Responsive sidebar or mobile navigation.

Adaptable data tables.

Usable forms.

Readable charts.

Accessible actions. Do not simply shrink the desktop interface to fit
mobile. Adapt layouts to the available screen size. 9. DESIGN SYSTEM AND
COMPONENT ARCHITECTURE Build reusable components. Storefront components

Header.

Navigation.

Footer.

ProductCard.

ProductGrid.

CategoryCard.

SearchBar.

FilterPanel.

PriceDisplay.

QuantitySelector.

AddToCartButton.

CartItem.

OrderSummary.

CheckoutForm.

StatusBadge.

ToastNotification.

Modal.

LoadingSkeleton.

EmptyState. Admin components

AdminSidebar.

AdminHeader.

StatCard.

DataTable.

SearchInput.

FilterDropdown.

StatusBadge.

ProductForm.

ImageUploader.

OrderDetailsPanel.

InventoryTable.

SalesChart.

ConfirmationDialog.

Pagination.

EmptyState. Establish reusable styles for:

Buttons.

Inputs.

Selects.

Dropdowns.

Cards.

Tables.

Modals.

Notifications.

Badges. Maintain consistent spacing, colours, typography, borders and
interaction states. 10. FUNCTIONALITY AND QUALITY REQUIREMENTS Do not
build a static demonstration. Every visible interactive element must
have a working action. Examples:

Search must return relevant products.

Filters must update product listings.

Add to Cart must update the cart.

Quantity selectors must work.

Checkout must validate customer information.

Payment must use the configured payment integration.

Product creation must save to the database.

Product updates must reflect on the storefront.

Order placement must create a real order record.

Verified payments must update payment status.

Order status changes must be persisted.

Inventory must reflect purchases correctly.

Admin analytics must use real data. Implement:

Loading states.

Empty states.

Error states.

Success notifications.

Form validation.

Confirmation dialogs.

Appropriate feedback for failed operations. Never use fake buttons or
non-functional placeholder interactions. Never fabricate transaction
success or business data. If a third-party integration cannot be
configured because credentials are unavailable, clearly identify the
missing configuration and implement a safe, testable integration
boundary rather than pretending it works. 11. SEO, PERFORMANCE AND
ACCESSIBILITY SEO Implement:

Unique page titles.

Meta descriptions.

Semantic HTML.

Product structured data where appropriate.

Sitemap.

Robots.txt.

Clean URLs.

Descriptive image alt text.

Open Graph metadata. Performance Implement:

Optimized images.

Lazy loading where appropriate.

Efficient data fetching.

Server-side rendering or appropriate rendering strategies.

Pagination.

Caching where safe.

Avoidance of unnecessary client-side JavaScript. Accessibility Follow
WCAG 2.2 AA principles where practical. Ensure:

Keyboard navigation.

Accessible forms.

Proper labels.

Sufficient colour contrast.

Descriptive error messages.

Screen-reader-friendly controls.

Focus indicators.

Meaningful alt text. 12. TESTING REQUIREMENTS Before declaring the
product complete, test the following. Storefront tests

Homepage loads correctly.

Product categories work.

Search works.

Product filters work.

Product details display correctly.

Cart functionality works.

Guest checkout works.

Registered customer checkout works.

Invalid checkout data is rejected.

Payment verification works.

Order confirmation works.

Order tracking is secure. Admin tests

Admin login works.

Unauthorized users cannot access admin pages.

Product creation works.

Product editing works.

Product deletion or archival works.

Category management works.

Orders appear correctly.

Order status updates work.

Inventory updates work.

Customer information is protected.

Promotions work.

Dashboard statistics are accurate. Integration tests Test the complete
purchase process:

Admin creates a product.

Product appears on the storefront.

Customer adds the product to the cart.

Customer completes guest checkout.

Payment is initiated and verified.

Order is created and updated.

Inventory is adjusted.

Order appears in the admin dashboard.

Admin processes the order.

Customer can retrieve their order status. Also test payment failures,
duplicate webhook delivery, insufficient stock and order cancellation.
13. DEVELOPMENT APPROACH Do not attempt to generate the entire
application in one uncontrolled coding operation. Work in structured
phases. Phase 1: Discovery and planning

Inspect the existing project.

Review the current codebase.

Identify existing assets and configurations.

Establish project architecture.

Finalize requirements.

Identify missing business information.

Prepare the implementation plan. Phase 2: Design foundation

Establish design tokens.

Define typography.

Define colour palette.

Build reusable UI components.

Establish responsive layouts. Phase 3: Storefront development

Homepage.

Product catalogue.

Product details.

Shopping cart.

Checkout.

Order confirmation.

Order tracking. Phase 4: Backend development

Database schema.

Authentication.

Product APIs.

Cart functionality.

Order processing.

Payment integration.

Inventory logic. Phase 5: Admin dashboard

Admin authentication.

Dashboard overview.

Product management.

Category management.

Order management.

Inventory management.

Customer management.

Promotions.

Analytics.

Settings. Phase 6: Integration and testing

Connect storefront and admin.

Test database interactions.

Test payment flows.

Test permissions.

Test inventory.

Test responsive behaviour.

Resolve errors. Phase 7: Deployment preparation

Configure environment variables.

Configure production database.

Configure payment credentials.

Connect the acquired domain.

Configure HTTPS.

Configure production storage.

Configure backups.

Perform final acceptance testing. 14. IMPORTANT ENGINEERING INSTRUCTIONS
Follow these instructions throughout development:

Do not assume that a beautiful UI means the product is complete.

Do not build only the homepage.

Do not use hardcoded product data as the final data source.

Do not create fake payment integrations.

Do not expose sensitive credentials.

Do not allow customers to access admin functionality.

Do not force customers to register before checkout.

Do not use fabricated customer reviews or sales statistics.

Do not ignore empty, loading and error states.

Do not build unnecessarily complicated features outside the MVP.

Do not introduce dependencies without a clear reason.

Do not overwrite existing project files without first inspecting the
codebase.

Maintain clean, modular, reusable and documented code.

Prioritize security and data integrity.

Make the entire experience production-oriented. If critical business
information is missing, document the assumptions and ask for
clarification before making irreversible architectural decisions. Use
placeholders only where actual business assets or credentials have not
yet been supplied. 15. EXPECTED DELIVERABLES At the end of development,
the project should contain:

A complete responsive e-commerce storefront.

A functional product catalogue.

A working shopping cart.

A guest and optional registered customer checkout experience.

A payment integration.

An order confirmation and tracking system.

A secure admin login.

A functional admin dashboard.

Product management.

Category management.

Order management.

Inventory management.

Customer management.

Promotions management.

Basic analytics and reporting.

A connected database.

Secure authentication and authorization.

Responsive interfaces.

Tested application workflows.

Deployment documentation. Provide a README containing:

Project overview.

Technology stack.

Installation instructions.

Environment variable requirements.

Database setup instructions.

Payment integration setup.

Admin account creation instructions.

Local development instructions.

Deployment instructions. 16. HOW TO BEGIN Before writing code:

Inspect the existing project directory.

Determine whether a project has already been initialized.

Identify existing technologies, dependencies and configurations.

Review available assets.

Identify missing business information.

Present a concise technical implementation plan.

Propose the database structure.

Outline the storefront and admin architecture.

Identify any third-party credentials required. Do not immediately
generate all the code. First establish the architecture and
implementation sequence. Once the plan is approved, begin building
incrementally, verifying each phase before moving to the next. At every
stage, think like a senior Product Design Engineer: challenge
assumptions, identify usability problems, consider edge cases and make
sound technical decisions. FINAL OBJECTIVE: Deliver a complete,
professional, scalable and production-ready kids' accessories and essentials e-commerce
platform where customers can conveniently discover and purchase
products, while the business owner can independently manage the entire
store through a secure administrative dashboard. The storefront and
admin dashboard must operate as two interconnected experiences powered
by one backend, one database and one domain.

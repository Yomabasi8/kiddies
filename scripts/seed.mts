/**
 * Seed the database with the current catalogue and delivery options.
 *
 *   npm run db:seed
 *
 * Idempotent: rows are matched by slug / SKU / id and updated in place, so it
 * can be re-run safely. Stock is only set when a product is first created, so
 * re-running never overwrites real stock levels.
 *
 * NOTE: product names, prices and stock are the TEMPORARY SAMPLE values from
 * lib/catalog/sample-*.ts until the owner enters real data in the admin.
 */
import { existsSync } from "node:fs";
import postgres from "postgres";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from "../lib/catalog/sample-data.ts";
import { SAMPLE_DETAILS } from "../lib/catalog/sample-details.ts";
import { DELIVERY_METHODS } from "../lib/delivery.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set (add it to .env.local).");
  process.exit(1);
}
const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });

const PRODUCT_TYPE: Record<string, string> = {
  "cat-plates": "feeding-set",
  "cat-cutlery": "cutlery",
  "cat-cups": "cup",
  "cat-bibs": "bib",
  "cat-bottles": "bottle",
  "cat-lunch": "lunch-box",
  "cat-educational": "toy",
  "cat-puzzles": "puzzle",
  "cat-other": "accessory",
};

try {
  await sql.begin(async (tx) => {
    // Categories
    const catIds = new Map<string, string>();
    for (const [i, c] of SAMPLE_CATEGORIES.entries()) {
      const [row] = await tx`
        insert into public.categories (slug, name, image_url, icon, accent, sort_order)
        values (${c.slug}, ${c.name}, ${c.image}, ${c.icon}, ${c.accent}, ${i})
        on conflict (slug) do update set
          name = excluded.name, image_url = excluded.image_url, icon = excluded.icon,
          accent = excluded.accent, sort_order = excluded.sort_order
        returning id`;
      catIds.set(c.id, row.id);
    }

    // Products, images, stock
    let created = 0;
    for (const p of SAMPLE_PRODUCTS) {
      const d = SAMPLE_DETAILS[p.id];
      const specs = d?.specs ?? [];
      const pieces = specs.find((s) => s.label === "Pieces")?.value;
      const capacity = specs.find((s) => s.label === "Capacity")?.value?.match(/\d+/)?.[0];
      const extraSpecs = specs.filter((s) => !["Pieces", "Capacity"].includes(s.label));

      const [row] = await tx`
        insert into public.products (
          slug, name, description, category_id, product_type, sku, price, sale_price,
          age_range, material, capacity_ml, piece_count, care_instructions, specs,
          status, is_featured, is_new, published_at, created_at
        ) values (
          ${p.slug}, ${p.name}, ${d?.description ?? ""}, ${catIds.get(p.categoryId)!},
          ${PRODUCT_TYPE[p.categoryId] ?? null}, ${d?.sku ?? p.id.toUpperCase()},
          ${p.price}, ${p.salePrice}, ${p.ageRange}, ${p.material},
          ${capacity ? Number(capacity) : null}, ${pieces ? Number(pieces) : null},
          ${d?.careInstructions ?? null}, ${tx.json(extraSpecs)},
          'active', ${p.isFeatured}, ${p.isNew}, now(), ${p.createdAt}
        )
        on conflict (slug) do update set
          name = excluded.name, description = excluded.description,
          category_id = excluded.category_id, product_type = excluded.product_type,
          price = excluded.price, sale_price = excluded.sale_price,
          age_range = excluded.age_range, material = excluded.material,
          capacity_ml = excluded.capacity_ml, piece_count = excluded.piece_count,
          care_instructions = excluded.care_instructions, specs = excluded.specs,
          is_featured = excluded.is_featured, is_new = excluded.is_new
        returning id, (xmax = 0) as inserted`;

      // Images: replace with the current set.
      await tx`delete from public.product_images where product_id = ${row.id}`;
      const images = [
        ...(p.image ? [{ url: p.image, alt: p.name, style: p.imageStyle, primary: true }] : []),
        ...(d?.gallery ?? []).map((g) => ({ url: g.src, alt: g.alt, style: g.style, primary: false })),
      ];
      for (const [i, img] of images.entries()) {
        await tx`
          insert into public.product_images (product_id, url, alt, image_style, is_primary, sort_order)
          values (${row.id}, ${img.url}, ${img.alt}, ${img.style}, ${img.primary}, ${i})`;
      }

      // Stock only on first creation, with an "initial" movement.
      if (row.inserted) {
        created++;
        const [inv] = await tx`
          insert into public.inventory (product_id, quantity) values (${row.id}, ${p.stock})
          on conflict (product_id, variant_id) do nothing
          returning id, quantity`;
        if (inv && inv.quantity > 0) {
          await tx`
            insert into public.inventory_movements (inventory_id, change, quantity_after, reason, note)
            values (${inv.id}, ${inv.quantity}, ${inv.quantity}, 'initial', 'Seeded from sample catalogue')`;
        }
      }
    }

    // Delivery methods
    for (const [i, m] of DELIVERY_METHODS.entries()) {
      await tx`
        insert into public.delivery_methods (id, label, description, fee, states, sort_order)
        values (${m.id}, ${m.label}, ${m.description}, ${m.fee}, ${m.states ? [...m.states] : null}, ${i})
        on conflict (id) do update set
          label = excluded.label, description = excluded.description, fee = excluded.fee,
          states = excluded.states, sort_order = excluded.sort_order`;
    }

    const [counts] = await tx`
      select
        (select count(*) from public.categories)::int as categories,
        (select count(*) from public.products)::int as products,
        (select count(*) from public.product_images)::int as images,
        (select coalesce(sum(quantity), 0) from public.inventory)::int as units,
        (select count(*) from public.delivery_methods)::int as delivery`;
    console.log(
      `Seeded: ${counts.categories} categories, ${counts.products} products (${created} new), ` +
        `${counts.images} images, ${counts.units} units in stock, ${counts.delivery} delivery methods.`,
    );
  });
} catch (err) {
  console.error("Seed failed:", (err as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}

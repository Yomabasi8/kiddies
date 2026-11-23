import "server-only";

export type Testimonial = {
  id: string;
  name: string;
  /** e.g. "Mum of two, Lagos". */
  context: string | null;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar: string | null;
};

/**
 * Customer testimonials. AGENTS.md forbids fabricated reviews, so this
 * returns only genuine, consented reviews supplied by the owner (and later,
 * approved reviews from the database). While it is empty the homepage
 * section stays hidden.
 *
 * TODO(supabase): load approved reviews from the database.
 */
const GENUINE_TESTIMONIALS: Testimonial[] = [];

export async function getTestimonials(): Promise<Testimonial[]> {
  return GENUINE_TESTIMONIALS;
}

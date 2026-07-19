export interface Testimonial {
  id: string;
  name: string;
  location: string;
  service: string;
  quote: string;
  rating: number;
  featured: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Mark T.',
    location: 'Bellevue, NE',
    service: 'Retaining Wall Installation',
    quote: 'Schmidt Construction replaced three failing retaining walls on a steep slope. The crew was professional, showed up on time every day, and the walls look incredible. They explained every step of the drainage work clearly. Worth every penny.',
    rating: 5,
    featured: true,
  },
  {
    id: 't2',
    name: 'Jennifer R.',
    location: 'Papillion, NE',
    service: 'French Drain & Drainage',
    quote: 'We had water in our basement every spring for years. Schmidt installed a French drain system around the perimeter of our yard and the problem is completely gone. Fair price and great workmanship.',
    rating: 5,
    featured: true,
  },
  {
    id: 't3',
    name: 'David L.',
    location: 'Omaha, NE',
    service: 'Block Retaining Wall',
    quote: 'Had a 40-foot block wall installed along the back of my property. They handled the excavation, drainage, and wall in just a few days. Clean, professional, and they left the yard in better shape than they found it.',
    rating: 5,
    featured: true,
  },
  {
    id: 't4',
    name: 'Susan M.',
    location: 'La Vista, NE',
    service: 'Concrete Driveway',
    quote: 'New concrete driveway from the street to the garage. The sub-base prep was thorough and the finish is beautiful. Schmidt gave me the most detailed estimate of anyone I called.',
    rating: 5,
    featured: false,
  },
  {
    id: 't5',
    name: 'Tom B.',
    location: 'Gretna, NE',
    service: 'Timber Retaining Wall',
    quote: 'Needed railroad tie walls replaced on a terraced yard. Schmidt was honest about what needed to come out and what could stay. Great value and the new timber walls look sharp.',
    rating: 5,
    featured: false,
  },
];

export const featuredTestimonials = testimonials.filter(t => t.featured);

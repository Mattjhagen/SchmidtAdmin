// Editable company / site content
// Edit this file to update contact info, taglines, and CTAs across the entire marketing site.

export const site = {
  name: 'Schmidt Construction',
  legalName: 'Schmidt Construction Inc.',
  tagline: '50+ Years of Family-Owned Excellence',
  shortTagline: 'Omaha\'s Trusted Contractor Since 1976',
  description: 'Family-owned general contractor serving Omaha, Nebraska and surrounding areas since 1976. Specializing in retaining walls, concrete, drainage, and remodeling. Licensed, insured, and dedicated to premium quality.',

  phone: '(402) 320-2600',
  phoneHref: 'tel:+14023202600',
  email: 'Mikiel@schmidt-construction.com',
  address: {
    street: 'Omaha',
    city: 'Omaha',
    state: 'NE',
    zip: '68102',
    full: 'Omaha, NE',
  },

  social: {
    facebook: '',
    instagram: '',
  },

  founded: 1976,
  yearsInBusiness: new Date().getFullYear() - 1976,
  licenseNumber: 'Licensed & Insured',

  cta: {
    primary: 'Get a Free Estimate',
    secondary: 'View Our Work',
    contact: 'Contact Us Today',
  },

  seo: {
    titleSuffix: 'Schmidt Construction | Omaha, NE',
    homeTitle: 'Schmidt Construction — Retaining Walls, Concrete & Remodeling | Omaha, NE',
    homeDescription: 'Family-owned contractor serving Omaha, NE since 1976. Retaining walls, concrete, drainage, kitchen & bathroom remodeling. Licensed & insured. Call for a free estimate.',
    ogImage: '/og-image.jpg',
  },

  serviceArea: 'Omaha and surrounding communities including Bellevue, La Vista, Papillion, Gretna, Elkhorn, Millard, Ralston, and Council Bluffs, IA',
};

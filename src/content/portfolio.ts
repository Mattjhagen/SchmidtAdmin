export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  serviceSlug: string;
  serviceName: string;
  description: string;
  image: string;
  featured: boolean;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'p1',
    title: 'Block Retaining Wall Installation',
    location: 'Omaha, NE',
    serviceSlug: 'block-retaining-wall',
    serviceName: 'Block Retaining Wall',
    description: 'Allan Block retaining wall system on a residential slope. Includes drain tile and geogrid reinforcement.',
    image: '/images/portfolio/terraced-block-wall.jpg',
    featured: true,
  },
  {
    id: 'p2',
    title: 'Lakefront Retaining Wall',
    location: 'Omaha Metro, NE',
    serviceSlug: 'retaining-wall-installation',
    serviceName: 'Retaining Wall Installation',
    description: 'Lakefront wall protecting shoreline from erosion with engineered drainage and reinforcement.',
    image: '/images/portfolio/french-drain.jpg',
    featured: true,
  },
  {
    id: 'p3',
    title: 'Stone Retaining Wall',
    location: 'Omaha, NE',
    serviceSlug: 'retaining-wall-installation',
    serviceName: 'Retaining Wall Installation',
    description: 'Premium stone retaining wall with clean capstone finish and integrated drainage system.',
    image: '/images/portfolio/stamped-patio.jpg',
    featured: true,
  },
  {
    id: 'p4',
    title: 'Timber Retaining Wall with Steps',
    location: 'West Omaha, NE',
    serviceSlug: 'timber-retaining-wall',
    serviceName: 'Timber Retaining Wall',
    description: 'Pressure-treated timber retaining wall with integrated landscape steps and garden bed terracing.',
    image: '/images/portfolio/timber-terrace.jpg',
    featured: false,
  },
  {
    id: 'p5',
    title: 'Commercial Stone Retaining Wall',
    location: 'La Vista, NE',
    serviceSlug: 'commercial-retaining-wall',
    serviceName: 'Commercial Retaining Wall',
    description: 'Large-scale stone retaining wall for commercial parking lot grade change. Engineered for heavy load surcharge.',
    image: '/images/portfolio/commercial-parking.jpg',
    featured: false,
  },
  {
    id: 'p6',
    title: 'Seawall Installation',
    location: 'Omaha Metro, NE',
    serviceSlug: 'retaining-wall-installation',
    serviceName: 'Retaining Wall Installation',
    description: 'Steel sheet piling seawall protecting lakefront property from erosion and wave action.',
    image: '/images/seawall.png',
    featured: false,
  },
];

export const featuredPortfolio = portfolioItems.filter(p => p.featured);

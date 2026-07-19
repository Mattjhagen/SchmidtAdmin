// Editable service definitions
// Each service drives a dedicated page and the homepage service grid.

export interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  icon: string;          // emoji fallback
  image: string;         // placeholder path
  seoTitle: string;
  seoDescription: string;
  relatedSlugs: string[];
  featured: boolean;
}

export const services: Service[] = [
  {
    id: 'retaining-wall',
    name: 'Retaining Wall Installation',
    slug: 'retaining-wall-installation',
    shortDescription: 'Engineered retaining walls that protect your property and last for decades.',
    longDescription: `Schmidt Construction has installed hundreds of retaining walls across Omaha and the surrounding metro area. Whether you need a low decorative border or a structural wall holding back significant grade change, we engineer each project to last. We assess soil conditions, drainage needs, and site access before recommending the right wall system for your property.`,
    features: [
      'Block retaining walls (Allan Block, Versa-Lok, Keystone)',
      'Timber and railroad tie walls',
      'Poured concrete and block walls',
      'Drainage tile installation behind every wall',
      'Geogrid reinforcement for walls over 3 ft',
      'Free on-site estimates',
    ],
    icon: '🧱',
    image: '/assets/block-retaining-wall-example.jpg',
    seoTitle: 'Retaining Wall Installation Omaha NE | Schmidt Construction',
    seoDescription: 'Professional retaining wall installation in Omaha, NE. Block, timber, and concrete walls. Drainage included. Family-owned since 1976. Free estimates.',
    relatedSlugs: ['block-retaining-wall', 'timber-retaining-wall', 'drainage-solutions'],
    featured: true,
  },
  {
    id: 'block-retaining-wall',
    name: 'Block Retaining Walls',
    slug: 'block-retaining-wall',
    shortDescription: 'Allan Block, Versa-Lok, and Keystone retaining wall systems installed to spec.',
    longDescription: `Block retaining walls are the most popular choice for Omaha homeowners. They offer a clean, professional look and exceptional longevity. We install major block systems including Allan Block, Versa-Lok, and Keystone. Our crews are trained by the manufacturers and follow every specification for base preparation, batter, drainage, and capstone installation.`,
    features: [
      'Allan Block, Versa-Lok, Keystone systems',
      'Proper base excavation and compaction',
      '3/4" clean stone drainage layer',
      'Perforated drain tile installation',
      'Geogrid reinforcement where required',
      'Capstone installation',
    ],
    icon: '🪨',
    image: '/assets/stone-retaining-wall-tennis-court.jpg',
    seoTitle: 'Block Retaining Wall Installation Omaha NE | Schmidt Construction',
    seoDescription: 'Expert block retaining wall installation in Omaha, NE. Allan Block, Versa-Lok, Keystone. Proper drainage included. Free estimates from a family-owned contractor.',
    relatedSlugs: ['retaining-wall-installation', 'timber-retaining-wall', 'drainage-solutions'],
    featured: false,
  },
  {
    id: 'timber-retaining-wall',
    name: 'Timber Retaining Walls',
    slug: 'timber-retaining-wall',
    shortDescription: 'Pressure-treated timber and railroad tie walls for a natural look.',
    longDescription: `Timber retaining walls offer a warm, natural aesthetic that complements landscaping beautifully. We install pressure-treated timber walls and railroad tie walls with proper deadman anchoring, drainage, and geotextile fabric to maximize the lifespan of your investment. Timber walls are an excellent choice for moderate grade changes and garden terracing.`,
    features: [
      'Pressure-treated 6x6 timber walls',
      'Railroad tie walls',
      'Deadman anchor system for structural stability',
      'Geotextile drainage fabric',
      'Drainage tile behind wall base',
      'Terrace and garden step integration',
    ],
    icon: '🪵',
    image: '/assets/timber-retaining-wall-west-omaha.jpg',
    seoTitle: 'Timber Retaining Wall Installation Omaha NE | Schmidt Construction',
    seoDescription: 'Timber and railroad tie retaining wall installation in Omaha, NE. Proper deadman anchoring and drainage. Family-owned contractor. Free estimates.',
    relatedSlugs: ['retaining-wall-installation', 'block-retaining-wall', 'drainage-solutions'],
    featured: false,
  },
  {
    id: 'commercial-retaining-wall',
    name: 'Commercial Retaining Walls',
    slug: 'commercial-retaining-wall',
    shortDescription: 'Large-scale retaining wall projects for commercial and municipal properties.',
    longDescription: `Schmidt Construction has the equipment and experience to handle commercial-scale retaining wall projects across the Omaha metro. From parking lot grade changes to erosion control on commercial parcels, we deliver engineered wall systems that meet commercial durability requirements and local codes.`,
    features: [
      'Large-scale block wall systems',
      'Poured concrete walls',
      'Erosion control solutions',
      'Parking lot grade changes',
      'Commercial site work coordination',
      'Project documentation and reporting',
    ],
    icon: '🏗️',
    image: '/assets/stone-retaining-wall-commercial.jpg',
    seoTitle: 'Commercial Retaining Wall Contractor Omaha NE | Schmidt Construction',
    seoDescription: 'Commercial retaining wall installation in Omaha, NE. Large-scale block, poured concrete, and erosion control. Licensed & insured. Free project estimates.',
    relatedSlugs: ['retaining-wall-installation', 'block-retaining-wall', 'concrete-contractor'],
    featured: false,
  },
  {
    id: 'drainage-solutions',
    name: 'Drainage Solutions',
    slug: 'drainage-solutions',
    shortDescription: 'French drains, surface grading, and waterproofing to protect your property.',
    longDescription: `Poor drainage is one of the leading causes of foundation damage, erosion, and flooding in Omaha homes. Schmidt Construction installs comprehensive drainage solutions that channel water away from your home and landscaping. From simple surface regrading to full French drain systems with catch basins and outlet pipes, we solve water problems permanently.`,
    features: [
      'French drain installation',
      'Surface regrading and swale creation',
      'Catch basin and outlet pipe installation',
      'Downspout extension and diversion',
      'Sump pump discharge routing',
      'Erosion control blankets and ground cover',
    ],
    icon: '🌊',
    image: '/assets/lakefront-seawall-omaha.jpg',
    seoTitle: 'Drainage Solutions Omaha NE | French Drain Installation | Schmidt Construction',
    seoDescription: 'French drain and drainage solutions in Omaha, NE. Protect your foundation and landscaping from water damage. Family-owned contractor. Free estimates.',
    relatedSlugs: ['retaining-wall-installation', 'concrete-contractor'],
    featured: true,
  },
  {
    id: 'concrete-contractor',
    name: 'Concrete Work',
    slug: 'concrete-contractor',
    shortDescription: 'Driveways, sidewalks, patios, and slabs poured by experienced concrete crews.',
    longDescription: `From residential driveways to commercial slabs, Schmidt Construction delivers professional concrete work across the Omaha area. We prep the sub-base properly, use the right PSI mix for each application, and finish to your specification. Our concrete work is built to handle Nebraska's freeze-thaw cycles.`,
    features: [
      'Driveway replacement and installation',
      'Sidewalk and walkway installation',
      'Patio and outdoor living slabs',
      'Garage floor replacement',
      'Stamped and decorative concrete',
      'Concrete step and stoop repair',
    ],
    icon: '⬜',
    image: '/assets/stone-retaining-wall-residential.jpg',
    seoTitle: 'Concrete Contractor Omaha NE | Driveways, Patios & Slabs | Schmidt Construction',
    seoDescription: 'Concrete contractor in Omaha, NE. Driveways, patios, sidewalks, and slabs. Properly prepped and finished for Nebraska winters. Free estimates.',
    relatedSlugs: ['drainage-solutions', 'retaining-wall-installation'],
    featured: true,
  },
  {
    id: 'seawall',
    name: 'Seawall & Lakeside',
    slug: 'seawall-lakeside',
    shortDescription: 'Steel sheet piling and concrete seawalls for lakefront and waterfront properties.',
    longDescription: `Schmidt Construction installs professional seawalls and lakeside retaining structures throughout the Omaha metro area. Whether you need steel sheet piling to protect a shoreline or a concrete seawall to prevent erosion on your lakefront property, our crews deliver engineered solutions built to handle Nebraska's water levels and freeze-thaw cycles. We assess your shoreline conditions and recommend the right system for your property.`,
    features: [
      'Steel sheet piling seawalls',
      'Concrete seawall installation',
      'Shoreline erosion control',
      'Lakefront retaining walls',
      'Drainage and waterproofing',
      'Free on-site estimates',
    ],
    icon: '🌊',
    image: '/assets/lakefront-seawall-omaha.jpg',
    seoTitle: 'Seawall & Lakeside Retaining Wall Omaha NE | Schmidt Construction',
    seoDescription: 'Seawall and lakeside retaining wall installation in Omaha, NE. Steel sheet piling and concrete seawalls. Family-owned contractor. Free estimates.',
    relatedSlugs: ['retaining-wall-installation', 'drainage-solutions', 'commercial-retaining-wall'],
    featured: false,
  },
  {
    id: 'kitchen-remodeling',
    name: 'Kitchen Remodeling',
    slug: 'kitchen-remodeling',
    shortDescription: 'Full kitchen remodels from cabinet installation to tile and countertops.',
    longDescription: `Schmidt Construction brings the same precision and professionalism that defines our exterior work to interior kitchen remodels. Whether you are refreshing cabinets and countertops or opening walls for an open-concept layout, our crews deliver clean, lasting results in Omaha homes.`,
    features: [
      'Cabinet removal and installation',
      'Countertop installation (laminate, granite, quartz)',
      'Tile backsplash installation',
      'Flooring replacement',
      'Plumbing and electrical coordination',
      'Layout reconfiguration and wall removal',
    ],
    icon: '🍳',
    image: '/assets/timber-wall-steps-papillion.png',
    seoTitle: 'Kitchen Remodeling Omaha NE | Schmidt Construction',
    seoDescription: 'Kitchen remodeling in Omaha, NE. Cabinets, countertops, tile, and full kitchen renovations. Family-owned contractor. Free estimates.',
    relatedSlugs: ['bathroom-remodeling'],
    featured: false,
  },
  {
    id: 'bathroom-remodeling',
    name: 'Bathroom Remodeling',
    slug: 'bathroom-remodeling',
    shortDescription: 'Bathroom renovations including tile, fixtures, vanities, and full gut remodels.',
    longDescription: `From a single bathroom refresh to a complete gut remodel, Schmidt Construction handles bathroom projects of every scale. We coordinate demolition, waterproofing, tile installation, fixture placement, and finish work so you have a single point of contact from start to finish.`,
    features: [
      'Full bathroom gut and rebuild',
      'Shower tile and waterproofing',
      'Vanity and fixture installation',
      'Flooring replacement',
      'Tub to shower conversion',
      'Accessible bathroom modifications',
    ],
    icon: '🚿',
    image: '/assets/seawall-waterfront.jpg',
    seoTitle: 'Bathroom Remodeling Omaha NE | Schmidt Construction',
    seoDescription: 'Bathroom remodeling in Omaha, NE. Tile, fixtures, vanities, and full gut remodels. Family-owned contractor. Free estimates.',
    relatedSlugs: ['kitchen-remodeling'],
    featured: false,
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find(s => s.slug === slug);
}

export function getRelatedServices(slug: string): Service[] {
  const service = getServiceBySlug(slug);
  if (!service) return [];
  return service.relatedSlugs
    .map(s => getServiceBySlug(s))
    .filter(Boolean) as Service[];
}

export const featuredServices = services.filter(s => s.featured);

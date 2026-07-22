// One-time import list: the photos currently hard-coded on the public
// website (walls2.com). Importing these into the portfolio database lets
// the owner edit, re-order, and delete every photo from the Site Editor.

const BASE = 'https://walls2.com/images/';

export interface WebsitePhoto {
  title: string;
  location: string;
  service_slug: string;
  service_name: string;
  description: string;
  image_url: string;
  featured: boolean;
  sort_order: number;
}

const p = (
  sort_order: number,
  file: string,
  title: string,
  service_slug: string,
  service_name: string,
  featured: boolean,
  location = '',
): WebsitePhoto => ({
  title,
  location,
  service_slug,
  service_name,
  description: '',
  image_url: BASE + file,
  featured,
  sort_order,
});

// Featured items (true) are the ones on the homepage gallery today;
// the rest appear on the Project Gallery page.
export const websitePhotos: WebsitePhoto[] = [
  p(1, 'schmidt-6in-siena-wall.jpg', '6in Siena Block Wall', 'block-retaining-wall', 'Block Retaining Walls', true, 'Omaha, NE'),
  p(2, 'schmidt-block-wall.jpg', 'Block Retaining Wall', 'block-retaining-wall', 'Block Retaining Walls', true),
  p(3, 'schmidt-retaining-wall.jpg', 'Retaining Wall Project', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  p(4, 'schmidt-8in-siena-wall.jpg', '8in Siena Block Wall', 'block-retaining-wall', 'Block Retaining Walls', true),
  p(5, 'schmidt-belvedere-wall.jpg', 'Bellevue Wall Project', 'retaining-wall-installation', 'Retaining Wall Installation', true, 'Bellevue, NE'),
  p(6, 'schmidt-6in-siena-175th.jpg', '175th & Karen — Siena Wall', 'block-retaining-wall', 'Block Retaining Walls', true, 'Omaha, NE'),
  p(7, 'schmidt-boulder-wall.jpg', 'Boulder Retaining Wall', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  p(8, 'schmidt-boulder-project-1.jpg', 'Terraced Boulder Wall', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  p(9, 'schmidt-timber.jpg', 'Timber Retaining Wall', 'timber-retaining-wall', 'Timber Retaining Walls', true),
  p(10, 'schmidt-stone-wall.jpg', 'Stone Retaining Wall', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  p(11, 'schmidt-6in-gray-wall.jpg', '6in Gray Block Wall', 'block-retaining-wall', 'Block Retaining Walls', true, 'Omaha, NE'),
  p(12, 'schmidt-bevel-onyx-wall.jpg', 'Bevel Onyx Block Wall', 'block-retaining-wall', 'Block Retaining Walls', true),
  p(13, 'schmidt-wall-project-1.jpg', 'Block Wall Construction', 'block-retaining-wall', 'Block Retaining Walls', true),
  p(14, 'schmidt-6in-siena-tiered.jpg', 'Tiered Siena Wall', 'block-retaining-wall', 'Block Retaining Walls', true),
  p(15, 'schmidt-lakefront.jpg', 'Lakefront Wall', 'seawall-lakeside', 'Seawall & Lakeside', true),
  p(16, 'schmidt-seawall.png', 'Seawall Project', 'seawall-lakeside', 'Seawall & Lakeside', true),
  p(17, 'schmidt-project-showcase.jpg', 'Project Showcase', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  p(18, 'concrete-driveway-omaha.jpg', 'Concrete Driveway', 'concrete-contractor', 'Concrete Work', true, 'Omaha, NE'),
  p(19, 'timber-retaining-wall-hero.jpg', 'Timber Retaining Wall', 'timber-retaining-wall', 'Timber Retaining Walls', false, 'Omaha, NE'),
  p(20, 'block-retaining-wall-steps.jpg', 'Block Wall & Steps', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(21, 'after-block-retaining-wall.jpg', 'Engineered Block Wall', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(22, 'timber-wall-landscaped.jpg', 'Landscaped Timber Wall', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  p(23, 'lakefront-seawall-omaha.jpg', 'Lakefront Seawall', 'seawall-lakeside', 'Seawall & Lakeside', false),
  p(24, 'stamped-patio-garden-wall.jpg', 'Stamped Patio & Garden Wall', 'concrete-contractor', 'Concrete Work', false),
  p(25, 'stamped-concrete-patio-steps.jpg', 'Stamped Concrete Patio', 'concrete-contractor', 'Concrete Work', false),
  p(26, 'seawall-dock-detail.jpg', 'Seawall & Dock', 'seawall-lakeside', 'Seawall & Lakeside', false),
  p(27, 'block-wall-siena-tiered.jpg', 'Tiered Block Wall (Siena)', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(28, 'timber-wall-steps-patio.jpg', 'Timber Wall & Patio', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  p(29, 'block-wall-8in-sienna.jpg', '8in Sienna Block Wall', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(30, 'block-wall-steps-detail.jpg', 'Block Steps Detail', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(31, 'block-wall-residential.jpg', 'Residential Block Wall', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(32, 'timber-terraced-hostas.jpg', 'Terraced Timber Walls', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  p(33, 'paver-walkway-landscaped.jpg', 'Paver Walkway', 'concrete-contractor', 'Concrete Work', false),
  p(34, 'paver-patio-dining.jpg', 'Paver Patio', 'concrete-contractor', 'Concrete Work', false),
  p(35, 'kitchen-remodel-counters.jpg', 'Kitchen Remodel', 'kitchen-remodeling', 'Kitchen Remodeling', false),
  p(36, 'block-garden-wall-steps.jpg', 'Garden Wall & Steps', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(37, 'schmidt-block-wall-branded.jpg', 'Block Wall (Schmidt Branded)', 'block-retaining-wall', 'Block Retaining Walls', false),
  p(38, 'composite-steps-stone-veneer.jpg', 'Composite Steps & Stone Veneer', 'concrete-contractor', 'Concrete Work', false),
];

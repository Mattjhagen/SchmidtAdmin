export interface ServiceArea {
  id: string;
  name: string;
  state: string;
  description: string;
  primary: boolean;
}

export const serviceAreas: ServiceArea[] = [
  { id: 'omaha', name: 'Omaha', state: 'NE', description: 'Our home base and primary service area. We serve all Omaha zip codes.', primary: true },
  { id: 'bellevue', name: 'Bellevue', state: 'NE', description: 'Full service area coverage throughout Bellevue and Offutt AFB vicinity.', primary: true },
  { id: 'papillion', name: 'Papillion', state: 'NE', description: 'Retaining walls, concrete, and drainage throughout Papillion.', primary: true },
  { id: 'la-vista', name: 'La Vista', state: 'NE', description: 'All services available in La Vista and surrounding neighborhoods.', primary: true },
  { id: 'gretna', name: 'Gretna', state: 'NE', description: 'Serving Gretna and the fast-growing Sarpy County corridor.', primary: false },
  { id: 'elkhorn', name: 'Elkhorn', state: 'NE', description: 'Retaining walls and site work in Elkhorn and west Omaha.', primary: false },
  { id: 'millard', name: 'Millard', state: 'NE', description: 'Full service coverage in the Millard district.', primary: false },
  { id: 'ralston', name: 'Ralston', state: 'NE', description: 'Serving Ralston homeowners and commercial properties.', primary: false },
  { id: 'council-bluffs', name: 'Council Bluffs', state: 'IA', description: 'Select projects accepted in Council Bluffs, IA across the river.', primary: false },
];

export const primaryAreas = serviceAreas.filter(a => a.primary);

/**
 * texasRates.js — FY2026 Texas hospice RHC rates by CBSA/city
 * Source: Palmetto GBA Hospice Rate Calculator
 * Period: October 1, 2025 – September 30, 2026 (Quality Data: Yes)
 *
 * Structure: Array of city objects, each with:
 *   - city: CBSA name (display label for dropdown)
 *   - counties: array of county names (first is the default)
 *   - rhcHigh: RHC Rate Days 1-60 (our "RHC High Rate")
 *   - rhcLow: RHC Rate Days 60+ (our "RHC Low Rate")
 *   - wageIndex: CMS wage index
 *   - cbsaCode: CBSA code for reference
 */

const TEXAS_RATES = [
  {
    city: 'Abilene',
    counties: ['Callahan', 'Jones', 'Taylor'],
    rhcHigh: 219.97, rhcLow: 173.38, wageIndex: 0.93, cbsaCode: '10180',
  },
  {
    city: 'Amarillo',
    counties: ['Armstrong', 'Carson', 'Oldham', 'Potter', 'Randall'],
    rhcHigh: 206.97, rhcLow: 163.14, wageIndex: 0.84, cbsaCode: '11100',
  },
  {
    city: 'Austin-Round Rock-San Marcos',
    counties: ['Bastrop', 'Caldwell', 'Hays', 'Travis', 'Williamson'],
    rhcHigh: 225.65, rhcLow: 177.86, wageIndex: 0.97, cbsaCode: '12420',
  },
  {
    city: 'Beaumont-Port Arthur',
    counties: ['Hardin', 'Jefferson', 'Orange'],
    rhcHigh: 212.44, rhcLow: 167.45, wageIndex: 0.88, cbsaCode: '13140',
  },
  {
    city: 'Brownsville-Harlingen',
    counties: ['Cameron'],
    rhcHigh: 200.36, rhcLow: 157.92, wageIndex: 0.80, cbsaCode: '15180',
  },
  {
    city: 'College Station-Bryan',
    counties: ['Brazos', 'Burleson', 'Robertson'],
    rhcHigh: 211.42, rhcLow: 166.64, wageIndex: 0.87, cbsaCode: '17780',
  },
  {
    city: 'Corpus Christi',
    counties: ['Aransas', 'Nueces', 'San Patricio'],
    rhcHigh: 219.97, rhcLow: 173.38, wageIndex: 0.93, cbsaCode: '18580',
  },
  {
    city: 'Dallas-Plano-Irving',
    counties: ['Collin', 'Dallas', 'Denton', 'Ellis', 'Hunt', 'Kaufman', 'Rockwall'],
    rhcHigh: 225.33, rhcLow: 177.61, wageIndex: 0.96, cbsaCode: '19124',
  },
  {
    city: 'Eagle Pass',
    counties: ['Maverick'],
    rhcHigh: 201.55, rhcLow: 158.86, wageIndex: 0.81, cbsaCode: '20580',
  },
  {
    city: 'El Paso',
    counties: ['El Paso', 'Hudspeth'],
    rhcHigh: 205.08, rhcLow: 161.65, wageIndex: 0.83, cbsaCode: '21340',
  },
  {
    city: 'Fort Worth-Arlington-Grapevine',
    counties: ['Johnson', 'Parker', 'Tarrant', 'Wise'],
    rhcHigh: 226.12, rhcLow: 178.23, wageIndex: 0.97, cbsaCode: '23104',
  },
  {
    city: 'Houston-Pasadena-The Woodlands',
    counties: ['Austin', 'Brazoria', 'Chambers', 'Fort Bend', 'Galveston', 'Harris', 'Liberty', 'Montgomery', 'San Jacinto', 'Waller'],
    rhcHigh: 226.70, rhcLow: 178.69, wageIndex: 0.97, cbsaCode: '26420',
  },
  {
    city: 'Killeen-Temple',
    counties: ['Bell', 'Coryell', 'Lampasas'],
    rhcHigh: 222.65, rhcLow: 175.49, wageIndex: 0.95, cbsaCode: '28660',
  },
  {
    city: 'Laredo',
    counties: ['Webb'],
    rhcHigh: 202.05, rhcLow: 159.26, wageIndex: 0.81, cbsaCode: '29700',
  },
  {
    city: 'Longview',
    counties: ['Gregg', 'Harrison', 'Rusk', 'Upshur'],
    rhcHigh: 216.69, rhcLow: 170.80, wageIndex: 0.91, cbsaCode: '30980',
  },
  {
    city: 'Lubbock',
    counties: ['Cochran', 'Crosby', 'Garza', 'Hockley', 'Lubbock', 'Lynn'],
    rhcHigh: 209.39, rhcLow: 165.04, wageIndex: 0.86, cbsaCode: '31180',
  },
  {
    city: 'McAllen-Edinburg-Mission',
    counties: ['Hidalgo'],
    rhcHigh: 200.36, rhcLow: 157.92, wageIndex: 0.80, cbsaCode: '32580',
  },
  {
    city: 'Midland',
    counties: ['Martin', 'Midland'],
    rhcHigh: 215.87, rhcLow: 170.15, wageIndex: 0.90, cbsaCode: '33260',
  },
  {
    city: 'Odessa',
    counties: ['Ector'],
    rhcHigh: 211.06, rhcLow: 166.35, wageIndex: 0.87, cbsaCode: '36220',
  },
  {
    city: 'San Angelo',
    counties: ['Irion', 'Tom Green'],
    rhcHigh: 212.15, rhcLow: 167.22, wageIndex: 0.88, cbsaCode: '41660',
  },
  {
    city: 'San Antonio-New Braunfels',
    counties: ['Atascosa', 'Bandera', 'Bexar', 'Comal', 'Guadalupe', 'Kendall', 'Medina', 'Wilson'],
    rhcHigh: 208.37, rhcLow: 164.24, wageIndex: 0.85, cbsaCode: '41700',
  },
  {
    city: 'Sherman-Denison',
    counties: ['Grayson'],
    rhcHigh: 204.29, rhcLow: 161.02, wageIndex: 0.83, cbsaCode: '43300',
  },
  {
    city: 'Texarkana',
    counties: ['Bowie'],
    rhcHigh: 222.82, rhcLow: 175.62, wageIndex: 0.95, cbsaCode: '45500',
  },
  {
    city: 'Tyler',
    counties: ['Smith'],
    rhcHigh: 217.10, rhcLow: 171.12, wageIndex: 0.91, cbsaCode: '46340',
  },
  {
    city: 'Victoria',
    counties: ['Goliad', 'Victoria'],
    rhcHigh: 208.05, rhcLow: 163.99, wageIndex: 0.85, cbsaCode: '47020',
  },
  {
    city: 'Waco',
    counties: ['Bosque', 'Falls', 'McLennan'],
    rhcHigh: 222.42, rhcLow: 175.31, wageIndex: 0.94, cbsaCode: '47380',
  },
  {
    city: 'Wichita Falls',
    counties: ['Archer', 'Clay', 'Wichita'],
    rhcHigh: 216.81, rhcLow: 170.89, wageIndex: 0.91, cbsaCode: '48660',
  },
  {
    city: 'Other Texas Counties',
    counties: ['All Other Counties'],
    rhcHigh: 206.45, rhcLow: 162.73, wageIndex: 0.84, cbsaCode: '99945',
  },
];

/** All city names for dropdown */
export const TEXAS_CITIES = TEXAS_RATES.map(r => r.city);

/** Lookup city data by city name */
export function getCityData(cityName) {
  return TEXAS_RATES.find(r => r.city === cityName) || null;
}

/** Get counties for a given city */
export function getCountiesForCity(cityName) {
  const entry = getCityData(cityName);
  return entry ? entry.counties : [];
}

/** Get the default county (first in list) for a city */
export function getDefaultCounty(cityName) {
  const counties = getCountiesForCity(cityName);
  return counties.length > 0 ? counties[0] : '';
}

export default TEXAS_RATES;

import assert from 'assert';
import { 
  parseAndSanitizeLocationAndWorkplace,
  extractDistinctLocations,
  doesLocationMatchPreference,
  normalizeSingleLocation
} from '../../src/utils/locationAndWorkplaceSanitizer';

export function runLocationAndWorkplaceSanitizerTests() {
  console.log('Starting locationAndWorkplaceSanitizer unit test suite (Approach A)...');

  // Test 1: TPU role out of City of Tacoma with travel to customers
  const tpuJob = {
    title: 'Customer Solutions IT Specialist',
    companyName: 'City of Tacoma / TPU',
    location: 'Tacoma, WA',
    description: 'Support Tacoma Public Utilities infrastructure. Requires frequent travel to customer sites and local facilities.',
    requirements: 'Valid WA drivers license and ability to conduct customer visits.'
  };
  const tpuResult = parseAndSanitizeLocationAndWorkplace(tpuJob);
  assert.strictEqual(tpuResult.workplaceType, 'Hybrid', 'TPU role requiring travel to customers must be marked as Hybrid');
  assert.strictEqual(tpuResult.location, 'Tacoma, WA', 'TPU role location must normalize to Tacoma, WA');
  assert.strictEqual(tpuResult.hasTravelRequirement, true, 'TPU role must flag travel requirement');
  console.log('✓ Test 1: TPU City of Tacoma role with customer travel correctly marked as Hybrid (Tacoma, WA)');

  // Test 2: Role with partial in-office or telework agreement
  const hybridJob = {
    title: 'Senior Financial Analyst',
    companyName: 'Pierce County Government',
    location: 'Location: Tacoma',
    description: 'Eligible for telework agreement with 2 days per week partial in-office schedule.',
    requirements: 'Must reside within commuting distance.'
  };
  const hybridResult = parseAndSanitizeLocationAndWorkplace(hybridJob);
  assert.strictEqual(hybridResult.workplaceType, 'Hybrid', 'Partial in-office schedule must be marked as Hybrid');
  assert.strictEqual(hybridResult.location, 'Tacoma, WA', 'Location prefix stripped and normalized to Tacoma, WA');
  console.log('✓ Test 2: Partial in-office role marked as Hybrid with sanitized location');

  // Test 3: Explicit 100% on-site role
  const onsiteJob = {
    title: 'Water Treatment Maintenance Technician',
    companyName: 'Tacoma Water',
    location: 'Tacoma, WA',
    description: '100% on-site physical maintenance at water filtration facility.'
  };
  const onsiteResult = parseAndSanitizeLocationAndWorkplace(onsiteJob);
  assert.strictEqual(onsiteResult.workplaceType, 'On-Site', 'Physical maintenance job must be marked as On-Site');
  console.log('✓ Test 3: 100% on-site facility role correctly classified as On-Site');

  // Test 4: Fully remote role with zero travel
  const remoteJob = {
    title: 'Staff Cloud Platform Engineer',
    companyName: 'Acme Software',
    location: 'Remote',
    description: '100% remote position. Work from anywhere in the United States.'
  };
  const remoteResult = parseAndSanitizeLocationAndWorkplace(remoteJob);
  assert.strictEqual(remoteResult.workplaceType, 'Remote', 'Pure remote role without travel must be Remote');
  assert.strictEqual(remoteResult.hasTravelRequirement, false, 'Remote role must have no travel requirement');
  console.log('✓ Test 4: Fully remote role classified as Remote');

  // Test 5: TPU role out of City of Tacoma with travel to customers or partial in office overrides raw Remote tag
  const tpuCustomerTravelJob = {
    title: 'Senior Utility Systems Engineer',
    companyName: 'City of Tacoma',
    location: 'Remote',
    workplaceType: 'Remote',
    description: 'TPU role out of the City of Tacoma requires travel to customers or partial in office.',
    requirements: 'Willingness to travel throughout Tacoma and attend scheduled in-office planning sessions.'
  };
  const tpuCustomerTravelResult = parseAndSanitizeLocationAndWorkplace(tpuCustomerTravelJob);
  assert.strictEqual(tpuCustomerTravelResult.workplaceType, 'Hybrid', 'TPU customer travel/partial in-office must override Remote to Hybrid');
  assert.strictEqual(tpuCustomerTravelResult.location, 'Tacoma, WA', 'TPU role location must normalize to Tacoma, WA');
  assert.strictEqual(tpuCustomerTravelResult.hasTravelRequirement, true, 'Customer travel requirement must be flagged');
  assert.strictEqual(tpuCustomerTravelResult.isHybridNotice, true, 'Hybrid notice must be true');
  assert.strictEqual(tpuCustomerTravelResult.workplaceSummary.includes('Hybrid'), true, 'Summary must clearly state Hybrid');
  console.log('✓ Test 5: TPU City of Tacoma role with customer travel/partial in-office overrides raw Remote tag to Hybrid (Tacoma, WA)');

  // Test 6: Bank of America multi-location requisition with Seattle candidate preference (Approach A)
  const bofaJob = {
    title: 'Senior Systems Architect',
    companyName: 'Bank of America',
    location: 'Charlotte, NC; New York, NY; Dallas, TX; Chicago, IL; Seattle, WA',
    description: 'Bank of America Technology division is seeking a Senior Systems Architect across key US hubs.',
    requirements: 'Experience in large-scale financial platforms.'
  };
  const candidateSeattle = {
    targetLocations: [{ placeId: 'seattle-wa', description: 'Seattle, WA, USA' }]
  };
  const bofaResultSeattle = parseAndSanitizeLocationAndWorkplace(bofaJob, candidateSeattle);
  assert.strictEqual(bofaResultSeattle.isMultiLocation, true, 'Requisition with 5 sites must flag isMultiLocation');
  assert.strictEqual(bofaResultSeattle.allLocations.length, 5, 'Must parse all 5 distinct office locations');
  assert.strictEqual(bofaResultSeattle.matchedPreferredLocation, 'Seattle, WA', 'Must match candidate target location Seattle, WA');
  assert.strictEqual(bofaResultSeattle.location, 'Seattle, WA', 'Primary location chip must prioritize the candidate matched preference');
  assert.strictEqual(bofaResultSeattle.additionalLocationsCount, 4, 'Must indicate 4 additional locations');
  assert.strictEqual(bofaResultSeattle.allLocations.includes('Charlotte, NC'), true, 'Charlotte, NC must be preserved');
  assert.strictEqual(bofaResultSeattle.allLocations.includes('New York, NY'), true, 'New York, NY must be preserved');
  assert.strictEqual(bofaResultSeattle.allLocations.includes('Dallas, TX'), true, 'Dallas, TX must be preserved');
  assert.strictEqual(bofaResultSeattle.allLocations.includes('Chicago, IL'), true, 'Chicago, IL must be preserved');
  console.log('✓ Test 6: Bank of America multi-location job prioritizes candidate matched preference (Seattle, WA) while preserving all 5 sites');

  // Test 7: Bank of America multi-location requisition with Dallas candidate preference
  const candidateDallas = {
    preferredLocations: ['Dallas, TX']
  };
  const bofaResultDallas = parseAndSanitizeLocationAndWorkplace(bofaJob, candidateDallas);
  assert.strictEqual(bofaResultDallas.matchedPreferredLocation, 'Dallas, TX', 'Must match Dallas, TX preference');
  assert.strictEqual(bofaResultDallas.location, 'Dallas, TX', 'Primary location chip must prioritize Dallas, TX');
  assert.strictEqual(bofaResultDallas.additionalLocationsCount, 4, 'Must indicate 4 additional locations');
  console.log('✓ Test 7: Bank of America job prioritizes Dallas, TX when candidate targets Dallas');

  // Test 8: Bank of America multi-location requisition without candidate preference
  const bofaResultNoPref = parseAndSanitizeLocationAndWorkplace(bofaJob, null);
  assert.strictEqual(bofaResultNoPref.matchedPreferredLocation, undefined, 'Matched preference should be undefined');
  assert.strictEqual(bofaResultNoPref.location, 'Charlotte, NC', 'Primary location chip must be the first listed site when no candidate preference matches');
  assert.strictEqual(bofaResultNoPref.isMultiLocation, true, 'Must still indicate multi-location');
  assert.strictEqual(bofaResultNoPref.allLocations.length, 5, 'Must contain all 5 locations');
  console.log('✓ Test 8: Bank of America job defaults primary chip to first listed site (Charlotte, NC) when candidate has no preference');

  // Test 9: Comma-delimited and Pipe-delimited multi-location strings
  const pipeJob = {
    title: 'Principal Engineer',
    companyName: 'Capital One',
    location: 'McLean, VA | Richmond, VA | New York, NY | San Francisco, CA'
  };
  const pipeResult = parseAndSanitizeLocationAndWorkplace(pipeJob);
  assert.strictEqual(pipeResult.allLocations.length, 4, 'Pipe delimiter must extract 4 locations');
  assert.strictEqual(pipeResult.isMultiLocation, true, 'Pipe delimiter must trigger isMultiLocation');

  const commaJob = {
    title: 'Lead Consultant',
    companyName: 'Accenture',
    location: 'Multiple Locations: Atlanta, GA, Boston, MA, Chicago, IL'
  };
  const commaResult = parseAndSanitizeLocationAndWorkplace(commaJob);
  assert.strictEqual(commaResult.allLocations.length, 3, 'Comma delimiter with city/state pairs must extract 3 locations');
  assert.strictEqual(commaResult.isMultiLocation, true, 'Comma delimiter must trigger isMultiLocation');
  console.log('✓ Test 9: Pipe and Comma delimited multi-location strings parsed correctly');

  // Test 10: Explicit locations array support
  const arrayJob = {
    title: 'Staff SRE',
    companyName: 'Enterprise Cloud Corp',
    locations: ['Denver, CO', 'Austin, TX', 'Seattle, WA', 'Atlanta, GA']
  };
  const arrayResult = parseAndSanitizeLocationAndWorkplace(arrayJob, {
    location: 'Austin, TX'
  });
  assert.strictEqual(arrayResult.matchedPreferredLocation, 'Austin, TX', 'Must match Austin, TX from candidate profile location');
  assert.strictEqual(arrayResult.location, 'Austin, TX', 'Primary display must be Austin, TX');
  assert.strictEqual(arrayResult.allLocations.length, 4, 'Must preserve all 4 locations from array');
  console.log('✓ Test 10: Explicit job.locations array parsed and matched against candidate personalInfo.location');

  // Test 11: Non-municipal job with single location does not get clobbered by description mentioning Seattle
  const singleLocJob = {
    title: 'Regional Operations Manager',
    companyName: 'Wells Fargo',
    location: 'Charlotte, NC',
    description: 'Coordinate with West Coast executive partners based in Seattle.',
    requirements: 'Experience managing multi-state pipelines.'
  };
  const singleLocResult = parseAndSanitizeLocationAndWorkplace(singleLocJob);
  assert.strictEqual(singleLocResult.location, 'Charlotte, NC', 'Charlotte location must NOT be overridden by mention of Seattle in description');
  assert.strictEqual(singleLocResult.isMultiLocation, false, 'Single location job must have isMultiLocation false');
  console.log('✓ Test 11: Single location employer job not clobbered by incidental Seattle text mention');

  // Test 12: JPL Power of 10 safety bounds - maximum 25 locations ceiling
  const oversizedList = Array.from({ length: 40 }, (_, idx) => `Site ${idx + 1}, CA`);
  const boundedResult = extractDistinctLocations('', oversizedList);
  assert.strictEqual(boundedResult.length <= 25, true, 'extractDistinctLocations must strictly bound results to <= 25 items');
  console.log('✓ Test 12: NASA JPL Rule 2 upper bound ceiling enforced on oversized location lists');

  console.log('All locationAndWorkplaceSanitizer unit tests passed successfully!');
}

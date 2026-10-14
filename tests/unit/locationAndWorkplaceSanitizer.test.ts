import assert from 'assert';
import { parseAndSanitizeLocationAndWorkplace } from '../../src/utils/locationAndWorkplaceSanitizer';

export function runLocationAndWorkplaceSanitizerTests() {
  console.log('Starting locationAndWorkplaceSanitizer unit test suite...');

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

  console.log('All locationAndWorkplaceSanitizer unit tests passed successfully!');
}

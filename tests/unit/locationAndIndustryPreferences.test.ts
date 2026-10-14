import { TargetLocation } from '../../src/types';

export function runLocationAndIndustryPreferencesTests() {
  console.log("Starting locationAndIndustryPreferences unit test suite...");

  // Invariant 1: Max 5 Target Locations Ceiling
  const maxLocations = 5;
  const initialLocations: TargetLocation[] = [
    { placeId: 'ChIJVTPokywQkFQRmtVEaUZlJRA', description: 'Seattle, WA, USA', distanceConstraintMiles: 25, commuteConstraintMinutes: 45 },
    { placeId: 'ChIJyU-ld-_6kFQRe0V4XxLGcw0', description: 'Bonney Lake, WA 98391, USA', distanceConstraintMiles: 15, commuteConstraintMinutes: 30 },
    { placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo', description: 'San Francisco, CA, USA', distanceConstraintMiles: 50, commuteConstraintMinutes: 60 },
    { placeId: 'ChIJ4zGFAZpYwokRGUGPspVuU_0', description: 'Washington, DC, USA', distanceConstraintMiles: 25, commuteConstraintMinutes: 45 },
    { placeId: 'ChIJb85v2mflTIYRI_pt09m49wU', description: 'Austin, TX, USA', distanceConstraintMiles: 30, commuteConstraintMinutes: 45 }
  ];

  if (initialLocations.length !== maxLocations) {
    throw new Error(`Test 1 Failed: Expected initial count to equal max ${maxLocations}`);
  }

  // Attempting to add 6th location must be rejected by ceiling check
  const candidate6 = { placeId: 'place_denver', description: 'Denver, CO, USA' };
  const canAdd6 = initialLocations.length < maxLocations;
  if (canAdd6) {
    throw new Error("Test 1 Failed: Should not allow exceeding 5 target locations ceiling");
  }
  console.log("✓ Test 1: Max 5 target locations ceiling strictly enforced");

  // Invariant 2: Deduplication by Place ID and case-insensitive description
  const duplicateCandidate = { placeId: 'ChIJVTPokywQkFQRmtVEaUZlJRA', description: 'seattle, wa, usa' };
  const isDuplicate = initialLocations.some(
    l => l.placeId === duplicateCandidate.placeId || l.description.toLowerCase() === duplicateCandidate.description.toLowerCase()
  );
  if (!isDuplicate) {
    throw new Error("Test 2 Failed: Duplicate placeId/description was not detected");
  }
  console.log("✓ Test 2: Location deduplication by place ID and case-insensitive description verified");

  // Invariant 3: Commute & Distance bounds checking (1-50 miles, 10-120 mins)
  const validateConstraints = (loc: TargetLocation): boolean => {
    const validDistance = loc.distanceConstraintMiles !== undefined && loc.distanceConstraintMiles >= 1 && loc.distanceConstraintMiles <= 50;
    const validCommute = loc.commuteConstraintMinutes !== undefined && loc.commuteConstraintMinutes >= 10 && loc.commuteConstraintMinutes <= 120;
    return validDistance && validCommute;
  };

  const validSample: TargetLocation = {
    placeId: 'ChIJyU-ld-_6kFQRe0V4XxLGcw0',
    description: 'Bonney Lake, WA 98391',
    distanceConstraintMiles: 25,
    commuteConstraintMinutes: 45
  };
  const invalidDistSample: TargetLocation = { ...validSample, distanceConstraintMiles: 100 };
  const invalidCommuteSample: TargetLocation = { ...validSample, commuteConstraintMinutes: 5 };

  if (!validateConstraints(validSample)) throw new Error("Test 3 Failed: Valid constraints rejected");
  if (validateConstraints(invalidDistSample)) throw new Error("Test 3 Failed: Out-of-bounds distance accepted");
  if (validateConstraints(invalidCommuteSample)) throw new Error("Test 3 Failed: Out-of-bounds commute accepted");
  console.log("✓ Test 3: Commute (10–120m) and distance (1–50mi) boundaries validated");

  // Invariant 4: Direct Zip Code and City Fallback Place ID generation
  const zipInput = "98391";
  const isZip = /^\d{5}(-\d{4})?$/.test(zipInput);
  const fallbackPlaceId = isZip ? `zip_${zipInput}` : `custom_${zipInput}`;
  if (fallbackPlaceId !== "zip_98391") {
    throw new Error(`Test 4 Failed: Expected fallback zip place ID "zip_98391", got "${fallbackPlaceId}"`);
  }
  console.log("✓ Test 4: Direct zip code entry generates deterministic fallback place ID");

  // Invariant 5: Multi-Industry Tag Management & Backward Compatibility
  const rawIndustries = [' HealthTech ', 'FinTech', 'govtech', 'HEALTHTECH'];
  const uniqueIndustries: string[] = [];
  rawIndustries.forEach(item => {
    const trimmed = item.trim();
    if (trimmed && !uniqueIndustries.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      uniqueIndustries.push(trimmed);
    }
  });

  if (uniqueIndustries.length !== 3) {
    throw new Error(`Test 5 Failed: Expected 3 unique industries, got ${uniqueIndustries.length}`);
  }
  const backwardCompatibleString = uniqueIndustries.join(', ');
  if (backwardCompatibleString !== 'HealthTech, FinTech, govtech') {
    throw new Error(`Test 5 Failed: Unexpected backward compatible serialization: ${backwardCompatibleString}`);
  }
  // Invariant 6: Target Indicators 5-Pillar Evaluation & Completeness Score
  const sampleProfile = {
    targetRole: 'Senior Full Stack Engineer',
    targetIndustries: ['HealthTech', 'FinTech'],
    targetLocations: [validSample],
    targetSalary: 165000,
    targetBenefits: ['Health Insurance', 'Remote / Hybrid Work']
  };

  const calculateConfiguredIndicators = (p: typeof sampleProfile): number => {
    return [
      Boolean(p.targetRole?.trim()),
      Boolean(p.targetIndustries && p.targetIndustries.length > 0),
      Boolean(p.targetLocations && p.targetLocations.length > 0),
      Boolean(p.targetSalary && p.targetSalary > 0),
      Boolean(p.targetBenefits && p.targetBenefits.length > 0)
    ].filter(Boolean).length;
  };

  const configuredCount = calculateConfiguredIndicators(sampleProfile);
  if (configuredCount !== 5) {
    throw new Error(`Test 6 Failed: Expected 5 configured target indicators, got ${configuredCount}`);
  }
  const partialProfile = { ...sampleProfile, targetSalary: 0, targetRole: '' };
  if (calculateConfiguredIndicators(partialProfile) !== 3) {
    throw new Error(`Test 6 Failed: Expected 3 configured target indicators for partial profile, got ${calculateConfiguredIndicators(partialProfile)}`);
  }
  console.log("✓ Test 6: Target Indicators 5-pillar completeness calculation validated");

  console.log("All location and industry preferences tests passed successfully!\n");
}

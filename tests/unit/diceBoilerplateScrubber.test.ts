import { cleanDiceBoilerplate } from '../../src/utils/diceBoilerplateScrubber';

export function runDiceScrubberTests() {
  const sampleDiceFooter = `
    Software Engineer - DevOps & Cloud
    We are seeking a senior engineer for hybrid cloud infrastructure.
    
    Employer
    City of Tacoma
    Address
    Human Resources Department
    747 Market Street
    Tacoma, Washington, 98402 - 3764
    Phone
    253 - 591-5400
    Website
    http://www.tacoma.gov
    
    To unsubscribe from future emails or to update your email preferences click here
    We value your feedback.
    Did you find this email relevant to your job search?
    About Dice Private Email
    WHY DOES THE SENDER’S EMAIL ADDRESS LOOK SO STRANGE?
    Don’t worry! It’s a legitimate address and has been routed through our private email system to
    protect the privacy of our users.
    Get the Dice app
  `;

  const cleaned = cleanDiceBoilerplate(sampleDiceFooter);

  if (cleaned.employerName !== 'City of Tacoma') {
    throw new Error(`Dice Scrubber Test Failed: Expected employerName 'City of Tacoma', got '${cleaned.employerName}'`);
  }

  if (!cleaned.phoneNumbers.includes('253 - 591-5400')) {
    throw new Error(`Dice Scrubber Test Failed: Expected phone number extracted, got ${JSON.stringify(cleaned.phoneNumbers)}`);
  }

  if (cleaned.websiteUrl !== 'http://www.tacoma.gov') {
    throw new Error(`Dice Scrubber Test Failed: Expected website 'http://www.tacoma.gov', got '${cleaned.websiteUrl}'`);
  }

  if (cleaned.cleanedDescription.includes('WHY DOES THE SENDER')) {
    throw new Error(`Dice Scrubber Test Failed: Dice boilerplate disclaimer was not stripped out`);
  }

  console.log("✓ Dice Boilerplate Scrubber Test passed successfully!");
}

runDiceScrubberTests();

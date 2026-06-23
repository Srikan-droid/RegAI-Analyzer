import { VALIDATION_RULES, findRuleMetadata, getRandomRuleMetadata } from '../constants/validationRules';

const DETAIL_SNIPPETS = [
  'Timestamp extracted from PDF metadata',
  'Matched clause reference in section 3.2',
  'Detected board resolution ID BR-2024-17',
  'Located CRA confirmation letter attachment',
  'Found website screenshot within submission',
  'Detected debenture trustee acknowledgement note',
  'Parsed event summary paragraph on page 2',
  'Extracted net impact table from appendix',
  'Matched investor communication snippet',
  'Validated compliance officer sign-off section',
];

const pickDetail = (index) => DETAIL_SNIPPETS[index % DETAIL_SNIPPETS.length];

const buildRuleResult = (rule, index, shouldPass) => ({
  id: `${rule.id}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  ruleId: rule.id,
  name: rule.regulation,
  check: rule.check,
  status: shouldPass ? 'Pass' : 'Fail',
  detail: pickDetail(index),
});

// Generate rule results and calculate score based on pass/fail ratio
export const generateRuleResults = (targetScore = null) => {
  const ruleCount = Math.min(
    VALIDATION_RULES.length,
    Math.max(3, Math.floor(Math.random() * 3) + 3)
  );

  const shuffled = [...VALIDATION_RULES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, ruleCount);
  
  // If target score is provided, calculate how many should pass
  let passCount;
  if (targetScore != null) {
    // Calculate pass count based on target score (score = (passCount / totalCount) * 100)
    passCount = Math.round((targetScore / 100) * ruleCount);
    // Ensure at least 0 and at most ruleCount passes
    passCount = Math.max(0, Math.min(ruleCount, passCount));
  } else {
    // Random pass/fail distribution
    passCount = Math.floor(Math.random() * (ruleCount + 1));
  }
  
  // Create array of pass/fail flags
  const passFlags = Array(ruleCount).fill(false);
  for (let i = 0; i < passCount; i++) {
    passFlags[i] = true;
  }
  // Shuffle the pass flags to randomize which rules pass
  passFlags.sort(() => Math.random() - 0.5);
  
  const ruleResults = selected.map((rule, index) => buildRuleResult(rule, index, passFlags[index]));
  
  // Calculate actual score from rule results
  const actualPassCount = ruleResults.filter(r => r.status === 'Pass').length;
  const calculatedScore = Math.round((actualPassCount / ruleCount) * 100);
  
  return { ruleResults, calculatedScore };
};

const enrichRuleResult = (rule) => {
  if (!rule) return rule;
  const metadata =
    findRuleMetadata(rule.ruleId || rule.name || rule.check) || getRandomRuleMetadata();
  return {
    ...rule,
    ruleId: rule.ruleId || metadata?.id || `CR_${Math.floor(Math.random() * 90 + 10)}`,
    name: rule.name || metadata?.regulation || 'Regulation reference unavailable',
    check: rule.check || metadata?.check || 'Validation criteria unavailable',
  };
};

export const normalizeRuleResults = (ruleResults = []) => ruleResults.map(enrichRuleResult);


export const VALIDATION_RULES = [
  {
    id: 'CR_01',
    regulation: 'Regulation 30 read with Schedule III Part A Para A Clause 3',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_02',
    regulation: 'Regulation 46(2)(r)',
    check: 'announcement_date - website_date <= 24H',
  },
  {
    id: 'CR_03',
    regulation: 'Regulation 55 (Chapter V)',
    check: 'announcement_date present in last 12 months',
  },
  {
    id: 'CR_04',
    regulation: 'Regulation 62(1)(i) (Chapter V)',
    check: 'announcement_date - website_date <= 24H',
  },
  {
    id: 'CR_05',
    regulation: 'Regulation 84(1) (Chapter VIII)',
    check: 'announcement_date present in last 12 months',
  },
  {
    id: 'CR_06',
    regulation: 'Schedule III Part D Para A(7) (Chapter VIII)',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_07',
    regulation: 'Schedule III Part E A(5) (Chapter VIII A)',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_08',
    regulation: 'Schedule III Part E A(7) (Chapter VIII A)',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_09',
    regulation: 'Regulation 90(2)(b) (Chapter IX)',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_10',
    regulation: 'Schedule III Part B Para A(13) (Chapter V)',
    check: 'announcement_date - rating_date <= 24H',
  },
  {
    id: 'CR_11',
    regulation: 'Schedule V Part C Clause 9(q)',
    check:
      'Is annual_report = yes\nWithin annual_report, is Corp_gov_rep = yes\nWithin Corp_gov_rep, is Credit_rating = Yes',
  },
];

export const findRuleMetadata = (identifier) => {
  if (!identifier) return null;
  return VALIDATION_RULES.find(
    (rule) =>
      rule.id === identifier ||
      rule.regulation === identifier ||
      rule.check === identifier ||
      `${rule.regulation}: ${rule.check}` === identifier
  );
};

export const getRandomRuleMetadata = () => {
  if (!VALIDATION_RULES.length) return null;
  const index = Math.floor(Math.random() * VALIDATION_RULES.length);
  return VALIDATION_RULES[index];
};


export function normalizeCompanyName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function isSuppressedCompany(companyName: string, suppressedCompanies: string[] = []) {
  const normalizedName = normalizeCompanyName(companyName);
  return suppressedCompanies.some((company) => normalizeCompanyName(company) === normalizedName);
}
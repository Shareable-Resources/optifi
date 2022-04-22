export const formatToUSD = (amount: number) => {
  const dollarUSLocale = Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'USD',
  });
  return dollarUSLocale.format(amount);
};
export const formatNumber = (num: number) => {
  const dollarUSLocale = Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 20,
  });
  return dollarUSLocale.format(num);
};

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

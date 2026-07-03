import { BoxItem } from '../types';

export function pickWeightedItem(items: BoxItem[]): BoxItem {
  if (!items || items.length === 0) {
    throw new Error('Cannot pick item from empty array');
  }

  // Calculate sum of probabilities (should be around 1.0 but can vary)
  const totalWeight = items.reduce((sum, item) => sum + Number(item.probability), 0);
  
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    if (random < Number(item.probability)) {
      return item;
    }
    random -= Number(item.probability);
  }
  
  // Fallback to the last item just in case
  return items[items.length - 1];
}

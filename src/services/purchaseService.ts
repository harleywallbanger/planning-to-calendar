import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// Remplacer par votre clé publique iOS depuis le dashboard RevenueCat
const REVENUECAT_API_KEY_IOS = 'appl_palzBX0fdxLdkPlRXljQxpVQver';

export const ENTITLEMENT_ID = 'Planning to Calendar Pro';

export async function initializePurchases(): Promise<void> {
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
  }
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return _isEntitled(customerInfo);
  } catch {
    return false;
  }
}

export async function getCurrentOffering() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return _isEntitled(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return _isEntitled(customerInfo);
}

function _isEntitled(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

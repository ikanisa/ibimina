/**
 * English (Rwanda) Content Pack
 */

import type { CountryContentPack, TranslationMessages } from '../types/index.js';

export const enRWContentPack: CountryContentPack = {
  locale: 'en-RW',
  countryISO3: 'RWA',
  countryName: 'Rwanda',
  
  ussd: {
    providers: [
      {
        name: 'MTN Mobile Money',
        code: '*182*8*1#',
        instructions: [
          'Dial *182*8*1#',
          'Select institution type',
          'Enter merchant code',
          'Enter reference number: RWA.NYA.GAS.TWIZ.001',
          'Enter amount',
          'Confirm with PIN',
        ],
      },
      {
        name: 'Airtel Money',
        code: '*500#',
        instructions: [
          'Dial *500#',
          'Select "Pay Bills"',
          'Enter merchant code',
          'Enter reference number',
          'Enter amount',
          'Confirm with PIN',
        ],
      },
    ],
    generalInstructions: [
      'Use the exact reference number from your card',
      'Double-check the amount before confirming',
      'Keep the confirmation SMS as proof',
    ],
  },
  
  legal: {
    termsUrl: '/legal/terms?lang=en',
    privacyUrl: '/legal/privacy?lang=en',
  },
  
  help: {
    paymentGuide: [
      'Ensure you have sufficient balance on your mobile money account',
      'Use the reference number exactly as written on your card',
      'Contact your SACCO if you encounter any issues',
    ],
    troubleshooting: [
      'If USSD fails: Try from a different phone',
      'If payment is rejected: Double-check the reference number',
      'If you don\'t receive SMS: Dial *182# to check transaction history',
    ],
    contactInfo: {
      helpline: '+250 788 000 000',
      email: 'support@sacco-plus.rw',
      hours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
  },
  
  tips: {
    dualSim: [
      'If you have dual SIM, use the MTN or Airtel SIM',
      'Ensure the SIM with mobile money has sufficient balance',
    ],
    networkIssues: [
      'Try from a location with better network coverage',
      'Wait a few minutes and retry',
    ],
    marketDays: [
      'Market day is Thursday - Pay before market',
      'Tip: Pay early to avoid queues',
    ],
  },
};

export const enRWMessages: TranslationMessages = {
  common: {
    welcome: 'Welcome',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  payment: {
    title: 'Payment',
    amount: 'Amount',
    reference: 'Reference Number',
    confirmPayment: 'Confirm Payment',
    paymentSuccess: 'Payment successful',
    paymentFailed: 'Payment failed',
  },
  
  member: {
    title: 'Member',
    name: 'Name',
    phone: 'Phone',
    memberCode: 'Member Code',
    joinDate: 'Join Date',
  },
  
  group: {
    title: 'Group',
    groupName: 'Group Name',
    groupCode: 'Group Code',
    members: 'Members',
    totalSavings: 'Total Savings',
  },
};

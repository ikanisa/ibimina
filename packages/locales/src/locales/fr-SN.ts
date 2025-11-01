/**
 * French (Senegal) Content Pack
 */

import type { CountryContentPack, TranslationMessages } from '../types/index.js';

export const frSNContentPack: CountryContentPack = {
  locale: 'fr-SN',
  countryISO3: 'SEN',
  countryName: 'Sénégal',
  
  ussd: {
    providers: [
      {
        name: 'Orange Money',
        code: '#144#',
        instructions: [
          'Composez #144#',
          'Sélectionnez "Payer un marchand"',
          'Entrez le code marchand',
          'Entrez le numéro de référence: SEN.DAK.XXX.YYYY.001',
          'Entrez le montant',
          'Confirmez avec votre code PIN',
        ],
      },
    ],
    generalInstructions: [
      'Utilisez le numéro de référence exact indiqué sur votre carte',
      'Vérifiez le montant avant de confirmer',
      'Conservez le SMS de confirmation comme preuve',
    ],
  },
  
  legal: {
    termsUrl: '/legal/terms?lang=fr',
    privacyUrl: '/legal/privacy?lang=fr',
  },
  
  help: {
    paymentGuide: [
      'Assurez-vous d\'avoir un solde suffisant sur votre compte mobile money',
      'Utilisez le numéro de référence exactement comme écrit sur votre carte',
      'Contactez votre institution en cas de problème',
    ],
    troubleshooting: [
      'Si l\'USSD échoue: Essayez depuis un autre téléphone',
      'Si le paiement est rejeté: Vérifiez le numéro de référence',
      'Si vous ne recevez pas de SMS: Vérifiez l\'historique des transactions',
    ],
    contactInfo: {
      helpline: '+221 XX XXX XXXX',
      email: 'support@sacco-plus.sn',
      hours: 'Lundi - Vendredi, 8h00 - 17h00',
    },
  },
};

export const frSNMessages: TranslationMessages = {
  common: {
    welcome: 'Bienvenue',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  
  payment: {
    title: 'Paiement',
    amount: 'Montant',
    reference: 'Numéro de référence',
    confirmPayment: 'Confirmer le paiement',
    paymentSuccess: 'Paiement réussi',
    paymentFailed: 'Paiement échoué',
  },
  
  member: {
    title: 'Membre',
    name: 'Nom',
    phone: 'Téléphone',
    memberCode: 'Code membre',
    joinDate: 'Date d\'adhésion',
  },
  
  group: {
    title: 'Groupe',
    groupName: 'Nom du groupe',
    groupCode: 'Code du groupe',
    members: 'Membres',
    totalSavings: 'Épargne totale',
  },
};

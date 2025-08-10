
'use server'

import { suggestCheckoutImprovements, SuggestCheckoutImprovementsInput } from '@/ai/flows/suggest-checkout-improvements'

export interface AIState {
  suggestions: string | null
  error: string | null
  loading: boolean
}

export async function getSuggestions(
  prevState: AIState,
  formData: FormData
): Promise<AIState> {
  const paymentTypes = formData.getAll('paymentTypes') as string[];
  const cartSize = Number(formData.get('cartSize'));
  const currentCheckoutFunnel = formData.get('currentCheckoutFunnel') as string;

  if (!paymentTypes.length || !cartSize || !currentCheckoutFunnel) {
    return {
      suggestions: null,
      error: 'Por favor, preencha todos os campos.',
      loading: false,
    };
  }

  try {
    const input: SuggestCheckoutImprovementsInput = {
      paymentTypes,
      cartSize,
      currentCheckoutFunnel,
    };
    const result = await suggestCheckoutImprovements(input);
    return {
      suggestions: result.suggestedImprovements,
      error: null,
      loading: false,
    };
  } catch (error) {
    console.error(error);
    return {
      suggestions: null,
      error: 'Ocorreu um erro ao gerar sugestões. Tente novamente.',
      loading: false,
    };
  }
}

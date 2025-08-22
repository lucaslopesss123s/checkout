
'use server'

// Temporariamente comentado para resolver problemas de build
// import { suggestCheckoutImprovements, SuggestCheckoutImprovementsInput } from '@/ai/flows/suggest-checkout-improvements'

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
    // Temporariamente desabilitado - funcionalidade de IA será reativada após correção do build
    return {
      suggestions: 'Funcionalidade de sugestões de IA temporariamente indisponível. Será reativada em breve.',
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

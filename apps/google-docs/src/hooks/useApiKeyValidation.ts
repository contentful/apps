import { useState, useRef, useEffect } from 'react';
import { validateOpenAiApiKey, OPENAI_API_KEY_PREFIX } from '../utils/openaiValidation';

interface UseApiKeyValidationReturn {
  isValid: boolean;
  isValidating: boolean;
  validationError: string;
  apiUnavailable: boolean;
  validateApiKey: (value: string, skipApiValidation?: boolean) => Promise<boolean>;
  handleInputChange: (value: string) => void;
  handleFocus: (value: string) => void;
  handleBlur: (value: string) => void;
}

const API_VALIDATION_DEBOUNCE = 500;

/**
 * Hook to manage API key validation with debouncing.
 * Falls back to format-only validation if API is unavailable.
 */
export const useApiKeyValidation = (obfuscatedDisplay: string): UseApiKeyValidationReturn => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [apiUnavailable, setApiUnavailable] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidatedValueRef = useRef<string>('');
  const valueOnFocusRef = useRef<string>('');

  const updateValidationState = (state: {
    isValid: boolean;
    error?: string;
    apiUnavailable?: boolean;
    isValidating?: boolean;
  }) => {
    setIsValid(state.isValid);
    setValidationError(state.error || '');
    setApiUnavailable(state.apiUnavailable || false);
    if (state.isValidating !== undefined) {
      setIsValidating(state.isValidating);
    }
  };

  const validateApiKey = async (value: string, skipApiValidation = false): Promise<boolean> => {
    const token = value.trim();

    if (token === obfuscatedDisplay && token.length > 0) {
      updateValidationState({ isValid: true });
      return true;
    }

    if (skipApiValidation) {
      updateValidationState({ isValid: true });
      return true;
    }

    updateValidationState({ isValid: true, isValidating: true });

    try {
      const result = await validateOpenAiApiKey(token);

      if (result.isValid) {
        updateValidationState({
          isValid: true,
          error: result.apiUnavailable ? result.error : undefined,
          apiUnavailable: result.apiUnavailable || false,
          isValidating: false,
        });
        return true;
      } else {
        updateValidationState({
          isValid: false,
          error: result.error,
          apiUnavailable: false,
          isValidating: false,
        });
        return false;
      }
    } catch (error) {
      updateValidationState({
        isValid: true,
        error: 'Unable to verify API key with OpenAI. Format validation passed.',
        apiUnavailable: true,
        isValidating: false,
      });
      return true;
    }
  };

  const handleInputChange = (newValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = newValue.trim();

    if (trimmed === obfuscatedDisplay && obfuscatedDisplay.length > 0) {
      return;
    }

    if (trimmed.length === 0 || !trimmed.startsWith(OPENAI_API_KEY_PREFIX) || trimmed.length < 10) {
      setIsValid(false);
      if (trimmed.length === 0) {
        setValidationError('API key is required');
      } else if (!trimmed.startsWith(OPENAI_API_KEY_PREFIX)) {
        setValidationError(
          `Invalid API key format. Keys must start with "${OPENAI_API_KEY_PREFIX}"`
        );
      } else {
        setValidationError('API key is too short');
      }
      setApiUnavailable(false);
    } else {
      setIsValid(true);
      setValidationError('');
      setApiUnavailable(false);

      debounceTimerRef.current = setTimeout(() => {
        lastValidatedValueRef.current = trimmed;
        void validateApiKey(trimmed, false);
      }, API_VALIDATION_DEBOUNCE);
    }
  };

  const handleFocus = (value: string) => {
    valueOnFocusRef.current = value.trim();
  };

  const handleBlur = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmed = value.trim();

    if (trimmed === obfuscatedDisplay && obfuscatedDisplay.length > 0) {
      return;
    }

    if (trimmed.length === 0 || !trimmed.startsWith(OPENAI_API_KEY_PREFIX) || trimmed.length < 10) {
      return;
    }

    if (trimmed === valueOnFocusRef.current) {
      return;
    }

    if (trimmed === lastValidatedValueRef.current && isValid && !isValidating) {
      return;
    }

    lastValidatedValueRef.current = trimmed;
    void validateApiKey(value, false);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isValid,
    isValidating,
    validationError,
    apiUnavailable,
    validateApiKey,
    handleInputChange,
    handleFocus,
    handleBlur,
  };
};

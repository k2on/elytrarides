import { Reducer, Dispatch, useReducer, useMemo, forwardRef } from 'react';
import { Keyboard, Text } from 'react-native';
import {
  AsYouType,
  CountryCode,
  parsePhoneNumber,
  PhoneNumber,
  isValidPhoneNumber,
} from 'libphonenumber-js/max';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { en } from '@/shared';
import { Colors } from '../colors';

interface PhoneNumberInputProps {
  manager: InputManager;
  onEndEditing?: Function;
}

export const PhoneNumberInput = ({
  manager,
  onEndEditing,
}: PhoneNumberInputProps) => {
  const { state, dispatch } = manager;

  return (
    <View className="flex-row border-2 border-purple-800 rounded-full items-center mx-auto px-4 py-2 space-x-2">
          <View className='border-2 border-gray-600 rounded-xl px-1'>
              <Text className='font-bold text-gray-600 text-lg'>🇺🇸 +1</Text>
          </View>
      <TextInput
        className='text-white font-bold text-2xl mb-2'
        style={{ width: 200 }}
        placeholder={en.AUTH_PHONE_ENTER_PLACEHOLDER}
        autoComplete={'tel'}
        onFocus={() => dispatch({ type: 'setHidden', payload: true })}
        cursorColor={Colors.PRIMARY}
        onChange={(e) =>
          dispatch({
            type: 'processInput',
            payload: e.nativeEvent.text,
          })
        }
        value={state.formattedText}
        keyboardType={'phone-pad'}
        keyboardAppearance={state.darkMode ? 'dark' : 'light'}
        onEndEditing={() => onEndEditing && onEndEditing()}
      />
    </View>
  );
};

interface PhoneNumberInputOptions {
  // specify a default country using its ISO-3601 code (e.g., "GB")
  defaultCountry?: string;
  darkMode?: boolean;
  // optional! we provide a default set of countries
  localize?: (countryCode: string) => string;
}

interface InputState {
  countryTel: string;
  countryCode: string;
  // not carried as part of state unless custom countries set
  darkMode: boolean;
  number: string;
  pickerHidden: boolean;
  inputText: string;
  formattedText: string;
}

interface InputAction {
  type: 'setHidden' | 'updateCountry' | 'processInput';
  payload: any;
}

export interface InputManager {
  dispatch: Dispatch<InputAction>;
  state: InputState;
  getNumber: () => string;
  getCountry: () => string;
  getCallingCode: () => string;
  getNumberInfo: () => PhoneNumber | undefined;
  isValid: () => boolean;
}

/* The `usePhoneNumberInput` reducer is required for easy communication
 * between the different required & optional components of PhoneNumberInput.
 * */
const usePhoneNumberInput = (
  _options?: PhoneNumberInputOptions
): InputManager => {
  const options = _options || {};

  const [managerState, managerDispatch] = useReducer<
    Reducer<InputState, InputAction>
  >(
    (state, action) => {
      const { type, payload } = action;

      switch (type) {
        case 'setHidden':
          if (payload === false) {
            Keyboard.dismiss();
          }
          return {
            ...state,
            pickerHidden: payload,
          };
        case 'updateCountry':
          const updateTextHandler = new AsYouType(payload.code as CountryCode);
          const updatedText = updateTextHandler.input(state.inputText);

          return {
            ...state,
            countryTel: payload.tel,
            countryCode: payload.code,
            formattedText: updatedText,
            number: updateTextHandler.getNumberValue() as string,
          };
        case 'processInput':
          const inputTextHandler = new AsYouType(
            state.countryCode as CountryCode
          );
          let input = payload;
          if (state.formattedText.length == 5 && payload.length == 4) input = (state.formattedText as string).substring(0, 3);

          const formattedText = inputTextHandler.input(input);

          // handles auto-complete input
          if (inputTextHandler.isInternational()) {
            const countryCode = inputTextHandler.getCountry() as string;
            const countryTel = inputTextHandler.getCallingCode();
            return {
              ...state,
              countryTel,
              countryCode,
              formattedText:
                inputTextHandler.getNumber()?.formatNational() || '',
              number: inputTextHandler.getNumberValue() as string,
            };
          }

          return {
            ...state,
            inputText: input,
            formattedText: formattedText,
            number: inputTextHandler.getNumberValue() as string,
          };
        default:
          throw new Error(
            `PhoneNumberInput: Invalid action "${type}" with payload "${payload}"`
          );
      }
    },
    {
      number: '',
      countryTel: '+1',
      countryCode: options.defaultCountry || 'US',
      pickerHidden: true,
      darkMode: options.darkMode || false,
      inputText: '',
      formattedText: '',
    }
  );

  return {
    getNumber: () => managerState.number,
    getCountry: () => managerState.countryCode,
    getCallingCode: () => managerState.countryTel,
    getNumberInfo: () =>
      parsePhoneNumber(
        managerState.inputText,
        managerState.countryCode as CountryCode
      ),
    isValid: () =>
      isValidPhoneNumber(
        managerState.inputText,
        managerState.countryCode as CountryCode
      ),
    state: managerState,
    dispatch: managerDispatch,
  };
};

export default usePhoneNumberInput;


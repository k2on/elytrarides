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
import { processColorInitially } from 'react-native-reanimated';

interface CodeInputProps {
  manager: CodeInputManager;
  isLoading: boolean;
  onEndEditing?: Function;
}

export const CodeInput = ({
  manager,
  onEndEditing,
  isLoading,
}: CodeInputProps) => {
  const { state, dispatch } = manager;

  return (
    <View className={`flex-row border-2 rounded-full items-center mx-auto px-4 py-2 ${isLoading ? 'border-gray-800' : 'border-purple-800'}`}>
      <TextInput
        editable={!isLoading}
        className={`font-bold text-2xl mb-2 ${isLoading ? 'text-gray-400' : 'text-white'}`}
        style={{ width: 110 }}
        autoFocus
        placeholder={en.AUTH_CODE_ENTER_PLACEHOLDER}
        autoComplete={'sms-otp'}
        cursorColor={Colors.PRIMARY}
        onChange={(e) =>
          dispatch({
            type: 'processInput',
            payload: e.nativeEvent.text,
          })
        }
        value={state.formattedText}
        keyboardType={'numeric'}
        keyboardAppearance={'dark'}
        onEndEditing={() => onEndEditing && onEndEditing()}
      />
    </View>
  );
};

interface InputState {
  code: string;
  inputText: string;
  formattedText: string;
}

interface InputAction {
  type: 'processInput';
  payload: any;
}

export interface CodeInputManager {
  dispatch: Dispatch<InputAction>;
  state: InputState;
  getCode: () => string;
  isValid: () => boolean;
}

/* The `usePhoneNumberInput` reducer is required for easy communication
 * between the different required & optional components of PhoneNumberInput.
 * */
const useCodeInput = (): CodeInputManager => {
  const [managerState, managerDispatch] = useReducer<
    Reducer<InputState, InputAction>
  >(
    (state, action) => {
      const { type, payload } = action;

      switch (type) {
        case 'processInput':
          // Backspace on -
          if (payload == state.formattedText.replace("-", "")) {
              let input = (payload as string).substring(0, 2);

              return {
                ...state,
                inputText: input,
                formattedText: input,
                code: input,
              };
          }
          let input = (payload as string).replace("-", "");

          let formatted = input.length > 2 ? input.substring(0, 3) + "-" + input.substring(3, input.length) : input;

          return {
            ...state,
            inputText: input,
            formattedText: formatted,
            code: input,
          };
        default:
          throw new Error(
            `CodeInput: Invalid action "${type}" with payload "${payload}"`
          );
      }
    },
    {
      code: '',
      inputText: '',
      formattedText: '',
    }
  );

  return {
    getCode: () => managerState.code,
    isValid: () => managerState.code.length == 6,
    state: managerState,
    dispatch: managerDispatch,
  };
};

export default useCodeInput;


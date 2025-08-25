import React, { useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';

interface InputPinProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  error?: string;
  secure?: boolean;
  required?: boolean;
}

export const InputPin: React.FC<InputPinProps> = ({
  value,
  onChange,
  length = 6,
  label,
  error,
  secure = true,
  required = false,
}) => {
  const colorScheme = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const showRequiredError = required && !value?.trim() && !error;
  const themeStyles = colorScheme === 'dark' ? darkStyles : styles;

  // Only allow digits, max length
  const handleChange = (text: string) => {
    let filtered = text.replace(/\D/g, '').slice(0, length);
    onChange(filtered);
  };

  // Focus the hidden input when any box is pressed
  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={themeStyles.container}>
      {label && (
        <Text style={themeStyles.label}>
          {label}
          {required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleBoxPress}
        style={themeStyles.inputRow}
      >
        {/* Hidden input for capturing all typing/backspace */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
          maxLength={length}
          secureTextEntry={false}
          textContentType="oneTimeCode"
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          autoFocus={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          importantForAccessibility="yes"
        />
        {Array.from({ length }).map((_, idx) => (
          <View
            key={idx}
            style={[
              themeStyles.input,
              (error || showRequiredError) && themeStyles.inputError,
              isFocused && idx === value.length && themeStyles.inputFocused,
            ]}
          >
            <Text
              style={{
                color: colorScheme === 'dark' ? '#fff' : '#222',
                fontSize: 24,
                textAlign: 'center',
              }}
            >
              {value[idx] ? (secure ? '•' : value[idx]) : ''}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
      {(error || showRequiredError) && (
        <Text style={themeStyles.error}>{error || 'PIN is required'}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    backgroundColor: '#fff',
    color: '#222',
    marginHorizontal: 4,
  },
  inputError: {
    borderColor: 'red',
  },
  inputFocused: {
    borderColor: '#0044FF',
    shadowColor: '#0044FF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 14,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    backgroundColor: '#222',
    color: '#fff',
    marginHorizontal: 4,
  },
  inputError: {
    borderColor: 'red',
  },
  inputFocused: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 14,
  },
});

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

interface InputPinProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  error?: string;
  secure?: boolean;
}

export const InputPin: React.FC<InputPinProps> = ({
  value,
  onChange,
  length = 6,
  label,
  error,
  secure = true,
}) => {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, idx: number) => {
    // Only allow digits or empty
    if (/^\d*$/.test(text)) {
      let newValue = value.split('');
      if (text === '') {
        // If deleting, clear this box and move focus back
        newValue[idx] = '';
        onChange(newValue.join(''));
        if (idx > 0) {
          inputs.current[idx - 1]?.focus();
        }
      } else {
        newValue[idx] = text[text.length - 1] || '';
        const joined = newValue.join('').slice(0, length);
        onChange(joined);
        if (idx < length - 1) {
          inputs.current[idx + 1]?.focus();
        }
      }
    }
  };

  // onKeyPress is unreliable on Android with number-pad, so we handle backspace in handleChange

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {Array.from({ length }).map((_, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => {
              inputs.current[idx] = ref;
            }}
            style={[styles.input, error && styles.inputError]}
            value={value[idx] || ''}
            onChangeText={(text) => handleChange(text, idx)}
            keyboardType="default"
            maxLength={1}
            secureTextEntry={secure}
            textContentType="oneTimeCode"
            autoFocus={idx === 0}
            returnKeyType="next"
          />
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
    marginHorizontal: 4,
  },
  inputError: {
    borderColor: 'red',
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 14,
  },
});

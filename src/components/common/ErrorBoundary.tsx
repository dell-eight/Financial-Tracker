import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children:  React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

/**
 * Catches unhandled JS errors in the component tree and renders a recoverable
 * fallback instead of crashing the entire app to a white screen.
 *
 * Place at the navigator level so all tab stacks are covered by one boundary.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward to the crash service when available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logError } = require('../../services/crash.service');
      logError(error, { componentStack: info.componentStack });
    } catch {
      // crash service unavailable — silently ignore so the boundary still works
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={s.container}>
          <Text style={s.emoji}>⚠️</Text>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.body}>
            An unexpected error occurred. Your data is safe.
          </Text>
          <Pressable
            onPress={this.reset}
            style={({ pressed }) => [s.btn, { opacity: pressed ? 0.75 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Reload this screen"
          >
            <Text style={s.btnText}>Reload</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         32,
    backgroundColor: '#F9FAFB',
  },
  emoji: {
    fontSize:     48,
    marginBottom: 16,
  },
  title: {
    fontSize:     20,
    fontWeight:   '700',
    color:        '#111827',
    textAlign:    'center',
    marginBottom: 8,
  },
  body: {
    fontSize:     15,
    color:        '#6B7280',
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: 24,
  },
  btn: {
    backgroundColor:  '#7C3AED',
    paddingVertical:  12,
    paddingHorizontal: 32,
    borderRadius:     12,
  },
  btnText: {
    fontSize:   15,
    fontWeight: '600',
    color:      '#FFFFFF',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MotiView } from 'moti';
import { X, QrCode, AlertCircle, CheckCircle } from 'lucide-react-native';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isVisible: boolean;
  isPendingRequest?: boolean;
}

const { width } = Dimensions.get('window');

export default function QRCodeScanner({ onScan, onClose, isVisible, isPendingRequest = false }: QRCodeScannerProps) {
  const { colors } = useTheme();
  const { showError } = useToast();
  const styles = getStyles(colors);
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBarcodeScanned = (scanningResult: { type: string; data: string }) => {
    if (scanned || isPendingRequest) return;
    
    const { type, data } = scanningResult;
    setScanned(true);
    setIsLoading(true);
    
    // Validate that the scanned data looks like a valid code
    if (data && data.trim().length > 0) {
      // Add a small delay to show the success state
      setTimeout(() => {
        setIsLoading(false);
        onScan(data.trim());
      }, 1000);
    } else {
      setIsLoading(false);
      showError('Invalid QR Code', 'The scanned QR code does not contain valid data. Please try again.');
      setScanned(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Don't render anything if not visible
  if (!isVisible) return null;

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera permissions...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <AlertCircle color={colors.error} size={48} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to scan QR codes. Please grant camera permissions to continue.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelPermissionButton} onPress={handleClose}>
            <Text style={styles.cancelPermissionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned || isPendingRequest ? undefined : handleBarcodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color={colors.white} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Text style={styles.flipButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Scanning Area */}
          <View style={styles.scanningArea}>
            <View style={styles.scanningFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scanningText}>
              {isPendingRequest 
                ? 'Request in progress...' 
                : 'Position the QR code within the frame'
              }
            </Text>

            {/* Disabled Overlay */}
            {isPendingRequest && (
              <View style={styles.disabledOverlay}>
                <Text style={styles.disabledText}>Scanning Disabled</Text>
              </View>
            )}
          </View>

          {/* Success State */}
          {scanned && (
            <MotiView
              style={styles.successOverlay}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.successContent}>
                <CheckCircle color={colors.success} size={48} />
                <Text style={styles.successTitle}>Code Scanned!</Text>
                <Text style={styles.successText}>
                  {isLoading ? 'Processing...' : 'Code detected successfully'}
                </Text>
              </View>
            </MotiView>
          )}

          {/* Pending Request Indicator */}
          {isPendingRequest && (
            <MotiView
              style={styles.pendingOverlay}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.pendingContent}>
                <View style={[styles.pendingIcon, { backgroundColor: colors.primary + '20' }]}>
                  <LoadingSpinner size="small" color={colors.primary} />
                </View>
                <Text style={styles.pendingTitle}>Request in Progress</Text>
                <Text style={styles.pendingText}>
                  Please wait while we fetch user data...
                </Text>
              </View>
            </MotiView>
          )}

          {/* Bottom Instructions */}
          <View style={styles.bottomInstructions}>
            <QrCode color={colors.white} size={20} />
            <Text style={styles.instructionsText}>
              {isPendingRequest 
                ? 'Processing request...' 
                : 'Point your camera at a QR code to scan'
              }
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.white,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  flipButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.white,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  scanningFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Medium',
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
    paddingHorizontal: Spacing.lg,
  },
  instructionsText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.white,
    marginLeft: Spacing.sm,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  permissionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.white,
  },
  cancelPermissionButton: {
    backgroundColor: colors.error,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cancelPermissionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.white,
  },
  pendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pendingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pendingTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  pendingText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  disabledText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.white,
    textAlign: 'center',
  },
});

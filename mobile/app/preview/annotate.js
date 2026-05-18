import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, PanResponder,
  ScrollView, Alert, TextInput, Dimensions
} from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fileService } from '../../services/api.service';
import { Pen, Highlighter, Type, Trash2, Send } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnnotationScreen() {
  const { id } = useLocalSearchParams();
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [tool, setTool] = useState('pen'); // 'pen', 'highlighter', 'text'
  const [textComment, setTextComment] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const getColor = () => {
    if (tool === 'highlighter') return 'rgba(250,204,21,0.5)';
    return '#3b82f6';
  };

  const getStrokeWidth = () => tool === 'highlighter' ? 12 : 3;

  const handleTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (tool === 'text') {
      setTextPosition({ x: locationX, y: locationY });
      return;
    }
    const newPath = Skia.Path.Make();
    newPath.moveTo(locationX, locationY);
    setCurrentPath({ path: newPath, color: getColor(), strokeWidth: getStrokeWidth() });
  };

  const handleMove = (evt) => {
    if (!currentPath || tool === 'text') return;
    const { locationX, locationY } = evt.nativeEvent;
    currentPath.path.lineTo(locationX, locationY);
    setCurrentPath({ ...currentPath });
  };

  const handleRelease = () => {
    if (currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
  };

  const handleSubmitAnnotation = async () => {
    if (!textComment) return Alert.alert('Error', 'Please add a text comment');
    setSubmitting(true);
    try {
      await fileService.annotate(id, {
        content: textComment,
        position: textPosition || { x: 0, y: 0 },
      });
      Alert.alert('Success', 'Annotation saved!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert('Error', 'Could not save annotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Drawing Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, tool === 'pen' && styles.toolBtnActive]}
          onPress={() => setTool('pen')}
        >
          <Pen size={20} color={tool === 'pen' ? '#fff' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, tool === 'highlighter' && styles.toolBtnActive]}
          onPress={() => setTool('highlighter')}
        >
          <Highlighter size={20} color={tool === 'highlighter' ? '#fff' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, tool === 'text' && styles.toolBtnActive]}
          onPress={() => setTool('text')}
        >
          <Type size={20} color={tool === 'text' ? '#fff' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setPaths([])}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Canvas Area */}
      <View
        style={styles.canvas}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
      >
        <Canvas style={{ flex: 1 }}>
          {paths.map((p, i) => (
            <Path
              key={i}
              path={p.path}
              color={p.color}
              style="stroke"
              strokeWidth={p.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={currentPath.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
        </Canvas>
      </View>

      {/* Text Comment Input */}
      <View style={styles.bottom}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a text comment..."
          placeholderTextColor="#475569"
          value={textComment}
          onChangeText={setTextComment}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSubmitAnnotation} disabled={submitting}>
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  toolbar: {
    flexDirection: 'row', padding: 12, gap: 12,
    backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  toolBtn: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#0f172a',
  },
  toolBtnActive: { backgroundColor: '#3b82f6' },
  canvas: { flex: 1, backgroundColor: '#1a2740' },
  bottom: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    gap: 12, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155',
  },
  commentInput: {
    flex: 1, backgroundColor: '#0f172a', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: '#334155',
  },
  sendBtn: {
    width: 44, height: 44, backgroundColor: '#3b82f6', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
});

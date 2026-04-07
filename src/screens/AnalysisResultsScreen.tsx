import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AnalysisDataFormat, RootStackParamList } from '@/types/navigation';
import { saveWorkout } from '@/services/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  analysisData: AnalysisDataFormat;
}

const AnalysisResultsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { analysisData } = route.params as RouteParams;
  const savedRef = useRef(false);

  // Save workout to history when screen loads
  useEffect(() => {
    if (savedRef.current) return; // Prevent duplicate saves
    savedRef.current = true;

    const saveToHistory = async () => {
      try {
        const exerciseType = analysisData.exercise_type as 'pushup' | 'squat' | 'bicep_curl';
        await saveWorkout({
          exerciseType,
          repCount: analysisData.metrics.rep_count,
          formScore: analysisData.metrics.form_score,
          goodRepCount: analysisData.metrics.good_rep_count ?? 
            (analysisData.metrics.rep_count - analysisData.metrics.failed_reps),
          badRepCount: analysisData.metrics.bad_rep_count ?? analysisData.metrics.failed_reps,
          corrections: analysisData.corrections || [],
          repScores: analysisData.metrics.rep_scores || [],
        });
        console.log('[AnalysisResults] Workout saved to history');
      } catch (error) {
        console.error('[AnalysisResults] Failed to save workout:', error);
      }
    };

    saveToHistory();
  }, [analysisData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const handleNewAnalysis = () => {
    navigation.goBack();
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Results</Text>
          <Text style={styles.exerciseType}>
            {analysisData.exercise_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Form Score</Text>
          <View style={styles.scoreContainer}>
            <Text 
              style={[
                styles.scoreValue, 
                { color: getScoreColor(analysisData.metrics.form_score) }
              ]}
            >
              {analysisData.metrics.form_score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text 
            style={[
              styles.scoreGrade,
              { color: getScoreColor(analysisData.metrics.form_score) }
            ]}
          >
            {getScoreLabel(analysisData.metrics.form_score)}
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analysisData.metrics.rep_count}</Text>
            <Text style={styles.metricLabel}>Total Reps</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {analysisData.metrics.good_rep_count || (analysisData.metrics.rep_count - analysisData.metrics.failed_reps)}
            </Text>
            <Text style={styles.metricLabel}>Good Reps</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[
              styles.metricValue,
              { color: (analysisData.metrics.bad_rep_count ?? analysisData.metrics.failed_reps) > 0 ? '#F44336' : '#4CAF50' }
            ]}>
              {analysisData.metrics.bad_rep_count ?? analysisData.metrics.failed_reps}
            </Text>
            <Text style={styles.metricLabel}>Bad Reps</Text>
          </View>

          {analysisData.metrics.avg_depth_score !== undefined && (
            <View style={styles.metricCard}>
              <Text style={[
                styles.metricValue,
                { color: getScoreColor(analysisData.metrics.avg_depth_score) }
              ]}>
                {Math.round(analysisData.metrics.avg_depth_score)}%
              </Text>
              <Text style={styles.metricLabel}>Depth Score</Text>
            </View>
          )}

          {analysisData.metrics.avg_hip_score !== undefined && (
            <View style={styles.metricCard}>
              <Text style={[
                styles.metricValue,
                { color: getScoreColor(analysisData.metrics.avg_hip_score) }
              ]}>
                {Math.round(analysisData.metrics.avg_hip_score)}%
              </Text>
              <Text style={styles.metricLabel}>Posture Score</Text>
            </View>
          )}
        </View>

        {/* Rep-by-Rep Breakdown */}
        {analysisData.metrics.rep_scores && analysisData.metrics.rep_scores.length > 0 && (
          <View style={styles.repBreakdown}>
            <Text style={styles.sectionTitle}>Rep-by-Rep Scores</Text>
            <View style={styles.repScoresContainer}>
              {analysisData.metrics.rep_scores.map((score, index) => (
                <View key={index} style={styles.repScore}>
                  <Text style={styles.repNumber}>#{index + 1}</Text>
                  <Text 
                    style={[
                      styles.repScoreValue,
                      { color: getScoreColor(score) }
                    ]}
                  >
                    {score}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bad Reps Details */}
        {analysisData.metrics.bad_rep_numbers && analysisData.metrics.bad_rep_numbers.length > 0 && (
          <View style={styles.badRepsSection}>
            <Text style={styles.sectionTitle}>
              Reps Needing Improvement ({analysisData.metrics.bad_rep_numbers.length})
            </Text>
            <View style={styles.badRepsContainer}>
              {analysisData.metrics.bad_rep_numbers.map((repNumber, index) => (
                <View key={index} style={styles.badRepChip}>
                  <Text style={styles.badRepText}>Rep #{repNumber}</Text>
                  <Text style={styles.badRepScore}>
                    {analysisData.metrics.rep_scores[repNumber - 1]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.badRepsNote}>
              Review these specific reps to improve your overall form
            </Text>
          </View>
        )}

        {/* Corrections */}
        {analysisData.corrections && analysisData.corrections.length > 0 && (
          <View style={styles.correctionsSection}>
            <Text style={styles.sectionTitle}>Form Corrections</Text>
            {analysisData.corrections.map((correction, index) => (
              <View key={index} style={styles.correctionCard}>
                <View style={styles.correctionIcon}>
                  <Text style={styles.correctionIconText}>💡</Text>
                </View>
                <Text style={styles.correctionText}>{correction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Analysis Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Analysis Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Analysis ID:</Text>
            <Text style={styles.detailValue}>
              {analysisData.analysis_id.slice(0, 8)}...
            </Text>
          </View>
          {analysisData.video_info?.fps && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Video FPS:</Text>
              <Text style={styles.detailValue}>{analysisData.video_info.fps}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]} 
          onPress={handleViewHistory}
        >
          <Text style={styles.secondaryButtonText}>View History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]} 
          onPress={handleNewAnalysis}
        >
          <Text style={styles.primaryButtonText}>New Analysis</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  scoreCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#adb5bd',
    marginLeft: 4,
  },
  scoreGrade: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: '2%',
    marginLeft: '2%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  repBreakdown: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  repScoresContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  repScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  repNumber: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  repScoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badRepsSection: {
    margin: 20,
    marginTop: 0,
  },
  badRepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  badRepChip: {
    backgroundColor: '#FFE4E4',
    borderColor: '#F44336',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  badRepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
  },
  badRepScore: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  badRepsNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  correctionsSection: {
    margin: 20,
    marginTop: 0,
  },
  correctionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  correctionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff3cd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  correctionIconText: {
    fontSize: 18,
  },
  correctionText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
  },
  detailsSection: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  detailValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalysisResultsScreen;
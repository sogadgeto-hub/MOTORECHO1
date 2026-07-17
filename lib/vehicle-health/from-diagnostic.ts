import type { DiagnosticRecord } from '@/lib/analyzer';
import type { HealthAnalysisInput } from './types';

export function mapDiagnosticToHealthInput(record: DiagnosticRecord): HealthAnalysisInput {
  return {
    id: record.id,
    result: record.result,
    issue_type: record.issue_type,
    confidence: record.confidence,
    severity: record.severity,
    created_at: record.created_at,
  };
}

export function mapDiagnosticsToHealthInputs(records: DiagnosticRecord[]): HealthAnalysisInput[] {
  return records.map(mapDiagnosticToHealthInput);
}

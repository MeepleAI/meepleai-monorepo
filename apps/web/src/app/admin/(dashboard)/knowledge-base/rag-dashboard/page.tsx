/**
 * Admin RAG Dashboard Page
 * Issue #259 - Admin RAG Dashboard
 *
 * Route: /admin/knowledge-base/rag-dashboard
 * Shows pipeline stats, vector metrics, embedding status, and recent activity.
 */

import { RagDashboardNavConfig } from './NavConfig';
import { RagDashboard } from './RagDashboard';

export default function RagDashboardPage() {
  return (
    <div className="space-y-5" data-testid="rag-dashboard-page">
      <RagDashboardNavConfig />
      <div>
        <h1 className="font-quicksand text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          RAG Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Monitor RAG pipeline health, vector store metrics, and embedding service status.
        </p>
      </div>
      <RagDashboard />
    </div>
  );
}

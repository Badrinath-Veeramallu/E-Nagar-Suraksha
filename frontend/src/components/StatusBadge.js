import React from 'react';

const STATUS_STYLES = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    assigned: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    escalated: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    resolved: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    reopened: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const PRIORITY_STYLES = {
    urgent: { bg: 'bg-red-100', text: 'text-red-700' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    low: { bg: 'bg-green-100', text: 'text-green-700' },
};

const STATUS_LABELS = {
    draft: 'Draft', submitted: 'Submitted', pending_review: 'Pending Review',
    assigned: 'Assigned', in_progress: 'In Progress', escalated: 'Escalated',
    resolved: 'Resolved', reopened: 'Reopened', closed: 'Closed',
};

// Terminal statuses where priority/escalation labels should be hidden
const TERMINAL_STATUSES = ['resolved', 'closed'];

export const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return (
        <span className={`badge ${style.bg} ${style.text}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`} />
            {STATUS_LABELS[status] || status}
        </span>
    );
};

// Pass status prop to suppress this badge when complaint is resolved/closed
export const PriorityBadge = ({ priority, status }) => {
    // Don't show priority once complaint is resolved or closed — avoids "Urgent + Resolved" conflict
    if (TERMINAL_STATUSES.includes(status)) return null;
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
    const labels = { urgent: '🔴 Urgent', high: '🟠 High', medium: '🟡 Medium', low: '🟢 Low' };
    return <span className={`badge ${style.bg} ${style.text}`}>{labels[priority] || priority}</span>;
};

export const SlaBadge = ({ slaDueAt, status }) => {
    if (!slaDueAt || TERMINAL_STATUSES.includes(status)) return null;
    const now = new Date();
    const due = new Date(slaDueAt);
    const diff = due - now;
    const breached = diff < 0;
    const hours = Math.abs(Math.floor(diff / 3600000));
    const mins = Math.abs(Math.floor((diff % 3600000) / 60000));

    return (
        <span className={`badge ${breached ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {breached ? `⚠ Overdue ${hours}h ${mins}m` : `⏱ ${hours}h ${mins}m left`}
        </span>
    );
};

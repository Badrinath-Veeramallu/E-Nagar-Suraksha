/**
 * SLA hours configuration by category
 * Security: urgent (4h)
 * Road, Electrical, Water: high (24h)
 * Drainage, Streetlight, Garbage, Noise: medium (72h)
 * Sanitation, Other: low (168h = 7 days)
 */
const CATEGORY_PRIORITY = {
    security: 'urgent',
    road_issue: 'high',
    electrical: 'high',
    water_supply: 'high',
    drainage: 'medium',
    streetlight: 'medium',
    garbage: 'medium',
    noise: 'medium',
    sanitation: 'low',
    other: 'low',
};

const SLA_HOURS = {
    urgent: 4,
    high: 24,
    medium: 72,
    low: 168,
};

/**
 * Get priority for a given complaint category
 */
const getPriorityForCategory = (category) => {
    return CATEGORY_PRIORITY[category] || 'medium';
};

/**
 * Calculate SLA due date based on category
 */
const calculateSlaDueAt = (category) => {
    const priority = getPriorityForCategory(category);
    const hours = SLA_HOURS[priority];
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + hours);
    return { slaDueAt: dueAt, priority };
};

/**
 * Check if a complaint's SLA has been breached
 */
const isSlaBreached = (slaDueAt) => {
    if (!slaDueAt) return false;
    return new Date() > new Date(slaDueAt);
};

/**
 * Get time remaining until SLA breach (ms)
 */
const getSlaTimeRemaining = (slaDueAt) => {
    if (!slaDueAt) return null;
    return new Date(slaDueAt) - new Date();
};

module.exports = { calculateSlaDueAt, isSlaBreached, getSlaTimeRemaining, getPriorityForCategory, SLA_HOURS, CATEGORY_PRIORITY };

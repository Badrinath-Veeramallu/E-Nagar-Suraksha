import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const CITIZEN_LINKS = [
        { to: '/citizen/dashboard', label: t('sidebar.dashboard'), icon: '🏠' },
        { to: '/citizen/submit', label: t('sidebar.submitComplaint'), icon: '➕' },
        { to: '/citizen/complaints', label: t('sidebar.myComplaints'), icon: '📋' },
    ];

    const POLICE_LINKS = [
        { to: '/police/dashboard', label: t('sidebar.dashboard'), icon: '🏠' },
        { to: '/police/complaints', label: t('sidebar.complaints'), icon: '📋' },
        { to: '/police/manage', label: 'Manage Officers', icon: '👮' },
    ];

    const MUNICIPAL_LINKS = [
        { to: '/municipal/dashboard', label: t('sidebar.dashboard'), icon: '🏠' },
        { to: '/municipal/complaints', label: t('sidebar.complaints'), icon: '📋' },
        { to: '/municipal/manage', label: 'Manage Staff', icon: '🧑‍💼' },
    ];

    const ADMIN_LINKS = [
        { to: '/admin/dashboard', label: t('sidebar.dashboard'), icon: '🏠' },
        { to: '/admin/analytics', label: t('sidebar.analytics'), icon: '📊' },
        { to: '/admin/complaints', label: t('sidebar.allComplaints'), icon: '📋' },
        { to: '/admin/users', label: t('sidebar.users'), icon: '👥' },
        { to: '/admin/departments', label: t('sidebar.departments'), icon: '🏢' },
        { to: '/admin/audit-logs', label: t('sidebar.auditLogs'), icon: '🔍' },
    ];

    const LINKS_BY_ROLE = {
        citizen: CITIZEN_LINKS,
        police: POLICE_LINKS,
        municipal: MUNICIPAL_LINKS,
        admin: ADMIN_LINKS,
    };

    const links = LINKS_BY_ROLE[user?.role] || [];

    return (
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen hidden md:flex flex-col">
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">eN</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">e-Nagar Suraksha</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role} {t('sidebar.portal')}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {links.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <span className="text-base">{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

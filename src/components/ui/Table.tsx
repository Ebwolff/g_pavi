import React from 'react';

interface TableProps {
    children: React.ReactNode;
    className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
    return (
        <div className={`overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] ${className}`}>
            <table className="table-enterprise">
                {children}
            </table>
        </div>
    );
};

export const THead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <thead className={`table-header ${className}`}>
        {children}
    </thead>
);

export const TBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <tbody className={className}>
        {children}
    </tbody>
);

export const TR: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
    children,
    className = '',
    onClick
}) => (
    <tr
        className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        {children}
    </tr>
);

export const TH: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <th className={`px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ${className}`}>
        {children}
    </th>
);

export const TD: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({
    children,
    className = '',
    colSpan
}) => (
    <td
        className={`px-6 py-4 text-sm text-[var(--text-secondary)] border-b border-[var(--border-subtle)] ${className}`}
        colSpan={colSpan}
    >
        {children}
    </td>
);
